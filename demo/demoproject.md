# AtomDrops Marketplace OS — Feature & Workflow Documentation

## 1. Project Overview

AtomDrops Marketplace OS is a full-stack, multi-vendor marketplace platform tailored for Bangladesh. It unifies **four commerce verticals** into a single system:

- **New Product Sales** — Traditional e-commerce marketplace with vendor shops
- **Used/Pre-owned Listings** — Peer-to-peer second-hand sales with offer negotiation
- **Repair Services** — Customer-to-technician service matching with quoting
- **Live Auctions** — Real-time bidding engine with multiple auction types

The system operates on **BDT (Bangladeshi Taka)**, supports **Dhaka-specific shipping zones**, and integrates **local payment methods** (bKash, Nagad, COD).

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 4.0.6, Spring Data JPA, Spring Security |
| Database | PostgreSQL 15 (Supabase) |
| Real-time | STOMP WebSocket (SockJS fallback) + Server-Sent Events (SSE) |
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4 |
| State Management | TanStack React Query 5, Axios |
| Forms | React Hook Form + Zod |
| Authentication | Session-based (JSESSIONID HTTP-only cookie, no JWT) |
| File Storage | Supabase Storage (bucket: `atomdrops`) |
| Build Tools | Maven (backend), Vite (frontend) |

---

## 3. User Roles & Capabilities

### CUSTOMER
- Browse products, auctions, used-listings, and technicians
- Purchase new and used items
- Bid in live auctions
- Create repair requests and accept technician quotes
- Leave reviews and ratings
- Manage wishlist, addresses, profile, and notifications
- Use chat/messaging for order and offer conversations

### VENDOR
- All CUSTOMER capabilities
- Create/edit products with inventory variants
- Manage orders (approve, pack, ship, reject)
- Create and publish auctions with multiple lots
- Manage shops (multiple shops via subscription plans)
- Respond to product questions
- Restrict specific bidders from auctions

### TECHNICIAN
- View open repair requests
- Submit quotes (price + repair plan)
- Complete bookings after service delivery
- Manage service profile (bio, specialization, availability)
- View earnings dashboard

### ADMIN
- Full system moderation:
  - **Users**: search, ban, suspend, delete, upgrade roles
  - **Auctions**: approve, reject, cancel, freeze, suspend, force-close
  - **Products**: hide, delete, override fields
  - **Used listings**: hide, delete, override
  - **Orders**: status override, force-cancel
  - **Fraud flags**: view and resolve
  - **Reports**: resolve or dismiss
  - **Returns**: approve or reject
  - **Platform settings**: configure trust thresholds, auction parameters, commission rates, shipping defaults
  - **Analytics dashboard**: real-time metrics (users, auctions, products, orders, reports)
  - **System notifications**: create/update/delete role-targeted announcements
  - **Audit logging**: every admin action logged with old/new data diff
  - **Data export**: export users, products, orders, auctions, payments, used-listings, service-listings

---

## 4. Module Features & Workflows

### 4.1 Authentication & User Management

**Features:**
- Email/password registration and login
- Session-based authentication (JSESSIONID HTTP-only cookie)
- Role management (CUSTOMER, VENDOR, TECHNICIAN, ADMIN)
- Role upgrades with one-time fee (99 BDT default)
- Profile management (avatar, bio, phone, location, DOB, gender)
- Address CRUD with default selection
- Password reset via token

**Workflow:**
1. User registers with email, password, display name, and roles
2. Backend creates User + TrustScore (initial: 50) + assigns roles
3. JSESSIONID cookie established on successful login
4. Frontend caches auth state via React Query (5-min stale time, localStorage persistence)
5. All API calls include session cookie automatically (`withCredentials: true`)
6. Logout clears session on both client and server

### 4.2 Product Marketplace (New Items)

**Features:**
- Product CRUD by vendors with name, description, price, category
- Product images (multiple, sorted)
- Product variants (SKU, price offset)
- Inventory tracking with low-stock thresholds
- Shipping configuration (FREE/PAID, Inside Dhaka 60 BDT / Outside Dhaka 100 BDT)
- Category hierarchy with parent-child relationships
- Product search with full-text search
- Product Q&A (buyers ask, vendors answer)
- Ratings and reviews (1-5 stars)
- Wishlist management
- Multi-shop support via vendor subscription plans (5 tiers: BASIC free to ENTERPRISE 4999 BDT/month)

**Workflow:**
1. Vendor creates product → status DRAFT or ACTIVE
2. Product appears in marketplace listing
3. Customer browses by category, searches, filters
4. Customer views product detail, reads reviews, asks questions
5. Customer adds to cart or wishlist
6. Vendor manages inventory, responds to questions, tracks stock

### 4.3 Shopping Cart & Checkout

**Features:**
- Cart states: ACTIVE → PENDING_CHECKOUT → COMPLETED / CANCELLED / ABANDONED / EXPIRED
- Supports both new products and used listings in same cart
- Coupon application (FLAT or PERCENT discount)
- Automatic shipping calculation (Inside/Outside Dhaka)
- Combined checkout flow

