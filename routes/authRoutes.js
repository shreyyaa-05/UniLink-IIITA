const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { 
    register, 
    login, 
    forgotPassword, 
    resetPassword, 
    changePassword,
    logoutAllDevices
} = require('../controllers/authController');

// --- THIS IS THE FIX ---
// You were missing the import for your 'protect' middleware
const { protect } = require('../middleware/authMiddleware');
// -----------------------

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', register);
router.post('/logoutall', protect, logoutAllDevices);

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post('/login', [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').notEmpty(),
], login);

// @route   POST /api/auth/forgotpassword
// @desc    Forgot password
router.post('/forgotpassword', forgotPassword);

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Reset password
router.put('/resetpassword/:resettoken', resetPassword);

// @route   PUT /api/auth/changepassword
// @desc    Change user password (while logged in)
// @access  Private
router.put('/changepassword', protect, changePassword); // This line now works

module.exports = router;