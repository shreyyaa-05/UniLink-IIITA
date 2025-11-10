// UniLink/models/Ride.js

const mongoose = require('mongoose');

const rideSchema = mongoose.Schema(
    {
        user: {
            // Links the ride offer to the user who posted it (via the 'protect' middleware)
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Assumes your User model is named 'User'
        },
        startLocation: {
            type: String,
            required: [true, 'Please add a start location (From)'],
        },
        endLocation: {
            type: String,
            required: [true, 'Please add an end location (To)'],
        },
        vehicleType: {
            type: String,
            enum: ['car', 'bike', 'auto', 'other'], // Options from your form
            required: [true, 'Please specify the vehicle type'],
        },
        costPerPerson: {
            type: Number,
            required: [true, 'Please add the cost per person'],
        },
        seatsAvailable: {
            type: Number,
            required: [true, 'Please specify available seats'],
            min: [1, 'Must have at least 1 seat available'],
        },
        departureTime: {
            // A combined Date object for easy sorting/filtering
            type: Date,
            required: [true, 'Please specify the date and time of departure'],
        },
        details: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

module.exports = mongoose.model('Ride', rideSchema);