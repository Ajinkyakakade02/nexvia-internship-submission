import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export interface PriceDisplayProps {
  price: number;
  comparePrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  comparePrice,
  size = 'md',
  className,
}) => {
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const fontSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-bold',
  };

  const compareSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div className={cn('inline-flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn('text-slate-900', fontSizes[size])}>{formatCurrency(price)}</span>
      {hasDiscount && (
        <>
          <span className={cn('text-slate-400 line-through', compareSizes[size])}>
            {formatCurrency(comparePrice)}
          </span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {discountPercent}% OFF
          </span>
        </>
      )}
    </div>
  );
};
