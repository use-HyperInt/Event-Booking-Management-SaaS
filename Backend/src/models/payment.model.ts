import mongoose, { type Document, Schema } from "mongoose"

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  eventId: mongoose.Types.ObjectId
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  amount: number
  currency: string
  status: "created" | "pending" | "paid" | "failed" | "refunded"
  paymentMethod?: string
  refundId?: string
  refundAmount?: number
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  failedAt?: Date
  refundedAt?: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "refunded"],
      default: "created",
    },
    paymentMethod: {
      type: String,
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
    },
    paidAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)


export default mongoose.model<IPayment>("Payment", paymentSchema)
