// models/BloodRequest.js
const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required']
    },
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    location: {
        type: String,
        required: [true, 'Location (e.g., hospital) is required']
    },
    contactPhone: {
        type: String,
        required: [true, 'Contact phone is required']
    },
    note: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d' // Automatically delete requests after 7 days
    }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);