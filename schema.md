# AtomDrops Database Schema

**Platform:** PostgreSQL 15 (Supabase)  
**Tables:** 71  
**Version:** 5.0

---

## 1. Roles & Users

### `roles`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE |

**Seed data:** `ADMIN`, `VENDOR`, `CUSTOMER`, `TECHNICIAN`

---

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `email` | VARCHAR(191) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `display_name` | VARCHAR(120) | NOT NULL |
| `phone` | VARCHAR(30) | |
| `avatar_url` | TEXT | |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'`, CHECK: `ACTIVE`/`SUSPENDED`/`BANNED` |
| `deleted_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `email`, `status` (WHERE deleted IS NULL), `deleted_at` (WHERE NOT NULL)  
**Trigger:** `updated_at`

---

### `user_roles`
| Column | Type | Constraints |
|---|---|---|
| `user_id` | BIGINT | PK, FK → `users(id)` CASCADE |
| `role_id` | BIGINT | PK, FK → `roles(id)` CASCADE |

---

### `user_badges`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `badge_type` | VARCHAR(50) | NOT NULL, CHECK: `VERIFIED_SELLER`/`TOP_RESELLER`/`EXPERT_TECHNICIAN`/`TRUSTED_BIDDER` |
| `awarded_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `expires_at` | TIMESTAMP | |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| UNIQUE | (`user_id`, `badge_type`) | |

**Index:** `user_id` WHERE `is_active = TRUE`

---

### `ban_history`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `action` | VARCHAR(20) | NOT NULL, CHECK: `BANNED`/`SUSPENDED`/`UNBANNED`/`REINSTATED` |
| `reason` | TEXT | NOT NULL |
| `admin_id` | BIGINT | FK → `users(id)` SET NULL |
| `expires_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`user_id`, `created_at DESC`)

---

### `customer_profiles`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, UNIQUE, FK → `users(id)` CASCADE |
| `bio` | TEXT | |
| `location` | VARCHAR(120) | |
| `website_url` | TEXT | |
| `date_of_birth` | DATE | |
| `gender` | VARCHAR(20) | CHECK: `MALE`/`FEMALE`/`OTHER`/`PREFER_NOT_TO_SAY` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `addresses`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `label` | VARCHAR(60) | NOT NULL, DEFAULT `'Home'` |
| `full_name` | VARCHAR(120) | NOT NULL |
| `phone` | VARCHAR(30) | NOT NULL |
| `address_line` | TEXT | NOT NULL |
| `city` | VARCHAR(100) | NOT NULL |
| `area` | VARCHAR(100) | |
| `postal_code` | VARCHAR(20) | |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `user_id`  
**Trigger:** `updated_at`

---

### `password_reset_tokens`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `token` | VARCHAR(255) | NOT NULL, UNIQUE |
| `expires_at` | TIMESTAMP | NOT NULL |
| `used` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `token`

---

### `user_agreements`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `agreement_type` | VARCHAR(50) | NOT NULL, CHECK: `TERMS`/`PRIVACY`/`AUCTION_RULES` |
| `accepted_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `ip_address` | VARCHAR(45) | |
| UNIQUE | (`user_id`, `agreement_type`) | |

**Index:** `user_id`

---

## 2. Audit & Role Upgrades

### `audit_logs`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `actor_id` | BIGINT | FK → `users(id)` SET NULL |
| `action` | VARCHAR(60) | NOT NULL |
| `entity_type` | VARCHAR(60) | NOT NULL |
| `entity_id` | BIGINT | |
| `old_data` | JSONB | |
| `new_data` | JSONB | |
| `ip_address` | VARCHAR(45) | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `actor_id`, (`entity_type`, `entity_id`), `created_at DESC`

---

### `role_upgrades`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `role` | VARCHAR(20) | NOT NULL, CHECK: `VENDOR`/`TECHNICIAN` |
| `amount_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `99.00` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING_PAYMENT'`, CHECK: `PENDING_PAYMENT`/`PAID`/`ACTIVE`/`FAILED`/`CANCELLED` |
| `activated_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`user_id`, `role`) | |

**Index:** (`user_id`, `status`)  
**Trigger:** `updated_at`

---

### `upgrade_payments`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `upgrade_id` | BIGINT | NOT NULL, FK → `role_upgrades(id)` CASCADE |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `amount_bdt` | DECIMAL(12,2) | NOT NULL |
| `currency` | VARCHAR(10) | NOT NULL, DEFAULT `'BDT'` |
| `method` | VARCHAR(20) | NOT NULL, CHECK: `BKASH`/`NAGAD`/`CARD` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'INITIATED'`, CHECK: `INITIATED`/`SUCCESS`/`FAILED` |
| `provider_ref` | VARCHAR(100) | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`user_id`, `created_at DESC`), (`upgrade_id`, `created_at DESC`)  
**Trigger:** `updated_at`

---

## 3. Platform & System

### `platform_settings`
| Column | Type | Constraints |
|---|---|---|
| `key` | VARCHAR(100) | PK |
| `value` | TEXT | NOT NULL |
| `data_type` | VARCHAR(20) | NOT NULL, DEFAULT `'STRING'`, CHECK: `STRING`/`INTEGER`/`DECIMAL`/`BOOLEAN`/`JSON` |
| `description` | TEXT | |
| `updated_by` | BIGINT | FK → `users(id)` SET NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

