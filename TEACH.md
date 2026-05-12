# AtomDrops — Viva Preparation Guide

## Project Overview

**AtomDrops** is a Smart Multi-Vendor Marketplace built with Spring Boot (Java) + MariaDB (via XAMPP). It integrates four core modules:

1. **New Products Marketplace** — Vendors sell products
2. **Used Items Marketplace** — Customers sell second-hand items
3. **Repair Service Marketplace** — Technicians offer repair services
4. **Auction System** — Real-time bidding system

---

## Module 1: Database (atomdb)

### What was done:
- Created a complete relational database schema for all 4 modules
- 41+ tables covering every entity in the system
- Proper foreign keys and relationships between tables
- Stored in `atomdb` database on MariaDB (XAMPP)

### Tables created:
- **Core:** `users`, `roles`, `user_roles`
- **Marketplace:** `products`, `product_images`, `inventory`, `categories`, `orders`, `order_items`, `payments`
- **Used Items:** `used_listings`, `used_images`, `used_videos`, `condition_levels`, `used_item_history`, `used_item_repairs`
- **Repairs:** `technicians`, `technician_skills`, `service_listings`, `repair_requests`, `repair_quotes`, `repair_bookings`, `service_completion`
- **Auctions:** `auctions`, `auction_lots`, `auction_images`, `bids`, `watchlist`, `auction_approvals`
- **Trust & Fraud:** `trust_scores`, `trust_events`, `fraud_flags`, `fraud_events`, `reports`, `bidder_reputation`, `bidder_restrictions`
- **Chat:** `conversations`, `conversation_members`, `messages`
- **Notifications:** `notifications`, `notification_subscriptions`

### Expected Questions:
> **Q: Why use relational database instead of NoSQL?**
> A: We have structured data with clear relationships (users → orders → products). Relational DB ensures data integrity with foreign keys.

> **Q: Why MariaDB instead of MySQL?**
> A: MariaDB is the open-source fork of MySQL, compatible with XAMPP, more lightweight and free.

---

## Module 2: User Authentication & Role Management

### What was done:
- Users register with email + password
- Four roles: **Customer, Vendor, Technician, Admin**
- Passwords are **hashed using BCrypt** (not stored in plain text)
- Role-based login redirects users to their own dashboard
- Session-based authentication using HTTP cookies

### Key Files:
- `AuthService.java` — handles registration, login, password hashing
- `PasswordService.java` — BCrypt encoding
- `User.java`, `Role.java`, `UserRole.java` — entities
- `AuthController.java` — handles register/login/dashboard endpoints

### Expected Questions:
> **Q: How is password security handled?**
> A: BCrypt is used for password hashing. It's a one-way hash — even if the database is leaked, passwords cannot be reversed.

> **Q: What is the difference between authentication and authorization?**
> A: Authentication = verifying who you are (login). Authorization = checking what you can access (role-based dashboard routing).

> **Q: How do you differentiate between user roles?**
> A: Users have roles stored in `user_roles` table. On login, the role is stored in session and used to route to the correct dashboard.

---

## Module 3: Landing Page & Dashboards

### What was done:
- Beautiful landing page (`landing.html`) with warm design
- Separate dashboards for each role: Customer, Vendor, Technician, Admin
- Clean navigation with register/login/logout flow

### Expected Questions:
> **Q: Why use Thymeleaf instead of React/Angular?**
> A: Thymeleaf is a server-side template engine that works seamlessly with Spring Boot. For this project scale, it avoids the complexity of a separate frontend build system.

> **Q: What is the difference between @Controller and @RestController?**
> A: `@Controller` returns view templates (HTML). `@RestController` returns raw data (JSON) for API endpoints.

---

## Module 4: Spring Data JPA

### What was done:
- JPA entities mapped to database tables
- Repository interfaces for CRUD operations
- Hibernate auto-generates SQL from entity definitions
- `ddl-auto=update` keeps schema in sync with Java entities

### Key Concepts:
- **Entity** — Java class mapped to a database table
- **Repository** — Interface that provides CRUD methods automatically
- **JPA** — Java Persistence API (standard for ORM)
- **Hibernate** — Implementation of JPA used by Spring

