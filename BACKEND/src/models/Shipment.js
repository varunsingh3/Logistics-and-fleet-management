const mongoose = require('mongoose');

const timelineItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const shipmentItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    weightKg: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: [true, 'Shipment ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    customer: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      default: 'Central Hub, Delhi',
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    driver: {
      type: String,
      required: [true, 'Assigned driver is required'],
      trim: true,
    },
    vehicle: {
      type: String,
      default: 'LF-001',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['In Transit', 'Delivered', 'Pending', 'Cancelled'],
        message: '{VALUE} is not a valid shipment status',
      },
      default: 'Pending',
    },
    items: [shipmentItemSchema],
    timeline: [timelineItemSchema],
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

shipmentSchema.index({ shipmentId: 1, customer: 1, destination: 1, status: 1 });

const getModel = require('./getModel');
const ShipmentModel = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
module.exports = getModel('Shipment', ShipmentModel);
