const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// --- REGISTER LOGIC ---
exports.logoutAllDevices = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Set the invalidation date to "now"
        user.tokensInvalidatedAt = new Date();
        await user.save();

        res.status(200).json({ success: true, message: 'You have been logged out from all other devices.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    name, 
    email, 
    password, 
    role, 
    studentId, 
    department, 
    year, 
    bio,
    bloodGroup
  } = req.body;

  try {
    // This is the correct line for register. NO .select() here.
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    let student = await User.findOne({ studentId });
    if (student) {
        return res.status(400).json({ msg: 'Student ID is already registered' });
    }

    user = new User({
      name,
      email,
      password,
      role,
      studentId,
      department,
      year,
      bio,
      bloodGroup
    });

    await user.save(); 

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// --- LOGIN LOGIC ---
// --- LOGIN LOGIC ---
// --- LOGIN LOGIC (WITH "UPGRADE-ON-LOGIN") ---
// --- LOGIN LOGIC (WITH DEBUGGING & "UPGRADE-ON-LOGIN") ---
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Format validation errors for frontend
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return res.status(400).json({ msg: errorMessages });
    }

    const { email, password } = req.body;

    // --- DEBUGGING ---
    console.log(`\n--- New Login Attempt for: ${email} ---`);
    console.log(`[DEBUG] 1. Password from user (frontend): "${password}"`);

    try {
        let user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log("[DEBUG] 2. ERROR: User not found.");
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        console.log(`[DEBUG] 2. User found. Password from DB: "${user.password}"`);

        // Check if the stored password is a hash or plaintext.
        // bcrypt hashes always start with $2a$, $2b$, or $2y$ and are 60 characters
        const isHashed = user.password && user.password.length === 60 && 
                        (user.password.startsWith('$2a$') || 
                         user.password.startsWith('$2b$') || 
                         user.password.startsWith('$2y$'));
        console.log(`[DEBUG] 3. Is password a hash? ${isHashed}`);
        console.log(`[DEBUG] 3.5. Password length: ${user.password ? user.password.length : 'null'}, starts with: ${user.password ? user.password.substring(0, 4) : 'null'}`);

        let isMatch = false;

        if (isHashed) {
            // --- PATH 1: USER IS ALREADY SECURE (hashed) ---
            console.log("[DEBUG] 4. Taking PATH 1 (Hashed). Comparing with bcrypt...");
            // Trim the input password but compare against stored hash
            const trimmedPassword = password.trim();
            isMatch = await bcrypt.compare(trimmedPassword, user.password);
            console.log(`[DEBUG] 4.5. bcrypt.compare result: ${isMatch}`);

        } else {
            // --- PATH 2: USER IS INSECURE (plaintext) ---
            console.log("[DEBUG] 4. Taking PATH 2 (Plaintext). Comparing strings...");
            
            // We .trim() both passwords to remove any hidden whitespace
            const receivedPassword = password.trim();
            const storedPassword = user.password.trim();

            console.log(`[DEBUG] 5. Comparing (trimmed): "${receivedPassword}" === "${storedPassword}"`);

            if (receivedPassword === storedPassword) {
                console.log("[DEBUG] 6. Plaintext match SUCCESS.");
                isMatch = true;
                
                // UPGRADE THE PASSWORD
                user.password = receivedPassword; // Save the trimmed version
                await user.save();
                
                console.log(`[DEBUG] 7. SUCCESS: Upgraded password hash for user ${user.email}`);
            } else {
                console.log("[DEBUG] 6. Plaintext match FAILED.");
            }
        }

        // --- Final check ---
        if (!isMatch) {
            console.log("[DEBUG] 8. Final check: isMatch is false. Sending 'Invalid credentials'.");
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        console.log("[DEBUG] 8. Final check: isMatch is true. Creating token.");

        // --- Create and send JWT (same as before) ---
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' }, 
            (err, token) => {
                if (err) throw err;
                console.log("[DEBUG] 9. Token created. Sending to user.");
                res.json({ token });
            }
        );

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Server Error');
    }
};

// --- FORGOT PASSWORD LOGIC ---
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${req.body.email}`);
      return res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.APP_BASE_URL}/auth.html?view=resetpassword&token=${resetToken}`;
    const message = `You requested a password reset for UniLink. Please click this link (expires in 10 minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'UniLink Password Reset Request',
      message: message,
    });

    res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    try {
        const userWithError = await User.findOne({ email: req.body.email });
        if (userWithError && userWithError.resetPasswordToken) {
            userWithError.resetPasswordToken = undefined;
            userWithError.resetPasswordExpire = undefined;
            await userWithError.save({ validateBeforeSave: false });
        }
    } catch (cleanupError) {
        console.error('Error cleaning up reset token after forgotPassword failure:', cleanupError);
    }
    res.status(500).send('Error processing request');
  }
};

// --- RESET PASSWORD LOGIC ---
exports.resetPassword = async (req, res) => {
  try {
    const incomingToken = req.params.resettoken;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(incomingToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ msg: 'Password reset successful' });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).send('Server Error during password reset');
  }
};
exports.changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // 1. Re-fetch user with the password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // 2. Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid current password' });
    }

    // 3. Set and save new password (the pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
};