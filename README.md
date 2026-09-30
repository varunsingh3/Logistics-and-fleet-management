# LogiFleet - Smart Logistics Management System

LogiFleet is an end-to-end logistics and supply chain management web application built with a responsive frontend and a **Node.js + Express + MongoDB** REST API backend.

---

## 🚀 Key Features

1. **Authentication & Session Management**:
   - User registration and login using JWT tokens and bcrypt password hashing.
   - Preserves original demo credentials (`varunsingh123@gmail.com` / `varun123`).
   - Quick 1-click credential fill buttons for fast testing.
   - Dynamic user badge in navbar with role indicator and logout button.

2. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full access to create, read, update, and delete all entities (Fleet, Warehouses, Shipments, Routes, Users).
   - **Manager**: Can manage Fleet, Warehouses, Shipments, and Routes.
   - **User**: View fleet, warehouses, shipments, real-time tracking, and book transport tickets.

3. **Fleet / Vehicle Management**:
   - Full CRUD operations with unique Vehicle ID validation.
   - Real-time search by ID, model, driver, and location.
   - Status filtering (`Active`, `In Maintenance`, `Available`, `Out of Service`).
   - Interactive modals for adding and editing vehicles.

4. **Warehouse Management**:
   - Warehouse CRUD with capacity and stock tracking.
   - Dynamic capacity progress bars and utilization percentages.
   - Status tracking (`Active`, `Low Space`, `Full`).

5. **Shipment Tracking & Management**:
   - Public shipment tracking by Tracking ID (e.g. `SHP-1001`) from both the home page and shipments page.
   - Complete delivery history timeline with timestamps and transit notes.
   - Shipment CRUD and real-time status transitions (`Pending` → `In Transit` → `Delivered`).

6. **Transport & Route Booking**:
   - Search buses by origin, destination, and departure date.
   - Interactive ticket booking modal with passenger details and automatic fare calculation.
   - Decrements available seats in database in real-time.
   - Route scheduling for admins and managers.

7. **Dashboard Analytics**:
   - Real-time aggregation of total vehicles, warehouses, shipments, and routes.
   - Dynamic operational metrics: Fleet Utilization %, Warehouse Capacity %, Shipment Completion %, Transport Capacity %.
   - Live activity feed populated from database event logs.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js (REST API)
- **Database**: MongoDB / MongoDB Atlas via Mongoose ODM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
- **Utilities**: `dotenv`, `cors`, `nodemon`
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Fetch API

---

## 📁 Project Structure

```
hclweb/
├── BACKEND/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection setup
│   │   ├── controllers/
│   │   │   ├── authController.js       # Register, Login, GetMe, Logout
│   │   │   ├── vehicleController.js    # Fleet CRUD & stats
│   │   │   ├── warehouseController.js  # Warehouse CRUD & capacity
│   │   │   ├── shipmentController.js   # Shipment CRUD & tracking
│   │   │   ├── routeController.js      # Transport routes & booking
│   │   │   ├── bookingController.js    # Booking cancellations
│   │   │   └── dashboardController.js  # Analytics & activity feed
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification middleware
│   │   │   ├── role.js             # RBAC authorization middleware
│   │   │   └── errorHandler.js     # Centralized error handler
│   │   ├── models/
│   │   │   ├── User.js             # User model with bcrypt pre-save
│   │   │   ├── Vehicle.js          # Fleet vehicle model
│   │   │   ├── Warehouse.js        # Warehouse model
│   │   │   ├── Shipment.js         # Shipment & timeline model
│   │   │   ├── Route.js            # Transport route model
│   │   │   ├── Booking.js          # Ticket booking model
│   │   │   └── Activity.js         # Event activity model
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /api/auth
│   │   │   ├── vehicleRoutes.js    # /api/vehicles
│   │   │   ├── warehouseRoutes.js  # /api/warehouses
│   │   │   ├── shipmentRoutes.js   # /api/shipments
│   │   │   ├── routeRoutes.js      # /api/routes
│   │   │   ├── bookingRoutes.js    # /api/bookings
│   │   │   └── dashboardRoutes.js  # /api/dashboard
│   │   ├── test/
│   │   │   └── verifyBackend.js    # Verification test suite
│   │   ├── seed.js                 # Database seed script
│   │   └── server.js               # Express application entrypoint
│   ├── .env.example
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── api.js                          # Shared frontend API client & modal helper
├── index.html                      # Landing page with public tracking
├── login.html                      # Sign in & registration page
├── dashboard.html                  # Real-time analytics dashboard
├── fleet.html                      # Fleet management page
├── warehouse.html                  # Warehouse management page
├── shipments.html                  # Shipment tracking & dispatch page
├── transport.html                  # Bus route search & ticket booking
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

A `.env.example` file is included in the `BACKEND` directory:

```env
# Server Port
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
# MongoDB Atlas format:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/logifleet?retryWrites=true&w=majority

# Local MongoDB format:
# MONGODB_URI=mongodb://127.0.0.1:27017/logifleet

# JWT Configuration
JWT_SECRET=logifleet_super_secret_jwt_key_2026_replace_in_production
JWT_EXPIRES_IN=7d

# CORS Origin
CORS_ORIGIN=*
```

---

## 🗄️ MongoDB Setup Guide

### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2. Under **Database Access**, create a database user (e.g. `logifleet_admin`) with password.
3. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect** → **Drivers (Node.js)** and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/logifleet?retryWrites=true&w=majority
   ```
5. Paste it as `MONGODB_URI` in `BACKEND/.env`.

