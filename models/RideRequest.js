// UniLink/models/RideRequest.js

const mongoose = require('mongoose');

const rideRequestSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        startLocation: {
            type: String,
            required: [true, 'Please add a start location'],
        },
        endLocation: {
            type: String,
            required: [true, 'Please add an end location'],
        },
        preferredDepartureTime: {
            type: Date,
            required: [true, 'Please specify the preferred date and time'],
        },
        vehicleType: {
            type: String,
            enum: ['any', 'car', 'bike', 'auto'],
            default: 'any',
        },
        approximateFare: {
            type: Number,
            required: [true, 'Please add your approximate budget'],
        },
        passengers: {
            type: Number,
            required: [true, 'Please specify number of passengers'],
            min: [1, 'Must have at least 1 passenger'],
        },
        preferences: {
            type: String,
            required: false,
        },
        contact: {
            type: String,
            required: [true, 'Please add a contact email'],
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('RideRequest', rideRequestSchema);