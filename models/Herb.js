const mongoose = require('mongoose');

const herbSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  species: {
    type: String,
    required: true
  },
  variety: {
    type: String
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  harvests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest'
  }],
  harvestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest'
  },
  testResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResult'
  }],
  processingBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessingBatch'
  }],
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  batchId: {
    type: String,
    unique: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  location: {
    type: String
  },
  updatedBy: {
    type: String
  },
  origin: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String,
    region: String,
    country: String
  },
  harvestDate: {
    type: Date,
    required: true
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    default: 'C'
  },
  status: {
    type: String,
    enum: ['harvested', 'tested', 'processing', 'packaged', 'shipped', 'delivered'],
    default: 'harvested'
  },
  workflowStatus: {
    farmer: { completed: Boolean, completedAt: Date, details: String },
    labTechnician: { completed: Boolean, completedAt: Date, details: String },
    processor: { completed: Boolean, completedAt: Date, details: String },
    manager: { completed: Boolean, completedAt: Date, details: String }
  },
  qrCode: {
    type: String,
    unique: true
  },
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

herbSchema.index({ origin: '2dsphere' });
herbSchema.index({ qrCode: 1 });

module.exports = mongoose.model('Herb', herbSchema);


