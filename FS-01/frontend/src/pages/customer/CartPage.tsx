import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CartPage: React.FC = () => {
  const { items, total, loading, loadCart, updateQuantity, removeItem, emptyCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping cart is empty"
          description="Looks like you haven't added anything to your cart yet. Explore our top marketplace deals!"
          actionLabel="Start Shopping"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-1">{items.length} items currently in cart</p>
        </div>
        <Button variant="ghost" size="sm" onClick={emptyCart} className="text-rose-600 hover:text-rose-700">
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 divide-y divide-slate-100">
          {items.map((item) => (
            <CartItem
              key={item.product?._id}
              item={item}
              onUpdateQuantity={(qty) => updateQuantity(item.product._id, qty)}
              onRemove={() => removeItem(item.product._id)}
            />
          ))}
          <div className="pt-4 flex justify-between items-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary sidebar */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={total}
            shipping={total > 500 ? 0 : 50}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </div>
  );
};
export default CartPage;
