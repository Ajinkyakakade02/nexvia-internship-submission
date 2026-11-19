import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { OnboardingStatus } from '../types/index.js';

export interface IVendorProfile extends Document {
  user: Types.ObjectId;
  businessName: string;
  businessDescription?: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  gstNumber?: string;
  onboardingStatus: OnboardingStatus;
  adminNotes?: string;
  razorpayLinkedAccountId?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorProfileSchema = new Schema<IVendorProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    businessDescription: { type: String, trim: true },
    businessEmail: { type: String, required: true, lowercase: true, trim: true },
    businessPhone: { type: String, required: true, trim: true },
    businessAddress: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true },
    onboardingStatus: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.PENDING
    },
    adminNotes: { type: String },
    razorpayLinkedAccountId: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

VendorProfileSchema.index({ user: 1 }, { unique: true });
VendorProfileSchema.index({ onboardingStatus: 1 });

export const VendorProfile: Model<IVendorProfile> = mongoose.model<IVendorProfile>(
  'VendorProfile',
  VendorProfileSchema
);
export default VendorProfile;
