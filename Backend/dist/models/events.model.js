"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const EventLocationSchema = new mongoose_1.Schema({
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
const EventSchema = new mongoose_1.Schema({
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
EventSchema.pre('save', function (next) {
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
exports.default = mongoose_1.default.model('Event', EventSchema);
//# sourceMappingURL=events.model.js.map