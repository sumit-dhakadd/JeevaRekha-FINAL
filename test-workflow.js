// Test script to demonstrate the sequential workflow
const mongoose = require('mongoose');
const User = require('./models/User');
const Herb = require('./models/Herb');
const Harvest = require('./models/Harvest');
const TestResult = require('./models/TestResult');
const ProcessingBatch = require('./models/ProcessingBatch');

async function testWorkflow() {
    try {
        console.log('🌿 Testing Sequential Herb Workflow...\n');
        
        // Connect to database
        await mongoose.connect('mongodb://localhost:27017/herb-supply-chain', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');
        
        // Find test users
        const farmer = await User.findOne({ role: 'farmer' });
        const labTech = await User.findOne({ role: 'lab_technician' });
        const processor = await User.findOne({ role: 'processor' });
        const manager = await User.findOne({ role: 'supply_manager' });
        
        if (!farmer || !labTech || !processor || !manager) {
            console.log('❌ Test users not found. Please run setup.js first.');
            return;
        }
        
        console.log('👥 Found test users:');
        console.log(`   Farmer: ${farmer.name}`);
        console.log(`   Lab Tech: ${labTech.name}`);
        console.log(`   Processor: ${processor.name}`);
        console.log(`   Manager: ${manager.name}\n`);
        
        // Step 1: Farmer adds herb
        console.log('🌱 Step 1: Farmer adds herb...');
        const harvest = new Harvest({
            farmerId: farmer._id,
            species: 'Test Herb',
            variety: 'Premium',
            quantity: 10,
            location: {
                coordinates: [77.2090, 28.6139],
                address: 'Test Farm, Delhi',
                region: 'Delhi',
                country: 'India'
            },
            harvestDate: new Date(),
            notes: 'Test harvest for workflow demonstration',
            status: 'pending_testing'
        });
        await harvest.save();
        
        const herb = new Herb({
            name: 'Test Herb',
            species: 'Test Herb',
            variety: 'Premium',
            farmerId: farmer._id,
            harvests: [harvest._id],
            batchId: 'TEST-BATCH-' + Date.now(),
            quantity: 10,
            location: 'Test Farm, Delhi',
            origin: {
                type: 'Point',
                coordinates: [77.2090, 28.6139],
                address: 'Test Farm, Delhi',
                region: 'Delhi',
                country: 'India'
            },
            harvestDate: new Date(),
            qualityGrade: 'C',
            status: 'harvested',
            qrCode: 'TEST-QR-' + Date.now(),
            updatedBy: 'Farmer',
            workflowStatus: {
                farmer: { completed: true, completedAt: new Date(), details: 'Harvested 10kg of Test Herb' },
                labTechnician: { completed: false, completedAt: null, details: null },
                processor: { completed: false, completedAt: null, details: null },
                manager: { completed: false, completedAt: null, details: null }
            }
        });
        await herb.save();
        console.log(`   ✅ Herb created with ID: ${herb._id}`);
        console.log(`   ✅ Workflow Status: Farmer completed\n`);
        
        // Step 2: Lab Technician tests
        console.log('🧪 Step 2: Lab Technician performs testing...');
        const testResult = new TestResult({
            herbId: herb._id,
            harvestId: harvest._id,
            testType: 'purity',
            results: new Map([
                ['purity', '98.5%'],
                ['moisture', '8.2%'],
                ['ash_content', '2.1%']
            ]),
            qualityGrade: 'A',
            labTechnician: labTech._id,
            testDate: new Date(),
            status: 'completed'
        });
        await testResult.save();
        
        herb.testResults.push(testResult._id);
        herb.updatedBy = 'Laboratory';
        herb.status = 'tested';
        herb.workflowStatus.labTechnician = { 
            completed: true, 
            completedAt: new Date(), 
            details: 'Quality testing completed - Grade: A' 
        };
        await herb.save();
        console.log(`   ✅ Test results added: Grade A`);
        console.log(`   ✅ Workflow Status: Lab Technician completed\n`);
        
        // Step 3: Processor processes
        console.log('⚙️ Step 3: Processor creates processing batch...');
        const processingBatch = new ProcessingBatch({
            harvestIds: [harvest._id],
            processingType: 'drying',
            facilityId: processor._id,
            startDate: new Date(),
            status: 'in_progress',
            steps: [{
                stepName: 'Initial Drying',
                details: 'Herbs dried at 40°C for 24 hours',
                qualityCheck: {
                    passed: true,
                    notes: 'Moisture content reduced to 5%',
                    inspector: processor._id
                },
                timestamp: new Date(),
                operator: processor._id
            }]
        });
        await processingBatch.save();
        
        herb.processingBatches.push(processingBatch._id);
        herb.status = 'processing';
        herb.workflowStatus.processor = { 
            completed: true, 
            completedAt: new Date(), 
            details: 'Processing batch created - Type: drying' 
        };
        herb.updatedBy = 'Processor';
        await herb.save();
        console.log(`   ✅ Processing batch created: ${processingBatch._id}`);
        console.log(`   ✅ Workflow Status: Processor completed\n`);
        
        // Step 4: Manager completes workflow
        console.log('👨‍💼 Step 4: Manager completes workflow and generates QR...');
        herb.workflowStatus.manager = { 
            completed: true, 
            completedAt: new Date(), 
            details: 'Final approval and certification completed' 
        };
        herb.status = 'packaged';
        herb.updatedBy = 'Manager';
        herb.qrCode = 'FINAL-QR-' + Date.now();
        await herb.save();
        
        const qrData = {
            herbId: herb._id,
            species: herb.species,
            variety: herb.variety,
            batchId: herb.batchId,
            harvestDate: herb.harvestDate,
            origin: herb.origin,
            farmer: {
                name: farmer.name,
                email: farmer.email,
                phone: farmer.phone
            },
            workflow: herb.workflowStatus,
            testResults: herb.testResults,
            processingBatches: herb.processingBatches,
            certificateInfo: {
                issuedBy: manager.name,
                issueDate: new Date().toISOString(),
                validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            },
            finalQRGenerated: new Date().toISOString()
        };
        
        console.log(`   ✅ Workflow completed successfully!`);
        console.log(`   ✅ Final QR Code: ${herb.qrCode}`);
        console.log(`   ✅ QR Data contains all participant details\n`);
        
        // Display final workflow status
        console.log('📊 Final Workflow Status:');
        console.log(`   Farmer: ${herb.workflowStatus.farmer.completed ? '✅ Completed' : '❌ Pending'}`);
        console.log(`   Lab Technician: ${herb.workflowStatus.labTechnician.completed ? '✅ Completed' : '❌ Pending'}`);
        console.log(`   Processor: ${herb.workflowStatus.processor.completed ? '✅ Completed' : '❌ Pending'}`);
        console.log(`   Manager: ${herb.workflowStatus.manager.completed ? '✅ Completed' : '❌ Pending'}\n`);
        
        console.log('🎉 Workflow test completed successfully!');
        console.log('📱 QR Code can now be scanned to show all participant details.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testWorkflow();

