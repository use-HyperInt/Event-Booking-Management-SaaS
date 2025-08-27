import Joi from "joi"

export const createPaymentOrderSchema = Joi.object({
  eventId: Joi.string().required(),
  numberOfSeats: Joi.number().integer().min(1).max(10).required(),
})

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  bookingId: Joi.string().required(),
})

export const paymentFailureSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  bookingId: Joi.string().required(),
  error: Joi.object().optional(),
})
