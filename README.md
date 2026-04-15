# 🐾 Happy Tails

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/backend-Node.js-339933)
![Database](https://img.shields.io/badge/database-MySQL-orange)

---

## 📱 Overview

**Happy Tails** is a full-stack pet care platform that connects pet owners with trusted, verified pet minders. It provides a secure, all-in-one solution for booking, communication, payments, and pet care tracking.

The platform ships as **two separate frontends**:

- **Mobile web app** — a browser-based React app simulating a mobile experience for pet owners and minders
- **Desktop admin dashboard** — a React app for customer support staff to manage users, bookings, reviews, disputes, incidents, and payments

Both are backed by a shared **Node.js HTTP API** connected to a **MySQL** database.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                 │
│                                                                         │
│   ┌──────────────────────────────┐   ┌──────────────────────────────┐   │
│   │      📱 Mobile Web App       │   │   🖥️  Admin Dashboard        │  │
│   │    (React 19 + Vite)         │   │    (React 19 + Vite)          │  │
│   │    React Router v7           │   │                               │  │
│   │                              │   │                               │  │
│   │  Roles: Owner · Minder       │   │  Role: Customer Support       │  │
│   │                              │   │                               │  │
│   │  • Auth & registration       │   │  • User management            │  │
│   │  • Search & minder profiles  │   │  • Booking oversight          │  │
│   │  • Full booking flow         │   │  • Reviews moderation         │  │
│   │  • Pet profiles              │   │  • Dispute resolution         │  │
│   │  • Minder dashboard          │   │  • Payments & refunds         │  │
│   │  • In-app messaging          │   │  • Incident reports           │  │
│   │  • Notifications             │   │  • Platform analytics         │  │
│   │  • Incident reporting        │   │                               │  │
│   │  • Visit reports             │   │  localhost:5174               │  │
│   │  localhost:5173              │   └────────────────────────────────┘ │
│   └──────────────────────────────┘                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │  HTTP REST  (JSON)
                                 │  Headers: X-User-Id · X-User-Role
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                    │
│                                                                         │
│              Node.js HTTP Server  —  localhost:3000                     │
│              (no framework · custom router · mysql2)                    │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   auth   │ │  users   │ │ minders  │ │ bookings │ │  reviews │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ disputes │ │ payments │ │ reports  │ │ messages │ │  pets    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────────┐ ┌───────────────┐                                     │
│  │notifications │ │  admin        │                                     │
│  └──────────────┘ └───────────────┘                                     │
│                                                                         │
│  lib/helpers.js — UUID · auth guards · role-profile lookups             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │  mysql2 connection pool
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                 │
│                                                                         │
│                     MySQL 8  —  happytails DB                           │
│                                                                         │
│   Users & Roles          Pets & Health         Bookings & Services      │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐    │
│  │ USER            │   │ PET_PROFILE     │   │ BOOKING             │    │
│  │ USER_PROFILE    │   │ HEALTH_DATA     │   │ MEET_AND_GREET      │    │
│  │ PET_OWNER       │   │ HEALTH_EVENT    │   │ VISIT_REPORT        │    │
│  │ PET_MINDER      │   │ MEDICAL_DOCUMENT│   │ SERVICE_TYPE        │    │
│  │ CUSTOMER_SUPPORT│   │ PET_PHOTO       │   │ MINDER_SERVICE      │    │
│  │ IDENTITY_VERIF. │   └─────────────────┘   │ CALENDAR / SLOT     │    │
│  └─────────────────┘                         └─────────────────────┘    │
│                                                                         │
│   Payments & Trust       Communication         Platform                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐    │
│  │ PAYMENT         │   │ CONVERSATION    │   │ NOTIFICATION        │    │
│  │ REFUND          │   │ MESSAGE         │   │ DISPUTE             │    │
│  │ REVIEW          │   │ INCIDENT_REPORT │   │ PLATFORM_SETTINGS   │    │
│  │ REVIEW_FLAG     │   └─────────────────┘   └─────────────────────┘    │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Mobile UI      | React 19 + Vite + React Router v7 |
| Desktop UI     | React 19 + Vite                   |
| Backend        | Node.js (custom HTTP router)      |
| Database       | MySQL                             |
| Authentication | Header-based (X-User-Id/Role)     |

---

## ✨ Features

### 👤 Authentication & Roles

- Welcome, role selection, registration flows for owners and minders
- OTP phone verification
- Identity document upload & verification
- Pending approval and account-blocked states
- Role-based access: **Owner**, **Minder**, **Support**

---

### 🐶 Pet Profiles (Owner)

- Create and manage pet profiles (breed, age, health data)
- Add health events and medical documents
- Upload pet photos

---

### 🔍 Search & Discovery (Owner)

- Search for minders by location and service type
- Filter results (medication-qualified, availability, etc.)
- View full minder profiles with services, pricing, ratings, and reviews

---

### 📅 Booking Flow (Owner)

- Select service and dates from a minder's availability calendar
- Optional meet-and-greet scheduling
- Booking summary and confirmation
- In-app payment at checkout
- View booking details and history
- Cancel bookings and raise disputes

---

### ⭐ Reviews (Owner)

- Leave a star rating and written review after a completed booking
- Reviews appear on the minder's public profile
- Duplicate submission is blocked per booking

---

### 🐾 Pet Minder Dashboard

- View incoming booking requests and accept/decline
- Manage availability calendar and services
- Submit digital visit reports after each session
- Medication checklist with proof-of-care upload
- View booking details and notifications

---

### 💬 Messaging

- In-app direct chat between owners and minders
- Accessible from the minder profile or booking context

---

### 🚨 Emergency Reporting

- Owners and minders can report incidents
- Submitted reports are reviewed by customer support

---

### 🖥️ Admin / Customer Support Dashboard

| Page       | Capability                                                  |
| ---------- | ----------------------------------------------------------- |
| Overview   | Platform-wide stats and activity summary                    |
| Users      | Manage owner/minder accounts, suspend, delete, verify       |
| Bookings   | View all bookings, intervene to cancel or change status     |
| Reviews    | Moderate flagged/pending reviews, approve or remove         |
| Disputes   | Review and resolve open disputes                            |
| Payments   | View transactions and handle refunds                        |
| Incidents  | Review emergency incident reports                           |
| Reports    | Platform-level analytics reports                            |
| Settings   | Configure platform settings                                 |

---

## 📁 Project Structure

```
Happy-Tails/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Full database schema
│   │   └── data.sql            # Seed data
│   └── server/
│       ├── server.js           # HTTP server entry point
│       ├── router.js           # Lightweight route matcher
│       ├── db.js               # MySQL connection pool
│       ├── lib/
│       │   └── helpers.js      # Auth helpers, UUID, role checks
│       └── routes/
│           ├── auth.js         # Register, login, OTP, identity
│           ├── users.js        # User management (admin)
│           ├── minders.js      # Minder profiles, services, calendar
│           ├── bookings.js     # Booking CRUD
│           ├── reviews.js      # Submit, fetch, flag, moderate reviews
│           ├── disputes.js     # Raise and resolve disputes
│           ├── payments.js     # Payments and refunds
│           ├── reports.js      # Visit reports
│           ├── messages.js     # Chat messages
│           ├── notifications.js
│           ├── pets.js         # Pet profiles and health data
│           └── admin.js        # Admin-only overrides
│
├── frontend/
│   ├── mobile/                 # Pet owner & minder web app (Vite)
│   │   └── src/screens/
│   │       ├── Auth/           # Login, register, OTP, identity
│   │       ├── Booking Flow/   # Full booking journey
│   │       ├── Pet Owner - Pets/
│   │       ├── Search & Discovery/
│   │       ├── Pet Minder/     # Minder dashboard & tools
│   │       ├── messaging/      # Chat UI
│   │       ├── Emergency/      # Incident reporting
│   │       └── profile/
│   │
│   └── desktop/                # Admin/CS dashboard (Vite)
│       └── src/dashboard/pages/
│           ├── overview/
│           ├── users/
│           ├── booking/
│           ├── review/
│           ├── disputes/
│           ├── payments/
│           ├── incidents/
│           ├── reports/
│           └── settings/
│
└── README.md
```

---

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js v18+
- MySQL 8+
- A modern browser (Chrome, Firefox, Edge)

---

### 🗄️ Database Setup

Run the schema and seed files in MySQL Workbench or your SQL tool of choice:

```sql
CREATE DATABASE IF NOT EXISTS happytails;
USE happytails;
-- Run backend/database/schema.sql, then backend/database/data.sql
```

---

### ⚙️ Backend

```bash
cd backend

# Install dependencies
npm install

# Create a .env file
cp .env.example .env   # or create manually (see below)

# Start in development mode (auto-restarts on file changes)
npm run dev

# Or start normally
npm start
```

**`.env` configuration:**

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=happytails
API_PORT=3000
```

> `API_PORT` must not be `3306`. The server defaults to `3000` if a conflict is detected.

---

### 📱 Mobile App

```bash
cd frontend/mobile

npm install
npm run dev
```

Opens at `http://localhost:5173` by default.

---

### 🖥️ Desktop Admin Dashboard

```bash
cd frontend/desktop

npm install
npm run dev
```

Opens at `http://localhost:5174` by default (or the next available port).

---

### 🔌 How The Backend Works

- `server/server.js` — creates the Node HTTP server and loads all route modules
- `server/router.js` — lightweight route matching with path params, query parsing, and JSON body parsing (no Express)
- `server/db.js` — MySQL connection pool with a startup health check (`SELECT 1`)
- Route handlers in `server/routes/` read `X-User-Id` and `X-User-Role` headers for authentication and authorisation

### ✅ Quick API Check

```http
GET http://localhost:3000/api/bookings
X-User-Id: <userID>
X-User-Role: owner
```

Returns all bookings for the authenticated user as a JSON array.

---

## 🗃️ Database Schema (Key Tables)

| Table                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `USER` / `USER_PROFILE`| Core account and profile data           |
| `PET_OWNER`            | Owner-specific profile                  |
| `PET_MINDER`           | Minder profile, rating, verification    |
| `CUSTOMER_SUPPORT`     | Support staff accounts                  |
| `PET_PROFILE`          | Pet details, health data, photos        |
| `MINDER_SERVICE`       | Services offered and custom pricing     |
| `CALENDAR` / `SLOT`    | Minder availability                     |
| `BOOKING`              | Booking records                         |
| `MEET_AND_GREET`       | Pre-booking meetings                    |
| `VISIT_REPORT`         | Post-session reports from minders       |
| `CONVERSATION` / `MESSAGE` | In-app messaging                    |
| `REVIEW` / `REVIEW_FLAG`   | Reviews and moderation flags        |
| `DISPUTE`              | Owner-raised disputes                   |
| `INCIDENT_REPORT`      | Emergency incident reports              |
| `PAYMENT` / `REFUND`   | Transaction and refund records          |
| `NOTIFICATION`         | In-app notifications                    |
| `IDENTITY_VERIFICATION`| Minder identity check records           |

---

## 🔄 User Flow

![User_Flow](/README_images/user_flow.png)

---

## 👨‍💻 Contributors

Group 16 – ECS506U Software Engineering Project, Queen Mary University of London
