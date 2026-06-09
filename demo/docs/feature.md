# AtomDrops — Feature Reference

**Platform:** Spring Boot 4.0.6 (Java 21) + React 19 (TypeScript 6) + Vite 8  
**Database:** PostgreSQL 15 (Supabase) — 71 tables  
**Auth:** Session-based (JSESSIONID), no JWT  
**Currency:** BDT (Bangladeshi Taka)  
**API Endpoints:** 252 REST + 1 WebSocket (STOMP)  
**Frontend Pages:** 31 page components + 15 shared components  
**Controllers:** 36 (35 REST + 1 WebSocket)

---

## 1. Authentication & User Management

### Core Auth (`api/auth`)

| Feature | Endpoint | Access |
|---|---|---|
| Register | `POST /api/auth/register` | Public |
| Login | `POST /api/auth/login` | Public |
| Logout | `POST /api/auth/logout` | Authenticated |
| Get session | `GET /api/auth/me` | Public (returns null if no session) |

**Details:**
- Session-based auth with `JSESSIONID` HTTP-only cookie
- 7-day session timeout
- `SameSite=Lax`, `secure=false` (dev)
- Form login, HTTP basic, CSRF, logout all disabled
- Password hashed with BCrypt
- A `RequireRole` component wraps role-gated UI on the frontend

### User Profile (`/api/profile`)

| Feature | Endpoint | Access |
|---|---|---|
| View own profile | `GET /api/profile` | Authenticated |
| Update profile | `PUT /api/profile` | Authenticated |
| View public profile | `GET /api/users/{id}/profile` | Public |

**Profile fields:** display name, email, phone, avatar URL, bio, location, website URL, social links (JSONB), date of birth, gender

### Addresses (`/api/addresses`)

| Feature | Endpoint | Access |
|---|---|---|
| List addresses | `GET /api/addresses` | Authenticated |
| Create address | `POST /api/addresses` | Authenticated |
| Update address | `PUT /api/addresses/{id}` | Authenticated |
| Delete address | `DELETE /api/addresses/{id}` | Authenticated |
| Set default | `PUT /api/addresses/{id}/default` | Authenticated |

**Address fields:** label (Home/Office/Other), full name, phone, address line, city, area, postal code, is_default

### Notifications (`/api/notifications`)

| Feature | Endpoint | Access |
|---|---|---|
| List notifications | `GET /api/notifications` | Authenticated |
| Mark read | `PUT /api/notifications/{id}/read` | Authenticated |
| Mark all read | `PUT /api/notifications/read-all` | Authenticated |
| Delete | `DELETE /api/notifications/{id}` | Authenticated |

**Notification types:** NEW_ORDER, ORDER_APPROVED, ORDER_PACKED, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_REJECTED, ORDER_CANCELLED, SUBSCRIPTION_EXPIRING, SUBSCRIPTION_EXPIRED, SUBSCRIPTION_TERMINATED, TRUST_SUSPENSION

### Password Reset (`/api/admin/users/{id}/reset-password`)

| Feature | Endpoint | Access |
|---|---|---|
| Reset password | `POST /api/admin/users/{id}/reset-password` | Admin |
| Password reset via token | Via `password_reset_tokens` table | Public (token) |

### Legal Agreements (`/api/agreements`)

| Feature | Endpoint | Access |
|---|---|---|
| View agreement | `GET /api/agreements/{type}` | Authenticated |
| Accept agreement | `POST /api/agreements/{type}` | Authenticated |

**Agreement types:** TERMS, PRIVACY, AUCTION_RULES

---

## 2. Customer / Buyer Features

Accessible to any authenticated user with `CUSTOMER` role (default on registration).

### Product Browsing & Search

| Feature | Details |
|---|---|
| Browse products | Grid list with category filtering, pagination, search via `?category=` param |
| Product detail | Full product view: images (with lightbox), description, price, stock status, reviews, vendor info, shipping type (Free/Paid) |
| Category filtering | 10 seed categories: Smartphones & Tablets, Laptops & Computers, TVs & Home Entertainment, Audio & Headphones, Gaming & Consoles, Cameras & Drones, Home Appliances, Fashion & Accessories, Beauty & Personal Care, Sports & Outdoors |
| Full-text search | PostgreSQL `tsvector` on product name + description via GIN index |
| Stock indicator | Shows "In Stock", "Only X left" (low stock), or "Out of Stock" |
| Product questions | Ask questions on products, view public Q&A |

### Shopping Cart

