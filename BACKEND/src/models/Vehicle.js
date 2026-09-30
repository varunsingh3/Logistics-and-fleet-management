const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Vehicle name or model is required'],
      trim: true,
    },
    driver: {
      type: String,
      required: [true, 'Assigned driver name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Current location is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'In Maintenance', 'Available', 'Out of Service'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
    },
    type: {
      type: String,
      default: 'Heavy Truck',
      trim: true,
    },
    capacity: {
      type: Number,
      default: 5000,
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    licensePlate: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ vehicleId: 1, driver: 1, location: 1 });

const getModel = require('./getModel');
const VehicleModel = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
module.exports = getModel('Vehicle', VehicleModel);
