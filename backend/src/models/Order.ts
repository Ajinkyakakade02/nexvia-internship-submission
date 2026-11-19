import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentStatus,
  IAddress,
  IVendorOrder,
  IVendorOrderItem,
  IStatusHistory
} from '../types/index.js';

export interface IOrderItem {
  product: Types.ObjectId;
  vendor: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface IOrder extends Document {
  customer: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingCost: number;
  tax: number;
  total: number;
  payment?: Types.ObjectId;
  paymentStatus: PaymentStatus;
  overallStatus: OrderStatus;
  vendorOrders: IVendorOrder[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSubSchema = new Schema<IAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String }
  },
  { _id: false }
);

const VendorOrderItemSchema = new Schema<IVendorOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String }
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String },
    comment: { type: String }
  },
  { _id: false }
);

const VendorOrderSchema = new Schema<IVendorOrder>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [VendorOrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PLACED
    },
    trackingNumber: { type: String },
    statusHistory: [StatusHistorySchema]
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [OrderItemSchema],
    shippingAddress: { type: AddressSubSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    overallStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PLACED
    },
    vendorOrders: [VendorOrderSchema]
  },
  {
    timestamps: true
  }
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customer: 1, createdAt: -1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
