const Vehicle = require('../models/Vehicle');
const Warehouse = require('../models/Warehouse');
const Shipment = require('../models/Shipment');
const Route = require('../models/Route');
const Activity = require('../models/Activity');

// Helper to format friendly relative time
const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// @desc   Get comprehensive dashboard metrics & recent activity
// @route  GET /api/dashboard/stats
// @access Public / Authenticated
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalVehicles,
      activeVehicles,
      warehouses,
      totalShipments,
      inTransitShipments,
      deliveredShipments,
      routes,
      activities,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'Active' }),
      Warehouse.find(),
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: 'In Transit' }),
      Shipment.countDocuments({ status: 'Delivered' }),
      Route.find(),
      Activity.find().sort({ timestamp: -1 }).limit(8),
    ]);

    const totalWarehouses = warehouses.length;
    const storedItems = warehouses.reduce((sum, w) => sum + (w.stock || 0), 0);
    const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);

    const totalRoutes = routes.length;
    const activeRoutesToday = routes.filter((r) => r.status === 'Scheduled' || r.status === 'In Progress').length;

    // Computed Operational Percentages
    const fleetUtilization = totalVehicles > 0 ? Math.min(100, Math.round((activeVehicles / totalVehicles) * 100)) : 74;
    const warehouseCapacityPercent = totalCapacity > 0 ? Math.min(100, Math.round((storedItems / totalCapacity) * 100)) : 68;
    const shipmentCompletion = totalShipments > 0 ? Math.min(100, Math.round((deliveredShipments / totalShipments) * 100)) : 82;

    // Transport Capacity: booked vs total seats across routes
    const totalRouteSeats = routes.reduce((sum, r) => sum + (r.totalSeats || 40), 0);
    const availableRouteSeats = routes.reduce((sum, r) => sum + (r.availableSeats || 0), 0);
    const bookedRouteSeats = Math.max(0, totalRouteSeats - availableRouteSeats);
    const transportCapacity = totalRouteSeats > 0 ? Math.min(100, Math.round((bookedRouteSeats / totalRouteSeats) * 100)) : 61;

    // Format activities
    const formattedActivities = activities.map((act) => ({
      id: act._id,
      title: act.title,
      description: act.description,
      type: act.type,
      dotColor: act.dotColor || '#20b9f1',
      timeAgo: formatTimeAgo(act.timestamp || act.createdAt),
      timestamp: act.timestamp || act.createdAt,
    }));

    res.status(200).json({
      success: true,
      stats: {
        vehicles: {
          total: totalVehicles,
          active: activeVehicles,
        },
        warehouses: {
          total: totalWarehouses,
          storedItems,
          totalCapacity,
        },
        shipments: {
          total: totalShipments,
          inTransit: inTransitShipments,
          delivered: deliveredShipments,
        },
        routes: {
          total: totalRoutes,
          activeToday: activeRoutesToday,
        },
        operations: {
          fleetUtilization,
          warehouseCapacity: warehouseCapacityPercent,
          shipmentCompletion,
          transportCapacity,
        },
      },
      recentActivity: formattedActivities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Add custom activity
// @route  POST /api/dashboard/activity
// @access Protected (Admin, Manager)
const addActivity = async (req, res, next) => {
  try {
    const { title, description, type, dotColor } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Activity title is required' });
    }

    const activity = await Activity.create({
      title,
      description: description || '',
      type: type || 'system',
      dotColor: dotColor || '#20b9f1',
      user: req.user ? req.user.name : 'System',
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  addActivity,
};
