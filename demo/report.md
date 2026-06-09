# AtomDrops Marketplace OS — Complete Project Report

## 1. Project Overview

AtomDrops Marketplace OS is a full-stack, multi-vertical e-commerce platform serving Bangladesh. It unifies four distinct commerce channels within a single codebase:

- **New Products** — Traditional catalog-based retail with cart and checkout. Vendors list and sell new items through branded storefronts.
- **Used / Pre-owned Listings** — Peer-to-peer marketplace for secondhand goods. Sellers list used items, buyers make offers with threaded negotiation.
- **Repair Services** — Customer-to-technician service matching. Customers describe issues, technicians submit quotes, bookings are scheduled and tracked.
- **Live Auctions** — Real-time bidding engine with WebSocket-driven countdowns, anti-sniping protection, and fraud detection.

The entire system operates in **BDT (Bangladeshi Taka)**, supports Dhaka-specific shipping zones (Inside Dhaka / Outside Dhaka), and integrates local payment methods (bKash, Nagad, Cash on Delivery, Card).

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Java, Spring Boot, Spring Data JPA, Spring Security | 21 / 4.0.6 |
| Database | PostgreSQL (Supabase cloud) | 15 |
| Frontend | React, TypeScript | 19 / 6.0 |
| Build (frontend) | Vite with Rolldown | 8.0 |
| Styling | Tailwind CSS | 4.3 |
| Real-time | STOMP WebSocket over SockJS + Server-Sent Events | — |
| State | TanStack React Query 5, Axios, localStorage | — |
| Forms | React Hook Form + Zod | 4 |
| Auth | Session-based (JSESSIONID HTTP-only cookie), no JWT | — |
| File Storage | Supabase Storage (`atomdrops` bucket) | — |
| Payments | bKash, Nagad, Card, Cash on Delivery | — |
| Build Tools | Maven (backend), Vite (frontend) | — |
| Testing | Node.js ESM scripts with direct `pg` DB connection | — |

---

## 3. Project Metrics

| Category | Count |
|---|---|
| Database tables | 71 |
| JPA entities | 85 |
| Spring Data repositories | 84 |
| Service classes | 17 |
| REST controllers | 31 |
| WebSocket controllers | 1 |
| Scheduled tasks | 2 (`fixedRate=2000ms` each) |
| Frontend pages | 30 |
| Shared React components | 15 |
| Custom React hooks | 2 |
| QA/test Node.js scripts | 4 |
| JUnit tests | 1 (`contextLoads`) |

---

## 4. User Roles & Permissions

| Role | Capabilities |
|---|---|
| **CUSTOMER** | Browse products, buy new/used items, bid in auctions, create repair requests, leave reviews, follow shops, manage wishlist, cart, addresses, notifications, messages |
| **VENDOR** | All CUSTOMER capabilities plus: create/manage shops, list/edit products, manage inventory, run auctions, manage orders (approve/pack/ship/deliver), respond to product questions, manage staff members, view analytics |
| **TECHNICIAN** | View open repair requests, submit quotes, complete bookings, manage service profile (specialization, bio, service area, pickup availability, social links) |
| **ADMIN** | Full system moderation: users (search/ban/suspend/role-update/reset-password), auctions (approve/reject/cancel/freeze/suspend), products (hide/delete/override), used listings, orders (status override, force-cancel), fraud flags (resolve), reports (resolve/dismiss), returns (approve/reject), platform settings (trust thresholds, commissions, shipping), analytics, system notifications, audit logs, data export, content moderation (reviews/bids/messages/conversations) |

**Upgrade Path:** Customer → Vendor (one-time ৳99 fee) or Customer → Technician (one-time ৳49 fee), paid through the upgrade system.

---

## 5. System Architecture & Working Flow

### 5.1 Authentication & User Flow

