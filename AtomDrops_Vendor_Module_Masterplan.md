# AtomDrops — Vendor Module Masterplan

---

## Part 1 — Vendor Onboarding & Shop Creation

### 1.1 Becoming a Vendor

When a user becomes member by subscribing for 99tk, he becomes a basic member where he can run one shop for free forever.

After successfully becoming a vendor he can go to his Shops section, in there he has to create a shop. In that shop he will manage his inventory products.

### 1.2 First Shop Setup

The vendor names and configures their shop before they can list anything. This makes the shop feel like a real storefront, not an afterthought.

**Fields:**
- Dedicated Shop Identity
- Creates shop name
- Uploads logo
- Uploads banner
- Writes shop description
- Primary product category
- Shop Location
- Shop Policies: Returns, warranty, shipping

The first shop is always free — no subscription required.

Then every product shows: "Visit Shop"

This is exactly how many successful marketplaces work.

---

## Part 2 — Product Listing & Shop Linking

### 2.1 Product Upload Flow

After creating a shop or multiple shops successfully, when a vendor wants to upload a product he has to go to that individual shop and upload the product. Every product a vendor lists is tied to a specific shop. This is important when they eventually have multiple shops.

**Product Upload Flow:**
1. Select which shop this product belongs to
2. Upload photos
3. Add title, description, specs
4. Set price, stock, variants
5. Add shipping options
6. Publish

### 2.2 Product Detail Page — Shop Integration

On every product page, there is a "Visit [Shop Name]" section that shows:
- Shop logo + name
- Shop rating and total reviews
- Number of products in shop
- Follower count
- A "View Shop" button

---

## Part 3 — The Vendor Storefront

### 3.1 Public Storefront

This is where buyers discover the full storefront organically through products.

Each shop has its own public-facing page. Think of it as a mini store within AtomDrops.

**What the Storefront Shows:**
- Shop banner and branding
- All active product listings
- Shop rating and review summary
- Featured/highlighted products (vendor can pin these)
- Shop policies
- Follow button for buyers

### 3.2 What Vendors Can Do Inside Their Shop Dashboard

- Add / edit / remove products
- Manage stock levels
- Pause listings (temporarily hide without deleting)
- Pin featured products to the top
- View shop-level analytics
- Manage shop policies
- Edit shop branding

### 3.3 Shop Followers System

Every shop should have:
- Followers
- Reviews
- Ratings
- Product Count
- Shop Age
- Response Rate

Customers can:
- Follow shop
- Receive notifications
- See new products
- See discounts
- See auctions

This creates retention.

### 3.4 Customer Journey Through the Storefront

Product Page
→ Visit Shop
→ Browse Vendor Inventory
→ Follow Shop
→ Give review
→ View Reviews
→ Purchase More Products

This increases trust and repeat purchases.

---

## Part 4 — Multi-Shop System & Subscriptions

### 4.1 Why Multi-Shop

This is the growth layer of the vendor module.

A vendor may own multiple shops.

Example:
Vendor owns:
- TechWorld
- Furniture Hub
- Fashion Point

Instead of mixing everything together.

Customers also get a cleaner experience.

### 4.2 The Core Rule

Every vendor gets one shop free, forever. Additional shops require an active subscription.

This is a smart monetization opportunity.

### 4.3 Subscription Tiers

**Vendor Basic:**
- 1 shop
- Monthly Free, Yearly Free

**Vendor Builder:**
- 2 shops
- Monthly ৳X, Yearly ৳X (save 15%)

**Vendor Pro:**
- 4 shops
- Monthly ৳XX, Yearly ৳XX (save 20%)
- Promotions

**Vendor Business:**
- 7 shops
- Monthly ৳XXX, Yearly ৳XXX (save 25%)
- Promotions
- Priority support
- Shop Staff Management

**Vendor Enterprise:**
- Unlimited shop, for large businesses
- Custom payment
- Promotions
- Priority support
- Shop Staff Management

### 4.4 Bundle Logic

The calculation of purchase plane should be cheaper if vendors tends to subscribe the upgraded one. It makes the user feel like that they got it for cheaper.

Bundle logic: A vendor buying the Pro plan (4 shops) pays significantly less per shop than buying the Builder plan twice. This incentivizes upgrading rather than stacking.

### 4.5 Admin Control Over Plans

Admin can control/edit all the pricing and discount of each and every plan and subscriptions and manage or validate any kind of status. The structure and savings percentages are the recommendation.

