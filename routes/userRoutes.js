const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getMyFriends, addFriend, removeFriend, getMyHistory, seedMySample,getDonors,searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/users/me
// @desc    Get current user's profile
router.get('/me', protect, getMyProfile);

// @route   PUT /api/users/me
// @desc    Update current user's profile
router.patch('/me', protect, updateMyProfile)
router.get('/donors', protect, userController.getDonors);

// Friends
router.get('/me/friends', protect, getMyFriends);
router.post('/me/friends/:friendId', protect, addFriend);
router.delete('/me/friends/:friendId', protect, removeFriend);
router.get('/search', protect, searchUsers);

// History
router.get('/me/history', protect, getMyHistory);

// One-time per-user seeding endpoint
router.post('/me/seed-sample', protect, seedMySample);

module.exports = router;