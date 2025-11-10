// UniLink/controllers/rideController.js

const asyncHandler = require('express-async-handler');
const Ride = require('../models/Ride'); // Import the new Ride model
const RideRequest = require('../models/RideRequest');

// @desc    Create a new Ride Offer
// @route   POST /api/rides
// @access  Private (uses the 'protect' middleware)
const createRideOffer = asyncHandler(async (req, res) => {
    // 1. Validate required fields (using the new schema structure)
    const { startLocation, endLocation, vehicleType, costPerPerson, seatsAvailable, departureTime, details } = req.body;

    if (!startLocation || !endLocation || !vehicleType || !costPerPerson || !seatsAvailable || !departureTime) {
        res.status(400);
        throw new Error('Please include all required fields: start/end location, vehicle type, cost, seats, and time.');
    }

    // 2. Create the ride offer
    const ride = await Ride.create({
        user: req.user.id, // CRITICAL: The ID comes from the 'protect' middleware
        startLocation,
        endLocation,
        vehicleType,
        costPerPerson,
        seatsAvailable,
        departureTime,
        details,
    });

    if (ride) {
        res.status(201).json({
            message: 'Ride offer posted successfully',
            data: ride,
        });
    } else {
        res.status(400);
        throw new Error('Invalid ride data received.');
    }
});

const createRideRequest = asyncHandler(async (req, res) => {
    const { startLocation, endLocation, preferredDepartureTime, vehicleType, approximateFare, passengers, preferences, contact } = req.body;

    if (!startLocation || !endLocation || !preferredDepartureTime || !approximateFare || !passengers || !contact) {
        res.status(400);
        throw new Error('Please include all required fields for your request.');
    }

    const request = await RideRequest.create({
        user: req.user.id,
        startLocation,
        endLocation,
        preferredDepartureTime,
        vehicleType,
        approximateFare,
        passengers,
        preferences,
        contact,
    });

    if (request) {
        res.status(201).json({
            success: true,
            message: 'Ride request posted successfully',
            data: request,
        });
    } else {
        res.status(400);
        throw new Error('Invalid ride request data.');
    }
});

// @desc    Get all ride requests
// @route   GET /api/rides/requests
// @access  Private
// 3. ADD THIS NEW FUNCTION
const getRideRequests = asyncHandler(async (req, res) => {
    const requests = await RideRequest.find({})
        .populate('user', 'name studentId')
        .sort({ preferredDepartureTime: 1 }); // Show upcoming requests first

    res.status(200).json({
        success: true,
        count: requests.length,
        data: requests
    });
});
// @desc    Get all ride offers
// @route   GET /api/rides
// @access  Private (all logged-in users can see)
// @desc    Get all ride offers (NOW WITH FILTERING)
// @route   GET /api/rides
// @access  Private (all logged-in users can see)
const getRides = asyncHandler(async (req, res) => {
    
    // 1. Get filter parameters from the query string (e.g., /api/rides?vehicleType=car)
    const { startLocation, endLocation, date, vehicleType } = req.query;

    // 2. Build a dynamic filter object for Mongoose
    const filterQuery = {};

    // Add filters to the object ONLY if they were provided
    if (startLocation) {
        // Use regex for a partial, case-insensitive search
        filterQuery.startLocation = { $regex: startLocation, $options: 'i' };
    }

    if (endLocation) {
        // Use regex for a partial, case-insensitive search
        filterQuery.endLocation = { $regex: endLocation, $options: 'i' };
    }

    // THIS IS THE PART THAT FIXES YOUR "CAR" FILTER
    // If vehicleType is "car", this adds { vehicleType: 'car' } to the filter
    // If vehicleType is "" (Any Vehicle), this 'if' is false and the filter is skipped
    if (vehicleType) { 
        filterQuery.vehicleType = vehicleType;
    }

    if (date) {
        // Find all rides on that entire day, not just at midnight
        const startDate = new Date(date); 
        startDate.setHours(0, 0, 0, 0); // 00:00:00.000

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999); // 23:59:59.999
        
        filterQuery.departureTime = {
            $gte: startDate,
            $lte: endDate 
        };
    }
    
    // 3. Use the filterQuery object in the Ride.find() method
    // If filterQuery is empty {}, it will find all documents
    // If filterQuery is { vehicleType: 'car' }, it will find only car rides
    const rides = await Ride.find(filterQuery) 
        .populate('user', 'name studentId') 
        .sort({ departureTime: 1 }); 

    res.status(200).json({
        success: true,
        count: rides.length,
        data: rides
    });
});

// You'll add getRides, getRideById, etc. here later.

module.exports = {
    createRideOffer,
    getRides,
    createRideRequest,
    getRideRequests
    // Add other functions here later (e.g., getRides)
};