// Global variables
let currentUser = null;
let qualityChart = null;
let signatureCanvas = null;
let isDrawing = false;
let autoRefreshInterval = null;
let supplyChainData = [];

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeSignatureCanvas();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        showScreen('dashboardScreen');
        loadDashboardData();
    } else {
        showScreen('loginScreen');
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Sample registration
    document.getElementById('sampleRegistrationForm').addEventListener('submit', handleSampleRegistration);
    document.getElementById('searchHarvestBtn').addEventListener('click', searchHarvest);
    
    // Test results
    document.getElementById('testResultsForm').addEventListener('submit', handleTestResultsSubmit);
    document.getElementById('testSelect').addEventListener('change', loadTestDetails);
    
    // Certificate
    document.getElementById('certificateForm').addEventListener('submit', handleCertificateSubmit);
    document.getElementById('verificationForm').addEventListener('submit', handleCertificateVerification);
    
    // Signature
    document.getElementById('clearSignature').addEventListener('click', clearSignature);
    document.getElementById('saveSignature').addEventListener('click', saveSignature);
    
    // Supply chain tracking
    document.getElementById('refreshSupplyChain').addEventListener('click', loadSupplyChainData);
    document.getElementById('toggleAutoRefresh').addEventListener('click', toggleAutoRefresh);
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Load data for specific screens
    if (screenId === 'dashboardScreen') {
        loadDashboardData();
    } else if (screenId === 'testResultsScreen') {
        loadAvailableTestTypes();
    } else if (screenId === 'certificationScreen') {
        loadCompletedTests();
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role: 'lab_technician' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showScreen('dashboardScreen');
            loadDashboardData();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    showScreen('loginScreen');
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const [testsResponse, analyticsResponse] = await Promise.all([
            fetch(`${API_BASE}/test-results`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (testsResponse.ok) {
            const tests = await testsResponse.json();
            updateDashboardStats(tests);
            displayRecentTests(tests.slice(0, 5));
        }
        
        if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            updateQualityChart(analytics.qualityDistribution);
        }
        
        // Load pending herbs
        await loadPendingHerbs();
        
        // Load supply chain data
        await loadSupplyChainData();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load pending harvests for testing (source of truth: Harvest collection)
async function loadPendingHerbs() {
    try {
        const response = await fetch(`${API_BASE}/lab/pending-harvests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const harvests = await response.json();
            displayPendingHerbs(harvests);
        }
    } catch (error) {
        console.error('Error loading pending herbs:', error);
    }
}

// Display pending harvests in the dashboard
function displayPendingHerbs(harvests) {
    const container = document.getElementById('pendingHarvests');
    if (!container) return;
    
    if (harvests.length === 0) {
        container.innerHTML = '<p class="no-data">No pending herbs for testing</p>';
        return;
    }
    
    container.innerHTML = harvests.map(harvest => `
        <div class="harvest-item">
            <div class="harvest-info">
                <h4>${harvest.species}</h4>
                <p><strong>Farmer:</strong> ${harvest.farmerId?.name || 'Unknown'}</p>
                <p><strong>Quantity:</strong> ${harvest.quantity} ${harvest.unit || 'kg'}</p>
                <p><strong>Location:</strong> ${harvest.location?.address || 'Unknown'}</p>
                <p><strong>Harvest Date:</strong> ${new Date(harvest.harvestDate).toLocaleDateString()}</p>
                <div class="workflow-status">
                    <span class="status-badge completed">✓ Farmer Completed</span>
                    <span class="status-badge pending">⏳ Lab Testing Pending</span>
                </div>
            </div>
            <div class="harvest-actions">
                <button class="btn btn-primary" onclick="startTesting(null, '${harvest._id}')">
                    Start Testing
                </button>
            </div>
        </div>
    `).join('');
}

// Start testing for a harvest
function startTesting(herbId, harvestId) {
    // Set the harvest ID (actual harvest ObjectId) in the test form
    document.getElementById('harvestId').value = harvestId;
    // Also store herb for context if needed later
    document.getElementById('testResultsForm').dataset.herbId = herbId;
    showScreen('testResultsScreen');
    loadAvailableTestTypes();
}

// Load available test types for the dropdown
function loadAvailableTestTypes() {
    const testSelect = document.getElementById('testSelect');
    
    // Define available test types
    const testTypes = [
        { value: 'purity', label: 'Purity Test', description: 'Test for purity and quality' },
        { value: 'potency', label: 'Potency Test', description: 'Test for active compounds' },
        { value: 'contamination', label: 'Contamination Test', description: 'Test for microbial contamination' },
        { value: 'microbial', label: 'Microbial Test', description: 'Test for bacteria and fungi' },
        { value: 'heavy_metals', label: 'Heavy Metals Test', description: 'Test for heavy metal content' },
        { value: 'pesticides', label: 'Pesticide Residue Test', description: 'Test for pesticide residues' }
    ];
    
    // Clear existing options
    testSelect.innerHTML = '<option value="">Select a test to complete</option>';
    
    // Add test type options
    testTypes.forEach(testType => {
        const option = document.createElement('option');
        option.value = testType.value;
        option.textContent = testType.label;
        option.title = testType.description;
        testSelect.appendChild(option);
    });
}

function updateDashboardStats(tests) {
    const totalTests = tests.length;
    const pendingTests = tests.filter(test => test.status === 'pending').length;
    const completedTests = tests.filter(test => test.status === 'completed').length;
    const certificatesIssued = tests.filter(test => test.certificate).length;
    
    document.getElementById('totalTests').textContent = totalTests;
    document.getElementById('pendingTests').textContent = pendingTests;
    document.getElementById('completedTests').textContent = completedTests;
    document.getElementById('certificatesIssued').textContent = certificatesIssued;
}

function displayRecentTests(tests) {
    const container = document.getElementById('recentTests');
    
    if (tests.length === 0) {
        container.innerHTML = '<p>No recent tests found.</p>';
        return;
    }
    
    container.innerHTML = tests.map(test => `
        <div class="test-item">
            <div class="test-info">
                <h4>${test.testType.replace('_', ' ').toUpperCase()}</h4>
                <p>${test.harvestId?.species || 'Unknown'} • ${new Date(test.testDate).toLocaleDateString()}</p>
            </div>
            <div class="test-status status-${test.status}">
                ${test.status.toUpperCase()}
            </div>
        </div>
    `).join('');
}

function updateQualityChart(qualityDistribution) {
    const ctx = document.getElementById('qualityChart').getContext('2d');
    
    if (qualityChart) {
        qualityChart.destroy();
    }
    
    const labels = qualityDistribution.map(item => `Grade ${item._id}`);
    const data = qualityDistribution.map(item => item.count);
    const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF5722'];
    
    qualityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Sample registration functions
async function searchHarvest() {
    const harvestId = document.getElementById('harvestId').value;
    
    if (!harvestId) {
        alert('Please enter a harvest ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/harvest/${harvestId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const harvest = await response.json();
            displayHarvestInfo(harvest);
        } else {
            alert('Harvest not found');
        }
    } catch (error) {
        console.error('Error searching harvest:', error);
        alert('Error searching harvest');
    }
}

function displayHarvestInfo(harvest) {
    document.getElementById('harvestSpecies').textContent = harvest.species;
    document.getElementById('harvestQuantity').textContent = `${harvest.quantity} ${harvest.unit}`;
    document.getElementById('harvestDate').textContent = new Date(harvest.harvestDate).toLocaleDateString();
    document.getElementById('harvestFarmer').textContent = harvest.farmerId?.name || 'Unknown';
    
    document.getElementById('harvestInfo').classList.remove('hidden');
}

async function handleSampleRegistration(e) {
    e.preventDefault();
    
    const harvestId = document.getElementById('harvestId').value;
    const testType = document.getElementById('testType').value;
    const priority = document.getElementById('priority').value;
    const expectedDate = document.getElementById('expectedDate').value;
    
    try {
        const response = await fetch(`${API_BASE}/test-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                harvestId,
                testType,
                priority,
                expectedDate,
                labTechnician: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Sample registered successfully!');
            document.getElementById('sampleRegistrationForm').reset();
            document.getElementById('harvestInfo').classList.add('hidden');
        } else {
            alert(data.message || 'Failed to register sample');
        }
    } catch (error) {
        console.error('Sample registration error:', error);
        alert('Failed to register sample. Please try again.');
    }
}

// Test results functions
async function loadPendingTests() {
    try {
        const response = await fetch(`${API_BASE}/test-results`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const tests = await response.json();
            const pendingTests = tests.filter(test => test.status === 'pending' || test.status === 'in_progress');
            
            const select = document.getElementById('testSelect');
            select.innerHTML = '<option value="">Select a test to complete</option>';
            
            pendingTests.forEach(test => {
                const option = document.createElement('option');
                option.value = test._id;
                option.textContent = `${test.testType.replace('_', ' ').toUpperCase()} - ${test.harvestId?.species || 'Unknown'}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading pending tests:', error);
    }
}

async function loadTestDetails() {
    const testType = document.getElementById('testSelect').value;
    
    if (!testType) {
        document.getElementById('testDetails').classList.add('hidden');
        return;
    }
    
    // Show test details for the selected test type
    displayTestTypeDetails(testType);
}

// Display test type details
function displayTestTypeDetails(testType) {
    const testDetails = document.getElementById('testDetails');
    const testIdSpan = document.getElementById('testId');
    const testTypeSpan = document.getElementById('testType');
    const testDescriptionSpan = document.getElementById('testDescription');
    
    // Generate a test ID
    const testId = 'TEST-' + Date.now();
    
    // Set test details
    testIdSpan.textContent = testId;
    testTypeSpan.textContent = testType.replace('_', ' ').toUpperCase();
    
    // Set description based on test type
    const descriptions = {
        'purity': 'Test for purity and quality of the herb sample',
        'potency': 'Test for active compounds and potency levels',
        'contamination': 'Test for microbial contamination and pathogens',
        'microbial': 'Test for bacteria, fungi, and other microorganisms',
        'heavy_metals': 'Test for heavy metal content (lead, cadmium, etc.)',
        'pesticides': 'Test for pesticide residues and chemical contaminants'
    };
    
    testDescriptionSpan.textContent = descriptions[testType] || 'Quality testing for herb sample';
    
    // Show the test details section
    testDetails.classList.remove('hidden');
    
    // Update form fields
    document.getElementById('testTypeInput').value = testType;
    document.getElementById('testIdInput').value = testId;
    
    // Load test parameters
    loadTestParameters(testType);
}

function displayTestDetails(test) {
    document.getElementById('testId').textContent = test._id;
    document.getElementById('testSpecies').textContent = test.harvestId?.species || 'Unknown';
    document.getElementById('testTypeDisplay').textContent = test.testType.replace('_', ' ').toUpperCase();
    
    document.getElementById('testDetails').classList.remove('hidden');
}

function loadTestParameters(testType) {
    const container = document.getElementById('testParameters');
    container.innerHTML = '';
    
    const parameters = getTestParameters(testType);
    
    parameters.forEach(param => {
        const div = document.createElement('div');
        div.className = 'test-parameter';
        div.innerHTML = `
            <label>${param.label}</label>
            <input type="${param.type}" name="${param.name}" placeholder="${param.placeholder}" ${param.required ? 'required' : ''}>
        `;
        container.appendChild(div);
    });
}

function getTestParameters(testType) {
    const parameterSets = {
        purity: [
            { name: 'purity_percentage', label: 'Purity Percentage (%)', type: 'number', placeholder: 'Enter purity percentage', required: true },
            { name: 'foreign_matter', label: 'Foreign Matter (%)', type: 'number', placeholder: 'Enter foreign matter percentage' },
            { name: 'moisture_content', label: 'Moisture Content (%)', type: 'number', placeholder: 'Enter moisture content' }
        ],
        potency: [
            { name: 'active_compounds', label: 'Active Compounds (%)', type: 'number', placeholder: 'Enter active compounds percentage', required: true },
            { name: 'alkaloid_content', label: 'Alkaloid Content (%)', type: 'number', placeholder: 'Enter alkaloid content' },
            { name: 'volatile_oil', label: 'Volatile Oil (%)', type: 'number', placeholder: 'Enter volatile oil percentage' }
        ],
        contamination: [
            { name: 'pesticide_residue', label: 'Pesticide Residue (ppm)', type: 'number', placeholder: 'Enter pesticide residue level' },
            { name: 'heavy_metals', label: 'Heavy Metals (ppm)', type: 'number', placeholder: 'Enter heavy metals level' },
            { name: 'aflatoxin', label: 'Aflatoxin (ppb)', type: 'number', placeholder: 'Enter aflatoxin level' }
        ],
        microbial: [
            { name: 'total_plate_count', label: 'Total Plate Count (CFU/g)', type: 'number', placeholder: 'Enter total plate count', required: true },
            { name: 'coliform_count', label: 'Coliform Count (CFU/g)', type: 'number', placeholder: 'Enter coliform count' },
            { name: 'e_coli', label: 'E. Coli (CFU/g)', type: 'number', placeholder: 'Enter E. Coli count' }
        ],
        heavy_metals: [
            { name: 'lead', label: 'Lead (ppm)', type: 'number', placeholder: 'Enter lead level', required: true },
            { name: 'cadmium', label: 'Cadmium (ppm)', type: 'number', placeholder: 'Enter cadmium level' },
            { name: 'mercury', label: 'Mercury (ppm)', type: 'number', placeholder: 'Enter mercury level' },
            { name: 'arsenic', label: 'Arsenic (ppm)', type: 'number', placeholder: 'Enter arsenic level' }
        ],
        pesticides: [
            { name: 'organophosphates', label: 'Organophosphates (ppm)', type: 'number', placeholder: 'Enter organophosphates level' },
            { name: 'organochlorines', label: 'Organochlorines (ppm)', type: 'number', placeholder: 'Enter organochlorines level' },
            { name: 'carbamates', label: 'Carbamates (ppm)', type: 'number', placeholder: 'Enter carbamates level' }
        ]
    };
    
    return parameterSets[testType] || [];
}

// Signature functions
function initializeSignatureCanvas() {
    signatureCanvas = document.getElementById('signatureCanvas');
    const ctx = signatureCanvas.getContext('2d');
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = signatureCanvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = signatureCanvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignature() {
    const ctx = signatureCanvas.getContext('2d');
    ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

function saveSignature() {
    const signatureData = signatureCanvas.toDataURL();
    // Store signature data for form submission
    document.getElementById('testResultsForm').dataset.signature = signatureData;
    alert('Signature saved!');
}

// Test results submission
async function handleTestResultsSubmit(e) {
    e.preventDefault();
    
    const testType = document.getElementById('testSelect').value;
    const harvestId = document.getElementById('harvestId').value;
    const qualityGrade = document.getElementById('qualityGrade').value;
    const labNotes = document.getElementById('labNotes').value;
    const signatureData = e.target.dataset.signature;
    
    if (!testType || !harvestId) {
        alert('Please select a test type and ensure harvest ID is set');
        return;
    }
    
    // Collect test parameters
    const results = {};
    const parameterInputs = document.querySelectorAll('#testParameters input');
    parameterInputs.forEach(input => {
        if (input.value) {
            results[input.name] = parseFloat(input.value);
        }
    });
    
    try {
        const response = await fetch(`${API_BASE}/test-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                harvestId,
                testType,
                results,
                qualityGrade,
                labTechnician: currentUser.id,
                digitalSignature: signatureData,
                status: 'completed'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Test results submitted successfully!');
            document.getElementById('testResultsForm').reset();
            document.getElementById('testDetails').classList.add('hidden');
            clearSignature();
            loadPendingTests();
        } else {
            alert(data.message || 'Failed to submit test results');
        }
    } catch (error) {
        console.error('Test results submission error:', error);
        alert('Failed to submit test results. Please try again.');
    }
}

// Certificate functions
async function loadCompletedTests() {
    try {
        const response = await fetch(`${API_BASE}/test-results`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const tests = await response.json();
            const completedTests = tests.filter(test => test.status === 'completed');
            
            const select = document.getElementById('certificateTestSelect');
            select.innerHTML = '<option value="">Select test result</option>';
            
            completedTests.forEach(test => {
                const option = document.createElement('option');
                option.value = test._id;
                option.textContent = `${test.testType.replace('_', ' ').toUpperCase()} - Grade ${test.qualityGrade}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading completed tests:', error);
    }
}

async function handleCertificateSubmit(e) {
    e.preventDefault();
    
    const testResultId = document.getElementById('certificateTestSelect').value;
    const certificateType = document.getElementById('certificateType').value;
    const validityPeriod = document.getElementById('validityPeriod').value;
    
    try {
        const response = await fetch(`${API_BASE}/certificates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                testResultId,
                certificateType,
                validityPeriod: parseInt(validityPeriod)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Certificate generated successfully! Certificate Number: ${data.certificateNumber}`);
            document.getElementById('certificateForm').reset();
        } else {
            alert(data.message || 'Failed to generate certificate');
        }
    } catch (error) {
        console.error('Certificate generation error:', error);
        alert('Failed to generate certificate. Please try again.');
    }
}

async function handleCertificateVerification(e) {
    e.preventDefault();
    
    const certificateNumber = document.getElementById('certificateNumber').value;
    
    try {
        const response = await fetch(`${API_BASE}/certificates/verify/${certificateNumber}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        const resultDiv = document.getElementById('verificationResult');
        resultDiv.classList.remove('hidden');
        
        if (response.ok) {
            resultDiv.className = 'verification-result';
            resultDiv.innerHTML = `
                <h4>Certificate Valid</h4>
                <p><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
                <p><strong>Type:</strong> ${data.certificateType}</p>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Issued Date:</strong> ${new Date(data.issuedDate).toLocaleDateString()}</p>
                <p><strong>Expiry Date:</strong> ${new Date(data.expiryDate).toLocaleDateString()}</p>
            `;
        } else {
            resultDiv.className = 'verification-result invalid';
            resultDiv.innerHTML = `
                <h4>Certificate Invalid</h4>
                <p>${data.message || 'Certificate not found or expired'}</p>
            `;
        }
    } catch (error) {
        console.error('Certificate verification error:', error);
        alert('Failed to verify certificate. Please try again.');
    }
}

// Supply Chain Tracking Functions
async function loadSupplyChainData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/herbs/supply-chain`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            supplyChainData = await response.json();
            displaySupplyChainData();
        } else {
            console.error('Failed to load supply chain data');
        }
    } catch (error) {
        console.error('Error loading supply chain data:', error);
    }
}

function displaySupplyChainData() {
    const container = document.getElementById('supplyChainList');
    container.innerHTML = '';
    
    if (supplyChainData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No herbs in supply chain yet</p>';
        return;
    }
    
    supplyChainData.forEach(herb => {
        const herbElement = createSupplyChainItem(herb);
        container.appendChild(herbElement);
    });
}

function createSupplyChainItem(herb) {
    const div = document.createElement('div');
    div.className = 'supply-chain-item';
    div.setAttribute('data-herb-id', herb._id);
    
    const status = herb.supplyChainStatus || { stage: 'pending', status: 'Awaiting Harvest', color: '#f39c12' };
    
    div.innerHTML = `
        <div class="herb-header">
            <h3 class="herb-name">${herb.name}</h3>
            <span class="status-badge status-${status.stage}">${status.status}</span>
        </div>
        
        <div class="herb-details">
            <div class="detail-item">
                <div class="detail-label">Batch ID</div>
                <div class="detail-value">${herb.batchId || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Farmer</div>
                <div class="detail-value">${herb.farmerId?.name || 'Unknown'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Quantity</div>
                <div class="detail-value">${herb.quantity || 0} kg</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${herb.location || 'N/A'}</div>
            </div>
        </div>
        
        <div class="supply-chain-progress">
            <div class="progress-steps">
                <div class="progress-step ${status.stage === 'harvested' || status.stage === 'tested' || status.stage === 'processed' || status.stage === 'completed' ? 'completed' : status.stage === 'pending' ? 'current' : ''}"></div>
                <div class="progress-step ${status.stage === 'tested' || status.stage === 'processed' || status.stage === 'completed' ? 'completed' : status.stage === 'harvested' ? 'current' : ''}"></div>
                <div class="progress-step ${status.stage === 'processed' || status.stage === 'completed' ? 'completed' : status.stage === 'tested' ? 'current' : ''}"></div>
                <div class="progress-step ${status.stage === 'completed' ? 'completed' : status.stage === 'processed' ? 'current' : ''}"></div>
            </div>
        </div>
        
        <div class="progress-labels">
            <span>Harvest</span>
            <span>Testing</span>
            <span>Processing</span>
            <span>Certification</span>
        </div>
        
        <div class="last-updated">
            Last updated: ${new Date(herb.updatedAt || herb.createdAt).toLocaleString()}
        </div>
    `;
    
    return div;
}

function toggleAutoRefresh() {
    const button = document.getElementById('toggleAutoRefresh');
    
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        button.innerHTML = '<i class="fas fa-play"></i> Auto Refresh';
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
    } else {
        autoRefreshInterval = setInterval(loadSupplyChainData, 5000); // Refresh every 5 seconds
        button.innerHTML = '<i class="fas fa-pause"></i> Stop Auto';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-primary');
    }
}