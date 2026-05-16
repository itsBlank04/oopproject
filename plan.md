================================================================
  SMART MULTI-VENDOR MARKETPLACE SYSTEM
  Complete System Specification — Finalized
================================================================

================================================================
  SYSTEM STATUS OVERVIEW
================================================================

  ✅ = Fully Implemented
  ⚠️ = Partially Implemented
  📋 = Planned / Not Started

  USER ROLES:      ✅ VENDOR  ✅ CUSTOMER  ✅ TECHNICIAN  ✅ ADMIN
  MODULE 1:        ✅ Main Marketplace (New Products)
  MODULE 2:        ✅ Used Items (Second-Hand Marketplace)
  MODULE 3:        ✅ Repair Service Marketplace
  MODULE 4:        ✅ Auction System + Real-Time Bidding
  CORE SYSTEMS:    ✅ Trust Score  ✅ Fraud Detection
  SECURITY:        ✅ All endpoints have auth guards
  FRONTEND:        ✅ React 19 + Vite + Tailwind 4 + React Query
  BACKEND:         ✅ Spring Boot 3 + JPA + PostgreSQL
  REAL-TIME:       ✅ WebSocket STOMP for live bidding

================================================================
  USER ROLES & RESPONSIBILITIES
================================================================

----------------------------------------------------------------
  1. VENDOR (Seller)
----------------------------------------------------------------

  ✅ Manage inventory (new products CRUD)
  ✅ List products in the main marketplace
  ✅ Sell in the used items section
  ✅ Create and manage auction sessions (subject to admin approval)
  ✅ Set auction schedules and pricing
  📋 View bidder trust scores and reliability stats
  📋 Restrict low-trust or unreliable bidders
  📋 Sales performance reports
  📋 Product-level insights
  📋 Auction analytics (total bids, unique bidders, peak time, final vs. expected price)
  📋 Chat with customers directly
  📋 Report users when necessary

----------------------------------------------------------------
  2. CUSTOMER / USER
----------------------------------------------------------------

  ✅ Browse and purchase new products
  ✅ Browse and purchase used items
  ✅ Sell their own used items
  ✅ Browse active auctions
  ✅ Place bids in real time
  ✅ Manage watchlist
  ✅ Upload repair requests
  ✅ Receive quotes and repair plans from technicians
  ✅ Schedule and book repair services
  ✅ Rate and review technicians after completed repairs
  📋 Receive outbid / ending-soon notifications
  📋 Chat with vendors and technicians
  📋 Report users when necessary

----------------------------------------------------------------
  3. REPAIR TECHNICIAN
----------------------------------------------------------------

  ✅ Register with specialization
  ✅ View and respond to open repair requests
  ✅ Send quotes and detailed repair plans
  ✅ Accept bookings
  ✅ Mark services as complete
  ✅ Offer optional pickup & delivery for large items
  ✅ Ratings & reviews from customers
  📋 Create service listings (category, price range, location, availability)
  📋 Completion rate tracking
  📋 Progressive level system: Beginner → Verified → Expert
  📋 Booking volume and earnings dashboard

----------------------------------------------------------------
  4. ADMIN
----------------------------------------------------------------

  ✅ Monitor trust scores across all users
  ✅ View and resolve fraud alerts
  ✅ Approve or reject vendor auction sessions
  ✅ All admin API endpoints secured with role check
  📋 Ban or unban any user
  📋 Handle disputes between parties
  📋 Platform-wide analytics dashboard
  📋 Fraud trends and alert history
  📋 Revenue and sales tracking
  📋 Auction performance monitoring

================================================================
  MODULE 1 — MAIN MARKETPLACE (New Products)
================================================================

  ✅ Vendors manage product listings (CRUD + ownership verification)
  ✅ Customers browse, search, filter by category, paginate
  ✅ Order placement and listing
  ✅ Product images
  📋 Inventory management with low-stock alerts
  📋 Payment processing
  📋 Sales performance per vendor/product

================================================================
  MODULE 2 — USED ITEMS (Second-Hand Marketplace)
================================================================

  ✅ List and browse used items with category filter
  ✅ Smart Condition Verification (Like New / Good / Fair / Needs Repair)
  ✅ Digital Product History (owner count, usage duration)
  ✅ Condition-Based Warranty badges (Green ✅ / Red ✗)
  📋 Seller Trust Badges (Verified Seller, Top Reseller)
  📋 Video upload for listings
  📋 Repair history tracking on used items

