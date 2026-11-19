import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { PriceDisplay } from '../ui/PriceDisplay';
import { StarRating } from '../ui/StarRating';
import { Button } from '../ui/Button';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, loading } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product._id, 1);
      toast.success(`Added ${product.name} to cart`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const vendorName =
    typeof product.vendor === 'object' && product.vendor !== null
      ? product.vendor.businessName
      : 'Verified Vendor';

  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60';

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      {/* Image container */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded-md tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium truncate block">
            {vendorName}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center">
            <StarRating
              rating={product.avgRating || 0}
              size="sm"
              showText
              totalReviews={product.ratingCount || 0}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="sm" />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || loading}
            className="rounded-lg p-2 h-8 w-8 hover:bg-primary-50 hover:text-primary-600"
            aria-label="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
};
