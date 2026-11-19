import React from 'react';
import { OrderStatus, PaymentStatus, OnboardingStatus, ProductStatus } from '@/types';
import { getStatusColor, formatOrderStatus } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | OnboardingStatus | ProductStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const { bg, text, border } = getStatusColor(status);
  const label =
    Object.values(OrderStatus).includes(status as OrderStatus)
      ? formatOrderStatus(status)
      : status.toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        bg,
        text,
        border,
        className
      )}
    >
      {label}
    </span>
  );
};