================================================================
  MODULE 3 — REPAIR SERVICE MARKETPLACE
================================================================

  ✅ Full life cycle: Request → Quote → Book → Complete → Review
  ✅ Customer uploads repair request (category, description, pickup flag)
  ✅ Technician views open requests and sends quotes
  ✅ Customer views quotes and accepts one (date picker)
  ✅ Booking confirmed, technician marks complete
  ✅ Review submission with rating + comment (validated: must have completed booking)
  ✅ Technician tab: Open Requests + My Bookings
  ✅ Pickup & Delivery flag
  ✅ Completion rate tracking + level progression (BEGINNER→VERIFIED→EXPERT)
  📋 Technician service listings (category, price range, availability)

================================================================
  MODULE 4 — AUCTION SYSTEM
================================================================

  ✅ Full lifecycle: Created → Approved → Closed
  ✅ Browsing all auctions
  ✅ Real-Time Bidding via WebSocket STOMP
  ✅ Lot details page with image, description, starting price
  ✅ Current bid display + bid history (polling every 5s)
  ✅ Live countdown timer (d h m s format)
  ✅ Auction Types: STANDARD, FLASH, REVERSE, RESERVE
  ✅ Watchlist (add/remove/list)
  ✅ Fraud flags (admin view/resolve)
  📋 Admin approval flow → Preparing → Active → Extended → Completed
  ✅ BidderReputationService (model + service created, no UI yet)
  📋 Vendor auction analytics
  📋 Live Auction Room (active bidders, scrolling feed)
  📋 Notifications (outbid, ending soon)
  📋 Filtering by status / category + pagination
  📋 Auto-extension on late bids
  📋 Terms & Conditions acceptance before bidding
  📋 Non-payment enforcement (permanent ban)

================================================================
  CORE INTELLIGENT SYSTEMS
================================================================

----------------------------------------------------------------
  System 1 — Trust Score System
----------------------------------------------------------------

  ✅ Every user has a dynamic trust score (0–100)
  ✅ Score displayed in Dashboard (green/amber/red badge)
  ✅ Events automatically update score (e.g. REPAIR_COMPLETED +3.0)
  📋 More score factors: delivery success, return ratio, customer ratings
  📋 Low-score restrictions (feature blocking, admin flagging)
  📋 High-score perks (search boost, trust badges)

----------------------------------------------------------------
  System 2 — Fraud Detection
----------------------------------------------------------------

  ✅ FraudFlag model + FraudDetectionService (flag/resolve)
  ✅ Admin dashboard: view open flags + resolve
  📋 Automatic detection: shill bidding, fake accounts, repeat abuse
  📋 Feature restrictions on suspicious accounts
  📋 Detailed fraud alerts with escalation

----------------------------------------------------------------
  System 3 — Returns & Disputes
----------------------------------------------------------------

  📋 Return model exists, no frontend or API
  📋 Admin dispute handling not started

================================================================
  SECURITY AUDIT — All Fixed
================================================================

  ✅ AuctionAdminController: ADMIN role check added
  ✅ FraudAdminController: ADMIN role check added
  ✅ OrderController.getById: auth + ownership check added
  ✅ WatchlistController.delete: auth + ownership check added
  ✅ RepairController.completeBooking: technician ownership check added
  ✅ RepairController.getQuotes: auth check added
  ✅ RepairService.getOpenRequests: filters by OPEN status only
  ✅ RepairService.submitReview: validates completed booking exists
  ✅ ProductController: throws 401 (not 400) when unauthenticated
  ✅ AdminSetup page: uses working Thymeleaf endpoint
  ✅ RepairController.getOpenRequests: auth check added
  ✅ UsedListingController: PUT/DELETE endpoints added with ownership verify
  ✅ AuctionController: PUT/DELETE endpoints added with ownership verify

================================================================
  TECHNICAL STACK
