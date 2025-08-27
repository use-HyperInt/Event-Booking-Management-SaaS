import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).optional(),
  phoneNumber: Joi.string().pattern(/^[+]?[1-9]\d{1,14}$/).required(),
  email: Joi.string().email().required(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  firebaseUid: Joi.string().required(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().default('India'),
    pincode: Joi.string().pattern(/^\d{6}$/).optional()
  }).optional() // Make address completely optional for now
});

// New admin registration schema
export const adminRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(), 
  role: Joi.string().valid('super_admin', 'admin', 'moderator').default('admin'),
  permissions: Joi.array().items(
    Joi.string().valid(
      'create_events',
      'edit_events',
      'delete_events',
      'manage_bookings',
      'view_analytics',
      'manage_users',
      'manage_admins'
    )
  ).default(['create_events', 'edit_events', 'manage_bookings', 'view_analytics']),
  phoneNumber: Joi.string().optional()
});


export const eventCreationSchema = Joi.object({
  eventId: Joi.string().min(3).max(100).optional(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  understandContent: Joi.string().min(10).max(2000).optional(),
  experienceTicketContent: Joi.string().min(10).max(2000).optional(),
  category: Joi.string().valid('conference', 'workshop', 'seminar', 'networking', 'entertainment', 'sports', 'social', 'dining', 'outdoor', 'cultural', 'other').required(),
  subCategory: Joi.string().max(100).optional(),
  startTime: Joi.date().greater('now').required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required(),
  capacity: Joi.number().min(1).max(1000).required(),
  experienceTicketPrice: Joi.number().min(0).required(),
  price: Joi.number().min(0).required(), // curation fee
  discountedPrice: Joi.number().min(0).optional(),
  hostId: Joi.string().optional(),
  matchingTags: Joi.array().items(Joi.string().trim().max(50)).max(20).default([]),
  imageUrls: Joi.array().items(Joi.string().uri()).optional(), // Allow empty arrays for updates
  safetyInfo: Joi.string().max(1000).optional(),
  rsvpDeadline: Joi.date().less(Joi.ref('startTime')).optional(),
  cancellationPolicy: Joi.string().min(10).max(1000).optional(),
  feedbackEnabled: Joi.boolean().default(true),
  status: Joi.string().valid('CANCELLED', 'CONFIRMED', 'COMPLETED', 'UPCOMING').optional(),
  eventLocation: Joi.object({
    venueName: Joi.string().min(2).max(200).required(),
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().min(5).max(500).required()
  }).required()
});
export const bookingSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required(),
  numberOfSeats: Joi.number().min(1).max(10).required(),
  amount: Joi.number().min(0).optional() // Optional frontend-calculated amount
});

export const inviteFriendSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[+]?[\d\s-()]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'Phone number is required'
    })
});