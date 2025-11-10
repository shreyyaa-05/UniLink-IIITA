const express = require('express');
const router = express.Router();
const {
    getVehicles,
    getMyVehicles,
    updateVehicleStatus,
    createVehicle
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

// Get all available vehicles
router.route('/')
    .get(getVehicles)
    .post(protect, createVehicle);;

// Get vehicles for the logged-in user (for their profile)
router.route('/myvehicles').get(protect, getMyVehicles);
router.route('/:id/status').patch(protect, updateVehicleStatus);

module.exports = router;