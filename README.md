# Nexvia Technologies — Full-Stack Internship Submission

**Intern:** Ajinkya Kakade  
**Organization:** Nexvia Technologies Private Limited  
**Track:** Full-Stack Development  
**Submission Date:** November 2026  

---

## Repository Overview

This repository contains two full-stack projects completed as part of the Nexvia Technologies internship programme. Each project is self-contained with its own frontend, backend, documentation, and deployment configuration.

```
nexvia-internship-submission/
├── FS-01/          # NexMart — Multi-Vendor E-Commerce Marketplace
│   ├── frontend/   # React + Vite + TypeScript
│   ├── backend/    # Express + TypeScript + Prisma + PostgreSQL
│   ├── docs/       # Architecture docs, API spec, screenshots
│   └── README.md
├── FS-02/          # SyncSpace — Real-Time Collaborative Workspace
│   ├── frontend/   # React + Vite + TypeScript + TipTap + Yjs
│   ├── backend/    # Express + TypeScript + Prisma + PostgreSQL + WebSocket
│   ├── docs/       # Architecture docs, screenshots
│   ├── tests/      # Integration & unit tests
│   └── README.md
├── README.md       # ← You are here
└── .gitignore
```

---

## FS-01 — NexMart (Multi-Vendor E-Commerce Marketplace)

A production-ready multi-vendor e-commerce marketplace with three distinct user roles:

- **Customers:** Browse products, faceted filtering, real-time search, cart, checkout with Razorpay test payments, order tracking, reviews, and PDF invoices.
- **Vendors:** Onboarding verification, catalog & inventory management, image uploads, sub-order fulfillment with tracking, and commission reporting.
- **Admins:** Dashboard with marketplace metrics (GMV, commissions, user growth), vendor approvals, catalog moderation, coupon management, and payment auditing.

### Tech Stack
| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router v6, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM, JWT Auth, Zod Validation, Swagger |
| Database | PostgreSQL (Neon) |
| Cache | Redis (Upstash) |
| Search | Elasticsearch (with regex fallback) |
| Payments | Razorpay Checkout + Route (with simulation mode) |
| Storage | AWS S3 (with local fallback) |

### Deployment
| Component | URL |
|-----------|-----|
| Frontend | [https://frontend-sooty-two-50.vercel.app](https://frontend-sooty-two-50.vercel.app) |
| Backend API | [https://nexvia-fs-01-nexmart.onrender.com](https://nexvia-fs-01-nexmart.onrender.com) |

> **Note:** The backend runs on Render's free tier and may take ~30 seconds to cold-start.

📖 **Full documentation:** [FS-01/README.md](FS-01/README.md)

---

## FS-02 — SyncSpace (Real-Time Collaborative Workspace)

An enterprise-grade real-time collaborative document workspace inspired by Notion and Figma:

- **Live Multi-User Collaboration** via Yjs CRDTs — conflict-free concurrent editing.
- **Rich-Text TipTap Editor** — headings, formatting, task checklists, tables, code blocks.
- **Collaborator Presence** — live cursors, colored carets, awareness tooltips.
- **Version History & Restore** — named snapshot milestones with generation-safe rollback.
- **Threaded Comments** — inline discussions with author attribution and resolution.
- **Role-Based Access Control** — OWNER, ADMIN, EDITOR, COMMENTER, VIEWER enforced across REST and WebSocket.
- **Redis Pub/Sub** — cross-instance document sync with origin loop suppression.

### Tech Stack
| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TipTap, Yjs v13, React Router v6 |
| Backend | Node.js, Express, TypeScript, Prisma ORM, WebSocket (ws), JWT Auth, Zod |
| Database | PostgreSQL (Neon) |
| Cache/PubSub | Redis (Upstash) |
| Collaboration | Yjs CRDTs, y-protocols, lib0 |

### Deployment
| Component | URL |
|-----------|-----|
| Frontend | [https://frontend-6wl9.vercel.app](https://frontend-6wl9.vercel.app) |
| Backend API | [https://syncspace-fs-02.onrender.com](https://syncspace-fs-02.onrender.com) |

> **Note:** The backend runs on Render's free tier and may take ~30 seconds to cold-start.

📖 **Full documentation:** [FS-02/README.md](FS-02/README.md)

---

## Local Setup

Each project can be run independently. Refer to the individual README files for detailed instructions.

### Prerequisites
- Node.js ≥ 20.x
- npm ≥ 10.x
- PostgreSQL (local or hosted)
- Redis (local or hosted, optional for FS-01)

### Quick Start

**FS-01 (NexMart):**
```bash
cd FS-01
cp .env.example .env        # Edit with your database credentials
npm install
npm run dev                  # Starts both frontend and backend
```

**FS-02 (SyncSpace):**
```bash
cd FS-02
cp .env.example .env        # Edit with your database credentials
npm install
npm run dev                  # Starts both frontend and backend
```

---

## Testing

**FS-01:**
```bash
cd FS-01
npm run test                 # Run backend test suite (Vitest)
```

**FS-02:**
```bash
cd FS-02/backend
npm test                     # Run backend test suite
```

---

## Original Repositories

| Project | Repository |
|---------|-----------|
| FS-01 | [nexvia-fs-01-nexmart](https://github.com/Ajinkyakakade02/nexvia-fs-01-nexmart) |
| FS-02 | [syncspace-fs-02](https://github.com/Ajinkyakakade02/syncspace-fs-02) |

---

## License

Private / Proprietary — Nexvia Technologies Private Limited
