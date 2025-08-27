import { Request, Response } from 'express';
import User from '../models/userprof.model';
import { AuthRequest } from '../middleware/auth';
import { userRegistrationSchema , inviteFriendSchema } from '../validation/schema';
import Joi from 'joi';

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    pincode: Joi.string().pattern(/^\d{6}$/).optional()
  }).optional()
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('eventsBooked')
      .populate('pastEventsAttended')
      .select('-firebaseUid');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }    res.json({
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
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }    const allowedUpdates = ['firstName', 'lastName', 'email', 'address'];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

    if (!isValidUpdate) {
      return res.status(400).json({ 
        error: 'Invalid updates. Allowed fields: firstName, lastName, email, address' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    ).select('-firebaseUid');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }    res.json({
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
  } catch (error) {
    console.error('Update profile error:', error);
    if (error) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitPersonalityTest = async (req: AuthRequest, res: Response) => {
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

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        personalityTestCompleted: true,
        personalityTestData
      },
      { new: true }
    ).select('-firebaseUid');

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
  } catch (error) {
    console.error('Personality test submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's booking history
export const getBookingHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter: any = { userId: req.user._id };
    if (status) {
      filter.bookingStatus = status;
    }

    const bookings = await User.findById(req.user._id)
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
  } catch (error) {
    console.error('Booking history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user account
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { confirmPassword } = req.body;
    
    if (!confirmPassword || confirmPassword !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        error: 'Please confirm account deletion by sending confirmPassword: "DELETE_MY_ACCOUNT"' 
      });
    }

    // Check for active bookings
    const activeBookings = await User.findById(req.user._id).populate({
      path: 'eventsBooked',
      match: { bookingStatus: { $in: ['pending', 'confirmed'] } }
    });

    if (activeBookings && activeBookings.eventsBooked.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete account with active bookings',
        message: 'Please cancel all active bookings before deleting your account'
      });
    }

    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Debug endpoint to list all users (for development/troubleshooting only)
export const listAllUsers = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all users from database...');
    const users = await User.find({}).select('-firebaseUid').limit(50);
    console.log(`Found ${users.length} users in database`);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const inviteFriend = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = inviteFriendSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const { phoneNumber } = req.body;

    // Find the current user
    const currentUser = await User.findById(req.user._id);
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
    const alreadyInvited = currentUser.invitedFriends?.some(
      friend => friend.phoneNumber === phoneNumber
    );

    if (alreadyInvited) {
      return res.status(400).json({ 
        error: 'This friend has already been invited' 
      });
    }

    // Check if the phone number belongs to an existing user
    const existingUser = await User.findOne({ phoneNumber });
    const inviteStatus = existingUser ? 'joined' : 'pending';

    // Add the invited friend to the user's invitedFriends array
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          invitedFriends: {
            phoneNumber,
            invitedAt: new Date(),
            status: inviteStatus
          }
        }
      },
      { new: true, runValidators: true }
    ).select('-firebaseUid');

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

  } catch (error) {
    console.error('Invite friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInvitedFriends = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
      .select('invitedFriends firstName lastName');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invitedFriends = user.invitedFriends || [];
    

    res.json({
      success: true,
      data: {
        totalInvited: invitedFriends.length,
        invitedFriends: invitedFriends.sort((a, b) => 
          new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime()
        )
      }
    });

  } catch (error) {
    console.error('Get invited friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};















// Debug endpoint to check database connection
export const checkDbConnection = async (req: Request, res: Response) => {
  try {
    const User = require('../models/userprof.model').default;
    const count = await User.countDocuments();
    console.log(`Database connection successful. Total users: ${count}`);
    
    res.json({
      success: true,
      message: 'Database connection is working',
      totalUsers: count
    });
  } catch (error) {
    console.error('Database connection check failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      details: error
    });
  }
};
