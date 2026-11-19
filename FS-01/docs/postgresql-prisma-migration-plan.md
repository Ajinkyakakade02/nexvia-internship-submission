# PostgreSQL + Prisma Migration Specification & Schema Plan
**Project:** NexMart — Multi-Vendor E-Commerce Marketplace (FS-01)  
**Organization:** Nexvia Technologies Private Limited  
**Target Architecture:** PostgreSQL 16 + Prisma ORM  
**Document Status:** Pending Review / Pre-Implementation Design  
**Branch:** `feature/postgresql-prisma-migration`  

---

## 1. Executive Summary & Design Principles

The NexMart backend is transitioning from a document-oriented database (**MongoDB + Mongoose**) to an enterprise relational model (**PostgreSQL + Prisma ORM**). 

This migration must satisfy the following architectural requirements:
1. **Financial Accuracy:** All monetary values (prices, MRPs, item subtotals, shipping charges, tax, total order sums, discount amounts, commission cuts, net vendor settlements) must use exact PostgreSQL fixed-point arithmetic (`Decimal(12, 2)` / `@db.Decimal(12, 2)`), eliminating IEEE 754 floating-point inaccuracies.
2. **Referential Integrity & Safe Deletions:** Critical historical audit trails (Orders, Payments, Commissions, Invoices) must **never** be cascade-deleted if a User, VendorProfile, or Product is removed or disabled. Soft deletes and `onDelete: Restrict` / `onDelete: SetNull` rules are enforced.
3. **CartItem to Vendor Relationship:** In MongoDB, cart items stored an unconstrained `vendor: ObjectId`. In PostgreSQL, each `CartItem` links directly to a `Product`. Because every `Product` belongs to exactly one `VendorProfile`, the vendor relationship is directly inferred from `Product.vendorId` (with an optional direct relational foreign key to `VendorProfile` for efficient indexing and vendor subtotal grouping without joins).
4. **Per-User Coupon Limits:** In MongoDB, `Coupon.usedBy` was a loose array of user ObjectIds that did not enforce `perUserLimit`. In PostgreSQL, a dedicated `CouponUsage` join table tracks every individual redemption `(couponId, userId, orderId, usedAt)`, allowing both total `usageLimit` and per-customer `perUserLimit` to be validated atomically inside transactions.
5. **Real & Simulated Payment Records:** In MongoDB, `razorpayPaymentId` was marked unique sparse, which created collision hazards when multiple simulated payments omitted or generated dummy IDs. In PostgreSQL, `razorpayOrderId` and `razorpayPaymentId` are nullable strings. Real payments store the genuine gateway identifiers (`order_xxx`, `pay_xxx`), while simulation payments store designated test identifiers (`order_sim_*`, `pay_sim_*`) under `method: "simulation"`.
6. **Master & Vendor Order Status Histories:** Master order status changes and independent vendor sub-order status updates are tracked in distinct, dedicated historical ledger tables (`OrderStatusHistory` and `VendorOrderStatusHistory`), each recording the timestamp, acting user/system agent, and optional courier/fulfillment comments.
7. **Unique Vendor per Master Order:** A compound unique constraint `@@unique([orderId, vendorId])` on `VendorOrder` guarantees that items from the same vendor in a single checkout are never fragmented across duplicate sub-orders.
8. **Historical Invoices & Snapshots:** Master and vendor order items store historical snapshots of the product name, unit price at purchase, quantity, subtotal, and image URL directly in table columns. The shipping address used at checkout is immutably snapshotted in `shippingAddressSnapshot Json`, preventing retro-mutations if a customer updates their saved addresses later.
9. **Single Vendor Relationship in Commission:** Commissions link uniquely to the `VendorOrder` (`@@unique([vendorOrderId])`) and reference `VendorProfile` (`vendorId`). Ambiguous parallel user links are eliminated.
10. **Zero Frontend Regressions (`_id` Compatibility):** The frontend relies on MongoDB-style `_id: string` in TypeScript interfaces and components. A backend API transformation interceptor / service serializer will project `_id: record.id` alongside `id: record.id`, guaranteeing zero breakage across the 2,217 compiled frontend modules.

---

## 2. Model Mapping Matrix: Mongoose to Relational PostgreSQL + Prisma

