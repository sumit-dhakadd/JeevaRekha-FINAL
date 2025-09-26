const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Herb = require('./models/Herb');
const Harvest = require('./models/Harvest');
const TestResult = require('./models/TestResult');
const ProcessingBatch = require('./models/ProcessingBatch');
const Inventory = require('./models/Inventory');
const Certificate = require('./models/Certificate');

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/herb-supply-chain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password', 10);
    const users = [
      {
        email: 'farmer@jeevarekha.com',
        password: hashedPassword,
        role: 'farmer',
        name: 'Rajesh Kumar',
        phone: '+91-9876543210'
      },
      {
        email: 'lab@jeevarekha.com',
        password: hashedPassword,
        role: 'lab_technician',
        name: 'Dr. Priya Sharma',
        phone: '+91-9876543211'
      },
      {
        email: 'processor@jeevarekha.com',
        password: hashedPassword,
        role: 'processor',
        name: 'Amit Patel',
        phone: '+91-9876543212'
      },
      {
        email: 'manager@jeevarekha.com',
        password: hashedPassword,
        role: 'supply_manager',
        name: 'Suresh Reddy',
        phone: '+91-9876543213'
      }
    ];
    
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email}`);
      }
    }
    
    // Create sample harvest
    const farmer = await User.findOne({ role: 'farmer' });
    if (farmer) {
      const harvest = new Harvest({
        farmerId: farmer._id,
        species: 'Tulsi (Holy Basil)',
        variety: 'Krishna Tulsi',
        quantity: 50,
        unit: 'kg',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        },
        harvestDate: new Date('2024-01-15'),
        notes: 'Organic harvest from certified farm',
        status: 'pending_testing'
      });
      
      const existingHarvest = await Harvest.findOne({ species: 'Tulsi (Holy Basil)' });
      if (!existingHarvest) {
        await harvest.save();
        console.log('Created sample harvest');
        
        // Create sample herb
        const herb = new Herb({
          name: 'Tulsi (Holy Basil)',
          species: 'Ocimum tenuiflorum',
          variety: 'Krishna Tulsi',
          farmerId: farmer._id,
          harvests: [harvest._id],
          harvestId: harvest._id,
          batchId: 'BATCH-' + Date.now(),
          quantity: 50,
          location: 'New Delhi, India',
          origin: {
            type: 'Point',
            coordinates: [77.2090, 28.6139],
            address: 'New Delhi, India',
            region: 'Delhi',
            country: 'India'
          },
          harvestDate: harvest.harvestDate,
          qualityGrade: 'A',
          status: 'harvested',
          qrCode: 'QR-' + Date.now(),
          updatedBy: 'Farmer'
        });
        
        await herb.save();
        console.log('Created sample herb');
        
        // Create test results for the herb
        const testResults = [
          new TestResult({
            herbId: herb._id,
            harvestId: harvest._id,
            testType: 'purity',
            results: new Map([
              ['purity_level', 98.5],
              ['unit', '%'],
              ['notes', 'High purity level achieved']
            ]),
            qualityGrade: 'A',
            labTechnician: labTechnician._id,
            testDate: new Date(),
            status: 'completed'
          }),
          new TestResult({
            herbId: herb._id,
            harvestId: harvest._id,
            testType: 'heavy_metals',
            results: new Map([
              ['lead', 0.02],
              ['cadmium', 0.01],
              ['unit', 'ppm'],
              ['notes', 'Within acceptable limits']
            ]),
            qualityGrade: 'A',
            labTechnician: labTechnician._id,
            testDate: new Date(),
            status: 'completed'
          }),
          new TestResult({
            herbId: herb._id,
            harvestId: harvest._id,
            testType: 'pesticides',
            results: new Map([
              ['residue_level', 0.01],
              ['unit', 'mg/kg'],
              ['notes', 'No harmful pesticides detected']
            ]),
            qualityGrade: 'A',
            labTechnician: labTechnician._id,
            testDate: new Date(),
            status: 'completed'
          })
        ];
        
        for (const testResult of testResults) {
          await testResult.save();
        }
        console.log('Created test results');
        
        // Create certificates
        const certificates = [
          new Certificate({
            herb: herb._id,
            certificateName: 'Organic Certification',
            certificateType: 'Organic',
            status: 'valid',
            issuedBy: 'Organic Certification Agency',
            issueDate: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            certificateNumber: 'ORG_CERT_001'
          }),
          new Certificate({
            herb: herb._id,
            certificateName: 'Quality Assurance Certificate',
            certificateType: 'Quality',
            status: 'valid',
            issuedBy: 'Quality Assurance Board',
            issueDate: new Date(),
            validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
            certificateNumber: 'QA_CERT_001'
          })
        ];
        
        for (const certificate of certificates) {
          await certificate.save();
        }
        console.log('Created certificates');
        
        // Create processing batch
        const processingBatch = new ProcessingBatch({
          batchId: 'BATCH_TULSI_001',
          herbs: [herb._id],
          processingDate: new Date(),
          processingMethod: 'Drying and Packaging',
          temperature: '25°C',
          humidity: '45%',
          duration: '48 hours',
          processedBy: 'Amit Patel',
          status: 'completed',
          qualityGrade: 'A+',
          packagingType: 'Vacuum Sealed',
          storageConditions: 'Cool, dry place'
        });
        
        await processingBatch.save();
        console.log('Created processing batch');
      }
    }
    
    console.log('Database setup completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Farmer: farmer@jeevarekha.com / password');
    console.log('Lab Technician: lab@jeevarekha.com / password');
    console.log('Processor: processor@jeevarekha.com / password');
    console.log('Supply Manager: manager@jeevarekha.com / password');
    
  } catch (error) {
    console.error('Database setup error:', error);
    console.error('Make sure MongoDB is running on your system');
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Create uploads directory
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

setupDatabase();

