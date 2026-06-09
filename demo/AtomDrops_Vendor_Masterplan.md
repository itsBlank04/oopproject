# AtomDrops — Vendor Module Master Plan

---

## Part 1 — Vendor Onboarding & Shop Creation

### 1.1 Becoming a Vendor

A user becomes a vendor by subscribing to the Vendor Basic plan at ৳99. Upon subscribing, the vendor account is activated and the user is directed to the Shops section to create their first shop. The first shop is always free and remains free forever — no recurring subscription is required for a single shop.

### 1.2 First Shop Setup

Before a vendor can list any product, they must fully configure their shop. This makes every shop a real, branded storefront rather than a generic listing page.

| Field | Details |
|---|---|
| Shop Name | Must be unique across the entire platform |
| Shop Logo | Brand image upload |
| Shop Banner | Header visual displayed on the storefront page |
| Shop Description | What the vendor sells and their story |
| Primary Category | Main product category for the shop |
| Shop Location | City and Country |
| Shop Policies | Returns, warranty, and shipping terms |

> **Core Rule:** Every vendor gets one shop free, forever. Additional shops require a paid subscription.

---

## Part 2 — Product Listing & Shop Linking

### 2.1 Product Upload Flow

Every product a vendor lists is tied to a specific shop. When a vendor manages multiple shops, they navigate to that individual shop before uploading a product. A product can only belong to one shop at a time.

1. Select the shop this product belongs to
2. Upload product photos
3. Add title, description, and specifications
4. Set price, stock levels, and variants
5. Configure shipping options
6. Publish the listing

### 2.2 Product Detail Page — Shop Integration

On every product page, a dedicated "Visit Shop" section is displayed to buyers. This is how buyers naturally discover the full vendor storefront through individual products.

| Element | Purpose |
|---|---|
| Shop Logo + Name | Visual brand identity displayed on product page |
| Shop Rating | Aggregate star rating with total review count |
| Product Count | Total number of active listings in this shop |
| Follower Count | Number of users following this shop |
| View Shop Button | Direct link to the full vendor storefront |

---

## Part 3 — The Vendor Storefront

### 3.1 Public Storefront

Each shop has its own public-facing page that functions as a mini store within AtomDrops. Buyers discover storefronts organically through product pages. The storefront displays:

- Shop banner and full branding
- All active product listings
- Shop rating and review summary
- Featured and pinned products (vendor-selected)
- Shop policies (returns, warranty, shipping)
- Follow button for buyers

### 3.2 Vendor Shop Dashboard

Inside their shop dashboard, vendors have complete control over their storefront:

- Add, edit, and remove products
- Manage stock levels
- Pause listings (temporarily hide without deleting)
- Pin featured products to the top of the storefront
- View shop-level analytics
- Manage shop policies
- Edit shop branding (logo, banner, description)

### 3.3 Shop Status Controls

Vendors can set any shop to one of three operational statuses:

| Status | Meaning |
|---|---|
| Active | Fully live and visible to all buyers. Orders accepted normally. |
| Paused | Temporarily hidden. No new orders. All data preserved. |
| Archived | Permanently closed. Invisible to buyers. Data permanently preserved. |

### 3.4 Shop Followers System

Every shop has a social layer that creates buyer retention and repeat engagement. Each shop displays:

- Followers count
- Reviews and ratings
- Product count
- Shop age
- Response rate

Customers who follow a shop can:

- Receive notifications for new products
- Receive notifications for discounts and promotions
- Receive notifications for new auctions

> **Retention Logic:** The follower system creates a direct, ongoing relationship between buyers and vendors — increasing trust and repeat purchases over time.

### 3.5 Customer Journey Through the Storefront

1. Customer sees a product on the platform
2. Clicks "Visit Shop" on the product page
3. Browses the full vendor inventory
4. Follows the shop
5. Leaves a review after purchase
6. Views other reviews to build trust
7. Returns to purchase more products

---

## Part 4 — Multi-Shop System & Subscriptions

### 4.1 Why Multi-Shop

A vendor may own diverse businesses that should remain separate brands. Instead of mixing product categories under one identity, each business gets its own storefront with its own reputation, branding, and customer base. Customers also receive a cleaner, more focused shopping experience.

> **Example:** One vendor may operate TechWorld, Furniture Hub, and Fashion Point as three entirely separate shops under a single AtomDrops account.

### 4.2 Subscription Plans

Additional shops beyond the first are unlocked through subscription plans. Bundle pricing is structured so upgrading to a higher tier is always cheaper per shop than buying incremental plans — incentivizing vendors to scale up rather than stack.

| Plan | Shops | Monthly | Yearly | Saving | Key Features |
|---|---|---|---|---|---|
| Vendor Basic | 1 | Free | Free | — | 1 shop forever free |
| Vendor Builder | 2 | ৳X | ৳X | 15% | 2 shops |
| Vendor Pro | 4 | ৳XX | ৳XX | 20% | 4 shops + Promotions |
| Vendor Business | 7 | ৳XXX | ৳XXX | 25% | 7 shops + Promotions + Priority Support + Staff Management |
| Vendor Enterprise | Unlimited | Custom | Custom | Custom | All features + Staff Management + Priority Support |

