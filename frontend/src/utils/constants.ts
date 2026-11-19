export const APP_NAME = 'NexMart';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
} as const;

export const ORDER_STATUS = {
  PLACED: 'placed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const DEFAULT_PAGE_LIMIT = 12;

export const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Become a Seller', href: '/register?role=vendor' },
];
