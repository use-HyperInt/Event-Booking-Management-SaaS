import express from 'express';
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getAllBookings, 
  getDashboardStats,
  registerAdmin,
  getAdminProfile,
  updateBookingStatus,
  verifyAdmin,
  getAllUsers,
} from '../controllers/admin.contoller';

import { authenticateAdmin , checkExistingAdmin} from '../middleware/auth';
import { uploadMultipleImages } from '../middleware/upload';
import { uploadToCloudinary } from '../config/cloudinary.config';

const router = express.Router();

router.post('/register', checkExistingAdmin, registerAdmin);
router.get('/profile', authenticateAdmin, getAdminProfile);


// Admin verification endpoint (no auth middleware since it's doing the verification)
router.post('/verify', verifyAdmin);

// Health check endpoint for fallback authentication
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Admin backend is running' });
});

// Development dashboard endpoint (no auth for fallback mode)
router.get('/dashboard-dev', async (req, res) => {
  try {
    // Import models dynamically to avoid import issues
    const Event = require('../models/events.model').default;
    const User = require('../models/userprof.model').default;
    const Booking = require('../models/booking.model').default;
    
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
    console.error('Development dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint for image upload
router.post('/test-upload', authenticateAdmin, uploadMultipleImages, async (req, res): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const uploadPromises = req.files.map(async (file: Express.Multer.File, index: number) => {
      const fileName = `test-${Date.now()}-${index}`;
      const result = await uploadToCloudinary(file.buffer, 'test', fileName);
      return result;
    });

    const results = await Promise.all(uploadPromises);
    res.json({ message: 'Images uploaded successfully', results });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Development event endpoints (no auth for fallback mode)
router.post('/events-dev', uploadMultipleImages, createEvent);
router.put('/events-dev/:id', uploadMultipleImages, updateEvent);
router.delete('/events-dev/:id', deleteEvent);

// Production event endpoints (with auth)
router.post('/events', authenticateAdmin, uploadMultipleImages, createEvent);
router.put('/events/:id', authenticateAdmin, uploadMultipleImages, updateEvent);
router.delete('/events/:id', authenticateAdmin, deleteEvent);

router.get('/bookings', getAllBookings);
router.post('/bookings/update-status', updateBookingStatus);
router.get('/users', getAllUsers);
router.get('/dashboard', authenticateAdmin, getDashboardStats);

export default router;
