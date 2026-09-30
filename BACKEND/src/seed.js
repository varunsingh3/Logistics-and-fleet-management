require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Warehouse = require('./models/Warehouse');
const Shipment = require('./models/Shipment');
const Route = require('./models/Route');
const Booking = require('./models/Booking');
const Activity = require('./models/Activity');

const seedData = async () => {
  console.log('[Seed] Starting database seed process...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[Seed] Could not connect to database. Aborting seed.');
    process.exit(1);
  }

  try {
    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Warehouse.deleteMany({}),
      Shipment.deleteMany({}),
      Route.deleteMany({}),
      Booking.deleteMany({}),
      Activity.deleteMany({}),
    ]);

    // 1. Seed Users (with hashed passwords via pre-save hooks)
    console.log('[Seed] Seeding users...');
    const users = [
      {
        name: 'Varun Singh',
        email: 'varunsingh123@gmail.com',
        password: 'varun123',
        role: 'admin',
        phone: '+91 98765 43210',
      },
      {
        name: 'System Admin',
        email: 'admin@logifleet.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91 98111 22233',
      },
      {
        name: 'Fleet Manager',
        email: 'manager@logifleet.com',
        password: 'manager123',
        role: 'manager',
        phone: '+91 98222 33344',
      },
      {
        name: 'Standard User',
        email: 'user@logifleet.com',
        password: 'user123',
        role: 'user',
        phone: '+91 98333 44455',
      },
    ];

    for (const u of users) {
      await User.create(u);
    }

    // 2. Seed Vehicles
    console.log('[Seed] Seeding fleet vehicles...');
    await Vehicle.insertMany([
      {
        vehicleId: 'LF-001',
        name: 'Tata Truck',
        driver: 'Rahul Sharma',
        location: 'Delhi',
        status: 'Active',
        type: 'Heavy Truck',
        capacity: 8000,
        fuelLevel: 88,
        licensePlate: 'DL-01-EA-1001',
      },
      {
        vehicleId: 'LF-002',
        name: 'Ashok Leyland',
        driver: 'Amit Kumar',
        location: 'Noida',
        status: 'Active',
        type: 'Container',
        capacity: 12000,
        fuelLevel: 74,
        licensePlate: 'UP-16-AB-2002',
      },
      {
        vehicleId: 'LF-003',
        name: 'Mahindra Bolero',
        driver: 'Ravi Singh',
        location: 'Ghaziabad',
        status: 'Active',
        type: 'Pickup',
        capacity: 2500,
        fuelLevel: 92,
        licensePlate: 'UP-14-CD-3003',
      },
      {
        vehicleId: 'LF-004',
        name: 'Delivery Van',
        driver: 'Vikas Yadav',
        location: 'Delhi',
        status: 'Active',
        type: 'Van',
        capacity: 1500,
        fuelLevel: 65,
        licensePlate: 'DL-04-VF-4004',
      },
      {
        vehicleId: 'LF-005',
        name: 'Eicher Pro 3015',
        driver: 'Sunita Devi',
        location: 'Faridabad',
        status: 'In Maintenance',
        type: 'Medium Truck',
        capacity: 6000,
        fuelLevel: 45,
        licensePlate: 'HR-51-EF-5005',
      },
      {
        vehicleId: 'LF-006',
        name: 'BharatBenz 2823',
        driver: 'Manoj Verma',
        location: 'Greater Noida',
        status: 'Available',
        type: 'Heavy Truck',
        capacity: 14000,
        fuelLevel: 100,
        licensePlate: 'UP-16-GH-6006',
      },
    ]);

    // 3. Seed Warehouses
    console.log('[Seed] Seeding warehouses...');
    await Warehouse.insertMany([
      {
        warehouseId: 'WH-001',
        name: 'Central Warehouse',
        location: 'Delhi',
        capacity: 10000,
        stock: 8420,
        status: 'Active',
        manager: 'Sanjay Gupta',
        incomingToday: 120,
        lowStockCount: 4,
        contactNumber: '+91 11 2345 6789',
      },
      {
        warehouseId: 'WH-002',
        name: 'North Warehouse',
        location: 'Noida',
        capacity: 8000,
        stock: 6250,
        status: 'Active',
        manager: 'Neha Sharma',
        incomingToday: 95,
        lowStockCount: 2,
        contactNumber: '+91 120 456 7890',
      },
      {
        warehouseId: 'WH-003',
        name: 'East Warehouse',
        location: 'Ghaziabad',
        capacity: 6000,
        stock: 5810,
        status: 'Low Space',
        manager: 'Rajesh Patel',
        incomingToday: 45,
        lowStockCount: 12,
        contactNumber: '+91 120 789 0123',
      },
      {
        warehouseId: 'WH-004',
        name: 'South Warehouse',
        location: 'Greater Noida',
        capacity: 7500,
        stock: 4200,
        status: 'Active',
        manager: 'Deepak Rao',
        incomingToday: 60,
        lowStockCount: 0,
        contactNumber: '+91 120 890 1234',
      },
    ]);

    // 4. Seed Shipments
    console.log('[Seed] Seeding shipments...');
    await Shipment.insertMany([
      {
        shipmentId: 'SHP-1001',
        customer: 'ABC Electronics',
        origin: 'Central Hub, Delhi',
        destination: 'Delhi',
        driver: 'Rahul Sharma',
        vehicle: 'LF-001',
        status: 'In Transit',
        items: [{ description: 'High-end Monitors & Parts', quantity: 45, weightKg: 350 }],
        timeline: [
          { status: 'Order Created', location: 'Central Hub, Delhi', timestamp: new Date(Date.now() - 6 * 3600000), notes: 'Goods verified and packed' },
          { status: 'Dispatched', location: 'Delhi Hub', timestamp: new Date(Date.now() - 4 * 3600000), notes: 'Handed over to Rahul Sharma' },
          { status: 'In Transit', location: 'Ring Road, Delhi', timestamp: new Date(Date.now() - 10 * 60000), notes: 'On schedule for delivery' },
        ],
        estimatedDelivery: new Date(Date.now() + 2 * 3600000),
      },
      {
        shipmentId: 'SHP-1002',
        customer: 'XYZ Traders',
        origin: 'Central Hub, Delhi',
        destination: 'Noida',
        driver: 'Amit Kumar',
        vehicle: 'LF-002',
        status: 'Delivered',
        items: [{ description: 'Industrial Fasteners', quantity: 200, weightKg: 1200 }],
        timeline: [
          { status: 'Dispatched', location: 'Delhi Hub', timestamp: new Date(Date.now() - 8 * 3600000), notes: 'Loaded on truck LF-002' },
          { status: 'In Transit', location: 'DND Flyway', timestamp: new Date(Date.now() - 5 * 3600000), notes: 'Approaching Sector 62' },
          { status: 'Delivered', location: 'Sector 62, Noida', timestamp: new Date(Date.now() - 1 * 3600000), notes: 'Signed by recipient store lead' },
        ],
        estimatedDelivery: new Date(Date.now() - 2 * 3600000),
        actualDelivery: new Date(Date.now() - 1 * 3600000),
      },
      {
        shipmentId: 'SHP-1003',
        customer: 'Global Stores',
        origin: 'Central Hub, Delhi',
        destination: 'Ghaziabad',
        driver: 'Ravi Singh',
        vehicle: 'LF-003',
        status: 'Pending',
        items: [{ description: 'Retail Apparel Cartons', quantity: 80, weightKg: 400 }],
        timeline: [
          { status: 'Pending', location: 'Central Hub, Delhi', timestamp: new Date(Date.now() - 2 * 3600000), notes: 'Awaiting dispatch clearance' },
        ],
        estimatedDelivery: new Date(Date.now() + 6 * 3600000),
      },
      {
        shipmentId: 'SHP-1004',
        customer: 'Metro Supplies',
        origin: 'North Warehouse, Noida',
        destination: 'Greater Noida',
        driver: 'Vikas Yadav',
        vehicle: 'LF-004',
        status: 'In Transit',
        items: [{ description: 'Packaged Dry Goods', quantity: 150, weightKg: 650 }],
        timeline: [
          { status: 'Dispatched', location: 'North Warehouse, Noida', timestamp: new Date(Date.now() - 3 * 3600000), notes: 'Van LF-004 on route' },
          { status: 'In Transit', location: 'Noida Expressway', timestamp: new Date(Date.now() - 45 * 60000), notes: 'ETA 45 mins' },
        ],
        estimatedDelivery: new Date(Date.now() + 1 * 3600000),
      },
      {
        shipmentId: 'SHP-1005',
        customer: 'Apex Logistics',
        origin: 'Central Hub, Delhi',
        destination: 'Faridabad',
        driver: 'Manoj Verma',
        vehicle: 'LF-006',
        status: 'Delivered',
        items: [{ description: 'Automotive Spares', quantity: 30, weightKg: 900 }],
        timeline: [
          { status: 'Delivered', location: 'Sector 15, Faridabad', timestamp: new Date(Date.now() - 5 * 3600000), notes: 'Delivered with digital receipt' },
        ],
        estimatedDelivery: new Date(Date.now() - 6 * 3600000),
        actualDelivery: new Date(Date.now() - 5 * 3600000),
      },
    ]);

    // 5. Seed Transport Routes
    console.log('[Seed] Seeding transport routes...');
    const today = new Date().toISOString().split('T')[0];
    await Route.insertMany([
      {
        routeId: 'LF-101',
        origin: 'Delhi',
        destination: 'Noida',
        departureTime: '08:00 AM',
        arrivalTime: '09:00 AM',
        duration: '1 hour',
        totalSeats: 40,
        availableSeats: 24,
        price: 150,
        busNumber: 'DL-01-AB-1010',
        date: today,
        status: 'Scheduled',
      },
      {
        routeId: 'LF-205',
        origin: 'Noida',
        destination: 'Ghaziabad',
        departureTime: '10:30 AM',
        arrivalTime: '11:30 AM',
        duration: '1 hour',
        totalSeats: 40,
        availableSeats: 18,
        price: 120,
        busNumber: 'UP-16-CD-2050',
        date: today,
        status: 'Scheduled',
      },
      {
        routeId: 'LF-310',
        origin: 'Delhi',
        destination: 'Greater Noida',
        departureTime: '01:00 PM',
        arrivalTime: '02:30 PM',
        duration: '1.5 hours',
        totalSeats: 45,
        availableSeats: 32,
        price: 200,
        busNumber: 'DL-02-EF-3100',
        date: today,
        status: 'Scheduled',
      },
      {
        routeId: 'LF-405',
        origin: 'Delhi',
        destination: 'Faridabad',
        departureTime: '03:30 PM',
        arrivalTime: '04:30 PM',
        duration: '1 hour',
        totalSeats: 35,
        availableSeats: 15,
        price: 140,
        busNumber: 'DL-03-GH-4050',
        date: today,
        status: 'Scheduled',
      },
      {
        routeId: 'LF-501',
        origin: 'Noida',
        destination: 'Delhi',
        departureTime: '05:00 PM',
        arrivalTime: '06:00 PM',
        duration: '1 hour',
        totalSeats: 40,
        availableSeats: 20,
        price: 150,
        busNumber: 'UP-16-IJ-5010',
        date: today,
        status: 'Scheduled',
      },
      {
        routeId: 'LF-602',
        origin: 'Ghaziabad',
        destination: 'Delhi',
        departureTime: '07:00 PM',
        arrivalTime: '08:00 PM',
        duration: '1 hour',
        totalSeats: 40,
        availableSeats: 27,
        price: 130,
        busNumber: 'UP-14-KL-6020',
        date: today,
        status: 'Scheduled',
      },
    ]);

    // 6. Seed Recent Activities
    console.log('[Seed] Seeding activity feed...');
    await Activity.insertMany([
      {
        title: 'Shipment SHP-1001 dispatched',
        description: 'Assigned to driver Rahul Sharma with Tata Truck LF-001',
        type: 'shipment',
        dotColor: '#20b9f1',
        timestamp: new Date(Date.now() - 10 * 60000),
      },
      {
        title: 'Vehicle LF-003 assigned',
        description: 'Mahindra Bolero assigned to Ghaziabad delivery corridor',
        type: 'vehicle',
        dotColor: '#2867e8',
        timestamp: new Date(Date.now() - 25 * 60000),
      },
      {
        title: 'Warehouse WH-002 updated',
        description: 'Incoming batch of 95 units received at North Warehouse',
        type: 'warehouse',
        dotColor: '#10b981',
        timestamp: new Date(Date.now() - 60 * 60000),
      },
      {
        title: 'Route LF-205 scheduled',
        description: 'New daily transport scheduled between Noida and Ghaziabad',
        type: 'route',
        dotColor: '#f59e0b',
        timestamp: new Date(Date.now() - 120 * 60000),
      },
    ]);

    console.log('[Seed] Database seeded successfully!');
    console.log('\n=============================================');
    console.log('       DEFAULT LOGIN CREDENTIALS');
    console.log('=============================================');
    console.log('Admin (Original Demo): varunsingh123@gmail.com / varun123');
    console.log('System Admin:          admin@logifleet.com / admin123');
    console.log('Fleet Manager:         manager@logifleet.com / manager123');
    console.log('Standard User:         user@logifleet.com / user123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