**Seed keys:** `vendor.commission_rate`, `technician.commission_rate`, `trust.initial_score`, `trust.low_score_threshold`, `trust.high_score_threshold`, `trust.ban_threshold`, `trust.suspension_threshold`, `technician.verified_threshold`, `technician.expert_threshold`, `auction.default_bid_increment`, `auction.extension_minutes`, `auction.max_extensions`, `auction.payment_deadline_hours`, `auction.nonpayment_ban_count`, `cart.expiry_hours`, `coupon.max_uses_default`, `offer.default_expiry_hours`, `shipping.default_fee_bdt`

---

### `analytics_snapshots`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `snapshot_date` | DATE | NOT NULL, UNIQUE |
| `new_users_count` | INT | NOT NULL, DEFAULT `0` |
| `active_users_count` | INT | NOT NULL, DEFAULT `0` |
| `new_orders_count` | INT | NOT NULL, DEFAULT `0` |
| `gross_revenue_bdt` | DECIMAL(14,2) | NOT NULL, DEFAULT `0.00` |
| `platform_fees_bdt` | DECIMAL(14,2) | NOT NULL, DEFAULT `0.00` |
| `new_used_listings` | INT | NOT NULL, DEFAULT `0` |
| `new_repair_requests` | INT | NOT NULL, DEFAULT `0` |
| `completed_repairs` | INT | NOT NULL, DEFAULT `0` |
| `new_auctions_count` | INT | NOT NULL, DEFAULT `0` |
| `auction_revenue_bdt` | DECIMAL(14,2) | NOT NULL, DEFAULT `0.00` |
| `fraud_flags_raised` | INT | NOT NULL, DEFAULT `0` |
| `fraud_flags_resolved` | INT | NOT NULL, DEFAULT `0` |
| `new_reports_count` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `snapshot_date DESC`

---

