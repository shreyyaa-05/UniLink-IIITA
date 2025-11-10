// routes/bloodRoutes.js
const express = require('express');
const router = express.Router();
const {
    createBloodRequest,
    getActiveRequests,
    closeBloodRequest
} = require('../controllers/bloodController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createBloodRequest);

router.route('/active')
    .get(protect, getActiveRequests);

router.route('/:id/close')
    .put(protect, closeBloodRequest);

module.exports = router;