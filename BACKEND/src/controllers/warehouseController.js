const Warehouse = require('../models/Warehouse');
const Activity = require('../models/Activity');

// @desc   Get all warehouses with search and filter
// @route  GET /api/warehouses
// @access Public / Authenticated
const getWarehouses = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { warehouseId: searchRegex },
        { name: searchRegex },
        { location: searchRegex },
        { manager: searchRegex },
      ];
    }

    const warehouses = await Warehouse.find(query).sort({ warehouseId: 1 });

    res.status(200).json({
      success: true,
      count: warehouses.length,
      data: warehouses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get warehouse summary stats
// @route  GET /api/warehouses/stats/summary
// @access Public / Authenticated
const getWarehouseStats = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find();

    const totalWarehouses = warehouses.length;
    const totalProducts = warehouses.reduce((acc, wh) => acc + (wh.stock || 0), 0);
    const incoming = warehouses.reduce((acc, wh) => acc + (wh.incomingToday || 0), 0);
    const lowStock = warehouses.reduce((acc, wh) => acc + (wh.lowStockCount || (wh.status === 'Low Space' ? 1 : 0)), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalWarehouses,
        totalProducts,
        incoming,
        lowStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single warehouse by ID or warehouseId
// @route  GET /api/warehouses/:id
// @access Public / Authenticated
const getWarehouseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let warehouse = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      warehouse = await Warehouse.findById(id);
    }
    if (!warehouse) {
      warehouse = await Warehouse.findOne({ warehouseId: id.toUpperCase().trim() });
    }

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse '${id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Create warehouse
// @route  POST /api/warehouses
// @access Protected (Admin, Manager)
const createWarehouse = async (req, res, next) => {
  try {
    const { warehouseId, name, location, capacity, stock, status, manager, incomingToday, lowStockCount, contactNumber } = req.body;

    const existing = await Warehouse.findOne({ warehouseId: warehouseId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Warehouse ID '${warehouseId}' already exists.`,
      });
    }

    const currentStock = Number(stock) || 0;
    const totalCapacity = Number(capacity) || 10000;
    let calcStatus = status || 'Active';
    if (!status) {
      if (currentStock / totalCapacity >= 0.9) calcStatus = 'Low Space';
      if (currentStock >= totalCapacity) calcStatus = 'Full';
    }

    const warehouse = await Warehouse.create({
      warehouseId: warehouseId.toUpperCase().trim(),
      name: name.trim(),
      location: location.trim(),
      capacity: totalCapacity,
      stock: currentStock,
      status: calcStatus,
      manager: manager ? manager.trim() : 'Operations Lead',
      incomingToday: Number(incomingToday) || 0,
      lowStockCount: Number(lowStockCount) || 0,
      contactNumber: contactNumber || '',
    });

    try {
      await Activity.create({
        title: `Warehouse ${warehouse.warehouseId} registered`,
        description: `${warehouse.name} in ${warehouse.location} with capacity ${warehouse.capacity}`,
        type: 'warehouse',
        dotColor: '#2867e8',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully.',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update warehouse
// @route  PUT /api/warehouses/:id
// @access Protected (Admin, Manager)
const updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    let warehouse = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      warehouse = await Warehouse.findById(id);
    }
    if (!warehouse) {
      warehouse = await Warehouse.findOne({ warehouseId: id.toUpperCase().trim() });
    }

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse '${id}' not found.`,
      });
    }

    const fields = ['name', 'location', 'capacity', 'stock', 'status', 'manager', 'incomingToday', 'lowStockCount', 'contactNumber'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (f === 'capacity' || f === 'stock' || f === 'incomingToday' || f === 'lowStockCount') {
          warehouse[f] = Number(req.body[f]);
        } else {
          warehouse[f] = req.body[f];
        }
      }
    });

    // Auto-update status if not explicitly overridden
    if (!req.body.status && warehouse.capacity > 0) {
      const ratio = warehouse.stock / warehouse.capacity;
      if (ratio >= 1.0) warehouse.status = 'Full';
      else if (ratio >= 0.85) warehouse.status = 'Low Space';
      else warehouse.status = 'Active';
    }

    await warehouse.save();

    try {
      await Activity.create({
        title: `Warehouse ${warehouse.warehouseId} updated`,
        description: `${warehouse.name} stock: ${warehouse.stock}/${warehouse.capacity} (${warehouse.status})`,
        type: 'warehouse',
        dotColor: '#20b9f1',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully.',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete warehouse
// @route  DELETE /api/warehouses/:id
// @access Protected (Admin)
const deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    let warehouse = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      warehouse = await Warehouse.findByIdAndDelete(id);
    } else {
      warehouse = await Warehouse.findOneAndDelete({ warehouseId: id.toUpperCase().trim() });
    }

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse '${id}' not found.`,
      });
    }

    try {
      await Activity.create({
        title: `Warehouse ${warehouse.warehouseId} deleted`,
        description: `${warehouse.name} removed from registry`,
        type: 'warehouse',
        dotColor: '#ef4444',
        user: req.user ? req.user.name : 'Admin',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Warehouse ${warehouse.warehouseId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWarehouses,
  getWarehouseStats,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
