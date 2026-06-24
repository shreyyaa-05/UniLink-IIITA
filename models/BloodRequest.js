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
        enum: ['active', 'matched', 'accepted', 'completed', 'closed'],
        default: 'active'
    },
    urgency: {
        type: String,
        enum: ['normal', 'urgent', 'critical'],
        default: 'normal'
    },
    assignedDonor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    donorAcceptanceStatus: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'declined'],
        default: 'none'
    },
    escalated: {
        type: Boolean,
        default: false
    },
    escalatedAt: {
        type: Date,
        default: null
    },
    auditLogs: [{
        action: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d' // Automatically delete requests after 7 days
    }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);