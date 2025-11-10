const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { // e.g., "Scooter Rental"
        type: String,
        required: true
    },
    note: String,
    amount: Number,
    at: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        default: 'rentals'
    }
});

module.exports = mongoose.model('Rental', RentalSchema);