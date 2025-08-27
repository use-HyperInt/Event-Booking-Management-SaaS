import express from 'express';
import type { RequestHandler } from 'express';
import { registerUser, getUserProfile, checkUserExists } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth';
import User from '../models/userprof.model';

const router = express.Router();

router.post('/register', registerUser as RequestHandler);
router.post('/check-user', checkUserExists as RequestHandler);
router.get('/profile', authenticateUser, getUserProfile as RequestHandler);

// Debug endpoints to check users
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      count: users.length,
      users: users.map(user => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        firebaseUid: user.firebaseUid,
        address: user.address,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Debug endpoint to find user by email
router.get('/debug/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    res.json({
      found: !!user,
      user: user || null
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Debug endpoint to find user by Firebase UID
router.get('/debug/firebase/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ firebaseUid: uid });
    res.json({
      found: !!user,
      user: user || null
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

export default router;