"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const userprof_model_1 = __importDefault(require("../models/userprof.model"));
const router = express_1.default.Router();
router.post('/register', auth_controller_1.registerUser);
router.post('/check-user', auth_controller_1.checkUserExists);
router.get('/profile', auth_1.authenticateUser, auth_controller_1.getUserProfile);
// Debug endpoints to check users
router.get('/debug/users', async (req, res) => {
    try {
        const users = await userprof_model_1.default.find({});
        res.json({
            count: users.length,
            users: users.map(user => ({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                firebaseUid: user.firebaseUid,
                address: user.address,
                createdAt: user.createdAt
            }))
        });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
// Debug endpoint to find user by email
router.get('/debug/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await userprof_model_1.default.findOne({ email });
        res.json({
            found: !!user,
            user: user || null
        });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
// Debug endpoint to find user by Firebase UID
router.get('/debug/firebase/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await userprof_model_1.default.findOne({ firebaseUid: uid });
        res.json({
            found: !!user,
            user: user || null
        });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map