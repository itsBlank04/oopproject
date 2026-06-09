# AtomDrops Marketplace OS — Project Overview

**Generated:** June 9, 2026

---

## 1. Project Scope

AtomDrops is a full-stack multi-vertical e-commerce platform serving Bangladesh. It operates four distinct commerce channels within a single codebase:

- **New Products** — traditional catalog-based retail with cart and checkout
- **Used / Pre-owned Listings** — peer-to-peer marketplace for secondhand goods with offers and messaging
- **Repair Services** — connects customers with technicians for device repair bookings, quotes, and tracking
- **Live Auctions** — real-time bidding with WebSocket-driven countdowns and anti-sniping protection

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Java + Spring Boot | 21 / 4.0.6 |
| Database | PostgreSQL (Supabase) | 15 |
| Frontend | React + TypeScript | 19 / 6.0 |
| Build (frontend) | Vite | 8.0 |
| Styling | Tailwind CSS | 4.3 |
| Real-time | STOMP WebSocket + SSE | — |
| Payments | bKash, Nagad, Card, COD | — |

---

## 3. Architecture Highlights

- **Monorepo** rooted at `demo/` — Maven backend in `src/`, Vite-powered React frontend in `frontend/`.
- **Session-based authentication** — JSESSIONID HTTP-only cookie, no JWT. Login via `POST /api/auth/login`.
- **Four user roles** — CUSTOMER, VENDOR, TECHNICIAN, ADMIN — with an upgrade flow (customer → vendor/technician).
- **Dual real-time** — WebSocket (bidirectional bidding) and SSE (status broadcasts) run concurrently.
- **Dynamic trust scoring** — Each user has a score starting at 50. Fraud signals (shill bidding, price rings) trigger penalties; scores below 10 result in auto-suspension.
- **Auction scheduler** scans every 2 seconds for expired lots, transitions states, and determines winners.
- **Cart/Order state machines** — Carts move through ACTIVE → PENDING_CHECKOUT → COMPLETED/CANCELLED/ABANDONED/EXPIRED; Orders follow PLACED → APPROVED → PACKED → SHIPPED → DELIVERED.

---

## 4. Database

- **71 tables** defined in `supabase-migration.sql` (1431 lines).
- Schema organized into 30+ functional sections: users, products, inventory, coupons, auctions, bids, cart, orders, payments, shipping, repair, used listings, conversations, notifications, reviews, trust/fraud, reports, returns, audit log, upgrade flow, vendor subscriptions, shops, analytics, and platform settings.
- `ddl-auto=update` enabled for development; production schema managed via Supabase SQL Editor.
- Trigger `fn_set_updated_at()` auto-maintains `updated_at` timestamps across all tables.
- Seed data includes 4 roles, 1 admin user, 10 categories, 4 condition levels, 17 platform settings, and 5 vendor subscription plans.

---

## 5. Backend (Java)

- **85 JPA entities** in `model/` covering every domain concept.
- **84 Spring Data repositories** in `repository/`.
- **17 service classes** handling business logic: AuctionService, BidService, CartService, OrderService, PaymentService, ReviewService, ShopService, UpgradeService, etc.
- **31 REST controllers** plus `AuthController` and `AuctionWsController` (WebSocket).
- **Scheduler**: `AuctionScheduler` with two `@Scheduled(fixedRate=2000)` methods for lot expiry and winner processing.
- **Configuration**: `SecurityConfig` (session strategy, role-based access), `WebSocketConfig` (STOMP), `GlobalExceptionHandler`, `DatabaseMigrator`.
- **`DataInitializer`**: `CommandLineRunner` that seeds roles, admin, categories, condition levels, and platform settings on startup.

---

## 6. Frontend (React)

- **30 pages** organized into 8 route groups: home, account, admin, auctions, cart, products, repair, used, vendor.
- **15 shared components**: Navbar, Footer, HeroSection, ProductCard, AuctionCountdown, AuthModal, MediaUploader, etc.
- **State management**: AuthContext for session state, TanStack React Query for server state, Axios with `withCredentials` for API calls.
- **Real-time**: `useAuctionWebSocket` hook connects to STOMP broker at `/ws/auction`.
- **Storage**: Supabase Storage client for media uploads.
- **Build pipeline**: `tsc -b && vite build` with full TypeScript strictness.

---

## 7. Testing Strategy

- **One JUnit test** (`DemoApplicationTests.contextLoads`) verifies Spring context boots.
- **Four Node.js ESM scripts** in `scripts/` serve as the real test suite:
  - `qa-e2e-smoke.mjs` — full end-to-end smoke test (531 lines)
  - `qa-seed-countdown-auction.mjs` — seeds an auction with a configurable countdown
  - `qa-test-vendor-shops.mjs` — vendor shop CRUD validation (545 lines)
  - `query-orders.mjs` — order diagnostic queries
- Scripts connect directly to the database via the `pg` client and expect `QA_BASE_URL`, `QA_ADMIN_EMAIL`, and `QA_ADMIN_PASSWORD` environment variables.

---

## 8. Project Metrics

| Category | Count |
|---|---|
| Database tables | 71 |
| JPA entities | 85 |
| Repositories | 84 |
| Service classes | 17 |
| REST controllers | 31 |
| WebSocket controllers | 1 |
| Frontend pages | 30 |
| Shared components | 15 |
| QA/test scripts | 4 |
| Unit tests | 1 |

---

## 9. Key Configuration

- **Session timeout**: 7 days, HTTP-only, SameSite=Lax, `secure=false` (dev)
- **CORS origins**: `localhost:5173` and `localhost:5174`
- **WebSocket**: STOMP at `/ws/auction` with SockJS fallback, in-memory broker `/topic/**`, app prefix `/app`
- **Mail**: Gmail SMTP configured (credentials placeholder)
- **Default admin**: `admin@login.com` / `88888888`
- **BDT currency**, Dhaka shipping zones, bKash/Nagad payment gateways

---

## 10. Documentation

- `master.md` — full architecture overview covering all four verticals, auth, payments, trust scoring, cart/order state machines, and QA.
- `auction.md` — deep-dive on auction lifecycle, bid panel UX, bidding rules, fraud detection, and winner determination.
- `AGENTS.md` — operational guide for AI agents working with the codebase.