### `system_notifications`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `title` | VARCHAR(200) | NOT NULL |
| `body` | TEXT | NOT NULL |
| `type` | VARCHAR(30) | NOT NULL, DEFAULT `'INFO'`, CHECK: `INFO`/`WARNING`/`MAINTENANCE`/`POLICY_UPDATE` |
| `target_roles` | VARCHAR(100) | |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `starts_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `ends_at` | TIMESTAMP | |
| `created_by` | BIGINT | FK → `users(id)` SET NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`is_active`, `starts_at`) WHERE `is_active = TRUE`  
**Trigger:** `updated_at`

---

## 4. Vendors & Shops

### `vendor_profiles`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, UNIQUE, FK → `users(id)` CASCADE |
| `shop_name` | VARCHAR(180) | NOT NULL |
| `shop_slug` | VARCHAR(180) | NOT NULL, UNIQUE |
| `logo_url` | TEXT | |
| `banner_url` | TEXT | |
| `bio` | TEXT | |
| `location` | VARCHAR(120) | |
| `website_url` | TEXT | |
| `social_links` | JSONB | |
| `verification_status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`VERIFIED`/`REJECTED` |
| `response_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `shop_slug`  
**Trigger:** `updated_at`

---

### `categories`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `name` | VARCHAR(120) | NOT NULL |
| `slug` | VARCHAR(120) | NOT NULL, UNIQUE |
| `parent_id` | BIGINT | FK → `categories(id)` SET NULL |
| `icon_url` | TEXT | |
| `sort_order` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`name`, `parent_id`) | |

**Index:** `parent_id`  
**Trigger:** `updated_at`

**Seed categories:** Electronics, Appliances, Audio & Video, Computers, Furniture, Vehicles, Clothing, Books, Sports, Miscellaneous

---

### `shops`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `vendor_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `name` | VARCHAR(180) | NOT NULL, UNIQUE |
| `slug` | VARCHAR(180) | NOT NULL, UNIQUE |
| `logo_url` | TEXT | |
| `banner_url` | TEXT | |
| `description` | TEXT | |
| `primary_category_id` | BIGINT | FK → `categories(id)` SET NULL |
| `location` | VARCHAR(180) | |
| `policies` | TEXT | |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'`, CHECK: `ACTIVE`/`PAUSED`/`ARCHIVED` |
| `verification_level` | VARCHAR(20) | NOT NULL, DEFAULT `'STANDARD'`, CHECK: `STANDARD`/`VERIFIED`/`PREMIUM`/`TRUSTED` |
| `response_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `vendor_id`, `slug`  
**Trigger:** `updated_at`

---

### `shop_followers`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `shop_id` | BIGINT | NOT NULL, FK → `shops(id)` CASCADE |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`shop_id`, `user_id`) | |

**Indexes:** `shop_id`, `user_id`

---

### `shop_staff`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `shop_id` | BIGINT | NOT NULL, FK → `shops(id)` CASCADE |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `role` | VARCHAR(20) | NOT NULL, CHECK: `OWNER`/`MANAGER`/`INVENTORY`/`SUPPORT` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`shop_id`, `user_id`) | |

**Indexes:** `shop_id`, `user_id`  
**Trigger:** `updated_at`

---

## 5. Subscriptions

### `vendor_subscription_plans`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE |
| `display_name` | VARCHAR(100) | NOT NULL |
| `max_shops` | INT | NOT NULL (`-1` = unlimited) |
| `price_monthly_bdt` | DECIMAL(12,2) | NOT NULL |
| `price_yearly_bdt` | DECIMAL(12,2) | NOT NULL |
| `discount_percent` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `features` | TEXT | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Seed plans:** BASIC (free, 1 shop), BUILDER (499/mo, 2), PRO (999/mo, 4), BUSINESS (1999/mo, 7), ENTERPRISE (4999/mo, unlimited)

---

### `vendor_subscriptions`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `vendor_id` | BIGINT | NOT NULL, UNIQUE, FK → `users(id)` CASCADE |
| `plan_id` | BIGINT | NOT NULL, FK → `vendor_subscription_plans(id)` RESTRICT |
| `billing_cycle` | VARCHAR(10) | NOT NULL, CHECK: `MONTHLY`/`YEARLY`/`FREE` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'`, CHECK: `ACTIVE`/`PAUSED`/`GRACE_PERIOD`/`EXPIRED` |
| `starts_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `expires_at` | TIMESTAMP | |
| `grace_period_ends` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `vendor_id`  
**Trigger:** `updated_at`

---

### `vendor_subscription_deals`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `title` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | |
| `deal_type` | VARCHAR(50) | NOT NULL, CHECK: `FREE_TRIAL`/`DISCOUNT`/`FREE_MONTHS` |
| `value` | DECIMAL(12,2) | NOT NULL |
| `plan_id` | BIGINT | FK → `vendor_subscription_plans(id)` CASCADE |
| `starts_at` | TIMESTAMP | NOT NULL |
| `ends_at` | TIMESTAMP | NOT NULL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

## 6. Used Items Marketplace

### `condition_levels`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `label` | VARCHAR(50) | NOT NULL, UNIQUE |
| `sort_order` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Seed:** Like New, Good, Fair, Needs Repair

---

### `used_listings`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `seller_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `category_id` | BIGINT | NOT NULL, FK → `categories(id)` RESTRICT |
| `condition_id` | BIGINT | NOT NULL, FK → `condition_levels(id)` RESTRICT |
| `title` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | |
| `price_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `warranty_flag` | VARCHAR(3) | NOT NULL, DEFAULT `'NO'`, CHECK: `YES`/`NO` |
| `offers_enabled` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'`, CHECK: `ACTIVE`/`SOLD`/`REMOVED` |
| `deleted_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `search_vector` | TSVECTOR | GENERATED ALWAYS AS `to_tsvector('english', title || ' ' || description)` STORED |

**Indexes:** (`seller_id`, `status`) WHERE deleted IS NULL, (`category_id`, `status`) WHERE deleted IS NULL, `price_bdt` WHERE deleted IS NULL, GIN `search_vector`  
**Trigger:** `updated_at`

---

### `used_images`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `listing_id` | BIGINT | NOT NULL, FK → `used_listings(id)` CASCADE |
| `image_url` | TEXT | NOT NULL |
| `sort_order` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`listing_id`, `sort_order`)

---

### `used_videos`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `listing_id` | BIGINT | NOT NULL, FK → `used_listings(id)` CASCADE |
| `video_url` | TEXT | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `listing_id`

---

### `used_item_history`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `listing_id` | BIGINT | NOT NULL, UNIQUE, FK → `used_listings(id)` CASCADE |
| `owner_count` | INT | NOT NULL, DEFAULT `1`, CHECK: `>= 1` |
| `usage_duration_months` | INT | CHECK: `>= 0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `used_item_repairs`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `listing_id` | BIGINT | NOT NULL, FK → `used_listings(id)` CASCADE |
| `details` | TEXT | NOT NULL |
| `repaired_at` | DATE | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `listing_id`

---

### `used_listing_offers`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `listing_id` | BIGINT | NOT NULL, FK → `used_listings(id)` CASCADE |
| `buyer_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `offer_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `> 0` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`ACCEPTED`/`REJECTED`/`EXPIRED`/`WITHDRAWN` |
| `expires_at` | TIMESTAMP | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`listing_id`, `buyer_id`) | |

**Indexes:** (`listing_id`, `status`), `buyer_id`  
**Trigger:** `updated_at`

---

