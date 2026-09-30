const Shipment = require('../models/Shipment');
const Activity = require('../models/Activity');

// @desc   Get all shipments with search and filter
// @route  GET /api/shipments
// @access Public / Authenticated
const getShipments = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { shipmentId: searchRegex },
        { customer: searchRegex },
        { destination: searchRegex },
        { driver: searchRegex },
        { vehicle: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'id_asc') sortOption = { shipmentId: 1 };

    const shipments = await Shipment.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get shipment summary stats
// @route  GET /api/shipments/stats/summary
// @access Public / Authenticated
const getShipmentStats = async (req, res, next) => {
  try {
    const [total, inTransit, delivered, pending] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: 'In Transit' }),
      Shipment.countDocuments({ status: 'Delivered' }),
      Shipment.countDocuments({ status: 'Pending' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        inTransit,
        delivered,
        pending,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Track shipment by ID (Public route)
// @route  GET /api/shipments/track/:shipmentId
// @access Public
const trackShipment = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const cleanId = shipmentId.trim().toUpperCase();

    const shipment = await Shipment.findOne({ shipmentId: cleanId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `No shipment found with tracking ID '${cleanId}'. Please verify the ID and try again.`,
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single shipment by ID
// @route  GET /api/shipments/:id
// @access Public / Authenticated
const getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let shipment = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    if (!shipment) {
      shipment = await Shipment.findOne({ shipmentId: id.toUpperCase().trim() });
    }

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment '${id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Create new shipment
// @route  POST /api/shipments
// @access Protected (Admin, Manager)
const createShipment = async (req, res, next) => {
  try {
    const { shipmentId, customer, origin, destination, driver, vehicle, status, items, estimatedDelivery } = req.body;

    const existing = await Shipment.findOne({ shipmentId: shipmentId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Shipment with ID '${shipmentId}' already exists.`,
      });
    }

    const initialStatus = status || 'Pending';
    const initialTimeline = [
      {
        status: initialStatus,
        location: origin || 'Central Hub, Delhi',
        timestamp: new Date(),
        notes: 'Shipment created and scheduled in system',
      },
    ];

    const shipment = await Shipment.create({
      shipmentId: shipmentId.toUpperCase().trim(),
      customer: customer.trim(),
      origin: origin ? origin.trim() : 'Central Hub, Delhi',
      destination: destination.trim(),
      driver: driver.trim(),
      vehicle: vehicle ? vehicle.trim() : 'LF-001',
      status: initialStatus,
      items: items || [{ description: 'General Cargo', quantity: 1, weightKg: 100 }],
      timeline: initialTimeline,
      estimatedDelivery: estimatedDelivery || new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try {
      await Activity.create({
        title: `Shipment ${shipment.shipmentId} created`,
        description: `Order for ${shipment.customer} to ${shipment.destination} assigned to ${shipment.driver}`,
        type: 'shipment',
        dotColor: '#10b981',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully.',
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update shipment details
// @route  PUT /api/shipments/:id
// @access Protected (Admin, Manager)
const updateShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    let shipment = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    if (!shipment) {
      shipment = await Shipment.findOne({ shipmentId: id.toUpperCase().trim() });
    }

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment '${id}' not found.`,
      });
    }

    const fields = ['customer', 'origin', 'destination', 'driver', 'vehicle', 'status', 'items', 'estimatedDelivery'];
    const prevStatus = shipment.status;

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        shipment[f] = req.body[f];
      }
    });

    // If status changed, push timeline entry
    if (req.body.status && req.body.status !== prevStatus) {
      shipment.timeline.push({
        status: req.body.status,
        location: req.body.location || shipment.destination,
        timestamp: new Date(),
        notes: req.body.notes || `Status changed to ${req.body.status}`,
      });

      if (req.body.status === 'Delivered') {
        shipment.actualDelivery = new Date();
      }
    }

    await shipment.save();

    try {
      await Activity.create({
        title: `Shipment ${shipment.shipmentId} updated`,
        description: `Status: ${shipment.status} for ${shipment.customer}`,
        type: 'shipment',
        dotColor: '#2867e8',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Shipment updated successfully.',
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update shipment status directly
// @route  PATCH /api/shipments/:id/status
// @access Protected (Admin, Manager)
const updateShipmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.',
      });
    }

    let shipment = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    if (!shipment) {
      shipment = await Shipment.findOne({ shipmentId: id.toUpperCase().trim() });
    }

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment '${id}' not found.`,
      });
    }

    shipment.status = status;
    if (status === 'Delivered') {
      shipment.actualDelivery = new Date();
    }

    shipment.timeline.push({
      status,
      location: location || shipment.destination,
      timestamp: new Date(),
      notes: notes || `Shipment status updated to ${status}`,
    });

    await shipment.save();

    try {
      await Activity.create({
        title: `Shipment ${shipment.shipmentId} ${status.toLowerCase()}`,
        description: `Shipment for ${shipment.customer} updated to ${status}`,
        type: 'shipment',
        dotColor: status === 'Delivered' ? '#10b981' : '#20b9f1',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Shipment status updated to ${status}.`,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete shipment
// @route  DELETE /api/shipments/:id
// @access Protected (Admin)
const deleteShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    let shipment = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findByIdAndDelete(id);
    } else {
      shipment = await Shipment.findOneAndDelete({ shipmentId: id.toUpperCase().trim() });
    }

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment '${id}' not found.`,
      });
    }

    try {
      await Activity.create({
        title: `Shipment ${shipment.shipmentId} deleted`,
        description: `Shipment for ${shipment.customer} removed`,
        type: 'shipment',
        dotColor: '#ef4444',
        user: req.user ? req.user.name : 'Admin',
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Shipment ${shipment.shipmentId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShipments,
  getShipmentStats,
  getShipmentById,
  trackShipment,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
};
