// controller.js
// User controller functions (replace with real DB logic later)
const { JsonWebTokenError } = require('jsonwebtoken');
const User = require('./model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Store your key in .env

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Example: Get all users
const getAllUsers = (req, res) => {
    res.json({ message: 'Get all users (implement DB logic here)' });
};

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user (not saved yet)
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role !== undefined ? role : 1, // default to 1 (normal user)
            isVerified: false,
            verificationToken,
            verificationTokenExpires,
        });

        // Save user to database
        await user.save();

        // Create verification link
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

        // Send verification email
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Verify Your MoodBites Account',
            text: `Please verify your account by clicking this link: ${verificationLink}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #F10100, #FFD122); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🍽️ MoodBites</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to the community!</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                            Hi ${name},<br><br>
                            Thank you for signing up for MoodBites! To complete your registration and start your journey with AI-powered, emotion-aware food recommendations, please verify your email address.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="
                                   display: inline-block;
                                   padding: 15px 30px;
                                   background: linear-gradient(135deg, #F10100, #FFD122);
                                   color: white;
                                   text-decoration: none;
                                   border-radius: 25px;
                                   font-weight: bold;
                                   font-size: 16px;
                                   box-shadow: 0 4px 15px rgba(241, 1, 0, 0.3);
                                   transition: all 0.3s ease;
                               "
                               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(241, 1, 0, 0.4)'"
                               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(241, 1, 0, 0.3)'"
                            >
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                            If the button doesn't work, you can copy and paste this link into your browser:
                        </p>
                        <p style="color: #F10100; word-break: break-all; font-size: 14px; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            ${verificationLink}
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        <p style="color: #999; font-size: 14px; margin: 0;">
                            This verification link will expire in 24 hours. If you didn't create an account with MoodBites, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            `,
        };

        await sgMail.send(msg);

        res.status(201).json({ 
            message: 'Registration successful! Please check your email to verify your account.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Verify email address
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with this verification token
        const user = await User.findOne({ 
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user as verified
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();

        // Generate JWT token for automatic login
        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Omit password from response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json({ 
            message: 'Email verified successfully! You can now log in to your account.',
            user: userResponse,
            token: jwtToken
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

// Login a user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(400).json({ 
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Omit password from response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json({ message: 'logged in', user: userResponse, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Forgot password - send reset email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email address' });
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = jwt.sign(
            { id: user._id, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Construct reset link (adjust frontend URL as needed)
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        // Send email
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL, // Must be a verified sender
            subject: 'Password Reset Request',
            text: `Click the link to reset your password: ${resetLink}`,
            html: `
    <p>Click the button below to reset your password:</p>
    <a href="${resetLink}" 
      style="
        display: inline-block;
        padding: 12px 28px;
        background: linear-gradient(90deg, #ff9800, #ff5722);
        color: #fff;
        font-weight: bold;
        border-radius: 6px;
        text-decoration: none;
        font-size: 16px;
        margin: 16px 0;
      "
      target="_blank"
    >Reset Password</a>
    <p>If you did not request this, you can ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
  `,
        };

        await sgMail.send(msg);

        res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
  try {
    // Extract token and new password from request body
    const { token, password } = req.body;
    // Check if token and password are provided
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    // Attempt to verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If token verification fails, return an error response
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    // Check if the decoded token contains a valid user ID and is of type 'password_reset'
    if (!decoded.id || decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid token.' });
    }
    // Find the user associated with the decoded token ID
    const user = await User.findById(decoded.id);
    // If the user is not found, return an error response
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Update the user's password with the hashed new password
    user.password = hashedPassword;
    await user.save();
    // Return a success response if the password reset is successful
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (error) {
    // Log any errors that occur during the password reset process
    console.error('Reset password error:', error);
    // Return a server error response if an error occurs
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // From JWT token

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user profile by ID
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find user by ID
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        // Find and update user
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Profile updated successfully',
            user: user
        });
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Google Sign-In
const googleSignIn = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user with Google data
            user = new User({
                name: name,
                email: email,
                googleId: googleId,
                isVerified: true, // Google users are pre-verified
                password: crypto.randomBytes(32).toString('hex'), // Generate random password for Google users
            });
            await user.save();
        } else {
            // Update existing user with Google ID if not present
            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true;
                await user.save();
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Omit password from response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            googleId: user.googleId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json({ 
            message: 'Google sign-in successful', 
            user: userResponse, 
            token 
        });

    } catch (error) {
        console.error('Google sign-in error:', error);
        res.status(500).json({ message: 'Server error during Google sign-in' });
  }
};

module.exports = {
    getAllUsers,
    registerUser,
    verifyEmail,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateUserProfile,
    changePassword,
    googleSignIn,
}; 