> **Bundle Logic:** A vendor on the Vendor Pro plan (4 shops) pays significantly less per shop than a vendor who purchases the Vendor Builder plan twice. This creates a clear financial incentive to upgrade.

> **Admin Control:** Platform administrators can control, edit, and update all pricing, discount percentages, and plan structures at any time. All values marked ৳X, ৳XX, ৳XXX are placeholders to be defined by the business team.

### 4.3 Subscription Rules

- Downgrading a plan does not delete shops — extra shops are paused until the vendor re-upgrades or manually archives them
- Paused shops are invisible to buyers but all data, products, and history are fully preserved
- Vendors receive advance renewal warnings at 7 days, 3 days, and 1 day before expiry
- If a subscription lapses, extra shops enter a 14-day grace period before being paused
- Vendors already subscribed can see upgrade deals and switch plans mid-cycle with prorated billing

### 4.4 Limited-Time Deals & Promotions

- Admin-created limited-time offers (e.g., "Upgrade to Pro, get 2 months free")
- Countdown timers on active deals shown on the subscription page
- First-time subscriber trial offers (e.g., 14-day free trial of the Builder plan)

---

## Part 5 — Shop Staff Management

### 5.1 Overview

Shop staff management is available to vendors on the Vendor Business and Vendor Enterprise plans. This feature allows vendors to invite team members to manage specific functions within their shops.

### 5.2 Staff Roles & Permissions

| Role | Permissions |
|---|---|
| Owner | Full access across all owned shops. Manages subscriptions, staff, and settings. |
| Manager | Can manage orders, listings, and shop settings. Cannot manage billing or staff. |
| Inventory Staff | Can add, edit, and remove products and manage stock levels only. |
| Customer Support | Can view and respond to messages and order issues only. |

No staff member has access to billing, subscription management, or the ability to add or remove other staff — those remain exclusively with the shop Owner.

---

## Part 6 — Shop Management Dashboard

### 6.1 Master Dashboard

Vendors with multiple shops access a central Master Dashboard that provides a unified view across all shops simultaneously. The dashboard displays both individual shop data and combined totals:

- Total revenue — by individual shop and all shops combined
- Pending orders — by individual shop and all shops combined
- Low stock alerts — by individual shop and all shops combined
- New messages — by individual shop and all shops combined
- Quick shop switcher — navigate between shops instantly

### 6.2 Per-Shop Management

Each individual shop has its own dedicated management section containing:

- Inventory management
- Order management
- Promotions and discounts
- Analytics
- Customer reviews
- Shop settings

### 6.3 Shop Analytics

Vendors can view analytics both per individual shop and in aggregate across all shops:

| Metric | Breakdown |
|---|---|
| Sales | Daily, Weekly, and Monthly breakdown per shop and total |
| Products | Most viewed and most sold listings |
| Customers | New vs returning customer split |
| Revenue | Revenue by individual shop and by product category |

---

## Part 7 — Shop Verification & Trust Badges

### 7.1 Verification Levels

Every shop on AtomDrops belongs to one of four verification tiers. Badges are displayed prominently on storefronts and product pages. Customers naturally trust higher-verified shops more, creating a powerful incentive for vendors to build their track record on the platform.

| Badge Level | Criteria |
|---|---|
| Standard Shop | Basic account verified. New vendor default. |
| Verified Shop | Business documents checked and approved by admin. |
| Premium Shop | Long and successful transaction history on the platform. |
| Trusted Shop | Top-rated vendor with outstanding reputation metrics. |

---

## Part 8 — Cross-Shop Rules & Safeguards

### 8.1 Product & Inventory Rules

- A product can only belong to one shop at a time — no cross-shop product sharing
- Each shop maintains completely independent inventory and stock levels
- Vendors cannot create two shops in the same product category unless on the Vendor Business plan or above — this prevents gaming platform search results

### 8.2 Reputation & Rating Rules

- Each shop maintains its own separate reputation, rating, and review history
- Reviews are shop-specific, not vendor-wide
- The vendor account holds an aggregate trust score that reflects behavior across all owned shops
- Buyers browsing one shop can see if the vendor operates other shops — full transparency

### 8.3 Conduct & Enforcement

- A vendor banned for misconduct loses access to all of their shops, not just the shop involved
- Platform administrators validate and manage all vendor statuses, verification levels, and enforcement actions

---

## Part 9 — Complete Vendor Lifecycle

### 9.1 End-to-End Flow

| Step | Action |
|---|---|
| Step 1 | User subscribes at ৳99 → Vendor account activated |
| Step 2 | Vendor creates first shop (free, forever) |
| Step 3 | Vendor uploads products → Each product is linked to the shop |
| Step 4 | Buyers discover the shop through product pages via "Visit Shop" |
| Step 5 | Buyers follow the shop → Retention and repeat engagement begins |
| Step 6 | Vendor grows and wants to open a second shop |
| Step 7 | Vendor subscribes to a paid plan → New shop slot unlocked |
| Step 8 | Vendor manages all shops from the Master Dashboard |
| Step 9 | Vendor builds shop reputation and aggregate trust score |
| Step 10 | Vendor scales further with Business or Enterprise plans |
