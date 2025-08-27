import express from 'express';
import { 
  submitPersonalityTest, 
  getPersonalityTestStatus, 
  handleTypeformWebhook,
  syncTypeformResponses,
  getWebhookStatus,
  setupWebhook
} from '../controllers/personalitytest.controller';
import { authenticateUser, authenticateAdmin } from '../middleware/auth';
import type { RequestHandler } from 'express';

const router = express.Router();

// User endpoints
router.post('/submit', authenticateUser, submitPersonalityTest as RequestHandler);
router.get('/status', authenticateUser, getPersonalityTestStatus);

// Webhook endpoint (no auth required - Typeform calls this)
router.post('/webhook', handleTypeformWebhook  as RequestHandler);

// Admin endpoints for managing Typeform integration
router.post('/admin/sync', authenticateAdmin, syncTypeformResponses);
router.get('/admin/webhook-status', authenticateAdmin, getWebhookStatus);
router.post('/admin/setup-webhook', authenticateAdmin, setupWebhook  as RequestHandler);

export default router;