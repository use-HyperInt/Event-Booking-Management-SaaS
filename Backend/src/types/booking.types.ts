import { Document, Types } from 'mongoose';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDate: Date;
  numberOfSeats: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  attendanceStatus: 'registered' | 'attended' | 'no-show';
  createdAt: Date;
  updatedAt: Date;
}
