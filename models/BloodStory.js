// models/BloodStory.js
const mongoose = require('mongoose');

const bloodStorySchema = new mongoose.Schema({
    story: {
        type: String,
        required: [true, 'Story content is required'],
        maxlength: [1000, 'Story content must be less than 1000 characters']
    },
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BloodStory', bloodStorySchema);