| Feature | Endpoint | Details |
|---|---|---|
| View cart | `GET /api/cart` | Per-user active cart |
| Add item | `POST /api/cart/items` | Product or used listing, with quantity |
| Update qty | `PUT /api/cart/items/{id}` | Change quantity |
| Remove item | `DELETE /api/cart/items/{id}` | Remove line item |
| Stock check | `GET /api/cart/stock-check` | Validate stock before checkout |
| Clear cart | `DELETE /api/cart` | Remove all items |

**Cart rules:**
- One active cart per user
- 24-hour expiry (`cart.expiry_hours` platform setting)
- Cannot purchase own products
- Mixed cart: products + used listings
- Per-vendor item grouping in checkout

### Checkout & Ordering

| Feature | Endpoint | Details |
|---|---|---|
| Place order | `POST /api/orders` | Creates order from cart |
| List orders | `GET /api/orders` | Customer's order history |
| Order detail | `GET /api/orders/{id}` | Items, status, shipping, totals |
| Cancel order | `PUT /api/orders/{id}/cancel` | 24-hour window, trust penalty on pre-approval cancel |

**Order flow:** `PLACED` → `APPROVED` → `PACKED` → `SHIPPED` → `DELIVERED`

**Shipping:**
- Inside Dhaka: BDT 60, 1-3 days delivery
- Outside Dhaka: BDT 100, 3-7 days delivery
- Free shipping option available

### Payments

| Feature | Endpoint | Details |
|---|---|---|
| Pay for order | `POST /api/payments/order/{orderId}` | bKash, Nagad, Card, or COD |
| Get payment | `GET /api/payments/order/{orderId}` | Payment status |
| Download invoice | `GET /api/payments/invoice/{orderId}/download` | PDF invoice |

**Payment methods:** BKASH, NAGAD, CARD, COD

### Wishlist

| Feature | Endpoint |
|---|---|
| List wishlist | `GET /api/wishlist` |
| Add product | `POST /api/wishlist/{productId}` |
| Remove product | `DELETE /api/wishlist/{productId}` |

### Second-hand / Used Listings

| Feature | Endpoint | Details |
|---|---|---|
| Browse listings | `GET /api/used-listings` | Filter by category, condition, search |
| Listing detail | `GET /api/used-listings/{id}` | Images, videos, description, condition, seller info |
| Create listing | `POST /api/used-listings` | Title, description, price, condition, images, videos |
| Edit listing | `PUT /api/used-listings/{id}` | Update own listing |
| Delete listing | `DELETE /api/used-listings/{id}` | Soft-delete own listing |
| My listings | `GET /api/used-listings/mine` | Seller's own listings |
| Add images | `POST /api/used-listings/{id}/images` | Multi-image upload via Supabase Storage |
| Add videos | `POST /api/used-listings/{id}/videos` | Video upload |
| Item history | `PUT /api/used-listings/{id}/history` | Owner count, usage duration |
| Repair records | `POST /api/used-listings/{id}/repairs` | Previous repair documentation |

### Offers (Used Listings)

| Feature | Endpoint |
|---|---|
| Make offer | `POST /api/used-listings/{id}/offers` |
| View offers on listing | `GET /api/used-listings/{id}/offers` |
| Accept offer (seller) | `PUT /api/offers/{id}/accept` |
| Reject offer (seller) | `PUT /api/offers/{id}/reject` |
| Withdraw offer (buyer) | `PUT /api/offers/{id}/withdraw` |
| Sent offers (buyer) | `GET /api/offers/sent` |
| Offer messaging | `POST/GET /api/offers/{id}/messages` |

**Offer types:** Direct offer with amount, counter-offer with negotiation messaging

### Auctions

| Feature | Endpoint | Details |
|---|---|---|
| Browse auctions | `GET /api/auctions` | Filter by status |
| Auction detail | `GET /api/auctions/{id}` | Lots, bids, vendor, countdown |
| SSE events | `GET /api/auctions/{id}/events` | Real-time status changes |
| Lot detail | `GET /api/auction-lots/{id}` | Current bid, bid history |
| Place bid | `POST /api/auction-lots/{id}/bids` | Must meet min bid increment |
| Bid history | `GET /api/auction-lots/{id}/bids` | All bids on a lot |
| Watchlist lot | `POST /api/watchlist/{lotId}` | Track lot |
| Unwatch lot | `DELETE /api/watchlist/{lotId}` | Remove from watchlist |
| List watched | `GET /api/watchlist` | All watched lots |
| My wins | `GET /api/auction-winners/me` | Won auctions |
| Accept auction rules | `POST /api/agreements/AUCTION_RULES` | Required before bidding |

