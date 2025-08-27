"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookEvent = exports.getEventById = exports.getEvents = void 0;
const events_model_1 = __importDefault(require("../models/events.model"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const schema_1 = require("../validation/schema");
const razorpay_service_1 = require("../services/razorpay.service");
const razorpayService = new razorpay_service_1.RazorpayService();
const getEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search, status, location } = req.query;
        const filter = {
            status: status || { $in: ['CONFIRMED', 'UPCOMING'] },
            startTime: { $gte: new Date() }
        };
        if (category)
            filter.category = category;
        if (location)
            filter['eventLocation.venueName'] = new RegExp(location, 'i');
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { matchingTags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        const events = await events_model_1.default.find(filter)
            .sort({ startTime: 1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await events_model_1.default.countDocuments(filter);
        res.json({
            events,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total
        });
    }
    catch (error) {
        console.error('Events fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEvents = getEvents;
const getEventById = async (req, res) => {
    try {
        const event = await events_model_1.default.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    }
    catch (error) {
        console.error('Event fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEventById = getEventById;
const bookEvent = async (req, res) => {
    try {
        // 1) Validate input
        const { error } = schema_1.bookingSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { eventId, numberOfSeats } = req.body;
        const userId = req.user._id.toString();
        // 2) Load event
        const event = await events_model_1.default.findById(eventId).lean();
        if (!event) {
            res.status(404).json({ error: "Event not found" });
            return;
        }
        // 3) Check status & RSVP deadline
        if (!["CONFIRMED", "UPCOMING"].includes(event.status)) {
            res.status(400).json({ error: "Event is not open for booking" });
            return;
        }
        if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
            res.status(400).json({ error: "RSVP deadline has passed" });
            return;
        }
        // 4) Check capacity
        const availableSeats = event.capacity - (event.attendeeCount || 0);
        if (availableSeats < numberOfSeats) {
            res.status(400).json({ error: "Not enough seats available" });
            return;
        }
        // 5) Prevent duplicate bookings
        const already = await booking_model_1.default.findOne({
            userId,
            eventId,
            bookingStatus: { $in: ["confirmed"] },
        });
        if (already) {
            res.status(400).json({ error: "You have already booked this event" });
            return;
        }
        // 6) Compute total
        const totalAmountRs = (event.experienceTicketPrice + event.price) * numberOfSeats;
        const totalAmountPaise = totalAmountRs * 100;
        // 7) Create booking
        const booking = await booking_model_1.default.create({
            userId,
            eventId,
            numberOfSeats,
            totalAmount: totalAmountRs,
            bookingStatus: "pending_payment",
        });
        // 8) Atomically update event counts
        await events_model_1.default.findByIdAndUpdate(eventId, {
            $inc: {
                attendeeCount: numberOfSeats,
                bookingCount: 1,
            }
        });
        // 9) Create Razorpay order
        const razorpayOrder = await razorpayService.createOrder({
            amount: totalAmountPaise, // paise
            receipt: `booking_${booking._id}`,
            notes: { bookingId: booking._id, eventId, userId, numberOfSeats },
        });
        // 10) Save payment record
        await payment_model_1.default.create({
            bookingId: booking._id,
            userId,
            eventId,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmountRs,
            status: "created",
        });
        // 11) Push booking into user (if you track that)
        req.user.eventsBooked.push(booking._id);
        await req.user.save();
        // 12) Return checkout info
        res.status(201).json({
            success: true,
            message: "Booking created, awaiting payment",
            data: {
                bookingId: booking._id,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmountPaise,
                currency: razorpayOrder.currency,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                event: {
                    id: event._id,
                    name: event.title,
                    date: event.startTime,
                    location: event.eventLocation,
                },
            },
        });
    }
    catch (err) {
        console.error("Booking error:", err);
    }
};
exports.bookEvent = bookEvent;
//# sourceMappingURL=event.controller.js.map