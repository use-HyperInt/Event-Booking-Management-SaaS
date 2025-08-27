"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_controller_1 = require("../controllers/event.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', event_controller_1.getEvents);
router.get('/:id', event_controller_1.getEventById);
router.post('/book', auth_1.authenticateUser, event_controller_1.bookEvent);
exports.default = router;
//# sourceMappingURL=events.routes.js.map