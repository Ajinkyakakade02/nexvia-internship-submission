import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '../ui/Button';
import { Tag, ArrowRight } from 'lucide-react';
import { couponService } from '@/services/couponService';
import toast from 'react-hot-toast';

export interface CartSummaryProps {
  subtotal: number;
  discount?: number;
  shipping?: number;
  onCheckout: () => void;
  onApplyCoupon?: (discount: number, code: string) => void;
  isCheckoutPage?: boolean;
  isLoading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount = 0,
  shipping = 0,
  onCheckout,
  onApplyCoupon,
  isCheckoutPage = false,
  isLoading = false,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidating(true);
    try {
      const res = await couponService.validateCoupon(couponCode.trim(), subtotal);
      if (res.valid) {
        setAppliedCoupon(res.coupon.code);
        onApplyCoupon?.(res.discountAmount, res.coupon.code);
        toast.success(`Coupon ${res.coupon.code} applied! Saved ${formatCurrency(res.discountAmount)}`);
      } else {
        toast.error('Invalid coupon code');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">
        Order Summary
      </h3>

      {/* Coupon input */}
      {!appliedCoupon && onApplyCoupon && (
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Promo code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 font-medium"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" isLoading={validating}>
            Apply
          </Button>
        </form>
      )}

      {appliedCoupon && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Coupon <strong>{appliedCoupon}</strong> active
          </span>
          <button
            type="button"
            onClick={() => {
              setAppliedCoupon(null);
              onApplyCoupon?.(0, '');
              toast('Coupon removed');
            }}
            className="text-emerald-700 hover:text-emerald-900 underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span>
            <span className="font-semibold">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Estimated Shipping</span>
          <span className="font-semibold text-slate-900">
            {shipping === 0 ? <span className="text-emerald-600">FREE</span> : formatCurrency(shipping)}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-base font-bold text-slate-900">
          <span>Total</span>
          <span className="text-xl text-primary-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {!isCheckoutPage && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onCheckout}
          isLoading={isLoading}
          disabled={subtotal <= 0}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Proceed to Checkout
        </Button>
      )}
    </div>
  );
};
