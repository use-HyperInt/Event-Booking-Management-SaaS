"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// payment.routes.ts
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
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
router.post("/create-order", auth_1.authenticateUser, payment_controller_1.createPaymentOrder);
// Verify payment (after checkout)
router.post("/verify", auth_1.authenticateUser, payment_controller_1.verifyPayment);
// Handle payment failure
router.post("/failure", auth_1.authenticateUser, payment_controller_1.handlePaymentFailure);
// Get payment status
router.get("/status/:bookingId", auth_1.authenticateUser, payment_controller_1.getPaymentStatus);
// **Razorpay webhook** (no auth middleware)
router.post("/webhook", payment_controller_1.handleRazorpayWebhook);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map