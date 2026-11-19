// ============================================================
// Enums
// ============================================================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PLACED = 'PLACED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum OnboardingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SIMULATION = 'SIMULATION',
}

// ============================================================
// Core Interfaces
// ============================================================

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfile {
  _id: string;
  user: string | User;
  businessName: string;
  businessDescription: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  gstNumber?: string;
  onboardingStatus: OnboardingStatus;
  adminNotes?: string;
  razorpayLinkedAccountId?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount: number;
}

export interface Product {
  _id: string;
  vendor: string | VendorProfile;
  category: string | Category;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  soldCount: number;
  avgRating: number;
  ratingCount: number;
  status: ProductStatus;
  isDeleted: boolean;
  searchKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  vendor: string | VendorProfile;
  quantity: number;
  priceAtAdd: number;
}

export interface Cart {
  _id: string;
  customer: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorOrderItem {
  product: string | Product;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface VendorOrder {
  _id: string;
  vendor: string | VendorProfile;
  items: VendorOrderItem[];
  subtotal: number;
  status: OrderStatus;
  statusHistory: StatusHistory[];
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string | User;
  items: VendorOrderItem[];
  vendorOrders: VendorOrder[];
  shippingAddress: Address;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  coupon?: string;
  status: OrderStatus;
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  order: string | Order;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  _id: string;
  order: string | Order;
  vendorOrder: string | VendorOrder;
  vendor: string | VendorProfile;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  vendorNetAmount: number;
  transferStatus: TransferStatus;
  transferId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  product: string | Product;
  customer: string | User;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  recentOrders: Order[];
  revenueData: { date: string; revenue: number }[];
}

export interface AdminDashboard {
  totalCustomers: number;
  totalVendors: number;
  pendingApplications: number;
  totalProducts: number;
  totalOrders: number;
  grossSales: number;
  platformCommission: number;
  revenueData: { date: string; revenue: number; commission: number }[];
  orderStatusData: { status: string; count: number }[];
  topProducts: { name: string; sales: number }[];
  recentTransactions: Payment[];
}

// ============================================================
// API Response Types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// ============================================================
// Filter / Query Types
// ============================================================

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  vendor?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

// ============================================================
// Form Types
// ============================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: UserRole;
  // Vendor fields
  businessName?: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  gstNumber?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  comparePrice?: number;
  stock: number;
  status: ProductStatus;
  images: string[];
}

export interface CouponFormData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  isActive: boolean;
}

// ============================================================
// Razorpay Types
// ============================================================

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}
