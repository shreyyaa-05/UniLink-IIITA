const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    // Link to the user who posted this (the owner)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        required: true, // e.g., "Yamaha MT-15"
    },
    vehicleType: {
        type: String,
        required: true,
        enum: ['Bike', 'Scooty', 'Car', 'Cycle'], // From your tabs/types
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'rented'],
        default: 'available', // From the "Available" badge
    },
    price: {
        type: Number,
        required: true, // e.g., 300
    },
    rate: {
        type: String,
        required: true,
        enum: ['day', 'week', 'month'], // e.g., "per day", "per week"
        default: 'day',
    },
    // From the specs: "155cc", "40 kmpl", "ABS"
    specs: {
        type: [String], 
        default: [],
    },
    // We can add a placeholder image URL for now
    image: {
        type: String,
        required: false,
        default: '/images/vehicle_placeholder.png', // A default image
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;