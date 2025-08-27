import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user.types';

const UserSchema = new Schema<IUser>({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  }, 
   lastName: {
    type: String,
    required: false,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  profileImage: {
    type: String
  },
  address: {
    street: String,
    city: {
      type: String,
      required: false
    },
    state: {
      type: String,
      required: false
    },
    country: {
      type: String,
      required: false,
      default: 'India'
    },
    pincode: {
      type: String,
      required: false
    }
  },
  eventsBooked: [{
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  pastEventsAttended: [{
    type: Schema.Types.ObjectId,
    ref: 'Event'
  }],
   invitedFriends: [{
    phoneNumber: {
      type: String,
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'joined'],
      default: 'pending'
    }
  }],
  personalityTestCompleted: {
    type: Boolean,
    default: false
  },
  personalityTestData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});



export default mongoose.model<IUser>('User', UserSchema);