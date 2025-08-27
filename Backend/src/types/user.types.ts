import { Document, Types } from 'mongoose';

export interface IInvitedFriend {
  phoneNumber: string;
  invitedAt: Date;
}
export interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseUid: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
  gender?: string;
  dateOfBirth?: Date;
  profileImage?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  eventsBooked: Types.ObjectId[];
  pastEventsAttended: Types.ObjectId[];
  invitedFriends?: IInvitedFriend[]; // Add this line
  personalityTestCompleted: boolean;
  personalityTestData?: any;
  createdAt: Date;
  updatedAt: Date;
}
