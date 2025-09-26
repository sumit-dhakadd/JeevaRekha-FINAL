// Global variables
let currentUser = null;
let currentLocation = null;
let selectedRole = null;
let socket = null;
let realtimeActive = false;

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Role configurations
const roleConfigs = {
    farmer: {
        title: 'Farmer Login',
        description: 'Enter your credentials to access the farmer dashboard',
        registerTitle: 'Farmer Registration',
        registerDescription: 'Create your farmer account',
        dashboardTitle: 'Farmer Dashboard',
        dashboardUrl: 'mobile-app/index.html'
    },
    lab_technician: {
        title: 'Lab Technician Login',
        description: 'Enter your credentials to access the laboratory dashboard',
        registerTitle: 'Lab Technician Registration',
        registerDescription: 'Create your laboratory account',
        dashboardTitle: 'Laboratory Dashboard',
        dashboardUrl: 'lab-dashboard/index.html'
    },
    processor: {
        title: 'Processor Login',
        description: 'Enter your credentials to access the processing facility dashboard',
        registerTitle: 'Processor Registration',
        registerDescription: 'Create your processor account',
        dashboardTitle: 'Processing Facility Dashboard',
        dashboardUrl: 'processing-facility/index.html'
    },
    supply_manager: {
        title: 'Manager Login',
        description: 'Enter your credentials to access the supply chain dashboard',
        registerTitle: 'Manager Registration',
        registerDescription: 'Create your manager account',
        dashboardTitle: 'Supply Chain Dashboard',
        dashboardUrl: 'supply-chain-dashboard/index.html'
    }
};

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
        selectedRole = currentUser.role;
        
        // If logged in, show appropriate dashboard based on role
        if (selectedRole === 'farmer') {
            showScreen('dashboardScreen');
            loadDashboardData();
        } else {
            // For other roles, show real-time dashboard
            showScreen('realtimeDashboard');
            loadSupplyChainData();
        }
    } else {
        showScreen('roleSelectionScreen');
    }
}

function setupEventListeners() {
    
    // Logout buttons
    const farmerLogoutBtn = document.getElementById('farmerLogoutBtn');
    const realtimeLogoutBtn = document.getElementById('realtimeLogoutBtn');
    
    if (farmerLogoutBtn) {
        farmerLogoutBtn.addEventListener('click', handleLogout);
        console.log('Farmer logout button event listener added');
    } else {
        console.warn('Farmer logout button not found');
    }
    
    if (realtimeLogoutBtn) {
        realtimeLogoutBtn.addEventListener('click', handleLogout);
        console.log('Realtime logout button event listener added');
    } else {
        console.warn('Realtime logout button not found');
    }
    
    // Harvest form
    document.getElementById('harvestForm').addEventListener('submit', handleHarvestSubmit);
    
    // Location button
    document.getElementById('getLocationBtn').addEventListener('click', getCurrentLocation);
    
    // Photo preview
    document.getElementById('photo').addEventListener('change', handlePhotoPreview);
    
    // Update location
    document.getElementById('updateLocationBtn').addEventListener('click', updateUserLocation);
    
    // Real-time dashboard events
    document.getElementById('startRealtimeBtn').addEventListener('click', startRealtimeUpdates);
    document.getElementById('stopRealtimeBtn').addEventListener('click', stopRealtimeUpdates);
    
    // Supply chain tracking buttons
    document.getElementById('refreshSupplyChain').addEventListener('click', loadSupplyChainData);
    document.getElementById('toggleAutoRefresh').addEventListener('click', toggleAutoRefresh);
    
    // Farmer login form
    document.getElementById('farmerLoginForm').addEventListener('submit', handleFarmerLogin);
    
}

// Role selection and redirect function
function redirectToDashboard(role) {
    selectedRole = role;
    
    if (role === 'farmer') {
        // For farmers, show the farmer login screen
        showScreen('farmerLoginScreen');
    } else {
        // For other roles, redirect to their dedicated dashboards
        const dashboardUrls = {
            lab_technician: '/lab-dashboard/index.html',
            processor: '/processing-facility/index.html',
            supply_manager: '/supply-chain-dashboard/index.html'
        };
        
        const dashboardUrl = dashboardUrls[role];
        
        if (dashboardUrl) {
            // Debug: Log the URL being opened
            console.log(`Opening dashboard for role: ${role}, URL: ${dashboardUrl}`);
            
            // Open the appropriate dashboard in a new tab
            window.open(dashboardUrl, '_blank');
            
            // Show a notification
            showNotification(`Redirecting to ${role.replace('_', ' ')} dashboard...`, 'info');
        } else {
            console.error(`No dashboard URL found for role: ${role}`);
            alert(`No dashboard available for role: ${role}`);
        }
    }
}

