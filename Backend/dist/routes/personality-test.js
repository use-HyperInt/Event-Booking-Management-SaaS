"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const personalitytest_controller_1 = require("../controllers/personalitytest.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// User endpoints
router.post('/submit', auth_1.authenticateUser, personalitytest_controller_1.submitPersonalityTest);
router.get('/status', auth_1.authenticateUser, personalitytest_controller_1.getPersonalityTestStatus);
// Webhook endpoint (no auth required - Typeform calls this)
router.post('/webhook', personalitytest_controller_1.handleTypeformWebhook);
// Admin endpoints for managing Typeform integration
router.post('/admin/sync', auth_1.authenticateAdmin, personalitytest_controller_1.syncTypeformResponses);
router.get('/admin/webhook-status', auth_1.authenticateAdmin, personalitytest_controller_1.getWebhookStatus);
router.post('/admin/setup-webhook', auth_1.authenticateAdmin, personalitytest_controller_1.setupWebhook);
exports.default = router;
//# sourceMappingURL=personality-test.js.map