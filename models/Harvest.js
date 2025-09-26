const mongoose = require('mongoose');

const harvestSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  species: {
    type: String,
    required: true
  },
  variety: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'lbs', 'tons'],
    default: 'kg'
  },
  location: {
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
  photo: String,
  notes: String,
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    rainfall: Number
  },
  status: {
    type: String,
    enum: ['pending_testing', 'tested', 'approved', 'rejected', 'processing'],
    default: 'pending_testing'
  },
  testResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResult'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

harvestSchema.index({ location: '2dsphere' });
harvestSchema.index({ farmerId: 1, harvestDate: -1 });

module.exports = mongoose.model('Harvest', harvestSchema);