================================================================

  Backend:
    - Spring Boot 3 + Java 21
    - JPA / Hibernate (PostgreSQL via Supabase)
    - Session-based auth (HttpSession)
    - WebSocket STOMP for live bidding
    - BCrypt password hashing

  Frontend:
    - React 19 + Vite 6 + TypeScript
    - Tailwind CSS 4
    - React Query (@tanstack/react-query)
    - React Router 7
    - @stomp/stompjs for WebSocket
    - react-hot-toast for notifications

  Database:
    - PostgreSQL (Supabase hosted)
    - ddl-auto=update for schema management
    - All entities have proper relationships and enums

================================================================
  FILES REFERENCED
================================================================

  Backend:
    src/main/java/atomdrops/example/atomdrops/
    ├── config/          CorsConfig, SecurityConfig, WebSocketConfig
    ├── model/           45 JPA entities covering all domains
    ├── repository/      15 Spring Data repositories
    ├── service/         10 service classes
    ├── web/api/         13 REST controllers
    ├── web/controller/  1 Thymeleaf MVC controller (auth pages)
    └── web/dto/         20+ DTOs

  Frontend:
    frontend/src/
    ├── api/             ApiClient + WebSocket client
    ├── components/      Layout, ProtectedRoute
    ├── context/         AuthContext (session + role management)
    ├── pages/           17 pages covering all modules
    └── types/           TypeScript interfaces for all backend DTOs

================================================================
  REMAINING BACKLOG (Future)
================================================================

  Priority P0 — Must Have:
  1. Chat / Messaging (Conversation + Message models exist)
  2. Payment integration (currently dummy button)
  3. Admin user management (ban/unban)

  Priority P1 — Should Have:
  4. Notifications system (outbid, ending soon, review reminders)
  5. Bidder Reputation (win rate, payment rate, cancellation)
  6. Technician service listings
  7. Auction filtering + pagination
  8. Account settings / password change

  Priority P2 — Nice to Have:
  9. Seller Trust Badges
  10. Technician level progression
  11. Vendor auction analytics
  12. Platform analytics dashboard
  13. Live auction room UI
  14. Auto-extension on late bids
  15. Returns & Disputes
  16. File upload endpoint

================================================================
  FINAL VISION
================================================================

  ✅ Buy & Sell          — New product marketplace for vendors
  ✅ Resell Used Items   — Trusted second-hand marketplace for all
  ✅ Repair & Maintain   — Book and manage product repairs
  ✅ Auction-Based Sales — Live and scheduled bidding events
  ✅ Trust by Design     — Every interaction builds or affects trust
  ✅ Fraud Prevention    — Manual flagging with admin resolution
  📋 Full Product Lifecycle — Purchase → Resale → Repair → Auction
  📋 Intelligent Automation — Auto-detection, notifications, analytics


Important** Main plan:
================================================================
  SMART MULTI-VENDOR MARKETPLACE SYSTEM
  Complete System Specification
================================================================

----------------------------------------------------------------
  SYSTEM OVERVIEW
----------------------------------------------------------------

A Smart Multi-Vendor Marketplace that integrates four core
pillars into a single, unified commerce ecosystem:

  • Product Buying & Selling         (New item marketplace)
  • Used Item Resale                 (Second-hand marketplace)
  • Repair Service Marketplace       (Technician-powered repairs)
  • Auction System                   (Live & scheduled bidding)

The platform supports multiple user roles and provides full
lifecycle management of products — from purchase, to resale,
to repair, to auction.


================================================================
  USER ROLES & RESPONSIBILITIES
================================================================

----------------------------------------------------------------
  1. VENDOR (Seller)
----------------------------------------------------------------

Vendors are business-side users who manage inventory, sell
products, and run auctions.

  Commerce
  ─────────────────────────────────────────
  - Manage inventory (new products)
  - List products in the main marketplace
  - Optionally sell in the used items section

  Auction
  ─────────────────────────────────────────
  - Create and manage auction sessions (subject to admin approval)
  - Set auction schedules and pricing
  - View bidder trust scores and reliability stats
  - Restrict low-trust or unreliable bidders

  Analytics
  ─────────────────────────────────────────
  - Sales performance reports
  - Product-level insights
  - Auction analytics (total bids, unique bidders, peak time,
    final vs. expected price)

  Interaction
  ─────────────────────────────────────────
  - Chat with customers directly
  - Report users when necessary

----------------------------------------------------------------
  2. CUSTOMER / USER
----------------------------------------------------------------