**Auction types:** STANDARD, FLASH, REVERSE, RESERVE  
**Bid rules:** Min increment (default BDT 10), auto-extension (5 min, max 3 extensions), 48h payment deadline  
**Real-time:** WebSocket (STOMP at `/ws/auction`) for bids + SSE for status broadcasts  
**Countdown:** Live timer on frontend via `AuctionCountdown` component

### Repair Services

| Feature | Endpoint | Details |
|---|---|---|
| Browse technicians | `GET /api/technicians` | Filter by specialization |
| Technician profile | `GET /api/technicians/{id}` | Skills, reviews, services |
| Create repair request | `POST /api/repair/requests` | Device type, brand, model, issue, media |
| My requests | `GET /api/repair/requests/mine` | Past repair requests |
| Request detail | `GET /api/repair/requests/{id}` | Quotes, status, timeline |
| Cancel request | `PUT /api/repair/requests/{id}/cancel` | Cancel own request |
| Accept quote | `PUT /api/repair/quotes/{id}/accept` | With schedule selection |
| Reject quote | `PUT /api/repair/quotes/{id}/reject` | Decline quote |
| View booking | `GET /api/repair/bookings/{id}` | Scheduled repair |
| Booking timeline | `GET /api/repair/bookings/{id}/progress` | Progress updates |
| Spare parts | `GET /api/repair/bookings/{id}/parts` | Parts list with pricing |
| Approve part cost | `PUT /api/repair/parts/{id}/approve` | Accept spare part quote |
| Submit review | `POST /api/repair/bookings/{id}/review` | Multi-dimension rating (work quality, professionalism, communication, timeliness, pricing) |
| Marketplace stats | `GET /api/repair/stats` | Total technicians, completed repairs, satisfaction rate |

### Reviews

| Feature | Endpoint |
|---|---|
| Submit review | `POST /api/reviews` |
| User reviews | `GET /api/users/{id}/reviews` |
| Product reviews | `GET /api/products/{productId}/reviews` |

**Review dimensions:** Rating 1-5, optional comment, linked to product/order_item/booking

### Reports

| Feature | Endpoint |
|---|---|
| Submit report | `POST /api/reports` |

**Reportable entities:** PRODUCT, VENDOR, USER  
**Report types:** Any reason text, linked to entity_id + entity_type

### Messaging

| Feature | Endpoint | Details |
|---|---|---|
| List conversations | `GET /api/conversations` | Filter by type (all/unread/order/used/repair) |
| Conversation messages | `GET /api/conversations/{id}/messages` | Full message history |
| Send message | `POST /api/conversations/{id}/messages` | Text messages |
| Start used-listing chat | `POST /api/conversations/used` | Buyer-seller about a used listing |
| Order conversation | `GET /api/conversations/order/{orderId}` | Auto-created order conversation |

### Role Upgrades

| Feature | Endpoint | Details |
|---|---|---|
| Request upgrade | `POST /api/upgrades` | To VENDOR or TECHNICIAN |
| Pay for upgrade | `POST /api/upgrades/{id}/pay` | BDT 99 via bKash/Nagad/Card |
| My upgrades | `GET /api/upgrades/me` | Upgrade history |

**Upgrade flow:** `PENDING_PAYMENT` → `PAID` → `ACTIVE` (role granted after payment)

---

## 3. Vendor Features

Accessible to users with `VENDOR` role.

### Dashboard (`/api/vendor`)

| Feature | Endpoint | Details |
|---|---|---|
| Dashboard stats | `GET /api/vendor/dashboard` | Total auctions, products, orders, earnings, commissions per shop |
| Analytics | `GET /api/vendor/analytics` | Sales data (daily/weekly/monthly), top products, most ordered, unique customers |
| Trust score | `GET /api/vendor/trust-score` | Current trust score + event history |

**Dashboard components:**
- 4 metric cards: Total Revenue, Total Orders, Active Products, Active Auctions
- Revenue bar chart with time-range selector (Daily / Weekly / Monthly)
- Top 5 Products by revenue with progress bars
- Most Ordered Products ranking
- Customer overview (unique customers, avg orders/customer)
- Product status summary (Active vs Draft)
- Recent transactions (last 10 commission payouts)
- Shop selector dropdown for per-shop vs aggregate view

### Shop Management (`/api/shops`)

