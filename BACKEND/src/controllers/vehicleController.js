const Vehicle = require('../models/Vehicle');
const Activity = require('../models/Activity');

// @desc   Get all vehicles with search and filter
// @route  GET /api/vehicles
// @access Public / Authenticated
const getVehicles = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { vehicleId: searchRegex },
        { name: searchRegex },
        { driver: searchRegex },
        { location: searchRegex },
        { type: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'id_asc') sortOption = { vehicleId: 1 };
    if (sort === 'id_desc') sortOption = { vehicleId: -1 };

    const vehicles = await Vehicle.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get vehicle summary statistics
// @route  GET /api/vehicles/stats/summary
// @access Public / Authenticated
const getVehicleStats = async (req, res, next) => {
  try {
    const [total, active, inMaintenance, available] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'Active' }),
      Vehicle.countDocuments({ status: 'In Maintenance' }),
      Vehicle.countDocuments({ status: 'Available' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        inMaintenance,
        available,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single vehicle by ID or vehicleId
// @route  GET /api/vehicles/:id
// @access Public / Authenticated
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let vehicle = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      vehicle = await Vehicle.findById(id);
    }
    if (!vehicle) {
      vehicle = await Vehicle.findOne({ vehicleId: id.toUpperCase().trim() });
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID '${id}' was not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Create new vehicle
// @route  POST /api/vehicles
// @access Protected (Admin, Manager)
const createVehicle = async (req, res, next) => {
  try {
    const { vehicleId, name, driver, location, status, type, capacity, fuelLevel, licensePlate } = req.body;

    const existing = await Vehicle.findOne({ vehicleId: vehicleId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ID '${vehicleId}' already exists. Please choose a unique vehicle ID.`,
      });
    }

    const vehicle = await Vehicle.create({
      vehicleId: vehicleId.toUpperCase().trim(),
      name: name.trim(),
      driver: driver.trim(),
      location: location.trim(),
      status: status || 'Active',
      type: type || 'Heavy Truck',
      capacity: capacity || 5000,
      fuelLevel: fuelLevel !== undefined ? fuelLevel : 85,
      licensePlate: licensePlate || '',
    });

    // Log Activity
    try {
      await Activity.create({
        title: `Vehicle ${vehicle.vehicleId} registered`,
        description: `${vehicle.name} assigned to driver ${vehicle.driver} at ${vehicle.location}`,
        type: 'vehicle',
        dotColor: '#2867e8',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update vehicle
// @route  PUT /api/vehicles/:id
// @access Protected (Admin, Manager)
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    let vehicle = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      vehicle = await Vehicle.findById(id);
    }
    if (!vehicle) {
      vehicle = await Vehicle.findOne({ vehicleId: id.toUpperCase().trim() });
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle '${id}' not found.`,
      });
    }

    const allowedUpdates = ['name', 'driver', 'location', 'status', 'type', 'capacity', 'fuelLevel', 'licensePlate'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();

    // Log Activity
    try {
      await Activity.create({
        title: `Vehicle ${vehicle.vehicleId} updated`,
        description: `Status: ${vehicle.status}, Driver: ${vehicle.driver}, Location: ${vehicle.location}`,
        type: 'vehicle',
        dotColor: '#20b9f1',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete vehicle
// @route  DELETE /api/vehicles/:id
// @access Protected (Admin)
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    let vehicle = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      vehicle = await Vehicle.findByIdAndDelete(id);
    } else {
      vehicle = await Vehicle.findOneAndDelete({ vehicleId: id.toUpperCase().trim() });
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle '${id}' not found.`,
      });
    }

    try {
      await Activity.create({
        title: `Vehicle ${vehicle.vehicleId} deleted`,
        description: `${vehicle.name} removed from fleet`,
        type: 'vehicle',
        dotColor: '#ef4444',
        user: req.user ? req.user.name : 'Admin',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Vehicle ${vehicle.vehicleId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicleStats,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
