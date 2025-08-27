
// src/routes/user.ts
import express from 'express';
import { updateProfile, getProfile, submitPersonalityTest, listAllUsers, checkDbConnection , inviteFriend , getInvitedFriends } from '../controllers/user.controller';
import { authenticateUser } from '../middleware/auth';
import type { RequestHandler } from 'express';

const router = express.Router();

router.use(authenticateUser);

router.get('/profile', getProfile as RequestHandler);
router.put('/profile', updateProfile as RequestHandler);
router.post('/personality-test', submitPersonalityTest as RequestHandler);

// Debug routes (should be removed in production)
router.get('/debug/list-all', listAllUsers);
router.get('/debug/db-check', checkDbConnection);
router.post('/invite-friend', inviteFriend as RequestHandler);
router.get('/invited-friends', getInvitedFriends as RequestHandler);

export default router;
