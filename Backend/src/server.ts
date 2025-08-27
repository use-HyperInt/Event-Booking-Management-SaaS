// server.ts
import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./config/db.config"

// Import routes
import authRoutes from "./routes/auth.routes"
import eventRoutes from "./routes/events.routes"
import adminRoutes from "./routes/admin.routes"
import personalityTestRoutes from "./routes/personality-test"
import bookingRoutes from "./routes/booking.routes"
import userRoutes from "./routes/user.routes"

// PAYMENT ROUTES
import paymentRoutes from "./routes/payment.routes"

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 8080

// Standard middleware for all non-webhook routes
app.use(cors())
app.use(helmet())
app.use(morgan("dev"))

app.use(
  "/api/payment/webhook",
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      ;(req as any).rawBody = buf.toString("utf8")
    },
  })
)

app.use(express.json())

// Debug route to test server
app.get("/debug", (req: Request, res: Response) => {
  res.json({ 
    message: "Server is working!", 
    timestamp: new Date().toISOString(),
    routes: ["/api/auth", "/api/events", "/api/admin", "/api/personality-test", "/api/booking", "/api/users", "/api/payment"]
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/personality-test", personalityTestRoutes)
app.use("/api/booking", bookingRoutes)
app.use("/api/users", userRoutes)
app.use("/api/payment", paymentRoutes)

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...")
  process.exit(0)
})
process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...")
  process.exit(0)
})