### `used_listing_offer_messages`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `offer_id` | BIGINT | NOT NULL, FK → `used_listing_offers(id)` CASCADE |
| `sender_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `message` | TEXT | |
| `counter_offer_bdt` | DECIMAL(12,2) | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`offer_id`, `created_at`)

---

## 7. Products & Inventory

### `products`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `vendor_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `shop_id` | BIGINT | FK → `shops(id)` SET NULL |
| `category_id` | BIGINT | NOT NULL, FK → `categories(id)` RESTRICT |
| `name` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | |
| `price_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'DRAFT'`, CHECK: `DRAFT`/`ACTIVE`/`INACTIVE`/`OUT_OF_STOCK` |
| `shipping_type` | VARCHAR(10) | NOT NULL, DEFAULT `'FREE'` |
| `deleted_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `search_vector` | TSVECTOR | GENERATED ALWAYS AS `to_tsvector('english', name || ' ' || description)` STORED |

**Indexes:** (`vendor_id`, `status`) WHERE deleted IS NULL, (`category_id`, `status`) WHERE deleted IS NULL, `price_bdt` WHERE deleted IS NULL, GIN `search_vector`, `shop_id`  
**Trigger:** `updated_at`

---

### `product_images`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `product_id` | BIGINT | NOT NULL, FK → `products(id)` CASCADE |
| `image_url` | TEXT | NOT NULL |
| `sort_order` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`product_id`, `sort_order`)

---

### `product_variants`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `product_id` | BIGINT | NOT NULL, FK → `products(id)` CASCADE |
| `variant_label` | VARCHAR(255) | NOT NULL |
| `sku` | VARCHAR(100) | UNIQUE |
| `price_offset_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `0.00` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `product_id`  
**Trigger:** `updated_at`

---

### `inventory`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `product_id` | BIGINT | NOT NULL, FK → `products(id)` CASCADE |
| `product_variant_id` | BIGINT | FK → `product_variants(id)` CASCADE |
| `stock_qty` | INT | NOT NULL, DEFAULT `0`, CHECK: `>= 0` |
| `low_stock_threshold` | INT | NOT NULL, DEFAULT `5` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`product_id`, `product_variant_id`) | |

**Trigger:** `updated_at`

---

### `product_questions`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `product_id` | BIGINT | NOT NULL, FK → `products(id)` CASCADE |
| `asker_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `question` | TEXT | NOT NULL |
| `answer` | TEXT | |
| `answered_by` | BIGINT | FK → `users(id)` SET NULL |
| `answered_at` | TIMESTAMP | |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`product_id`, `is_public`)  
**Trigger:** `updated_at`

---

## 8. Cart & Coupons

### `carts`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, UNIQUE, FK → `users(id)` CASCADE |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'` |
| `expires_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `cart_items`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `cart_id` | BIGINT | NOT NULL, FK → `carts(id)` CASCADE |
| `item_type` | VARCHAR(20) | NOT NULL, DEFAULT `'PRODUCT'`, CHECK: `PRODUCT`/`USED_ITEM` |
| `product_id` | BIGINT | FK → `products(id)` CASCADE |
| `product_variant_id` | BIGINT | FK → `product_variants(id)` SET NULL |
| `used_listing_id` | BIGINT | FK → `used_listings(id)` CASCADE |
| `qty` | INT | NOT NULL, DEFAULT `1`, CHECK: `> 0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| CHECK: | (item_type = 'PRODUCT' AND product_id NOT NULL AND used_listing_id NULL) OR (item_type = 'USED_ITEM' AND used_listing_id NOT NULL AND product_id NULL) |
| UNIQUE | (`cart_id`, `product_id`, `product_variant_id`) | |
| UNIQUE | (`cart_id`, `used_listing_id`) | |

**Index:** `cart_id`  
**Trigger:** `updated_at`

---

### `coupons`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `description` | TEXT | |
| `discount_type` | VARCHAR(20) | NOT NULL, CHECK: `FLAT`/`PERCENT` |
| `discount_value` | DECIMAL(12,2) | NOT NULL, CHECK: `> 0` |
| `min_order_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `0.00` |
| `max_discount_bdt` | DECIMAL(12,2) | |
| `max_uses` | INT | |
| `uses_count` | INT | NOT NULL, DEFAULT `0` |
| `valid_from` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `valid_until` | TIMESTAMP | |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_by` | BIGINT | FK → `users(id)` SET NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `code` WHERE `is_active = TRUE`  
**Trigger:** `updated_at`

---

## 9. Orders & Payments

### `orders`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `customer_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `shipping_address_id` | BIGINT | FK → `addresses(id)` SET NULL |
| `shipping_address_snapshot` | JSONB | |
| `coupon_id` | BIGINT | FK → `coupons(id)` SET NULL |
| `subtotal_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `shipping_fee_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `0.00` |
| `discount_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `0.00` |
| `tax_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `0.00` |
| `total_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `shipping_option` | VARCHAR(20) | |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PLACED'`, CHECK: `PLACED`/`PAID`/`PROCESSING`/`SHIPPED`/`DELIVERED`/`CANCELLED`/`RETURNED`/`APPROVED`/`REJECTED`/`PACKED` |
| `note` | TEXT | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`customer_id`, `status`), `created_at DESC`  
**Trigger:** `updated_at`

---

### `order_status_log`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `order_id` | BIGINT | NOT NULL, FK → `orders(id)` CASCADE |
| `old_status` | VARCHAR(30) | NOT NULL |
| `new_status` | VARCHAR(30) | NOT NULL |
| `changed_by` | BIGINT | FK → `users(id)` SET NULL |
| `note` | TEXT | |
| `changed_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`order_id`, `changed_at DESC`)

---

### `coupon_uses`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `coupon_id` | BIGINT | NOT NULL, FK → `coupons(id)` RESTRICT |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `order_id` | BIGINT | NOT NULL, FK → `orders(id)` CASCADE |
| `used_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`coupon_id`, `user_id`) | |

