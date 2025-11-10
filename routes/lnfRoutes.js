const express = require('express');
const router = express.Router();
const upload = require('../config/multer.js');

const { 
    getItems, 
    createItem, 
    getMyItems, 
    updateItemStatus, 
    searchItems,
    visualSearch
} = require('../controllers/lnfController');
const { protect } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
// (Anyone can access these)

// GET /api/lnf - Get all 'open' items
// GET /api/lnf/search - Search for items
router.route('/').get(getItems);
router.route('/search').get(searchItems);


// --- PRIVATE ROUTES ---
// (User must be logged in to access these)

// POST /api/lnf - Create a new item
router.route('/').post(protect, createItem);

// GET /api/lnf/myitems - Get the user's own items
router.route('/myitems').get(protect, getMyItems);

// PUT /api/lnf/:id/status - Update an item's status
router.route('/:id/status').put(protect, updateItemStatus);



module.exports = router;