// Global variables
let currentHerb = null;
let map = null;
let scanHistory = [];

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadScanHistory();
});

function initializeApp() {
    showScreen('welcomeScreen');
}

function setupEventListeners() {
    // Scanner buttons
    document.getElementById('startScanBtn').addEventListener('click', startScanning);
    document.getElementById('stopScanBtn').addEventListener('click', stopScanning);
    document.getElementById('manualSearchBtn').addEventListener('click', manualSearch);
    
    // Manual search
    document.getElementById('manualQRCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            manualSearch();
        }
    });
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
    if (screenId === 'mapScreen' && currentHerb) {
        loadMapData();
    } else if (screenId === 'certificateScreen' && currentHerb) {
        loadCertificateData();
    } else if (screenId === 'historyScreen') {
        loadScanHistory();
    }
}

// QR Code Scanner functions
function startScanning() {
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    
    // Simulate QR code scanning
    // In a real implementation, you would use a QR code scanning library
    simulateQRScan();
}

function stopScanning() {
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    
    startBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';
}

function simulateQRScan() {
    // Simulate scanning process
    setTimeout(() => {
        // Simulate finding a QR code
        const mockQRData = {
            herbId: '507f1f77bcf86cd799439011',
            species: 'Tulsi (Holy Basil)',
            harvestDate: '2024-01-15',
            origin: {
                coordinates: [77.2090, 28.6139],
                address: 'New Delhi, India'
            }
        };
        
        processQRCode(JSON.stringify(mockQRData));
    }, 2000);
}

function processQRCode(qrData) {
    try {
        const data = JSON.parse(qrData);
        searchHerb(data.herbId);
    } catch (error) {
        console.error('Invalid QR code data:', error);
        alert('Invalid QR code. Please try again.');
    }
}

async function manualSearch() {
    const qrCode = document.getElementById('manualQRCode').value.trim();
    
    if (!qrCode) {
        alert('Please enter a QR code or herb ID');
        return;
    }
    
    // Try to parse as JSON first (full QR data)
    try {
        const data = JSON.parse(qrCode);
        if (data.herbId) {
            searchHerb(data.herbId);
            return;
        }
    } catch (error) {
        // Not JSON, treat as herb ID
    }
    
    // Search by herb ID
    searchHerb(qrCode);
}

async function searchHerb(herbId) {
    try {
        const response = await fetch(`${API_BASE}/herb/${herbId}`);
        
        if (response.ok) {
            const herb = await response.json();
            currentHerb = herb;
            addToHistory(herb);
            showScreen('provenanceScreen');
            loadProvenanceData(herb);
        } else {
            alert('Herb not found. Please check the QR code and try again.');
        }
    } catch (error) {
        console.error('Error searching herb:', error);
        alert('Error searching herb. Please try again.');
    }
}

// Provenance functions
function loadProvenanceData(herb) {
    // Update herb header
    document.getElementById('herbSpecies').textContent = herb.species;
    document.getElementById('herbVariety').textContent = herb.variety || 'Standard';
    document.getElementById('herbStatus').textContent = herb.status.toUpperCase();
    
    // Update herb image
    const herbImage = document.getElementById('herbImage');
    if (herb.harvestId?.photo) {
        herbImage.src = `${API_BASE}/uploads/${herb.harvestId.photo}`;
    } else {
        herbImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik01MCAyMEMzNS4zNjQ0IDIwIDIzLjYzNTcgMzEuNzM2NCAyMy42MzU3IDQ2LjM2MzZDMjMuNjM1NyA2MS4wMDA4IDM1LjM2NDQgNzIuNzM3MiA1MCA3Mi43MzcyQzY0LjYzNTYgNzIuNzM3MiA3Ni4zNjQzIDYxLjAwMDggNzYuMzY0MyA0Ni4zNjM2Qzc2LjM2NDMgMzEuNzM2NCA2NC42MzU2IDIwIDUwIDIwWiIgZmlsbD0iIzRDRkY1MCIvPgo8L3N2Zz4K';
    }
    
    // Update timeline
    loadTimeline(herb);
    
    // Update details
    updateHerbDetails(herb);
}

