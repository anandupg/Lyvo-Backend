const express = require('express');
const router = express.Router();
const { getAllUsers, registerUser, verifyEmail, loginUser, forgotPassword, resetPassword, getUserProfile, updateUserProfile, changePassword, googleSignIn } = require('./controller');
const verifyJWT = require('./middleware');

// Public routes
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/google-signin', googleSignIn);
router.post('/user/forgot-password', forgotPassword);
router.post('/user/reset-password', resetPassword);
router.get('/user/verify-email/:token', verifyEmail);

// Protected routes
router.get('/user/users', verifyJWT, getAllUsers);
router.get('/user/profile/:userId', verifyJWT, getUserProfile);
router.put('/user/profile/:userId', verifyJWT, updateUserProfile);
router.post('/user/change-password', verifyJWT, changePassword);

module.exports = router;