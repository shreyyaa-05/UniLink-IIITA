const mongoose = require('mongoose');

const LostFoundItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemType: {
        type: String, // 'lost' or 'found'
        enum: ['lost', 'found'],
        required: true
    },
    itemName: {
        type: String,
        required: [true, 'Please provide an item name'],
        trim: true
    },
    category: {
        type: String,
        enum: ['electronics', 'jewelry', 'documents', 'clothing', 'bags', 'keys', 'other'],
        required: false
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Please provide the location'],
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    image: {
        type: String, // For now, we can store a URL to an image
        default: 'https://via.placeholder.com/150'
    },
    contact: {
        type: String,
        trim: true
    },
    storageLocation: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['open', 'claimed'],
        default: 'open'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LostFoundItem', LostFoundItemSchema);