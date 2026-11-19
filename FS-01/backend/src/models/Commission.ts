import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { TransferStatus } from '../types/index.js';

export interface ICommission extends Document {
  order: Types.ObjectId;
  vendor: Types.ObjectId;
  vendorOrderIndex: number;
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  vendorNetAmount: number;
  transferStatus: TransferStatus;
  razorpayTransferId?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorOrderIndex: { type: Number, required: true, default: 0 },
    grossAmount: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    vendorNetAmount: { type: Number, required: true, min: 0 },
    transferStatus: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
      index: true
    },
    razorpayTransferId: { type: String },
    processedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const Commission: Model<ICommission> = mongoose.model<ICommission>('Commission', CommissionSchema);
export default Commission;
