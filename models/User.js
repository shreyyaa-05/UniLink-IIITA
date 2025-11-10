const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Don't send back the password on queries
  },
  role: {
    type: String,
    enum: ['student', 'donor', 'driver'],
    default: 'student',
  },

  // 👇 --- NEW FIELDS ADDED --- 👇
  studentId: {
    type: String,
    required: [true, 'Please provide a student ID'],
    unique: true,
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
  },
  year: {
    type: String,
    required: [true, 'Please provide your year'],
  },
  bio: {
    type: String,
    // This field is optional
  },
  bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null], // Add valid blood groups
        default: null,
    },
  // Add below bio field
friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // This links it back to the User model
    }],
    
    // For "History"
    // We store a list of actions this user has taken.
    history: [{
        action: {
            type: String,
            required: true,
            enum: ['created_post', 'updated_profile', 'joined_community'] // Examples
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        // You could also link to a post
        // post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
    }],
    notificationSettings: {
        emailOnFriendRequest: { type: Boolean, default: true },
        emailOnNewMessage: { type: Boolean, default: true },
        // Add more settings here later
    },
    tokensInvalidatedAt: {
        type: Date
    },
    
    // For "Language" preference (if you want to save it in the DB)
    // Alternatively, this can be saved only in the browser's Local Storage.
    preferredLanguage: {
        type: String,
        default: 'en' // 'en' for English, 'hi' for Hindi, etc.
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
    
    // ... (keep resetPasswordToken, etc.)
});
// This is the "pre-save middleware" that will run before a user is saved
UserSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // If this is a new user (not password change), don't save passwordConfirm
    // this.passwordConfirm = undefined; // If you have a passwordConfirm field
    next();
});

// ... (keep pre-save hook and methods)
UserSchema.methods.getResetPasswordToken = function() {
    // 1. Generate the token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash token and set to resetPasswordToken field in the DB
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Set the expire time (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

    // 4. Return the unhashed token (this is what gets emailed)
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);