### Expected Questions:
> **Q: What is ORM?**
> A: Object-Relational Mapping — maps Java objects to database tables, so we can work with Java instead of writing SQL.

> **Q: What is the difference between `save()` and `saveAndFlush()`?**
> A: `save()` may delay the actual INSERT until the transaction ends. `saveAndFlush()` forces immediate execution.

> **Q: How does Hibernate know which table to use?**
> A: The `@Table(name = "users")` annotation on the entity class maps it to the `users` table.

---

## Module 5: Spring Configuration

### What was done:
- `application.properties` — database connection, JPA settings, Thymeleaf config
- `WebConfig.java` — view controller mappings for landing and login pages
- `SessionConfig.java` — cookie-based session tracking

### Expected Questions:
> **Q: What is the purpose of `application.properties`?**
> A: It holds all configuration — database URL, credentials, JPA behavior, port number, etc. Keeps settings separate from code.

> **Q: What is a Bean in Spring?**
> A: A Bean is an object managed by Spring's IoC (Inversion of Control) container. `@Service`, `@Repository`, `@Controller` all create beans.

---

## Module 6: Validation & DTOs

### What was done:
- `RegisterRequest.java` and `LoginRequest.java` — Data Transfer Objects
- Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`) on form inputs
- BindingResult catches validation errors before processing

### Expected Questions:
> **Q: What is a DTO?**
> A: Data Transfer Object — a lightweight object used to transfer data between layers (form → controller → service). Keeps entity classes clean.

> **Q: Why validate forms server-side if we already have HTML5 validation?**
> A: HTML5 validation can be bypassed easily. Server-side validation with `@Valid` ensures data integrity regardless of client.

---

## Project Architecture (Layers)

```
┌─────────────────────────────────┐
│  Presentation Layer (HTML/Views) │
│  Thymeleaf Templates            │
├─────────────────────────────────┤
│  Controller Layer               │
│  AuthController, etc.          │
├─────────────────────────────────┤
│  Service Layer                 │
│  AuthService, PasswordService   │
├─────────────────────────────────┤
│  Repository Layer              │
│  UserRepository, RoleRepository│
├─────────────────────────────────┤
│  Entity / Database Layer       │
│  User, Role, JPA Entities      │
│  MariaDB (atomdb)              │
└─────────────────────────────────┘
```

---

## Questions the Teacher Might Ask

### General:
- What is the purpose of this project?
- How many modules does it have?
- What tech stack did you use?

### Database:
- How many tables are there in your database?
- Explain the relationship between `users` and `orders`
- What is the role of foreign keys?
- Why did you choose MariaDB?

### Backend:
- Explain the MVC pattern used here
- What is the difference between `@Service` and `@Repository`?
- How does Spring Data JPA work?
- What is BCrypt and why use it?

### Security:
- How are passwords stored safely?
- What is the difference between authentication and authorization?
- How does session management work?

### Full Stack:
- Walk me through the registration flow
- How does a user reach their correct dashboard after login?
- What happens when an Admin registers vs a Customer?

---

## Key Technical Terms to Know

| Term | Explanation |
|------|-------------|
| **JPA** | Java Persistence API — standard for ORM |
| **Hibernate** | ORM framework that implements JPA |
| **BCrypt** | Password hashing algorithm |
| **IoC** | Inversion of Control — Spring manages object creation |
| **Bean** | Object managed by Spring container |
| **DTO** | Data Transfer Object |
| **Thymeleaf** | Server-side template engine |
| **HikariCP** | Connection pool used by Spring Boot |
| **REST** | Representational State Transfer (API style) |
| **Session** | Server-side storage of user login state |

---

## How to Run for Demo

1. Start XAMPP → Apache + MySQL
2. Import `atomdb_schema.sql` in phpMyAdmin
3. Run: `.\mvnw.cmd spring-boot:run`
4. Open: `http://localhost:8080`
5. Register as Customer/Vendor/Technician/Admin
6. Login → see respective dashboard

---

Good luck with your Viva! 🎓
