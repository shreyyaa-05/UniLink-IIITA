// controllers/bloodController.js
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const BloodStory = require('../models/BloodStory');
const { isCompatible } = require('../utils/bloodCompatibility');
const sendEmail = require('../utils/sendEmail');

// @desc    Create a new blood request
// @route   POST /api/blood-requests
// @access  Private
exports.createBloodRequest = async (req, res) => {
    try {
        const { patientName, bloodGroup, location, contactPhone, note, urgency } = req.body;

        const request = new BloodRequest({
            user: req.user.id,
            patientName,
            bloodGroup,
            location,
            contactPhone,
            note,
            urgency: urgency || 'normal'
        });

        // Add initial audit log
        request.auditLogs.push({
            action: 'created',
            user: req.user.id,
            details: `Created blood request for ${patientName} (${bloodGroup})`
        });

        const newRequest = await request.save();
        await newRequest.populate('user', 'name email');

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
        // Fetch active requests (active, matched, accepted)
        const requests = await BloodRequest.find({ 
            status: { $in: ['active', 'matched', 'accepted'] } 
        })
        .populate('user', '_id name department email')
        .populate('assignedDonor', '_id name hostel email')
        .sort({ createdAt: -1 });

        res.json(requests);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Close/cancel a blood request manually
// @route   PUT /api/blood-requests/:id/close
// @access  Private
exports.closeBloodRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        request.status = 'closed';
        request.auditLogs.push({
            action: 'closed',
            user: req.user.id,
            details: 'Request closed manually'
        });
        await request.save();

        res.json({ message: 'Request closed successfully', request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get blood donation stats
// @route   GET /api/blood-requests/stats
// @access  Private
exports.getBloodStats = async (req, res) => {
    try {
        const registeredCount = await User.countDocuments({ bloodGroup: { $ne: null }, isDonorVerified: true });
        const availableCount = await User.countDocuments({ 
            bloodGroup: { $ne: null },
            isDonorVerified: true,
            availabilityStatus: 'Available Today'
        });
        
        const completedMatches = await BloodRequest.countDocuments({ status: 'completed' });

        // Aggregate by blood group for distribution
        const distribution = await User.aggregate([
            { $match: { bloodGroup: { $ne: null }, isDonorVerified: true } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
        ]);

        const groupCounts = {};
        ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].forEach(g => {
            groupCounts[g] = 0;
        });
        distribution.forEach(d => {
            if (d._id) groupCounts[d._id] = d.count;
        });

        res.json({
            registeredDonors: registeredCount,
            availableToday: availableCount,
            successfulMatches: completedMatches,
            groupCounts
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- OTP VOLUNTEER VERIFICATION ---

exports.sendDonorVerificationOtp = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.email.endsWith('@iiita.ac.in')) {
            return res.status(400).json({ message: 'Only official IIIT Allahabad emails (@iiita.ac.in) are eligible for donor verification.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.donorVerificationOtp = otp;
        user.donorVerificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiration
        await user.save();

        const message = `Hello ${user.name},\n\nYour OTP for verifying your UniLink Blood Donor account is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nUniLink IIITA Team`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #edf2f7; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #6b1d2f; text-align: center; margin-bottom: 20px;">🩸 Verify Your Blood Donor Account</h2>
            <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
            <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">Thank you for volunteering to join the IIITA Blood Donation Network. Your verification code is below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 10px 20px; border: 2px dashed #6b1d2f; border-radius: 8px; color: #6b1d2f; background-color: #faf6f0;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #718096; text-align: center; line-height: 1.5;">This code expires in 10 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
            <p style="font-size: 11px; color: #a0aec0; text-align: center;">UniLink Emergency Support Network</p>
          </div>
        `;

        await sendEmail({
            email: user.email,
            subject: '🩸 Verify Your UniLink Donor Account',
            message,
            html
        });

        res.json({ message: 'Verification OTP sent to your IIITA email.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send OTP email.' });
    }
};

exports.verifyDonorOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: 'OTP code is required.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.donorVerificationOtp !== otp || Date.now() > user.donorVerificationOtpExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.isDonorVerified = true;
        user.donorVerificationOtp = null;
        user.donorVerificationOtpExpires = null;
        
        user.history.push({
            action: 'updated_profile',
            timestamp: new Date(),
            details: 'Verified as blood donor'
        });

        await user.save();
        res.json({ message: 'Blood donor verified successfully!', user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- DONOR COMPATIBILITY RANKING & REQUEST FLOWS ---

exports.getRankedDonorsForRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const recipientGroup = request.bloodGroup;

        // Find all verified donors who have set a blood group
        const donors = await User.find({
            isDonorVerified: true,
            bloodGroup: { $ne: null }
        }).select('name studentId department year bloodGroup availabilityStatus hostel lastDonatedAt');

        const rankedDonors = donors.filter(d => {
            // 1. Compatibility Check
            if (!isCompatible(d.bloodGroup, recipientGroup)) {
                return false;
            }

            // 2. Cooldown Check: must be > 90 days since last donation
            if (d.lastDonatedAt) {
                const diffTime = Math.abs(Date.now() - d.lastDonatedAt);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 90) return false;
            }

            // 3. Exclude Self
            if (d._id.toString() === req.user.id) return false;

            return true;
        }).map(d => {
            let score = 0;

            // Compatibility type (Perfect Match gets 10, Compatible Match gets 5)
            const compatScore = d.bloodGroup === recipientGroup ? 10 : 5;
            score += compatScore;

            // Availability (Available Today gets 10, Busy gets 0)
            const availScore = d.availabilityStatus === 'Available Today' ? 10 : 0;
            score += availScore;

            // Hostel Proximity check
            let proximityScore = 0;
            if (request.location && d.hostel) {
                const reqLocationUpper = request.location.toUpperCase();
                const donorHostelUpper = d.hostel.toUpperCase();

                if (reqLocationUpper.includes(donorHostelUpper) || donorHostelUpper.includes(reqLocationUpper)) {
                    proximityScore = 10;
                } else {
                    // Match boys/girls hostel groups
                    const isReqBoys = reqLocationUpper.includes('BH') || reqLocationUpper.includes('BOY');
                    const isReqGirls = reqLocationUpper.includes('GH') || reqLocationUpper.includes('GIRL');
                    const isDonorBoys = donorHostelUpper.includes('BH');
                    const isDonorGirls = donorHostelUpper.includes('GH');

                    if ((isReqBoys && isDonorBoys) || (isReqGirls && isDonorGirls)) {
                        proximityScore = 5;
                    }
                }
            }
            score += proximityScore;

            return {
                ...d.toObject(),
                matchScore: score,
                matchType: d.bloodGroup === recipientGroup ? 'Perfect Match' : 'Compatible Match',
                hostelProximity: proximityScore === 10 ? 'Same Location' : proximityScore === 5 ? 'Same Hostel Area' : 'Other Area'
            };
        });

        // Sort by score desc, then alphabetically
        rankedDonors.sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));

        res.json(rankedDonors);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Requester sends an invite to a specific volunteer
exports.requestDonor = async (req, res) => {
    try {
        const { donorId } = req.params;
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const donor = await User.findById(donorId);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        request.status = 'matched';
        request.assignedDonor = donor._id;
        request.donorAcceptanceStatus = 'pending';
        request.auditLogs.push({
            action: 'match_requested',
            user: req.user.id,
            details: `Requested blood donation from volunteer ${donor.name}`
        });
        await request.save();

        // Create log notification for donor
        const notification = new Notification({
            user: donor._id,
            title: '🩸 Blood Request Matching Invite',
            message: `A classmate needs your support for patient ${request.patientName} (${request.bloodGroup}) at ${request.location}.`,
            type: 'blood_request',
            relatedId: request._id
        });
        await notification.save();

        // Send Socket event if active
        if (global.io) {
            global.io.to(donor._id.toString()).emit('notification', {
                title: '🩸 Urgent Blood Request Invite',
                message: `You have received a blood donation request from a classmate.`,
                type: 'blood_request',
                relatedId: request._id
            });
        }

        res.json({ message: 'Volunteering invitation sent successfully.', request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Volunteer accepts the match invite
exports.acceptRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id).populate('user', 'name email');
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (!request.assignedDonor || request.assignedDonor.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        request.status = 'accepted';
        request.donorAcceptanceStatus = 'accepted';
        request.auditLogs.push({
            action: 'accepted',
            user: req.user.id,
            details: `Volunteer accepted the invite.`
        });
        await request.save();

        const volunteer = await User.findById(req.user.id);

        // Notify requester
        const notification = new Notification({
            user: request.user._id,
            title: '🎉 Volunteer Request Accepted',
            message: `Volunteer ${volunteer.name} has accepted your request. Contact details are now unlocked.`,
            type: 'request_accepted',
            relatedId: request._id
        });
        await notification.save();

        if (global.io) {
            global.io.to(request.user._id.toString()).emit('notification', {
                title: '🎉 Invite Accepted',
                message: `Volunteer ${volunteer.name} has accepted your request.`,
                type: 'request_accepted',
                relatedId: request._id
            });
        }

        // Email volunteer details to requester
        const message = `Hello ${request.user.name},\n\nGood news! Volunteer ${volunteer.name} has accepted your blood request for ${request.patientName}.\n\nDonor Details:\nName: ${volunteer.name}\nHostel: ${volunteer.hostel || 'Not specified'}\nEmail: ${volunteer.email}\nPhone: ${request.contactPhone}\n\nPlease coordinate directly. Thank you for using UniLink.\n\nBest regards,\nUniLink Team`;
        try {
            await sendEmail({
                email: request.user.email,
                subject: '🎉 Volunteer Found: UniLink Blood Network',
                message
            });
        } catch (mailErr) {
            console.error('Mail notification failed to send:', mailErr.message);
        }

        res.json({ message: 'Invite accepted. Coordinations unlocked.', request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Volunteer declines request
exports.declineRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (!request.assignedDonor || request.assignedDonor.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        request.status = 'active';
        request.donorAcceptanceStatus = 'declined';
        request.assignedDonor = null;
        request.auditLogs.push({
            action: 'declined',
            user: req.user.id,
            details: `Volunteer declined matching invite.`
        });
        await request.save();

        // Notify requester
        const notification = new Notification({
            user: request.user,
            title: '⚠️ Matching Invite Declined',
            message: `The volunteer declined the invitation. Your request is active. Please invite another donor.`,
            type: 'request_declined',
            relatedId: request._id
        });
        await notification.save();

        if (global.io) {
            global.io.to(request.user.toString()).emit('notification', {
                title: '⚠️ Invite Declined',
                message: `The matched volunteer has declined your request. Your request is now back to Active.`,
                type: 'request_declined',
                relatedId: request._id
            });
        }

        res.json({ message: 'Invitation declined successfully.', request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Creator completes request (donation successful)
exports.completeRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        request.status = 'completed';
        request.auditLogs.push({
            action: 'completed',
            user: req.user.id,
            details: 'Request marked successfully completed.'
        });
        await request.save();

        // Apply donor cooldown
        if (request.assignedDonor) {
            const donor = await User.findById(request.assignedDonor);
            if (donor) {
                donor.lastDonatedAt = new Date();
                await donor.save();
            }
        }

        res.json({ message: 'Request completed and cooldown recorded.', request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Automatic/Manual Request Escalation
exports.escalateRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Requester can manually trigger escalation if time has passed
        if (request.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        request.escalated = true;
        request.escalatedAt = new Date();
        request.auditLogs.push({
            action: 'escalated',
            user: req.user.id,
            details: 'Request escalated manually'
        });
        await request.save();

        // Email Alert to Campus Team
        const alertMessage = `⚠️ EMERGENCY ESCALATION REPORT\n\nRequest for ${request.bloodGroup} needed at ${request.location} has been escalated.\n\nRequester: ${req.user.name}\nContact phone: ${request.contactPhone}\n\nPlease coordinate support.`;
        try {
            await sendEmail({
                email: 'unilink.app.iiita@gmail.com',
                subject: `⚠️ UniLink Emergency Escalation: ${request.bloodGroup} Needed`,
                message: alertMessage
            });
        } catch (err) {
            console.error('Failed to send escalation email:', err.message);
        }

        res.json({ message: 'Request escalated successfully.', request });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Background automatic escalation checks
exports.checkAndEscalateRequests = async (req, res) => {
    try {
        const activeRequests = await BloodRequest.find({
            status: { $in: ['active', 'matched'] },
            donorAcceptanceStatus: { $ne: 'accepted' },
            escalated: false
        });

        let escalatedCount = 0;

        for (const request of activeRequests) {
            const diffTime = Math.abs(Date.now() - request.createdAt);
            const diffHours = diffTime / (1000 * 60 * 60);

            const limit = request.urgency === 'urgent' || request.urgency === 'critical' ? 2 : 6;

            if (diffHours >= limit) {
                request.escalated = true;
                request.escalatedAt = new Date();
                request.auditLogs.push({
                    action: 'escalated',
                    details: `Automatically escalated because no donor accepted within ${limit} hours.`
                });
                await request.save();

                const alertMessage = `⚠️ EMERGENCY BLOOD ESCALATION ALERT\n\nRequest for ${request.bloodGroup} for patient ${request.patientName} at ${request.location} has been escalated.\n\nUrgency: ${request.urgency}\nNo volunteer has accepted the request within the required time window.\n\nPhone contact: ${request.contactPhone}\n\nPlease check the UniLink Blood Network portal immediately.`;
                
                try {
                    await sendEmail({
                        email: 'unilink.app.iiita@gmail.com',
                        subject: `⚠️ UniLink Escalation Alert: ${request.bloodGroup} Needed`,
                        message: alertMessage
                    });
                } catch (err) {
                    console.error('Escalation email failed:', err.message);
                }

                escalatedCount++;
            }
        }

        res.json({ success: true, escalatedCount });

    } catch (err) {
        console.error('Escalation check error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- GRATITUDE STORIES & NOTIFICATIONS ---

exports.getStories = async (req, res) => {
    try {
        const stories = await BloodStory.find().sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createStory = async (req, res) => {
    try {
        const { story, bloodGroup } = req.body;
        if (!story || !bloodGroup) {
            return res.status(400).json({ message: 'Story and blood group are required.' });
        }

        const newStory = new BloodStory({ story, bloodGroup });
        await newStory.save();
        res.status(201).json(newStory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.notifId,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        res.json({ message: 'Notification marked read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};