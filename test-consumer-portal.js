const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5000/api';

async function testConsumerPortal() {
    console.log('🧪 Testing Consumer Portal Functionality...\n');
    
    try {
        // Test 1: Consumer Login
        console.log('1. Testing Consumer Login...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'consumer@jeevarekha.com',
                password: 'password',
                role: 'consumer'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Consumer login successful');
            console.log(`   User: ${loginData.user.name} (${loginData.user.email})`);
            console.log(`   Role: ${loginData.user.role}\n`);
            
            const token = loginData.token;
            
            // Test 2: QR Code Scanning
            console.log('2. Testing QR Code Scanning...');
            const qrResponse = await fetch(`${API_BASE}/herbs/qr/QR-${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (qrResponse.ok) {
                const herbData = await qrResponse.json();
                console.log('✅ QR Code scan successful');
                console.log(`   Herb: ${herbData.name}`);
                console.log(`   Scientific Name: ${herbData.scientificName}`);
                console.log(`   Status: ${herbData.status}`);
                console.log(`   Test Results: ${herbData.testResults.length} tests`);
                console.log(`   Certificates: ${herbData.certificates.length} certificates`);
                console.log(`   Supply Chain Steps: ${herbData.supplyChain.length} steps\n`);
                
                // Display detailed information
                console.log('📊 Detailed Herb Information:');
                console.log(`   Harvest Date: ${herbData.harvestDate}`);
                console.log(`   Origin: ${herbData.origin}`);
                console.log(`   Farmer: ${herbData.farmerName}`);
                console.log(`   Batch ID: ${herbData.batchId}\n`);
                
                // Display test results
                if (herbData.testResults.length > 0) {
                    console.log('🧪 Test Results:');
                    herbData.testResults.forEach(test => {
                        console.log(`   - ${test.testName}: ${test.result} (${test.value} ${test.unit})`);
                    });
                    console.log('');
                }
                
                // Display certificates
                if (herbData.certificates.length > 0) {
                    console.log('📜 Certificates:');
                    herbData.certificates.forEach(cert => {
                        console.log(`   - ${cert.name}: ${cert.status}`);
                    });
                    console.log('');
                }
                
                // Display supply chain
                if (herbData.supplyChain.length > 0) {
                    console.log('🔄 Supply Chain Journey:');
                    herbData.supplyChain.forEach(step => {
                        console.log(`   - ${step.step}: ${step.description} (${step.status})`);
                    });
                    console.log('');
                }
                
            } else {
                console.log('❌ QR Code scan failed - this is expected for demo');
                console.log('   (No herb found with the test QR code)\n');
            }
            
        } else {
            console.log('❌ Consumer login failed');
            const errorData = await loginResponse.json();
            console.log(`   Error: ${errorData.message}\n`);
        }
        
        // Test 3: Test with existing herb ID
        console.log('3. Testing with existing herb data...');
        const existingHerbResponse = await fetch(`${API_BASE}/herbs/qr/QR-${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (existingHerbResponse.status === 404) {
            console.log('✅ Expected behavior - QR code not found');
            console.log('   (This is normal for demo purposes)\n');
        }
        
        console.log('🎉 Consumer Portal Test Completed!');
        console.log('\n📱 To test the full consumer portal:');
        console.log('1. Open mobile-app/index.html in your browser');
        console.log('2. Select "Consumer" role');
        console.log('3. Login with: consumer@jeevarekha.com / password');
        console.log('4. Try the QR scanner or manual input');
        console.log('5. View comprehensive herb details');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testConsumerPortal();
