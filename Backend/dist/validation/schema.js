"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteFriendSchema = exports.bookingSchema = exports.eventCreationSchema = exports.adminRegistrationSchema = exports.userRegistrationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.userRegistrationSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).required(),
    lastName: joi_1.default.string().min(2).max(50).optional(),
    phoneNumber: joi_1.default.string().pattern(/^[+]?[1-9]\d{1,14}$/).required(),
    email: joi_1.default.string().email().required(),
    gender: joi_1.default.string().valid('male', 'female', 'other').optional(),
    dateOfBirth: joi_1.default.date().max('now').optional(),
    firebaseUid: joi_1.default.string().required(),
    address: joi_1.default.object({
        street: joi_1.default.string().optional(),
        city: joi_1.default.string().optional(),
        state: joi_1.default.string().optional(),
        country: joi_1.default.string().default('India'),
        pincode: joi_1.default.string().pattern(/^\d{6}$/).optional()
    }).optional() // Make address completely optional for now
});
// New admin registration schema
exports.adminRegistrationSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required(),
    email: joi_1.default.string().email().required(),
    role: joi_1.default.string().valid('super_admin', 'admin', 'moderator').default('admin'),
    permissions: joi_1.default.array().items(joi_1.default.string().valid('create_events', 'edit_events', 'delete_events', 'manage_bookings', 'view_analytics', 'manage_users', 'manage_admins')).default(['create_events', 'edit_events', 'manage_bookings', 'view_analytics']),
    phoneNumber: joi_1.default.string().optional()
});
exports.eventCreationSchema = joi_1.default.object({
    eventId: joi_1.default.string().min(3).max(100).optional(),
    title: joi_1.default.string().min(3).max(200).required(),
    description: joi_1.default.string().min(10).max(2000).required(),
    understandContent: joi_1.default.string().min(10).max(2000).optional(),
    experienceTicketContent: joi_1.default.string().min(10).max(2000).optional(),
    category: joi_1.default.string().valid('conference', 'workshop', 'seminar', 'networking', 'entertainment', 'sports', 'social', 'dining', 'outdoor', 'cultural', 'other').required(),
    subCategory: joi_1.default.string().max(100).optional(),
    startTime: joi_1.default.date().greater('now').required(),
    endTime: joi_1.default.date().greater(joi_1.default.ref('startTime')).required(),
    capacity: joi_1.default.number().min(1).max(1000).required(),
    experienceTicketPrice: joi_1.default.number().min(0).required(),
    price: joi_1.default.number().min(0).required(), // curation fee
    discountedPrice: joi_1.default.number().min(0).optional(),
    hostId: joi_1.default.string().optional(),
    matchingTags: joi_1.default.array().items(joi_1.default.string().trim().max(50)).max(20).default([]),
    imageUrls: joi_1.default.array().items(joi_1.default.string().uri()).optional(), // Allow empty arrays for updates
    safetyInfo: joi_1.default.string().max(1000).optional(),
    rsvpDeadline: joi_1.default.date().less(joi_1.default.ref('startTime')).optional(),
    cancellationPolicy: joi_1.default.string().min(10).max(1000).optional(),
    feedbackEnabled: joi_1.default.boolean().default(true),
    status: joi_1.default.string().valid('CANCELLED', 'CONFIRMED', 'COMPLETED', 'UPCOMING').optional(),
    eventLocation: joi_1.default.object({
        venueName: joi_1.default.string().min(2).max(200).required(),
        lat: joi_1.default.number().min(-90).max(90).optional(),
        lng: joi_1.default.number().min(-180).max(180).optional(),
        address: joi_1.default.string().min(5).max(500).required()
    }).required()
});
exports.bookingSchema = joi_1.default.object({
    eventId: joi_1.default.string().hex().length(24).required(),
    numberOfSeats: joi_1.default.number().min(1).max(10).required(),
    amount: joi_1.default.number().min(0).optional() // Optional frontend-calculated amount
});
exports.inviteFriendSchema = joi_1.default.object({
    phoneNumber: joi_1.default.string()
        .pattern(/^[+]?[\d\s-()]+$/)
        .required()
        .messages({
        'string.pattern.base': 'Invalid phone number format',
        'any.required': 'Phone number is required'
    })
});
//# sourceMappingURL=schema.js.map