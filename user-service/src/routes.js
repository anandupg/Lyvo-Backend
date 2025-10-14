const express = require('express');
const router = express.Router();
const { getAllUsers, registerUser, verifyEmail, loginUser, forgotPassword, resetPassword, getUserProfile, updateUserProfile, changePassword, googleSignIn, uploadProfilePicture, upload, saveBehaviourAnswers, getBehaviourQuestions, getBehaviourStatus, uploadKycDocuments, adminReviewKyc, toggleUserStatus, checkEmailExists } = require('./controller');
const verifyJWT = require('./middleware');

// Public routes
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/google-signin', googleSignIn);
router.post('/user/forgot-password', forgotPassword);
router.post('/user/reset-password', resetPassword);
router.get('/user/verify-email/:token', verifyEmail);
router.get('/user/check-email', checkEmailExists);

// Protected routes
router.get('/user/users', verifyJWT, getAllUsers);
router.get('/user/profile/:userId', verifyJWT, getUserProfile);
router.put('/user/profile/:userId', verifyJWT, updateUserProfile);

// Public routes for service-to-service communication
router.get('/public/user/:userId', getUserProfile);
router.post('/user/change-password', verifyJWT, changePassword);
router.post('/user/upload-profile-picture', verifyJWT, upload.single('profilePicture'), uploadProfilePicture);
// KYC endpoints (accept one image at a time under field 'image', but remain compatible with 'front'/'back')
router.post('/user/kyc/upload', verifyJWT, upload.any(), uploadKycDocuments);
router.post('/admin/kyc/review', verifyJWT, adminReviewKyc);
// Admin user management
router.patch('/admin/user/:userId/toggle-status', verifyJWT, toggleUserStatus);
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