const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: String,
      required: [true, 'Warehouse ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    stock: {
      type: Number,
      required: [true, 'Current stock is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Low Space', 'Full', 'Under Maintenance'],
        message: '{VALUE} is not a valid warehouse status',
      },
      default: 'Active',
    },
    manager: {
      type: String,
      trim: true,
      default: 'Operations Lead',
    },
    incomingToday: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

warehouseSchema.virtual('utilizationPercentage').get(function () {
  if (!this.capacity || this.capacity === 0) return 0;
  return Math.min(100, Math.round((this.stock / this.capacity) * 100));
});

const getModel = require('./getModel');
const WarehouseModel = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
module.exports = getModel('Warehouse', WarehouseModel);
