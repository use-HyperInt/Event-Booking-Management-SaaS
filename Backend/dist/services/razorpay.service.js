"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
// src/services/razorpay.service.ts
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
class RazorpayService {
    constructor() {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        // Validate required environment variables
        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
        }
        // Check if we're in live mode
        this.isLiveMode = keyId.startsWith('rzp_live_');
        // Log environment mode (but not the actual keys)
        console.log(`Razorpay Service initialized in ${this.isLiveMode ? 'LIVE' : 'TEST'} mode`);
        if (this.isLiveMode) {
            console.log('⚠️  PRODUCTION MODE: Real payments will be processed!');
        }
        this.razorpay = new razorpay_1.default({
            key_id: keyId,
            key_secret: keySecret,
        });
    } /**
     * Create a new Razorpay Order.
     * amount: pass the total amount in paise (smallest currency unit)
     * receipt: some unique string (e.g. `booking_<bookingId>`).
     * notes: optional metadata (we use bookingId, userId, etc.).
     */
    async createOrder(data) {
        // Validate minimum amount (Razorpay minimum is 100 paise = ₹1)
        if (data.amount < 100) {
            throw new Error('Minimum order amount is ₹1 (100 paise)');
        }
        const options = {
            amount: data.amount, // amount is already in paise
            currency: "INR",
            receipt: data.receipt,
            payment_capture: 1, // auto-capture
            notes: data.notes || {},
        };
        console.log(`Creating Razorpay order in ${this.isLiveMode ? 'LIVE' : 'TEST'} mode:`, {
            amount: data.amount,
            receipt: data.receipt,
            currency: options.currency
        });
        try {
            const order = await this.razorpay.orders.create(options);
            console.log(`Order created successfully: ${order.id}`);
            return order;
        }
        catch (error) {
            console.error('Razorpay order creation failed:', error);
            throw new Error(`Failed to create payment order: ${error.message}`);
        }
    }
    /**
     * Verifies the signature sent by Razorpay on the client-side checkout completion.
     * EXPECTS: razorpay_order_id, razorpay_payment_id, razorpay_signature.
     * Returns true if signature is valid, false otherwise.
     */
    verifyPaymentSignature(data) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error('Missing required payment verification data');
            return false;
        }
        try {
            // The signature is HMAC_SHA256 of order_id + "|" + payment_id, keyed by SECRET
            const hmac = crypto_1.default.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const generatedSignature = hmac.digest("hex");
            const isValid = generatedSignature === razorpay_signature;
            console.log(`Payment signature verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
            if (!isValid && this.isLiveMode) {
                console.error('⚠️  PRODUCTION PAYMENT SIGNATURE MISMATCH:', {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id
                });
            }
            return isValid;
        }
        catch (error) {
            console.error('Payment signature verification error:', error);
            return false;
        }
    } /**
     * Fetch full payment details from Razorpay, given a razorpay_payment_id.
     * Returns the payment entity JSON (including method, status, created_at, etc.).
     */
    async getPaymentDetails(razorpayPaymentId) {
        try {
            console.log(`Fetching payment details for: ${razorpayPaymentId}`);
            const payment = await this.razorpay.payments.fetch(razorpayPaymentId);
            console.log(`Payment details fetched successfully: ${payment.id} - ${payment.status}`);
            return payment;
        }
        catch (error) {
            console.error('Failed to fetch payment details:', error);
            throw new Error(`Failed to fetch payment details: ${error.message}`);
        }
    }
    /**
     * Verifies the signature on a webhook payload.
     * Razorpay sends X-Razorpay-Signature in headers, which is hex(HMAC_SHA256(secret, rawBody)).
     * rawBody must be the exact JSON string (no whitespace changes) that Razorpay POSTed.
     */
    verifyWebhookSignature(rawBody, razorpaySignature) {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return false;
        }
        try {
            const hmac = crypto_1.default.createHmac("sha256", webhookSecret);
            hmac.update(rawBody);
            const expectedSignature = hmac.digest("hex");
            const isValid = expectedSignature === razorpaySignature;
            console.log(`Webhook signature verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
            if (!isValid && this.isLiveMode) {
                console.error('⚠️  PRODUCTION WEBHOOK SIGNATURE MISMATCH - POSSIBLE SECURITY ISSUE');
            }
            return isValid;
        }
        catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }
    /**
     * Get current environment mode
     */
    getMode() {
        return this.isLiveMode ? 'live' : 'test';
    }
    /**
     * Check if service is running in live mode
     */
    isLive() {
        return this.isLiveMode;
    }
}
exports.RazorpayService = RazorpayService;
//# sourceMappingURL=razorpay.service.js.map