function loadTimeline(herb) {
    const timeline = document.getElementById('timeline');
    
    const timelineData = [
        {
            title: 'Harvested',
            description: `Harvested from ${herb.origin?.address || 'Unknown location'}`,
            time: new Date(herb.harvestDate).toLocaleDateString(),
            status: 'completed'
        },
        {
            title: 'Tested',
            description: 'Quality testing completed in laboratory',
            time: herb.testResults?.[0] ? new Date(herb.testResults[0].testDate).toLocaleDateString() : 'Pending',
            status: herb.testResults?.length > 0 ? 'completed' : 'pending'
        },
        {
            title: 'Processed',
            description: 'Processing completed at facility',
            time: herb.processingBatchId ? 'Completed' : 'Pending',
            status: herb.processingBatchId ? 'completed' : 'pending'
        },
        {
            title: 'Packaged',
            description: 'Product packaged and labeled',
            time: 'Completed',
            status: 'completed'
        },
        {
            title: 'Shipped',
            description: 'Product shipped to retailer',
            time: 'Completed',
            status: 'completed'
        }
    ];
    
    timeline.innerHTML = timelineData.map(item => `
        <div class="timeline-item">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <p class="timeline-time">${item.time}</p>
        </div>
    `).join('');
}

function updateHerbDetails(herb) {
    // Origin information
    document.getElementById('harvestDate').textContent = new Date(herb.harvestDate).toLocaleDateString();
    document.getElementById('harvestLocation').textContent = herb.origin?.address || 'Unknown';
    document.getElementById('farmerName').textContent = herb.harvestId?.farmerId?.name || 'Unknown';
    
    // Quality information
    document.getElementById('qualityGrade').textContent = herb.qualityGrade || 'N/A';
    if (herb.testResults?.[0]) {
        document.getElementById('testDate').textContent = new Date(herb.testResults[0].testDate).toLocaleDateString();
        document.getElementById('labName').textContent = herb.testResults[0].labTechnician?.name || 'Unknown Lab';
    } else {
        document.getElementById('testDate').textContent = 'Not tested';
        document.getElementById('labName').textContent = 'N/A';
    }
}

// Map functions
function loadMapData() {
    if (!currentHerb) return;
    
    // Initialize map if not already done
    if (!map) {
        map = L.map('map').setView([28.6139, 77.2090], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
    
    // Add markers for herb journey
    const journeyPoints = [
        {
            name: 'Harvest Location',
            lat: currentHerb.origin?.coordinates[1] || 28.6139,
            lng: currentHerb.origin?.coordinates[0] || 77.2090,
            description: 'Where the herb was harvested'
        },
        {
            name: 'Processing Facility',
            lat: 28.5355,
            lng: 77.3910,
            description: 'Processing facility location'
        },
        {
            name: 'Distribution Center',
            lat: 28.4595,
            lng: 77.0266,
            description: 'Distribution center'
        }
    ];
    
    journeyPoints.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng]).addTo(map);
        marker.bindPopup(`
            <b>${point.name}</b><br>
            ${point.description}
        `);
        
        // Add to journey steps
        const journeySteps = document.getElementById('journeySteps');
        const stepDiv = document.createElement('div');
        stepDiv.className = 'journey-step';
        stepDiv.innerHTML = `
            <div class="step-icon">${index + 1}</div>
            <div class="step-info">
                <h4>${point.name}</h4>
                <p>${point.description}</p>
            </div>
        `;
        journeySteps.appendChild(stepDiv);
    });
    
    // Fit map to show all points
    const group = new L.featureGroup(journeyPoints.map(point => 
        L.marker([point.lat, point.lng])
    ));
    map.fitBounds(group.getBounds().pad(0.1));
}

// Certificate functions
function loadCertificateData() {
    if (!currentHerb) return;
    
    // Load quality certificate
    loadQualityCertificate();
    
    // Load test results
    loadTestResults();
    
    // Load organic certificate
    loadOrganicCertificate();
}