**Indexes:** `coupon_id`, `user_id`

---

### `order_items`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `order_id` | BIGINT | NOT NULL, FK → `orders(id)` CASCADE |
| `item_type` | VARCHAR(20) | NOT NULL, DEFAULT `'PRODUCT'`, CHECK: `PRODUCT`/`USED_ITEM` |
| `product_id` | BIGINT | FK → `products(id)` RESTRICT |
| `used_listing_id` | BIGINT | FK → `used_listings(id)` RESTRICT |
| `product_variant_id` | BIGINT | FK → `product_variants(id)` SET NULL |
| `variant_label` | VARCHAR(255) | |
| `qty` | INT | NOT NULL, CHECK: `> 0` |
| `unit_price_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| CHECK: | (item_type = 'PRODUCT' AND product_id NOT NULL AND used_listing_id NULL) OR (item_type = 'USED_ITEM' AND used_listing_id NOT NULL AND product_id NULL) |

**Indexes:** `order_id`, `product_id`, `used_listing_id`

---

### `payments`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `order_id` | BIGINT | NOT NULL, FK → `orders(id)` CASCADE |
| `amount_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `> 0` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`PAID`/`FAILED`/`REFUNDED` |
| `method` | VARCHAR(50) | NOT NULL, DEFAULT `'DUMMY'` |
| `gateway_name` | VARCHAR(50) | |
| `transaction_ref` | VARCHAR(100) | UNIQUE |
| `gateway_response` | JSONB | |
| `paid_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `order_id`, `status`, `transaction_ref`  
**Trigger:** `updated_at`

---

### `vendor_commissions`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `order_item_id` | BIGINT | NOT NULL, UNIQUE, FK → `order_items(id)` CASCADE |
| `vendor_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `sale_amount_bdt` | DECIMAL(12,2) | NOT NULL |
| `commission_rate` | DECIMAL(5,2) | NOT NULL |
| `commission_bdt` | DECIMAL(12,2) | NOT NULL |
| `net_payout_bdt` | DECIMAL(12,2) | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`PAID`/`HELD`/`CANCELLED` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`vendor_id`, `status`)  
**Trigger:** `updated_at`

---

### `shipments`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `order_id` | BIGINT | NOT NULL, UNIQUE, FK → `orders(id)` CASCADE |
| `carrier` | VARCHAR(100) | |
| `tracking_number` | VARCHAR(100) | UNIQUE |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PREPARING'`, CHECK: `PREPARING`/`PICKED_UP`/`IN_TRANSIT`/`OUT_FOR_DELIVERY`/`DELIVERED`/`FAILED`/`RETURNED` |
| `estimated_delivery` | DATE | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `shipment_events`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `shipment_id` | BIGINT | NOT NULL, FK → `shipments(id)` CASCADE |
| `status` | VARCHAR(30) | NOT NULL |
| `location` | VARCHAR(255) | |
| `note` | TEXT | |
| `occurred_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`shipment_id`, `occurred_at DESC`)

---

## 10. Wishlists

### `wishlists`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `product_id` | BIGINT | NOT NULL, FK → `products(id)` CASCADE |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`user_id`, `product_id`) | |

**Indexes:** `user_id`, `product_id`

---

## 11. Repair Service Marketplace

### `technicians`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, UNIQUE, FK → `users(id)` CASCADE |
| `bio` | TEXT | |
| `specialization` | VARCHAR(30) | NOT NULL, CHECK: `Electronics`/`Electrical`/`Furniture`/`Appliances` |
| `pickup_available` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `service_area` | VARCHAR(255) | |
| `website_url` | TEXT | |
| `social_links` | JSONB | |
| `level` | VARCHAR(20) | NOT NULL, DEFAULT `'Beginner'`, CHECK: `Beginner`/`Verified`/`Expert` |
| `rating_avg` | DECIMAL(3,2) | NOT NULL, DEFAULT `0.00` |
| `completion_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `technician_level_history`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` CASCADE |
| `old_level` | VARCHAR(20) | NOT NULL |
| `new_level` | VARCHAR(20) | NOT NULL |
| `changed_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`technician_id`, `changed_at DESC`)

---

### `technician_skills`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` CASCADE |
| `skill` | VARCHAR(120) | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `technician_id`

---

### `technician_availability`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` CASCADE |
| `day_of_week` | SMALLINT | NOT NULL, CHECK: `0–6` |
| `start_time` | TIME | NOT NULL |
| `end_time` | TIME | NOT NULL, CHECK: `end_time > start_time` |
| `is_available` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`technician_id`, `day_of_week`) | |

**Index:** `technician_id`  
**Trigger:** `updated_at`

---

