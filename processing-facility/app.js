// Global variables
let currentUser = null;
let charts = {};

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        showScreen('dashboardScreen');
        loadDashboardData();
    } else {
        showScreen('loginScreen');}
    }

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    // Batch creation
    document.getElementById('newBatchForm').addEventListener('submit', handleNewBatch);
    // Processing step logging
    document.getElementById('processingStepForm').addEventListener('submit', handleProcessingStep);
    document.getElementById('qualityPassed').addEventListener('change', toggleQualityNotes);
    // Packaging
    document.getElementById('packagingForm').addEventListener('submit', handlePackaging);
}
// Processor registration handler
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, role: 'processor' })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! You can now log in.');
            document.getElementById('registerForm').reset();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
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
    } else if (screenId === 'batchTrackingScreen') {
        loadBatchTrackingData();
    } else if (screenId === 'processingStepsScreen') {
        loadProcessingStepsData();
    } else if (screenId === 'qualityControlScreen') {
        loadQualityControlData();
    } else if (screenId === 'packagingScreen') {
        loadPackagingData();
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
            body: JSON.stringify({ email, password, role: 'processor' })
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
        const [batchesResponse, analyticsResponse, pendingHerbsResponse] = await Promise.all([
            fetch(`${API_BASE}/processing-batches`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/analytics/processing`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/processor/pending-herbs`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (batchesResponse.ok) {
            const batches = await batchesResponse.json();
            updateDashboardStats(batches);
            displayActiveBatches(batches.filter(batch => batch.status === 'in_progress'));
        }
        
        if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            updateStepsChart(analytics);
        }
        
        if (pendingHerbsResponse.ok) {
            const pendingHerbs = await pendingHerbsResponse.json();
            displayPendingHerbs(pendingHerbs);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(batches) {
    const activeBatches = batches.filter(batch => batch.status === 'in_progress').length;
    const completedBatches = batches.filter(batch => batch.status === 'completed').length;
    const pendingBatches = batches.filter(batch => batch.status === 'pending').length;
    const efficiency = 85; // This would be calculated from performance data
    
    document.getElementById('activeBatches').textContent = activeBatches;
    document.getElementById('completedBatches').textContent = completedBatches;
    document.getElementById('pendingBatches').textContent = pendingBatches;
    document.getElementById('efficiency').textContent = efficiency + '%';
}

function displayActiveBatches(batches) {
    const container = document.getElementById('activeBatchesList');
    
    if (batches.length === 0) {
        container.innerHTML = '<p>No active batches.</p>';
        return;
    }
    
    container.innerHTML = batches.map(batch => `
        <div class="batch-item">
            <div class="batch-info">
                <h4>Batch ${batch._id.slice(-6)}</h4>
                <p>Type: ${batch.processingType}</p>
                <p>Started: ${new Date(batch.startDate).toLocaleDateString()}</p>
            </div>
            <div class="batch-status status-${batch.status}">
                ${batch.status.replace('_', ' ').toUpperCase()}
            </div>
        </div>
    `).join('');
}

function displayPendingHerbs(herbs) {
    const container = document.getElementById('pendingHerbs');
    if (!container) return;
    
    if (herbs.length === 0) {
        container.innerHTML = '<p class="no-data">No pending herbs for processing</p>';
        return;
    }
    
    container.innerHTML = herbs.map(herb => `
        <div class="herb-item">
            <div class="herb-info">
                <h4>${herb.species} ${herb.variety ? `(${herb.variety})` : ''}</h4>
                <p><strong>Farmer:</strong> ${herb.farmerId?.name || 'Unknown'}</p>
                <p><strong>Quantity:</strong> ${herb.quantity}kg</p>
                <p><strong>Batch ID:</strong> ${herb.batchId}</p>
                <p><strong>Test Results:</strong> ${herb.testResults?.length || 0} tests completed</p>
                <div class="workflow-status">
                    <span class="status-badge completed">✓ Farmer Completed</span>
                    <span class="status-badge completed">✓ Lab Testing Completed</span>
                    <span class="status-badge pending">⏳ Processing Pending</span>
                </div>
            </div>
            <div class="herb-actions">
                <button class="btn btn-primary" onclick='startProcessing("${herb._id}", ${JSON.stringify((herb.harvests || []).map(h => h._id || h))})'>
                    Start Processing
                </button>
                <button class="btn btn-secondary" onclick="viewHerbDetails('${herb._id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Quick-start processing for a tested herb: creates a batch with its harvests
async function startProcessing(herbId, harvestIds) {
    try {
        if (!Array.isArray(harvestIds) || harvestIds.length === 0) {
            alert('No harvests found for this herb.');
            return;
        }
        // Show process input modal to select processing type
        showProcessInputModal(herbId, harvestIds);
        const data = await response.json();
        if (response.ok) {
            // ...existing code...
        } else {
            alert(data.message || 'Failed to create processing batch');
        }
    } catch (error) {


// Show modal/section for process input
function showProcessInputModal(herbId, harvestIds) {
    const modal = document.getElementById('processInputModal');
    modal.style.display = 'block';
    modal.dataset.herbId = herbId;
    modal.dataset.harvestIds = JSON.stringify(harvestIds);
    // Attach submit handler if not already attached
    const form = document.getElementById('processInputForm');
    if (!form.dataset.bound) {
        form.addEventListener('submit', handleProcessInputSubmit);
        form.dataset.bound = 'true';
    }
}

// Handle process input form submission
async function handleProcessInputSubmit(e) {
    e.preventDefault();
    const modal = document.getElementById('processInputModal');
    const herbId = modal.dataset.herbId;
    const harvestIds = JSON.parse(modal.dataset.harvestIds);
    const processingType = document.getElementById('processTypeInput').value;
    modal.style.display = 'none';
    try {
        const response = await fetch(`${API_BASE}/processing-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                harvestIds: harvestIds,
                processingType: processingType,
                facilityId: currentUser?.id,
                startDate: new Date().toISOString()
            })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Processing batch created. You can now log processing steps.');
            loadDashboardData();
            showScreen('processingStepsScreen');
            loadProcessingStepsData();
        } else {
            alert(data.message || 'Failed to create processing batch');
        }
    } catch (error) {
        console.error('startProcessing error:', error);
        alert('Failed to start processing. Please try again.');
    }
}
    }
}