| Feature | Endpoint | Details |
|---|---|---|
| List own shops | `GET /api/shops/vendor` | All shops owned by vendor |
| Create shop | `POST /api/shops` | Name, description, location, policies, category, logo, banner |
| Update shop | `PUT /api/shops/{id}` | Name, status, logo, banner, description, location, policies |
| Follow/unfollow | `POST /api/shops/{id}/toggle-follow` | Toggle follow (any user) |
| Shop staff list | `GET /api/shops/{id}/staff` | Current staff members |
| Add staff | `POST /api/shops/{id}/staff` | User ID + role (MANAGER/INVENTORY/SUPPORT) |
| Remove staff | `DELETE /api/shops/{id}/staff/{staffId}` | Remove staff member |
| Shop products | `GET /api/shops/{id}/products` | Products in a shop |
| Shop auctions | `GET /api/shops/{id}/auctions` | Auctions in a shop |

**Shop fields:** name, slug, logo URL, banner URL, description, location, policies, status (ACTIVE/PAUSED/ARCHIVED), verification_level (STANDARD/VERIFIED/PREMIUM/TRUSTED), primary_category, response_rate

**Shop limits:** Enforced by subscription plan (max_shops). Basic = 1 shop, Enterprise = unlimited.

**Staff roles:** OWNER (auto-assigned), MANAGER, INVENTORY, SUPPORT

**Public shop page:** `/shop/{slug}` shows logo, banner, description, location, policies, verification level, follower count, product grid, vendor reviews, follow button

### Products (`/api/vendor/products`)

| Feature | Endpoint | Details |
|---|---|---|
| List own products | `GET /api/vendor/products` | Filter by shop |
| Create product | `POST /api/products` | Name, description, price, category, shop, shipping type |
| Update product | `PUT /api/products/{id}` | Edit product details |
| Delete product | `DELETE /api/products/{id}` | Soft-delete |
| Add images | `POST /api/products/{id}/images` | Via MediaUploader to Supabase Storage |
| Get inventory | `GET /api/products/{productId}/inventory` | Stock levels |
| Update inventory | `PUT /api/products/{productId}/inventory` | Stock qty, low-stock threshold |
| Set shipping | `PUT /api/vendor/products/{productId}/shipping` | FREE or PAID |

**Product fields:** name, description, price_bdt, status (DRAFT/ACTIVE/INACTIVE/OUT_OF_STOCK), shipping_type (FREE/PAID), category, shop, images

### Orders (`/api/vendor/orders`)

| Feature | Endpoint | Details |
|---|---|---|
| List orders | `GET /api/vendor/orders` | Filter by shop, commission-based |
| Detailed list | `GET /api/vendor/orders/list` | Full Order objects |
| Update status | `PUT /api/vendor/orders/{orderId}/status` | State machine transitions |
| Customer details | `GET /api/vendor/customers/{customerId}` | View customer info |

**Order status flow (vendor actions):**
- `PLACED` → `APPROVED` (accept order) — trust score +1
- `APPROVED` → `PACKED` (mark as packed)
- `PACKED` → `SHIPPED` (mark as shipped)
- `SHIPPED` → `DELIVERED` (mark delivered) — commissions paid, trust score +1
- `PLACED` → `CANCELLED` (reject order) — trust score -3

### Auctions (`/api/vendor/auctions`)

| Feature | Endpoint | Details |
|---|---|---|
| List own auctions | `GET /api/vendor/auctions` | Filter by shop |
| Create auction | `POST /api/auctions` | Title, type, start/end time, shop |
| Update auction | `PUT /api/auctions/{id}` | Edit auction details |
| Publish auction | `POST /api/auctions/{id}/publish` | Change status to PREPARING |
| Delete auction | `DELETE /api/auctions/{id}` | Delete own auction |
| Add lots | `POST /api/auctions/{auctionId}/lots` | Title, starting price, reserve, images |
| Update lot | `PUT /api/auction-lots/{id}` | Edit lot |
| Delete lot | `DELETE /api/auction-lots/{id}` | Delete lot |
| Add lot images | `POST /api/auction-lots/{id}/images` | Image upload |

**Auction fields:** type (STANDARD/FLASH/REVERSE/RESERVE), status lifecycle (CREATED → APPROVED → PREPARING → ACTIVE → CLOSED/COMPLETED/REJECTED)

**Lot fields:** starting_price, reserve_price, current_bid, min_bid_increment, extension_duration, max_extensions

### Subscriptions (`/api/vendor/subscription`)

| Feature | Endpoint | Details |
|---|---|---|
| Plans | `GET /api/vendor/subscription/plans` | List available plans with pricing |
| Summary | `GET /api/vendor/subscription/summary` | Current plan, max shops, usage |
| Subscribe | `POST /api/vendor/subscription/subscribe` | Select plan + billing cycle (MONTHLY/YEARLY) |
| Deals | `GET /api/vendor/subscription/deals` | Active promotional deals |

