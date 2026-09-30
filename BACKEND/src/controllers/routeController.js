const Route = require('../models/Route');
const Booking = require('../models/Booking');
const Activity = require('../models/Activity');

// @desc   Get all routes with search filters (from, to, date)
// @route  GET /api/routes
// @access Public / Authenticated
const getRoutes = async (req, res, next) => {
  try {
    const { from, to, date, status } = req.query;
    let query = {};

    if (from) {
      query.origin = new RegExp(from.trim(), 'i');
    }
    if (to) {
      query.destination = new RegExp(to.trim(), 'i');
    }
    if (date) {
      query.date = date.trim();
    }
    if (status) {
      query.status = status;
    }

    const routes = await Route.find(query).sort({ routeId: 1 });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single route
// @route  GET /api/routes/:id
// @access Public / Authenticated
const getRouteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let route = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      route = await Route.findById(id);
    }
    if (!route) {
      route = await Route.findOne({ routeId: id.toUpperCase().trim() });
    }

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route '${id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Create new route
// @route  POST /api/routes
// @access Protected (Admin, Manager)
const createRoute = async (req, res, next) => {
  try {
    const { routeId, origin, destination, departureTime, arrivalTime, duration, totalSeats, availableSeats, price, busNumber, date, status } = req.body;

    const existing = await Route.findOne({ routeId: routeId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Route ID '${routeId}' already exists.`,
      });
    }

    const route = await Route.create({
      routeId: routeId.toUpperCase().trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime: departureTime.trim(),
      arrivalTime: arrivalTime.trim(),
      duration: duration.trim(),
      totalSeats: Number(totalSeats) || 40,
      availableSeats: availableSeats !== undefined ? Number(availableSeats) : Number(totalSeats) || 40,
      price: Number(price) || 150,
      busNumber: busNumber || 'DL-01-AB-1234',
      date: date || new Date().toISOString().split('T')[0],
      status: status || 'Scheduled',
    });

    try {
      await Activity.create({
        title: `Route ${route.routeId} scheduled`,
        description: `${route.origin} → ${route.destination} departing at ${route.departureTime}`,
        type: 'route',
        dotColor: '#20b9f1',
        user: req.user ? req.user.name : 'Manager',
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Route created successfully.',
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update route
// @route  PUT /api/routes/:id
// @access Protected (Admin, Manager)
const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    let route = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      route = await Route.findById(id);
    }
    if (!route) {
      route = await Route.findOne({ routeId: id.toUpperCase().trim() });
    }

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route '${id}' not found.`,
      });
    }

    const fields = ['origin', 'destination', 'departureTime', 'arrivalTime', 'duration', 'totalSeats', 'availableSeats', 'price', 'busNumber', 'date', 'status'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (['totalSeats', 'availableSeats', 'price'].includes(f)) {
          route[f] = Number(req.body[f]);
        } else {
          route[f] = req.body[f];
        }
      }
    });

    await route.save();

    res.status(200).json({
      success: true,
      message: 'Route updated successfully.',
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete route
// @route  DELETE /api/routes/:id
// @access Protected (Admin)
const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    let route = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      route = await Route.findByIdAndDelete(id);
    } else {
      route = await Route.findOneAndDelete({ routeId: id.toUpperCase().trim() });
    }

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route '${id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Route ${route.routeId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Book ticket on a route
// @route  POST /api/routes/:id/book
// @access Public / Authenticated
const bookTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { passengerName, passengerEmail, passengerPhone, seatCount } = req.body;

    if (!passengerName || !passengerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide passenger name and email address.',
      });
    }

    let route = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      route = await Route.findById(id);
    }
    if (!route) {
      route = await Route.findOne({ routeId: id.toUpperCase().trim() });
    }

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Selected route not found.',
      });
    }

    const requestedSeats = Number(seatCount) || 1;
    if (route.availableSeats < requestedSeats) {
      return res.status(400).json({
        success: false,
        message: `Only ${route.availableSeats} seat(s) available on this route.`,
      });
    }

    // Decrement available seats
    route.availableSeats -= requestedSeats;
    await route.save();

    // Create booking
    const bookingId = 'BK-' + Date.now().toString().slice(-6);
    const totalPrice = requestedSeats * (route.price || 150);

    const booking = await Booking.create({
      bookingId,
      route: route._id,
      routeId: route.routeId,
      user: req.user ? req.user._id : null,
      passengerName: passengerName.trim(),
      passengerEmail: passengerEmail.toLowerCase().trim(),
      passengerPhone: passengerPhone || '',
      seatCount: requestedSeats,
      totalPrice,
      status: 'Confirmed',
    });

    try {
      await Activity.create({
        title: `Ticket booked on Route ${route.routeId}`,
        description: `${requestedSeats} seat(s) reserved for ${passengerName} (${route.origin} → ${route.destination})`,
        type: 'route',
        dotColor: '#10b981',
        user: passengerName,
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Ticket booked successfully!',
      booking: {
        bookingId: booking.bookingId,
        routeId: route.routeId,
        from: route.origin,
        to: route.destination,
        departureTime: route.departureTime,
        passengerName: booking.passengerName,
        seatCount: booking.seatCount,
        totalPrice: booking.totalPrice,
        status: booking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  bookTicket,
};