**Workflow:**
1. Customer adds items to cart (products + used items)
2. Cart updates quantity, applies coupons
3. Customer proceeds to checkout
4. Shipping address selected from saved addresses
5. Payment method chosen (bKash/Nagad/Card/COD)
6. Order created with order items, vendor commissions, auto-invoice
7. Order conversation auto-created between buyer and each vendor

### 4.4 Order Management

**Features:**
- Order lifecycle: PLACED → APPROVED → PACKED → SHIPPED → DELIVERED
- Vendor-managed order processing
- Customer cancellation (within 24 hours before shipping)
- Vendor rejection (PLACED → REJECTED)
- Auto-invoice generation (`INV-{timestamp}-{orderId}`)
- Automated vendor commission tracking per order item
- Order status change notifications (in-app + email)
- Return requests (OPEN → APPROVED/REJECTED → COMPLETED/CANCELLED)
- Shipment tracking with carrier and events

**Workflow:**
1. Customer places order → status PLACED
2. Vendor reviews and APPROVES or REJECTS
3. Vendor marks PACKED when ready
4. Vendor marks SHIPPED with carrier/tracking info
5. Customer receives → status DELIVERED
6. Customer can request return within window
7. Admin approves/rejects return

### 4.5 Payment System

**Features:**
- 4 payment methods: bKash, Nagad, Card, COD
- Online payments (bKash/Nagad/Card) auto-approve order
- COD keeps order PLACED until delivery
- Transaction references per method (BKS-xxx, NGD-xxx, CRD-xxx, TXN-xxx)
- Admin refund processing (status → REFUNDED)
- Vendor commission tracking per order item
- Repair payments tracked separately with technician earnings

### 4.6 Used / Pre-owned Listings

**Features:**
- Customer-to-customer second-hand sales
- Condition levels: Like New, Good, Fair, Needs Repair
- Item history tracking (owner count, usage duration)
- Repair records for listed items
- Image and video attachments
- Warranty flag
- Offer system with negotiation

**Offer Workflow:**
1. Seller lists used item with title, description, price, condition, images
2. Buyer browses listings and makes an offer with expiry date
3. Seller can accept, reject, or counter the offer
4. Buyer and seller negotiate via threaded messages
5. Accepted offer → item added to cart
6. Checkout alongside new products for combined purchase

### 4.7 Repair Services

**Features:**
- Technician profiles (specialization, bio, service area, availability schedule)
- Service listings by technicians (category, price range)
- Repair request creation by customers
- Quote submission by technicians
- Booking scheduling
- Service completion tracking
- Repair payment tracking with technician earnings/commissions
- Spare parts tracking
- Repair progress milestones
- Technician level history (Beginner → Verified → Expert)

**Workflow:**
1. Technician sets up profile with specialization, bio, service area
2. Customer creates repair request with description, optional pickup, media attachments
3. Technicians browse open requests and submit quotes (price + plan)
4. Customer reviews quotes and accepts one
5. Booking scheduled with date
6. Technician completes service → marks booking COMPLETED
7. Payment processed, technician earns commission

### 4.8 Live Auction System (Core Differentiator)

**Features:**
- **Auction Types:** STANDARD (fixed duration), FLASH (1-30 minute short duration), REVERSE, RESERVE
- **Lifecycle:** CREATED → APPROVED/REJECTED → PREPARING → ACTIVE → EXTENDED → CLOSED → COMPLETED
- Multi-lot support per auction
- Anti-sniping: automatic time extension when bid placed near close
- Real-time bidding via WebSocket + SSE
- Bidder restriction system
- Auction watchlist
- Reserve price enforcement
- Non-payment tracking and penalties

**Auction Workflow (Full Cycle):**
1. **Creation:** Vendor creates auction with title, type, start/end times, terms accepted → status CREATED
2. **Lots:** Each auction can have multiple lots with starting price, reserve price, min bid increment, extension settings
3. **Moderation:** Admin approves or rejects → status APPROVED or REJECTED
4. **Scheduler:** Every 2 seconds scans for auctions whose start time passed → status PREPARING → ACTIVE
5. **Bidding (WebSocket):**
   - Bidder accepts Auction Rules agreement (one-time via `user_agreements`)
   - Bid placed via STOMP `/app/bid.place`
   - Server validates: bid ≥ current + increment, vendor not self-bidding, bidder not restricted, account ACTIVE
   - On valid bid: broadcast to `/topic/auction.{id}` for all watchers
   - Previous highest bidder notified when outbid
6. **Anti-sniping:** Bid within extension window → lot end time extended (default: 5 min, max 3 extensions)
7. **Closing:** Scheduler runs every 2 seconds, closes expired lots, determines winner
8. **Winner:** Highest valid bid wins; reserve not met → no winner
9. **Payment:** Payment deadline set (default: 48 hours), winner pays via bKash/Nagad/Card
10. **Non-payment:** After threshold (default: 2) → restricted/banned from auctions

