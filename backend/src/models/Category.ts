import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

CategorySchema.index({ slug: 1 }, { unique: true });

export const Category: Model<ICategory> = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
