const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['shipment', 'vehicle', 'warehouse', 'route', 'auth', 'system'],
      default: 'system',
    },
    dotColor: {
      type: String,
      default: '#20b9f1',
    },
    user: {
      type: String,
      default: 'System',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ timestamp: -1 });

const getModel = require('./getModel');
const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
module.exports = getModel('Activity', ActivityModel);
