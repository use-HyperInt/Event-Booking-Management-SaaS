import { Document, Types } from 'mongoose';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}