### `service_listings`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` CASCADE |
| `category_id` | BIGINT | FK → `categories(id)` SET NULL |
| `title` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | |
| `price_min_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `price_max_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= price_min_bdt` |
| `availability_note` | VARCHAR(255) | |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'`, CHECK: `ACTIVE`/`INACTIVE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `technician_id`, `category_id`, `status`  
**Trigger:** `updated_at`

---

### `repair_requests`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `customer_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `address_id` | BIGINT | FK → `addresses(id)` SET NULL |
| `category_id` | BIGINT | FK → `categories(id)` SET NULL |
| `description` | TEXT | NOT NULL |
| `pickup_needed` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'OPEN'`, CHECK: `OPEN`/`QUOTED`/`BOOKED`/`COMPLETED`/`CANCELLED` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`customer_id`, `status`), `status`  
**Trigger:** `updated_at`

---

### `repair_media`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `request_id` | BIGINT | NOT NULL, FK → `repair_requests(id)` CASCADE |
| `media_url` | TEXT | NOT NULL |
| `media_type` | VARCHAR(10) | NOT NULL, CHECK: `IMAGE`/`VIDEO` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `request_id`

---

### `repair_quotes`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `request_id` | BIGINT | NOT NULL, FK → `repair_requests(id)` CASCADE |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` CASCADE |
| `quote_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `plan` | TEXT | |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'SENT'`, CHECK: `SENT`/`ACCEPTED`/`REJECTED` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`request_id`, `technician_id`) | |

**Indexes:** (`request_id`, `status`), `technician_id`  
**Trigger:** `updated_at`

---

### `repair_bookings`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `request_id` | BIGINT | NOT NULL, UNIQUE, FK → `repair_requests(id)` CASCADE |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` RESTRICT |
| `scheduled_date` | DATE | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'CONFIRMED'`, CHECK: `CONFIRMED`/`REJECTED`/`COMPLETED`/`CANCELLED` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`technician_id`, `status`)  
**Trigger:** `updated_at`

---

### `service_completion`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `booking_id` | BIGINT | NOT NULL, UNIQUE, FK → `repair_bookings(id)` CASCADE |
| `notes` | TEXT | |
| `completed_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

### `repair_payments`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `booking_id` | BIGINT | NOT NULL, UNIQUE, FK → `repair_bookings(id)` CASCADE |
| `amount_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `> 0` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`PAID`/`FAILED`/`REFUNDED` |
| `method` | VARCHAR(50) | NOT NULL, DEFAULT `'DUMMY'` |
| `gateway_name` | VARCHAR(50) | |
| `transaction_ref` | VARCHAR(100) | UNIQUE |
| `gateway_response` | JSONB | |
| `paid_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `booking_id`, `status`  
**Trigger:** `updated_at`

---

### `technician_earnings`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `technician_id` | BIGINT | NOT NULL, FK → `technicians(id)` CASCADE |
| `booking_id` | BIGINT | NOT NULL, UNIQUE, FK → `repair_bookings(id)` CASCADE |
| `gross_amount_bdt` | DECIMAL(12,2) | NOT NULL |
| `commission_rate` | DECIMAL(5,2) | NOT NULL |
| `commission_bdt` | DECIMAL(12,2) | NOT NULL |
| `net_amount_bdt` | DECIMAL(12,2) | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`PAID`/`HELD` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`technician_id`, `status`)  
**Trigger:** `updated_at`

---

## 12. Reviews

### `reviews`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `reviewer_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `reviewee_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `product_id` | BIGINT | FK → `products(id)` SET NULL |
| `order_item_id` | BIGINT | FK → `order_items(id)` SET NULL |
| `booking_id` | BIGINT | FK → `repair_bookings(id)` SET NULL |
| `rating` | INT | NOT NULL, CHECK: `1–5` |
| `comment` | TEXT | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| CHECK: | `reviewer_id <> reviewee_id` | |

**Indexes:** `reviewee_id`, `product_id`, `reviewer_id`, `booking_id`, `order_item_id`

---

## 13. Auction System

### `auctions`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `vendor_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `shop_id` | BIGINT | FK → `shops(id)` SET NULL |
| `title` | VARCHAR(255) | NOT NULL |
| `type` | VARCHAR(20) | NOT NULL, CHECK: `STANDARD`/`FLASH`/`REVERSE`/`RESERVE` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'CREATED'`, CHECK: `CREATED`/`APPROVED`/`PREPARING`/`ACTIVE`/`EXTENDED`/`CLOSED`/`COMPLETED`/`REJECTED` |
| `start_time` | TIMESTAMP | NOT NULL |
| `end_time` | TIMESTAMP | NOT NULL, CHECK: `end_time > start_time` |
| `terms_accepted` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`vendor_id`, `status`), (`status`, `start_time`), `shop_id`  
**Trigger:** `updated_at`

---

### `auction_lots`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `auction_id` | BIGINT | NOT NULL, FK → `auctions(id)` CASCADE |
| `category_id` | BIGINT | FK → `categories(id)` SET NULL |
| `title` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | |
| `condition_note` | VARCHAR(100) | |
| `starting_price_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `>= 0` |
| `reserve_price_bdt` | DECIMAL(12,2) | CHECK: `>= 0` |
| `current_bid_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `0.00` |
| `min_bid_increment_bdt` | DECIMAL(12,2) | NOT NULL, DEFAULT `10.00`, CHECK: `> 0` |
| `extension_duration_minutes` | INT | NOT NULL, DEFAULT `5` |
| `extensions_count` | INT | NOT NULL, DEFAULT `0` |
| `max_extensions` | INT | NOT NULL, DEFAULT `3` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PREPARING'`, CHECK: `PREPARING`/`ACTIVE`/`EXTENDED`/`CLOSED` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `auction_id`, `status`, `category_id`  
**Trigger:** `updated_at`

