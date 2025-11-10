// controllers/bloodController.js
const BloodRequest = require('../models/BloodRequest');

// @desc    Create a new blood request
// @route   POST /api/blood-requests
// @access  Private
exports.createBloodRequest = async (req, res) => {
    try {
        const { patientName, bloodGroup, location, contactPhone, note } = req.body;

        const request = new BloodRequest({
            user: req.user.id,
            patientName,
            bloodGroup,
            location,
            contactPhone,
            note
        });

        const newRequest = await request.save();
        await newRequest.populate('user', 'name'); // Populate user's name

        res.status(201).json(newRequest);

    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages[0] });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all active blood requests
// @route   GET /api/blood-requests/active
// @access  Private
exports.getActiveRequests = async (req, res) => {
    try {
        const requests = await BloodRequest.find({ status: 'active' })
            .populate('user', '_id name department') // Get the poster's info
            .sort({ createdAt: -1 }); // Show newest requests first

        res.json(requests);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Close your own blood request
// @route   PUT /api/blood-requests/:id/close
// @access  Private
exports.closeBloodRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Check if the logged-in user is the one who posted the request
        if (request.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        request.status = 'closed';
        await request.save();

        res.json({ message: 'Request closed successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};