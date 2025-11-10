// controllers/userController.js
const User = require('../models/User');
const Ride = require('../models/Ride');
const Rental = require('../models/Rental');
const Blood = require('../models/Blood');

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
exports.getMyProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('friends', 'name department'); 

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PATCH /api/users/me
// @access  Private
exports.updateMyProfile = async (req, res) => {
    try {
        const {
            name, bio, department, year, bloodGroup, 
            notificationSettings, preferredLanguage
        } = req.body;

        const fieldsToUpdate = {};
        
        // Build the $set object with only the fields that were provided
        if (name !== undefined) fieldsToUpdate.name = name;
        if (bio !== undefined) fieldsToUpdate.bio = bio;
        if (department !== undefined) fieldsToUpdate.department = department;
        if (year !== undefined) fieldsToUpdate.year = year;
        if (bloodGroup !== undefined) fieldsToUpdate.bloodGroup = bloodGroup;
        if (notificationSettings !== undefined) fieldsToUpdate.notificationSettings = notificationSettings;
        if (preferredLanguage !== undefined) fieldsToUpdate.preferredLanguage = preferredLanguage;

        // Use $set for fields and $push for history in one query
        const updateQuery = {
            $set: fieldsToUpdate,
            $push: {
                history: {
                    action: 'updated_profile',
                    timestamp: new Date(),
                },
            },
        };

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateQuery,
            { new: true, runValidators: true } // 'new: true' returns the updated doc
        ).populate('friends', 'name department');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });

    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};

// @desc    Get all users who are potential donors
// @route   GET /api/users/donors
// @access  Private
exports.getDonors = async (req, res) => {
    try {
        // Find all users who have set a blood group
        const donors = await User.find({ 
            bloodGroup: { $ne: null } 
        })
        // Only select the fields that are safe to show publicly
        .select('name studentId department year bloodGroup'); 

        res.json(donors);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current user's friends
// @route   GET /api/users/me/friends
// @access  Private// Add this new function to your userController.js
// This is the new "debug" version of searchUsers
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q || '';
        console.log(`\n--- New Friend Search ---`);
        console.log(`[DEBUG] 1. Search Query: "${query}"`);

        if (!query) {
            console.log(`[DEBUG] 2. Query is empty. Returning [].`);
            return res.json({ success: true, users: [] });
        }

        const loggedInUser = await User.findById(req.user.id).select('friends');
        console.log(`[DEBUG] 2. Logged in user: "${loggedInUser.name || loggedInUser.studentId}"`);

        const excludeIds = [
            loggedInUser._id, 
            ...loggedInUser.friends 
        ];
        console.log(`[DEBUG] 3. Exclude IDs (self + friends):`, excludeIds.map(id => id.toString()));

        // The query to MongoDB
        const mongoQuery = {
            _id: { $nin: excludeIds },
            $or: [
                { name: { $regex: query, $options: 'i' } }, 
                { studentId: { $regex: query, $options: 'i' } }
            ]
        };
        console.log(`[DEBUG] 4. Sending MongoDB Query:`, JSON.stringify(mongoQuery));
        
        const users = await User.find(mongoQuery).select('name studentId department year');
        
        console.log(`[DEBUG] 5. Users Found (raw):`, users);
        
        res.status(200).json({ success: true, users });

    } catch (err) {
        console.error('Search Users Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getMyFriends = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('friends', 'name department'); // Uses the 'friends' field

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json(user.friends); // Send *only* the friends array
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add a friend
// @route   POST /api/users/me/friends/:friendId
// @access  Private
exports.addFriend = async (req, res, next) => {
    try {
        const friendId = req.params.friendId;

        if (req.user.id === friendId) {
            return res.status(400).json({ success: false, message: "You can't add yourself as a friend." });
        }

        // Add friend to current user's list
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { friends: friendId } // $addToSet prevents duplicates
        });
        
        // Add current user to friend's list
        await User.findByIdAndUpdate(friendId, {
            $addToSet: { friends: req.user.id }
        });

        res.status(200).json({ success: true, message: 'Friend added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Remove a friend
// @route   DELETE /api/users/me/friends/:friendId
// @access  Private
exports.removeFriend = async (req, res, next) => {
    try {
        const friendId = req.params.friendId;

        // Pull (remove) the friendId from the current user's 'friends' array
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { friends: friendId }
        });
        
        // Also remove the current user from the *other* person's list
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.user.id }
        });

        res.status(200).json({ success: true, message: 'Friend removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get current user's history
// @route   GET /api/users/me/history
// @access  Private
exports.getMyHistory = async (req, res, next) => {
    try {
        // 1. Find all documents in each collection
        const rideHistory = await Ride.find({ user: req.user.id });
        const rentalHistory = await Rental.find({ user: req.user.id });
        const bloodHistory = await Blood.find({ user: req.user.id });

        // 2. Combine all three arrays
        const allHistory = [...rideHistory, ...rentalHistory, ...bloodHistory];

        // 3. Sort the combined history by date, newest first
        allHistory.sort((a, b) => b.at - a.at);

        // 4. Send the personalized, combined history
        res.status(200).json(allHistory);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Seed sample data for testing
// @route   POST /api/users/me/seed-sample
// @access  Private
exports.seedMySample = async (req, res, next) => {
    try {
        const sampleHistory = [
            { action: 'joined_community', timestamp: new Date(Date.now() - 86400000) }, // 1 day ago
            { action: 'created_post', timestamp: new Date() }
        ];

        await User.findByIdAndUpdate(req.user.id, {
            $push: { history: { $each: sampleHistory } }
        });

        res.status(200).json({ success: true, message: 'Sample data seeded to your history' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};