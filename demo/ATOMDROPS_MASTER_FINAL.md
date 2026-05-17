# ATOMDROPS — DEFINITIVE MASTER BUILD PROMPT
## Smart Multi-Vendor Marketplace SaaS · Version 5.0 — FINAL
### Spring Boot 3 · React 19 · PostgreSQL (Supabase)

> **How to use this document**
> Paste the entire file into any capable AI coding model (Claude, GPT-4o, Gemini, Cursor, Windsurf)
> at the start of each session. Reference the relevant Part for each task. The AI must follow every
> rule, constraint, and architectural decision exactly. Do not deviate from the schema, API
> contracts, or structure without explicit instruction.
> **This document supersedes all previous versions (v4.0, v4.1, schema_v3_final.sql).**

---

## PART 0 — PROJECT IDENTITY & ARCHITECTURE

### 0.1 What AtomDrops Is

AtomDrops is a **smart multi-vendor marketplace SaaS** — a unified commerce ecosystem built on
four integrated modules:

| Module | Description |
|---|---|
| **Main Marketplace** | Vendors sell new products to customers |
| **Used Items Marketplace** | Anyone buys/sells second-hand goods, with price offers |
| **Repair Service Marketplace** | Technicians offer repair services via a booking system |
| **Live Auction System** | Vendors run real-time and scheduled auctions with smart bidding |

Every user interaction contributes to a dynamic **trust score**. Fraud is detected automatically.
Admins govern the entire platform from a fully isolated enterprise panel.

### 0.2 Currency & Locale

| Field | Value |
|---|---|
| Currency | BDT (Bangladeshi Taka ৳) |
| Locale | `en-BD` |
| Timezone | UTC stored; local time displayed on frontend |
| Monetary precision | `DECIMAL(12,2)` in DB · `BigDecimal` in Java · `৳X,XXX.XX` in UI |