**Real-time Architecture:**
- **STOMP WebSocket** at `/ws/auction` (SockJS fallback): bidirectional bid placement and live broadcast
- **SSE** at `/api/auctions/{id}/events`: auction status change broadcasts
- Frontend auto-refresh every 1.5-5 seconds as fallback
- In-app notifications for outbid and auction won events

### 4.9 Vendor Module

**Features:**
- Shop management (name, slug, logo, banner, category, verification level)
- Multi-shop support via subscription plans (BASIC/BUILDER/PRO/BUSINESS/ENTERPRISE)
- Subscription billing (monthly/yearly) with promotional deals
- Product CRUD with inventory and variants
- Order management dashboard
- Auction management
- Shop followers
- Shop staff roles (OWNER/MANAGER/INVENTORY/SUPPORT)
- Analytics per shop

### 4.10 Admin Dashboard & Moderation

**Features:**
- User management: search, ban, suspend, delete, role upgrade, password reset
- Auction moderation: approve, reject, cancel, freeze, suspend, force-close
- Product moderation: hide, delete, field override
- Used listing moderation: hide, delete, field override
- Order management: status override, force-cancel
- Fraud flags: view OPEN/RESOLVED flags, resolve
- Reports: resolve or dismiss
- Returns: approve or reject
- Platform settings: configure all system parameters
- Analytics dashboard: total users, auctions, products, orders, open reports, pending returns, daily snapshots
- System notifications: create/update/delete role-targeted announcements
- Audit logging: every admin action logged with old/new data diff
- Data export: export users, products, orders, auctions, payments, used-listings, service-listings
- Content moderation: delete reviews, bids, messages, conversations

### 4.11 Trust & Fraud Detection System

**Features:**
- **Trust Score:** Dynamic per user (initial: 50), adjusts based on behavior
- **Risk Signals:**
  - Repeated bidding between same users (shill bidding)
  - User frequently bids on only one seller's auctions
  - Bidder never wins despite high bid volume
  - Rapid bidding spikes (price jumps within seconds)
  - Price manipulation rings
- **Penalty Escalation:** Warning → Temporary restriction → Auction ban
- **Bidder Restrictions:** Vendors restrict specific bidders
- **Fraud Flags:** Admin-reviewed suspicious activity records
- **User Red Flags:** Admin notes on accounts
- **Auto-suspend:** Trust score below threshold (default: 10) triggers auto-suspension

### 4.12 Real-Time & Notification System

**Features:**
- **STOMP WebSocket** (`/ws/auction`): real-time bid placement and broadcasts
- **SSE** (`/api/auctions/{id}/events`): status change broadcasts
- **In-app notifications:** NEW_ORDER, ORDER_APPROVED, ORDER_SHIPPED, ORDER_DELIVERED, outbid alerts, auction won, payment confirmations
- **System notifications:** INFO, WARNING, MAINTENANCE, POLICY_UPDATE (role-targeted)
- **Email notifications:** order status changes via Spring Mail (Gmail SMTP)
- **Notification subscriptions:** per event type per user

---

## 5. Cross-Module Data Flow

```
User (any role)
  ├── Authentication (session cookie)
  ├── Profile & Addresses
  ├── Products (browse, buy, review)
  │     └── Cart → Checkout → Order → Payment → Shipment
  ├── Used Listings (browse, offer, negotiate)
  │     └── Cart → Checkout (combined with products)
  ├── Repair Services (request, quote, book, complete)
  │     └── Payment (separate tracking)
  ├── Auctions (bid via WebSocket, win, pay)
  │     └── Payment → Winner tracking
  └── Notifications (in-app + email)
```

---

## 6. Key Design Decisions

| Decision | Rationale |
|---|---|
| Session auth over JWT | Simpler server-side control; sessions invalidated instantly |
| Dual real-time (WebSocket + SSE) | WebSocket for bidirectional bid placement; SSE for server-to-client status broadcasts; fallback options |
| Bangladesh-first | BDT currency, Dhaka shipping zones, bKash/Nagad payment methods |
| Modular verticals | Product marketplace, used listings, repair services, and auctions share core infrastructure (users, auth, payments, notifications) but operate independently |
| Scheduler-driven auction lifecycle | Every 2 seconds scan for opening/closing auctions (not event-driven) for simplicity |
| In-memory STOMP broker | Suitable for single-instance; no external message broker dependency |
| Manual SQL schema | `supabase-migration.sql` is source of truth; `ddl-auto=update` only for dev convenience |

---

## 7. Automation & QA

| Script | Purpose |
|---|---|
| `qa-e2e-smoke.mjs` | Full end-to-end smoke test covering all verticals |
| `qa-seed-countdown-auction.mjs` | Seeds active FLASH auction with 5-minute countdown for UI demos |
| `query-orders.mjs` | Diagnostic querying of recent orders and payments |
| `test-upgrade.ps1` | Upgrade flow test (PowerShell) |