Customers are end-users who buy, sell used items, bid in
auctions, and hire repair technicians.

  Shopping
  ─────────────────────────────────────────
  - Browse and purchase new products
  - Browse and purchase used items
  - Sell their own used items

  Auction
  ─────────────────────────────────────────
  - Browse active and upcoming auctions
  - Place bids in real time
  - Manage watchlist and receive notifications

  Repair
  ─────────────────────────────────────────
  - Browse repair service listings
  - Upload repair requests (images/videos + description)
  - Receive quotes and repair plans from technicians
  - Schedule and book repair services

  Interaction
  ─────────────────────────────────────────
  - Chat with vendors and technicians
  - Report users when necessary

----------------------------------------------------------------
  3. REPAIR TECHNICIAN
----------------------------------------------------------------

A dedicated service-provider role with access scoped
exclusively to the repair module.

  Registration & Profile
  ─────────────────────────────────────────
  - Register with a specialization:
      Electronics | Electrical | Furniture | Appliances
  - Set service area, availability, and pickup capability

  Service Actions
  ─────────────────────────────────────────
  - Create service listings (category, price range, location,
    availability)
  - View and respond to incoming repair requests
  - Send quotes and detailed repair plans
  - Accept or reject booking requests
  - Mark services as complete
  - Offer optional pickup & delivery for large items

  Performance System
  ─────────────────────────────────────────
  - Ratings & reviews from customers
  - Completion rate tracking
  - Progressive level system:
      Beginner → Verified → Expert

----------------------------------------------------------------
  4. ADMIN
----------------------------------------------------------------

Admin has full, platform-wide control over all modules,
users, and system behavior.

  System Control
  ─────────────────────────────────────────
  - Monitor trust scores and fraud alerts across all users
  - Approve or reject vendor auction sessions
  - Manage all users, vendors, customers, technicians,
    and bidders

  Enforcement
  ─────────────────────────────────────────
  - Ban or unban any user or bidder
  - Handle disputes between parties
  - Review flagged activities and fraud reports
  - Take action on reported users

  Analytics Dashboard
  ─────────────────────────────────────────
  - Platform-wide activity insights
  - Fraud trends and alert history
  - Revenue and sales tracking
  - Auction performance monitoring
  - Inventory stock level overview


================================================================
  MODULE 1 — MAIN MARKETPLACE (New Products)
================================================================

The primary commerce layer where vendors list and sell new
products. Supports full inventory management, product images,
categories, and order lifecycle tracking.

  Core Capabilities
  ─────────────────────────────────────────
  - Vendors manage inventory and product listings
  - Customers browse, search, filter, and purchase
  - Order tracking from placement to delivery
  - Integrated payment processing

  Analytics Tracked
  ─────────────────────────────────────────
  - Sales performance per vendor/product
  - Inventory stock levels with low-stock alerts
  - Profit analysis and revenue reporting
  - User activity and engagement data


================================================================
  MODULE 2 — USED ITEMS (Second-Hand Marketplace)
================================================================

A dedicated section open to both vendors and customers for
listing and purchasing second-hand products. Built around
trust, transparency, and verified product history.

----------------------------------------------------------------
  Feature 1 — Smart Condition Verification
----------------------------------------------------------------

Every used item must declare a condition level:

  Like New | Good | Fair | Needs Repair

Listings are mandatory to include:
  - Multiple photos from different angles
  - A short video showing the item's actual state

This ensures buyers have full visual context before purchasing.

----------------------------------------------------------------
  Feature 2 — Digital Product History
----------------------------------------------------------------

Each used item can carry a traceable history log:

  - Ownership history    (how many previous owners)
  - Repair history       (what was fixed and when)
  - Usage duration       (how long each owner used it)

This acts as a "digital product passport" — adding
transparency similar to a vehicle history report.

----------------------------------------------------------------
  Feature 3 — Condition-Based Warranty (Optional)
----------------------------------------------------------------

Sellers may choose to attach a warranty to their listing:

  - Warranty offered   → Green warranty badge displayed
  - No warranty        → Red warranty badge displayed

This gives buyers clear expectations and increases
confidence in higher-condition listings.

----------------------------------------------------------------
  Feature 4 — Seller Trust Badges
----------------------------------------------------------------

