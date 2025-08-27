"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentFailureSchema = exports.verifyPaymentSchema = exports.createPaymentOrderSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createPaymentOrderSchema = joi_1.default.object({
    eventId: joi_1.default.string().required(),
    numberOfSeats: joi_1.default.number().integer().min(1).max(10).required(),
});
exports.verifyPaymentSchema = joi_1.default.object({
    razorpay_order_id: joi_1.default.string().required(),
    razorpay_payment_id: joi_1.default.string().required(),
    razorpay_signature: joi_1.default.string().required(),
    bookingId: joi_1.default.string().required(),
});
exports.paymentFailureSchema = joi_1.default.object({
    razorpay_order_id: joi_1.default.string().required(),
    bookingId: joi_1.default.string().required(),
    error: joi_1.default.object().optional(),
});
//# sourceMappingURL=payment.schema.js.map