function loadQualityCertificate() {
    // Mock certificate data
    const certData = {
        certificateNumber: 'QC-2024-001234',
        product: currentHerb.species,
        qualityGrade: currentHerb.qualityGrade,
        issuedDate: '2024-01-20',
        validUntil: '2025-01-20',
        issuedBy: 'Jeeva-Rekha Quality Lab',
        hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
    };
    
    document.getElementById('qualityCertNumber').textContent = certData.certificateNumber;
    document.getElementById('certProduct').textContent = certData.product;
    document.getElementById('certQualityGrade').textContent = certData.qualityGrade;
    document.getElementById('certIssuedDate').textContent = new Date(certData.issuedDate).toLocaleDateString();
    document.getElementById('certValidUntil').textContent = new Date(certData.validUntil).toLocaleDateString();
    document.getElementById('certIssuedBy').textContent = certData.issuedBy;
    document.getElementById('certHash').textContent = certData.hash;
}

function loadTestResults() {
    const testResults = currentHerb.testResults || [];
    const container = document.getElementById('testResultsList');
    
    if (testResults.length === 0) {
        container.innerHTML = '<p>No test results available.</p>';
        return;
    }
    
    container.innerHTML = testResults.map(test => `
        <div class="test-result-item">
            <h4>${test.testType.replace('_', ' ').toUpperCase()}</h4>
            <p><strong>Grade:</strong> ${test.qualityGrade}</p>
            <p><strong>Date:</strong> ${new Date(test.testDate).toLocaleDateString()}</p>
            <p><strong>Technician:</strong> ${test.labTechnician?.name || 'Unknown'}</p>
        </div>
    `).join('');
}

function loadOrganicCertificate() {
    // Mock organic certificate data
    const organicData = {
        certBody: 'Organic Certification Authority',
        certNumber: 'OC-2024-567890',
        validFrom: '2024-01-01',
        validUntil: '2024-12-31'
    };
    
    document.getElementById('organicCertBody').textContent = organicData.certBody;
    document.getElementById('organicCertNumber').textContent = organicData.certNumber;
    document.getElementById('organicValidFrom').textContent = new Date(organicData.validFrom).toLocaleDateString();
    document.getElementById('organicValidUntil').textContent = new Date(organicData.validUntil).toLocaleDateString();
}

// Certificate tab functions
function showCertificateTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// History functions
function loadScanHistory() {
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    scanHistory = history;
    displayScanHistory();
}

function addToHistory(herb) {
    const historyItem = {
        id: herb._id,
        species: herb.species,
        scanDate: new Date().toISOString(),
        qualityGrade: herb.qualityGrade
    };
    
    // Remove if already exists
    scanHistory = scanHistory.filter(item => item.id !== herb._id);
    
    // Add to beginning
    scanHistory.unshift(historyItem);
    
    // Keep only last 50 items
    if (scanHistory.length > 50) {
        scanHistory = scanHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    
    // Update display
    displayScanHistory();
}

function displayScanHistory() {
    const container = document.getElementById('scanHistory');
    
    if (scanHistory.length === 0) {
        container.innerHTML = '<p>No scan history found. Start scanning QR codes to build your history!</p>';
        return;
    }
    
    container.innerHTML = scanHistory.map(item => `
        <div class="history-item" onclick="viewHerbFromHistory('${item.id}')">
            <div class="history-info">
                <h4>${item.species}</h4>
                <p>Grade: ${item.qualityGrade || 'N/A'}</p>
            </div>
            <div class="history-time">
                ${formatTimeAgo(item.scanDate)}
            </div>
        </div>
    `).join('');
}

function viewHerbFromHistory(herbId) {
    searchHerb(herbId);
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

// Mock data for demonstration
function loadMockData() {
    // This function can be used to load mock data for demonstration purposes
    const mockHerb = {
        _id: '507f1f77bcf86cd799439011',
        species: 'Tulsi (Holy Basil)',
        variety: 'Krishna Tulsi',
        harvestDate: '2024-01-15',
        qualityGrade: 'A',
        status: 'delivered',
        origin: {
            coordinates: [77.2090, 28.6139],
            address: 'New Delhi, India'
        },
        harvestId: {
            photo: 'tulsi_harvest.jpg',
            farmerId: {
                name: 'Rajesh Kumar'
            }
        },
        testResults: [{
            testType: 'purity',
            qualityGrade: 'A',
            testDate: '2024-01-18',
            labTechnician: {
                name: 'Dr. Priya Sharma'
            }
        }]
    };
    
    currentHerb = mockHerb;
    addToHistory(mockHerb);
}