**Plans:**
| Plan | Shops | Monthly | Yearly | Discount |
|---|---|---|---|---|
| Vendor Basic (FREE) | 1 | Free | Free | — |
| Vendor Builder | 2 | BDT 499 | BDT 4,999 | 15% |
| Vendor Pro | 4 | BDT 999 | BDT 9,599 | 20% |
| Vendor Business | 7 | BDT 1,999 | BDT 17,999 | 25% |
| Vendor Enterprise | ∞ | BDT 4,999 | BDT 47,999 | 20% |

**Subscription lifecycle:** ACTIVE → expires → GRACE_PERIOD (7 days) → EXPIRED (shops auto-paused)

**Notifications:** Warning at 7d, 3d, 1d before expiry

### Multi-Shop Management

| Feature | Details |
|---|---|
| Create unlimited shops | Depends on subscription plan (1 to ∞) |
| Per-shop analytics | Dashboard shop selector for single-shop view |
| Per-shop staff | Independent staff per shop (MANAGER/INVENTORY/SUPPORT) |
| Shop status controls | ACTIVE / PAUSED / ARCHIVED per shop |
| Shop-level products/auctions | Products and auctions assigned to a shop |
| Public storefront | Each shop has its own public page at `/shop/{slug}` |

### Trust & Reputation

| Feature | Details |
|---|---|
| Trust score | 0-100 scale, starts at 50 |
| Score increases | +2 on successful delivery, +1 on order approval |
| Score decreases | -5 on pre-approval cancel, -3 on order rejection |
| Auto-pause | All shops paused when score ≤ 20 (configurable via `trust.suspension_threshold`) |
| Trust events | Full event log with type, delta, note, timestamp |
| View score | `GET /api/vendor/trust-score` |

---

## 4. Technician Features

Accessible to users with `TECHNICIAN` role.

### Profile & Setup

| Feature | Endpoint | Details |
|---|---|---|
| Update profile | `PUT /api/technician/profile` | Bio, specialization, service area, pickup availability |
| Set availability | `PUT /api/technician/availability` | Day-of-week schedule with time slots |
| Get availability | `GET /api/technician/availability` | Current schedule |
| List services | `GET /api/technicians/{id}/services` | Service listings with pricing |
| Create service | `POST /api/service-listings` | Title, description, price range, category |

**Technician fields:** specialization (Electronics/Electrical/Furniture/Appliances), level (Beginner/Verified/Expert), pickup_available, service_area, rating_avg, completion_rate

### Repair Workflow

| Feature | Endpoint | Details |
|---|---|---|
| Open requests | `GET /api/repair/requests/open` | Browse customers needing quotes |
| Submit quote | `POST /api/repair/requests/{id}/quotes` | Amount + repair plan |
| My bookings | `GET /api/repair/bookings/mine` | Assigned jobs |
| Update booking | `PUT /api/repair/bookings/{id}/status` | Status transitions |
| Add progress | `POST /api/repair/bookings/{id}/progress` | Timeline updates with notes |
| Add spare parts | `POST /api/repair/bookings/{id}/parts` | Part name, cost, quantity |
| Complete booking | `PUT /api/repair/bookings/{id}/complete` | Mark job done |
| View reviews | `GET /api/technicians/{id}/reviews` | Customer feedback |

### Dashboard

| Feature | Details |
|---|---|
| Overview tab | Stats, recent activity |
| Open Bids tab | Browse open repair requests, place quotes |
| Active Jobs tab | Manage bookings, update status, add progress, add spare parts |
| Earnings tab | Earning history with payouts |

### Earnings

| Feature | Endpoint | Details |
|---|---|---|
| Earnings history | `GET /api/technician/earnings` | Gross, commission, net per booking |

**Commission:** Platform takes configurable percentage (default 8%) from `technician.commission_rate` setting

### Level Progression

| Level | Requirement |
|---|---|
| Beginner | Default |
| Verified | 10 completed jobs (`technician.verified_threshold`) |
| Expert | 50 completed jobs (`technician.expert_threshold`) |

---

## 5. Admin Features

Accessible to users with `ADMIN` role. All endpoints under `/api/admin`.

### User Management

