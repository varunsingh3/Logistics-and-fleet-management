const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      required: [true, 'Route ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      trim: true,
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 40,
      min: [1, 'Total seats must be at least 1'],
    },
    availableSeats: {
      type: Number,
      required: true,
      default: 24,
      min: [0, 'Available seats cannot be negative'],
    },
    price: {
      type: Number,
      required: true,
      default: 150,
      min: [0, 'Price cannot be negative'],
    },
    busNumber: {
      type: String,
      default: 'DL-01-AB-1234',
      trim: true,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    status: {
      type: String,
      enum: {
        values: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid route status',
      },
      default: 'Scheduled',
    },
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ routeId: 1, origin: 1, destination: 1, date: 1 });

const getModel = require('./getModel');
const RouteModel = mongoose.models.Route || mongoose.model('Route', routeSchema);
module.exports = getModel('Route', RouteModel);
