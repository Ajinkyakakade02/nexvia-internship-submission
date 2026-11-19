import { OrderStatus, PaymentStatus, OnboardingStatus, ProductStatus } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatOrderStatus(status: OrderStatus | string): string {
  switch (status) {
    case OrderStatus.PLACED:
      return 'Order Placed';
    case OrderStatus.PACKED:
      return 'Packed';
    case OrderStatus.SHIPPED:
      return 'Shipped';
    case OrderStatus.DELIVERED:
      return 'Delivered';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

export function getStatusColor(status: OrderStatus | PaymentStatus | OnboardingStatus | ProductStatus | string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case OrderStatus.DELIVERED:
    case PaymentStatus.COMPLETED:
    case OnboardingStatus.APPROVED:
    case ProductStatus.ACTIVE:
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };

    case OrderStatus.SHIPPED:
    case OrderStatus.PACKED:
    case OnboardingStatus.PENDING:
    case PaymentStatus.PENDING:
    case ProductStatus.DRAFT:
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };

    case OrderStatus.PLACED:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };

    case OrderStatus.CANCELLED:
    case PaymentStatus.FAILED:
    case OnboardingStatus.REJECTED:
    case OnboardingStatus.SUSPENDED:
    case ProductStatus.INACTIVE:
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };

    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