### Option 2: Local MongoDB
1. Ensure the MongoDB service is running:
   ```powershell
   mongod --dbpath <data_directory>
   # Or via Windows Services: net start MongoDB
   ```
2. Set `MONGODB_URI=mongodb://127.0.0.1:27017/logifleet` in `BACKEND/.env`.

---

## 🚀 Installation & Run Instructions

### 1. Open Terminal in the BACKEND directory:
```bash
cd "C:\Users\singh\OneDrive\Desktop\web development\hclweb\BACKEND"
```

### 2. Install Dependencies (if not already installed):
```bash
npm install
```

### 3. Seed Database with Initial Data:
```bash
npm run seed
```
*Note: The server also auto-seeds initial data on first boot if the database is empty.*

### 4. Run the Backend Server:
**For development (with automatic restart via Nodemon):**
```bash
npm run dev
```

**For production / standard start:**
```bash
npm start
```

### 5. Open the Frontend:
You can access the frontend through any of the following:
- **Directly through the Backend server**: `http://localhost:5000`
- **Via VS Code Live Server**: `http://127.0.0.1:5500/index.html`
- **Direct file opening**: Double-click `index.html` or open in any browser.

---

## 🔑 Default Seed Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin (Original Demo)** | `varunsingh123@gmail.com` | `varun123` | Full Access (All CRUD, Users, Dashboard) |
| **System Admin** | `admin@logifleet.com` | `admin123` | Full Access (All CRUD, Users, Dashboard) |
| **Fleet Manager** | `manager@logifleet.com` | `manager123` | Manage Fleet, Warehouses, Shipments, Routes |
| **Standard User** | `user@logifleet.com` | `user123` | View Fleet/Warehouses, Track, Book Tickets |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new account (name, email, password, role) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Protected | Get profile of logged-in user |
| `POST` | `/api/auth/logout` | Protected | Logout user session |

### Fleet / Vehicles (`/api/vehicles`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/vehicles` | Public | List vehicles (supports `?search=` and `?status=`) |
| `GET` | `/api/vehicles/stats/summary` | Public | Get summary counts (total, active, maintenance, available) |
| `GET` | `/api/vehicles/:id` | Public | Get single vehicle by MongoDB ID or Vehicle ID |
| `POST` | `/api/vehicles` | Admin, Manager | Add new vehicle to fleet |
| `PUT` | `/api/vehicles/:id` | Admin, Manager | Update vehicle details |
| `DELETE` | `/api/vehicles/:id` | Admin | Delete vehicle from fleet |

### Warehouses (`/api/warehouses`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/warehouses` | Public | List warehouses (supports `?search=` and `?status=`) |
| `GET` | `/api/warehouses/stats/summary` | Public | Get summary counts (total, stock, incoming, low stock) |
| `GET` | `/api/warehouses/:id` | Public | Get warehouse by ID or Warehouse ID |
| `POST` | `/api/warehouses` | Admin, Manager | Register new warehouse |
| `PUT` | `/api/warehouses/:id` | Admin, Manager | Update warehouse stock/capacity |
| `DELETE` | `/api/warehouses/:id` | Admin | Delete warehouse |

### Shipments (`/api/shipments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/shipments` | Public | List shipments (supports `?search=` and `?status=`) |
| `GET` | `/api/shipments/stats/summary` | Public | Get summary counts (total, in transit, delivered, pending) |
| `GET` | `/api/shipments/track/:shipmentId` | Public | **Track shipment & view complete timeline** |
| `GET` | `/api/shipments/:id` | Public | Get shipment by ID |
| `POST` | `/api/shipments` | Admin, Manager | Create and schedule new shipment |
| `PUT` | `/api/shipments/:id` | Admin, Manager | Update shipment details |
| `PATCH` | `/api/shipments/:id/status` | Admin, Manager | Update status (`In Transit`, `Delivered`, etc.) & push timeline note |
| `DELETE` | `/api/shipments/:id` | Admin | Delete shipment |

### Transport & Routes (`/api/routes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/routes` | Public | Search available routes (`?from=`, `?to=`, `?date=`) |
| `GET` | `/api/routes/:id` | Public | Get single route details |
| `POST` | `/api/routes` | Admin, Manager | Schedule new transport route |
| `PUT` | `/api/routes/:id` | Admin, Manager | Update route schedule/fare |
| `DELETE` | `/api/routes/:id` | Admin | Cancel/delete route |
| `POST` | `/api/routes/:id/book` | Public/User | **Book ticket & decrement available seats** |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Public | Real-time analytics, operational percentages & activity feed |
| `POST` | `/api/dashboard/activity` | Admin, Manager | Manually log custom operation activity |

---

## 🧪 Testing

To verify the backend authentication, password encryption, role middleware, and route modules at any time, run:
```bash
node src/test/verifyBackend.js
```
Expected output:
```
Results: 14 Passed, 0 Failed
✅ ALL BACKEND LOGIC & INTEGRATIONS VERIFIED SUCCESSFULLY!
```

---

## 🛡️ Security Best Practices
- **No Hardcoded Passwords**: All database URIs, ports, and JWT secret keys reside strictly in `.env`.
- **Pre-save Password Hashing**: Passwords are never saved in plain text; salted and hashed via `bcryptjs`.
- **Token Scrubbing**: User schemas omit password hashes from all JSON API responses.
- **Input Validation**: Mongoose schemas enforce data types, email formats, and string limits.
#   L o g i s t i c s - a n d - f l e e t - m a n a g e m e n t  
 