---

### `auction_images`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `lot_id` | BIGINT | NOT NULL, FK → `auction_lots(id)` CASCADE |
| `image_url` | TEXT | NOT NULL |
| `sort_order` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`lot_id`, `sort_order`)

---

### `bids`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `lot_id` | BIGINT | NOT NULL, FK → `auction_lots(id)` CASCADE |
| `bidder_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `amount_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `> 0` |
| `is_winning` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`lot_id`, `amount_bdt DESC`), (`bidder_id`, `lot_id`)

---

### `auction_watchlist`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `lot_id` | BIGINT | NOT NULL, FK → `auction_lots(id)` CASCADE |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`user_id`, `lot_id`) | |

**Indexes:** `user_id`, `lot_id`

---

### `auction_winners`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `lot_id` | BIGINT | NOT NULL, UNIQUE, FK → `auction_lots(id)` CASCADE |
| `winner_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `winning_bid_id` | BIGINT | NOT NULL, UNIQUE, FK → `bids(id)` RESTRICT |
| `final_price_bdt` | DECIMAL(12,2) | NOT NULL |
| `reserve_met` | BOOLEAN | NOT NULL, DEFAULT `TRUE` |
| `payment_status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`PAID`/`FAILED`/`WAIVED` |
| `payment_deadline` | TIMESTAMP | NOT NULL |
| `paid_at` | TIMESTAMP | |
| `non_payment_count` | INT | NOT NULL, DEFAULT `0` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `winner_id`, `payment_status` WHERE `payment_status = 'PENDING'`  
**Trigger:** `updated_at`

---

### `auction_payments`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `auction_winner_id` | BIGINT | NOT NULL, UNIQUE, FK → `auction_winners(id)` CASCADE |
| `amount_bdt` | DECIMAL(12,2) | NOT NULL, CHECK: `> 0` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'PENDING'`, CHECK: `PENDING`/`PAID`/`FAILED`/`REFUNDED` |
| `method` | VARCHAR(50) | NOT NULL, DEFAULT `'DUMMY'` |
| `gateway_name` | VARCHAR(50) | |
| `transaction_ref` | VARCHAR(100) | UNIQUE |
| `gateway_response` | JSONB | |
| `paid_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `auction_winner_id`, `status`  
**Trigger:** `updated_at`

---

### `auction_approvals`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `auction_id` | BIGINT | NOT NULL, FK → `auctions(id)` CASCADE |
| `admin_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `status` | VARCHAR(20) | NOT NULL, CHECK: `APPROVED`/`REJECTED` |
| `notes` | TEXT | |
| `decided_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `auction_id`

---

### `auction_status_log`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `auction_id` | BIGINT | NOT NULL, FK → `auctions(id)` CASCADE |
| `old_status` | VARCHAR(30) | NOT NULL |
| `new_status` | VARCHAR(30) | NOT NULL |
| `changed_by` | BIGINT | FK → `users(id)` SET NULL |
| `changed_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`auction_id`, `changed_at DESC`)

---

## 14. Trust & Fraud

### `trust_scores`
| Column | Type | Constraints |
|---|---|---|
| `user_id` | BIGINT | PK, FK → `users(id)` CASCADE |
| `score` | DECIMAL(5,2) | NOT NULL, DEFAULT `50.00`, CHECK: `0–100` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `trust_events`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `event_type` | VARCHAR(100) | NOT NULL |
| `delta` | DECIMAL(5,2) | NOT NULL |
| `note` | TEXT | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`user_id`, `created_at DESC`)

---

### `fraud_flags`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `flagged_by` | BIGINT | FK → `users(id)` SET NULL |
| `reason` | VARCHAR(255) | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'OPEN'`, CHECK: `OPEN`/`REVIEWED`/`RESOLVED` |
| `resolved_by` | BIGINT | FK → `users(id)` SET NULL |
| `resolved_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`user_id`, `status`), `status` WHERE `status = 'OPEN'`  
**Trigger:** `updated_at`

---

### `fraud_events`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `event_type` | VARCHAR(100) | NOT NULL |
| `details` | TEXT | |
| `severity` | VARCHAR(20) | NOT NULL, DEFAULT `'LOW'`, CHECK: `LOW`/`MEDIUM`/`HIGH`/`CRITICAL` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `user_id`, (`severity`, `created_at DESC`)

---

### `reports`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `reporter_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `reported_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `entity_type` | VARCHAR(60) | |
| `entity_id` | BIGINT | |
| `reason` | TEXT | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'OPEN'`, CHECK: `OPEN`/`REVIEWED`/`RESOLVED`/`DISMISSED` |
| `admin_note` | TEXT | |
| `resolved_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| CHECK: | `reporter_id <> reported_id` | |

**Indexes:** `reported_id`, `reporter_id`, `status` WHERE `status = 'OPEN'`  
**Trigger:** `updated_at`

---

## 15. Bidder Reputation

### `bidder_reputation`
| Column | Type | Constraints |
|---|---|---|
| `user_id` | BIGINT | PK, FK → `users(id)` CASCADE |
| `auctions_won` | INT | NOT NULL, DEFAULT `0` |
| `auctions_entered` | INT | NOT NULL, DEFAULT `0` |
| `win_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `payment_success_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `cancellation_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT `0.00` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Trigger:** `updated_at`

