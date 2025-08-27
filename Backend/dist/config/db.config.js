"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        const connectionString = process.env.MONGODB_URI;
        if (!connectionString) {
            throw new Error('MONGODB_URI environment variable not found');
        }
        await mongoose_1.default.connect(connectionString);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.config.js.map