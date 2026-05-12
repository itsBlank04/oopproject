# AtomDrops Marketplace - Setup Guide

## Prerequisites

Before running this project, you need:
- **XAMPP** (with MySQL/MariaDB) - for database
- **Java JDK 17+** - check with `java -version`
- **Git** - for cloning the project

---

## Step 1: Database Setup

### Option A: Using XAMPP (Recommended)

1. Install XAMPP from https://www.apachefriends.org/
2. Open XAMPP Control Panel
3. Start **Apache** and **MySQL** services
4. Open phpMyAdmin: http://localhost/phpmyadmin/

### Option 2: Import the Database Schema

1. Open phpMyAdmin: http://localhost/phpmyadmin/
2. Click **"Databases"** tab
3. Create a new database named: `atomdb`
   - Collation: `utf8mb4_unicode_ci`
4. Click on **`atomdb`** database in the sidebar
5. Click **"Import"** tab
6. Choose the file: `atomdb_schema.sql` from the project root
7. Click **"Go"** or **"Import"**

### Option B: Using Command Line

```bash
cd C:\xampp\mysql\bin
mysql.exe -u root < "C:\path\to\atomdb_schema.sql"
```

---

## Step 2: Clone the Project

```bash
git clone https://github.com/itsBlank04/oopproject.git
cd oopproject
git checkout phase2
```

---

## Step 3: Configure Database (if needed)

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/atomdb
spring.datasource.username=root
spring.datasource.password=
```

Change `password=` if your MySQL has a password.

---

## Step 4: Run the Application

### Using Maven Wrapper (Recommended)

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Or build first
.\mvnw.cmd spring-boot:run
```

### Using Java Directly

```bash
.\mvnw.cmd package
java -jar target/atomdrops-0.0.1-SNAPSHOT.jar
```

---

## Step 5: Access the Application

Open your browser and go to:
- **Landing Page:** http://localhost:8080/
- **Register:** http://localhost:8080/register
- **Login:** http://localhost:8080/login
- **Admin Setup:** http://localhost:8080/admin/setup

---

## Role Registration Flow

| Role | Registration |
|------|--------------|
| **Customer** | Register normally → Customer Dashboard |
| **Vendor** | Register normally → Vendor Dashboard |
| **Technician** | Register normally → Technician Dashboard |
| **Admin** | Select Admin → Admin Setup Page → Admin Dashboard |

---

## Tech Stack

- **Backend:** Spring Boot 4.0.6
- **Database:** MariaDB 10.4+ (via XAMPP)
- **ORM:** Spring Data JPA + Hibernate
- **Frontend:** Thymeleaf Templates
- **Auth:** BCrypt Password Hashing
- **Currency:** BDT (৳)

---

## Troubleshooting

### "Port 8080 already in use"
```powershell
Get-NetTCPConnection -LocalPort 8080
# Kill the process using that port
Stop-Process -Id <PID> -Force
```

### "Database connection failed"
1. Make sure XAMPP MySQL is running
2. Check `application.properties` credentials
3. Ensure database `atomdb` exists

### "Cannot find Java"
Install JDK 17+ from https://adoptium.net/

---

## Project Structure

```
atomdrops/
├── src/main/java/
│   └── atomdrops/example/atomdrops/
│       ├── config/        # Web & Session config
│       ├── model/          # Entity classes (User, Role, etc.)
│       ├── repository/     # JPA repositories
│       ├── service/        # Business logic (Auth, Password)
│       └── web/
│           ├── controller/ # Controllers
│           └── dto/        # Data Transfer Objects
├── src/main/resources/
│   ├── application.properties
│   └── templates/          # HTML pages
└── atomdb_schema.sql       # Database schema for import
```

---

Built with Java + Spring Boot + MariaDB
