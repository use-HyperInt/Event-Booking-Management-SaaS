"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_config_1 = __importDefault(require("./config/db.config"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const events_routes_1 = __importDefault(require("./routes/events.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const personality_test_1 = __importDefault(require("./routes/personality-test"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
// PAYMENT ROUTES
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
dotenv_1.default.config();
(0, db_config_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Standard middleware for all non-webhook routes
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use("/api/payment/webhook", express_1.default.json({
    verify: (req, _res, buf) => {
        ;
        req.rawBody = buf.toString("utf8");
    },
}));
app.use(express_1.default.json());
// Debug route to test server
app.get("/debug", (req, res) => {
    res.json({
        message: "Server is working!",
        timestamp: new Date().toISOString(),
        routes: ["/api/auth", "/api/events", "/api/admin", "/api/personality-test", "/api/booking", "/api/users", "/api/payment"]
    });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/events", events_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/personality-test", personality_test_1.default);
app.use("/api/booking", booking_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/payment", payment_routes_1.default);
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    process.exit(0);
});
process.on("SIGINT", () => {
    console.log("SIGINT received. Shutting down gracefully...");
    process.exit(0);
});
//# sourceMappingURL=server.js.map