### 0.3 Enterprise Architecture — Two Frontend Apps, One Backend

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AtomDrops Spring Boot API                         │
│                                                                      │
│  /api/auth/**        /api/products/**     /api/auctions/**          │
│  /api/orders/**      /api/repair/**       /api/chat/**              │
│  /api/admin/**       /api/admin/analytics/**                        │
│                                                                      │
│  Spring Security — session-based auth · role-based endpoint guards  │
└────────────────────┬────────────────────────────────────────────────┘
                     │  Single PostgreSQL database (Supabase)
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────────┐ ┌───────▼──────────────┐
│  MARKETPLACE APP   │ │   ADMIN PANEL APP     │
│  React + Vite      │ │   React + Vite        │
│  port 5173 (dev)   │ │   port 5174 (dev)     │
│  atomdrops.com     │ │   admin.atomdrops.com │
│                    │ │                       │
│  Customer UI       │ │  Dashboard (KPIs)     │
│  Vendor Dashboard  │ │  User Management      │
│  Technician Panel  │ │  Auction Approval     │
│  Public Pages      │ │  Fraud Review         │
└────────────────────┘ │  Analytics            │
                       │  Platform Settings    │
                       │  Audit Log Viewer     │
                       └───────────────────────┘
```

**Why this structure?**
- Admin is on a completely separate domain — if the marketplace is compromised, the admin surface remains isolated
- Admin bundle is never shipped to marketplace users
- CORS is configured per origin; the backend explicitly allows each app
- Admin session cookies are scoped to `admin.atomdrops.com`
- Each frontend can be independently deployed, scaled, and versioned

### 0.4 Technology Stack

| Layer | Technology |
|---|---|
| Language | Java 21 (LTS) |
| Framework | Spring Boot 3.3+ |
| ORM | Spring Data JPA / Hibernate 6 |
| Database | PostgreSQL 15 via Supabase |
| Auth | Spring Security — HttpSession (cookie-based, NOT JWT) |
| Password | BCryptPasswordEncoder (strength 12) |
| Validation | Jakarta Bean Validation |
| Real-time | Spring WebSocket + STOMP |
| Build | Maven |
| Frontend | React 19, Vite 6, TypeScript 5, Tailwind CSS 4 |
| HTTP Client | Axios (`withCredentials: true`) |
| Server State | TanStack Query v5 (React Query) |
| Routing | React Router 7 |
| WebSocket | @stomp/stompjs |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Charts | recharts |

> **Why session-based auth over JWT?** For a marketplace with admin roles and real-time features,
> server-side sessions give instant revocation — banning a user kills their session immediately.
> JWT would require a denylist, defeating the stateless benefit. Sessions are the right call.

---

## PART 1 — USER ROLES

There are exactly **4 roles**. A user can hold multiple roles simultaneously (e.g. a vendor who is also a customer).

### CUSTOMER
- Browse and purchase new products and used items
- Submit repair requests, receive technician quotes, book repairs
- Participate in auctions (place bids after accepting `AUCTION_RULES` agreement)
- Sell their own used items; make price offers on used listings
- Manage: wishlist, cart, orders, addresses, returns
- Rate and review vendors and technicians
- Chat with vendors and technicians
- **Editable profile fields:** `display_name`, `phone`, `avatar_url`, `bio`, `location`, `date_of_birth`, `gender`

### VENDOR
- All CUSTOMER capabilities, PLUS:
- Create and manage product listings (CRUD + inventory + variants)
- Create and manage auction sessions (requires ADMIN approval before going live)
- Answer product Q&A from customers
- Restrict specific bidders from their auctions
- View sales analytics, commissions, auction performance
- **Editable profile fields:** all customer fields + `shop_name`, `shop_slug`, `bio`, `logo_url`, `banner_url`, `website_url`, `social_links`

### TECHNICIAN
- All CUSTOMER capabilities, PLUS:
- Register with a specialization: Electronics | Electrical | Furniture | Appliances
- Browse open repair requests matching their specialization
- Send repair quotes with plan and price
- Accept/reject bookings, mark services complete
- Set weekly availability schedule
- Level progression: Beginner → Verified (10+ jobs) → Expert (50+ jobs)
- **Editable profile fields:** all customer fields + `bio`, `specialization`, `service_area`, `pickup_available`, `website_url`, `social_links`, `skills[]`, `availability_schedule`

### ADMIN
- Full read/write access to all platform data
- Approve or reject vendor auction sessions
- Ban, suspend, or reinstate any user
- Resolve fraud flags, user reports, and return requests
- Edit platform settings live (commission rates, thresholds, etc.)
- View filterable audit logs
- View platform analytics dashboard (KPIs, revenue, trends)
- Manage system-wide announcements (`system_notifications`)
- **Operates exclusively from the separate frontend at `admin.atomdrops.com`**

---

## PART 2 — DATABASE SCHEMA v5.0 (FINAL — 71 TABLES)

### Design Decisions (Senior Engineer Notes)

- **Soft deletes on 3 tables only:** `users`, `products`, `used_listings`. These need audit trails and recovery. All others hard-delete. Over-applying soft delete adds complexity without benefit.
- **`JSONB` for `gateway_response` and `social_links`:** Payment gateway responses vary by provider. Social link platform sets change over time. JSONB stores them verbatim without schema migrations.
- **`shipping_address_snapshot JSONB` on orders:** The address at checkout time must be immutable. If a customer later deletes or edits the address, the order history must show exactly where it shipped.
- **`analytics_snapshots` table:** Running `SUM(total_bdt) FROM orders WHERE ...` across millions of rows for every admin dashboard load is expensive. Daily snapshots precompute these aggregates. Admin sees fast charts; live data is one day behind at most.
- **`system_notifications` table:** Platform-level broadcasts (maintenance, features, policies) need to reach all users. This is architecturally different from per-user notifications.
- **`customer_profiles` extension table:** Separates customer-specific fields (`bio`, `location`, `date_of_birth`, `gender`) from the core `users` row, keeping the auth table lean.
- **`used_listing_offers` + `used_listing_offer_messages`:** Enables the buyer-seller negotiation flow without polluting the chat system.
- **`technician_availability`:** One row per day of week per technician — clean, queryable, and supports scheduling UI.
- **`auction_payments` (separate from `payments`):** Auction win payments have a distinct lifecycle (payment_deadline, non_payment_count enforcement) that does not belong in the order payment flow.
- **`order_status_log`:** Full status change trail per order — essential for disputes and admin review.
- **`product_questions`:** Vendor Q&A directly on product pages, public-facing.

### Schema Rules for AI
1. Run the entire SQL block in Supabase SQL Editor as a single migration.
2. All statements are idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
3. Spring Boot uses `spring.jpa.hibernate.ddl-auto=validate` — schema must exist before the app starts.
4. Tables with `deleted_at` must use `@SQLRestriction("deleted_at IS NULL")` on the JPA entity.
5. Never alter table names, column names, or FK relationships without updating this document.
6. `fn_set_updated_at()` must be created first — it is a dependency of all other triggers.

```sql
-- ============================================================
-- ATOMDROPS DATABASE SCHEMA v5.0
-- PostgreSQL (Supabase) | 71 Tables | ~70+ Indexes | 35 Triggers
-- All statements are idempotent — safe to re-run.
-- ============================================================

-- ── SECTION 0: UTILITY ───────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── SECTION 1: ROLES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id   BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- ── SECTION 2: USERS & AUTH ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    email         VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(120) NOT NULL,
    phone         VARCHAR(30),
    avatar_url    TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE','SUSPENDED','BANNED')),
    deleted_at    TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status     ON users(status)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_badges (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL
                   CHECK (badge_type IN ('VERIFIED_SELLER','TOP_RESELLER',
                                         'EXPERT_TECHNICIAN','TRUSTED_BIDDER')),
    awarded_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (user_id, badge_type)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS ban_history (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     VARCHAR(20) NOT NULL
                   CHECK (action IN ('BANNED','SUSPENDED','UNBANNED','REINSTATED')),
    reason     TEXT        NOT NULL,
    admin_id   BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ban_history_user ON ban_history(user_id, created_at DESC);

-- Customer-specific profile extension table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id            BIGINT  PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id       BIGINT  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio           TEXT,
    location      VARCHAR(120),
    website_url   TEXT,
    date_of_birth DATE,
    gender        VARCHAR(20) CHECK (gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS addresses (
    id           BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label        VARCHAR(60)  NOT NULL DEFAULT 'Home',
    full_name    VARCHAR(120) NOT NULL,
    phone        VARCHAR(30)  NOT NULL,
    address_line TEXT         NOT NULL,
    city         VARCHAR(100) NOT NULL,
    area         VARCHAR(100),
    postal_code  VARCHAR(20),
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

CREATE TABLE IF NOT EXISTS user_agreements (
    id             BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id        BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreement_type VARCHAR(50) NOT NULL
                       CHECK (agreement_type IN ('TERMS','PRIVACY','AUCTION_RULES')),
    accepted_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    ip_address     VARCHAR(45),
    UNIQUE (user_id, agreement_type)
);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user ON user_agreements(user_id);

-- ── SECTION 3: AUDIT LOGS ────────────────────────────────────
-- Records every significant admin or system action with before/after state.
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    actor_id    BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(60) NOT NULL,    -- e.g. 'USER_BANNED', 'AUCTION_APPROVED'
    entity_type VARCHAR(60) NOT NULL,    -- e.g. 'users', 'auctions'
    entity_id   BIGINT,
    old_data    JSONB,
    new_data    JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent     ON audit_logs(created_at DESC)
    WHERE created_at > NOW() - INTERVAL '90 days';

-- ── SECTION 4: PLATFORM SETTINGS ─────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL,
    data_type   VARCHAR(20)  NOT NULL DEFAULT 'STRING'
                    CHECK (data_type IN ('STRING','INTEGER','DECIMAL','BOOLEAN','JSON')),
    description TEXT,
    updated_by  BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 5: ANALYTICS SNAPSHOTS ───────────────────────────
-- Daily precomputed KPIs for admin dashboard charts.
-- Populated by @Scheduled job at midnight UTC. Never computed in real-time.
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id                    BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    snapshot_date         DATE          NOT NULL UNIQUE,
    new_users_count       INT           NOT NULL DEFAULT 0,
    active_users_count    INT           NOT NULL DEFAULT 0,
    new_orders_count      INT           NOT NULL DEFAULT 0,
    gross_revenue_bdt     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    platform_fees_bdt     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    new_used_listings     INT           NOT NULL DEFAULT 0,
    new_repair_requests   INT           NOT NULL DEFAULT 0,
    completed_repairs     INT           NOT NULL DEFAULT 0,
    new_auctions_count    INT           NOT NULL DEFAULT 0,
    auction_revenue_bdt   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    fraud_flags_raised    INT           NOT NULL DEFAULT 0,
    fraud_flags_resolved  INT           NOT NULL DEFAULT 0,
    new_reports_count     INT           NOT NULL DEFAULT 0,
    created_at            TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(snapshot_date DESC);

-- ── SECTION 6: SYSTEM NOTIFICATIONS ──────────────────────────
-- Platform-level broadcasts (maintenance, features, policy changes).
-- Different from per-user notifications.
CREATE TABLE IF NOT EXISTS system_notifications (
    id           BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    title        VARCHAR(200) NOT NULL,
    body         TEXT         NOT NULL,
    type         VARCHAR(30)  NOT NULL DEFAULT 'INFO'
                     CHECK (type IN ('INFO','WARNING','MAINTENANCE','POLICY_UPDATE')),
    target_roles VARCHAR(100),     -- NULL = all users; or comma-sep: 'VENDOR,TECHNICIAN'
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    starts_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    ends_at      TIMESTAMP,
    created_by   BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_notifs_active ON system_notifications(is_active, starts_at)
    WHERE is_active = TRUE;
CREATE TRIGGER trg_system_notifications_updated_at
    BEFORE UPDATE ON system_notifications FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 7: VENDOR PROFILES ───────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id                  BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id             BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    shop_name           VARCHAR(180) NOT NULL,
    shop_slug           VARCHAR(180) NOT NULL UNIQUE,
    logo_url            TEXT,
    banner_url          TEXT,
    bio                 TEXT,
    location            VARCHAR(120),
    website_url         TEXT,
    social_links        JSONB,       -- {"facebook":"...", "instagram":"...", "tiktok":"..."}
    verification_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')),
    response_rate       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_slug ON vendor_profiles(shop_slug);
CREATE TRIGGER trg_vendor_profiles_updated_at
    BEFORE UPDATE ON vendor_profiles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 8: CATEGORIES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name       VARCHAR(120) NOT NULL,
    slug       VARCHAR(120) NOT NULL UNIQUE,
    parent_id  BIGINT       REFERENCES categories(id) ON DELETE SET NULL,
    icon_url   TEXT,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (name, parent_id)
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 9: PRODUCTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id          BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    vendor_id   BIGINT        NOT NULL REFERENCES users(id)      ON DELETE RESTRICT,
    category_id BIGINT        NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name        VARCHAR(255)  NOT NULL,
    description TEXT,
    price_bdt   DECIMAL(12,2) NOT NULL CHECK (price_bdt >= 0),
    status      VARCHAR(20)   NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','ACTIVE','INACTIVE','OUT_OF_STOCK')),
    deleted_at  TIMESTAMP,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status   ON products(vendor_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_price           ON products(price_bdt)
    WHERE deleted_at IS NULL;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(name,'') || ' ' || COALESCE(description,''))
    ) STORED;
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);

CREATE TABLE IF NOT EXISTS product_images (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    product_id BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url  TEXT      NOT NULL,
    sort_order INT       NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order);

CREATE TABLE IF NOT EXISTS product_variants (
    id               BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    product_id       BIGINT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_label    VARCHAR(255)  NOT NULL,   -- e.g. "Red / XL", "128GB"
    sku              VARCHAR(100)  UNIQUE,
    price_offset_bdt DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS inventory (
    id                 BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    product_id         BIGINT    NOT NULL REFERENCES products(id)         ON DELETE CASCADE,
    product_variant_id BIGINT             REFERENCES product_variants(id) ON DELETE CASCADE,
    stock_qty          INT       NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    low_stock_threshold INT      NOT NULL DEFAULT 5,
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, product_variant_id)
);
CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Customer Q&A on product pages
CREATE TABLE IF NOT EXISTS product_questions (
    id          BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    product_id  BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    asker_id    BIGINT    NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    question    TEXT      NOT NULL,
    answer      TEXT,
    answered_by BIGINT    REFERENCES users(id) ON DELETE SET NULL,
    answered_at TIMESTAMP,
    is_public   BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id, is_public);
CREATE TRIGGER trg_product_questions_updated_at
    BEFORE UPDATE ON product_questions FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 10: CART & COUPONS ───────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Forward-declare used_listings FK — resolved after Section 13
CREATE TABLE IF NOT EXISTS cart_items (
    id                 BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    cart_id            BIGINT      NOT NULL REFERENCES carts(id)             ON DELETE CASCADE,
    item_type          VARCHAR(20) NOT NULL DEFAULT 'PRODUCT'
                           CHECK (item_type IN ('PRODUCT','USED_ITEM')),
    product_id         BIGINT               REFERENCES products(id)           ON DELETE CASCADE,
    product_variant_id BIGINT               REFERENCES product_variants(id)   ON DELETE SET NULL,
    used_listing_id    BIGINT               REFERENCES used_listings(id)      ON DELETE CASCADE,
    qty                INT         NOT NULL DEFAULT 1 CHECK (qty > 0),
    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    CHECK (
        (item_type = 'PRODUCT'   AND product_id IS NOT NULL AND used_listing_id IS NULL) OR
        (item_type = 'USED_ITEM' AND used_listing_id IS NOT NULL AND product_id IS NULL)
    ),
    UNIQUE (cart_id, product_id, product_variant_id),
    UNIQUE (cart_id, used_listing_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE TRIGGER trg_cart_items_updated_at
    BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS coupons (
    id               BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    code             VARCHAR(50)   NOT NULL UNIQUE,
    description      TEXT,
    discount_type    VARCHAR(20)   NOT NULL CHECK (discount_type IN ('FLAT','PERCENT')),
    discount_value   DECIMAL(12,2) NOT NULL CHECK (discount_value > 0),
    min_order_bdt    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    max_discount_bdt DECIMAL(12,2),          -- cap for PERCENT type
    max_uses         INT,                    -- NULL = unlimited
    uses_count       INT           NOT NULL DEFAULT 0,
    valid_from       TIMESTAMP     NOT NULL DEFAULT NOW(),
    valid_until      TIMESTAMP,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by       BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE is_active = TRUE;
CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 11: ORDERS, PAYMENTS & SHIPMENTS ─────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                        BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    customer_id               BIGINT        NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    shipping_address_id       BIGINT                 REFERENCES addresses(id) ON DELETE SET NULL,
    shipping_address_snapshot JSONB,         -- immutable snapshot taken at checkout
    coupon_id                 BIGINT                 REFERENCES coupons(id)   ON DELETE SET NULL,
    subtotal_bdt              DECIMAL(12,2) NOT NULL CHECK (subtotal_bdt >= 0),
    shipping_fee_bdt          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_bdt              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_bdt                   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_bdt                 DECIMAL(12,2) NOT NULL CHECK (total_bdt >= 0),
    status                    VARCHAR(20)   NOT NULL DEFAULT 'PLACED'
                                  CHECK (status IN ('PLACED','PAID','PROCESSING',
                                                    'SHIPPED','DELIVERED','CANCELLED','RETURNED')),
    note                      TEXT,
    created_at                TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON orders(created_at DESC);
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Full audit trail for every order status change
CREATE TABLE IF NOT EXISTS order_status_log (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_id   BIGINT      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT               REFERENCES users(id) ON DELETE SET NULL,
    note       TEXT,
    changed_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_status_log_order ON order_status_log(order_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS coupon_uses (
    id        BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    coupon_id BIGINT    NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    user_id   BIGINT    NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    order_id  BIGINT    NOT NULL REFERENCES orders(id)  ON DELETE CASCADE,
    used_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (coupon_id, user_id)    -- one redemption per coupon per user
);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user   ON coupon_uses(user_id);

CREATE TABLE IF NOT EXISTS order_items (
    id                 BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_id           BIGINT        NOT NULL REFERENCES orders(id)           ON DELETE CASCADE,
    item_type          VARCHAR(20)   NOT NULL DEFAULT 'PRODUCT'
                           CHECK (item_type IN ('PRODUCT','USED_ITEM')),
    product_id         BIGINT                 REFERENCES products(id)          ON DELETE RESTRICT,
    used_listing_id    BIGINT                 REFERENCES used_listings(id)     ON DELETE RESTRICT,
    product_variant_id BIGINT                 REFERENCES product_variants(id)  ON DELETE SET NULL,
    variant_label      VARCHAR(255),
    qty                INT           NOT NULL CHECK (qty > 0),
    unit_price_bdt     DECIMAL(12,2) NOT NULL CHECK (unit_price_bdt >= 0),
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
    CHECK (
        (item_type = 'PRODUCT'   AND product_id IS NOT NULL AND used_listing_id IS NULL) OR
        (item_type = 'USED_ITEM' AND used_listing_id IS NOT NULL AND product_id IS NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_order_items_order        ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product      ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_used_listing ON order_items(used_listing_id);

CREATE TABLE IF NOT EXISTS payments (
    id               BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_id         BIGINT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_bdt       DECIMAL(12,2) NOT NULL CHECK (amount_bdt > 0),
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
    method           VARCHAR(50)   NOT NULL DEFAULT 'DUMMY',
    gateway_name     VARCHAR(50),
    transaction_ref  VARCHAR(100)  UNIQUE,
    gateway_response JSONB,
    paid_at          TIMESTAMP,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order       ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_ref);
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS vendor_commissions (
    id              BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_item_id   BIGINT        NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
    vendor_id       BIGINT        NOT NULL REFERENCES users(id)              ON DELETE RESTRICT,
    sale_amount_bdt DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,2)  NOT NULL,
    commission_bdt  DECIMAL(12,2) NOT NULL,
    net_payout_bdt  DECIMAL(12,2) NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','PAID','HELD','CANCELLED')),
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_vendor ON vendor_commissions(vendor_id, status);
CREATE TRIGGER trg_vendor_commissions_updated_at
    BEFORE UPDATE ON vendor_commissions FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS shipments (
    id                 BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_id           BIGINT       NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    carrier            VARCHAR(100),
    tracking_number    VARCHAR(100) UNIQUE,
    status             VARCHAR(30)  NOT NULL DEFAULT 'PREPARING'
                           CHECK (status IN ('PREPARING','PICKED_UP','IN_TRANSIT',
                                             'OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED')),
    estimated_delivery DATE,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS shipment_events (
    id          BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    shipment_id BIGINT      NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    location    VARCHAR(255),
    note        TEXT,
    occurred_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON shipment_events(shipment_id, occurred_at DESC);

-- ── SECTION 12: WISHLISTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT    NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_user    ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

-- ── SECTION 13: USED ITEMS MARKETPLACE ───────────────────────
CREATE TABLE IF NOT EXISTS condition_levels (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    label      VARCHAR(50) NOT NULL UNIQUE,
    sort_order INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS used_listings (
    id             BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    seller_id      BIGINT        NOT NULL REFERENCES users(id)            ON DELETE RESTRICT,
    category_id    BIGINT        NOT NULL REFERENCES categories(id)       ON DELETE RESTRICT,
    condition_id   BIGINT        NOT NULL REFERENCES condition_levels(id) ON DELETE RESTRICT,
    title          VARCHAR(255)  NOT NULL,
    description    TEXT,
    price_bdt      DECIMAL(12,2) NOT NULL CHECK (price_bdt >= 0),
    warranty_flag  VARCHAR(3)    NOT NULL DEFAULT 'NO' CHECK (warranty_flag IN ('YES','NO')),
    offers_enabled BOOLEAN       NOT NULL DEFAULT FALSE,
    status         VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                       CHECK (status IN ('ACTIVE','SOLD','REMOVED')),
    deleted_at     TIMESTAMP,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_used_listings_seller_status   ON used_listings(seller_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_used_listings_category_status ON used_listings(category_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_used_listings_price           ON used_listings(price_bdt)
    WHERE deleted_at IS NULL;
CREATE TRIGGER trg_used_listings_updated_at
    BEFORE UPDATE ON used_listings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

ALTER TABLE used_listings ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(description,''))
    ) STORED;
CREATE INDEX IF NOT EXISTS idx_used_listings_search ON used_listings USING GIN(search_vector);

CREATE TABLE IF NOT EXISTS used_images (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    listing_id BIGINT    NOT NULL REFERENCES used_listings(id) ON DELETE CASCADE,
    image_url  TEXT      NOT NULL,
    sort_order INT       NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_used_images_listing ON used_images(listing_id, sort_order);

CREATE TABLE IF NOT EXISTS used_videos (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    listing_id BIGINT    NOT NULL REFERENCES used_listings(id) ON DELETE CASCADE,
    video_url  TEXT      NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_used_videos_listing ON used_videos(listing_id);

CREATE TABLE IF NOT EXISTS used_item_history (
    id                    BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    listing_id            BIGINT    NOT NULL UNIQUE REFERENCES used_listings(id) ON DELETE CASCADE,
    owner_count           INT       NOT NULL DEFAULT 1 CHECK (owner_count >= 1),
    usage_duration_months INT                CHECK (usage_duration_months >= 0),
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_used_item_history_updated_at
    BEFORE UPDATE ON used_item_history FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS used_item_repairs (
    id          BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    listing_id  BIGINT    NOT NULL REFERENCES used_listings(id) ON DELETE CASCADE,
    details     TEXT      NOT NULL,
    repaired_at DATE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_used_item_repairs_listing ON used_item_repairs(listing_id);

-- Buyer price offers on used listings (when offers_enabled = TRUE)
CREATE TABLE IF NOT EXISTS used_listing_offers (
    id         BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    listing_id BIGINT        NOT NULL REFERENCES used_listings(id) ON DELETE CASCADE,
    buyer_id   BIGINT        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    offer_bdt  DECIMAL(12,2) NOT NULL CHECK (offer_bdt > 0),
    status     VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN')),
    expires_at TIMESTAMP     NOT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, buyer_id)
);
CREATE INDEX IF NOT EXISTS idx_used_listing_offers_listing ON used_listing_offers(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_used_listing_offers_buyer   ON used_listing_offers(buyer_id);
CREATE TRIGGER trg_used_listing_offers_updated_at
    BEFORE UPDATE ON used_listing_offers FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Counter-offer message thread per offer
CREATE TABLE IF NOT EXISTS used_listing_offer_messages (
    id                BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    offer_id          BIGINT        NOT NULL REFERENCES used_listing_offers(id) ON DELETE CASCADE,
    sender_id         BIGINT        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message           TEXT,
    counter_offer_bdt DECIMAL(12,2),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_offer_messages_offer ON used_listing_offer_messages(offer_id, created_at);

-- ── SECTION 14: REPAIR SERVICE MARKETPLACE ───────────────────
CREATE TABLE IF NOT EXISTS technicians (
    id               BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id          BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio              TEXT,
    specialization   VARCHAR(30)  NOT NULL
                         CHECK (specialization IN ('Electronics','Electrical',
                                                   'Furniture','Appliances')),
    pickup_available BOOLEAN      NOT NULL DEFAULT FALSE,
    service_area     VARCHAR(255),
    website_url      TEXT,
    social_links     JSONB,
    level            VARCHAR(20)  NOT NULL DEFAULT 'Beginner'
                         CHECK (level IN ('Beginner','Verified','Expert')),
    rating_avg       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    completion_rate  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_technicians_updated_at
    BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS technician_level_history (
    id            BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    technician_id BIGINT      NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    old_level     VARCHAR(20) NOT NULL,
    new_level     VARCHAR(20) NOT NULL,
    changed_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tech_level_history ON technician_level_history(technician_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS technician_skills (
    id            BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    technician_id BIGINT       NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    skill         VARCHAR(120) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_technician_skills_tech ON technician_skills(technician_id);

-- Weekly availability: one row per day of week per technician
CREATE TABLE IF NOT EXISTS technician_availability (
    id            BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    technician_id BIGINT    NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    day_of_week   SMALLINT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
    start_time    TIME      NOT NULL,
    end_time      TIME      NOT NULL,
    is_available  BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (technician_id, day_of_week),
    CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_tech_availability ON technician_availability(technician_id);
CREATE TRIGGER trg_tech_availability_updated_at
    BEFORE UPDATE ON technician_availability FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS service_listings (
    id                BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    technician_id     BIGINT        NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    category_id       BIGINT                 REFERENCES categories(id)  ON DELETE SET NULL,
    title             VARCHAR(255)  NOT NULL,
    description       TEXT,
    price_min_bdt     DECIMAL(12,2) NOT NULL CHECK (price_min_bdt >= 0),
    price_max_bdt     DECIMAL(12,2) NOT NULL CHECK (price_max_bdt >= price_min_bdt),
    availability_note VARCHAR(255),
    status            VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_listings_tech     ON service_listings(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_category ON service_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_status   ON service_listings(status);
CREATE TRIGGER trg_service_listings_updated_at
    BEFORE UPDATE ON service_listings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS repair_requests (
    id            BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    customer_id   BIGINT      NOT NULL REFERENCES users(id)      ON DELETE RESTRICT,
    address_id    BIGINT               REFERENCES addresses(id)   ON DELETE SET NULL,
    category_id   BIGINT               REFERENCES categories(id)  ON DELETE SET NULL,
    description   TEXT        NOT NULL,
    pickup_needed BOOLEAN     NOT NULL DEFAULT FALSE,
    status        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                      CHECK (status IN ('OPEN','QUOTED','BOOKED','COMPLETED','CANCELLED')),
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repair_requests_customer ON repair_requests(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status   ON repair_requests(status);
CREATE TRIGGER trg_repair_requests_updated_at
    BEFORE UPDATE ON repair_requests FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS repair_media (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    request_id BIGINT      NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    media_url  TEXT        NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('IMAGE','VIDEO')),
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repair_media_request ON repair_media(request_id);

CREATE TABLE IF NOT EXISTS repair_quotes (
    id            BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    request_id    BIGINT        NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    technician_id BIGINT        NOT NULL REFERENCES technicians(id)     ON DELETE CASCADE,
    quote_bdt     DECIMAL(12,2) NOT NULL CHECK (quote_bdt >= 0),
    plan          TEXT,
    status        VARCHAR(20)   NOT NULL DEFAULT 'SENT'
                      CHECK (status IN ('SENT','ACCEPTED','REJECTED')),
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (request_id, technician_id)
);
CREATE INDEX IF NOT EXISTS idx_repair_quotes_request ON repair_quotes(request_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_quotes_tech    ON repair_quotes(technician_id);
CREATE TRIGGER trg_repair_quotes_updated_at
    BEFORE UPDATE ON repair_quotes FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- One booking per request (UNIQUE constraint enforced at DB level)
CREATE TABLE IF NOT EXISTS repair_bookings (
    id             BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    request_id     BIGINT      NOT NULL UNIQUE REFERENCES repair_requests(id) ON DELETE CASCADE,
    technician_id  BIGINT      NOT NULL REFERENCES technicians(id)            ON DELETE RESTRICT,
    scheduled_date DATE        NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
                       CHECK (status IN ('CONFIRMED','REJECTED','COMPLETED','CANCELLED')),
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repair_bookings_tech ON repair_bookings(technician_id, status);
CREATE TRIGGER trg_repair_bookings_updated_at
    BEFORE UPDATE ON repair_bookings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS service_completion (
    id           BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    booking_id   BIGINT    NOT NULL UNIQUE REFERENCES repair_bookings(id) ON DELETE CASCADE,
    notes        TEXT,
    completed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repair_payments (
    id               BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    booking_id       BIGINT        NOT NULL UNIQUE REFERENCES repair_bookings(id) ON DELETE CASCADE,
    amount_bdt       DECIMAL(12,2) NOT NULL CHECK (amount_bdt > 0),
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
    method           VARCHAR(50)   NOT NULL DEFAULT 'DUMMY',
    gateway_name     VARCHAR(50),
    transaction_ref  VARCHAR(100)  UNIQUE,
    gateway_response JSONB,
    paid_at          TIMESTAMP,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repair_payments_booking ON repair_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_status  ON repair_payments(status);
CREATE TRIGGER trg_repair_payments_updated_at
    BEFORE UPDATE ON repair_payments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS technician_earnings (
    id               BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    technician_id    BIGINT        NOT NULL REFERENCES technicians(id)            ON DELETE CASCADE,
    booking_id       BIGINT        NOT NULL UNIQUE REFERENCES repair_bookings(id) ON DELETE CASCADE,
    gross_amount_bdt DECIMAL(12,2) NOT NULL,
    commission_rate  DECIMAL(5,2)  NOT NULL,
    commission_bdt   DECIMAL(12,2) NOT NULL,
    net_amount_bdt   DECIMAL(12,2) NOT NULL,
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING','PAID','HELD')),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_technician_earnings_tech ON technician_earnings(technician_id, status);
CREATE TRIGGER trg_technician_earnings_updated_at
    BEFORE UPDATE ON technician_earnings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 15: REVIEWS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id            BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    reviewer_id   BIGINT    NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
    reviewee_id   BIGINT    NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
    product_id    BIGINT             REFERENCES products(id)        ON DELETE SET NULL,
    order_item_id BIGINT             REFERENCES order_items(id)     ON DELETE SET NULL,
    booking_id    BIGINT             REFERENCES repair_bookings(id) ON DELETE SET NULL,
    rating        INT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (reviewer_id <> reviewee_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee   ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product    ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer   ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking    ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_item ON reviews(order_item_id);

-- ── SECTION 16: AUCTION SYSTEM ───────────────────────────────
CREATE TABLE IF NOT EXISTS auctions (
    id             BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    vendor_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title          VARCHAR(255) NOT NULL,
    type           VARCHAR(20)  NOT NULL
                       CHECK (type IN ('STANDARD','FLASH','REVERSE','RESERVE')),
    status         VARCHAR(20)  NOT NULL DEFAULT 'CREATED'
                       CHECK (status IN ('CREATED','APPROVED','PREPARING','ACTIVE',
                                         'EXTENDED','CLOSED','COMPLETED','REJECTED')),
    start_time     TIMESTAMP    NOT NULL,
    end_time       TIMESTAMP    NOT NULL,
    terms_accepted BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_auctions_vendor_status ON auctions(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_auctions_status_time   ON auctions(status, start_time);
CREATE TRIGGER trg_auctions_updated_at
    BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS auction_lots (
    id                         BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    auction_id                 BIGINT        NOT NULL REFERENCES auctions(id)    ON DELETE CASCADE,
    category_id                BIGINT                 REFERENCES categories(id)  ON DELETE SET NULL,
    title                      VARCHAR(255)  NOT NULL,
    description                TEXT,
    condition_note             VARCHAR(100),
    starting_price_bdt         DECIMAL(12,2) NOT NULL CHECK (starting_price_bdt >= 0),
    reserve_price_bdt          DECIMAL(12,2)           CHECK (reserve_price_bdt >= 0),
    current_bid_bdt            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    min_bid_increment_bdt      DECIMAL(12,2) NOT NULL DEFAULT 10.00
                                   CHECK (min_bid_increment_bdt > 0),
    extension_duration_minutes INT           NOT NULL DEFAULT 5,
    extensions_count           INT           NOT NULL DEFAULT 0,
    max_extensions             INT           NOT NULL DEFAULT 3,
    status                     VARCHAR(20)   NOT NULL DEFAULT 'PREPARING'
                                   CHECK (status IN ('PREPARING','ACTIVE','EXTENDED','CLOSED')),
    created_at                 TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_lots_auction  ON auction_lots(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_lots_status   ON auction_lots(status);
CREATE INDEX IF NOT EXISTS idx_auction_lots_category ON auction_lots(category_id);
CREATE TRIGGER trg_auction_lots_updated_at
    BEFORE UPDATE ON auction_lots FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS auction_images (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    lot_id     BIGINT    NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
    image_url  TEXT      NOT NULL,
    sort_order INT       NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_images_lot ON auction_images(lot_id, sort_order);

-- Bids are append-only. Never UPDATE or DELETE a bid row.
CREATE TABLE IF NOT EXISTS bids (
    id         BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    lot_id     BIGINT        NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
    bidder_id  BIGINT        NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
    amount_bdt DECIMAL(12,2) NOT NULL CHECK (amount_bdt > 0),
    is_winning BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bids_lot_amount ON bids(lot_id, amount_bdt DESC);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_lot ON bids(bidder_id, lot_id);

CREATE TABLE IF NOT EXISTS auction_watchlist (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT    NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    lot_id     BIGINT    NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, lot_id)
);
CREATE INDEX IF NOT EXISTS idx_auction_watchlist_user ON auction_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_auction_watchlist_lot  ON auction_watchlist(lot_id);

CREATE TABLE IF NOT EXISTS auction_winners (
    id                BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    lot_id            BIGINT        NOT NULL UNIQUE REFERENCES auction_lots(id) ON DELETE CASCADE,
    winner_id         BIGINT        NOT NULL REFERENCES users(id)               ON DELETE RESTRICT,
    winning_bid_id    BIGINT        NOT NULL UNIQUE REFERENCES bids(id)         ON DELETE RESTRICT,
    final_price_bdt   DECIMAL(12,2) NOT NULL,
    reserve_met       BOOLEAN       NOT NULL DEFAULT TRUE,
    payment_status    VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                          CHECK (payment_status IN ('PENDING','PAID','FAILED','WAIVED')),
    payment_deadline  TIMESTAMP     NOT NULL,
    paid_at           TIMESTAMP,
    non_payment_count INT           NOT NULL DEFAULT 0,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_winners_winner  ON auction_winners(winner_id);
CREATE INDEX IF NOT EXISTS idx_auction_winners_pending ON auction_winners(payment_status)
    WHERE payment_status = 'PENDING';
CREATE TRIGGER trg_auction_winners_updated_at
    BEFORE UPDATE ON auction_winners FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Separate payment table for auction wins (distinct lifecycle from orders)
CREATE TABLE IF NOT EXISTS auction_payments (
    id                BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    auction_winner_id BIGINT        NOT NULL UNIQUE REFERENCES auction_winners(id) ON DELETE CASCADE,
    amount_bdt        DECIMAL(12,2) NOT NULL CHECK (amount_bdt > 0),
    status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
    method            VARCHAR(50)   NOT NULL DEFAULT 'DUMMY',
    gateway_name      VARCHAR(50),
    transaction_ref   VARCHAR(100)  UNIQUE,
    gateway_response  JSONB,
    paid_at           TIMESTAMP,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_payments_winner ON auction_payments(auction_winner_id);
CREATE INDEX IF NOT EXISTS idx_auction_payments_status ON auction_payments(status);
CREATE TRIGGER trg_auction_payments_updated_at
    BEFORE UPDATE ON auction_payments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS auction_approvals (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    auction_id BIGINT      NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    admin_id   BIGINT      NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    status     VARCHAR(20) NOT NULL CHECK (status IN ('APPROVED','REJECTED')),
    notes      TEXT,
    decided_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_approvals_auction ON auction_approvals(auction_id);

CREATE TABLE IF NOT EXISTS auction_status_log (
    id         BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    auction_id BIGINT      NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT               REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_status_log ON auction_status_log(auction_id, changed_at DESC);

-- ── SECTION 17: TRUST SCORES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS trust_scores (
    user_id    BIGINT       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score      DECIMAL(5,2) NOT NULL DEFAULT 50.00 CHECK (score BETWEEN 0 AND 100),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_trust_scores_updated_at
    BEFORE UPDATE ON trust_scores FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS trust_events (
    id         BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    delta      DECIMAL(5,2) NOT NULL,
    note       TEXT,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_events_user ON trust_events(user_id, created_at DESC);

-- ── SECTION 18: FRAUD DETECTION ──────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_flags (
    id          BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flagged_by  BIGINT                REFERENCES users(id) ON DELETE SET NULL,
    reason      VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','REVIEWED','RESOLVED')),
    resolved_by BIGINT                REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user_status ON fraud_flags(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_open        ON fraud_flags(status) WHERE status = 'OPEN';
CREATE TRIGGER trg_fraud_flags_updated_at
    BEFORE UPDATE ON fraud_flags FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS fraud_events (
    id         BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    details    TEXT,
    severity   VARCHAR(20)  NOT NULL DEFAULT 'LOW'
                   CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fraud_events_user     ON fraud_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_severity ON fraud_events(severity, created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
    id          BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    reporter_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reported_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    entity_type VARCHAR(60),
    entity_id   BIGINT,
    reason      TEXT        NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','REVIEWED','RESOLVED','DISMISSED')),
    admin_note  TEXT,
    resolved_at TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    CHECK (reporter_id <> reported_id)
);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_open     ON reports(status) WHERE status = 'OPEN';
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 19: BIDDER REPUTATION ────────────────────────────
CREATE TABLE IF NOT EXISTS bidder_reputation (
    user_id              BIGINT       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auctions_won         INT          NOT NULL DEFAULT 0,
    auctions_entered     INT          NOT NULL DEFAULT 0,
    win_rate             DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    payment_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    cancellation_rate    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_bidder_reputation_updated_at
    BEFORE UPDATE ON bidder_reputation FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS bidder_restrictions (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    vendor_id  BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bidder_id  BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason     VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (vendor_id, bidder_id),
    CHECK (vendor_id <> bidder_id)
);
CREATE INDEX IF NOT EXISTS idx_bidder_restrictions_vendor ON bidder_restrictions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bidder_restrictions_bidder ON bidder_restrictions(bidder_id);

-- ── SECTION 20: RETURNS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
    id                BIGINT        PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_item_id     BIGINT        NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    customer_id       BIGINT        NOT NULL REFERENCES users(id)       ON DELETE RESTRICT,
    reason            TEXT          NOT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'OPEN'
                          CHECK (status IN ('OPEN','APPROVED','REJECTED','COMPLETED','CANCELLED')),
    admin_note        TEXT,
    refund_amount_bdt DECIMAL(12,2),
    resolved_at       TIMESTAMP,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_returns_customer   ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_item ON returns(order_item_id);
CREATE INDEX IF NOT EXISTS idx_returns_open       ON returns(status) WHERE status = 'OPEN';
CREATE TRIGGER trg_returns_updated_at
    BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── SECTION 21: CHAT & MESSAGING ─────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id         BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id BIGINT    NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         BIGINT    NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);

-- Messages are append-only. Never UPDATE or DELETE a message row.
CREATE TABLE IF NOT EXISTS messages (
    id              BIGINT    PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    conversation_id BIGINT    NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT    NOT NULL REFERENCES users(id)         ON DELETE RESTRICT,
    body            TEXT      NOT NULL,
    is_read         BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);

-- ── SECTION 22: NOTIFICATIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT       PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(60)  NOT NULL,
    title       VARCHAR(120) NOT NULL,
    body        TEXT         NOT NULL,
    entity_type VARCHAR(60),
    entity_id   BIGINT,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE TRIGGER trg_notifications_updated_at
    BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id          BIGINT      PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id     BIGINT      NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    event_type  VARCHAR(60) NOT NULL,
    category_id BIGINT               REFERENCES categories(id) ON DELETE CASCADE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_type, category_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_subs_user ON notification_subscriptions(user_id);

-- ── SECTION 23: SEED DATA ────────────────────────────────────
INSERT INTO roles (name) VALUES
    ('ADMIN'),('VENDOR'),('CUSTOMER'),('TECHNICIAN')
ON CONFLICT (name) DO NOTHING;

INSERT INTO condition_levels (label, sort_order) VALUES
    ('Like New',1),('Good',2),('Fair',3),('Needs Repair',4)
ON CONFLICT (label) DO NOTHING;

INSERT INTO categories (name, slug, sort_order) VALUES
    ('Electronics','electronics',1),
    ('Appliances','appliances',2),
    ('Audio & Video','audio-video',3),
    ('Computers','computers',4),
    ('Furniture','furniture',5),
    ('Vehicles','vehicles',6),
    ('Clothing','clothing',7),
    ('Books','books',8),
    ('Sports','sports',9),
    ('Miscellaneous','miscellaneous',10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_settings (key, value, data_type, description) VALUES
    ('vendor.commission_rate',         '10.00', 'DECIMAL', 'Platform cut % on vendor product sales'),
    ('technician.commission_rate',     '8.00',  'DECIMAL', 'Platform cut % on repair payments'),
    ('trust.initial_score',            '50.00', 'DECIMAL', 'Starting trust score for new users'),
    ('trust.low_score_threshold',      '30.00', 'DECIMAL', 'Score below this restricts features'),
    ('trust.high_score_threshold',     '80.00', 'DECIMAL', 'Score above this unlocks badges'),
    ('trust.ban_threshold',            '10.00', 'DECIMAL', 'Score below this triggers auto review'),
    ('technician.verified_threshold',  '10',    'INTEGER', 'Jobs to reach Verified level'),
    ('technician.expert_threshold',    '50',    'INTEGER', 'Jobs to reach Expert level'),
    ('auction.default_bid_increment',  '10.00', 'DECIMAL', 'Default min bid increment in BDT'),
    ('auction.extension_minutes',      '5',     'INTEGER', 'Minutes added per auto-extension'),
    ('auction.max_extensions',         '3',     'INTEGER', 'Max auto-extensions per lot'),
    ('auction.payment_deadline_hours', '48',    'INTEGER', 'Hours winner has to pay'),
    ('auction.nonpayment_ban_count',   '2',     'INTEGER', 'Non-payments before bidder ban'),
    ('cart.expiry_hours',              '24',    'INTEGER', 'Cart idle expiry in hours'),
    ('coupon.max_uses_default',        '1',     'INTEGER', 'Default max uses per coupon per user'),
    ('offer.default_expiry_hours',     '24',    'INTEGER', 'Hours before used-item offer expires'),
    ('shipping.default_fee_bdt',       '60.00', 'DECIMAL', 'Default flat shipping fee in BDT')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- END OF SCHEMA v5.0
-- Total tables: 71
-- ============================================================
```

### Schema Quick Reference

| Metric | Count |
|---|---|
| Total tables | 71 |
| Soft-delete tables | 3 (`users`, `products`, `used_listings`) |
| Full-text search tables | 2 (`products`, `used_listings`) |
| Payment tables | 3 (`payments`, `repair_payments`, `auction_payments`) |
| Commission/earnings tables | 2 (`vendor_commissions`, `technician_earnings`) |
| Status log tables | 2 (`order_status_log`, `auction_status_log`) |
| Analytics/system tables | 2 (`analytics_snapshots`, `system_notifications`) |

---

## PART 3 — BACKEND ARCHITECTURE

### 3.1 application.properties

```properties
# Database
spring.datasource.url=jdbc:postgresql://<supabase-host>:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=<your-password>
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA — schema managed manually; validate on startup
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=false

# Session security
server.servlet.session.cookie.same-site=lax
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true
server.servlet.session.timeout=7d
```

### 3.2 SecurityConfig — Dual CORS (Marketplace + Admin)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/products/**", "/api/categories/**", "/api/auctions/**",
                    "/api/used-listings/**", "/api/technicians/**",
                    "/api/service-listings/**", "/api/system-notifications").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",       // marketplace dev
            "http://localhost:5174",       // admin panel dev
            "https://atomdrops.com",       // marketplace prod
            "https://admin.atomdrops.com"  // admin prod
        ));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);  // REQUIRED for session cookies — never use * with this
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### 3.3 Package Structure

```
com.atomdrops/
├── config/
│   ├── SecurityConfig.java
│   ├── WebSocketConfig.java           # STOMP broker config
│   └── SchedulerConfig.java           # Daily analytics snapshot job
│
├── model/                             # 71 JPA entities — one per table
│   ├── User.java                      # @SQLRestriction("deleted_at IS NULL")
│   ├── Product.java                   # @SQLRestriction("deleted_at IS NULL")
│   ├── UsedListing.java               # @SQLRestriction("deleted_at IS NULL")
│   ├── AnalyticsSnapshot.java
│   ├── SystemNotification.java
│   └── ... (one per table)
│
├── repository/                        # Spring Data JPA — one per entity
│
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── ProductService.java
│   ├── CartService.java
│   ├── OrderService.java              # 10-step checkout flow
│   ├── PaymentService.java
│   ├── CouponService.java
│   ├── UsedListingService.java
│   ├── OfferService.java
│   ├── RepairService.java
│   ├── TechnicianService.java
│   ├── AuctionService.java
│   ├── BidService.java                # bid validation + auto-extension + STOMP broadcast
│   ├── TrustService.java              # score event recording (always @Transactional with caller)
│   ├── FraudService.java
│   ├── NotificationService.java
│   ├── ChatService.java
│   ├── ReviewService.java
│   ├── ReturnService.java
│   ├── AnalyticsService.java          # KPI aggregation + snapshot job
│   ├── SystemNotificationService.java
│   └── AdminService.java
│
├── web/
│   ├── api/                           # REST controllers
│   │   ├── AuthController.java
│   │   ├── ProfileController.java
│   │   ├── AddressController.java
│   │   ├── CategoryController.java
│   │   ├── ProductController.java
│   │   ├── InventoryController.java
│   │   ├── CartController.java
│   │   ├── OrderController.java
│   │   ├── PaymentController.java
│   │   ├── ShipmentController.java
│   │   ├── WishlistController.java
│   │   ├── CouponController.java
│   │   ├── UsedListingController.java
│   │   ├── OfferController.java
│   │   ├── RepairController.java
│   │   ├── TechnicianController.java
│   │   ├── ServiceListingController.java
│   │   ├── AuctionController.java
│   │   ├── BidController.java
│   │   ├── WatchlistController.java
│   │   ├── ReviewController.java
│   │   ├── ReturnController.java
│   │   ├── ChatController.java
│   │   ├── NotificationController.java
│   │   ├── SystemNotificationController.java
│   │   ├── TrustController.java
│   │   ├── ReportController.java
│   │   └── AdminController.java
│   │
│   └── websocket/
│       └── BidWebSocketController.java
│
├── dto/                               # Request/Response DTOs — one per endpoint group
├── mapper/                            # Entity ↔ DTO (MapStruct)
├── exception/
│   ├── GlobalExceptionHandler.java    # returns { "error": "...", "status": N }
│   ├── NotFoundException.java         # → 404
│   ├── UnauthorizedException.java     # → 401
│   ├── ForbiddenException.java        # → 403
│   └── BusinessRuleException.java     # → 400
└── scheduler/
    ├── AuctionScheduler.java          # auto-open, auto-close, auto-extend lots
    ├── CartExpiryScheduler.java
    └── AnalyticsSnapshotJob.java      # @Scheduled(cron = "0 0 0 * * *")
```

### 3.4 Complete API Endpoint Reference

```
── AUTH ─────────────────────────────────────────────────────────────
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

── PROFILE (role-aware) ─────────────────────────────────────────────
GET    /api/profile
PUT    /api/profile
PUT    /api/profile/avatar
GET    /api/users/{id}/profile                   public view
GET    /api/users/{id}/trust-score               public
GET    /api/users/{id}/reviews                   ?type=PRODUCT|REPAIR
GET    /api/users/{id}/trust-score

── ADDRESSES ────────────────────────────────────────────────────────
GET    /api/addresses
POST   /api/addresses
PUT    /api/addresses/{id}
DELETE /api/addresses/{id}
PUT    /api/addresses/{id}/default

── CATEGORIES ───────────────────────────────────────────────────────
GET    /api/categories
GET    /api/categories/{id}

── PRODUCTS ─────────────────────────────────────────────────────────
GET    /api/products                             ?search=&category=&minPrice=&maxPrice=&page=
GET    /api/products/{id}
POST   /api/products                             [VENDOR]
PUT    /api/products/{id}                        [VENDOR, own]
DELETE /api/products/{id}                        [VENDOR, own — soft delete]
POST   /api/products/{id}/images
DELETE /api/products/{id}/images/{imgId}
POST   /api/products/{id}/variants
PUT    /api/products/{id}/variants/{vid}
DELETE /api/products/{id}/variants/{vid}
GET    /api/products/{id}/questions
POST   /api/products/{id}/questions              [auth]
PUT    /api/products/{id}/questions/{qid}/answer [VENDOR, own]

── INVENTORY ────────────────────────────────────────────────────────
GET    /api/inventory/{productId}
PUT    /api/inventory/{productId}                [VENDOR, own]
GET    /api/vendor/products                      [VENDOR — own products with stock]

── CART ─────────────────────────────────────────────────────────────
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/{id}
DELETE /api/cart/items/{id}
DELETE /api/cart

── COUPONS ──────────────────────────────────────────────────────────
POST   /api/coupons/validate
POST   /api/coupons                              [ADMIN]
GET    /api/coupons                              [ADMIN]
PUT    /api/coupons/{id}                         [ADMIN]

── ORDERS ───────────────────────────────────────────────────────────
POST   /api/orders                               checkout
GET    /api/orders
GET    /api/orders/{id}
PUT    /api/orders/{id}/cancel                   [CUSTOMER, own, before SHIPPED]
GET    /api/vendor/orders                        [VENDOR]
PUT    /api/vendor/orders/{id}/ship              [VENDOR — mark shipped + tracking]

── PAYMENTS (orders) ────────────────────────────────────────────────
POST   /api/payments/order/{orderId}
GET    /api/payments/order/{orderId}

── SHIPMENTS ────────────────────────────────────────────────────────
GET    /api/shipments/order/{orderId}
PUT    /api/shipments/{id}                       [VENDOR or ADMIN]
POST   /api/shipments/{id}/events               [VENDOR or ADMIN]

── WISHLISTS ────────────────────────────────────────────────────────
GET    /api/wishlist
POST   /api/wishlist/{productId}
DELETE /api/wishlist/{productId}

── USED LISTINGS ────────────────────────────────────────────────────
GET    /api/used-listings                        ?search=&category=&condition=&minPrice=&maxPrice=&page=
GET    /api/used-listings/{id}
POST   /api/used-listings                        [auth]
PUT    /api/used-listings/{id}                   [SELLER, own]
DELETE /api/used-listings/{id}                   [SELLER, own — soft delete]
POST   /api/used-listings/{id}/images
POST   /api/used-listings/{id}/videos
PUT    /api/used-listings/{id}/history
POST   /api/used-listings/{id}/repairs
GET    /api/used-listings/mine

── OFFERS (used items) ──────────────────────────────────────────────
POST   /api/used-listings/{id}/offers            [CUSTOMER]
GET    /api/used-listings/{id}/offers            [SELLER, own]
PUT    /api/offers/{id}/accept                   [SELLER, own]
PUT    /api/offers/{id}/reject                   [SELLER, own]
PUT    /api/offers/{id}/withdraw                 [BUYER, own]
GET    /api/offers/sent                          [BUYER — own sent offers]
POST   /api/offers/{id}/messages                 [offer thread messages]
GET    /api/offers/{id}/messages

── REPAIR ───────────────────────────────────────────────────────────
GET    /api/repair/requests/open                 [TECHNICIAN]
GET    /api/repair/requests/mine                 [CUSTOMER]
GET    /api/repair/requests/{id}
POST   /api/repair/requests                      [CUSTOMER]
POST   /api/repair/requests/{id}/media
PUT    /api/repair/requests/{id}/cancel
POST   /api/repair/requests/{id}/quotes          [TECHNICIAN]
GET    /api/repair/requests/{id}/quotes          [CUSTOMER, own]
PUT    /api/repair/quotes/{id}/accept            [CUSTOMER, own + {scheduled_date}]
PUT    /api/repair/quotes/{id}/reject            [CUSTOMER, own]
GET    /api/repair/bookings/mine
GET    /api/repair/bookings/{id}
PUT    /api/repair/bookings/{id}/complete        [TECHNICIAN, own]
PUT    /api/repair/bookings/{id}/cancel
POST   /api/repair/payments/{bookingId}
GET    /api/repair/payments/{bookingId}

── TECHNICIAN PROFILE ───────────────────────────────────────────────
GET    /api/technicians                          ?specialization=&level=
GET    /api/technicians/{id}                     public profile
PUT    /api/technician/profile                   [TECHNICIAN, own]
GET    /api/technician/availability
PUT    /api/technician/availability              [TECHNICIAN, own]
GET    /api/technician/earnings
GET    /api/technician/dashboard

── SERVICE LISTINGS ─────────────────────────────────────────────────
GET    /api/service-listings                     ?category=
GET    /api/service-listings/{id}
POST   /api/service-listings                     [TECHNICIAN]
PUT    /api/service-listings/{id}               [TECHNICIAN, own]
DELETE /api/service-listings/{id}               [TECHNICIAN, own]

── AUCTIONS ─────────────────────────────────────────────────────────
GET    /api/auctions                             ?status=&type=&category=&page=
GET    /api/auctions/{id}
POST   /api/auctions                             [VENDOR]
PUT    /api/auctions/{id}                        [VENDOR, own, CREATED status only]
DELETE /api/auctions/{id}                        [VENDOR, own, CREATED status only]
GET    /api/auction-lots/{id}
GET    /api/auction-lots/{id}/bids
POST   /api/auction-lots/{id}/images
POST   /api/auction-lots/{id}/bids               [auth — REST fallback]
GET    /api/watchlist
POST   /api/watchlist/{lotId}
DELETE /api/watchlist/{lotId}
GET    /api/vendor/auctions                      [VENDOR]
GET    /api/vendor/auctions/{id}/analytics       [VENDOR]
GET    /api/auctions/bidders/{userId}/reputation [VENDOR]
POST   /api/vendor/bidder-restrictions
DELETE /api/vendor/bidder-restrictions/{bidderId}
GET    /api/vendor/bidder-restrictions
POST   /api/auction-payments/{winnerId}
GET    /api/auction-payments/{winnerId}

── VENDOR PANEL ─────────────────────────────────────────────────────
GET    /api/vendor/dashboard
GET    /api/vendor/commissions
GET    /api/vendor/analytics/sales
GET    /api/vendor/profile
POST   /api/vendor/profile
PUT    /api/vendor/profile
GET    /api/vendor/profile/shop/{slug}           public shop page (no auth)

── REVIEWS ──────────────────────────────────────────────────────────
POST   /api/reviews
GET    /api/users/{id}/reviews                   ?type=PRODUCT|REPAIR

── RETURNS ──────────────────────────────────────────────────────────
POST   /api/returns
GET    /api/returns/mine
GET    /api/returns/{id}

── NOTIFICATIONS ────────────────────────────────────────────────────
GET    /api/notifications
PUT    /api/notifications/{id}/read
PUT    /api/notifications/read-all
DELETE /api/notifications/{id}
GET    /api/system-notifications                 active platform announcements (public)
POST   /api/notification-subscriptions
DELETE /api/notification-subscriptions/{id}

── CHAT ─────────────────────────────────────────────────────────────
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/{id}/messages
POST   /api/conversations/{id}/messages
PUT    /api/conversations/{id}/read

── TRUST ────────────────────────────────────────────────────────────
GET    /api/trust/score                          own score
GET    /api/trust/events                         own event history

── REPORTS ──────────────────────────────────────────────────────────
POST   /api/reports

── ADMIN — USER MANAGEMENT ──────────────────────────────────────────
GET    /api/admin/users                          ?role=&status=&search=&page=
GET    /api/admin/users/{id}
PUT    /api/admin/users/{id}/ban
PUT    /api/admin/users/{id}/unban
PUT    /api/admin/users/{id}/suspend
GET    /api/admin/users/{id}/trust-history
GET    /api/admin/users/{id}/audit-history

── ADMIN — VENDORS ──────────────────────────────────────────────────
GET    /api/admin/vendors
PUT    /api/admin/vendors/{id}/verify

── ADMIN — AUCTION GOVERNANCE ───────────────────────────────────────
GET    /api/admin/auctions                       ?status=&page=
GET    /api/admin/auctions/pending
PUT    /api/admin/auctions/{id}/approve
PUT    /api/admin/auctions/{id}/reject

── ADMIN — FRAUD & REPORTS ──────────────────────────────────────────
GET    /api/admin/fraud-flags                    ?status=&severity=&page=
GET    /api/admin/fraud-flags/{id}
PUT    /api/admin/fraud-flags/{id}/resolve
GET    /api/admin/reports                        ?status=&page=
GET    /api/admin/reports/{id}
PUT    /api/admin/reports/{id}/resolve
PUT    /api/admin/reports/{id}/dismiss

── ADMIN — RETURNS ──────────────────────────────────────────────────
GET    /api/admin/returns                        ?status=&page=
GET    /api/admin/returns/{id}
PUT    /api/admin/returns/{id}/approve
PUT    /api/admin/returns/{id}/reject

── ADMIN — PLATFORM SETTINGS ────────────────────────────────────────
GET    /api/admin/platform-settings
PUT    /api/admin/platform-settings/{key}

── ADMIN — AUDIT LOGS ───────────────────────────────────────────────
GET    /api/admin/audit-logs                     ?actor=&entityType=&from=&to=&page=

── ADMIN — SYSTEM NOTIFICATIONS ─────────────────────────────────────
GET    /api/admin/system-notifications
POST   /api/admin/system-notifications
PUT    /api/admin/system-notifications/{id}
DELETE /api/admin/system-notifications/{id}

── ADMIN — ANALYTICS ────────────────────────────────────────────────
GET    /api/admin/analytics/dashboard            live KPI summary (today)
GET    /api/admin/analytics/revenue              ?from=&to=&groupBy=day|week|month
GET    /api/admin/analytics/users                ?from=&to=&groupBy=day|week|month
GET    /api/admin/analytics/auctions             ?from=&to=
GET    /api/admin/analytics/fraud-trends         ?from=&to=
GET    /api/admin/analytics/repairs              ?from=&to=

── WEBSOCKET (STOMP) ────────────────────────────────────────────────
SUBSCRIBE /topic/lot/{lotId}                     → BidUpdate {currentBid, bidderId, timestamp}
SEND      /app/lot/{lotId}/bid                   → place bid (authenticated)
SUBSCRIBE /topic/lot/{lotId}/status              → lot status changes
SUBSCRIBE /user/queue/notifications              → personal: outbid, ending-soon alerts
```

### 3.5 Critical Business Logic

#### Order Checkout Flow — `OrderService.checkout` (10 steps)
1. Load cart items, validate all exist and are available
2. Validate coupon if provided (`CouponService.validate`)
3. Acquire pessimistic lock on inventory rows (`@Lock(LockModeType.PESSIMISTIC_WRITE)`)
4. Create `Order` with full price breakdown (subtotal + shipping + tax - discount = total)
5. Snapshot shipping address into `shipping_address_snapshot JSONB`
6. Create `OrderItem` rows
7. Decrement `inventory.stock_qty` for each product item
8. Create `VendorCommission` per order item
9. Log initial status to `order_status_log`
10. Notify relevant vendor(s), clear cart

#### Bid Validation — `BidService.placeBid` (9 steps)
1. Load lot — status must be `ACTIVE` or `EXTENDED`
2. Check bidder is not in `bidder_restrictions` for this vendor
3. Check bidder has `user_agreements` record for `AUCTION_RULES`
4. Validate: `amount_bdt >= current_bid_bdt + min_bid_increment_bdt`
5. Save bid, set `is_winning = TRUE`, flip all other bids for this lot to `FALSE`
6. Update `auction_lots.current_bid_bdt`
7. Auto-extension check: if `NOW() > lot.end_time - extension_duration_minutes` AND `extensions_count < max_extensions` → extend end time, increment `extensions_count`, set status `EXTENDED`
8. Broadcast to `/topic/lot/{lotId}` via STOMP
9. Notify previous winning bidder they've been outbid

#### AuctionScheduler — `@Scheduled`
- Every 30s: find `APPROVED` auctions where `start_time <= NOW()` → set `ACTIVE`, lots to `ACTIVE`
- Every 30s: find `ACTIVE` lots where `auction.end_time <= NOW()` and `extensions_count >= max_extensions` → set lot `CLOSED`, trigger `WinnerService`
- `WinnerService`: find highest bid → create `auction_winners` → check reserve price → mark `bids.is_winning = true` → set `payment_deadline` → notify winner → update `bidder_reputation`

#### Trust Score Events

| Event | Delta |
|---|---|
| ORDER_DELIVERED | +2.0 |
| ORDER_CANCELLED_BY_CUSTOMER | -1.0 |
| REPAIR_COMPLETED | +3.0 |
| REVIEW_5_STAR | +1.0 |
| REVIEW_1_STAR | -0.5 |
| FRAUD_FLAG_CONFIRMED | -10.0 |
| REPORT_CONFIRMED_AGAINST | -3.0 |
| AUCTION_PAYMENT_COMPLETED | +2.0 |
| AUCTION_PAYMENT_FAILED | -5.0 |
| ACCOUNT_VERIFIED | +5.0 |

Score is clamped to `[0, 100]`. Read all thresholds from `platform_settings`.
Trust score changes **must be `@Transactional` with the action that triggered them**.

**Low-trust enforcement** (score < `trust.low_score_threshold`):
- Block placing new bids
- Block creating new listings
- Surface warning on profile pages
- Auto-create `fraud_flags` entry with reason `"LOW_TRUST_THRESHOLD_REACHED"`

#### Technician Level Progression
After every booking marked `COMPLETED`: check total completed jobs against `platform_settings` thresholds. If threshold crossed: update `technicians.level`, insert `technician_level_history`, award `EXPERT_TECHNICIAN` badge.

#### Daily Analytics Snapshot Job
Runs at midnight UTC via `@Scheduled(cron = "0 0 0 * * *")`. Aggregates all KPIs for yesterday and inserts one row into `analytics_snapshots`. Admin charts read from snapshots — never aggregate in real time.

#### Audit Log Rule
Call `auditLogService.log(actorId, action, entityType, entityId, oldData, newData)` in service methods for:
- User ban / unban / suspend
- Vendor verification (approve/reject)
- Auction approve / reject
- Fraud flag resolve
- Report resolve / dismiss
- Return approve / reject
- Platform settings change
- Coupon create / deactivate

---

## PART 4 — MARKETPLACE FRONTEND (App 1)

### 4.1 Project Setup

```
Directory: atomdrops-marketplace/
Vite port: 5173
Domain:    atomdrops.com (prod) | localhost:5173 (dev)
```

### 4.2 Complete Page Map

```
PUBLIC (no auth)
  /                          Home — hero, featured products, active auctions, used picks
  /products                  Product listing + search + filter + pagination
  /products/:id              Product detail: images, variants, Q&A, reviews, add-to-cart
  /used-listings             Used items: filter by condition/category/price
  /used-listings/:id         Used item detail: history, warranty badge, make-offer button
  /auctions                  Auction browser — filter by status/type/category
  /auctions/:id              Auction session detail — all lots, countdown
  /auction-lots/:id          Live lot bidding room — real-time feed, place bid, countdown
  /technicians               Browse technicians — filter by specialization/level
  /technicians/:id           Public technician profile, skills, service listings, reviews
  /shop/:slug                Public vendor shop (vendor info + their active products)
  /auth/login
  /auth/register             Role selection: Customer | Vendor | Technician
  /auth/forgot-password
  /auth/reset-password

SHARED (authenticated)
  /profile                   Edit own profile (role-aware form)
  /addresses                 Manage shipping addresses
  /messages                  Conversations list
  /messages/:id              Chat thread
  /notifications             Notifications list
  /settings                  Account settings, password change

CUSTOMER
  /dashboard                 Overview: recent orders, bids, watchlist, trust score
  /wishlist
  /cart                      Items, coupon input, order summary
  /checkout                  Address select, shipping, payment
  /orders                    Order history
  /orders/:id                Order detail: status timeline, shipment tracking
  /repair                    Browse service listings + submit request
  /repair/requests           My repair requests
  /repair/requests/:id       Request detail: quotes, accept/reject, booking status, review form
  /offers/sent               My sent offers on used items
  /my-listings               My used item listings
  /my-listings/new           Create used listing
  /my-listings/:id/edit

VENDOR
  /vendor/dashboard          Revenue chart, top products, recent orders, commissions
  /vendor/profile            Edit shop info, logo, banner, social links
  /vendor/products           Product list: status, stock indicators
  /vendor/products/new
  /vendor/products/:id/edit  Edit product + variants + inventory
  /vendor/orders             All orders on my products
  /vendor/orders/:id         Order detail with shipment update controls
  /vendor/auctions           My auction sessions
  /vendor/auctions/new       Create auction + lots wizard
  /vendor/auctions/:id       Auction management: lots, bids, restrict bidders
  /vendor/commissions        Payout history
  /vendor/reviews            My product reviews

TECHNICIAN
  /technician/dashboard      Bookings, earnings, rating, completion rate
  /technician/profile        Edit specialization, bio, skills, availability schedule
  /technician/requests       Browse open repair requests
  /technician/bookings       Confirmed bookings
  /technician/bookings/:id   Booking detail, mark complete, payment status
  /technician/services       Service listings CRUD
  /technician/earnings       Earnings history
```

### 4.3 Frontend Directory Structure

```
src/
├── api/
│   ├── apiClient.ts           axios, withCredentials:true, base URL from env
│   ├── authApi.ts
│   ├── productApi.ts
│   ├── cartApi.ts
│   ├── orderApi.ts
│   ├── couponApi.ts
│   ├── usedListingApi.ts
│   ├── offerApi.ts
│   ├── repairApi.ts
│   ├── technicianApi.ts
│   ├── auctionApi.ts
│   ├── chatApi.ts
│   ├── notificationApi.ts
│   ├── reviewApi.ts
│   └── wsClient.ts            STOMP singleton
│
├── context/
│   ├── AuthContext.tsx         user, roles, isAuthenticated, hasRole()
│   └── CartContext.tsx         cartCount for Navbar badge
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx           role-aware links, cart badge, notification bell
│   │   ├── Footer.tsx
│   │   ├── CustomerSidebar.tsx
│   │   ├── VendorSidebar.tsx
│   │   └── TechnicianSidebar.tsx
│   │
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx / Select.tsx / Textarea.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   ├── ConfirmDialog.tsx    for destructive actions
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Pagination.tsx
│   │   └── Tabs.tsx
│   │
│   ├── profile/
│   │   ├── CustomerProfileForm.tsx
│   │   ├── VendorProfileForm.tsx
│   │   ├── TechnicianProfileForm.tsx
│   │   ├── AvatarUpload.tsx
│   │   └── TrustScoreWidget.tsx
│   │
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductImageGallery.tsx
│   │   └── ProductQA.tsx
│   │
│   ├── used/
│   │   ├── UsedListingCard.tsx
│   │   ├── ConditionBadge.tsx
│   │   ├── WarrantyBadge.tsx
│   │   ├── ItemHistoryBlock.tsx
│   │   └── MakeOfferModal.tsx
│   │
│   ├── repair/
│   │   ├── RepairRequestCard.tsx
│   │   ├── QuoteCard.tsx
│   │   ├── TechnicianCard.tsx
│   │   ├── BookingTimeline.tsx
│   │   └── AvailabilityEditor.tsx
│   │
│   ├── auction/
│   │   ├── AuctionCard.tsx
│   │   ├── LotCard.tsx
│   │   ├── Countdown.tsx          live d:h:m:s timer, color-coded by urgency
│   │   ├── BidForm.tsx
│   │   ├── BidHistory.tsx
│   │   ├── LiveBidFeed.tsx        STOMP-powered scrolling bid feed
│   │   └── AuctionStatusBadge.tsx
│   │
│   └── order/
│       ├── OrderCard.tsx
│       ├── OrderStatusTimeline.tsx
│       └── ShipmentTracker.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useLiveBid.ts              STOMP subscription hook for a lot
│   ├── useCountdown.ts
│   ├── useNotifications.ts
│   └── useDebounce.ts
│
├── routes/
│   ├── ProtectedRoute.tsx         redirect to /auth/login if not authed
│   └── RoleRoute.tsx              show 403 if wrong role
│
├── pages/                         one .tsx per route
└── types/
    └── index.ts                   TypeScript interfaces for all DTOs
```

### 4.4 Key Component Specifications

#### `TrustScoreWidget`
```tsx
// score >= 80 → green badge "Trusted"
// score 30–79 → amber badge "Fair"
// score < 30  → red badge "Low Trust"
// Displays as: colored pill with score number
```

#### `Countdown`
```tsx
// Props: endTime: string (ISO date)
// Calculates d / h / m / s remaining, updates every second
// Color: green > 1h remaining | amber < 1h | red < 5 min
// On expiry: shows "Auction Closed"
```

#### `ConditionBadge`
```tsx
// 'Like New' → green | 'Good' → blue | 'Fair' → amber | 'Needs Repair' → red
```

#### `WarrantyBadge`
```tsx
// YES → green shield icon + "Warranty Included"
// NO  → red shield icon + "No Warranty"
```

#### `LiveBidFeed`
```tsx
// Connects to STOMP /topic/lot/{lotId}
// Displays: current bid, bid count, last bidder
// Input: amount (validated > current + min_increment)
// On OUTBID event → toast notification + highlight
// Shows last 10 bids in a scrolling list
```

### 4.5 Profile Editing — Role-Specific Fields

| Role | Fields |
|---|---|
| CUSTOMER | display_name, phone, avatar_url, bio, location, date_of_birth, gender |
| VENDOR | All customer fields + shop_name, shop_slug, bio, location, logo_url, banner_url, website_url, social_links (instagram, facebook, tiktok, youtube) |
| TECHNICIAN | All customer fields + bio, specialization (select), service_area, pickup_available (toggle), website_url, social_links, skills (tag input), weekly availability editor (day × time-range grid) |

---

## PART 5 — ADMIN PANEL FRONTEND (App 2)

### 5.1 Project Setup

```
Directory: atomdrops-admin/
Vite port: 5174
Domain:    admin.atomdrops.com (prod) | localhost:5174 (dev)
Auth:      Same Spring Boot API — session cookie shared via CORS
Access:    Only ADMIN role users. Show "Access denied" for all others.
```

### 5.2 Complete Admin Page Map

```
/login                   Admin login — ADMIN role required
/dashboard               Platform KPI summary
/users                   User management table
/users/:id               Full profile, trust history, ban history, audit trail
/vendors                 Vendor list with verification status
/vendors/:id             Vendor detail with approve/reject controls
/auctions                All auctions with status filter
/auctions/pending        Approval queue
/auctions/:id            Auction detail with approve/reject controls
/fraud-flags             Fraud flags — filter by status/severity
/fraud-flags/:id         Flag detail with resolution form
/reports                 User reports list
/reports/:id             Report detail with resolve/dismiss
/returns                 Return requests
/returns/:id             Return detail — approve (+ refund amount) / reject
/analytics               Analytics hub — tab-based
/analytics/revenue       Revenue chart over time
/analytics/users         User growth chart
/analytics/auctions      Auction performance
/analytics/fraud         Fraud trends
/analytics/repairs       Repair service metrics
/platform-settings       Live key/value settings editor
/system-notifications    Platform announcement manager
/audit-logs              Filterable audit log viewer with JSONB diff modal
```

### 5.3 Admin Dashboard — KPI Widget Layout

**Row 1 — Today's Pulse (4 stat cards)**
- Total Revenue Today (BDT)
- New Users Today
- Orders Today
- Active Auctions Right Now

**Row 2 — Health Indicators (4 stat cards)**
- Open Fraud Flags
- Pending Auction Approvals
- Open Returns
- Users with Trust Score < 30

**Row 3 — 30-Day Charts (2 charts side by side)**
- Revenue over 30 days (line chart from `analytics_snapshots`)
- New users over 30 days (line chart)

**Row 4 — Tables (2 side by side)**
- Recently Banned Users (last 10)
- Pending Auction Approvals (next 5)

### 5.4 Platform Settings Editor Rules

- Table: key, value, data_type, description, last updated by, last updated at
- Each row has an inline "Edit" button → opens inline input
- Boolean → toggle switch; Decimal/Integer → number input with validation; JSON → textarea
- Save calls `PUT /api/admin/platform-settings/{key}` → success toast + reload
- Settings cached in-memory for 5 minutes (`@Cacheable`); admin save invalidates the cache

### 5.5 Audit Log Viewer — Required Filters

- Actor (search by user email or ID)
- Entity type (dropdown: users, products, auctions, etc.)
- Entity ID (text input)
- Date range (from/to date pickers)
- Action type (dropdown of known action strings)

Results in paginated `DataTable`. "View detail" action → modal showing `old_data` / `new_data` JSONB side-by-side with syntax highlighting.

---

## PART 6 — STATUS FLOW DIAGRAMS

### Order Status
```
PLACED → PAID → PROCESSING → SHIPPED → DELIVERED
        ↘ CANCELLED (before SHIPPED)
DELIVERED → RETURNED (if return approved)
```

### Auction Status
```
CREATED → [admin] → APPROVED → PREPARING → ACTIVE → CLOSED → COMPLETED
                  ↘ REJECTED
ACTIVE → EXTENDED → CLOSED (auto-extension triggered)
```

### Auction Lot Status
```
PREPARING → ACTIVE → CLOSED
ACTIVE → EXTENDED → CLOSED
```

### Repair Request Status
```
OPEN → QUOTED → BOOKED → COMPLETED
     ↘ CANCELLED (from any state except COMPLETED)
```

### Used Listing Offer Status
```
PENDING → ACCEPTED → (purchase flow)
        ↘ REJECTED
        ↘ WITHDRAWN (by buyer)
        ↘ EXPIRED (after expires_at)
```

---

## PART 7 — DESIGN SYSTEM

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary | `#6366F1` indigo-500 | Buttons, links, active states |
| Secondary | `#8B5CF6` violet-500 | Accents |
| Success | `#10B981` emerald-500 | Trust HIGH, Like New, Warranty YES |
| Warning | `#F59E0B` amber-500 | Trust MEDIUM, Fair condition |
| Danger | `#EF4444` red-500 | Trust LOW, Needs Repair, Closed |
| Info | `#3B82F6` blue-500 | PREPARING state, info toasts |
| Background | `#F9FAFB` gray-50 | Page background |
| Surface | `#FFFFFF` | Cards |
| Border | `#E5E7EB` gray-200 | Card/input borders |
| Text Primary | `#111827` gray-900 | Body text |
| Text Secondary | `#6B7280` gray-500 | Captions |

### Typography
- Font: Inter (Google Fonts)
- Headings: `font-weight: 700`
- Body: `font-weight: 400`, 16px, `line-height: 1.6`

### Component Style Tokens
```
Cards:           bg-white rounded-2xl shadow-sm border border-gray-100 p-6
Primary buttons: bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-2.5 font-medium
Inputs:          border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500
Badges:          text-xs font-medium px-2.5 py-0.5 rounded-full
Page max-width:  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### Layout Rules
- Navbar: sticky top, height 64px, logo left + nav center + user menu right
- Footer: full-width, dark background, 4-column links
- Sidebar dashboards: 240px fixed left sidebar + main content area
- Mobile: hamburger menu, single-column layouts, bottom nav for key actions

---

## PART 8 — BUILD PHASES (Ordered — Do Not Skip)

### Phase 1 — Foundation
- [ ] Run full schema v5.0 on Supabase
- [ ] `SecurityConfig`, `AuthController`, session auth
- [ ] `CategoryController`, `ProductController` (public read-only)
- [ ] Marketplace App: Vite setup, `AuthContext`, `apiClient`
- [ ] Marketplace: `/auth/login`, `/auth/register`, `/products`, `/products/:id`
- **✓ Done when:** User can register, log in, browse products, log out

### Phase 2 — Vendor & Products
- [ ] Full product CRUD with ownership checks + soft delete
- [ ] `InventoryController`, variants, `VendorProfileController`
- [ ] Marketplace: `/vendor/dashboard`, `/vendor/profile`, `/vendor/products`
- **✓ Done when:** Vendor can create, edit, delete products and manage stock

### Phase 3 — Shopping
- [ ] `CartController`, `OrderController`, `PaymentController` (dummy gateway), `CouponController`, `WishlistController`, `ShipmentController`
- [ ] Trust events on order delivery
- [ ] Marketplace: `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/wishlist`
- **✓ Done when:** Customer can place, pay for, and track an order

### Phase 4 — Profiles & Addresses
- [ ] `ProfileController` (role-aware GET/PUT), `AddressController`
- [ ] Marketplace: `/profile` page, `/addresses` page
- **✓ Done when:** All three role types have fully editable profiles

### Phase 5 — Used Items & Offers
- [ ] `UsedListingController`, `OfferController`
- [ ] Marketplace: `/used-listings`, `/used-listings/:id`, `/my-listings`, `MakeOfferModal`, `/offers/sent`
- **✓ Done when:** Sellers can list used items; buyers can browse and make offers

### Phase 6 — Repair Marketplace
- [ ] `RepairController`, `TechnicianController`, `ServiceListingController`, `TechnicianAvailabilityController`, repair payments, earnings, level progression
- [ ] Marketplace: all `/repair/**` customer pages + all `/technician/**` pages
- **✓ Done when:** Full repair lifecycle works end-to-end with payment

### Phase 7 — Auction System
- [ ] `AuctionController`, `BidController`, `BidWebSocketController`, `WatchlistController`, `AuctionPaymentController`
- [ ] Bid validation + auto-extension + STOMP broadcast
- [ ] `AuctionScheduler` (auto-open, auto-close, winner service)
- [ ] Marketplace: `/auctions`, `/auctions/:id`, `/auction-lots/:id`, vendor auction management
- **✓ Done when:** Vendors create auctions, customers bid in real-time, winners are recorded

### Phase 8 — Admin Panel
- [ ] Admin Panel Vite app setup (port 5174)
- [ ] All `/api/admin/**` endpoints + `AnalyticsService` + `AnalyticsSnapshotJob`
- [ ] `AuditLogService` wired to all significant actions
- [ ] `SystemNotificationController`
- [ ] All admin pages from Part 5.2
- **✓ Done when:** Admin can govern every aspect of the platform from the separate panel

### Phase 9 — Trust, Fraud & Reports
- [ ] `TrustService` wired to all event triggers across all services
- [ ] `FraudService` auto-flagging on suspicious patterns
- [ ] `ReportController`
- [ ] `TrustScoreWidget` on all profiles
- **✓ Done when:** Trust scores update automatically on every relevant action

### Phase 10 — Chat & Notifications
- [ ] `ChatController`, `NotificationController`
- [ ] Marketplace: `/messages`, `/messages/:id`, `/notifications`
- [ ] Notification bell in Navbar with unread count badge
- **✓ Done when:** Real-time messaging and notification system works

### Phase 11 — Reviews & Returns
- [ ] `ReviewController` with `order_item_id` verified-purchase enforcement
- [ ] `ReturnController`
- [ ] Marketplace: review submission after delivery and repair completion
- **✓ Done when:** Customers can leave verified reviews and submit returns

---

## PART 9 — CODING RULES (NON-NEGOTIABLE)

These apply to every file generated. Follow them without exception.

### General Rules
1. **Never write stub/placeholder/TODO code.** Every method must be fully implemented.
2. All monetary values: `DECIMAL(12,2)` in DB · `BigDecimal` in Java · `৳X,XXX.XX` in UI via `toLocaleString('en-BD', { minimumFractionDigits: 2 })`.
3. All timestamps: UTC in DB · `Instant` in Java · converted to local time for display in React.
4. Consistent error JSON: `{ "error": "Human-readable message", "status": 400 }`.
5. Pagination envelope: `{ "content": [...], "totalElements": N, "totalPages": N, "page": N, "size": N }`.

### Backend Rules
6. `@Transactional` on every service method that writes to more than one table.
7. Inventory decrement MUST use `@Lock(LockModeType.PESSIMISTIC_WRITE)` to prevent overselling.
8. **Never expose `password_hash`, `deleted_at`, or internal IDs in response DTOs** beyond what the client needs.
9. Every PUT/DELETE on user-owned resources must verify `entity.ownerId == session.userId`. Throw `ForbiddenException` (→ 403) on mismatch.
10. Admin actions must write to `audit_logs` for: ban, approve/reject, resolve, settings changes.
11. Use `@SQLRestriction("deleted_at IS NULL")` on `User`, `Product`, `UsedListing` entities.
12. CORS: `allowCredentials = true` + explicit `allowedOrigins` list. **Never use `*` with credentials.**
13. Platform settings are read-through: `@Cacheable` with 5-minute TTL. Admin writes invalidate cache.
14. Trust score updates are `@Transactional` with the action that triggered them.
15. Bids are **append-only** — never UPDATE or DELETE a `bids` row.
16. There can only be **one booking per repair request** — handle `ConstraintViolationException` from `UNIQUE(request_id)` with a clean `409` response.

### Frontend Rules
17. Every data-loading page handles 3 states: loading skeleton → error with retry → success.
18. Every form shows inline Zod validation errors AND server error toasts.
19. Destructive actions (delete, ban, cancel, reject): always show `ConfirmDialog` before proceeding.
20. `<ProtectedRoute>` redirects to `/auth/login` if not authenticated.
21. `<RoleRoute roles={['VENDOR']}>` shows 403 page if user lacks the required role.
22. **Never use `localStorage` or `sessionStorage` for auth or session data — cookies only.**
23. Buttons triggering async actions: `disabled={isLoading}` + spinner during request.
24. All images need `alt` text. Use `object-cover` CSS. Show placeholder SVG when `null`.
25. **Mobile-first**: all pages must be fully usable at 375px viewport width.

### Admin Panel Specific Rules
26. Admin panel only renders if `user.roles.includes('ADMIN')` — full-page guard on every route.
27. Every admin action (ban, approve, reject, resolve) must show the affected entity's name/ID in the `ConfirmDialog`.
28. `DataTable` must support: column sorting, per-page size selector (10/25/50), page navigation.
29. Audit log `JsonViewer` must show `old_data` and `new_data` JSONB side-by-side with syntax highlighting (use `react-json-view` or equivalent).
30. Analytics charts must include a date range picker with presets: Today, 7 days, 30 days, 90 days, Custom.

---

## PART 10 — QUICK REFERENCE

### API Summary

| Area | Approximate Count |
|---|---|
| Auth & Profile | 10 |
| Products, Cart, Orders | 32 |
| Used Items & Offers | 14 |
| Repair Service | 18 |
| Auctions | 16 |
| Admin | 35+ |
| Chat & Notifications | 12 |
| **Total** | **~137** |

### Frontend Summary

| App | Routes | Key Components |
|---|---|---|
| Marketplace | 45+ | 35+ shared components |
| Admin Panel | 18 | 20+ admin-specific components |

### Starting a New AI Session

Always begin with:

> "I am building AtomDrops, a smart multi-vendor marketplace SaaS. The complete specification is
> below. Read it in full before generating any code. Then build: [specific task]."
>
> [paste this entire document]

**Example well-formed task prompts:**

- *Schema:* "Run the Part 2 SQL schema on Supabase. Then generate all 71 Spring Boot JPA entity classes in `com.atomdrops.model` following the rules in Part 9."
- *Backend service:* "Build `BidService.placeBid()` with the full 9-step bid validation logic from Part 3.5. Include `@Transactional`, STOMP broadcast, and the auto-extension trigger."
- *Backend controller:* "Build `AdminController` with all admin endpoints from Part 3.4. Each destructive endpoint must write to `audit_logs`."
- *Frontend page:* "Build the `/auction-lots/:id` page from Part 4.2. Include the STOMP live bid feed via `useLiveBid`, the `Countdown` component, and the `BidForm` with amount validation."
- *Admin page:* "Build the `/analytics` admin page from Part 5.2 with all 5 sub-tabs using recharts and a date range picker with presets."
- *Profile:* "Build the `/profile` page from Part 4.2. Detect the user's role from `AuthContext` and render role-specific fields as described in Part 4.5."

---

*AtomDrops Definitive Master Build Prompt — Version 5.0*
*71 tables · ~137 API endpoints · 63+ frontend pages · 2 frontend apps*
*Spring Boot 3 · React 19 · PostgreSQL (Supabase) · Enterprise admin panel architecturally separated*
