// UniLink/routes/rideRoutes.js

const express = require('express');
const router = express.Router();
const { 
    createRideOffer,
    getRides,
    createRideRequest,
    getRideRequests,
    deleteRideOffer,
    deleteRideRequest 
} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware'); // Import your existing 'protect' middleware

// Ride Offers
router.route('/')
    .post(protect, createRideOffer)
    .get(protect, getRides);

router.route('/:id')
    .delete(protect, deleteRideOffer);

// Ride Requests
router.route('/requests')
    .post(protect, createRideRequest)
    .get(protect, getRideRequests);

router.route('/requests/:id')
    .delete(protect, deleteRideRequest);

module.exports = router;