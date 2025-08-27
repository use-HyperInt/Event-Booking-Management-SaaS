// models/booking.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  numberOfSeats: number;
  totalAmount: number;
  bookingStatus: "waitlist" | "pending_payment" | "confirmed" | "cancelled";
  razorpayOrderId?: string;
  paymentStatus?: "created" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    numberOfSeats: { type: Number, required: true },
    totalAmount: { type: Number, required: true },    bookingStatus: {
      type: String,
      enum: ["waitlist", "pending_payment", "confirmed", "cancelled"],
      default: "waitlist",
    },

    razorpayOrderId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["created", "paid", "failed"],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', bookingSchema);
