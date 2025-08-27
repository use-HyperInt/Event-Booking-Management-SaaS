import type { Request, Response, NextFunction } from "express"
import crypto from "crypto"

export const validateTypeformWebhook = (req: Request, res: Response, next: NextFunction) => {
  // Skip validation if no secret is configured
  if (!process.env.TYPEFORM_WEBHOOK_SECRET) {
    return next()
  }

  const signature = req.headers["typeform-signature"] as string

  if (!signature) {
    return res.status(401).json({ error: "Missing webhook signature" })
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.TYPEFORM_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("base64")

    if (signature !== `sha256=${expectedSignature}`) {
      return res.status(401).json({ error: "Invalid webhook signature" })
    }

    next()
  } catch (error) {
    console.error("Webhook validation error:", error)
    res.status(401).json({ error: "Signature validation failed" })
  }
}