Sellers earn badges based on their platform track record:

  Verified Seller   — Confirmed identity and consistent listings
  Top Reseller      — High sales volume with strong ratings

Badge criteria:
  - Sales history and volume
  - Customer ratings and feedback
  - Accuracy and honesty of listings
  - Trust score standing


================================================================
  MODULE 3 — REPAIR SERVICE MARKETPLACE
================================================================

A technician-powered service layer where customers can find,
book, and pay for repair services — all within the platform.
Both vendors and customers can access this module.

----------------------------------------------------------------
  Repair Flow
----------------------------------------------------------------

  Customer uploads request
    → Technician reviews and responds with quote & plan
      → Customer accepts quote and books
        → Repair is performed
          → Payment is completed

----------------------------------------------------------------
  Feature 1 — Service Listings
----------------------------------------------------------------

Technicians post service listings specifying:
  - Service category (Electronics, Furniture, etc.)
  - Price range (minimum and maximum)
  - Service location / coverage area
  - Availability schedule
  - Whether pickup & delivery is offered

----------------------------------------------------------------
  Feature 2 — Repair Request System
----------------------------------------------------------------

Customers submit repair requests by uploading:
  - Photos and/or video of the damaged item
  - A written description of the problem
  - Preferred service location
  - Whether pickup is needed

Technicians browse open requests matching their specialization
and respond with quotes and repair plans.

----------------------------------------------------------------
  Feature 3 — Booking System
----------------------------------------------------------------

  - Customer reviews quotes and selects a technician
  - Technician accepts or rejects the booking
  - A scheduled date is confirmed for the repair

----------------------------------------------------------------
  Feature 4 — Pickup & Delivery
----------------------------------------------------------------

  - Available for large or heavy items (furniture, appliances)
  - Technician specifies pickup capability in their profile
  - Customers flag pickup need in their request


================================================================
  MODULE 4 — AUCTION SYSTEM
================================================================

Vendors can create auction sessions for products. All auctions
require admin approval before going live. The system supports
real-time bidding, fraud detection, and multiple auction types.

----------------------------------------------------------------
  Auction Lifecycle
----------------------------------------------------------------

  Created → Approved → Preparing → Active → (Extended) → Closed → Completed

----------------------------------------------------------------
  Feature 1 — Browsing & Filtering
----------------------------------------------------------------

  Filter by lot status:
    All Lots | Active Lots | Preparing (Upcoming)

  Filter by category:
    Appliances | Audio & Video | Computers |
    Furniture | Miscellaneous | Vehicles

  Additional:
    - Pagination support for large listings
    - Currency toggle: BDT (৳)

----------------------------------------------------------------
  Feature 2 — Real-Time Bidding System
----------------------------------------------------------------

  - Live bid updates without page refresh
  - Current highest bid always visible
  - Auto-refresh mechanism for active sessions

  Status indicators:
    Preparing  → Blue
    Active     → Green
    Closed     → Red

----------------------------------------------------------------
  Feature 3 — Auction Lot Details
----------------------------------------------------------------

Each lot page displays:
  - Item description and condition badge
  - Current bid price and bid history
  - Item specifications
  - Image gallery (multiple images, responsive display)

----------------------------------------------------------------
  Feature 4 — Countdown Timer
----------------------------------------------------------------

  - Live countdown showing: Days / Hours / Minutes / Seconds
  - Exact closing timestamp displayed alongside timer

----------------------------------------------------------------
  Feature 5 — Auction Types
----------------------------------------------------------------

  Standard Auction      — Highest bid wins at close
  Flash Auction         — Short time window, high urgency
  Reverse Auction       — Lowest bid wins
  Reserve Price Auction — Lot only sells if reserve price is met

----------------------------------------------------------------
  Feature 6 — Vendor Auction Analytics
----------------------------------------------------------------

Per auction session, vendors can view:
  - Total number of bids placed
  - Number of unique bidders
  - Peak bidding activity time
  - Final price vs. expected/reserve price comparison

----------------------------------------------------------------
  Feature 7 — Watchlist & Notifications
----------------------------------------------------------------

Users can watch any lot and receive automatic alerts for:
  - Being outbid (outbid alert)
  - Auction ending soon (reminder)
  - New auctions in categories they follow