// Show role selection screen
function showRoleSelection() {
    showScreen('roleSelectionScreen');
}

// Farmer login function
async function handleFarmerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('farmerEmail').value;
    const password = document.getElementById('farmerPassword').value;
    
    console.log('Farmer login attempt:', { email, password });
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            // Check if user is a farmer
            if (data.user && data.user.role !== 'farmer') {
                showNotification('Access denied. This account is not for farmers.', 'error');
                return;
            }
            
            if (!data.user) {
                showNotification('Login failed: No user data received', 'error');
                return;
            }
            
            // Store user data and token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            // Show farmer dashboard
            showScreen('dashboardScreen');
            loadDashboardData();
            showNotification('Welcome to Farmer Dashboard!', 'success');
        } else {
            showNotification(data.message || data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Role selection function (for visual feedback)
function selectRole(role) {
    selectedRole = role;
    
    // Update visual selection
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-role="${role}"]`).classList.add('selected');
}

// Screen management
function showScreen(screenId) {
    try {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.error(`Screen with ID '${screenId}' not found`);
            return;
        }
        
        // Load data for specific screens
        if (screenId === 'harvestHistoryScreen') {
            loadHarvestHistory();
        } else if (screenId === 'locationScreen') {
            loadLocationScreen();
        } else if (screenId === 'profileScreen') {
            loadProfileData();
        } else if (screenId === 'dashboardScreen') {
            updateDashboardTitle();
        } else if (screenId === 'roleSelectionScreen') {
            // Reset any real-time dashboard state
            realtimeActive = false;
        }
    } catch (error) {
        console.error('Error showing screen:', error);
    }
}

function updateDashboardTitle() {
    if (selectedRole && roleConfigs[selectedRole]) {
        const config = roleConfigs[selectedRole];
        const headerTitle = document.querySelector('#dashboardScreen .header h1');
        if (headerTitle) {
            headerTitle.textContent = config.dashboardTitle;
        }
    }
}


function handleLogout() {
    try {
        // Clear all stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Reset global variables
        currentUser = null;
        selectedRole = null;
        currentLocation = null;
        
        // Disconnect WebSocket if connected
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        
        // Show success message
        showNotification('Logged out successfully', 'success');
        
        // Return to role selection screen
        showScreen('roleSelectionScreen');
        
        console.log('User logged out successfully');
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('Error during logout', 'error');
    }
}

// Dashboard functions
async function loadDashboardData() {
    // Load farmer's harvests for statistics
    try {
        const response = await fetch(`${API_BASE}/harvest/farmer/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const harvests = await response.json();
            updateDashboardStats(harvests);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(harvests) {
    const totalHarvests = harvests.length;
    const totalQuantity = harvests.reduce((sum, harvest) => sum + harvest.quantity, 0);
    
    document.getElementById('totalHarvests').textContent = totalHarvests;
    document.getElementById('totalQuantity').textContent = totalQuantity.toFixed(2);
}

// Harvest functions
async function handleHarvestSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('species', document.getElementById('species').value);
    formData.append('variety', document.getElementById('variety').value);
    formData.append('quantity', document.getElementById('quantity').value);
    formData.append('unit', document.getElementById('unit').value);
    formData.append('harvestDate', document.getElementById('harvestDate').value);
    formData.append('notes', document.getElementById('notes').value);
    
    if (currentLocation) {
        formData.append('location', JSON.stringify({
            type: 'Point',
            coordinates: [currentLocation.longitude, currentLocation.latitude]
        }));
    }
    
    const photoFile = document.getElementById('photo').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }
    
    try {
        const response = await fetch(`${API_BASE}/harvest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Harvest recorded successfully!');
            document.getElementById('harvestForm').reset();
            document.getElementById('locationDisplay').classList.add('hidden');
            document.getElementById('photoPreview').classList.add('hidden');
            currentLocation = null;
            showScreen('dashboardScreen');
        } else {
            alert(data.message || 'Failed to record harvest');
        }
    } catch (error) {
        console.error('Harvest submission error:', error);
        alert('Failed to record harvest. Please try again.');
    }
}

// Location functions
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }
    
    const button = document.getElementById('getLocationBtn');
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
    button.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            document.getElementById('coordinates').textContent = 
                `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
            document.getElementById('accuracy').textContent = currentLocation.accuracy.toFixed(0);
            
            // Reverse geocoding to get address
            getAddressFromCoordinates(currentLocation.latitude, currentLocation.longitude);
            
            document.getElementById('locationDisplay').classList.remove('hidden');
            
            button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Get Current Location';
            button.disabled = false;
        },
        (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your location. Please try again.');
            button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Get Current Location';
            button.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

async function getAddressFromCoordinates(lat, lng) {
    try {
        // Using a free reverse geocoding service
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        const data = await response.json();
        
        if (data.locality) {
            const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
            document.getElementById('address').textContent = address;
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        document.getElementById('address').textContent = 'Address not available';
    }
}

function loadLocationScreen() {
    if (currentLocation) {
        document.getElementById('currentLat').textContent = currentLocation.latitude.toFixed(6);
        document.getElementById('currentLng').textContent = currentLocation.longitude.toFixed(6);
        document.getElementById('accuracy').textContent = currentLocation.accuracy.toFixed(0) + ' meters';
    }
}

async function updateUserLocation() {
    getCurrentLocation();
}

// Photo functions
function handlePhotoPreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('photoPreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// Harvest history functions
async function loadHarvestHistory() {
    try {
        const response = await fetch(`${API_BASE}/harvest/farmer/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const harvests = await response.json();
            displayHarvestHistory(harvests);
        }
    } catch (error) {
        console.error('Error loading harvest history:', error);
    }
}

function displayHarvestHistory(harvests) {
    const container = document.getElementById('harvestList');
    
    if (harvests.length === 0) {
        container.innerHTML = '<div class="harvest-item"><p>No harvests recorded yet.</p></div>';
        return;
    }
    
    container.innerHTML = harvests.map(harvest => `
        <div class="harvest-item">
            <div class="harvest-info">
                <h3>${harvest.species}</h3>
                <p>${harvest.quantity} ${harvest.unit} • ${new Date(harvest.harvestDate).toLocaleDateString()}</p>
                <p>${harvest.location.address || 'Location recorded'}</p>
            </div>
            <div class="harvest-status status-${harvest.status}">
                ${harvest.status.replace('_', ' ').toUpperCase()}
            </div>
        </div>
    `).join('');
}

// Profile functions
function loadProfileData() {
    if (currentUser) {
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profilePhone').textContent = currentUser.phone || 'Not provided';
    }
    
    // Load statistics
    loadDashboardData();
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a proper notification system
    alert(message);
}

// Real-time Dashboard Functions
function showRealtimeDashboard() {
    showScreen('realtimeDashboard');
    initializeRealtimeDashboard();
}

// Supply Chain Tracking Functions
let autoRefreshInterval = null;
let supplyChainData = [];

async function loadSupplyChainData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/herbs/supply-chain', {
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
    const progress = getProgressPercentage(status.stage);
    
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

function getProgressPercentage(stage) {
    const stages = ['pending', 'harvested', 'tested', 'processed', 'completed'];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
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

function initializeRealtimeDashboard() {
    // Load initial data
    loadRealtimeStats();
    loadSupplyChainData();
    
    // Set up WebSocket connection
    if (!socket) {
        socket = io('http://localhost:5000');
        
        socket.on('connect', () => {
            console.log('Connected to real-time server');
            updateConnectionStatus('connected');
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from real-time server');
            updateConnectionStatus('disconnected');
        });
        
        socket.on('update', (data) => {
            handleRealtimeUpdate(data);
        });
        
        socket.on('real-time-data', (data) => {
            updateRealtimeStats(data);
        });
        
        socket.on('herb-update', (data) => {
            handleHerbUpdate(data);
        });
    }
}

async function loadRealtimeStats() {
    try {
        const response = await fetch(`${API_BASE}/analytics`);
        if (response.ok) {
            const data = await response.json();
            updateStatsDisplay(data);
        }
    } catch (error) {
        console.error('Error loading real-time stats:', error);
    }
}

function startRealtimeUpdates() {
    if (socket && socket.connected) {
        realtimeActive = true;
        socket.emit('request-update', { role: 'all', userId: currentUser?.id });
        
        // Update UI
        document.getElementById('startRealtimeBtn').style.display = 'none';
        document.getElementById('stopRealtimeBtn').style.display = 'inline-block';
        
        // Start periodic updates
        startPeriodicUpdates();
    } else {
        alert('Not connected to real-time server');
    }
}

function stopRealtimeUpdates() {
    realtimeActive = false;
    
    // Update UI
    document.getElementById('startRealtimeBtn').style.display = 'inline-block';
    document.getElementById('stopRealtimeBtn').style.display = 'none';
    
    // Stop periodic updates
    if (window.realtimeInterval) {
        clearInterval(window.realtimeInterval);
    }
}

function startPeriodicUpdates() {
    if (window.realtimeInterval) {
        clearInterval(window.realtimeInterval);
    }
    
    window.realtimeInterval = setInterval(() => {
        if (realtimeActive && socket && socket.connected) {
            socket.emit('request-update', { role: 'all', userId: currentUser?.id });
        }
    }, 5000); // Update every 5 seconds
}

function handleRealtimeUpdate(data) {
    const activityFeed = document.getElementById('activityFeed');
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    let activityText = '';
    let activityIcon = '';
    
    switch(data.type) {
        case 'harvest':
            activityText = `New harvest recorded: ${data.data.harvest.species}`;
            activityIcon = '🌱';
            break;
        case 'test_result':
            activityText = `Test completed: ${data.data.testResult.testName} - ${data.data.testResult.result}`;
            activityIcon = '🧪';
            break;
        case 'processing':
            activityText = `Processing batch updated: ${data.data.batch.batchId}`;
            activityIcon = '🏭';
            break;
        default:
            activityText = `System update: ${data.type}`;
            activityIcon = '📊';
    }
    
    activityItem.innerHTML = `
        <h4>${activityIcon} ${activityText}</h4>
        <p>${new Date(data.timestamp).toLocaleString()}</p>
    `;
    
    // Add to top of feed
    activityFeed.insertBefore(activityItem, activityFeed.firstChild);
    
    // Keep only last 20 items
    while (activityFeed.children.length > 20) {
        activityFeed.removeChild(activityFeed.lastChild);
    }
}

function updateRealtimeStats(data) {
    if (data.stats) {
        document.getElementById('totalHerbs').textContent = data.stats.totalHerbs || 0;
        document.getElementById('totalHarvests').textContent = data.stats.totalHarvests || 0;
        document.getElementById('totalTests').textContent = data.stats.totalTests || 0;
        document.getElementById('totalBatches').textContent = data.stats.totalBatches || 0;
    }
}

function updateStatsDisplay(data) {
    document.getElementById('totalHerbs').textContent = data.totalHerbs || 0;
    document.getElementById('totalHarvests').textContent = data.totalHarvests || 0;
    document.getElementById('totalTests').textContent = data.totalTests || 0;
    document.getElementById('totalBatches').textContent = data.totalBatches || 0;
}

function updateConnectionStatus(status) {
    const statusElement = document.querySelector('.connection-status');
    if (statusElement) {
        statusElement.className = `connection-status ${status}`;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function handleHerbUpdate(data) {
    const { herb, action, message, timestamp } = data;
    
    // Add to activity feed
    const activityFeed = document.getElementById('activityFeed');
    if (activityFeed) {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item new';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-seedling"></i>
            </div>
            <div class="activity-content">
                <h4>${herb.name}</h4>
                <p>${message}</p>
                <span class="activity-time">${new Date(timestamp).toLocaleTimeString()}</span>
            </div>
        `;
        activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        
        // Keep only last 10 activities
        while (activityFeed.children.length > 10) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }
    
    // Refresh supply chain data
    loadSupplyChainData();
    
    // Show notification
    showNotification(`New update: ${herb.name} - ${action}`, 'success');
}