| Feature | Endpoint | Details |
|---|---|---|
| List users | `GET /api/admin/users` | Filter by role, status, search |
| User detail | `GET /api/admin/users/{id}` | Full user info |
| User detail extended | `GET /api/admin/users/{id}/detail` | With red flag notes |
| User activity | `GET /api/admin/users/{id}/activity` | Orders, products, bids, reports, returns count |
| Update user | `PUT /api/admin/users/{id}` | Display name, email, phone, status |
| Update roles | `PUT /api/admin/users/{id}/roles` | Add/remove CUSTOMER/VENDOR/TECHNICIAN/ADMIN |
| Ban user | `PUT /api/admin/users/{id}/ban` | Set status to BANNED |
| Unban user | `PUT /api/admin/users/{id}/unban` | Set status to ACTIVE |
| Suspend user | `PUT /api/admin/users/{id}/suspend` | Set status to SUSPENDED |
| Delete user | `DELETE /api/admin/users/{id}` | Soft-delete with deleted_at |
| Reset password | `POST /api/admin/users/{id}/reset-password` | Set new password |
| Clear sessions | `POST /api/admin/users/{id}/clear-sessions` | Invalidate all sessions |
| Red flag | `POST /api/admin/users/{id}/red-flag` | Add flag with reason |
| Trust score | `GET/PUT /api/admin/users/{id}/trust-score` | View or override score |

**Restrictions:** Primary admin (`admin@login.com`) cannot be banned/suspended/deleted and can only have ADMIN role.

### Moderation — Products

| Feature | Endpoint |
|---|---|
| List all products | `GET /api/admin/products` |
| Hide product | `PUT /api/admin/products/{id}/hide` |
| Update product | `PUT /api/admin/products/{id}` |
| Delete product | `DELETE /api/admin/products/{id}` |

### Moderation — Used Listings

| Feature | Endpoint |
|---|---|
| List all used listings | `GET /api/admin/used-listings` |
| Hide used listing | `PUT /api/admin/used-listings/{id}/hide` |
| Update used listing | `PUT /api/admin/used-listings/{id}` |
| Delete used listing | `DELETE /api/admin/used-listings/{id}` |

### Moderation — Service Listings

| Feature | Endpoint |
|---|---|
| List all service listings | `GET /api/admin/service-listings` |
| Delete service listing | `DELETE /api/admin/service-listings/{id}` |

### Auction Management

| Feature | Endpoint | Details |
|---|---|---|
| List auctions | `GET /api/admin/auctions` | Filter by status |
| Pending auctions | `GET /api/admin/auctions/pending` | CREATED status |
| Approve auction | `PUT /api/admin/auctions/{id}/approve` | With optional notes |
| Reject auction | `PUT /api/admin/auctions/{id}/reject` | With optional notes |
| Update auction | `PUT /api/admin/auctions/{id}` | Title, type, timing |
| Cancel auction | `PUT /api/admin/auctions/{id}/cancel` | Cancel with lot closure |
| Freeze auction | `PUT /api/admin/auctions/{id}/freeze` | Set FROZEN |
| Suspend auction | `PUT /api/admin/auctions/{id}/suspend` | Set SUSPENDED |
| Force close | `PUT /api/admin/auctions/{id}/force-close` | Close immediately, determine winners |
| Delete auction | `DELETE /api/admin/auctions/{id}` | Cancel + close lots |

### Order Management

| Feature | Endpoint |
|---|---|
| List all orders | `GET /api/admin/orders` |
| Override status | `PUT /api/admin/orders/{id}/status` |
| Delete/cancel order | `DELETE /api/admin/orders/{id}` |

### Payment Management

| Feature | Endpoint |
|---|---|
| List payments | `GET /api/admin/payments` |
| Refund payment | `POST /api/admin/payments/{id}/refund` |

### Report Management

| Feature | Endpoint |
|---|---|
| List reports | `GET /api/admin/reports` | Filter by status |
| Resolve report | `PUT /api/admin/reports/{id}/resolve` | With admin note |
| Dismiss report | `PUT /api/admin/reports/{id}/dismiss` | |
| Delete report | `DELETE /api/admin/reviews/{id}` | |

### Return Management

| Feature | Endpoint |
|---|---|
| List returns | `GET /api/admin/returns` | Filter by status |
| Approve return | `PUT /api/admin/returns/{id}/approve` | |
| Reject return | `PUT /api/admin/returns/{id}/reject` | |
| Delete return | `DELETE /api/admin/returns/{id}` | |

### Fraud Management

| Feature | Endpoint |
|---|---|
| List fraud flags | `GET /api/admin/fraud-flags` | Filter by status |
| Resolve fraud flag | `PUT /api/admin/fraud-flags/{id}/resolve` | |

### Vendor Management

