import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Link } from 'react-router-dom';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  disabled = false,
}) => {
  const { product, quantity, priceAtAdd } = item;
  const currentPrice = product?.price ?? priceAtAdd ?? 0;
  const itemTotal = currentPrice * quantity;
  const image = product?.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300';
  const vendorName =
    typeof product?.vendor === 'object' && product?.vendor !== null
      ? product.vendor.businessName
      : 'Seller';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      {/* Product Image & Info */}
      <div className="flex items-center gap-4">
        <Link
          to={`/products/${product?._id}`}
          className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0"
        >
          <img src={image} alt={product?.name || 'Product'} className="w-full h-full object-cover" />
        </Link>
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium">{vendorName}</p>
          <Link
            to={`/products/${product?._id}`}
            className="text-sm font-semibold text-slate-900 hover:text-primary-600 line-clamp-1"
          >
            {product?.name || 'Item'}
          </Link>
          <p className="text-xs font-semibold text-slate-700">{formatCurrency(currentPrice)} each</p>
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
        {/* Quantity control */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          <button
            type="button"
            disabled={disabled || quantity <= 1}
            onClick={() => onUpdateQuantity(quantity - 1)}
            className="p-1.5 hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-semibold text-slate-800">{quantity}</span>
          <button
            type="button"
            disabled={disabled || (product?.stock !== undefined && quantity >= product.stock)}
            onClick={() => onUpdateQuantity(quantity + 1)}
            className="p-1.5 hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-[80px]">
          <p className="text-sm font-bold text-slate-900">{formatCurrency(itemTotal)}</p>
        </div>

        {/* Delete */}
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
