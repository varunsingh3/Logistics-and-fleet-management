const bcrypt = require('bcryptjs');

class MemoryCollection {
  constructor(name, initialData = []) {
    this.name = name;
    this.data = [];
    this.idCounter = 1;
    if (initialData.length > 0) {
      initialData.forEach((item) => this.insert(item));
    }
  }

  _generateId() {
    const hex = (this.idCounter++).toString(16).padStart(24, '0');
    return hex;
  }

  _wrap(doc) {
    if (!doc) return null;
    const wrapped = { ...doc };

    // Add save method for Mongoose compatibility
    wrapped.save = async () => {
      const idx = this.data.findIndex((d) => d._id === wrapped._id);
      if (idx !== -1) {
        this.data[idx] = { ...wrapped };
      }
      return wrapped;
    };

    // User comparePassword method
    if (this.name === 'User' && wrapped.password) {
      wrapped.comparePassword = async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      };
      wrapped.toJSON = function () {
        const copy = { ...this };
        delete copy.password;
        delete copy.save;
        delete copy.comparePassword;
        delete copy.toJSON;
        return copy;
      };
    }

    return wrapped;
  }

  insert(doc) {
    const _id = doc._id || this._generateId();
    const item = {
      ...doc,
      _id: _id.toString(),
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
    this.data.push(item);
    return this._wrap(item);
  }

  async create(doc) {
    const payload = Array.isArray(doc) ? doc : [doc];
    const created = [];

    for (const d of payload) {
      const copy = { ...d };
      // Hash password if User model
      if (this.name === 'User' && copy.password && !copy.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        copy.password = await bcrypt.hash(copy.password, salt);
      }
      const item = this.insert(copy);
      created.push(item);
    }

    return Array.isArray(doc) ? created : created[0];
  }

  async insertMany(docs) {
    return await this.create(docs);
  }

  _match(item, query = {}) {
    if (!query || Object.keys(query).length === 0) return true;

    for (const [key, val] of Object.entries(query)) {
      if (key === '$or' && Array.isArray(val)) {
        const anyMatch = val.some((subQuery) => this._match(item, subQuery));
        if (!anyMatch) return false;
        continue;
      }

      if (key === 'status' && typeof val === 'object' && val.$in) {
        if (!val.$in.includes(item.status)) return false;
        continue;
      }

      const itemVal = item[key];

      if (val instanceof RegExp) {
        if (!val.test(itemVal || '')) return false;
      } else if (typeof val === 'string') {
        if ((itemVal || '').toString().toLowerCase() !== val.toLowerCase()) return false;
      } else if (itemVal !== val) {
        return false;
      }
    }

    return true;
  }

  find(query = {}) {
    const results = this.data.filter((item) => this._match(item, query));
    const wrappedResults = results.map((r) => this._wrap(r));

    // Support chainable methods: .sort(), .limit(), .populate()
    wrappedResults.sort = function (sortOpt = {}) {
      if (sortOpt.createdAt === -1) {
        return wrappedResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      if (sortOpt.timestamp === -1) {
        return wrappedResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return wrappedResults;
    };

    wrappedResults.limit = function (num) {
      return wrappedResults.slice(0, num);
    };

    wrappedResults.populate = function () {
      return wrappedResults;
    };

    return wrappedResults;
  }

  findOne(query = {}) {
    const item = this.data.find((d) => this._match(d, query));
    const wrapped = this._wrap(item);
    const promise = Promise.resolve(wrapped);
    promise.select = function (sel) {
      if (wrapped && sel === '-password' && wrapped.password) {
        const c = { ...wrapped };
        delete c.password;
        return Promise.resolve(c);
      }
      return Promise.resolve(wrapped);
    };
    return promise;
  }

  findById(id) {
    if (!id) {
      const p = Promise.resolve(null);
      p.select = () => Promise.resolve(null);
      return p;
    }
    const strId = id.toString();
    const item = this.data.find((d) => d._id === strId);
    const wrapped = this._wrap(item);

    const promise = Promise.resolve(wrapped);
    promise.select = function (sel) {
      if (wrapped && sel === '-password' && wrapped.password) {
        const c = { ...wrapped };
        delete c.password;
        return Promise.resolve(c);
      }
      return Promise.resolve(wrapped);
    };

    return promise;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const strId = id.toString();
    const idx = this.data.findIndex((d) => d._id === strId);
    if (idx === -1) return null;

    this.data[idx] = {
      ...this.data[idx],
      ...update,
      updatedAt: new Date(),
    };

    return this._wrap(this.data[idx]);
  }

  async findByIdAndDelete(id) {
    const strId = id.toString();
    const idx = this.data.findIndex((d) => d._id === strId);
    if (idx === -1) return null;
    const [deleted] = this.data.splice(idx, 1);
    return this._wrap(deleted);
  }

  async findOneAndDelete(query = {}) {
    const idx = this.data.findIndex((d) => this._match(d, query));
    if (idx === -1) return null;
    const [deleted] = this.data.splice(idx, 1);
    return this._wrap(deleted);
  }

  async countDocuments(query = {}) {
    return this.data.filter((item) => this._match(item, query)).length;
  }

  async deleteMany() {
    this.data = [];
    return { acknowledged: true, deletedCount: 0 };
  }
}

// Initial Seed Data for Memory Store
const initialUsers = [
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

const initialVehicles = [
  { vehicleId: 'LF-001', name: 'Tata Truck', driver: 'Rahul Sharma', location: 'Delhi', status: 'Active', type: 'Heavy Truck', capacity: 8000, fuelLevel: 88, licensePlate: 'DL-01-EA-1001' },
  { vehicleId: 'LF-002', name: 'Ashok Leyland', driver: 'Amit Kumar', location: 'Noida', status: 'Active', type: 'Container', capacity: 12000, fuelLevel: 74, licensePlate: 'UP-16-AB-2002' },
  { vehicleId: 'LF-003', name: 'Mahindra Bolero', driver: 'Ravi Singh', location: 'Ghaziabad', status: 'Active', type: 'Pickup', capacity: 2500, fuelLevel: 92, licensePlate: 'UP-14-CD-3003' },
  { vehicleId: 'LF-004', name: 'Delivery Van', driver: 'Vikas Yadav', location: 'Delhi', status: 'Active', type: 'Van', capacity: 1500, fuelLevel: 65, licensePlate: 'DL-04-VF-4004' },
  { vehicleId: 'LF-005', name: 'Eicher Pro 3015', driver: 'Sunita Devi', location: 'Faridabad', status: 'In Maintenance', type: 'Medium Truck', capacity: 6000, fuelLevel: 45, licensePlate: 'HR-51-EF-5005' },
  { vehicleId: 'LF-006', name: 'BharatBenz 2823', driver: 'Manoj Verma', location: 'Greater Noida', status: 'Available', type: 'Heavy Truck', capacity: 14000, fuelLevel: 100, licensePlate: 'UP-16-GH-6006' },
];

const initialWarehouses = [
  { warehouseId: 'WH-001', name: 'Central Warehouse', location: 'Delhi', capacity: 10000, stock: 8420, status: 'Active', manager: 'Sanjay Gupta', incomingToday: 120, lowStockCount: 4 },
  { warehouseId: 'WH-002', name: 'North Warehouse', location: 'Noida', capacity: 8000, stock: 6250, status: 'Active', manager: 'Neha Sharma', incomingToday: 95, lowStockCount: 2 },
  { warehouseId: 'WH-003', name: 'East Warehouse', location: 'Ghaziabad', capacity: 6000, stock: 5810, status: 'Low Space', manager: 'Rajesh Patel', incomingToday: 45, lowStockCount: 12 },
  { warehouseId: 'WH-004', name: 'South Warehouse', location: 'Greater Noida', capacity: 7500, stock: 4200, status: 'Active', manager: 'Deepak Rao', incomingToday: 60, lowStockCount: 0 },
];

const initialShipments = [
  {
    shipmentId: 'SHP-1001',
    customer: 'ABC Electronics',
    origin: 'Central Hub, Delhi',
    destination: 'Delhi',
    driver: 'Rahul Sharma',
    vehicle: 'LF-001',
    status: 'In Transit',
    timeline: [
      { status: 'Order Created', location: 'Central Hub, Delhi', timestamp: new Date(Date.now() - 6 * 3600000), notes: 'Goods verified and packed' },
      { status: 'Dispatched', location: 'Delhi Hub', timestamp: new Date(Date.now() - 4 * 3600000), notes: 'Handed over to Rahul Sharma' },
      { status: 'In Transit', location: 'Ring Road, Delhi', timestamp: new Date(Date.now() - 10 * 60000), notes: 'On schedule for delivery' },
    ],
  },
  {
    shipmentId: 'SHP-1002',
    customer: 'XYZ Traders',
    origin: 'Central Hub, Delhi',
    destination: 'Noida',
    driver: 'Amit Kumar',
    vehicle: 'LF-002',
    status: 'Delivered',
    timeline: [
      { status: 'Dispatched', location: 'Delhi Hub', timestamp: new Date(Date.now() - 8 * 3600000), notes: 'Loaded on truck LF-002' },
      { status: 'In Transit', location: 'DND Flyway', timestamp: new Date(Date.now() - 5 * 3600000), notes: 'Approaching Sector 62' },
      { status: 'Delivered', location: 'Sector 62, Noida', timestamp: new Date(Date.now() - 1 * 3600000), notes: 'Signed by recipient store lead' },
    ],
  },
  {
    shipmentId: 'SHP-1003',
    customer: 'Global Stores',
    origin: 'Central Hub, Delhi',
    destination: 'Ghaziabad',
    driver: 'Ravi Singh',
    vehicle: 'LF-003',
    status: 'Pending',
    timeline: [
      { status: 'Pending', location: 'Central Hub, Delhi', timestamp: new Date(Date.now() - 2 * 3600000), notes: 'Awaiting dispatch clearance' },
    ],
  },
  {
    shipmentId: 'SHP-1004',
    customer: 'Metro Supplies',
    origin: 'North Warehouse, Noida',
    destination: 'Greater Noida',
    driver: 'Vikas Yadav',
    vehicle: 'LF-004',
    status: 'In Transit',
    timeline: [
      { status: 'Dispatched', location: 'North Warehouse, Noida', timestamp: new Date(Date.now() - 3 * 3600000), notes: 'Van LF-004 on route' },
      { status: 'In Transit', location: 'Noida Expressway', timestamp: new Date(Date.now() - 45 * 60000), notes: 'ETA 45 mins' },
    ],
  },
  {
    shipmentId: 'SHP-1005',
    customer: 'Apex Logistics',
    origin: 'Central Hub, Delhi',
    destination: 'Faridabad',
    driver: 'Manoj Verma',
    vehicle: 'LF-006',
    status: 'Delivered',
    timeline: [
      { status: 'Delivered', location: 'Sector 15, Faridabad', timestamp: new Date(Date.now() - 5 * 3600000), notes: 'Delivered safely' },
    ],
  },
];

const todayStr = new Date().toISOString().split('T')[0];
const initialRoutes = [
  { routeId: 'LF-101', origin: 'Delhi', destination: 'Noida', departureTime: '08:00 AM', arrivalTime: '09:00 AM', duration: '1 hour', totalSeats: 40, availableSeats: 24, price: 150, date: todayStr, status: 'Scheduled' },
  { routeId: 'LF-205', origin: 'Noida', destination: 'Ghaziabad', departureTime: '10:30 AM', arrivalTime: '11:30 AM', duration: '1 hour', totalSeats: 40, availableSeats: 18, price: 120, date: todayStr, status: 'Scheduled' },
  { routeId: 'LF-310', origin: 'Delhi', destination: 'Greater Noida', departureTime: '01:00 PM', arrivalTime: '02:30 PM', duration: '1.5 hours', totalSeats: 45, availableSeats: 32, price: 200, date: todayStr, status: 'Scheduled' },
  { routeId: 'LF-405', origin: 'Delhi', destination: 'Faridabad', departureTime: '03:30 PM', arrivalTime: '04:30 PM', duration: '1 hour', totalSeats: 35, availableSeats: 15, price: 140, date: todayStr, status: 'Scheduled' },
  { routeId: 'LF-501', origin: 'Noida', destination: 'Delhi', departureTime: '05:00 PM', arrivalTime: '06:00 PM', duration: '1 hour', totalSeats: 40, availableSeats: 20, price: 150, date: todayStr, status: 'Scheduled' },
  { routeId: 'LF-602', origin: 'Ghaziabad', destination: 'Delhi', departureTime: '07:00 PM', arrivalTime: '08:00 PM', duration: '1 hour', totalSeats: 40, availableSeats: 27, price: 130, date: todayStr, status: 'Scheduled' },
];

const initialActivities = [
  { title: 'Shipment SHP-1001 dispatched', description: 'Assigned to driver Rahul Sharma with Tata Truck LF-001', type: 'shipment', dotColor: '#20b9f1', timestamp: new Date(Date.now() - 10 * 60000) },
  { title: 'Vehicle LF-003 assigned', description: 'Mahindra Bolero assigned to Ghaziabad delivery corridor', type: 'vehicle', dotColor: '#2867e8', timestamp: new Date(Date.now() - 25 * 60000) },
  { title: 'Warehouse WH-002 updated', description: 'Incoming batch of 95 units received at North Warehouse', type: 'warehouse', dotColor: '#10b981', timestamp: new Date(Date.now() - 60 * 60000) },
  { title: 'Route LF-205 scheduled', description: 'New daily transport scheduled between Noida and Ghaziabad', type: 'route', dotColor: '#f59e0b', timestamp: new Date(Date.now() - 120 * 60000) },
];

// Initialize Memory Collections
const memoryStore = {
  User: new MemoryCollection('User', []),
  Vehicle: new MemoryCollection('Vehicle', initialVehicles),
  Warehouse: new MemoryCollection('Warehouse', initialWarehouses),
  Shipment: new MemoryCollection('Shipment', initialShipments),
  Route: new MemoryCollection('Route', initialRoutes),
  Booking: new MemoryCollection('Booking', []),
  Activity: new MemoryCollection('Activity', initialActivities),
};

// Seed initial users with real bcrypt hashes asynchronously
(async () => {
  for (const u of initialUsers) {
    await memoryStore.User.create(u);
  }
})();

module.exports = memoryStore;
