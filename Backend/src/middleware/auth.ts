import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import User from '../models/userprof.model';
import Admin from '../models/admin.model';

export interface AuthRequest extends Request {
  user?: any;
  admin?: any;
}

// Fixed authenticateUser middleware
export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return; // Exit function instead of returning response object
    }

    const decodedToken = await auth.verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return; // Exit function instead of returning response object
    }

    req.user = user;
    next(); // Proceed to next middleware
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    // No need to return or call next after error response
  }
};

// Fixed authenticateAdmin middleware
export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return; // Exit function instead of returning response object
    }

    const decodedToken = await auth.verifyIdToken(token);
    const admin = await Admin.findOne({ firebaseUid: decodedToken.uid, isActive: true });

    if (!admin) {
      res.status(403).json({ error: 'Admin access required' });
      return; // Exit function instead of returning response object
    }

    req.admin = admin;
    next(); // Proceed to next middleware
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    // No need to return or call next after error response
  }
};

// New middleware to check if user is already an admin
export const checkExistingAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);
    const existingAdmin = await Admin.findOne({ firebaseUid: decodedToken.uid });

    if (existingAdmin) {
      res.status(400).json({ error: 'Admin already registered' });
      return;
    }

    // Add decoded token to request for use in controller
    req.user = { firebaseUid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Fixed requirePersonalityTest middleware
// export const requirePersonalityTest = (req: AuthRequest, res: Response, next: NextFunction): void => {
//   if (!req.user?.personalityTestCompleted) {
//     res.status(403).json({ 
//       error: 'Personality test completion required',
//       message: 'Please complete the personality test before booking events'
//     });
//     return; // Exit function instead of returning response object
//   }
//   next(); // Proceed if test is completed
// };