1. User registers with email, password, display name, and optional role selection
2. Backend creates User record + TrustScore record (initial: 50) + assigns roles
3. Login establishes JSESSIONID HTTP-only cookie — no JWT tokens
4. Frontend caches auth state via React Query with 5-minute stale time, persisted to localStorage
5. Logout clears session on both client and server
6. Users manage profile (avatar, bio, phone, location, DOB, gender), addresses (CRUD with default), and notifications

### 5.2 Vendor Shop System (Multi-Shop Architecture)

1. **Shop creation**: Vendor creates a shop with name (unique), logo, banner, description, primary category, location, policies
2. **Free tier**: Every vendor gets one shop free forever
3. **Subscription plans** for additional shops:
   - Builder (2 shops), Pro (4 shops), Business (7 shops), Enterprise (unlimited)
   - Bundle pricing incentivizes upgrading rather than stacking
4. **Shop statuses**: ACTIVE (live), PAUSED (hidden, data preserved), ARCHIVED (closed, data preserved)
5. **Staff management** (Business plan+): Owner, Manager, Inventory Staff, Customer Support roles
6. **Shop followers**: Customers follow shops to receive notifications for new products, discounts, and auctions
7. **Master Dashboard**: Aggregated data across all shops (revenue, orders, stock alerts, messages) with quick shop switcher
8. **Cross-shop rules**: Each shop has independent inventory, reviews, and reputation. Products belong to one shop only. Vendors cannot create two shops in the same category unless on Business plan+

### 5.3 Product Marketplace Flow

1. Vendor creates a shop first, then links products to it
2. Product fields: name, description, price (BDT), category, images, variants, stock levels, low-stock thresholds
3. Shipping: FREE or PAID, with separate rates for Inside Dhaka (৳60) and Outside Dhaka (৳100)
4. Customers browse by category, filter by price, search, ask product questions
5. Vendors respond to product questions
6. Customers add to wishlist, add to cart, leave ratings/reviews
7. **Product Detail Page** includes a "Visit Shop" section showing shop logo, name, rating, product count, follower count

### 5.4 Used / Pre-owned Listings Flow

1. Customer lists a used item with title, description, price, condition (Like New / Good / Fair / Needs Repair), warranty flag, images, video, item history, repair records
2. Buyers make **offers** on listings — sellers accept, counter, or reject
3. Offers support threaded messaging for price negotiation
4. Accepted used items can be added to cart and checked out alongside new products

### 5.5 Repair Services Flow

1. Technician creates a profile (specialization, bio, service area, pickup availability, social links)
2. Customer creates a repair request (issue description, optional pickup, media attachments)
3. Technicians browse open requests and submit **quotes** (price + repair plan + duration)
4. Customer reviews quotes and **accepts** one → booking scheduled
5. Booking progresses through lifecycle with progress tracking
6. Technician marks completed after service delivery
7. Customer leaves a review and rating

### 5.6 Auction System Flow

**Auction Types:** STANDARD (fixed duration), FLASH (1–30 minutes ultra-short)

**Lifecycle:** CREATED → APPROVED/REJECTED → PREPARING → ACTIVE → CLOSED
(Plus admin states: FROZEN, SUSPENDED, CANCELLED)

**Lots:** Each auction contains multiple lots with individual starting price, reserve price, minimum bid increment, current bid, status

**Bidding Rules (server-enforced):**
- Bid ≥ current bid + minimum increment
- Vendor cannot bid on own auction
- Bidder must accept Auction Rules (one-time agreement)
- Bidder must not be restricted by vendor
- Bidder account must be ACTIVE
- Bidder cannot already be highest bidder
- Previous winner auto-notified when outbid

**Real-time Engine:**
- STOMP WebSocket (`/ws/auction`) — bid placement and live broadcast
- SSE (`/api/auctions/{id}/events`) — status change broadcasts
- Frontend polls every 1.5–5 seconds as fallback

**Anti-sniping:** Bids within extension window extend lot's end time

**Winner Determination:**
- `AuctionScheduler` scans every 2 seconds for expired lots
- Highest valid bidder declared winner
- Reserve not met → no winner
- Payment deadline set (default: 48 hours)
- Winner notified via in-app notification

