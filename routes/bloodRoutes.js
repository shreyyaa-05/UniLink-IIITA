// routes/bloodRoutes.js
const express = require('express');
const router = express.Router();
const {
    createBloodRequest,
    getActiveRequests,
    closeBloodRequest,
    getBloodStats,
    sendDonorVerificationOtp,
    verifyDonorOtp,
    getRankedDonorsForRequest,
    requestDonor,
    acceptRequest,
    declineRequest,
    completeRequest,
    escalateRequest,
    checkAndEscalateRequests,
    getStories,
    createStory,
    getNotifications,
    markNotificationRead
} = require('../controllers/bloodController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createBloodRequest);

router.route('/active')
    .get(protect, getActiveRequests);

router.route('/stats')
    .get(protect, getBloodStats);

router.route('/verify-donor-email')
    .post(protect, sendDonorVerificationOtp);

router.route('/verify-donor-otp')
    .post(protect, verifyDonorOtp);

router.route('/check-escalations')
    .post(protect, checkAndEscalateRequests);

router.route('/stories')
    .get(protect, getStories)
    .post(protect, createStory);

router.route('/notifications')
    .get(protect, getNotifications);

router.route('/notifications/:notifId/read')
    .put(protect, markNotificationRead);

router.route('/:id/close')
    .put(protect, closeBloodRequest);

router.route('/:id/matches')
    .get(protect, getRankedDonorsForRequest);

router.route('/:id/request-donor/:donorId')
    .post(protect, requestDonor);

router.route('/:id/accept')
    .post(protect, acceptRequest);

router.route('/:id/decline')
    .post(protect, declineRequest);

router.route('/:id/complete')
    .post(protect, completeRequest);

router.route('/:id/escalate')
    .post(protect, escalateRequest);

module.exports = router;