| Feature | Endpoint | Details |
|---|---|---|
| List vendors | `GET /api/admin/vendors` | All vendor profiles |
| Verify vendor | `PUT /api/admin/vendors/{id}/verify` | Set verification_status to VERIFIED |
| Shop verification | `PUT /api/admin/shops/{id}/verification` | Set STANDARD/VERIFIED/PREMIUM/TRUSTED |

### Subscription Plan Management

| Feature | Endpoint |
|---|---|
| List plans | `GET /api/admin/subscription/plans` |
| Create plan | `POST /api/admin/subscription/plans` |
| Update plan | `PUT /api/admin/subscription/plans/{id}` |
| Delete plan | `DELETE /api/admin/subscription/plans/{id}` |

### Subscription Deal Management

| Feature | Endpoint |
|---|---|
| List deals | `GET /api/admin/subscription/deals` |
| Create deal | `POST /api/admin/subscription/deals` |
| Update deal | `PUT /api/admin/subscription/deals/{id}` |
| Delete deal | `DELETE /api/admin/subscription/deals/{id}` |

**Deal types:** FREE_TRIAL, DISCOUNT, FREE_MONTHS

### Role Upgrade Management

| Feature | Endpoint | Details |
|---|---|---|
| List upgrades | `GET /api/admin/upgrades` | Filter by status/role |
| User upgrades | `GET /api/admin/users/{id}/upgrades` | Specific user's history |
| Cancel upgrade | `POST /api/admin/upgrades/{id}/cancel` | Revoke role + cancel request |

### Platform Settings

| Feature | Endpoint |
|---|---|
| List settings | `GET /api/admin/platform-settings` |
| Update setting | `PUT /api/admin/platform-settings/{key}` |

**Platform settings (18 keys):** Commission rates (vendor 10%, technician 8%), trust thresholds, auction params (bid increment, extension, payment deadline, non-payment ban), cart expiry, coupon defaults, offer expiry, shipping fee

### System Notifications

| Feature | Endpoint |
|---|---|
| List notifications | `GET /api/admin/system-notifications` |
| Create notification | `POST /api/admin/system-notifications` |
| Update notification | `PUT /api/admin/system-notifications/{id}` |
| Delete notification | `DELETE /api/admin/system-notifications/{id}` |

**Notification types:** INFO, WARNING, MAINTENANCE, POLICY_UPDATE  
**Target:** Specific roles or all users

### Audit Logs

| Feature | Endpoint | Details |
|---|---|---|
| View audit logs | `GET /api/admin/audit-logs` | Filter by actor or entity type |
| Data export | `GET /api/admin/export/{entityType}` | Export entities as JSON |

**Tracked actions:** All admin operations logged with old/new JSONB data, actor ID, IP address

### Analytics Dashboard

| Feature | Endpoint | Details |
|---|---|---|
| Overview stats | `GET /api/admin/analytics/dashboard` | Total users, auctions, products, orders, open reports, pending returns, latest snapshot |

---

## 6. Guest / Public Features

Accessible without authentication.

| Feature | Details |
|---|---|
| Browse products | View product grid, search, filter by category |
| Product detail | Images, pricing, description, stock status, reviews |
| Browse auctions | Active, upcoming, closed auctions |
| Auction detail | View lots, current bids, countdown |
| Browse used listings | Second-hand marketplace, filter/search |
| Used listing detail | Images, condition, seller info |
| Browse technicians | Directory by specialization |
| Technician profile | Skills, services, reviews, ratings |
| Service listings | Technician service offerings |
| System notifications | Active platform announcements |
| Categories | Full category tree |
| Vendor shop pages | `/shop/{slug}` — public storefront |
| Vendor profiles | Public vendor info |
| Subscription plans | Public pricing page |
| Subscription deals | Active promotions |
| View agreements | TERMS, PRIVACY, AUCTION_RULES |

---

## 7. Cross-Cutting Features

### Real-Time Updates

| Feature | Technology | Details |
|---|---|---|
| Auction bids | WebSocket (STOMP) | `/ws/auction` with SockJS fallback, in-memory broker `/topic/**` |
| Auction status | SSE | `GET /api/auctions/{id}/events` for status broadcasts |
| Cart events | Event emitter | Cross-component cart update notifications |

### Scheduled Jobs

| Job | Interval | Details |
|---|---|---|
| Open scheduled auctions | Every 2 seconds | Opens PREPARING auctions whose start time passed |
| Close expired auctions | Every 2 seconds | Closes ACTIVE auctions past end time, determines winners |
| Process expired subscriptions | Every 60 seconds | ACTIVE → GRACE_PERIOD, GRACE_PERIOD → EXPIRED, auto-pause shops |
| Send expiry warnings | Every 60 seconds | Notifies at 7d, 3d, 1d before subscription expiry |

