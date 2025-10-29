Markdown# 🚀 **Smart Attendance — Face Recognition + SMS Notifications**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)](#)

A **modern attendance system** that uses **face recognition** to mark students and **Twilio SMS** to notify them. This repository contains a **Node.js + Express backend**, a browser-based face recognition frontend (**face-api.js**), and specialized utilities for attendance sessions and notifications.

## ✨ Why This Project?

Manual attendance is **slow**, **error-prone**, and **difficult to audit**. This project automates the process using cutting-edge **face recognition** and delivers immediate **SMS notifications** so students are instantly aware of their attendance status. It dramatically **saves time for faculty** and **improves transparency**.

---

## 🌟 Key Features

* **Facial Recognition:** Webcam-based face marking (client-side using **face-api.js**) with an option for server-side processing.
* **Teacher & Admin Control:** Supports **manual marking** and teacher override capabilities.
* **Bulk Processing:** **Bulk attendance sessions** via file upload.
* **Auditable Records:** Comprehensive `AttendanceSession` records with easy-to-audit present/absent arrays.
* **Instant Notifications:** **Twilio-based SMS notifications** (configurable via the `SEND_SMS` environment flag).
* **Simple Interface:** Intuitive **Admin**, **Teacher**, and **Student** views (built with HTML + JS).
* **Extensible Architecture:** Clean code with pluggable models and a dedicated notification utility.

---

## 📸 Screenshots

### Login
![Login](screenshots/Login.png)

### Admin
![Admin dashboard](screenshots/Admin-Dashboard.png)

### Teacher (dashboard & marking)
![Teacher dashboard](screenshots/Teacher-Dashboard.png)
![Teacher mark attendance](screenshots/Teacher-MarkAttendace.png)

### Student (attendance & profile)
![Student attendance](screenshots/Student-Attendance.png)
![Student profile](screenshots/Student-Profile.png)

> **Pro-Tip:** Keep filenames simple (lowercase or consistent case), use PNG or JPG formats, and keep widths around 800–1200px for good GitHub rendering. Update the image paths if you move screenshots.

---

## 🛠️ Quick Start — Run Locally (Windows PowerShell)

### Prerequisites

You'll need the following installed:

* **Node.js** **14+** or later
* **PostgreSQL** server (local or remote)
* **npm**
* (Optional) **Redis** for future job queue integration

### 1. Clone and install

```powershell
cd "D:\update function done"
cd backend
npm install
```

### 2. Create / configure `.env`

Copy `.env.example` to `.env` (create the file if it does not exist) and set the values appropriate for your environment. Example:

```text
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1xxx
SEND_SMS=true
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgres://dbuser:dbpass@localhost:5432/attendance_db
PORT=3000
```

### 3. Restore the database (if you received a backup)

If you received a plain SQL file (`backup.sql`):

```powershell
# create the database (replace <dbuser> and <dbname>)
psql -U <dbuser> -c "CREATE DATABASE attendance_db;"
# restore the SQL into the database
psql -U <dbuser> -d attendance_db -f "path\to\backup.sql"
```

If you received a custom-format dump (`backup.dump`):

```powershell
pg_restore -U <dbuser> -d attendance_db -v "path\to\backup.dump"
```

Notes:
- Replace `<dbuser>` with your Postgres username. The command may prompt for a password.
- If you use `DATABASE_URL`, Sequelize will connect using that and you may not need to pass credentials on the CLI.

### 4. Start the backend

```powershell
# development server
node server.js
# or with automatic restarts
npx nodemon server.js
```

### 5. Open the frontend

Open the login page in your browser, for example:

http://localhost:3000/pages/login.html

---

## ⚙️ Environment variables (summary)

- `DATABASE_URL` — Postgres connection string (preferred)
- `PORT` — server port (default: 3000)
- `JWT_SECRET` — secret for JWT signing
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — Twilio credentials
- `SEND_SMS` — true/false toggle for sending SMS in non-prod

---