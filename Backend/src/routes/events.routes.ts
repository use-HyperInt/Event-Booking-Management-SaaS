import express from 'express';
import { getEvents, getEventById, bookEvent } from '../controllers/event.controller';
import { authenticateUser } from '../middleware/auth';
import type { RequestHandler } from 'express';  

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById as RequestHandler);
router.post('/book', authenticateUser, bookEvent as RequestHandler);

export default router;