----------------------------------------------------------------
  Feature 8 — Live Auction Room
----------------------------------------------------------------

  - Live count of active bidders in the room
  - Real-time scrolling bid feed
  - Interactive bidding UI with instant feedback

----------------------------------------------------------------
  Feature 9 — Fraud Detection System
----------------------------------------------------------------

The system automatically detects:
  - Multiple fake accounts bidding from the same source
  - Artificial bid inflation (shill bidding patterns)

Actions:
  - Flags suspicious activity
  - Sends alerts to the admin dashboard for review

----------------------------------------------------------------
  Feature 10 — Bidder Reputation System
----------------------------------------------------------------

Each registered bidder has a tracked reputation profile:

  - Win rate             (auctions won vs. participated)
  - Payment success rate (payment completed after winning)
  - Cancellation rate    (bookings cancelled after winning)

Vendor controls:
  - View reputation stats for any bidder
  - Restrict low-reputation bidders from their auctions

----------------------------------------------------------------
  Access & Authorization Policies
----------------------------------------------------------------

  Public (unauthenticated) users:
    - Can browse and view all active auctions

  Registered users:
    - Can place bids
    - Can view personal bid history
    - Can subscribe to auction notifications

  Agreement requirement:
    - All registered users must accept Terms & Conditions,
      Privacy Policy, and Auction Rules before bidding

  Enforcement:
    - Non-payment after winning → permanent ban
    - Vendors can report problematic bidders
    - Admin reviews all reports and takes action


================================================================
  CORE INTELLIGENT SYSTEMS
================================================================

----------------------------------------------------------------
  System 1 — Trust Score System
----------------------------------------------------------------

Every user on the platform — Vendor, Customer, and Technician
— has a dynamic, continuously updated trust score that
influences their visibility, access, and permissions.

  Score Factors
  ─────────────────────────────────────────
  - Delivery success rate
  - Return and refund ratio
  - Customer ratings and reviews
  - Fraud detection signals
  - Auction behavior (for bidders: payment rate, cancellations)

  System Actions Based on Score
  ─────────────────────────────────────────
  Low trust score:
    - Restricted access to certain features
    - Flagged for admin review
    - Auto-blocked from auctions (if bidder reputation is poor)

  High trust score:
    - Boosted search visibility for vendors/sellers
    - Eligibility for trust badges (Verified Seller, Top Reseller)
    - Preferred placement in listings

----------------------------------------------------------------
  System 2 — Smart Return & Fraud Detection
----------------------------------------------------------------

An intelligent detection layer that monitors platform
behavior for abuse and scam patterns.

  Detects
  ─────────────────────────────────────────
  - Fake return abuse (claiming refunds for items not returned)
  - Repeated refund scam patterns
  - Fake or coordinated bidding patterns in auctions
  - Multiple account abuse from the same user

  Actions
  ─────────────────────────────────────────
  - Automatically flag risky users
  - Apply feature restrictions to suspicious accounts
  - Notify the admin dashboard with detailed fraud alerts
  - Escalate repeat offenders for permanent action


================================================================
  ANALYTICS & TRACKING
================================================================

The platform provides data visualization dashboards for
admins, vendors, and technicians with the following metrics:

  Platform-Wide (Admin)
  ─────────────────────────────────────────
  - Total sales and revenue across all vendors
  - User activity and growth trends
  - Fraud trends and alert frequency
  - Auction performance metrics

  Vendor Dashboard
  ─────────────────────────────────────────
  - Sales performance per product
  - Inventory stock levels with low-stock alerts
  - Profit analysis
  - Auction analytics (bids, bidders, price performance)

  Technician Dashboard
  ─────────────────────────────────────────
  - Completion rate and service history
  - Ratings and review summary
  - Booking volume and earnings


================================================================
  FINAL VISION
================================================================

This system is not just a marketplace.
It is a complete, intelligent commerce ecosystem.

  Buy & Sell          — New product marketplace for vendors
  Resell Used Items   — Trusted second-hand marketplace for all
  Repair & Maintain   — Book and manage product repairs
  Auction-Based Sales — Live and scheduled bidding events
  Trust by Design     — Every interaction builds or affects trust
  Fraud Prevention    — Intelligent, automated protection
  Full Product Lifecycle — From purchase, to resale, to repair



================================================================