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
        showScreen('loginScreen');
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Inventory search
    document.getElementById('inventorySearch').addEventListener('input', filterInventory);
    document.getElementById('statusFilter').addEventListener('change', filterInventory);
    document.getElementById('locationFilter').addEventListener('change', filterInventory);
    
    // Report generation
    document.getElementById('reportForm').addEventListener('submit', handleReportGeneration);
    
    // Alert configuration
    document.getElementById('alertConfigForm').addEventListener('submit', handleAlertConfiguration);
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
    } else if (screenId === 'inventoryScreen') {
        loadInventoryData();
    } else if (screenId === 'analyticsScreen') {
        loadAnalyticsData();
    } else if (screenId === 'complianceScreen') {
        loadComplianceData();
    } else if (screenId === 'alertsScreen') {
        loadAlertsData();
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
            body: JSON.stringify({ email, password, role: 'supply_manager' })
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
        const [inventoryResponse, analyticsResponse, activitiesResponse] = await Promise.all([
            fetch(`${API_BASE}/inventory`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/activities`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (inventoryResponse.ok) {
            const inventory = await inventoryResponse.json();
            updateDashboardStats(inventory);
        }
        
        if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json();
            updateSupplyChainChart(analytics);
        }
        
        if (activitiesResponse.ok) {
            const activities = await activitiesResponse.json();
            displayRecentActivities(activities.slice(0, 5));
        }
        
        // Load pending herbs
        await loadPendingHerbs();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load pending herbs for management
async function loadPendingHerbs() {
    try {
        const response = await fetch(`${API_BASE}/manager/pending-herbs`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const herbs = await response.json();
            displayPendingHerbs(herbs);
        }
    } catch (error) {
        console.error('Error loading pending herbs:', error);
    }
}

// Display pending herbs in the dashboard
function displayPendingHerbs(herbs) {
    const container = document.getElementById('pendingHarvests');
    if (!container) return;
    
    if (herbs.length === 0) {
        container.innerHTML = '<p class="no-data">No pending herbs for final approval</p>';
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
                <p><strong>Processing Batches:</strong> ${herb.processingBatches?.length || 0} batches</p>
                <div class="workflow-status">
                    <span class="status-badge completed">✓ Farmer Completed</span>
                    <span class="status-badge completed">✓ Lab Testing Completed</span>
                    <span class="status-badge completed">✓ Processing Completed</span>
                    <span class="status-badge pending">⏳ Manager Approval Pending</span>
                </div>
            </div>
            <div class="herb-actions">
                <button class="btn btn-primary" onclick="completeHerbWorkflow('${herb._id}')">
                    Complete & Generate QR
                </button>
                <button class="btn btn-secondary" onclick="viewHerbDetails('${herb._id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Complete herb workflow and generate final QR
async function completeHerbWorkflow(herbId) {
    try {
        const finalDetails = prompt('Enter final approval details:');
        if (!finalDetails) return;
        
        const certificateInfo = {
            issuedBy: currentUser.name,
            issueDate: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        };
        
        const response = await fetch(`${API_BASE}/manager/complete-herb/${herbId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                finalDetails: finalDetails,
                certificateInfo: certificateInfo
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Herb workflow completed successfully! Final QR code generated.');
            
            // Show QR code data
            console.log('Final QR Data:', result.qrData);
            
            // Refresh the dashboard
            await loadPendingHerbs();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to complete herb workflow');
        }
    } catch (error) {
        console.error('Error completing herb workflow:', error);
        alert('Error completing herb workflow');
    }
}

// View herb details
function viewHerbDetails(herbId) {
    // This could open a modal or navigate to a details page
    console.log('Viewing herb details:', herbId);
    alert('Herb details functionality coming soon!');
}

// Assign harvest to processor
function assignToProcessor(harvestId) {
    // This could open a modal to select processor
    console.log('Assigning harvest to processor:', harvestId);
    alert('Assign to processor functionality coming soon!');
}

function updateDashboardStats(inventory) {
    const totalInventory = inventory.length;
    const activeShipments = inventory.filter(item => item.status === 'shipped').length;
    const alertsCount = 0; // This would come from alerts API
    const efficiency = 85; // This would be calculated from performance data
    
    document.getElementById('totalInventory').textContent = totalInventory;
    document.getElementById('activeShipments').textContent = activeShipments;
    document.getElementById('alertsCount').textContent = alertsCount;
    document.getElementById('efficiency').textContent = efficiency + '%';
}

function displayRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    
    if (activities.length === 0) {
        container.innerHTML = '<p>No recent activities found.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-info">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">
                ${formatTimeAgo(activity.timestamp)}
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'harvest': 'seedling',
        'test': 'flask',
        'process': 'cogs',
        'ship': 'truck',
        'alert': 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
}

function updateSupplyChainChart(analytics) {
    const ctx = document.getElementById('supplyChainChart').getContext('2d');
    
    if (charts.supplyChain) {
        charts.supplyChain.destroy();
    }
    
    charts.supplyChain = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Harvest Volume',
                data: [120, 150, 180, 200, 160, 190],
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                tension: 0.4
            }, {
                label: 'Processed Volume',
                data: [100, 130, 160, 180, 140, 170],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Inventory functions
async function loadInventoryData() {
    try {
        const response = await fetch(`${API_BASE}/inventory`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const inventory = await response.json();
            displayInventory(inventory);
            populateLocationFilter(inventory);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function displayInventory(inventory) {
    const container = document.getElementById('inventoryList');
    
    if (inventory.length === 0) {
        container.innerHTML = '<p>No inventory items found.</p>';
        return;
    }
    
    container.innerHTML = inventory.map(item => `
        <div class="inventory-item">
            <div class="inventory-info">
                <h4>${item.herbId?.species || 'Unknown'}</h4>
                <p>Quantity: ${item.quantity} ${item.unit}</p>
                <p>Location: ${item.location?.warehouse || 'Unknown'}</p>
            </div>
            <div class="inventory-status status-${item.status}">
                ${item.status.toUpperCase()}
            </div>
        </div>
    `).join('');
}

function populateLocationFilter(inventory) {
    const locations = [...new Set(inventory.map(item => item.location?.warehouse).filter(Boolean))];
    const select = document.getElementById('locationFilter');
    
    select.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        select.appendChild(option);
    });
}

function filterInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    
    // This would filter the displayed inventory items
    // Implementation depends on how you want to handle filtering
}

// Analytics functions
async function loadAnalyticsData() {
    try {
        const response = await fetch(`${API_BASE}/analytics`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const analytics = await response.json();
            updateAnalyticsCharts(analytics);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updateAnalyticsCharts(analytics) {
    // Harvest Volume Chart
    const harvestCtx = document.getElementById('harvestVolumeChart').getContext('2d');
    if (charts.harvestVolume) charts.harvestVolume.destroy();
    
    charts.harvestVolume = new Chart(harvestCtx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Harvest Volume (kg)',
                data: [1200, 1500, 1800, 1600],
                backgroundColor: '#9C27B0'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Quality Distribution Chart
    const qualityCtx = document.getElementById('qualityDistributionChart').getContext('2d');
    if (charts.qualityDistribution) charts.qualityDistribution.destroy();
    
    charts.qualityDistribution = new Chart(qualityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Grade A', 'Grade B', 'Grade C', 'Grade D'],
            datasets: [{
                data: [45, 30, 20, 5],
                backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF5722']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Processing Efficiency Chart
    const efficiencyCtx = document.getElementById('processingEfficiencyChart').getContext('2d');
    if (charts.processingEfficiency) charts.processingEfficiency.destroy();
    
    charts.processingEfficiency = new Chart(efficiencyCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Efficiency %',
                data: [85, 88, 92, 90],
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    // Timeline Chart
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    if (charts.timeline) charts.timeline.destroy();
    
    charts.timeline = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: ['Harvest', 'Testing', 'Processing', 'Packaging', 'Shipping'],
            datasets: [{
                label: 'Days',
                data: [2, 3, 5, 1, 2],
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y'
        }
    });
}

// Report generation
async function handleReportGeneration(e) {
    e.preventDefault();
    
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const format = document.getElementById('reportFormat').value;
    
    try {
        const response = await fetch(`${API_BASE}/reports/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                reportType,
                startDate,
                endDate,
                format
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportType}_${startDate}_${endDate}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Failed to generate report');
        }
    } catch (error) {
        console.error('Report generation error:', error);
        alert('Failed to generate report. Please try again.');
    }
}

// Compliance functions
async function loadComplianceData() {
    try {
        const [complianceResponse, alertsResponse, auditResponse] = await Promise.all([
            fetch(`${API_BASE}/compliance/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/compliance/alerts`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/compliance/audit`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (complianceResponse.ok) {
            const compliance = await complianceResponse.json();
            displayComplianceStatus(compliance);
        }
        
        if (alertsResponse.ok) {
            const alerts = await alertsResponse.json();
            displayComplianceAlerts(alerts);
        }
        
        if (auditResponse.ok) {
            const audit = await auditResponse.json();
            displayAuditTrail(audit);
        }
    } catch (error) {
        console.error('Error loading compliance data:', error);
    }
}

function displayComplianceStatus(compliance) {
    const container = document.getElementById('complianceStatus');
    
    container.innerHTML = compliance.map(item => `
        <div class="compliance-item ${item.status === 'warning' ? 'warning' : item.status === 'danger' ? 'danger' : ''}">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p><strong>Status:</strong> ${item.status.toUpperCase()}</p>
        </div>
    `).join('');
}

function displayComplianceAlerts(alerts) {
    const container = document.getElementById('complianceAlerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p>No compliance alerts.</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.severity}">
            <h4>${alert.title}</h4>
            <p>${alert.description}</p>
            <p class="alert-time">${formatTimeAgo(alert.timestamp)}</p>
        </div>
    `).join('');
}

function displayAuditTrail(audit) {
    const container = document.getElementById('auditTrail');
    
    container.innerHTML = audit.map(item => `
        <div class="audit-item">
            <div class="audit-info">
                <h4>${item.action}</h4>
                <p>${item.description}</p>
            </div>
            <div class="audit-time">
                ${formatTimeAgo(item.timestamp)}
            </div>
        </div>
    `).join('');
}

// Alerts functions
async function loadAlertsData() {
    try {
        const [activeResponse, historyResponse] = await Promise.all([
            fetch(`${API_BASE}/alerts/active`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/alerts/history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        if (activeResponse.ok) {
            const alerts = await activeResponse.json();
            displayActiveAlerts(alerts);
        }
        
        if (historyResponse.ok) {
            const history = await historyResponse.json();
            displayAlertHistory(history);
        }
    } catch (error) {
        console.error('Error loading alerts data:', error);
    }
}

function displayActiveAlerts(alerts) {
    const container = document.getElementById('activeAlerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p>No active alerts.</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.severity}">
            <h4>${alert.title}</h4>
            <p>${alert.description}</p>
            <p class="alert-time">${formatTimeAgo(alert.timestamp)}</p>
        </div>
    `).join('');
}

function displayAlertHistory(history) {
    const container = document.getElementById('alertHistory');
    
    container.innerHTML = history.map(alert => `
        <div class="alert-item ${alert.severity}">
            <h4>${alert.title}</h4>
            <p>${alert.description}</p>
            <p class="alert-time">${formatTimeAgo(alert.timestamp)}</p>
        </div>
    `).join('');
}

async function handleAlertConfiguration(e) {
    e.preventDefault();
    
    const alertType = document.getElementById('alertType').value;
    const thresholdValue = document.getElementById('thresholdValue').value;
    const notificationMethods = Array.from(document.querySelectorAll('input[name="notificationMethod"]:checked'))
        .map(input => input.value);
    
    try {
        const response = await fetch(`${API_BASE}/alerts/configure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                alertType,
                thresholdValue: parseFloat(thresholdValue),
                notificationMethods
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Alert configured successfully!');
            document.getElementById('alertConfigForm').reset();
        } else {
            alert(data.message || 'Failed to configure alert');
        }
    } catch (error) {
        console.error('Alert configuration error:', error);
        alert('Failed to configure alert. Please try again.');
    }
}

// Utility functions
function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}




