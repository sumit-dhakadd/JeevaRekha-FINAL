const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  herbId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Herb',
    required: true
  },
  harvestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest',
    required: true
  },
  testType: {
    type: String,
    enum: ['purity', 'potency', 'contamination', 'microbial', 'heavy_metals', 'pesticides'],
    required: true
  },
  results: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  labTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  digitalSignature: {
    signature: String,
    timestamp: Date,
    verified: {
      type: Boolean,
      default: false
    }
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

module.exports = mongoose.model('TestResult', testResultSchema);


