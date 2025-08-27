"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const events_model_1 = __importDefault(require("../models/events.model"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get user's bookings with pagination and filtering
router.get('/user', auth_1.authenticateUser, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        let query = { userId: req.user._id };
        if (status) {
            query.bookingStatus = status;
        }
        const bookings = await booking_model_1.default.find(query)
            .populate('eventId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await booking_model_1.default.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: {
                bookings,
                totalPages,
                currentPage: pageNum,
                total
            }
        });
    }
    catch (error) {
        console.error('User bookings fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's bookings
router.get('/my-bookings', auth_1.authenticateUser, async (req, res) => {
    try {
        const bookings = await booking_model_1.default.find({ userId: req.user._id })
            .populate('eventId')
            .sort({ createdAt: -1 });
        res.json({ bookings });
    }
    catch (error) {
        console.error('User bookings fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get booking by ID
router.get('/:bookingId', auth_1.authenticateUser, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await booking_model_1.default.findById(bookingId)
            .populate('eventId')
            .populate('userId');
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        // Only allow user to see their own booking
        if (booking.userId._id.toString() !== req.user._id.toString()) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        res.json({ success: true, data: booking });
    }
    catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});
// Cancel booking for payment failures
router.post('/:bookingId/cancel', auth_1.authenticateUser, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await booking_model_1.default.findById(bookingId);
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        // Verify booking belongs to user
        if (booking.userId.toString() !== req.user._id.toString()) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        // Only allow cancellation if payment is not completed
        if (booking.bookingStatus === 'confirmed') {
            res.status(400).json({ error: 'Cannot cancel confirmed booking' });
            return;
        }
        // Update booking status
        booking.bookingStatus = 'cancelled';
        await booking.save();
        // Update event seats
        const event = await events_model_1.default.findById(booking.eventId);
        if (event) {
            event.attendeeCount -= booking.numberOfSeats;
            event.bookingCount -= 1;
            await event.save();
        }
        res.json({ success: true, message: 'Booking cancelled successfully' });
    }
    catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});
// Cancel booking
// router.patch('/cancel/:bookingId', authenticateUser, async (req: AuthRequest, res: Response) => {
//   try {
//     const booking = await Booking.findOne({ 
//       _id: req.params.bookingId, 
//       userId: req.user._id 
//     }).populate('eventId');
//     if (!booking) {
//       return res.status(404).json({ error: 'Booking not found' });
//     }
//     if (booking.bookingStatus === 'cancelled') {
//       return res.status(400).json({ error: 'Booking already cancelled' });
//     }
//     // Check if event is more than 24 hours away
//     const eventDate = new Date((booking.eventId as any).eventDate);
//     const now = new Date();
//     const timeDiff = eventDate.getTime() - now.getTime();
//     const hoursDiff = timeDiff / (1000 * 3600);
//     if (hoursDiff <= 24) {
//       return res.status(400).json({ 
//         error: 'Cannot cancel booking less than 24 hours before the event' 
//       });
//     }
router.patch('/cancel/:bookingId', auth_1.authenticateUser, async (req, res) => {
    try {
        const booking = await booking_model_1.default.findOne({
            _id: req.params.bookingId,
            userId: req.user._id
        }).populate('eventId');
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        if (booking.bookingStatus === 'cancelled') {
            res.status(400).json({ error: 'Booking already cancelled' });
            return;
        }
        // Check if event is more than 24 hours away
        const eventDate = new Date(booking.eventId.startTime);
        const now = new Date();
        const timeDiff = eventDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        if (hoursDiff <= 24) {
            res.status(400).json({
                error: 'Cannot cancel booking less than 24 hours before the event'
            });
            return;
        }
        booking.bookingStatus = 'cancelled';
        await booking.save();
        // Restore available seats by reducing attendee count
        const event = booking.eventId;
        event.attendeeCount -= booking.numberOfSeats;
        event.bookingCount -= 1;
        await event.save();
        res.json({ message: 'Booking cancelled successfully' });
    }
    catch (error) {
        console.error('Booking cancellation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=booking.routes.js.map