---

### `bidder_restrictions`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `vendor_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `bidder_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `reason` | VARCHAR(255) | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`vendor_id`, `bidder_id`) | |
| CHECK: | `vendor_id <> bidder_id` | |

**Indexes:** `vendor_id`, `bidder_id`

---

## 16. Returns

### `returns`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `order_item_id` | BIGINT | NOT NULL, FK → `order_items(id)` CASCADE |
| `customer_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `reason` | TEXT | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'OPEN'`, CHECK: `OPEN`/`APPROVED`/`REJECTED`/`COMPLETED`/`CANCELLED` |
| `admin_note` | TEXT | |
| `refund_amount_bdt` | DECIMAL(12,2) | |
| `resolved_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** `customer_id`, `order_item_id`, `status` WHERE `status = 'OPEN'`  
**Trigger:** `updated_at`

---

## 17. Chat & Messaging

### `conversations`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `type` | VARCHAR(20) | NOT NULL, DEFAULT `'USED'` |
| `entity_type` | VARCHAR(30) | |
| `entity_id` | BIGINT | |
| `title` | VARCHAR(255) | |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'OPEN'` |
| `last_message_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

---

### `conversation_members`
| Column | Type | Constraints |
|---|---|---|
| `conversation_id` | BIGINT | PK, FK → `conversations(id)` CASCADE |
| `user_id` | BIGINT | PK, FK → `users(id)` CASCADE |
| `role` | VARCHAR(20) | |
| `joined_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** `user_id`

---

### `messages`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `conversation_id` | BIGINT | NOT NULL, FK → `conversations(id)` CASCADE |
| `sender_id` | BIGINT | NOT NULL, FK → `users(id)` RESTRICT |
| `message_type` | VARCHAR(20) | NOT NULL, DEFAULT `'TEXT'` |
| `body` | TEXT | NOT NULL |
| `attachment_url` | TEXT | |
| `attachment_name` | VARCHAR(255) | |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Indexes:** (`conversation_id`, `created_at DESC`), `sender_id`

---

## 18. Notifications

### `notifications`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `type` | VARCHAR(60) | NOT NULL |
| `title` | VARCHAR(120) | NOT NULL |
| `body` | TEXT | NOT NULL |
| `entity_type` | VARCHAR(60) | |
| `entity_id` | BIGINT | |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |

**Index:** (`user_id`, `is_read`, `created_at DESC`)  
**Trigger:** `updated_at`

---

### `notification_subscriptions`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, IDENTITY |
| `user_id` | BIGINT | NOT NULL, FK → `users(id)` CASCADE |
| `event_type` | VARCHAR(60) | NOT NULL |
| `category_id` | BIGINT | FK → `categories(id)` CASCADE |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` |
| UNIQUE | (`user_id`, `event_type`, `category_id`) | |

**Index:** `user_id`

---

## Entity Relationship Summary

```
users (1) ──< user_roles >── roles (1)
users (1) ── user_badges
users (1) ──< ban_history
users (1) ── customer_profiles
users (1) ──< addresses
users (1) ──< password_reset_tokens
users (1) ──< user_agreements
users (1) ──< audit_logs
users (1) ──< role_upgrades ──< upgrade_payments
users (1) ──< vendor_profiles
users (1) ──< shops ──< shop_followers
users (1) ──< shop_staff
users (1) ──< vendor_subscriptions ── vendor_subscription_plans (1)
users (1) ──< vendor_subscription_deals ── vendor_subscription_plans (1)
users (1) ──< used_listings ──< used_images, used_videos, used_item_history, used_item_repairs, used_listing_offers
users (1) ──< products ──< product_images, product_variants, inventory, product_questions
users (1) ──< carts ──< cart_items
users (1) ──< orders ──< order_items ──< vendor_commissions, returns
users (1) ──< payments
users (1) ──< shipments ──< shipment_events
users (1) ──< wishlists
users (1) ──< technicians ──< technician_skills, technician_availability, technician_level_history
users (1) ──< reviews
users (1) ──< auctions ──< auction_lots ──< auction_images, bids
users (1) ──< auction_winners, auction_approvals
users (1) ──< trust_scores, trust_events
users (1) ──< fraud_flags, fraud_events, reports
users (1) ──< bidder_reputation, bidder_restrictions
users (1) ──< conversations, conversation_members, messages
users (1) ──< notifications, notification_subscriptions
categories (1) ──< categories (parent)
categories (1) ──< products, used_listings, service_listings, repair_requests
condition_levels (1) ──< used_listings
technicians (1) ──< service_listings, repair_quotes, repair_bookings, technician_earnings
```
