const LostFoundItem = require('../models/LostFoundItem');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2; // This is still needed for CREATING items

// @desc    Get all lost and found items
// @route   GET /api/lnf
// @access  Public
const getItems = async (req, res) => {
    try {
        const items = await LostFoundItem.find({ status: 'open' }) // Only show 'open' items
            .populate('user', 'name studentId') // Get the item's owner and their name/ID
            .sort({ date: -1 }); // Show newest items first

        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new lost or found item
// @route   POST /api/lnf
// @access  Private
const createItem = async (req, res) => {
    try {
        const { itemType, itemName, description, location, date, image, contact, storageLocation } = req.body;

        // Create new item
        const item = new LostFoundItem({
            user: req.user.id, // req.user.id comes from 'protect' middleware
            itemType,
            itemName,
            description,
            location,
            date,
            image, // This is the image URL from the form
            contact,
            storageLocation,
            status: 'open' // Set status to 'open' by default
        });

        const createdItem = await item.save();
        res.status(201).json({ success: true, item: createdItem });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get items for the logged-in user
// @route   GET /api/lnf/myitems
// @access  Private
const getMyItems = async (req, res) => {
    try {
        const items = await LostFoundItem.find({ user: req.user.id })
            .sort({ date: -1 });
        
        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update item status (e.g., to 'claimed')
// @route   PUT /api/lnf/:id/status
// @access  Private
const updateItemStatus = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Make sure the logged-in user is the one who posted the item
        if (item.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        item.status = req.body.status || 'claimed';
        await item.save();

        res.status(200).json({ success: true, item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Search for lost or found items
// @route   GET /api/lnf/search
// @access  Public
const searchItems = async (req, res) => {
  try {
    const query = req.query.q; 

    if (!query) {
      return res.status(400).json({ success: false, message: 'Please enter a search term' });
    }

    // Find items using the text index
    const items = await LostFoundItem.find({
      $text: { $search: query },
      status: 'open' // Only search for 'open' items
    }).populate('user', 'name studentId');
    
    res.status(200).json({ success: true, items: items });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// --- EXPORT ALL FUNCTIONS ---
module.exports = {
    getItems,
    createItem,
    getMyItems,
    updateItemStatus,
    searchItems
    // visualSearch has been removed
};