**Non-payment tracking:** After configurable threshold (default: 2), user restricted from auctions

### 5.7 Cart & Checkout Flow

1. Cart states: ACTIVE → PENDING_CHECKOUT → COMPLETED / CANCELLED / ABANDONED / EXPIRED
2. Supports new products and used listings in the same cart
3. **Coupons**: PERCENT or FLAT discount types, validated server-side
4. Shipping calculated per product (Inside Dhaka / Outside Dhaka rates)
5. Checkout creates Order with order items grouped by vendor
6. VendorCommission records generated per order item
7. ORDER conversation auto-created between buyer and each vendor for post-order chat

### 5.8 Order Management Flow

**Status Lifecycle:** PLACED → APPROVED → PACKED → SHIPPED → DELIVERED

- Customers can cancel within 24 hours before shipping
- Early cancellation triggers trust score penalty
- Vendors can reject orders (PLACED → REJECTED)
- Auto-invoice format: `INV-{timestamp}-{orderId}`
- In-app notifications for every status change (NEW_ORDER, ORDER_APPROVED, ORDER_SHIPPED, etc.)
- Email notifications via Spring Mail (Gmail SMTP configured)

### 5.9 Payment System

| Method | Behavior |
|---|---|
| bKash / Nagad / Card | Online payment → order APPROVED immediately |
| Cash on Delivery (COD) | Order stays PLACED until vendor marks delivered |

Transaction references: BKS-xxx, NGD-xxx, CRD-xxx, TXN-xxx. Admin refunds set status to REFUNDED.

### 5.10 Trust & Fraud Detection System

**Trust Score:** Dynamic per user (initial: 50). Decreases for cancellations, disputes, chargebacks. Increases for successful completions. Auto-suspend if score < 10.

**Risk Signals:**
- Repeated bidding between same users (shill bidding)
- User bids on only one seller's auctions (90%+ concentration)
- Bidder never wins (300+ bids, 0 purchases)
- Rapid bidding spikes (price jumps within seconds)
- Price manipulation rings (groups coordinating artificially)

**Penalty Escalation:** Warning → Temporary restriction → Auction ban

**Additional Features:**
- Vendors can restrict specific bidders
- Fraud flags for admin review
- User red flags (admin-attached notes)
- Detailed audit logging for admin actions

### 5.11 Admin Dashboard

- **User management**: Search, ban, suspend, delete, update roles, reset passwords, activity logs
- **Auction moderation**: Approve, reject, cancel, freeze, suspend, force-close
- **Product moderation**: Hide, delete, override fields
- **Used listing moderation**: Hide, delete, override
- **Order management**: Status override, force-cancel
- **Fraud flags**: View OPEN/RESOLVED, resolve
- **Reports**: Resolve or dismiss user-submitted reports
- **Returns**: Approve or reject return requests
- **Platform settings**: Trust thresholds, auction parameters, commission rates, shipping defaults
- **Analytics dashboard**: Total users, auctions, products, orders, open reports, pending returns, daily snapshots
- **System notifications**: Create/update/delete role-targeted announcements
- **Audit logging**: Every admin action logged with old/new data diff
- **Data export**: Export users, products, orders, auctions, payments, used-listings, service-listings
- **Content moderation**: Delete reviews, bids, messages, conversations

---

## 6. Real-Time Architecture

AtomDrops uses a **dual real-time strategy**:

| Technology | Endpoint | Direction | Purpose |
|---|---|---|---|
| STOMP WebSocket (SockJS) | `/ws/auction` | Bidirectional | Bid placement, live broadcast to watchers |
| Server-Sent Events (SSE) | `/api/auctions/{id}/events` | Server→Client | Auction status change broadcasts |

Frontend fallback: polls active auctions every 1.5–5 seconds.

---

## 7. Frontend Architecture

### 7.1 Component Tree
```
main.tsx
├── StrictMode
│   └── BrowserRouter
│       └── PersistQueryClientProvider (localStorage)
│           └── AuthProvider
│               └── AuthModalProvider
│                   ├── App (Routes)
│                   └── Toaster (react-hot-toast)
```

