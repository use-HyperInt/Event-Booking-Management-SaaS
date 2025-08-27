"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDbConnection = exports.getInvitedFriends = exports.inviteFriend = exports.listAllUsers = exports.deleteAccount = exports.getBookingHistory = exports.submitPersonalityTest = exports.updateProfile = exports.getProfile = void 0;
const userprof_model_1 = __importDefault(require("../models/userprof.model"));
const schema_1 = require("../validation/schema");
const joi_1 = __importDefault(require("joi"));
const updateProfileSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).optional(),
    lastName: joi_1.default.string().min(2).max(50).optional(),
    email: joi_1.default.string().email().optional(),
    address: joi_1.default.object({
        street: joi_1.default.string().optional(),
        city: joi_1.default.string().optional(),
        state: joi_1.default.string().optional(),
        country: joi_1.default.string().optional(),
        pincode: joi_1.default.string().pattern(/^\d{6}$/).optional()
    }).optional()
});
const getProfile = async (req, res) => {
    try {
        const user = await userprof_model_1.default.findById(req.user._id)
            .populate('eventsBooked')
            .populate('pastEventsAttended')
            .select('-firebaseUid');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                address: user.address,
                profileImage: user.profileImage,
                eventsBooked: user.eventsBooked,
                pastEventsAttended: user.pastEventsAttended,
                personalityTestCompleted: user.personalityTestCompleted,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { error } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details[0].message
            });
        }
        const allowedUpdates = ['firstName', 'lastName', 'email', 'address'];
        const updates = Object.keys(req.body);
        const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
        if (!isValidUpdate) {
            return res.status(400).json({
                error: 'Invalid updates. Allowed fields: firstName, lastName, email, address'
            });
        }
        const user = await userprof_model_1.default.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true }).select('-firebaseUid');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                address: user.address,
                profileImage: user.profileImage,
                personalityTestCompleted: user.personalityTestCompleted,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        if (error) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
const submitPersonalityTest = async (req, res) => {
    try {
        const { responses, typeformResponseId, testScore, personalityType } = req.body;
        if (!responses) {
            return res.status(400).json({ error: 'Test responses are required' });
        }
        if (req.user.personalityTestCompleted) {
            return res.status(400).json({
                error: 'Personality test already completed',
                message: 'You have already completed the personality test'
            });
        }
        const personalityTestData = {
            responses,
            typeformResponseId: typeformResponseId || null,
            testScore: testScore || null,
            personalityType: personalityType || null,
            completedAt: new Date(),
            version: '1.0'
        };
        const user = await userprof_model_1.default.findByIdAndUpdate(req.user._id, {
            personalityTestCompleted: true,
            personalityTestData
        }, { new: true }).select('-firebaseUid');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            message: 'Personality test submitted successfully',
            data: {
                personalityTestCompleted: user.personalityTestCompleted,
                testCompletedAt: personalityTestData.completedAt,
                personalityType: personalityType || null
            }
        });
    }
    catch (error) {
        console.error('Personality test submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitPersonalityTest = submitPersonalityTest;
// Get user's booking history
const getBookingHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const filter = { userId: req.user._id };
        if (status) {
            filter.bookingStatus = status;
        }
        const bookings = await userprof_model_1.default.findById(req.user._id)
            .populate({
            path: 'eventsBooked',
            populate: {
                path: 'eventId',
                model: 'Event'
            },
            options: {
                sort: { createdAt: -1 },
                limit: Number(limit),
                skip: (Number(page) - 1) * Number(limit)
            }
        });
        if (!bookings) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            data: {
                bookings: bookings.eventsBooked,
                currentPage: Number(page),
                totalPages: Math.ceil(bookings.eventsBooked.length / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Booking history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getBookingHistory = getBookingHistory;
// Delete user account
const deleteAccount = async (req, res) => {
    try {
        const { confirmPassword } = req.body;
        if (!confirmPassword || confirmPassword !== 'DELETE_MY_ACCOUNT') {
            return res.status(400).json({
                error: 'Please confirm account deletion by sending confirmPassword: "DELETE_MY_ACCOUNT"'
            });
        }
        // Check for active bookings
        const activeBookings = await userprof_model_1.default.findById(req.user._id).populate({
            path: 'eventsBooked',
            match: { bookingStatus: { $in: ['pending', 'confirmed'] } }
        });
        if (activeBookings && activeBookings.eventsBooked.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete account with active bookings',
                message: 'Please cancel all active bookings before deleting your account'
            });
        }
        await userprof_model_1.default.findByIdAndDelete(req.user._id);
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    }
    catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteAccount = deleteAccount;
// Debug endpoint to list all users (for development/troubleshooting only)
const listAllUsers = async (req, res) => {
    try {
        console.log('Fetching all users from database...');
        const users = await userprof_model_1.default.find({}).select('-firebaseUid').limit(50);
        console.log(`Found ${users.length} users in database`);
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.listAllUsers = listAllUsers;
const inviteFriend = async (req, res) => {
    try {
        const { error } = schema_1.inviteFriendSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details[0].message
            });
        }
        const { phoneNumber } = req.body;
        // Find the current user
        const currentUser = await userprof_model_1.default.findById(req.user._id);
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if user is trying to invite themselves
        if (currentUser.phoneNumber === phoneNumber) {
            return res.status(400).json({
                error: 'You cannot invite yourself'
            });
        }
        // Check if this phone number is already invited by this user
        const alreadyInvited = currentUser.invitedFriends?.some(friend => friend.phoneNumber === phoneNumber);
        if (alreadyInvited) {
            return res.status(400).json({
                error: 'This friend has already been invited'
            });
        }
        // Check if the phone number belongs to an existing user
        const existingUser = await userprof_model_1.default.findOne({ phoneNumber });
        const inviteStatus = existingUser ? 'joined' : 'pending';
        // Add the invited friend to the user's invitedFriends array
        const updatedUser = await userprof_model_1.default.findByIdAndUpdate(req.user._id, {
            $push: {
                invitedFriends: {
                    phoneNumber,
                    invitedAt: new Date(),
                    status: inviteStatus
                }
            }
        }, { new: true, runValidators: true }).select('-firebaseUid');
        res.status(201).json({
            success: true,
            message: `Friend ${inviteStatus === 'joined' ? 'added' : 'invited'} successfully`,
            data: {
                invitedFriend: {
                    phoneNumber,
                    status: inviteStatus,
                    invitedAt: new Date()
                },
                totalInvited: updatedUser?.invitedFriends?.length || 0
            }
        });
    }
    catch (error) {
        console.error('Invite friend error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.inviteFriend = inviteFriend;
const getInvitedFriends = async (req, res) => {
    try {
        const user = await userprof_model_1.default.findById(req.user._id)
            .select('invitedFriends firstName lastName');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const invitedFriends = user.invitedFriends || [];
        res.json({
            success: true,
            data: {
                totalInvited: invitedFriends.length,
                invitedFriends: invitedFriends.sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime())
            }
        });
    }
    catch (error) {
        console.error('Get invited friends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getInvitedFriends = getInvitedFriends;
// Debug endpoint to check database connection
const checkDbConnection = async (req, res) => {
    try {
        const User = require('../models/userprof.model').default;
        const count = await User.countDocuments();
        console.log(`Database connection successful. Total users: ${count}`);
        res.json({
            success: true,
            message: 'Database connection is working',
            totalUsers: count
        });
    }
    catch (error) {
        console.error('Database connection check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error
        });
    }
};
exports.checkDbConnection = checkDbConnection;
//# sourceMappingURL=user.controller.js.map