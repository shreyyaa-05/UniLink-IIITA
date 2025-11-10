const Vehicle = require('../models/Vehicle');
const User = require('../models/User'); // We might need this later

// @desc    Get all available vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'available' })
            .populate('user', 'name year department studentId') // Get owner's details
            .sort({ createdAt: -1 }); // Show newest first

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get vehicles posted by the logged-in user
// @route   GET /api/vehicles/myvehicles
// @access  Private
const getMyVehicles = async (req, res) => {
    try {
        // We find all, regardless of 'available' or 'rented' status
        const vehicles = await Vehicle.find({ user: req.user.id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }

};
const updateVehicleStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'available' or 'rented'
        if (!['available', 'rented'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // !! IMPORTANT SECURITY CHECK !!
        // Check if the logged-in user is the one who posted the vehicle
        if (vehicle.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Update the status
        vehicle.status = status;
        await vehicle.save();

        res.json(vehicle); // Send back the updated vehicle

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    List a new vehicle for rent
// @route   POST /api/vehicles
// @access  Private (Requires authentication via `protect` middleware)
// vehicleController.js

// ... existing imports ...

// ... existing getVehicles, getMyVehicles, updateVehicleStatus functions ...


// @desc    List a new vehicle for rent
// @route   POST /api/vehicles
// @access  Private (Requires authentication)
const createVehicle = async (req, res) => {
    try {
        const { title, vehicleType, price, rate, description, specs, image } = req.body;

        // --- 1. CONTROLLER VALIDATION (Missing basic required fields) ---
        if (!title || !vehicleType || !price || !rate || !specs) {
            // Send back a clear message for the frontend to display
            return res.status(400).json({ message: 'Validation Error: Please fill all required fields (Title, Type, Price, Rate, and Specs).' });
        }
        
        // Ensure price is a number before saving
        if (isNaN(price)) {
             return res.status(400).json({ message: 'Validation Error: Price must be a valid number.' });
        }
        
        // Check for missing user ID (Authentication failure)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication Error: You must be logged in to post a vehicle.' });
        }


        // --- 2. DATABASE CREATION ---
        const vehicle = await Vehicle.create({
            user: req.user.id, // CRITICAL: This is where the user ID is assigned
            title,
            vehicleType,
            price,
            rate,
            description,
            // specs is sent as an array from carrental.js
            specs: specs,
            image,
        });

        // Respond with success
        res.status(201).json({
            message: 'Vehicle listed successfully!',
            vehicle,
        });

    } catch (error) {
        console.error('Error in createVehicle:', error);
        
        // --- 3. Mongoose Validation Error (e.g., Enum failure, missing required field) ---
        if (error.name === 'ValidationError') {
            // Extract the first error message from Mongoose
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({ message: `Mongoose Validation Error: ${firstError}` });
        }

        res.status(500).json({ message: 'Server Error during vehicle creation. Check server logs.' });
    }
};





module.exports = {
    getVehicles,
    getMyVehicles,
    updateVehicleStatus,
    createVehicle
};