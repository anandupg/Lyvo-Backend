const express = require('express');
const router = express.Router();
const { getAllUsers, registerUser, verifyEmail, loginUser, forgotPassword, resetPassword, getUserProfile, updateUserProfile, changePassword, googleSignIn, uploadProfilePicture, upload, saveBehaviourAnswers, getBehaviourQuestions, getBehaviourStatus, uploadKycDocuments, adminReviewKyc, toggleUserStatus, checkEmailExists, resendVerificationEmail, getAadharStatus, requireAadharApproval, createAdmin } = require('./controller');
const verifyJWT = require('./middleware');

// Public routes
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/google-signin', googleSignIn);
router.post('/user/forgot-password', forgotPassword);
router.post('/user/reset-password', resetPassword);
router.get('/user/verify-email/:token', verifyEmail);
router.get('/user/check-email', checkEmailExists);
router.post('/user/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/user/users', verifyJWT, getAllUsers);
router.get('/user/all', verifyJWT, getAllUsers); // Alias for getAllUsers
router.get('/user/profile/:userId', verifyJWT, getUserProfile);
router.put('/user/profile/:userId', verifyJWT, updateUserProfile);

// Public routes for service-to-service communication
router.get('/public/user/:userId', getUserProfile);
router.post('/user/change-password', verifyJWT, changePassword);
router.post('/user/upload-profile-picture', verifyJWT, upload.single('profilePicture'), uploadProfilePicture);
// KYC endpoints (accept front and back images)
router.post('/user/upload-kyc', verifyJWT, upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]), uploadKycDocuments);
router.post('/admin/kyc/review', verifyJWT, adminReviewKyc);

// Aadhar verification endpoints
router.get('/user/aadhar-status', verifyJWT, getAadharStatus);
// Admin user management
router.patch('/admin/user/:userId/toggle-status', verifyJWT, toggleUserStatus);
router.patch('/user/:userId/status', verifyJWT, toggleUserStatus); // Alias for toggling user status
router.post('/admin/create-admin', verifyJWT, createAdmin); // Create new admin
// Behaviour onboarding
router.get('/behaviour/questions', verifyJWT, getBehaviourQuestions);
router.post('/behaviour/answers', verifyJWT, saveBehaviourAnswers);
router.get('/behaviour/status', verifyJWT, getBehaviourStatus);

// Test authentication endpoint
router.get('/user/test-auth', verifyJWT, (req, res) => {
    res.json({ 
        message: 'Authentication successful', 
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;