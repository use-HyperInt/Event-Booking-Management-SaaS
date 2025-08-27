import { Request, Response } from 'express';
import Event from '../models/events.model';
import Booking from '../models/booking.model';
import User from '../models/userprof.model';
import Admin from '../models/admin.model';
import { AuthRequest } from '../middleware/auth';
import { eventCreationSchema, adminRegistrationSchema } from '../validation/schema';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.config';
import { auth } from '../config/firebase';

// Admin registration function
export const registerAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Admin registration request body:', JSON.stringify(req.body, null, 2));
    
    const { error } = adminRegistrationSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      res.status(400).json({ 
        error: error.details[0].message,
        field: error.details[0].path,
        value: error.details[0].context?.value
      });
      return;
    }

    // Check if admin already exists (this is handled by checkExistingAdmin middleware)
    const adminData = {
      firebaseUid: req.user.firebaseUid,
      email: req.user.email,
      ...req.body,
      isActive: true, // Default to active
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const admin = new Admin(adminData);
    console.log('Attempting to save admin:', adminData);
    
    try {
      const savedAdmin = await admin.save();
      console.log('Admin saved successfully:', savedAdmin._id);
      console.log('Saved admin data:', JSON.stringify(savedAdmin, null, 2));
    } catch (saveError) {
      console.error('Error saving admin to database:', saveError);
      res.status(500).json({ error: 'Failed to save admin to database' });
      return;
    }
    
    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get admin profile
export const getAdminProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin; // This comes from authenticateAdmin middleware

    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Admin profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Parse FormData fields
    let eventData: any = { ...req.body };

    // Parse JSON fields from FormData
    if (typeof req.body.eventLocation === 'string') {
      try {
        eventData.eventLocation = JSON.parse(req.body.eventLocation);
      } catch (e) {
        res.status(400).json({ error: 'Invalid eventLocation format' });
        return;
      }
    }

    if (typeof req.body.matchingTags === 'string') {
      try {
        eventData.matchingTags = JSON.parse(req.body.matchingTags);
      } catch (e) {
        eventData.matchingTags = [];
      }
    }

  
    if (eventData.capacity) eventData.capacity = parseInt(eventData.capacity);
    if (eventData.price) eventData.price = parseFloat(eventData.price);
    if (eventData.experienceTicketPrice) eventData.experienceTicketPrice = parseFloat(eventData.experienceTicketPrice);
    if (eventData.discountedPrice) eventData.discountedPrice = parseFloat(eventData.discountedPrice);
    if (eventData.feedbackEnabled) eventData.feedbackEnabled = eventData.feedbackEnabled === 'true';

    // Optional fields - only validate if provided
    if (eventData.understandContent) {
      if (typeof eventData.understandContent !== 'string') {
        res.status(400).json({ error: 'understandContent must be a string' });
        return;
      }
      eventData.understandContent = eventData.understandContent.trim();
    }

    if (eventData.experienceTicketContent) {
      if (typeof eventData.experienceTicketContent !== 'string') {
        res.status(400).json({ error: 'experienceTicketContent must be a string' });
        return;
      }
      eventData.experienceTicketContent = eventData.experienceTicketContent.trim();
    }

    // Validate dates before mongoose validation
    if (eventData.startTime && eventData.endTime) {
      const startDate = new Date(eventData.startTime);
      const endDate = new Date(eventData.endTime);
      if (endDate <= startDate) {
        res.status(400).json({ error: 'End time must be after start time' });
        return;
      }
    }

    const { error } = eventCreationSchema.validate(eventData);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    let imageUrls: string[] = [];

    // Handle image uploads if files are present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(async (file: Express.Multer.File, index: number) => {
          const fileName = `event-${Date.now()}-${index}`;
          const result = await uploadToCloudinary(file.buffer, 'events', fileName);
          return result.url;
        });
        imageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        res.status(500).json({ error: 'Failed to upload images' });
        return;
      }
    } else if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      // If no files uploaded but imageUrls provided in body, use them
      imageUrls = req.body.imageUrls;
    } else {
      // Provide default image URL if no images provided
      imageUrls = ['https://via.placeholder.com/600x400?text=Event+Image'];
    }

    const finalEventData = {
      ...eventData,
      imageUrls
    };

    const event = new Event(finalEventData);
    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Parse FormData fields
    let eventData: any = { ...req.body };

    // Parse JSON fields from FormData
    if (typeof req.body.eventLocation === 'string') {
      try {
        eventData.eventLocation = JSON.parse(req.body.eventLocation);
      } catch (e) {
        res.status(400).json({ error: 'Invalid eventLocation format' });
        return;
      }
    }

    if (typeof req.body.matchingTags === 'string') {
      try {
        eventData.matchingTags = JSON.parse(req.body.matchingTags);
      } catch (e) {
        eventData.matchingTags = [];
      }
    }

    // Parse existing image URLs if provided
    let existingImageUrls: string[] = [];
    if (typeof req.body.imageUrls === 'string') {
      try {
        existingImageUrls = JSON.parse(req.body.imageUrls);
      } catch (e) {
        existingImageUrls = [];
      }
    }

    // Add parsed imageUrls to eventData for validation
    eventData.imageUrls = existingImageUrls;

    // Convert string numbers back to numbers
    if (eventData.capacity) eventData.capacity = parseInt(eventData.capacity);
    if (eventData.price) eventData.price = parseFloat(eventData.price);
    if (eventData.experienceTicketPrice) eventData.experienceTicketPrice = parseFloat(eventData.experienceTicketPrice);
    if (eventData.discountedPrice) eventData.discountedPrice = parseFloat(eventData.discountedPrice);
    if (eventData.feedbackEnabled) eventData.feedbackEnabled = eventData.feedbackEnabled === 'true';


    if (eventData.understandContent && typeof eventData.understandContent === 'string') {
      eventData.understandContent = eventData.understandContent.trim();
    }

    if (eventData.experienceTicketContent && typeof eventData.experienceTicketContent === 'string') {
      eventData.experienceTicketContent = eventData.experienceTicketContent.trim();
    }


    if (eventData.startTime && eventData.endTime) {
      const startDate = new Date(eventData.startTime);
      const endDate = new Date(eventData.endTime);
      if (endDate <= startDate) {
        res.status(400).json({ error: 'End time must be after start time' });
        return;
      }
    }

    const updateValidationSchema = eventCreationSchema.fork(
      ['title', 'description', 'understandContent', 'experienceTicketContent', 'category', 'startTime', 'endTime', 'capacity', 'experienceTicketPrice', 'price', 'eventLocation'],
      (schema) => schema.optional()
    );

    const { error } = updateValidationSchema.validate(eventData);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    // Get the existing event to handle image replacement
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    let newImageUrls: string[] = [];

    // Handle new image uploads if files are present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        // Upload new images
        const uploadPromises = req.files.map(async (file: Express.Multer.File, index: number) => {
          const fileName = `event-${Date.now()}-${index}`;
          const result = await uploadToCloudinary(file.buffer, 'events', fileName);
          return result.url;
        });
        newImageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        res.status(500).json({ error: 'Failed to upload images' });
        return;
      }
    }

    // Combine existing image URLs with new ones
    const finalImageUrls = [...existingImageUrls, ...newImageUrls];
    // If no images at all, keep existing ones
    const imageUrls = finalImageUrls.length > 0 ? finalImageUrls : existingEvent.imageUrls;

    const updateData = {
      ...eventData,
      imageUrls
    };

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, eventId } = req.query;
    
    const filter: any = {};
    if (status) filter.bookingStatus = status;
    if (eventId) filter.eventId = eventId;    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName phoneNumber email gender dateOfBirth address eventsBooked invitedFriends personalityTestCompleted createdAt')
      .populate('eventId', 'title startTime price')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, status } = req.body;

    // Validate required fields
    if (!bookingId || !status) {
      res.status(400).json({ 
        error: 'Booking ID and status are required' 
      });
      return;
    }

    // Validate status value based on your schema
    const validStatuses = ['waitlist', 'pending_payment', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ 
        error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') 
      });
      return;
    }

    // Find and update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        bookingStatus: status,
        updatedAt: new Date()
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validators
      }
    )
    .populate('userId', 'firstName lastName phoneNumber email')
    .populate('eventId', 'title startTime price');

    if (!updatedBooking) {
      res.status(404).json({ 
        error: 'Booking not found' 
      });
      return;
    }

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Booking status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: { $in: ['CONFIRMED', 'UPCOMING'] } });
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });
    
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.json({
      stats: {
        totalEvents,
        activeEvents,
        totalUsers,
        totalBookings,
        pendingBookings,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin verification endpoint
export const verifyAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Find admin user in database
    const admin = await Admin.findOne({ 
      firebaseUid: decodedToken.uid, 
      isActive: true 
    }).select('-firebaseUid');

    if (!admin) {
      res.status(403).json({ error: 'Admin access required. Account not found or inactive.' });
      return;
    }

    // Return admin data
    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(401).json({ error: 'Invalid token or verification failed.' });
  }
};

// Get all users with pagination
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('getAllUsers endpoint called with query:', req.query);
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    console.log(`Fetching users: page=${page}, limit=${limit}, skip=${skip}`);

    // Get users with pagination
    const users = await User.find({})
      .select('-firebaseUid') // Exclude sensitive firebase UID
      .populate('eventsBooked', 'title startTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    console.log(`Found ${users.length} users out of ${totalUsers} total`);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};