# Umuganda Attendance and Fines Tracking System (UATS)

## Overview
UATS is a robust, full-stack web application designed to manage Umuganda (community service) attendance, automate fine management for absentees, and streamline payment tracking and analytics for Rwandan communities. It supports both administrators and citizens, providing real-time updates, payment integration, and a modern, responsive UI.

---

## Features
- **Attendance Management:**
  - Mark citizens as Present/Absent for each Umuganda session.
  - Real-time updates and synchronization across all pages and users.
- **Fines Management:**
  - Automatic fine creation for absentees, with configurable amounts.
  - Fine status (Paid/Unpaid) tracked and updated across the system.
  - Payment history and session linkage for each fine.
- **Payment Integration:**
  - Initiate and track payments via MTN MoMo and Airtel Money APIs (sandbox-ready, real API integration supported).
  - Payment status updates reflected instantly in all relevant tables and dashboards.
- **Admin Panel:**
  - Register, edit, delete citizens.
  - Create/manage Umuganda sessions.
  - View and export attendance, fines, and analytics.
  - CSV import/export for citizens and fines.
- **Citizen Dashboard:**
  - View personal attendance, fines, and payment history.
  - "Pay Now" action for unpaid fines, with payment method selection.
  - Session reminders and notifications.
- **Analytics & Reporting:**
  - Attendance trends, absentee rates, and severity analysis.
  - Exportable reports (CSV, PDF).
- **Notifications:**
  - Browser push notifications for upcoming sessions.
- **Responsive Design:**
  - Fully mobile-friendly, with adaptive navigation and tables.
- **Security:**
  - Role-based access (admin, leader, citizen).
  - Authentication and protected routes.

---

## How It Works
### 
- **Frontend:** React (TypeScript), Material-UI, React Router, Context API for state management.
- **Backend:** Node.js, Express, MongoDB (Mongoose), RESTful API.
- **Payment APIs:** MTN MoMo & Airtel Money (sandbox and real integration ready).

### Core Logic
- **Backend as Source of Truth:**
  - All attendance, fine, and payment data is persisted in MongoDB.
  - The frontend always fetches the latest data from the backend, ensuring consistency and robustness.
- **Attendance & Fines:**
  - When a citizen is marked "Absent," a fine is automatically created or updated in the backend.
  - When marked "Present," any related fine is deleted.
  - Fine status (Paid/Unpaid) is updated via payment actions and reflected everywhere.
- **Payments:**
  - Citizens can pay fines via integrated payment APIs.
  - Payment initiation triggers a backend API call to MTN/Airtel, and updates fine/payment status on success.
  - Payment history is recorded for each fine.
- **Real-Time Sync:**
  - All updates (attendance, fines, payments) are immediately reflected across all pages and users.
- **Notifications:**
  - Citizens receive browser notifications for upcoming sessions after login.

---

## Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd UATS
   ```
2. **Backend Setup:**
   - Navigate to `uats-backend/`
   - Install dependencies: `npm install`
   - Create a `.env` file with MongoDB URI and payment API credentials (see `.env.example`)
   - Start backend: `npm start` (default: http://localhost:8000)

3. **Frontend Setup:**
   - Navigate to `uats-frontend/`
   - Install dependencies: `npm install`
   - Start frontend: `npm start` (default: http://localhost:3000)
4. **Access the app:**
   - Open http://localhost:3000 in your browser.

---

## Usage Guide
### Admin Flow
- Login as admin (default: username `admin`, password as set in DB).
- Register citizens, create sessions, manage attendance and fines.
- Export/import data, view analytics, and manage payments.

### Citizen Flow
- Login with your National ID and password.
- View your attendance, fines, and payment history.
- Pay fines directly from your dashboard.
- Receive notifications for upcoming sessions.


Enjoy using the Umuganda Attendance and Fines Tracking System! 