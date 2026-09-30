const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const routeRoutes = require('./routes/routeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// Helper to resolve frontend files whether running locally or on Vercel
const getFrontendFile = (relPath) => {
  const candidates = [
    path.join(process.cwd(), relPath),
    path.join(__dirname, '../../', relPath),
    path.join(__dirname, '../', relPath),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

// Serve static assets from both cwd and relative frontendPath
const frontendPath = path.join(__dirname, '../../');
app.use(express.static(process.cwd()));
app.use(express.static(frontendPath));

// Page & asset router for Vercel and local hosting
app.use((req, res, next) => {
  // If API route that didn't match any controller
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`,
    });
  }

  // Script aliases
  if (req.path === '/api.js' || req.path === '/logifleet.js') {
    const file = getFrontendFile('logifleet.js') || getFrontendFile('api.js');
    if (file) {
      res.setHeader('Content-Type', 'application/javascript');
      return res.sendFile(file);
    }
  }

  // Remove leading slash and query params
  const cleanPath = req.path.replace(/^\//, '').split('?')[0];

  // Specific file requested directly (e.g. dashboard.html, fleet.html, etc.)
  if (cleanPath && (cleanPath.endsWith('.html') || cleanPath.endsWith('.js') || cleanPath.endsWith('.css') || cleanPath.endsWith('.ico'))) {
    const file = getFrontendFile(cleanPath);
    if (file) return res.sendFile(file);
  }

  // Friendly clean URLs mapping: /dashboard -> dashboard.html, /fleet -> fleet.html, etc.
  const pageMap = {
    '': 'index.html',
    'index': 'index.html',
    'login': 'login.html',
    'dashboard': 'dashboard.html',
    'fleet': 'fleet.html',
    'warehouse': 'warehouse.html',
    'shipments': 'shipments.html',
    'transport': 'transport.html',
  };

  const targetFile = pageMap[cleanPath] || (cleanPath ? `${cleanPath}.html` : 'index.html');
  const file = getFrontendFile(targetFile) || getFrontendFile('index.html');
  if (file) {
    return res.sendFile(file);
  }

  next();
});

// Centralized error handler
app.use(errorHandler);

// Connect to MongoDB & Start Server
const startServer = async () => {
  await connectDB();

  // If connected, check if initial seed is needed
  if (mongoose.connection.readyState === 1) {
    try {
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Auto-Seed] No users found. Initializing seed data...');
        // Auto-seed with default demo users
        const Vehicle = require('./models/Vehicle');
        const Warehouse = require('./models/Warehouse');
        const Shipment = require('./models/Shipment');
        const Route = require('./models/Route');
        const Activity = require('./models/Activity');

        await User.create([
          { name: 'Varun Singh', email: 'varunsingh123@gmail.com', password: 'varun123', role: 'admin', phone: '+91 98765 43210' },
          { name: 'System Admin', email: 'admin@logifleet.com', password: 'admin123', role: 'admin' },
          { name: 'Fleet Manager', email: 'manager@logifleet.com', password: 'manager123', role: 'manager' },
          { name: 'Standard User', email: 'user@logifleet.com', password: 'user123', role: 'user' },
        ]);

        await Vehicle.insertMany([
          { vehicleId: 'LF-001', name: 'Tata Truck', driver: 'Rahul Sharma', location: 'Delhi', status: 'Active', type: 'Heavy Truck', capacity: 8000, fuelLevel: 88 },
          { vehicleId: 'LF-002', name: 'Ashok Leyland', driver: 'Amit Kumar', location: 'Noida', status: 'Active', type: 'Container', capacity: 12000, fuelLevel: 74 },
          { vehicleId: 'LF-003', name: 'Mahindra Bolero', driver: 'Ravi Singh', location: 'Ghaziabad', status: 'Active', type: 'Pickup', capacity: 2500, fuelLevel: 92 },
          { vehicleId: 'LF-004', name: 'Delivery Van', driver: 'Vikas Yadav', location: 'Delhi', status: 'Active', type: 'Van', capacity: 1500, fuelLevel: 65 },
          { vehicleId: 'LF-005', name: 'Eicher Pro 3015', driver: 'Sunita Devi', location: 'Faridabad', status: 'In Maintenance', type: 'Medium Truck', capacity: 6000, fuelLevel: 45 },
          { vehicleId: 'LF-006', name: 'BharatBenz 2823', driver: 'Manoj Verma', location: 'Greater Noida', status: 'Available', type: 'Heavy Truck', capacity: 14000, fuelLevel: 100 },
        ]);

        await Warehouse.insertMany([
          { warehouseId: 'WH-001', name: 'Central Warehouse', location: 'Delhi', capacity: 10000, stock: 8420, status: 'Active', manager: 'Sanjay Gupta', incomingToday: 120, lowStockCount: 4 },
          { warehouseId: 'WH-002', name: 'North Warehouse', location: 'Noida', capacity: 8000, stock: 6250, status: 'Active', manager: 'Neha Sharma', incomingToday: 95, lowStockCount: 2 },
          { warehouseId: 'WH-003', name: 'East Warehouse', location: 'Ghaziabad', capacity: 6000, stock: 5810, status: 'Low Space', manager: 'Rajesh Patel', incomingToday: 45, lowStockCount: 12 },
          { warehouseId: 'WH-004', name: 'South Warehouse', location: 'Greater Noida', capacity: 7500, stock: 4200, status: 'Active', manager: 'Deepak Rao', incomingToday: 60, lowStockCount: 0 },
        ]);

        await Shipment.insertMany([
          {
            shipmentId: 'SHP-1001',
            customer: 'ABC Electronics',
            origin: 'Central Hub, Delhi',
            destination: 'Delhi',
            driver: 'Rahul Sharma',
            vehicle: 'LF-001',
            status: 'In Transit',
            timeline: [{ status: 'In Transit', location: 'Ring Road, Delhi', timestamp: new Date(), notes: 'On schedule' }],
          },
          {
            shipmentId: 'SHP-1002',
            customer: 'XYZ Traders',
            origin: 'Central Hub, Delhi',
            destination: 'Noida',
            driver: 'Amit Kumar',
            vehicle: 'LF-002',
            status: 'Delivered',
            timeline: [{ status: 'Delivered', location: 'Sector 62, Noida', timestamp: new Date(), notes: 'Signed by recipient' }],
          },
          {
            shipmentId: 'SHP-1003',
            customer: 'Global Stores',
            origin: 'Central Hub, Delhi',
            destination: 'Ghaziabad',
            driver: 'Ravi Singh',
            vehicle: 'LF-003',
            status: 'Pending',
            timeline: [{ status: 'Pending', location: 'Central Hub, Delhi', timestamp: new Date(), notes: 'Awaiting dispatch' }],
          },
          {
            shipmentId: 'SHP-1004',
            customer: 'Metro Supplies',
            origin: 'North Warehouse, Noida',
            destination: 'Greater Noida',
            driver: 'Vikas Yadav',
            vehicle: 'LF-004',
            status: 'In Transit',
            timeline: [{ status: 'In Transit', location: 'Noida Expressway', timestamp: new Date(), notes: 'ETA 45m' }],
          },
          {
            shipmentId: 'SHP-1005',
            customer: 'Apex Logistics',
            origin: 'Central Hub, Delhi',
            destination: 'Faridabad',
            driver: 'Manoj Verma',
            vehicle: 'LF-006',
            status: 'Delivered',
            timeline: [{ status: 'Delivered', location: 'Sector 15, Faridabad', timestamp: new Date(), notes: 'Delivered safely' }],
          },
        ]);

        const todayStr = new Date().toISOString().split('T')[0];
        await Route.insertMany([
          { routeId: 'LF-101', origin: 'Delhi', destination: 'Noida', departureTime: '08:00 AM', arrivalTime: '09:00 AM', duration: '1 hour', totalSeats: 40, availableSeats: 24, price: 150, date: todayStr },
          { routeId: 'LF-205', origin: 'Noida', destination: 'Ghaziabad', departureTime: '10:30 AM', arrivalTime: '11:30 AM', duration: '1 hour', totalSeats: 40, availableSeats: 18, price: 120, date: todayStr },
          { routeId: 'LF-310', origin: 'Delhi', destination: 'Greater Noida', departureTime: '01:00 PM', arrivalTime: '02:30 PM', duration: '1.5 hours', totalSeats: 45, availableSeats: 32, price: 200, date: todayStr },
          { routeId: 'LF-405', origin: 'Delhi', destination: 'Faridabad', departureTime: '03:30 PM', arrivalTime: '04:30 PM', duration: '1 hour', totalSeats: 35, availableSeats: 15, price: 140, date: todayStr },
          { routeId: 'LF-501', origin: 'Noida', destination: 'Delhi', departureTime: '05:00 PM', arrivalTime: '06:00 PM', duration: '1 hour', totalSeats: 40, availableSeats: 20, price: 150, date: todayStr },
          { routeId: 'LF-602', origin: 'Ghaziabad', destination: 'Delhi', departureTime: '07:00 PM', arrivalTime: '08:00 PM', duration: '1 hour', totalSeats: 40, availableSeats: 27, price: 130, date: todayStr },
        ]);

        await Activity.insertMany([
          { title: 'Shipment SHP-1001 dispatched', description: 'Assigned to driver Rahul Sharma with Tata Truck LF-001', type: 'shipment', dotColor: '#20b9f1', timestamp: new Date(Date.now() - 10 * 60000) },
          { title: 'Vehicle LF-003 assigned', description: 'Mahindra Bolero assigned to Ghaziabad delivery corridor', type: 'vehicle', dotColor: '#2867e8', timestamp: new Date(Date.now() - 25 * 60000) },
          { title: 'Warehouse WH-002 updated', description: 'Incoming batch of 95 units received at North Warehouse', type: 'warehouse', dotColor: '#10b981', timestamp: new Date(Date.now() - 60 * 60000) },
          { title: 'Route LF-205 scheduled', description: 'New daily transport scheduled between Noida and Ghaziabad', type: 'route', dotColor: '#f59e0b', timestamp: new Date(Date.now() - 120 * 60000) },
        ]);

        console.log('[Auto-Seed] Initial data populated successfully!');
      }
    } catch (e) {
      console.warn('[Auto-Seed Warning]:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 LogiFleet Backend Server running on port ${PORT}`);
    console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`💻 Frontend App: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
