"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.ts
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateUser);
router.get('/profile', user_controller_1.getProfile);
router.put('/profile', user_controller_1.updateProfile);
router.post('/personality-test', user_controller_1.submitPersonalityTest);
// Debug routes (should be removed in production)
router.get('/debug/list-all', user_controller_1.listAllUsers);
router.get('/debug/db-check', user_controller_1.checkDbConnection);
router.post('/invite-friend', user_controller_1.inviteFriend);
router.get('/invited-friends', user_controller_1.getInvitedFriends);
exports.default = router;
//# sourceMappingURL=user.routes.js.map