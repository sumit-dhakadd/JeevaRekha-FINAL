const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  testResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResult',
    required: true
  },
  certificateType: {
    type: String,
    enum: ['quality', 'organic', 'purity', 'safety', 'origin'],
    required: true
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  digitalSignature: {
    signature: String,
    timestamp: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  content: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  qrCode: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ herbId: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);


