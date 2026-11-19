# FS-01 REST API Specification
# NexMart — Multi-Vendor E-Commerce Platform
# Base URL: `http://localhost:5000/api`
# Interactive Swagger Documentation: `http://localhost:5000/api-docs`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer or vendor |
| POST | `/api/auth/login` | Public | Login with email and password |
| POST | `/api/auth/logout` | Authenticated | Invalidate JWT session and cookies |
| POST | `/api/auth/refresh` | Public (Cookie) | Rotate and refresh access token |
| GET  | `/api/auth/me` | Authenticated | Retrieve current user profile |
| POST | `/api/auth/forgot-password`| Public | Generate password reset token |
| POST | `/api/auth/reset-password` | Public | Reset password with token |

---

## 2. Vendor Management (`/api/vendor` & `/api/vendors`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/vendor/apply` | Authenticated | Submit vendor onboarding application |
| GET  | `/api/vendor/status` | Authenticated | Check onboarding review state |
| GET  | `/api/vendor/profile` | Vendor | Get vendor business information |
| PUT  | `/api/vendor/profile` | Vendor | Update business contact & address |
| GET  | `/api/vendor/dashboard` | Vendor | Vendor revenue & orders stats |
| GET  | `/api/vendor/orders` | Vendor | Get assigned sub-orders |
| PATCH| `/api/vendor/orders/:id/status` | Vendor | Update sub-order fulfillment (PACKED, SHIPPED, DELIVERED) + AWB |

---

## 3. Product Catalog (`/api/products` & `/api/vendor/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET  | `/api/products` | Public | Search and filter catalog (ES with Mongo fallback) |
| GET  | `/api/products/:id` | Public | Get product details by ID |
| GET  | `/api/products/slug/:slug` | Public | Get product details by slug |
| GET  | `/api/products/featured` | Public | List top featured products (Redis cached) |
| GET  | `/api/products/trending` | Public | List trending products by sales |
| POST | `/api/vendor/products` | Vendor | Create new product listing |
| PUT  | `/api/vendor/products/:id` | Vendor | Update product details and inventory |
| DELETE| `/api/vendor/products/:id`| Vendor | Soft-delete product |
| GET  | `/api/vendor/products` | Vendor | List all products owned by vendor |

---

## 4. Shopping Cart (`/api/cart`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET  | `/api/cart` | Customer | Fetch current customer shopping cart |
| POST | `/api/cart/items` | Customer | Add product to cart |
| PUT  | `/api/cart/items/:productId` | Customer | Update item quantity |
| DELETE| `/api/cart/items/:productId`| Customer | Remove item from cart |
| DELETE| `/api/cart` | Customer | Clear cart contents |

---

## 5. Orders & Invoices (`/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Customer | Checkout: create multi-vendor order & payment order |
| GET  | `/api/orders` | Customer | Get customer order history |
| GET  | `/api/orders/:id` | Customer | Get detailed order summary |
| GET  | `/api/orders/:id/invoice` | Customer | Download PDF invoice (PDFKit generated) |
| PATCH| `/api/orders/:id/cancel` | Customer | Cancel unfulfilled order |

---

## 6. Payments (`/api/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/payments/create-order` | Customer | Create Razorpay order for cart |
| POST | `/api/payments/verify` | Customer | Verify payment signature and complete order |
| POST | `/api/payments/webhook` | Public | Razorpay webhook listener |

---

## 7. Platform Administration (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET  | `/api/admin/dashboard` | Admin | Comprehensive analytics & charts |
| GET  | `/api/admin/users` | Admin | List all registered users |
| GET  | `/api/admin/vendors` | Admin | List all vendors with status filter |
| PATCH| `/api/admin/vendors/:id/approve`| Admin | Approve vendor onboarding |
| PATCH| `/api/admin/vendors/:id/reject` | Admin | Decline vendor application |
| GET  | `/api/admin/orders` | Admin | View all global platform orders |
| GET  | `/api/admin/payments` | Admin | Audit gateway payments |
| GET  | `/api/admin/commissions` | Admin | Review commission splits & Route payouts |
| PUT  | `/api/admin/settings/commission` | Admin | Set global platform commission rate |
| GET  | `/api/admin/coupons` | Admin | List promotional coupons |
| POST | `/api/admin/coupons` | Admin | Create new coupon |
| DELETE| `/api/admin/coupons/:id` | Admin | Delete coupon |

---

## 8. Health & Diagnostics (`/api/health`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET  | `/api/health` | Public | Checks MongoDB, Redis, Elasticsearch connectivity |

