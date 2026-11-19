import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICartProductItem {
  product: Types.ObjectId;
  vendor: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart extends Document {
  customer: Types.ObjectId;
  items: ICartProductItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartProductItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [CartItemSchema]
  },
  {
    timestamps: true
  }
);

export const Cart: Model<ICart> = mongoose.model<ICart>('Cart', CartSchema);
export default Cart;
