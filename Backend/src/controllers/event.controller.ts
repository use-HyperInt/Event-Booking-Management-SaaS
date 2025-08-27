import { Request, Response } from "express";
import Event from "../models/events.model";
import Booking from "../models/booking.model";
import Payment from "../models/payment.model";
import { AuthRequest } from "../middleware/auth";
import { bookingSchema } from "../validation/schema";
import { RazorpayService } from "../services/razorpay.service";

const razorpayService = new RazorpayService();

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, search, status, location } = req.query;
    
    const filter: any = { 
      status: status || { $in: ['CONFIRMED', 'UPCOMING'] },
      startTime: { $gte: new Date() }
    };
    
    if (category) filter.category = category;
    if (location) filter['eventLocation.venueName'] = new RegExp(location as string, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
        { matchingTags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }    const events = await Event.find(filter)
      .sort({ startTime: 1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bookEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // 1) Validate input
    const { error } = bookingSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { eventId, numberOfSeats } = req.body;
    const userId = req.user._id.toString();

    // 2) Load event
    const event = await Event.findById(eventId).lean();
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
    const already = await Booking.findOne({
      userId,
      eventId,
      bookingStatus: { $in: [ "confirmed"] },
    });
    if (already) {
      res.status(400).json({ error: "You have already booked this event" });
      return;
    }

    // 6) Compute total
    const totalAmountRs = (event.experienceTicketPrice + event.price) * numberOfSeats;
    const totalAmountPaise = totalAmountRs * 100;

    // 7) Create booking
    const booking = await Booking.create({
      userId,
      eventId,
      numberOfSeats,
      totalAmount: totalAmountRs,
      bookingStatus: "pending_payment",
    });

    // 8) Atomically update event counts
    await Event.findByIdAndUpdate(eventId, {
      $inc: {
        attendeeCount: numberOfSeats,
        bookingCount: 1,
      }
    });

    // 9) Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: totalAmountPaise,  // paise
      receipt: `booking_${booking._id}`,
      notes: { bookingId : booking._id as string, eventId, userId, numberOfSeats },
    });

    // 10) Save payment record
    await Payment.create({
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
        razorpayKeyId: process.env.RAZORPAY_KEY_ID!,
        event: {
          id: event._id,
          name: event.title,
          date: event.startTime,
          location: event.eventLocation,
        },
      },
    });
  } catch (err) {
    console.error("Booking error:", err);
  }
};