### 7.2 Shared Components (15)
| Component | Purpose |
|---|---|
| Navbar | Sticky nav with search, auth state, cart, notifications, role-based links, user dropdown |
| Footer | Site footer with links |
| SiteLayout | Wrapper: Navbar + main content + Footer |
| HeroSection | Homepage hero with featured product |
| CategoryGrid | Homepage category browsing grid |
| HotProducts | Homepage trending products section |
| AuctionHighlight | Homepage featured auction highlight |
| ProductCard | Reusable product card for listings |
| AuthModal | Sign in / Register modal with tab switching |
| ImageLightbox | Fullscreen image viewer |
| MediaUploader | Image/video upload with Supabase Storage |
| AuctionCountdown | Real-time auction countdown timer |
| ConfirmDialog | Confirmation prompt for destructive actions |
| ResultDialog | Status result modal |
| RequireRole | Route guard component for role-based access |

### 7.3 Custom Hooks (2)
| Hook | Purpose |
|---|---|
| `useAuctionWebSocket` | WebSocket connection to STOMP broker for live bidding |
| `useConfirmAction` | Manages confirmation dialog state and action execution |

### 7.4 All Routes (30 pages)

| Route | Page Component | Access |
|---|---|---|
| `/` | HomePage | Public |
| `/products` | ProductListPage | Public |
| `/products/:id` | ProductDetailPage | Public |
| `/shop/:slug` | VendorShopPage (storefront) | Public |
| `/cart` | CartPage | Customer+ |
| `/checkout` | CheckoutPage | Customer+ |
| `/order-success/:id` | OrderSuccessPage | Customer+ |
| `/search?q=` | (inline in Navbar) | Public |
| `/used-listings` | UsedListingsPage | Public |
| `/used-listings/:id` | UsedListingDetailPage | Public |
| `/used-listings/new` | CreateUsedListingPage | Customer+ |
| `/auctions` | AuctionsPage | Public |
| `/auctions/:id` | AuctionDetailPage | Public |
| `/repair` | RepairMarketplacePage | Public |
| `/repair/technicians` | TechniciansPage | Public |
| `/repair/technicians/:id` | TechnicianDetailPage | Public |
| `/repair/requests` | RepairRequestsPage | Customer+ |
| `/repair/requests/:id` | RepairRequestDetailPage | Customer+ |
| `/repair/dashboard` | TechnicianDashboardPage | Technician |
| `/account/orders` | AccountOrdersPage | Customer+ |
| `/profile` | ProfilePage | Authenticated |
| `/wishlist` | WishlistPage | Customer+ |
| `/addresses` | AddressesPage | Authenticated |
| `/notifications` | NotificationsPage | Authenticated |
| `/messages` | MessagesPage | Authenticated |
| `/vendor/dashboard` | VendorDashboardPage | Vendor |
| `/vendor/products` | VendorProductsPage | Vendor |
| `/vendor/orders` | VendorOrdersPage | Vendor |
| `/vendor/auctions` | VendorAuctionsPage | Vendor |
| `/vendor/shops` | VendorShopManagerPage | Vendor |
| `/vendor/subscription` | VendorSubscriptionsPage | Vendor |
| `/admin` | AdminDashboardPage | Admin |
| `/auth/login` | AuthRedirect → opens AuthModal | Public |
| `/auth/register` | AuthRedirect → opens AuthModal | Public |

### 7.5 Backend API Controllers (31 + 2)

