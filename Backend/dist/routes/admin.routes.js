"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_contoller_1 = require("../controllers/admin.contoller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const cloudinary_config_1 = require("../config/cloudinary.config");
const router = express_1.default.Router();
router.post('/register', auth_1.checkExistingAdmin, admin_contoller_1.registerAdmin);
router.get('/profile', auth_1.authenticateAdmin, admin_contoller_1.getAdminProfile);
// Admin verification endpoint (no auth middleware since it's doing the verification)
router.post('/verify', admin_contoller_1.verifyAdmin);
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
    }
    catch (error) {
        console.error('Development dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Test endpoint for image upload
router.post('/test-upload', auth_1.authenticateAdmin, upload_1.uploadMultipleImages, async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }
        const uploadPromises = req.files.map(async (file, index) => {
            const fileName = `test-${Date.now()}-${index}`;
            const result = await (0, cloudinary_config_1.uploadToCloudinary)(file.buffer, 'test', fileName);
            return result;
        });
        const results = await Promise.all(uploadPromises);
        res.json({ message: 'Images uploaded successfully', results });
    }
    catch (error) {
        console.error('Test upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});
// Development event endpoints (no auth for fallback mode)
router.post('/events-dev', upload_1.uploadMultipleImages, admin_contoller_1.createEvent);
router.put('/events-dev/:id', upload_1.uploadMultipleImages, admin_contoller_1.updateEvent);
router.delete('/events-dev/:id', admin_contoller_1.deleteEvent);
// Production event endpoints (with auth)
router.post('/events', auth_1.authenticateAdmin, upload_1.uploadMultipleImages, admin_contoller_1.createEvent);
router.put('/events/:id', auth_1.authenticateAdmin, upload_1.uploadMultipleImages, admin_contoller_1.updateEvent);
router.delete('/events/:id', auth_1.authenticateAdmin, admin_contoller_1.deleteEvent);
router.get('/bookings', admin_contoller_1.getAllBookings);
router.post('/bookings/update-status', admin_contoller_1.updateBookingStatus);
router.get('/users', admin_contoller_1.getAllUsers);
router.get('/dashboard', auth_1.authenticateAdmin, admin_contoller_1.getDashboardStats);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map