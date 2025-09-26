const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve mobile app files
app.use('/mobile-app', express.static(path.join(__dirname, 'mobile-app')));
app.use('/lab-dashboard', express.static(path.join(__dirname, 'lab-dashboard')));
app.use('/processing-facility', express.static(path.join(__dirname, 'processing-facility')));
app.use('/supply-chain-dashboard', express.static(path.join(__dirname, 'supply-chain-dashboard')));
// Serve consumer portal files
app.use('/consumer-app', express.static(path.join(__dirname, 'consumer-app')));
app.get('/consumer-app', (req, res) => {
  res.sendFile(path.join(__dirname, 'consumer-app', 'index.html'));
});

// Root route - redirect to mobile app
app.get('/', (req, res) => {
  res.redirect('/mobile-app/');
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/herb-supply-chain', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const User = require('./models/User');
const Herb = require('./models/Herb');
const Harvest = require('./models/Harvest');
const TestResult = require('./models/TestResult');
const ProcessingBatch = require('./models/ProcessingBatch');
const Inventory = require('./models/Inventory');
const Certificate = require('./models/Certificate');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, name, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role,
      name,
      phone
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Farmer/Collector routes
app.post('/api/harvest', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { species, variety, quantity, location, harvestDate, notes } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Create harvest
    const harvest = new Harvest({
      farmerId: req.user.userId,
      species,
      variety: variety || 'Unknown',
      quantity: parseFloat(quantity),
      location: JSON.parse(location),
      harvestDate: new Date(harvestDate),
      photo,
      notes,
      status: 'pending_testing'
    });

    await harvest.save();
    
    // Create or update herb with harvest data
    let herb = await Herb.findOne({ 
      species: species, 
      farmerId: req.user.userId,
      variety: variety || 'Unknown'
    });
    
    if (!herb) {
      // Create new herb
      herb = new Herb({
        name: species,
        species: species,
        variety: variety || 'Unknown',
        farmerId: req.user.userId,
        harvests: [harvest._id],
        batchId: 'BATCH-' + Date.now(),
        quantity: parseFloat(quantity),
        location: JSON.parse(location).address || 'Unknown',
        origin: {
          type: 'Point',
          coordinates: JSON.parse(location).coordinates || [0, 0],
          address: JSON.parse(location).address || 'Unknown',
          region: JSON.parse(location).region || 'Unknown',
          country: JSON.parse(location).country || 'Unknown'
        },
        harvestDate: new Date(harvestDate),
        qualityGrade: 'C',
        status: 'harvested',
        qrCode: 'QR-' + Date.now(),
        updatedBy: 'Farmer',
        workflowStatus: {
          farmer: { completed: true, completedAt: new Date(), details: `Harvested ${parseFloat(quantity)}kg of ${species}` },
          labTechnician: { completed: false, completedAt: null, details: null },
          processor: { completed: false, completedAt: null, details: null },
          manager: { completed: false, completedAt: null, details: null }
        }
      });
    } else {
      // Update existing herb
      herb.harvests.push(harvest._id);
      herb.quantity += parseFloat(quantity);
      herb.updatedBy = 'Farmer';
      herb.workflowStatus.farmer = { 
        completed: true, 
        completedAt: new Date(), 
        details: `Updated harvest: ${parseFloat(quantity)}kg of ${species}` 
      };
    }
    
    await herb.save();
    
    // Broadcast herb update to all roles
    broadcastHerbUpdate(herb, 'Harvest Added');
    
    // Broadcast real-time update
    broadcastUpdate('harvest', { 
      harvest, 
      herb,
      farmerId: req.user.userId,
      message: `New harvest added: ${species} (${quantity}kg)`
    });
    
    res.status(201).json({ harvest, herb });
  } catch (error) {
    console.error('Harvest creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/harvest/farmer/:farmerId', authenticateToken, async (req, res) => {
  try {
    const harvests = await Harvest.find({ farmerId: req.params.farmerId });
    res.json(harvests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Laboratory routes
app.get('/api/lab/pending-harvests', authenticateToken, async (req, res) => {
  try {
    const harvests = await Harvest.find({ status: 'pending_testing' })
      .populate('farmerId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(harvests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/lab/pending-herbs', authenticateToken, async (req, res) => {
  try {
    const herbs = await Herb.find({ 
      'workflowStatus.farmer.completed': true,
      'workflowStatus.labTechnician.completed': false
    })
      .populate('farmerId', 'name email phone')
      .populate('harvests')
      .sort({ createdAt: -1 });
    
    res.json(herbs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/test-result', authenticateToken, async (req, res) => {
  try {
    const { harvestId, testType, results, qualityGrade, labTechnician } = req.body;
    
    // Resolve herbId from the harvest to satisfy schema requirement
    const harvest = await Harvest.findById(harvestId);
    if (!harvest) {
      return res.status(404).json({ message: 'Harvest not found' });
    }

    const herb = await Herb.findOne({ harvests: harvestId });
    if (!herb) {
      return res.status(400).json({ message: 'Associated herb not found for this harvest' });
    }

    const testResult = new TestResult({
      herbId: herb._id,
      harvestId,
      testType,
      results,
      qualityGrade,
      labTechnician,
      testDate: new Date(),
      status: 'completed'
    });

    await testResult.save();
    
    // Update harvest status
    await Harvest.findByIdAndUpdate(harvestId, { status: 'tested' });
    
    // Update herb with test result
    if (herb) {
      herb.testResults.push(testResult._id);
      herb.updatedBy = 'Laboratory';
      herb.status = 'tested';
      herb.workflowStatus.labTechnician = { 
        completed: true, 
        completedAt: new Date(), 
        details: `Quality testing completed - Grade: ${qualityGrade}` 
      };
      await herb.save();
      
      // Broadcast herb update to all roles
      broadcastHerbUpdate(herb, 'Test Results Added');
    }
    
    // Broadcast real-time update
    broadcastUpdate('test_result', { testResult, harvestId });
    
    res.status(201).json(testResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/test-results', authenticateToken, async (req, res) => {
  try {
    const testResults = await TestResult.find().populate('harvestId');
    res.json(testResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Processing facility routes
app.get('/api/processor/pending-herbs', authenticateToken, async (req, res) => {
  try {
    const herbs = await Herb.find({ 
      'workflowStatus.farmer.completed': true,
      'workflowStatus.labTechnician.completed': true,
      'workflowStatus.processor.completed': false
    })
      .populate('farmerId', 'name email phone')
      .populate('harvests')
      .populate('testResults')
      .sort({ createdAt: -1 });
    
    res.json(herbs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/processing-batch', authenticateToken, async (req, res) => {
  try {
    const { harvestIds, processingType, facilityId, startDate } = req.body;
    
    const batch = new ProcessingBatch({
      harvestIds,
      processingType,
      facilityId,
      startDate: new Date(startDate),
      status: 'in_progress',
      steps: []
    });

    await batch.save();
    
    // Update herb workflow status for processor
    const herb = await Herb.findOne({ harvests: { $in: harvestIds } });
    if (herb) {
      herb.processingBatches.push(batch._id);
      herb.status = 'processing';
      herb.workflowStatus.processor = { 
        completed: true, 
        completedAt: new Date(), 
        details: `Processing batch created - Type: ${processingType}` 
      };
      herb.updatedBy = 'Processor';
      await herb.save();
      
      // Broadcast herb update to all roles
      broadcastHerbUpdate(herb, 'Processing Started');
    }
    
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/processing-step', authenticateToken, async (req, res) => {
  try {
    const { batchId, stepName, details, qualityCheck } = req.body;
    
    const batch = await ProcessingBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    batch.steps.push({
      stepName,
      details,
      qualityCheck,
      timestamp: new Date(),
      operator: req.user.userId
    });

    await batch.save();
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Processor: list processing batches for selection and dashboards
app.get('/api/processing-batches', authenticateToken, async (req, res) => {
  try {
    const batches = await ProcessingBatch.find().sort({ startDate: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Processor: recent processing steps across batches (for recent steps list)
app.get('/api/processing-steps/recent', authenticateToken, async (req, res) => {
  try {
    const batches = await ProcessingBatch.find({}, { steps: 1, _id: 0 }).lean();
    const steps = (batches || [])
      .flatMap(b => b.steps || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
    res.json(steps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Processor: list only completed batches (used by packaging screen)
app.get('/api/processing-batches/completed', authenticateToken, async (req, res) => {
  try {
    const batches = await ProcessingBatch.find({ status: 'completed' }).sort({ endDate: -1, startDate: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supply chain manager routes
app.get('/api/manager/pending-harvests', authenticateToken, async (req, res) => {
  try {
    const harvests = await Harvest.find({ status: 'pending_testing' })
      .populate('farmerId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(harvests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/manager/pending-herbs', authenticateToken, async (req, res) => {
  try {
    const herbs = await Herb.find({ 
      'workflowStatus.farmer.completed': true,
      'workflowStatus.labTechnician.completed': true,
      'workflowStatus.processor.completed': true,
      'workflowStatus.manager.completed': false
    })
      .populate('farmerId', 'name email phone')
      .populate('harvests')
      .populate('testResults')
      .populate('processingBatches')
      .sort({ createdAt: -1 });
    
    res.json(herbs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('harvestId batchId');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const totalHarvests = await Harvest.countDocuments();
    const totalTests = await TestResult.countDocuments();
    const totalBatches = await ProcessingBatch.countDocuments();
    
    const qualityDistribution = await TestResult.aggregate([
      { $group: { _id: '$qualityGrade', count: { $sum: 1 } } }
    ]);

    res.json({
      totalHarvests,
      totalTests,
      totalBatches,
      qualityDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manager workflow completion and QR generation
app.post('/api/manager/complete-herb/:herbId', authenticateToken, async (req, res) => {
  try {
    const { herbId } = req.params;
    const { finalDetails, certificateInfo } = req.body;
    
    const herb = await Herb.findById(herbId)
      .populate('farmerId', 'name email phone')
      .populate('harvests')
      .populate('testResults')
      .populate('processingBatches');
    
    if (!herb) {
      return res.status(404).json({ message: 'Herb not found' });
    }
    
    // Check if all previous steps are completed
    if (!herb.workflowStatus.farmer.completed || 
        !herb.workflowStatus.labTechnician.completed || 
        !herb.workflowStatus.processor.completed) {
      return res.status(400).json({ 
        message: 'Cannot complete workflow. Previous steps not completed.' 
      });
    }
    
    // Mark manager as completed
    herb.workflowStatus.manager = { 
      completed: true, 
      completedAt: new Date(), 
      details: finalDetails || 'Final approval and certification completed' 
    };
    herb.status = 'packaged';
    herb.updatedBy = 'Manager';
    
    // Generate final QR code with comprehensive data
    const qrData = {
      herbId: herb._id,
      species: herb.species,
      variety: herb.variety,
      batchId: herb.batchId,
      harvestDate: herb.harvestDate,
      origin: herb.origin,
      farmer: {
        name: herb.farmerId.name,
        email: herb.farmerId.email,
        phone: herb.farmerId.phone
      },
      workflow: herb.workflowStatus,
      testResults: herb.testResults,
      processingBatches: herb.processingBatches,
      certificateInfo: certificateInfo,
      finalQRGenerated: new Date().toISOString()
    };
    
    herb.qrCode = 'FINAL-QR-' + Date.now();
    await herb.save();
    
    // Broadcast completion to all roles
    broadcastHerbUpdate(herb, 'Workflow Completed - QR Generated');
    
    res.json({ 
      message: 'Herb workflow completed successfully',
      herb: herb,
      qrData: qrData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Consumer routes
app.get('/api/herb/:herbId', async (req, res) => {
  try {
    const herb = await Herb.findById(req.params.herbId)
      .populate('harvestId')
      .populate('testResults')
      .populate('processingBatchId');
    
    if (!herb) {
      return res.status(404).json({ message: 'Herb not found' });
    }

    res.json(herb);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/qr/:herbId', async (req, res) => {
  try {
    const herb = await Herb.findById(req.params.herbId);
    if (!herb) {
      return res.status(404).json({ message: 'Herb not found' });
    }

    const qrData = {
      herbId: herb._id,
      species: herb.species,
      harvestDate: herb.harvestDate,
      origin: herb.origin
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    res.json({ qrCode, herbData: qrData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// QR Code scanning endpoint for consumers
app.get('/api/herbs/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    // Find herb by QR code or batch ID
    let herb = await Herb.findOne({ 
      $or: [
        { qrCode: qrCode },
        { batchId: qrCode },
        { _id: qrCode }
      ]
    }).populate('farmer', 'name email phone');

    if (!herb) {
      return res.status(404).json({ message: 'Herb not found' });
    }

    // Get related data
    const harvest = await Harvest.findOne({ herb: herb._id }).populate('farmer', 'name email phone');
    const testResults = await TestResult.find({ herb: herb._id });
    const certificates = await Certificate.find({ herb: herb._id });
    const processingBatch = await ProcessingBatch.findOne({ herbs: herb._id });

    // Build comprehensive herb data with workflow details
    const herbData = {
      name: herb.species,
      scientificName: herb.scientificName,
      variety: herb.variety,
      harvestDate: harvest?.harvestDate,
      origin: harvest?.location?.address || herb.origin,
      farmerName: harvest?.farmer?.name || herb.farmer?.name,
      processingDate: processingBatch?.processingDate,
      batchId: herb.batchId || processingBatch?.batchId,
      status: herb.status || 'verified',
      qrCode: herb.qrCode,
      workflowStatus: herb.workflowStatus,
      testResults: testResults.map(test => ({
        testName: test.testName,
        result: test.result,
        value: test.value,
        unit: test.unit,
        date: test.testDate
      })),
      certificates: certificates.map(cert => ({
        name: cert.certificateName,
        status: cert.status,
        issuedBy: cert.issuedBy,
        validUntil: cert.validUntil
      })),
      supplyChain: [
        {
          step: 'Farmer',
          description: herb.workflowStatus?.farmer?.details || `Harvested by ${harvest?.farmer?.name || 'Unknown farmer'}`,
          date: herb.workflowStatus?.farmer?.completedAt || harvest?.harvestDate,
          status: herb.workflowStatus?.farmer?.completed ? 'completed' : 'pending',
          completedBy: 'Farmer'
        },
        {
          step: 'Laboratory Testing',
          description: herb.workflowStatus?.labTechnician?.details || (testResults.length > 0 ? 'Quality tests completed' : 'Quality tests pending'),
          date: herb.workflowStatus?.labTechnician?.completedAt || (testResults.length > 0 ? testResults[0].testDate : null),
          status: herb.workflowStatus?.labTechnician?.completed ? 'completed' : 'pending',
          completedBy: 'Lab Technician'
        },
        {
          step: 'Processing',
          description: herb.workflowStatus?.processor?.details || (processingBatch ? 'Processing completed' : 'Processing pending'),
          date: herb.workflowStatus?.processor?.completedAt || processingBatch?.processingDate,
          status: herb.workflowStatus?.processor?.completed ? 'completed' : 'pending',
          completedBy: 'Processor'
        },
        {
          step: 'Manager Approval',
          description: herb.workflowStatus?.manager?.details || (certificates.length > 0 ? 'Final approval completed' : 'Final approval pending'),
          date: herb.workflowStatus?.manager?.completedAt || (certificates.length > 0 ? certificates[0].issueDate : null),
          status: herb.workflowStatus?.manager?.completed ? 'completed' : 'pending',
          completedBy: 'Manager'
        }
      ]
    };

    res.json(herbData);
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ message: 'Error fetching herb details' });
  }
});

// Get all herbs with complete supply chain data for real-time tracking
app.get('/api/herbs/supply-chain', authenticateToken, async (req, res) => {
  try {
    const herbs = await Herb.find()
      .populate('farmerId', 'name email role')
      .populate('harvests')
      .populate('testResults')
      .populate('processingBatches')
      .populate('certificates')
      .sort({ createdAt: -1 });

    // Add supply chain status for each herb
    const herbsWithStatus = herbs.map(herb => {
      const status = getSupplyChainStatus(herb);
      return {
        ...herb.toObject(),
        supplyChainStatus: status
      };
    });

    res.json(herbsWithStatus);
  } catch (error) {
    console.error('Error fetching supply chain data:', error);
    res.status(500).json({ error: 'Failed to fetch supply chain data' });
  }
});

// Helper function to determine supply chain status
function getSupplyChainStatus(herb) {
  const hasHarvest = herb.harvests && herb.harvests.length > 0;
  const hasTestResults = herb.testResults && herb.testResults.length > 0;
  const hasProcessing = herb.processingBatches && herb.processingBatches.length > 0;
  const hasCertificates = herb.certificates && herb.certificates.length > 0;

  if (!hasHarvest) return { stage: 'pending', status: 'Awaiting Harvest', color: '#f39c12' };
  if (!hasTestResults) return { stage: 'harvested', status: 'Awaiting Lab Testing', color: '#3498db' };
  if (!hasProcessing) return { stage: 'tested', status: 'Awaiting Processing', color: '#9b59b6' };
  if (!hasCertificates) return { stage: 'processed', status: 'Awaiting Certification', color: '#e67e22' };
  return { stage: 'completed', status: 'Supply Chain Complete', color: '#27ae60' };
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join role-based rooms
  socket.on('join-room', (role) => {
    socket.join(role);
    console.log(`User ${socket.id} joined room: ${role}`);
  });
  
  // Handle real-time updates
  socket.on('request-update', (data) => {
    const { role, userId } = data;
    // Send real-time data based on role
    sendRoleBasedData(socket, role, userId);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Function to send role-based real-time data
async function sendRoleBasedData(socket, role, userId) {
  try {
    let data = {};
    
    switch(role) {
      case 'farmer':
        data = await getFarmerData(userId);
        break;
      case 'lab_technician':
        data = await getLabData();
        break;
      case 'processor':
        data = await getProcessorData();
        break;
      case 'supply_manager':
        data = await getManagerData();
        break;
    }
    
    socket.emit('real-time-data', data);
  } catch (error) {
    console.error('Error sending real-time data:', error);
    socket.emit('error', { message: 'Failed to fetch real-time data' });
  }
}

// Real-time data functions
async function getFarmerData(userId) {
  const harvests = await Harvest.find({ farmerId: userId }).sort({ harvestDate: -1 }).limit(10);
  const totalHarvests = await Harvest.countDocuments({ farmerId: userId });
  const recentHarvests = harvests.slice(0, 5);
  
  return {
    type: 'farmer',
    totalHarvests,
    recentHarvests,
    timestamp: new Date()
  };
}

async function getLabData() {
  const testResults = await TestResult.find().sort({ testDate: -1 }).limit(10);
  const pendingTests = await TestResult.countDocuments({ result: 'pending' });
  const passedTests = await TestResult.countDocuments({ result: 'passed' });
  const failedTests = await TestResult.countDocuments({ result: 'failed' });
  
  return {
    type: 'lab',
    testResults,
    pendingTests,
    passedTests,
    failedTests,
    timestamp: new Date()
  };
}

async function getProcessorData() {
  const batches = await ProcessingBatch.find().sort({ processingDate: -1 }).limit(10);
  const activeBatches = await ProcessingBatch.countDocuments({ status: 'processing' });
  const completedBatches = await ProcessingBatch.countDocuments({ status: 'completed' });
  
  return {
    type: 'processor',
    batches,
    activeBatches,
    completedBatches,
    timestamp: new Date()
  };
}

async function getManagerData() {
  const totalHerbs = await Herb.countDocuments();
  const totalHarvests = await Harvest.countDocuments();
  const totalTests = await TestResult.countDocuments();
  const totalBatches = await ProcessingBatch.countDocuments();
  
  const recentActivity = await Promise.all([
    Harvest.find().sort({ harvestDate: -1 }).limit(5),
    TestResult.find().sort({ testDate: -1 }).limit(5),
    ProcessingBatch.find().sort({ processingDate: -1 }).limit(5)
  ]);
  
  return {
    type: 'manager',
    stats: {
      totalHerbs,
      totalHarvests,
      totalTests,
      totalBatches
    },
    recentActivity,
    timestamp: new Date()
  };
}

// Broadcast updates to all connected clients
function broadcastUpdate(type, data) {
  io.emit('update', { type, data, timestamp: new Date() });
}

// Broadcast herb updates to all roles
function broadcastHerbUpdate(herb, action) {
  io.emit('herb-update', { 
    herb, 
    action, 
    timestamp: new Date(),
    message: `${action} by ${herb.updatedBy || 'System'}`
  });
}

// File serving
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


