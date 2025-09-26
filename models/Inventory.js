const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  harvestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessingBatch'
  },
  herbId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Herb',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'lbs', 'tons', 'liters', 'ml', 'units'],
    required: true
  },
  location: {
    warehouse: String,
    shelf: String,
    position: String
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'shipped', 'sold', 'expired'],
    default: 'available'
  },
  expiryDate: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

inventorySchema.index({ herbId: 1, status: 1 });
inventorySchema.index({ location: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);