function updateStepsChart(analytics) {
    const ctx = document.getElementById('stepsChart').getContext('2d');
    
    if (charts.steps) {
        charts.steps.destroy();
    }
    
    charts.steps = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Drying', 'Cleaning', 'Grinding', 'Extraction', 'Packaging'],
            datasets: [{
                data: [25, 20, 15, 30, 10],
                backgroundColor: [
                    '#FFA726',
                    '#66BB6A',
                    '#42A5F5',
                    '#AB47BC',
                    '#EF5350'
                ]
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

// Batch tracking functions
async function loadBatchTrackingData() {
    try {
        const [batchesResponse, harvestsResponse] = await Promise.all([
            fetch(`${API_BASE}/processing-batches`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/harvests/available`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (batchesResponse.ok) {
            const batches = await batchesResponse.json();
            displayBatchList(batches);
        }
        
        if (harvestsResponse.ok) {
            const harvests = await harvestsResponse.json();
            populateHarvestSelection(harvests);
        }
    } catch (error) {
        console.error('Error loading batch tracking data:', error);
    }
}

function populateHarvestSelection(harvests) {
    const container = document.getElementById('harvestSelection');
    
    container.innerHTML = harvests.map(harvest => `
        <div class="harvest-item">
            <input type="checkbox" id="harvest_${harvest._id}" value="${harvest._id}">
            <label for="harvest_${harvest._id}">
                <strong>${harvest.species}</strong> - ${harvest.quantity} ${harvest.unit}
                <br><small>Harvested: ${new Date(harvest.harvestDate).toLocaleDateString()}</small>
            </label>
        </div>
    `).join('');
}

function displayBatchList(batches) {
    const container = document.getElementById('batchList');
    
    if (batches.length === 0) {
        container.innerHTML = '<p>No batches found.</p>';
        return;
    }
    
    container.innerHTML = batches.map(batch => `
        <div class="batch-item">
            <div class="batch-info">
                <h4>Batch ${batch._id.slice(-6)}</h4>
                <p>Type: ${batch.processingType}</p>
                <p>Started: ${new Date(batch.startDate).toLocaleDateString()}</p>
                <p>Steps: ${batch.steps.length}</p>
                <button class="btn btn-secondary" onclick="selectCompletedBatch('${batch._id}')">Select Batch</button>
            </div>
            <div class="batch-status status-${batch.status}">
                ${batch.status.replace('_', ' ').toUpperCase()}
            </div>
            <div class="completed-steps">
                <h5>Completed Steps:</h5>
                <ul>
                    ${(batch.steps && batch.steps.length > 0) ? batch.steps.map(step => `<li><strong>${step.stepName}</strong> - ${step.details || 'No details'} (${step.qualityCheck?.passed ? 'Passed' : 'Failed'})</li>`).join('') : '<li>No steps completed.</li>'}
                </ul>
            </div>
        </div>
    `).join('');
}

// Make select batch button functional for completed batches
function selectCompletedBatch(batchId) {
    localStorage.setItem('selectedCompletedBatchId', batchId);
    alert('Completed batch selected!');
    // Optionally, you can load batch details or steps here
    // Example: show completed steps in a modal or section
    // ...
}

async function handleNewBatch(e) {
    e.preventDefault();
    
    const selectedHarvests = Array.from(document.querySelectorAll('#harvestSelection input:checked'))
        .map(input => input.value);
    const processingType = document.getElementById('processingType').value;
    const expectedOutput = document.getElementById('expectedOutput').value;
    const outputUnit = document.getElementById('outputUnit').value;
    
    if (selectedHarvests.length === 0) {
        alert('Please select at least one harvest');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/processing-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                harvestIds: selectedHarvests,
                processingType,
                facilityId: currentUser.id,
                startDate: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Batch created successfully!');
            document.getElementById('newBatchForm').reset();
            loadBatchTrackingData();
        } else {
            alert(data.message || 'Failed to create batch');
        }
    } catch (error) {
        console.error('Batch creation error:', error);
        alert('Failed to create batch. Please try again.');
    }
}

// Processing steps functions
async function loadProcessingStepsData() {
    try {
        const [batchesResponse, stepsResponse] = await Promise.all([
            fetch(`${API_BASE}/processing-batches`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/processing-steps/recent`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (batchesResponse.ok) {
            const batches = await batchesResponse.json();
            populateBatchSelect(batches.filter(batch => batch.status === 'in_progress'));
        }
        
        if (stepsResponse.ok) {
            const steps = await stepsResponse.json();
            displayRecentSteps(steps);
        }
    } catch (error) {
        console.error('Error loading processing steps data:', error);
    }
}

function populateBatchSelect(batches) {
    const select = document.getElementById('batchSelect');
    
    select.innerHTML = '<option value="">Select a batch</option>';
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch._id;
        option.textContent = `Batch ${batch._id.slice(-6)} - ${batch.processingType}`;
        select.appendChild(option);
    });

    // Restore previously selected batch if saved
    const savedBatchId = localStorage.getItem('selectedBatchId');
    if (savedBatchId) {
        select.value = savedBatchId;
    }
}

function displayRecentSteps(steps) {
    const container = document.getElementById('recentSteps');
    
    if (steps.length === 0) {
        container.innerHTML = '<p>No recent steps found.</p>';
        return;
    }
    
    container.innerHTML = steps.map(step => `
        <div class="step-item">
            <h4>${step.stepName}</h4>
            <p>${step.details || 'No details provided'}</p>
            <p><strong>Quality Check:</strong> ${step.qualityCheck?.passed ? 'Passed' : 'Failed'}</p>
            <div class="step-meta">
                ${new Date(step.timestamp).toLocaleString()} by ${step.operator?.name || 'Unknown'}
            </div>
        </div>
    `).join('');
}

function toggleQualityNotes() {
    const qualityPassed = document.getElementById('qualityPassed').checked;
    const notesGroup = document.getElementById('qualityNotesGroup');
    
    notesGroup.style.display = qualityPassed ? 'none' : 'block';
}

async function handleProcessingStep(e) {
    e.preventDefault();
    
    const batchId = document.getElementById('batchSelect').value;
    const stepName = document.getElementById('stepName').value;
    const stepDetails = document.getElementById('stepDetails').value;
    const qualityPassed = document.getElementById('qualityPassed').checked;
    const qualityNotes = document.getElementById('qualityNotes').value;
    
    try {
        // Persist selection for future sessions
        if (batchId) {
            localStorage.setItem('selectedBatchId', batchId);
        }
        const response = await fetch(`${API_BASE}/processing-step`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                batchId,
                stepName,
                details: stepDetails,
                qualityCheck: {
                    passed: qualityPassed,
                    notes: qualityNotes
                }
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Processing step logged successfully!');
            document.getElementById('processingStepForm').reset();
            // Re-apply saved batch so user doesn't lose context
            const saved = localStorage.getItem('selectedBatchId');
            if (saved) {
                document.getElementById('batchSelect').value = saved;
            }
            loadProcessingStepsData();
        } else {
            alert(data.message || 'Failed to log processing step');
        }
    } catch (error) {
        console.error('Processing step logging error:', error);
        alert('Failed to log processing step. Please try again.');
    }
}

// Quality control functions
async function loadQualityControlData() {
    try {
        const [checkpointsResponse, metricsResponse] = await Promise.all([
            fetch(`${API_BASE}/quality/checkpoints`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/quality/metrics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (checkpointsResponse.ok) {
            const checkpoints = await checkpointsResponse.json();
            displayQualityCheckpoints(checkpoints);
        }
        
        if (metricsResponse.ok) {
            const metrics = await metricsResponse.json();
            updateQualityMetricsChart(metrics);
        }
    } catch (error) {
        console.error('Error loading quality control data:', error);
    }
}

function displayQualityCheckpoints(checkpoints) {
    const container = document.getElementById('qualityCheckpoints');
    
    container.innerHTML = checkpoints.map(checkpoint => `
        <div class="checkpoint-item">
            <div class="checkpoint-info">
                <h4>${checkpoint.name}</h4>
                <p>${checkpoint.description}</p>
                <p><strong>Last Check:</strong> ${new Date(checkpoint.lastCheck).toLocaleDateString()}</p>
            </div>
            <div class="checkpoint-status status-${checkpoint.status}">
                ${checkpoint.status.toUpperCase()}
            </div>
        </div>
    `).join('');
}

function updateQualityMetricsChart(metrics) {
    const ctx = document.getElementById('qualityMetricsChart').getContext('2d');
    
    if (charts.qualityMetrics) {
        charts.qualityMetrics.destroy();
    }
    
    charts.qualityMetrics = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Quality Score',
                data: [85, 88, 92, 90],
                borderColor: '#FFA726',
                backgroundColor: 'rgba(255, 167, 38, 0.1)',
                tension: 0.4
            }, {
                label: 'Defect Rate (%)',
                data: [5, 3, 2, 3],
                borderColor: '#EF5350',
                backgroundColor: 'rgba(239, 83, 80, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Packaging functions
async function loadPackagingData() {
    try {
        const [batchesResponse, historyResponse] = await Promise.all([
            fetch(`${API_BASE}/processing-batches/completed`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/packaging/history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (batchesResponse.ok) {
            const batches = await batchesResponse.json();
            populatePackagingBatchSelect(batches);
        }
        
        if (historyResponse.ok) {
            const history = await historyResponse.json();
            displayPackagingHistory(history);
        }
    } catch (error) {
        console.error('Error loading packaging data:', error);
    }
}

function populatePackagingBatchSelect(batches) {
    const select = document.getElementById('packagingBatchSelect');
    select.innerHTML = '<option value="">Select a completed batch</option>';
    select.batchesData = batches;
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch._id;
        option.textContent = `Batch ${batch._id.slice(-6)} - ${batch.processingType}`;
        select.appendChild(option);
    });
    // Clear steps display on load
    document.getElementById('completedBatchSteps').innerHTML = '';
}

// Show completed steps for selected batch in packaging section
function onPackagingBatchChange() {
    const select = document.getElementById('packagingBatchSelect');
    const batchId = select.value;
    const batches = select.batchesData || [];
    const batch = batches.find(b => b._id === batchId);
    const stepsDiv = document.getElementById('completedBatchSteps');
    if (!batch) {
        stepsDiv.innerHTML = '';
        return;
    }
    stepsDiv.innerHTML = `<h4>Completed Steps</h4><ul>${(batch.steps && batch.steps.length > 0) ? batch.steps.map(step => `<li><strong>${step.stepName}</strong> - ${step.details || 'No details'} (${step.qualityCheck?.passed ? 'Passed' : 'Failed'})</li>`).join('') : '<li>No steps completed.</li>'}</ul>`;
}

function displayPackagingHistory(history) {
    const container = document.getElementById('packagingHistory');
    
    if (history.length === 0) {
        container.innerHTML = '<p>No packaging history found.</p>';
        return;
    }
    
    container.innerHTML = history.map(item => `
        <div class="packaging-item">
            <div class="packaging-info">
                <h4>${item.productName}</h4>
                <p>Package: ${item.packageType} - ${item.packageSize}</p>
                <p>Material: ${item.packageMaterial}</p>
                <p>Quantity: ${item.quantity} ${item.quantityUnit}</p>
            </div>
            <div class="packaging-time">
                ${new Date(item.packagingDate).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}
// ...existing code...

async function handlePackaging(e) {
    e.preventDefault();
    
    const batchId = document.getElementById('packagingBatchSelect').value;
    const packageType = document.getElementById('packageType').value;
    const packageSize = document.getElementById('packageSize').value;
    const packageMaterial = document.getElementById('packageMaterial').value;
    const productName = document.getElementById('productName').value;
    const batchNumber = document.getElementById('batchNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const ingredients = document.getElementById('ingredients').value;
    const packageQuantity = document.getElementById('packageQuantity').value;
    const packageQuantityUnit = document.getElementById('packageQuantityUnit').value;
    
    try {
        const response = await fetch(`${API_BASE}/packaging`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                batchId,
                packageType,
                packageSize,
                packageMaterial,
                productName,
                batchNumber,
                expiryDate,
                ingredients,
                quantity: parseFloat(packageQuantity),
                quantityUnit: packageQuantityUnit
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Product packaged successfully!');
            document.getElementById('packagingForm').reset();
            loadPackagingData();
        } else {
            alert(data.message || 'Failed to package product');
        }
    } catch (error) {
        console.error('Packaging error:', error);
        alert('Failed to package product. Please try again.');
    }
}


