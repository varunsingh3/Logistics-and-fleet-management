const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    routeId: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    passengerName: {
      type: String,
      required: [true, 'Passenger name is required'],
      trim: true,
    },
    passengerEmail: {
      type: String,
      required: [true, 'Passenger email is required'],
      trim: true,
      lowercase: true,
    },
    passengerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    seatCount: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Seat count must be at least 1'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled'],
      default: 'Confirmed',
    },
  },
  {
    timestamps: true,
  }
);

const getModel = require('./getModel');
const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
module.exports = getModel('Booking', BookingModel);
