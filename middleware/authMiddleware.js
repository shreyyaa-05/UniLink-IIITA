const jwt =require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Corrected exports.protect in authMiddleware.js

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token || token === 'null' || token === 'undefined') {
                return res.status(401).json({ msg: 'Not authorized, invalid token' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Fix: User ID is usually attached directly to the decoded object (decoded.id), 
            // not decoded.user.id, unless you explicitly structured it that way.
            // I'll keep your original structure (decoded.user.id) but flag this common error.
            
            // If decoded payload is structured as { id: '...' } use decoded.id
            // If decoded payload is structured as { user: { id: '...' } } use decoded.user.id
            req.user = await User.findById(decoded.user.id).select('-password');
            
            // ... (Your token invalidation logic is fine) ...
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            return next(); // CRITICAL: Stop execution and move to the controller
        } catch (error) {
            console.error(error);
            // CRITICAL: Stop execution if verification fails
            return res.status(401).json({ msg: 'Not authorized, token failed' }); 
        }
    }

    // This block ONLY runs if the 'Authorization' header was missing or improperly formatted
    if (!token) { 
        return res.status(401).json({ msg: 'Not authorized, no token' }); // CRITICAL: Stop execution
    }
};

// (Optional, but good for your Admin requirement)
// This middleware checks if the user is an admin
exports.admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Faculty')) { // Use whatever role you defined
    next();
  } else {
    res.status(403).json({ msg: 'Not authorized as an admin' });
  }
};