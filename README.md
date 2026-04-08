# 🐾 Happy Tails

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Frontend](https://img.shields.io/badge/frontend-React%20Native-61DAFB)
![Backend](https://img.shields.io/badge/backend-Node.js-339933)
![Database](https://img.shields.io/badge/database-MySQL-orange)
---

## 📱 Overview

**Happy Tails** is a mobile-first pet care platform that connects pet owners with trusted, verified pet minders. It provides a **secure, all-in-one solution** for booking, communication, payments, and pet care tracking.

The platform is designed to solve real-world issues in the pet care industry, including:

* Lack of trust in caregivers
* Fragmented communication
* Inefficient booking systems

---

## 🎥 Demo & Screenshots

> *(Replace these with your actual screenshots or Figma exports)*

### 🏠 Home Screen

![Home Screen](https://via.placeholder.com/800x400?text=Home+Screen)

### 🔍 Search & Filters

![Search](https://via.placeholder.com/800x400?text=Search+Minders)

### 📅 Booking Flow

![Booking](https://via.placeholder.com/800x400?text=Booking+Flow)

### 📝 Visit Reports

![Reports](https://via.placeholder.com/800x400?text=Visit+Reports)

---

## ✨ Features

### 👤 User Management

* Secure registration with phone verification
* Identity verification for pet minders
* Role-based access (Owner, Minder, Support)
* Profile ratings and reviews

---

### 🐶 Pet Profiles

* Store pet details (breed, age, etc.)
* Add medical and routine information
* Upload images and documents

---

### 🔍 Search & Discovery

* Search by name
* Filter by location, service, pet type, availability
* Sort by price

---

### 📅 Booking System

* Real-time availability calendar
* Conflict-free booking (no double bookings)
* Modify or cancel bookings
* Optional meet-and-greet scheduling

---

### 💬 Communication

* In-app messaging
* Message history for transparency
* Notifications via email & SMS

---

### 📝 Visit Reporting

* Digital visit reports after each service
* Task checklists
* Timestamped photo/video uploads
* Emergency reporting

---

### 💳 Payments

* Secure cashless payments
* Escrow system (held until completion)
* Refund handling via support

---

### ⭐ Reviews & Ratings

* Verified reviews after completed bookings
* Moderation system for abuse prevention

---

## 🏗️ System Architecture

![Architecture](/README_images/architecture_layout.png)

---

## ⚙️ Tech Stack

| Layer        | Technology     |
| ------------ | -------------- |
| Frontend     | React Native   |
| Backend      | Node.js (HTTP) |
| Database     | MySQL          |
| Architecture | Modular Design |

---

## 🚀 Getting Started

### 📋 Prerequisites

* Node.js (v18+)
* MySQL
* Android Studio / Xcode

---

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/happy-tails.git

# Navigate into the project
cd happy-tails

# Install frontend dependencies
npm install

# Run the app
npm start
```

---

### ⚙️ Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start backend in dev mode (nodemon)
npm run dev
```

### 🧩 Backend Environment

Create a `.env` file inside the `backend` folder:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=happytails
API_PORT=3000
```

Notes:

* `DB_PORT=3306` is for MySQL.
* `API_PORT` must be different from `3306` (use `3000` by default).
* If `API_PORT` is accidentally set to `3306`, the backend falls back to `3000` to avoid port conflicts.

### 🗄️ Database Setup

Run the schema file in MySQL Workbench (or your SQL tool of choice):

```sql
CREATE DATABASE IF NOT EXISTS happytails;
USE happytails;
-- then execute backend/database/schema.sql
```

### 🔌 How The Backend Works

* `backend/server/server.js` creates a Node HTTP server and registers all route modules.
* `backend/server/router.js` provides lightweight route matching, params, query parsing, and JSON body parsing.
* `backend/server/db.js` creates a MySQL connection pool and runs a startup health check (`SELECT 1`).
* Route handlers in `backend/server/routes/` call MySQL via the shared pool.

### ✅ Quick API Check

After starting the server, test the bookings endpoint:

```http
GET http://localhost:3000/api/bookings
```

This endpoint returns the result of:

```sql
SELECT * FROM BOOKING;
```

If no rows exist, it returns an empty JSON array `[]`.

---

## 📊 Non-Functional Highlights

* ⚡ Fast performance (≤2s load time)
* 📈 Scalable to 10,000+ users
* 🔐 AES-256 encryption & TLS security
* ✅ ACID-compliant payment transactions
* 🚫 Zero double-booking guarantee

---

## 🔄 User Flow

![User_Flow](/README_images/user_flow.png)

---

## 🌟 Unique Selling Points

* ✅ Strong **identity verification system**
* 📦 **All-in-one platform** (search → book → pay → track)
* 📸 Real-time updates with proof-of-care
* 💬 Built-in communication with audit trails
* 🔒 Secure escrow-based payments

---

## 📁 Project Structure

```
happy-tails/
│── frontend/        # React Native app
│── backend/         # PHP API
│── database/        # SQL schemas
│── docs/            # Reports & documentation
│── README.md
```

---

## 👨‍💻 Contributors

* Group 16 – Software Engineering Project

---
