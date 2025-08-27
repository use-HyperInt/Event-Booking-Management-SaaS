import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGODB_URI;

    if (!connectionString) {
      throw new Error('MONGODB_URI environment variable not found');
    }

    await mongoose.connect(connectionString);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export default connectDB;