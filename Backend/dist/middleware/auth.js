"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExistingAdmin = exports.authenticateAdmin = exports.authenticateUser = void 0;
const firebase_1 = require("../config/firebase");
const userprof_model_1 = __importDefault(require("../models/userprof.model"));
const admin_model_1 = __importDefault(require("../models/admin.model"));
// Fixed authenticateUser middleware
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Access denied. No token provided.' });
            return; // Exit function instead of returning response object
        }
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        const user = await userprof_model_1.default.findOne({ firebaseUid: decodedToken.uid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return; // Exit function instead of returning response object
        }
        req.user = user;
        next(); // Proceed to next middleware
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        // No need to return or call next after error response
    }
};
exports.authenticateUser = authenticateUser;
// Fixed authenticateAdmin middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Access denied. No token provided.' });
            return; // Exit function instead of returning response object
        }
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        const admin = await admin_model_1.default.findOne({ firebaseUid: decodedToken.uid, isActive: true });
        if (!admin) {
            res.status(403).json({ error: 'Admin access required' });
            return; // Exit function instead of returning response object
        }
        req.admin = admin;
        next(); // Proceed to next middleware
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        // No need to return or call next after error response
    }
};
exports.authenticateAdmin = authenticateAdmin;
// New middleware to check if user is already an admin
const checkExistingAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Access denied. No token provided.' });
            return;
        }
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        const existingAdmin = await admin_model_1.default.findOne({ firebaseUid: decodedToken.uid });
        if (existingAdmin) {
            res.status(400).json({ error: 'Admin already registered' });
            return;
        }
        // Add decoded token to request for use in controller
        req.user = { firebaseUid: decodedToken.uid, email: decodedToken.email };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.checkExistingAdmin = checkExistingAdmin;
// Fixed requirePersonalityTest middleware
// export const requirePersonalityTest = (req: AuthRequest, res: Response, next: NextFunction): void => {
//   if (!req.user?.personalityTestCompleted) {
//     res.status(403).json({ 
//       error: 'Personality test completion required',
//       message: 'Please complete the personality test before booking events'
//     });
//     return; // Exit function instead of returning response object
//   }
//   next(); // Proceed if test is completed
// };
//# sourceMappingURL=auth.js.map