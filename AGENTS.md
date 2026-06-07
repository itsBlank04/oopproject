# AtomDrops Marketplace OS

## Repo layout

```
ATOM/
├── demo/                    # monorepo root
│   ├── pom.xml              # Spring Boot 4.0.6, Java 21, Maven
│   ├── mvnw / mvnw.cmd      # Maven wrapper
│   ├── src/                 # Java backend
│   ├── frontend/            # React 19 + TypeScript 6 + Vite 8
│   │   ├── package.json
│   │   └── src/main.tsx     # frontend entrypoint
│   ├── supabase-migration.sql  # full 71-table schema (manual SQL)
│   └── scripts/             # Node.js QA scripts (ESM, .mjs)
├── master.md                # architecture doc
├── auction.md               # auction spec
└── test-upgrade.ps1         # upgrade flow test
```

## Commands

All run from `demo/` unless noted.

| action | command |
|---|---|
| **Backend build** | `./mvnw clean package` |
| **Backend run** | `./mvnw spring-boot:run` (runs on :8080) |
| **Backend quick start** | `java -jar target/demo-0.0.1-SNAPSHOT.jar` |
| **Backend test** | `./mvnw test` (one `@SpringBootTest` context-loads test) |
| **Frontend dev** | `npm run dev` from `demo/frontend/` (:5173) |
| **Frontend build** | `npm run build` from `demo/frontend/` (runs `tsc -b && vite build`) |
| **Frontend lint** | `npm run lint` from `demo/frontend/` |
| **E2E smoke test** | `node scripts/qa-e2e-smoke.mjs` from `demo/` |
| **Seed flash auction** | `node scripts/qa-seed-countdown-auction.mjs` from `demo/` |
| **Upgrade flow test** | `.\test-upgrade.ps1` from repo root |

## Auth

- **Session-based** (JSESSIONID HTTP-only cookie), **no JWT**.
- Backend: `HttpSessionSecurityContextRepository`. Principal stored as `Long` (user ID).
- Useful pattern: `SecurityConfig.getSessionUserId()` / `hasRole(role)`.
- Form login, HTTP basic, CSRF, logout **all disabled** — login is a POST to `/api/auth/login`.
- Public GET endpoints: products, categories, auctions, used-listings, technicians, service-listings, system-notifications, vendor shops, user profiles, reviews, trust-scores.
- Admin: `/api/admin/**` requires `ROLE_ADMIN`.

## Database

- Supabase PostgreSQL 15. Password in `application.properties` uses `\#` to escape `#`: `\#qQ33847099`.
- Schema managed manually — `supabase-migration.sql` is the source of truth. `ddl-auto=update` is on for dev convenience.
- `spring.sql.init.mode=never` — use Supabase SQL Editor in production.

## Architecture quirks

- **AuctionScheduler** scans for expired lots every **2 seconds** (two `@Scheduled(fixedRate=2000)` methods).
- **STOMP WebSocket** at `/ws/auction` with SockJS fallback. In-memory broker `/topic/**`. App prefix `/app`.
- **Dual real-time**: WebSocket (bidirectional) + SSE (status broadcasts).
- **DataInitializer** (`CommandLineRunner`) auto-seeds: 4 roles, admin user (`admin@login.com` / `88888888`), 10 categories, 4 condition levels, 11 platform settings.
- **Bangladesh-first**: BDT currency, Dhaka shipping zones, bKash/Nagad payments.
- 76 JPA entities in `model/`, 75 repos in `repository/`, 15 services, 29 REST controllers.
- CORS allows `localhost:5173` and `localhost:5174` only, with credentials.

## Testing

- Only **one JUnit test** exists (`DemoApplicationTests.contextLoads`).
- Real test coverage is via **Node.js ESM scripts** (`scripts/*.mjs`) that connect directly to the DB via `pg` client.
- QA expects `QA_BASE_URL` (default `http://localhost:8080`) and `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` env vars.
- No CI/CD workflows exist.

## Session config

`application.properties`: 7-day timeout, HTTP-only, SameSite=Lax, `secure=false` (dev).
