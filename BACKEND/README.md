# LogiFleet REST API Backend

Built with **Node.js, Express.js, MongoDB/Mongoose, JWT, bcryptjs, CORS, dotenv, and Nodemon**.

Please refer to the full [Root README.md](../README.md) for detailed architectural documentation and API specs.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already created with sensible local defaults):
```bash
# In .env:
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/logifleet
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/logifleet?retryWrites=true&w=majority
JWT_SECRET=logifleet_dev_secret_key_jwt_authentication_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Run Verification Tests
```bash
node src/test/verifyBackend.js
```

---

## 🔑 Default Credentials

- **Admin (Original Demo)**: `varunsingh123@gmail.com` / `varun123`
- **System Admin**: `admin@logifleet.com` / `admin123`
- **Fleet Manager**: `manager@logifleet.com` / `manager123`
- **Standard User**: `user@logifleet.com` / `user123`