| Mongoose Model | Proposed Prisma Model(s) | Primary Key / ID | Relationships & Structural Notes |
|---|---|---|---|
| `User` | `User` | `UUID` (`@default(uuid())`) | One-to-One with `VendorProfile`, One-to-Many with `Address`, `Cart`, `Order`, `Review`, `AuditLog`, `CouponUsage`. Embedded addresses normalized to `Address`. |
| Embedded `User.addresses` | `Address` | `UUID` (`@default(uuid())`) | Foreign key to `User(id)` with `onDelete: Cascade`. |
| `VendorProfile` | `VendorProfile` | `UUID` (`@default(uuid())`) | Foreign key to `User(id)` (`@unique`). One-to-Many with `Product`, `VendorOrder`, `Commission`. |
| `Category` | `Category` | `UUID` (`@default(uuid())`) | One-to-Many with `Product`. Unique `slug`. |
| `Product` | `Product` | `UUID` (`@default(uuid())`) | Foreign keys to `VendorProfile(id)` and `Category(id)`. One-to-Many with `CartItem`, `VendorOrderItem`, `Review`. Prices stored as `Decimal(12, 2)`. |
| `Cart` & embedded `Cart.items` | `Cart` & `CartItem` | `UUID` (`@default(uuid())`) | Normalized. `Cart` is `@unique(customerId)`. `CartItem` references `Cart(id)` and `Product(id)`. |
| `Order` (Master) | `Order` | `UUID` (`@default(uuid())`) | References `User(id)`, `Coupon(id)`, `Address(id)`. Snapshots shipping address as JSON. Prices stored as `Decimal(12, 2)`. |
| Embedded `Order.vendorOrders` | `VendorOrder` | `UUID` (`@default(uuid())`) | Normalized. Foreign keys to `Order(id)` and `VendorProfile(id)`. `@@unique([orderId, vendorId])`. |
| Embedded `Order.items` / `VendorOrder.items` | `VendorOrderItem` | `UUID` (`@default(uuid())`) | Foreign key to `VendorOrder(id)` and optional link to `Product(id)`. Preserves immutable name, price, subtotal, and image snapshots. |
| Embedded `Order.statusHistory` | `OrderStatusHistory` | `UUID` (`@default(uuid())`) | Normalized ledger table linking to `Order(id)`. |
| Embedded `VendorOrder.statusHistory` | `VendorOrderStatusHistory` | `UUID` (`@default(uuid())`) | Normalized ledger table linking to `VendorOrder(id)`. |
| `Payment` | `Payment` | `UUID` (`@default(uuid())`) | Foreign key to `Order(id)`. Amounts as `Decimal(12, 2)`. Real or simulated gateway fields. |
| `Commission` | `Commission` | `UUID` (`@default(uuid())`) | Foreign key to `Order(id)`, unique link to `VendorOrder(id)`, link to `VendorProfile(id)`. Amounts as `Decimal(12, 2)`. |
| `Review` | `Review` | `UUID` (`@default(uuid())`) | Foreign keys to `User(id)`, `Product(id)`, optional `Order(id)`. `@@unique([customerId, productId])`. |
| `Coupon` & embedded `Coupon.usedBy` | `Coupon` & `CouponUsage` | `UUID` (`@default(uuid())`) | Normalized. `CouponUsage` records individual redemptions `(couponId, userId, orderId)`. |
| `AuditLog` | `AuditLog` | `UUID` (`@default(uuid())`) | Foreign key to `User(id)` (`onDelete: SetNull`). |

---

## 3. Refined Prisma Schema Specification

