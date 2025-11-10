const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');

// This will be a POST request to /api/chat
router.post('/', handleChat);

module.exports = router;