# SportVault – Sports Equipment & Venue Management System

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

A full-stack web application for managing sports equipment and venue bookings in an institutional setting. Built with a Node.js + Express REST API backend and a vanilla HTML/CSS/JS frontend, it supports two roles — Admin and Student — with JWT-based authentication, real-time equipment tracking, and booking workflows.

---

## Features

- **Role-Based Access Control:** Separate Admin and Student portals with JWT-secured routes and bcrypt-hashed passwords.
- **Student ID Verification:** Admin pre-generates student IDs; only pre-approved IDs can register, preventing unauthorized sign-ups.
- **Equipment Management:** Admins can add, update, and retire sports equipment with availability status tracking.
- **Venue Booking:** Students browse available venues and submit booking requests; admins approve or reject them from a dashboard.
- **Maintenance Logs:** Track equipment maintenance schedules and service history to keep gear in check.
- **Reports & Analytics:** Admin dashboard surfaces booking trends and equipment utilization summaries.
- **Responsive UI:** Lightweight vanilla JS frontend with page-specific scripts — no framework overhead.
- **Secure API:** CORS-enabled Express server with dotenv config management and MySQL2 connection pooling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MySQL (via mysql2) |
| Auth | JWT (`jsonwebtoken`), bcryptjs |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Dev Tools | nodemon, dotenv |

---

## Project Structure

```
sportsvault/
├── backend/
│   ├── controllers/        # Route handler logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── equipmentController.js
│   │   └── maintenanceController.js
│   ├── middleware/         # Auth middleware (JWT verification)
│   ├── routes/             # Express route definitions
│   ├── db.js               # MySQL connection pool
│   ├── server.js           # App entry point
│   ├── setup-db.js         # DB initialization helper
│   └── package.json
├── frontend/
│   ├── html/               # Page templates
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard.html
│   │   ├── equipment.html
│   │   ├── booking.html
│   │   ├── maintenance.html
│   │   └── reports.html
│   ├── css/                # Stylesheets
│   └── js/                 # Page-specific scripts
│       ├── auth.js
│       ├── admin.js
│       ├── booking.js
│       ├── equipment.js
│       └── maintenance.js
├── database/
│   └── schema.sql          # Full MySQL schema
├── README.md
├── SETUP.md
└── workflow.txt
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyanshipanja/SportVault.git
   cd SportVault
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Create `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=sportvault
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. **Initialize the database**
   ```bash
   mysql -u root -p < database/schema.sql
   # or
   node backend/setup-db.js
   ```

5. **Start the server**
   ```bash
   npm start          # production
   npm run dev        # development (nodemon)
   ```

6. **Open the frontend**

   Navigate to `frontend/html/login.html` in your browser or serve via a static server:
   ```bash
   npx serve frontend
   ```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new student |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/equipment` | List all equipment |
| POST | `/api/equipment` | Add equipment (admin) |
| GET | `/api/bookings` | View bookings |
| POST | `/api/bookings` | Create a booking |
| PUT | `/api/bookings/:id` | Approve/reject booking (admin) |
| GET | `/api/maintenance` | List maintenance logs |
| POST | `/api/maintenance` | Log a maintenance entry |

---

## License

MIT © [Priyanshi Panja](https://github.com/priyanshipanja)