```prisma
// ============================================================
// NexMart FS-01 — Refined Relational PostgreSQL + Prisma Schema
// ============================================================

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ------------------------------------------------------------
// Enums
// ------------------------------------------------------------

enum UserRole {
  CUSTOMER
  VENDOR
  ADMIN
}

enum OrderStatus {
  PLACED
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum OnboardingStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum ProductStatus {
  DRAFT
  ACTIVE
  INACTIVE
}

enum DiscountType {
  PERCENTAGE
  FIXED
}

enum TransferStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  SIMULATION
}

// ------------------------------------------------------------
// Core User & Authentication
// ------------------------------------------------------------

model User {
  id                   String        @id @default(uuid()) @db.Uuid
  name                 String        @db.VarChar(120)
  email                String        @unique @db.VarChar(255)
  passwordHash         String        @db.VarChar(255)
  role                 UserRole      @default(CUSTOMER)
  phone                String?       @db.VarChar(30)
  avatar               String?       @db.Text
  isActive             Boolean       @default(true)
  resetPasswordToken   String?       @db.VarChar(255)
  resetPasswordExpires DateTime?
  createdAt            DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt            DateTime      @updatedAt @db.Timestamptz(6)

  // Relationships
  vendorProfile        VendorProfile?
  addresses            Address[]
  cart                 Cart?
  orders               Order[]
  reviews              Review[]
  couponRedemptions    CouponUsage[]
  auditLogs            AuditLog[]

  @@index([role])
  @@index([createdAt])
  @@map("users")
}

model Address {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @db.Uuid
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName   String   @db.VarChar(120)
  phone      String   @db.VarChar(30)
  street     String   @db.Text
  city       String   @db.VarChar(100)
  state      String   @db.VarChar(100)
  postalCode String   @db.VarChar(20)
  country    String   @default("India") @db.VarChar(100)
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime @updatedAt @db.Timestamptz(6)

  // Relations
  orders     Order[]

  @@index([userId])
  @@map("addresses")
}

// ------------------------------------------------------------
// Vendor Profile & Catalog
// ------------------------------------------------------------

model VendorProfile {
  id                      String           @id @default(uuid()) @db.Uuid
  userId                  String           @unique @db.Uuid
  user                    User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessName            String           @db.VarChar(200)
  businessDescription     String           @db.Text
  businessEmail           String           @db.VarChar(255)
  businessPhone           String           @db.VarChar(30)
  businessAddress         String           @db.Text
  gstNumber               String?          @db.VarChar(30)
  onboardingStatus        OnboardingStatus @default(PENDING)
  adminNotes              String?          @db.Text
  razorpayLinkedAccountId String?          @db.VarChar(100)
  approvedAt              DateTime?        @db.Timestamptz(6)
  rejectedAt              DateTime?        @db.Timestamptz(6)
  createdAt               DateTime         @default(now()) @db.Timestamptz(6)
  updatedAt               DateTime         @updatedAt @db.Timestamptz(6)

  // Relationships
  products                Product[]
  vendorOrders            VendorOrder[]
  commissions             Commission[]
  cartItems               CartItem[]

  @@index([onboardingStatus])
  @@index([businessName])
  @@map("vendor_profiles")
}

model Category {
  id           String    @id @default(uuid()) @db.Uuid
  name         String    @db.VarChar(100)
  slug         String    @unique @db.VarChar(120)
  description  String?   @db.Text
  image        String?   @db.Text
  isActive     Boolean   @default(true)
  productCount Int       @default(0)
  createdAt    DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime  @updatedAt @db.Timestamptz(6)

  // Relationships
  products     Product[]

  @@index([isActive])
  @@map("categories")
}

model Product {
  id             String        @id @default(uuid()) @db.Uuid
  vendorId       String        @db.Uuid
  vendor         VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  categoryId     String        @db.Uuid
  category       Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  name           String        @db.VarChar(255)
  slug           String        @unique @db.VarChar(280)
  description    String        @db.Text
  price          Decimal       @db.Decimal(12, 2)
  comparePrice   Decimal?      @db.Decimal(12, 2)
  images         String[]      @default([])
  stock          Int           @default(0)
  soldCount      Int           @default(0)
  avgRating      Decimal       @default(0.00) @db.Decimal(3, 2)
  ratingCount    Int           @default(0)
  status         ProductStatus @default(DRAFT)
  isDeleted      Boolean       @default(false)
  searchKeywords String[]      @default([])
  createdAt      DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt      DateTime      @updatedAt @db.Timestamptz(6)

  // Relationships
  cartItems      CartItem[]
  orderItems     VendorOrderItem[]
  reviews        Review[]

  @@index([vendorId])
  @@index([categoryId])
  @@index([status, isDeleted])
  @@index([price])
  @@map("products")
}

// ------------------------------------------------------------
// Shopping Cart
// ------------------------------------------------------------

model Cart {
  id         String     @id @default(uuid()) @db.Uuid
  customerId String     @unique @db.Uuid
  customer   User       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  createdAt  DateTime   @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime   @updatedAt @db.Timestamptz(6)

  // Relationships
  items      CartItem[]

  @@map("carts")
}

model CartItem {
  id         String        @id @default(uuid()) @db.Uuid
  cartId     String        @db.Uuid
  cart       Cart          @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId  String        @db.Uuid
  product    Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  vendorId   String        @db.Uuid
  vendor     VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  quantity   Int           @default(1)
  priceAtAdd Decimal       @db.Decimal(12, 2)
  createdAt  DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime      @updatedAt @db.Timestamptz(6)

  @@unique([cartId, productId])
  @@index([cartId])
  @@index([vendorId])
  @@map("cart_items")
}

// ------------------------------------------------------------
// Orders, Multi-Vendor Sub-Orders & History
// ------------------------------------------------------------

model Order {
  id                      String            @id @default(uuid()) @db.Uuid
  orderNumber             String            @unique @db.VarChar(50)
  customerId              String            @db.Uuid
  customer                User              @relation(fields: [customerId], references: [id], onDelete: Restrict)
  shippingAddressId       String?           @db.Uuid
  shippingAddress         Address?          @relation(fields: [shippingAddressId], references: [id], onDelete: SetNull)
  shippingAddressSnapshot Json              // Immutable address snapshot for historical records
  subtotal                Decimal           @db.Decimal(12, 2)
  discount                Decimal           @default(0.00) @db.Decimal(12, 2)
  shippingCost            Decimal           @default(0.00) @db.Decimal(12, 2)
  tax                     Decimal           @default(0.00) @db.Decimal(12, 2)
  total                   Decimal           @db.Decimal(12, 2)
  couponId                String?           @db.Uuid
  coupon                  Coupon?           @relation(fields: [couponId], references: [id], onDelete: SetNull)
  paymentStatus           PaymentStatus     @default(PENDING)
  overallStatus           OrderStatus       @default(PLACED)
  createdAt               DateTime          @default(now()) @db.Timestamptz(6)
  updatedAt               DateTime          @updatedAt @db.Timestamptz(6)

  // Relationships
  vendorOrders            VendorOrder[]
  statusHistory           OrderStatusHistory[]
  payments                Payment[]
  commissions             Commission[]
  reviews                 Review[]
  couponRedemptions       CouponUsage[]

  @@index([customerId])
  @@index([paymentStatus])
  @@index([overallStatus])
  @@index([createdAt])
  @@map("orders")
}

model VendorOrder {
  id             String                     @id @default(uuid()) @db.Uuid
  orderId        String                     @db.Uuid
  order          Order                      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  vendorId       String                     @db.Uuid
  vendor         VendorProfile              @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  subtotal       Decimal                    @db.Decimal(12, 2)
  status         OrderStatus                @default(PLACED)
  trackingNumber String?                    @db.VarChar(100)
  trackingUrl    String?                    @db.Text
  createdAt      DateTime                   @default(now()) @db.Timestamptz(6)
  updatedAt      DateTime                   @updatedAt @db.Timestamptz(6)

  // Relationships
  items          VendorOrderItem[]
  statusHistory  VendorOrderStatusHistory[]
  commission     Commission?

  @@unique([orderId, vendorId]) // Guarantees one sub-order per vendor per master order
  @@index([orderId])
  @@index([vendorId])
  @@index([status])
  @@map("vendor_orders")
}

model VendorOrderItem {
  id            String      @id @default(uuid()) @db.Uuid
  vendorOrderId String      @db.Uuid
  vendorOrder   VendorOrder @relation(fields: [vendorOrderId], references: [id], onDelete: Cascade)
  productId     String?     @db.Uuid
  product       Product?    @relation(fields: [productId], references: [id], onDelete: SetNull)
  name          String      @db.VarChar(255) // Snapshot name
  price         Decimal     @db.Decimal(12, 2) // Snapshot unit price
  quantity      Int
  subtotal      Decimal     @db.Decimal(12, 2)
  image         String?     @db.Text // Snapshot thumbnail

  @@index([vendorOrderId])
  @@index([productId])
  @@map("vendor_order_items")
}

model OrderStatusHistory {
  id        String      @id @default(uuid()) @db.Uuid
  orderId   String      @db.Uuid
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  changedAt DateTime    @default(now()) @db.Timestamptz(6)
  changedBy String?     @db.VarChar(150)
  comment   String?     @db.Text

  @@index([orderId])
  @@map("order_status_histories")
}

model VendorOrderStatusHistory {
  id            String      @id @default(uuid()) @db.Uuid
  vendorOrderId String      @db.Uuid
  vendorOrder   VendorOrder @relation(fields: [vendorOrderId], references: [id], onDelete: Cascade)
  status        OrderStatus
  changedAt     DateTime    @default(now()) @db.Timestamptz(6)
  changedBy     String?     @db.VarChar(150)
  comment       String?     @db.Text

  @@index([vendorOrderId])
  @@map("vendor_order_status_histories")
}

// ------------------------------------------------------------
// Payments & Commissions
// ------------------------------------------------------------

model Payment {
  id                String        @id @default(uuid()) @db.Uuid
  orderId           String        @db.Uuid
  order             Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  razorpayOrderId   String        @db.VarChar(120) // Nullable/flexible for simulation vs live
  razorpayPaymentId String?       @db.VarChar(120)
  razorpaySignature String?       @db.VarChar(255)
  amount            Decimal       @db.Decimal(12, 2)
  currency          String        @default("INR") @db.VarChar(10)
  status            PaymentStatus @default(PENDING)
  method            String?       @db.VarChar(50) // "card", "upi", "netbanking", "simulation"
  webhookVerified   Boolean       @default(false)
  processedAt       DateTime?     @db.Timestamptz(6)
  createdAt         DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime      @updatedAt @db.Timestamptz(6)

  @@index([orderId])
  @@index([razorpayOrderId])
  @@index([razorpayPaymentId])
  @@map("payments")
}

model Commission {
  id                 String         @id @default(uuid()) @db.Uuid
  orderId            String         @db.Uuid
  order              Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  vendorOrderId      String         @unique @db.Uuid
  vendorOrder        VendorOrder    @relation(fields: [vendorOrderId], references: [id], onDelete: Cascade)
  vendorId           String         @db.Uuid
  vendor             VendorProfile  @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  grossAmount        Decimal        @db.Decimal(12, 2)
  commissionPercent  Decimal        @db.Decimal(5, 2)
  commissionAmount   Decimal        @db.Decimal(12, 2)
  vendorNetAmount    Decimal        @db.Decimal(12, 2)
  transferStatus     TransferStatus @default(PENDING)
  razorpayTransferId String?        @db.VarChar(120)
  createdAt          DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime       @updatedAt @db.Timestamptz(6)

  @@index([orderId])
  @@index([vendorId])
  @@index([transferStatus])
  @@map("commissions")
}

// ------------------------------------------------------------
// Reviews & Coupons
// ------------------------------------------------------------

model Review {
  id                 String   @id @default(uuid()) @db.Uuid
  customerId         String   @db.Uuid
  customer           User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  productId          String   @db.Uuid
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderId            String?  @db.Uuid
  order              Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  rating             Int      @db.SmallInt
  title              String?  @db.VarChar(150)
  comment            String   @db.Text
  isVerifiedPurchase Boolean  @default(false)
  isApproved         Boolean  @default(true)
  adminResponse      String?  @db.Text
  createdAt          DateTime @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime @updatedAt @db.Timestamptz(6)

  @@unique([customerId, productId])
  @@index([productId])
  @@index([orderId])
  @@map("reviews")
}

model Coupon {
  id            String        @id @default(uuid()) @db.Uuid
  code          String        @unique @db.VarChar(50)
  discountType  DiscountType
  discountValue Decimal       @db.Decimal(12, 2)
  minOrderValue Decimal       @default(0.00) @db.Decimal(12, 2)
  maxDiscount   Decimal?      @db.Decimal(12, 2)
  expiryDate    DateTime      @db.Timestamptz(6)
  usageLimit    Int?
  usedCount     Int           @default(0)
  perUserLimit  Int           @default(1)
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime      @updatedAt @db.Timestamptz(6)

  // Relationships
  orders        Order[]
  redemptions   CouponUsage[]

  @@index([code])
  @@index([isActive])
  @@map("coupons")
}

model CouponUsage {
  id       String   @id @default(uuid()) @db.Uuid
  couponId String   @db.Uuid
  coupon   Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  userId   String   @db.Uuid
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderId  String   @db.Uuid
  order    Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  usedAt   DateTime @default(now()) @db.Timestamptz(6)

  @@index([couponId, userId]) // Allows counting user redemptions to enforce perUserLimit
  @@index([orderId])
  @@map("coupon_usages")
}

// ------------------------------------------------------------
// Audit Logs
// ------------------------------------------------------------

model AuditLog {
  id            String   @id @default(uuid()) @db.Uuid
  action        String   @db.VarChar(100)
  performedById String?  @db.Uuid
  performedBy   User?    @relation(fields: [performedById], references: [id], onDelete: SetNull)
  targetEntity  String   @db.VarChar(100)
  targetId      String?  @db.VarChar(100)
  details       Json?
  ipAddress     String?  @db.VarChar(45)
  userAgent     String?  @db.Text
  createdAt     DateTime @default(now()) @db.Timestamptz(6)

  @@index([performedById])
  @@index([action])
  @@index([targetEntity])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 4. Key Relational Design Solutions

### 1. `perUserLimit` on Coupons
- **Problem in MongoDB:** `Coupon.usedBy` was an unbounded array of ObjectIds. It could not enforce whether a user had used a coupon 1 time or `perUserLimit` times without scanning the array.
- **Relational Solution:** The `CouponUsage` table stores each redemption linked to `(couponId, userId, orderId)`. Inside a transaction:
  ```typescript
  const userUsageCount = await prisma.couponUsage.count({
    where: { couponId: coupon.id, userId: user.id }
  });
  if (userUsageCount >= coupon.perUserLimit) {
    throw ApiError.badRequest(`You have already redeemed this coupon the maximum allowed times (${coupon.perUserLimit})`);
  }
  ```

### 2. Multi-Vendor Order Integrity & Unique Constraints
- **Sub-Order Uniqueness:** An order can contain multiple items from the same vendor. The compound unique index `@@unique([orderId, vendorId])` guarantees that all items belonging to that vendor are assigned to a single `VendorOrder` row.
- **Immutable Item Snapshots:** If a vendor changes a product's price from ₹1,499 to ₹2,499 next week, historical invoices and past orders must retain ₹1,499. `VendorOrderItem` holds fixed `price` and `subtotal` Decimal columns, and `Order.shippingAddressSnapshot` stores the exact address snapshot at the moment of payment.

### 3. Payment Gateway Flexibility (Simulated vs. Real)
- In simulated checkout mode, `razorpayPaymentId` is set to `pay_sim_<timestamp>_<rand>` and `method: "simulation"`.
- In live/test mode, the actual Razorpay IDs (`order_...`, `pay_...`) are saved. Neither relies on restrictive database-level unique constraints that cause false collisions during simulation testing.

---

## 5. Checkout Transaction Blueprint

The entire checkout operation will execute inside an atomic Prisma interactive transaction:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Lock and verify stock for all cart items
  for (const item of cart.items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId }
    });
    if (!product || product.isDeleted || product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for product: ${product?.name || item.productId}`);
    }
    // 2. Decrement inventory
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
        soldCount: { increment: item.quantity }
      }
    });
  }

  // 3. Create Master Order
  const order = await tx.order.create({
    data: {
      orderNumber,
      customerId: user.id,
      shippingAddressId: address.id,
      shippingAddressSnapshot: address,
      subtotal,
      discount,
      shippingCost,
      tax,
      total,
      couponId: coupon?.id,
      paymentStatus: 'PENDING',
      overallStatus: 'PLACED'
    }
  });

  // 4. Group cart items by vendor & insert VendorOrders + VendorOrderItems
  for (const [vendorId, vendorGroupItems] of vendorMap.entries()) {
    const vendorSubtotal = vendorGroupItems.reduce((acc, i) => acc.add(i.subtotal), new Decimal(0));
    const vendorOrder = await tx.vendorOrder.create({
      data: {
        orderId: order.id,
        vendorId,
        subtotal: vendorSubtotal,
        status: 'PLACED',
        items: {
          create: vendorGroupItems.map((vi) => ({
            productId: vi.productId,
            name: vi.product.name,
            price: vi.priceAtAdd,
            quantity: vi.quantity,
            subtotal: vi.subtotal,
            image: vi.product.images[0] || null
          }))
        },
        statusHistory: {
          create: {
            status: 'PLACED',
            changedBy: `Customer (${user.id})`,
            comment: 'Order placed'
          }
        }
      }
    });
  }

  // 5. Record coupon usage if coupon applied
  if (coupon) {
    await tx.couponUsage.create({
      data: { couponId: coupon.id, userId: user.id, orderId: order.id }
    });
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    });
  }

  // 6. Record Initial Order Status History
  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: 'PLACED',
      changedBy: `Customer (${user.id})`,
      comment: 'Master order initiated'
    }
  });

  // 7. Clear Shopping Cart
  await tx.cartItem.deleteMany({
    where: { cartId: cart.id }
  });

  return order;
});
```

---

## 6. Frontend `_id` API Compatibility Strategy

The frontend interfaces in [`frontend/src/types/index.ts`](file:///c:/Users/Acer/nexvia-internship/FS-01/frontend/src/types/index.ts) define entities with `_id: string`:
```typescript
export interface Product {
  _id: string;
  name: string;
  price: number;
  ...
}
```

To eliminate any risk of UI failure without having to rewrite 2,217 frontend modules:
1. **Serialization Transformer Utility:**  
   A lightweight response serializer in `backend/src/utils/apiResponse.ts` will automatically map Prisma's `id` to both `id` and `_id`:
   ```typescript
   export function transformPrismaResponse<T>(data: T): T {
     if (!data || typeof data !== 'object') return data;
     if (Array.isArray(data)) return data.map(transformPrismaResponse) as unknown as T;
     
     const obj = { ...data } as any;
     if (obj.id && !obj._id) {
       obj._id = obj.id;
     }
     for (const key of Object.keys(obj)) {
       if (obj[key] instanceof Decimal) {
         obj[key] = obj[key].toNumber(); // Converts Decimal(12,2) to standard Number for JSON/frontend
       } else if (typeof obj[key] === 'object') {
         obj[key] = transformPrismaResponse(obj[key]);
       }
     }
     return obj;
   }
   ```
2. **Controller Compatibility:**  
   All controllers wrap their payload in `success(res, transformPrismaResponse(data))`. As a result, the frontend receives exact numerical prices and can read either `.id` or `._id` seamlessly.

---

## 7. Service-by-Service Migration Sequence (When Approved)

1. **Step 1: Workspace Alignment & Container Updates**
   - Fix `package.json` workspaces: `"workspaces": ["frontend", "backend"]`.
   - Update `infrastructure/docker-compose.yml` to spin up PostgreSQL 16 on port 5432.
   - Install `prisma` (dev) and `@prisma/client` in `backend`.
2. **Step 2: Schema Initialization**
   - Place `schema.prisma` in `backend/prisma/schema.prisma`.
   - Run `npx prisma migrate dev --name init_postgresql` to create database tables.
   - Create singleton Prisma client at `backend/src/config/prisma.ts`.
3. **Step 3: Core Identity & Catalog Services**
   - Migrate `userService.ts` and `authService.ts`.
   - Migrate `categoryService.ts` and `productService.ts`.
4. **Step 4: Cart, Orders & Payments**
   - Migrate `cartService.ts`.
   - Migrate `orderService.ts` with multi-vendor transaction grouping.
   - Migrate `paymentService.ts` and `commissionService.ts`.
5. **Step 5: Reviews, Coupons, Analytics & Invoices**
   - Migrate `reviewService.ts` and `couponService.ts`.
   - Migrate `analyticsService.ts` (aggregations) and `invoiceService.ts`.
6. **Step 6: Database Seeder**
   - Update `backend/src/seed/seed.ts` and `adminSeed.ts` using Prisma Client.
   - Seed categories, vendors, products, reviews, and coupons into PostgreSQL.
7. **Step 7: Verification & Testing**
   - Run full end-to-end API tests and verify frontend store, vendor dashboard, and admin analytics in browser.