| Controller | Endpoint Prefix | Purpose |
|---|---|---|
| AuthController | `/api/auth` | Register, login, logout, session check |
| ProductController | `/api/products` | Product CRUD, listing, detail |
| CategoryController | `/api/categories` | Category tree |
| CartController | `/api/cart` | Cart CRUD, item management |
| OrderController | `/api/orders` | Order lifecycle, status |
| PaymentController | `/api/payments` | Payment processing, methods |
| AddressController | `/api/addresses` | User address CRUD |
| ProfileController | `/api/users/*/profile` | Profile CRUD |
| ReviewController | `/api/products/*/reviews` | Ratings and reviews |
| WishlistController | `/api/wishlist` | Wishlist CRUD |
| ProductQuestionController | `/api/products/*/questions` | Q&A between customers and vendors |
| UsedListingController | `/api/used-listings` | Used listing CRUD, offers |
| OfferController | `/api/offers` | Offer accept/counter/reject |
| AuctionController | `/api/auctions` | Auction CRUD, lifecycle |
| AuctionLotController | `/api/auctions/*/lots` | Lot management |
| AuctionPaymentController | `/api/auctions/*/payment` | Post-auction payment |
| AuctionWinnerController | `/api/auctions/*/winner` | Winner determination |
| WatchlistController | `/api/watchlist` | Auction watchlist |
| BidController | (via AuctionController) | Bidding |
| AuctionWsController | `/ws/auction` (WebSocket) | Real-time bid relay |
| RepairController | `/api/repair` | Requests, quotes, bookings |
| TechnicianController | `/api/technicians` | Technician profile CRUD |
| ServiceListingController | `/api/service-listings` | Technician service listings |
| ShopController | `/api/shops` | Shop CRUD, staff, followers |
| VendorPanelController | `/api/vendor/*` | Vendor dashboard data |
| VendorPublicController | `/api/vendors/*/public` | Public vendor info |
| VendorSubscriptionController | `/api/vendor/subscription` | Subscription plans, upgrades |
| NotificationController | `/api/notifications` | In-app notifications CRUD |
| ChatController | `/api/conversations`, `/api/messages` | Messaging system |
| ReportController | `/api/reports` | User-submitted reports |
| ReturnController | `/api/returns` | Return requests, approval |
| ShipmentController | `/api/shipments` | Shipment tracking |
| AdminController | `/api/admin/**` | Admin moderation (users, auctions, products, orders, flags, reports, returns, settings, audit, export) |
| SystemNotificationController | `/api/system-notifications` | Platform-wide announcements |
| UpgradeController | `/api/upgrade` | Role upgrade (Customer→Vendor/Technician) |
| UserAgreementController | `/api/user-agreements` | Auction rules agreement |

---

## 8. Database Schema

- **71 tables** in `supabase-migration.sql` (1431 lines)
- Schema organized into 30+ functional sections covering all domains
- `ddl-auto=update` enabled for development; production managed via Supabase SQL Editor
- Auto-trigger `fn_set_updated_at()` maintains `updated_at` timestamps across all tables
- Seed data: 4 roles, 1 admin user (`admin@login.com` / `88888888`), 10 categories, 4 condition levels, 17 platform settings, 5 vendor subscription plans

### Key Table Groups
- **Users & Auth**: users, roles, user_roles
- **Products**: products, product_images, product_variants, inventory
- **Shops**: shops, shop_staff, shop_followers, vendor_subscriptions, vendor_subscription_plans
- **Categories**: categories
- **Coupons**: coupons
- **Cart & Orders**: carts, cart_items, orders, order_items
- **Payments**: payments, vendor_commissions, invoices
- **Shipping**: shipments
- **Used Listings**: used_listings, used_listing_offers, used_listing_offer_messages
- **Auctions**: auctions, auction_lots, bids, auction_rules_agreements
- **Repair**: repair_requests, repair_quotes, repair_bookings, repair_progress, repair_media, repair_spare_parts, repair_reviews, technicians
- **Reviews**: reviews
- **Trust & Fraud**: trust_scores, fraud_flags, user_red_flags, bidder_restrictions
- **Reports**: reports
- **Returns**: returns
- **Notifications**: notifications, system_notifications
- **Messages**: conversations, conversation_participants, messages
- **Analytics**: daily_snapshots
- **Audit**: audit_logs
- **Platform**: platform_settings

---

## 9. Automation & QA Scripts

