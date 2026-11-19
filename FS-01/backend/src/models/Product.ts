import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ProductStatus } from '../types/index.js';

export interface IProduct extends Document {
  vendor: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  soldCount: number;
  avgRating: number;
  ratingCount: number;
  status: ProductStatus;
  isDeleted: boolean;
  searchKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0, default: 0 },
    soldCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
      index: true
    },
    isDeleted: { type: Boolean, default: false, index: true },
    searchKeywords: [{ type: String }]
  },
  {
    timestamps: true
  }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ vendor: 1, isDeleted: 1 });
ProductSchema.index({ category: 1, isDeleted: 1, status: 1 });

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
