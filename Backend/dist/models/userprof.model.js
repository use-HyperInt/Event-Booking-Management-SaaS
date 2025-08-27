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
const UserSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Booking'
        }],
    pastEventsAttended: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=userprof.model.js.map