import { Document, Types } from 'mongoose';

export interface IEventLocation {
  venueName: string;
  lat?: number;
  lng?: number;
  address: string;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  eventId?: string;
  title: string;
  description: string;
  understandContent?: string;
  experienceTicketContent?: string;
  category: string;
  subCategory?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  experienceTicketPrice: number;
  price: number; // curation fee for third place
  discountedPrice?: number;
  hostId?: string;
  bookingCount: number;
  status: 'CANCELLED' | 'CONFIRMED' | 'COMPLETED' | 'UPCOMING';
  matchingTags: string[];
  imageUrls: string[];
  safetyInfo?: string;
  rsvpDeadline?: Date;
  cancellationPolicy?: string;
  feedbackEnabled: boolean;
  eventLocation: IEventLocation;
  attendeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}
