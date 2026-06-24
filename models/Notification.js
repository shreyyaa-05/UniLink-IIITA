// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['blood_request', 'request_accepted', 'request_declined', 'escalation', 'info'],
        default: 'info'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest',
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Clean up notifications after 30 days
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
