// payment.routes.ts
import express from "express"
import type { RequestHandler } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus,
  handleRazorpayWebhook,
} from "../controllers/payment.controller"
import { authenticateUser} from "../middleware/auth"

const router = express.Router()

// Debug endpoint to test if payment routes are working
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Payment routes are working", 
    timestamp: new Date().toISOString(),
    razorpayConfigured: !!process.env.RAZORPAY_KEY_ID
  });
});

// Create payment order
router.post("/create-order", authenticateUser, createPaymentOrder as RequestHandler)

// Verify payment (after checkout)
router.post("/verify", authenticateUser, verifyPayment as RequestHandler)

// Handle payment failure
router.post("/failure", authenticateUser, handlePaymentFailure as RequestHandler)

// Get payment status
router.get("/status/:bookingId", authenticateUser, getPaymentStatus as RequestHandler)

// **Razorpay webhook** (no auth middleware)
router.post("/webhook", handleRazorpayWebhook as RequestHandler)

export default router
