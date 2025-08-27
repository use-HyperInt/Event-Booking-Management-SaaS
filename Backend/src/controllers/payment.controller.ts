import type { Request, Response } from "express"
import type { AuthRequest } from "../middleware/auth"
import { RazorpayService } from "../services/razorpay.service"
import Event from "../models/events.model"
import Booking from "../models/booking.model"
import Payment from "../models/payment.model"
import { bookingSchema } from "../validation/schema"

const razorpayService = new RazorpayService()

export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔥 CREATE PAYMENT ORDER REQUEST RECEIVED:', {
      body: req.body,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });

    const { error } = bookingSchema.validate(req.body)
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message })
    }    const { eventId, numberOfSeats, amount: frontendAmount } = req.body
    const userId = req.user._id

    // Log production payment creation
    if (razorpayService.isLive()) {
      console.log('🚨 PRODUCTION PAYMENT ORDER CREATION:', {
        userId: userId.toString(),
        eventId,
        numberOfSeats,
        frontendAmount,
        timestamp: new Date().toISOString()
      });
    }

    // Validate event
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }    if (event.status !== 'CONFIRMED' && event.status !== 'UPCOMING') {
      return res.status(400).json({ error: "Event is not available for booking" })
    }

    if (event.startTime < new Date()) {
      return res.status(400).json({ error: "Event has already started" })
    }

    // Check RSVP deadline
    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
      return res.status(400).json({ error: 'RSVP deadline has passed' })
    }    const availableSeats = event.capacity - event.attendeeCount;
    if (availableSeats < numberOfSeats) {
      return res.status(400).json({ error: "Not enough seats available" })
    }

    // Check if user already booked this event
    const existingBooking = await Booking.findOne({
      userId,
      eventId,
      bookingStatus: { $in: ["confirmed"] },
    })

    if (existingBooking) {
      return res.status(400).json({ error: "You have already booked this event" })
    }

    // Use frontend calculated amount if provided, otherwise calculate backend amount
    const backendCalculatedAmount = (event.experienceTicketPrice + event.price) * numberOfSeats
    const totalAmount = frontendAmount ? frontendAmount * numberOfSeats : backendCalculatedAmount
    const totalAmountPaise = totalAmount * 100

    console.log('💰 Amount calculation:', {
      frontendAmount,
      backendCalculatedAmount,
      numberOfSeats,
      finalTotalAmount: totalAmount,
      totalAmountPaise
    });

    // Create booking with pending payment status
    const booking = new Booking({
      userId,
      eventId,
      numberOfSeats,
      totalAmount,
      bookingStatus: "pending_payment",
      paymentStatus: "created",
    })

    await booking.save()    // Create Razorpay order
    const orderData = {
      amount: totalAmountPaise, // Amount in paise
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: (booking._id as string).toString(),
        eventId: eventId,
        userId: userId.toString(),
        numberOfSeats: numberOfSeats,
      },
    }

    const razorpayOrder = await razorpayService.createOrder(orderData)

    // Create payment record
    const payment = new Payment({
      bookingId: booking._id,
      userId,
      eventId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      status: "created",
    })

    await payment.save()    // Temporarily reserve seats (will be confirmed after payment)
    event.attendeeCount += numberOfSeats
    event.bookingCount += 1
    await event.save()

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        bookingId: booking._id,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        currency: razorpayOrder.currency,        event: {
          id: event._id,
          name: event.title,
          date: event.startTime,
          location: event.eventLocation,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    })
  } catch (error) {
    console.error("Payment order creation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔥 VERIFY PAYMENT REQUEST RECEIVED:', {
      body: req.body,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      console.log('❌ Missing payment verification data');
      return res.status(400).json({ error: "Missing payment verification data" })
    }

    // Log production payment verification
    if (razorpayService.isLive()) {
      console.log('🚨 PRODUCTION PAYMENT VERIFICATION:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        bookingId,
        timestamp: new Date().toISOString()
      });
    }

    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })

    if (!isValidSignature) {
      // Critical security alert for production
      if (razorpayService.isLive()) {
        console.error('🚨 PRODUCTION PAYMENT SIGNATURE VERIFICATION FAILED:', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          bookingId,
          timestamp: new Date().toISOString()
        });
      }
      return res.status(400).json({ error: "Invalid payment signature" })
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id })
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" })
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate("eventId")
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Verify booking belongs to user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access to booking" })
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id)

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id
    payment.razorpaySignature = razorpay_signature
    payment.status = "paid"
    payment.paymentMethod = paymentDetails.method
    payment.paidAt = new Date()
    await payment.save()    // Update booking status
    booking.bookingStatus = "waitlist"
    booking.paymentStatus = "paid"
    await booking.save()

    // Add booking to user's booked events
    if (!req.user.eventsBooked.includes(booking._id)) {
      req.user.eventsBooked.push(booking._id)
      await req.user.save()
    }

    // Log successful production payment
    if (razorpayService.isLive()) {
      console.log('✅ PRODUCTION PAYMENT SUCCESSFUL:', {
        bookingId: booking._id,
        paymentId: payment._id,
        amount: payment.amount,
        paymentMethod: paymentDetails.method,
        userId: req.user._id.toString(),
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: "Payment verified and booking confirmed successfully",
      data: {
        bookingId: booking._id,
        paymentId: payment._id,
        bookingStatus: booking.bookingStatus,
        paymentStatus: payment.status,
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const handlePaymentFailure = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, bookingId, error: paymentError } = req.body

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id })
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" })
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Update payment status
    payment.status = "failed"
    payment.failedAt = new Date()
    await payment.save()    // Update booking status
    booking.bookingStatus = "cancelled"
    booking.paymentStatus = "failed"
    await booking.save()

    // Release reserved seats
    const event = await Event.findById(booking.eventId)
    if (event) {
      event.attendeeCount -= booking.numberOfSeats
      event.bookingCount -= 1
      await event.save()
    }

    res.json({
      success: true,
      message: "Payment failure handled successfully",
      data: {
        bookingId: booking._id,
        paymentId: payment._id,
        bookingStatus: booking.bookingStatus,
        paymentStatus: payment.status,
      },
    })
  } catch (error) {
    console.error("Payment failure handling error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params

    const booking = await Booking.findById(bookingId).populate("eventId")
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    // Verify booking belongs to user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access to booking" })
    }

    const payment = await Payment.findOne({ bookingId })

    res.json({
      success: true,
      data: {
        booking: {
          id: booking._id,
          status: booking.bookingStatus,
          numberOfSeats: booking.numberOfSeats,
          totalAmount: booking.totalAmount,
          createdAt: booking.createdAt,
        },
        payment: payment
          ? {
              id: payment._id,
              status: payment.status,
              amount: payment.amount,
              razorpayOrderId: payment.razorpayOrderId,
              razorpayPaymentId: payment.razorpayPaymentId,
              paidAt: payment.paidAt,
              failedAt: payment.failedAt,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Payment status error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Webhook handler for Razorpay events
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    console.log('🔥 RAZORPAY WEBHOOK RECEIVED:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const signature = req.headers["x-razorpay-signature"] as string

    if (!signature) {
      console.log('⚠️ Missing webhook signature - continuing without verification for testing');
    } else {
      // Verify webhook signature (skip if no secret configured)
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (webhookSecret) {
        const isValidSignature = razorpayService.verifyWebhookSignature(JSON.stringify(req.body), signature)
        if (!isValidSignature) {
          console.log('❌ Invalid webhook signature');
          return res.status(400).json({ error: "Invalid webhook signature" })
        }
      } else {
        console.log('⚠️ No webhook secret configured - skipping signature verification');
      }
    }

    const { event, payload } = req.body

    console.log(`✅ Processing Razorpay webhook event: ${event}`);

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity)
        break
      case "payment.failed":
        await handlePaymentFailedWebhook(payload.payment.entity)
        break
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`)
    }

    res.status(200).json({ message: "Webhook processed successfully" })
  } catch (error) {
    console.error("❌ Webhook processing error:", error)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

// Helper functions for webhook processing
async function handlePaymentCaptured(paymentData: any) {
  try {
    const payment = await Payment.findOne({ razorpayOrderId: paymentData.order_id })
    if (!payment) {
      console.error(`Payment not found for order: ${paymentData.order_id}`)
      return
    }

    if (payment.status !== "paid") {
      payment.status = "paid"
      payment.razorpayPaymentId = paymentData.id
      payment.paymentMethod = paymentData.method
      payment.paidAt = new Date(paymentData.created_at * 1000)
      await payment.save()      // Update booking status
      const booking = await Booking.findById(payment.bookingId)
      if (booking && booking.bookingStatus !== "confirmed") {
        booking.bookingStatus = "confirmed"
        booking.paymentStatus = "paid"
        await booking.save()
      }
    }
  } catch (error) {
    console.error("Payment captured webhook error:", error)
  }
}

async function handlePaymentFailedWebhook(paymentData: any) {
  try {
    const payment = await Payment.findOne({ razorpayOrderId: paymentData.order_id })
    if (!payment) {
      console.error(`Payment not found for order: ${paymentData.order_id}`)
      return
    }

    if (payment.status !== "failed") {
      payment.status = "failed"
      payment.failedAt = new Date()
      await payment.save()      // Update booking status and release seats
      const booking = await Booking.findById(payment.bookingId)
      if (booking && booking.bookingStatus !== "cancelled") {
        booking.bookingStatus = "cancelled"
        booking.paymentStatus = "failed"
        await booking.save()// Release seats
        const event = await Event.findById(booking.eventId)
        if (event) {
          event.attendeeCount -= booking.numberOfSeats
          event.bookingCount -= 1
          await event.save()
        }
      }
    }
  } catch (error) {
    console.error("Payment failed webhook error:", error)
  }
}
