"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTypeformWebhook = void 0;
const crypto_1 = __importDefault(require("crypto"));
const validateTypeformWebhook = (req, res, next) => {
    // Skip validation if no secret is configured
    if (!process.env.TYPEFORM_WEBHOOK_SECRET) {
        return next();
    }
    const signature = req.headers["typeform-signature"];
    if (!signature) {
        return res.status(401).json({ error: "Missing webhook signature" });
    }
    try {
        const expectedSignature = crypto_1.default
            .createHmac("sha256", process.env.TYPEFORM_WEBHOOK_SECRET)
            .update(JSON.stringify(req.body))
            .digest("base64");
        if (signature !== `sha256=${expectedSignature}`) {
            return res.status(401).json({ error: "Invalid webhook signature" });
        }
        next();
    }
    catch (error) {
        console.error("Webhook validation error:", error);
        res.status(401).json({ error: "Signature validation failed" });
    }
};
exports.validateTypeformWebhook = validateTypeformWebhook;
//# sourceMappingURL=webhook-validation.js.map