### 4.6 Subscription Rules

- Downgrading a plan does not delete shops — it pauses extra shops until the vendor re-upgrades or manually archives them
- Paused shops are invisible to buyers but all data is preserved
- Vendors receive advance warning (7 days, 3 days, 1 day) before renewal or expiry
- If a subscription lapses, extra shops go into a grace period of 14 days before pausing

---

## Part 5 — Shop Staff Management

### 5.1 Overview

Add Shop Staff Management to selected tiers.

A vendor may own multiple shops.

Example:

Owner:
- TechWorld
- Furniture Hub
- Fashion Point
- Etc.

### 5.2 Staff Roles

Owner can invite:
- Manager
- Inventory Staff
- Customer Support Staff

Each role has limited permissions.

This makes AtomDrops feel like a real business platform rather than a student marketplace project.

---

## Part 6 — Shop Management Dashboard

### 6.1 Master Dashboard View

When a vendor has multiple shops, they need a central control panel.

Shows across all shops at once:
- Total revenue (both by individual shop and all shops combined)
- Orders pending (both by individual shop and all shops)
- Low stock alerts (both by individual shop and all shops)
- New messages (both by individual shop and all shops)
- Quick switch between shops

### 6.2 Per-Shop Management

Each shop has its own section for:
- Inventory management
- Order management
- Promotions and discounts
- Analytics
- Customer reviews
- Shop settings

### 6.3 Shop Status Controls

Vendors can set any shop to:

- **Status: Active** = Fully live, visible to buyers.
- **Status: Paused** = Temporarily hidden, no new orders.
- **Status: Archived** = Permanently closed, data preserved.

### 6.4 Shop Followers System

Every shop should have:
- Followers
- Reviews
- Ratings
- Product Count
- Shop Age
- Response Rate

Customers can:
- Follow shop
- Receive notifications
- See new products
- See discounts

This creates retention.

### 6.5 Shop Analytics

Vendor should see both by individual shop and total:

**Sales:**
- Daily
- Weekly
- Monthly

**Products:**
- Most viewed
- Most sold

**Customers:**
- New customers
- Returning customers

**Revenue:**
- Revenue by shop
- Revenue by category

---

## Part 7 — Shop Verification & Trust Badges

A powerful trust feature.

### 7.1 Verification Levels

- **Standard Shop** — Basic verification.
- **Verified Shop** — Business documents checked.
- **Premium Shop** — Long successful history.
- **Trusted Shop** — Top-rated vendors.

Customers will naturally trust verified shops more.

---

## Part 8 — Cross-Shop Rules & Safeguards

When one vendor manages multiple shops, there need to be clear rules to protect buyers and platform integrity.

- A product can only belong to one shop at a time
- Each shop maintains its own separate reputation and rating
- Reviews are shop-specific, not vendor-wide (though the vendor's overall trust score aggregates across all shops)
- Shops cannot share inventory — each shop has independent stock
- Vendors cannot create two shops in the same category unless on Business plan or above (this prevents gaming search results)

---

## Part 9 — Deals & Promotions on Subscription Plans

As you mentioned, deals update over time. Here's a clean system for that:

- Platform admins can run limited-time subscription promotions (e.g., "Upgrade to Growth, get 2 months free")
- Vendors see active deals on the subscription page with a countdown timer
- Vendors who are already subscribed can see upgrade deals and switch plans mid-cycle with prorated billing
- First-time subscribers can get trial offers for paid plans (e.g., 14-day free trial of Builder)

---

## Part 10 — Vendor Reputation Across Shops

The trust system extends meaningfully into the multi-shop world.

- Each shop has its own rating (out of 5), review count, and completion rate
- The vendor account has an aggregate trust score that reflects behavior across all shops
- Buyers browsing Shop A can see if this vendor also runs Shop B (transparency feature)
- A vendor banned for misconduct loses all shops, not just the one involved

---

## Part 11 — Complete Vendor Lifecycle

**End-to-End Flow:**

Sign Up → Subscribed Vendor
    ↓
Create First Shop (Free)
    ↓
List Products → Products link to Shop
    ↓
Buyers discover Shop through Product Pages
    ↓
Vendor grows → Wants second shop
    ↓
Subscribes to paid plan → New shop unlocked
    ↓
Manages all shops from Master Dashboard
    ↓
Builds reputation per shop + overall trust score
    ↓
Scales with Growth / Pro / Enterprise plans

Is all fulfilled?
