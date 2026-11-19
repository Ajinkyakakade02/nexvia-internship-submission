# NexMart — Multi-Vendor E-Commerce Marketplace
**Project Code:** FS-01  
**Organization:** Nexvia Technologies Private Limited  
**Target Deadline:** 20 November 2026  
**License:** Private / Proprietary  

---

## 1. Executive Summary

NexMart is a production-ready, full-stack multi-vendor e-commerce marketplace platform engineered using React 18, TypeScript, Vite, Node.js, Express, and MongoDB.

The platform coordinates three distinct user experiences:
1. **Customer:** Product browsing, faceted filtering, real-time search, cart, checkout, Razorpay test payments, order tracking, product reviews, and downloadable PDF invoices.
2. **Vendor:** Vendor onboarding verification flow, catalog inventory management, product image uploads, multi-vendor sub-order fulfillment with tracking numbers, and sales commission reporting.
3. **Admin:** Protected portal with marketplace metrics (GMV, platform commission, user growth), vendor approval/rejection workflows, catalog management, coupon generation, payment auditing, and commission rate adjustment.

---

## 2. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, React Router v6, Tailwind CSS, Redux Toolkit, React Hook Form, Zod, Recharts, Lucide React, Axios, React Hot Toast
- **Backend:** Node.js, Express.js, TypeScript, Mongoose ODM, JWT Auth, Bcrypt, Zod request validation, Helmet, CORS, Rate Limiting, Multer, Razorpay SDK, AWS SDK v3, PDFKit, Swagger UI
- **Database:** MongoDB 7.0+
- **Search:** Elasticsearch 8.x (with automated MongoDB regex query fallback)
- **Caching:** Redis 7.x (with automated in-memory bypass fallback)
- **Media Storage:** AWS S3 (with local file adapter fallback)
- **Payments:** Razorpay Checkout + Razorpay Route (with zero-credential simulation mode)

---

## 3. Getting Started & Local Development

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- (Optional) Docker & Docker Compose for local infrastructure

### Quick Start (Zero External Credentials Required)

1. **Clone repository & install dependencies:**
   ```bash
   cd FS-01
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *(The default `.env.example` is pre-configured with safe simulation adapters for payments and local disk storage).*

3. **Start local services via Docker Compose (Optional):**
   ```bash
   docker compose -f infrastructure/docker-compose.yml up -d
   ```
   *(If Docker is not running, the platform still functions gracefully).*

4. **Seed Database:**
   ```bash
   cd server
   npm run seed:admin
   npm run seed
   ```
   *Seeds 6 categories, 3 approved vendor profiles, 2 customer accounts, 16 sample products, coupons, and reviews.*

5. **Run the Development Servers:**
   - **Backend API:**
     ```bash
     cd server
     npm run dev
     ```
     API available at: `http://localhost:5000`  
     Interactive Swagger Docs: `http://localhost:5000/api-docs`  
     Health Check: `http://localhost:5000/api/health`

   - **Frontend Client:**
     ```bash
     cd client
     npm run dev
     ```
     Storefront available at: `http://localhost:3000`

---

## 4. Default Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Platform Admin** | `admin@nexmart.com` | `Admin123!` |
| **Approved Vendor** | `vendor1@techpulse.com` | `Vendor123!` |
| **Pending Vendor** | `vendor3@artisan.com` | `Vendor123!` |
| **Customer** | `customer1@gmail.com` | `Customer123!` |

---

## 5. Repository Structure

```text
FS-01/
├── client/                     # Vite + React 18 frontend
│   ├── src/
│   │   ├── components/         # UI primitives, layout, charts, cards
│   │   ├── pages/              # Admin, Vendor, Customer, Public, Auth pages
│   │   ├── routes/             # AppRoutes, ProtectedRoute, PublicRoute
│   │   ├── services/           # Axios API services
│   │   ├── store/              # Redux slices (auth, cart, products)
│   │   └── types/              # Unified TypeScript definitions
├── server/                     # Express + TypeScript backend
│   ├── src/
│   │   ├── config/             # DB, Redis, ES, S3, Razorpay, Swagger
│   │   ├── controllers/        # REST route handlers
│   │   ├── middleware/         # Auth, RBAC, Error, Validation
│   │   ├── models/             # 11 Mongoose Schemas & Indexes
│   │   ├── routes/             # Express API routes mounted under /api
│   │   ├── seed/               # Admin seed and catalog demo seed
│   │   └── services/           # Order, payment, commission, search, invoice
├── docs/                       # Architecture, Database, API documentation
└── infrastructure/             # Docker Compose for MongoDB, Redis, ES
```

