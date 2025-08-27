import mongoose, { Schema } from 'mongoose';
import { IEvent, IEventLocation } from '../types/events.types';

const EventLocationSchema = new Schema<IEventLocation>({
  venueName: {
    type: String,
    required: true,
    trim: true
  },
  lat: {
    type: Number,
    required: false
  },
  lng: {
    type: Number,
    required: false
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const EventSchema = new Schema<IEvent>({
  eventId: {
    type: String,
    required: false,
    unique: true,
    sparse: true, 
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  understandContent: {
    type: String,
    required: false
  },
  experienceTicketContent: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: true,
    enum: ['conference', 'workshop', 'seminar', 'networking', 'entertainment', 'sports', 'social', 'dining', 'outdoor', 'cultural', 'other']
  },
  subCategory: {
    type: String,
    required: false
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  experienceTicketPrice: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: {
    type: Number,
    required: false,
    min: 0
  },
  hostId: {
    type: String,
    required: false
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['CANCELLED', 'CONFIRMED', 'COMPLETED', 'UPCOMING'],
    default: 'UPCOMING'
  },
  matchingTags: [{
    type: String,
    trim: true
  }],
  imageUrls: [{
    type: String,
    required: true
  }],
  safetyInfo: {
    type: String,
    required: false
  },
  rsvpDeadline: {
    type: Date,
    required: false
  },
  cancellationPolicy: {
    type: String,
    required: false
  },
  feedbackEnabled: {
    type: Boolean,
    default: true
  },
  eventLocation: {
    type: EventLocationSchema,
    required: true
  },
  attendeeCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});


// Pre-save middleware to generate eventId if not provided
EventSchema.pre('save', function(next) {
  if (!this.eventId) {
    // Generate a unique eventId using timestamp and random string
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.eventId = `evt_${timestamp}_${randomStr}`;
  }
  next();
});

// // Indexes for better query performance
// EventSchema.index({ eventId: 1 });
// EventSchema.index({ status: 1, startTime: 1 });
// EventSchema.index({ category: 1, status: 1 });
// EventSchema.index({ hostId: 1 });
// EventSchema.index({ matchingTags: 1 });

export default mongoose.model<IEvent>('Event', EventSchema);
