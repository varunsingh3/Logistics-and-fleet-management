const Booking = require('../models/Booking');
const Route = require('../models/Route');

// @desc   Get bookings (user sees own; admin/manager sees all)
// @route  GET /api/bookings
// @access Protected
const getBookings = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'user') {
      query.user = req.user._id;
    }

    const bookings = await Booking.find(query).populate('route').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Cancel a booking
// @route  PATCH /api/bookings/:id/cancel
// @access Protected
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Permission check
    if (req.user.role === 'user' && booking.user && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings.',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled.',
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Restore available seats on route
    const route = await Route.findById(booking.route);
    if (route) {
      route.availableSeats += booking.seatCount;
      await route.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Seats restored.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  cancelBooking,
};
