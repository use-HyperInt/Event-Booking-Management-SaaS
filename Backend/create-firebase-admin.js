// Manual Firebase User Creation Guide
// Since the service account credentials need to be updated, follow these steps:

/*
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: thirdplace-3f85e
3. Go to Authentication > Users
4. Click "Add user"
5. Create user with:
   - Email: admin@thethirdplace.com
   - Password: AdminPassword123!
6. After creating, copy the UID and update MongoDB

Alternatively, you can create the user through the frontend signup flow
and then manually update their role in the database.
*/

const mongoose = require('mongoose');
require('dotenv').config();

async function updateAdminWithFirebaseUID() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const AdminSchema = new mongoose.Schema({
      firebaseUid: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
      permissions: [String],
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    
    const Admin = mongoose.model('Admin', AdminSchema);
    
    // Prompt for Firebase UID
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter the Firebase UID for admin@thethirdplace.com: ', async (firebaseUid) => {
      if (!firebaseUid.trim()) {
        console.log('No UID provided. Exiting...');
        rl.close();
        await mongoose.disconnect();
        return;
      }
      
      const updated = await Admin.findOneAndUpdate(
        { email: 'admin@thethirdplace.com' },
        { firebaseUid: firebaseUid.trim() },
        { new: true }
      );
      
      if (updated) {
        console.log('Admin updated successfully:', updated);
        console.log('\nAdmin can now login with:');
        console.log('Email: admin@thethirdplace.com');
        console.log('Password: AdminPassword123!');
      } else {
        console.log('Admin not found in database');
      }
      
      rl.close();
      await mongoose.disconnect();
    });
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

// For now, let's use a development approach
async function setupDevAdmin() {
  try {
    console.log('Setting up development admin...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const AdminSchema = new mongoose.Schema({
      firebaseUid: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
      permissions: [String],
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    
    const Admin = mongoose.model('Admin', AdminSchema);
    
    // Check current admin
    const currentAdmin = await Admin.findOne({ email: 'admin@thethirdplace.com' });
    console.log('Current admin:', currentAdmin);
    
    console.log('\n=== SETUP INSTRUCTIONS ===');
    console.log('1. Create a Firebase user manually in Firebase Console');
    console.log('2. Email: admin@thethirdplace.com');
    console.log('3. Password: AdminPassword123!');
    console.log('4. Copy the Firebase UID');
    console.log('5. Run: node create-firebase-admin.js');
    console.log('6. Enter the UID when prompted');
    console.log('===========================\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

// Run the development setup
setupDevAdmin();
