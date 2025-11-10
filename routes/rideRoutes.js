// UniLink/routes/rideRoutes.js

const express = require('express');
const router = express.Router();
const { createRideOffer,getRides,createRideRequest,getRideRequests } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware'); // Import your existing 'protect' middleware

// Defines the POST endpoint for creating a ride offer
router.post('/', protect, createRideOffer);
router.get('/', protect, getRides);

// Defines the GET endpoint for fetching all available rides
router.get('/', protect, getRides);
router.get('/requests', protect, getRideRequests);

module.exports = router;