### File Uploads

| Feature | Details |
|---|---|
| Storage | Supabase Storage |
| Upload types | Images, videos |
| Uploader component | `MediaUploader` with drag-and-drop |
| Use cases | Product images, auction lot images, used listing images/videos, repair media, avatar, shop logo/banner |

### Trust & Safety

| Feature | Details |
|---|---|
| Trust score | Per-user 0-100, starts at 50 |
| Auto-suspension | Shops paused when score ≤ 20 |
| Ban tracking | `ban_history` with action, reason, expiry |
| Fraud flags | Manual flags by admin, 3 statuses (OPEN/REVIEWED/RESOLVED) |
| Fraud events | Auto-logged suspicious activity with severity (LOW/MEDIUM/HIGH/CRITICAL) |
| Reports | User-submitted reports with review flow |
| Red flags | Admin-issued flags with notes on user accounts |
| Bidder restrictions | Vendor-level blocking of specific bidders |

### Bangladesh-First Design

| Feature | Implementation |
|---|---|
| Currency | BDT throughout (Taka symbol ৳) |
| Shipping | Inside Dhaka (BDT 60, 1-3 days) / Outside Dhaka (BDT 100, 3-7 days) |
| Payment methods | bKash, Nagad, Card, COD |
| Address format | City, Area, Postal Code model |
| Language | English (en-BD locale) |
| Date format | en-BD locale throughout |

---

## 8. Module Summary

| Module | Pages | Controllers | API Endpoints | DB Tables |
|---|---|---|---|---|
| Auth & Users | 1 | AuthController | 4 | 8 (users, roles, user_roles, user_badges, ban_history, customer_profiles, addresses, password_reset_tokens) |
| Profile & Account | 6 | ProfileController, AddressController, NotificationController, UserAgreementController | 14 | 4 (customer_profiles, addresses, user_agreements, notifications) |
| Products & Catalog | 3 | ProductController, CategoryController, InventoryController, ProductQuestionController | 12 | 6 (products, product_images, product_variants, inventory, product_questions, categories) |
| Cart & Checkout | 3 | CartController, OrderController, PaymentController, ShipmentController | 17 | 8 (carts, cart_items, orders, order_items, order_status_log, payments, shipments, shipment_events, coupon_uses) |
| Wishlist | 1 | WishlistController | 3 | 1 (wishlists) |
| Used Marketplace | 3 | UsedListingController, OfferController | 14 | 7 (used_listings, used_images, used_videos, used_item_history, used_item_repairs, used_listing_offers, used_listing_offer_messages) |
| Auctions | 3 | AuctionController, AuctionLotController, AuctionWinnerController, AuctionPaymentController, WatchlistController | 17 | 8 (auctions, auction_lots, auction_images, bids, auction_watchlist, auction_winners, auction_payments, auction_status_log, auction_approvals) |
| Repair Services | 6 | RepairController, TechnicianController, ServiceListingController | 25 | 13 (technicians, technician_skills, technician_availability, technician_level_history, service_listings, repair_requests, repair_media, repair_quotes, repair_bookings, service_completion, repair_payments, technician_earnings) |
| Vendor Dashboard | 1 | VendorPanelController, VendorPublicController | 12 | — (queries orders, products, auctions) |
| Shop Management | 1 | ShopController | 11 | 3 (shops, shop_followers, shop_staff) |
| Subscriptions | 1 | VendorSubscriptionController | 4 | 4 (vendor_subscription_plans, vendor_subscriptions, vendor_subscription_deals) |
| Technicians | 1 | TechnicianController | 9 | — (technicians + related) |
| Admin | 1 | AdminController | 66 | — (manages all entities) |
| Messaging | 1 | ChatController | 6 | 3 (conversations, conversation_members, messages) |
| Reviews | — | ReviewController | 3 | 1 (reviews) |
| Reports | — | ReportController | 1 | 1 (reports) |
| Returns | — | ReturnController | 3 | 1 (returns) |
| Trust & Fraud | — | — (inline in OrderService + AdminController) | — | 4 (trust_scores, trust_events, fraud_flags, fraud_events) |
| Role Upgrades | — | UpgradeController | 3 | 2 (role_upgrades, upgrade_payments) |
| Subtotal (unique) | 31 pages | 36 controllers | 252 endpoints | 71 tables |
