const mongoose = require('mongoose');

const processingStepSchema = new mongoose.Schema({
  stepName: {
    type: String,
    required: true
  },
  details: String,
  qualityCheck: {
    passed: Boolean,
    notes: String,
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const processingBatchSchema = new mongoose.Schema({
  harvestIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest',
    required: true
  }],
  processingType: {
    type: String,
    enum: ['drying', 'cleaning', 'grinding', 'extraction', 'packaging'],
    required: true
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  steps: [processingStepSchema],
  qualityControl: {
    overallGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D']
    },
    issues: [String],
    recommendations: String
  },
  outputQuantity: {
    type: Number,
    min: 0
  },
  outputUnit: {
    type: String,
    enum: ['kg', 'g', 'lbs', 'tons', 'liters', 'ml']
  },
  packaging: {
    type: String,
    material: String,
    size: String,
    label: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProcessingBatch', processingBatchSchema);