| Script | Lines | Purpose |
|---|---|---|
| `qa-e2e-smoke.mjs` | 531 | Full end-to-end smoke test covering auth, profiles, addresses, upgrades, products, cart, orders, payments, used listings, offers, repair, auctions, bidding, winner determination, admin actions, fraud flags, reports, returns, notifications |
| `qa-seed-countdown-auction.mjs` | 94 | Seeds an active FLASH auction with configurable countdown for UI demonstration |
| `qa-test-vendor-shops.mjs` | 545 | Vendor shop CRUD validation: create, edit, staff management, subscription enforcement |
| `query-orders.mjs` | 47 | Diagnostic tool: queries recent orders, payments, and status counts |

All scripts connect directly to PostgreSQL via the `pg` client and expect environment variables: `QA_BASE_URL`, `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`.

---

## 10. Key Design Decisions

1. **Session auth over JWT** — Simpler server-side control; sessions invalidated instantly without token blacklists
2. **Dual real-time (WebSocket + SSE)** — WebSocket for bidirectional bid placement; SSE for server-to-client broadcasts; provides fallback
3. **Bangladesh-first** — BDT currency, Dhaka shipping zones (Inside/Outside ৳60/৳100), bKash/Nagad payments
4. **Modular verticals** — Products, used listings, repair, and auctions share core infrastructure (users, auth, payments, notifications) but operate independently
5. **85-entity domain model** — Rich relational model with full audit trails, trust scoring, and fraud detection
6. **Node.js QA scripts over JUnit** — Real-world integration testing via direct database connection rather than mocked Spring tests
7. **Free-first vendor model** — One shop free forever; additional shops monetized through tiered subscriptions
8. **Shop-centric product model** — Every product belongs to a branded storefront, creating clear vendor identity
9. **Vendor subscription bundling** — Higher tiers priced cheaper per shop, incentivizing scaling up

---

## 11. Configuration Summary

| Setting | Value |
|---|---|
| Session timeout | 7 days, HTTP-only, SameSite=Lax, `secure=false` (dev) |
| CORS origins | `localhost:5173`, `localhost:5174` |
| WebSocket | STOMP at `/ws/auction`, SockJS fallback, in-memory broker `/topic/**`, app prefix `/app` |
| Auction scan interval | Every 2 seconds |
| Default admin | `admin@login.com` / `88888888` |
| Trust score initial | 50 |
| Auto-suspend threshold | 10 |
| Non-payment limit | 2 (configurable) |
| Payment deadline | 48 hours |
| Shipping (Inside Dhaka) | ৳60 |
| Shipping (Outside Dhaka) | ৳100 |
| Mail | Gmail SMTP (configured) |

---

## 12. Documentation Map

| File | Content |
|---|---|
| `master.md` | Full architecture overview covering all four verticals, auth, payments, trust scoring, cart/order state machines, QA |
| `auction.md` | Deep-dive on auction lifecycle, bid panel UX, bidding rules, fraud detection, winner determination |
| `AGENTS.md` | Operational guide for AI agents: repo layout, commands, auth, database, architecture quirks, testing |
| `AtomDrops_Vendor_Masterplan.md` | Complete vendor module spec: onboarding, shop creation, multi-shop system, subscriptions, staff management, storefronts |
| `report.md` | This file — comprehensive project report |
| `supabase-migration.sql` | Full 71-table schema with seed data |

---

## 13. Getting Started

### Prerequisites
- Java 21+
- Node.js 22+
- Maven Wrapper (included)

### Backend
```bash
cd demo
./mvnw spring-boot:run    # Starts on http://localhost:8080
```

### Frontend
```bash
cd demo/frontend
npm install
npm run dev               # Starts on http://localhost:5173
```

### E2E Testing
```bash
cd demo
node scripts/qa-e2e-smoke.mjs
node scripts/qa-seed-countdown-auction.mjs
node scripts/qa-test-vendor-shops.mjs
```

### Default Admin
- Email: `admin@login.com`
- Password: `88888888`
