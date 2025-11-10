const mongoose = require('mongoose');

const BloodSchema = new mongoose.Schema({
    user: { // The person who donated or requested
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { // e.g., "Blood Donation"
        type: String,
        required: true
    },
    status: { // e.g., "Donated" or "Received"
        type: String,
        required: true
    },
    note: String,
    at: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        default: 'blood'
    }
});

module.exports = mongoose.model('Blood', BloodSchema);