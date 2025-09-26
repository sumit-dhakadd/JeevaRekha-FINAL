# 🛒 Consumer Portal - Complete Guide

## Overview
The Consumer Portal is a comprehensive mobile application that allows consumers to scan QR codes on herb products and get detailed information about the product's journey through the supply chain.

## 🚀 Quick Start

### 1. Start the System
```bash
# Start the server
npm start

# The server will run on http://localhost:5000
```

### 2. Access Consumer Portal
- Open `mobile-app/index.html` in your browser
- Select "Consumer" role
- Login with consumer credentials

### 3. Test QR Scanning
- Click "Start QR Scanner" (demo mode)
- Or enter QR code manually
- View comprehensive herb details

## 👥 Consumer Login Credentials

| Email | Password | Role |
|-------|----------|------|
| consumer@jeevarekha.com | password | consumer |
| consumer2@jeevarekha.com | password | consumer |

## 🔍 Consumer Portal Features

### QR Code Scanning
- **Camera Integration**: Start/stop QR scanner with camera access
- **Manual Input**: Alternative option to enter QR codes manually
- **Real-time Processing**: Instant herb details retrieval

### Comprehensive Information Display
1. **Basic Details**:
   - Herb name and scientific name
   - Harvest date and origin
   - Farmer information
   - Processing date and batch ID

2. **Quality Test Results**:
   - Test names and results
   - Pass/fail status indicators
   - Test dates and values

3. **Certificates**:
   - Certificate names and status
   - Issuing authority
   - Validity information

4. **Supply Chain Journey**:
   - Visual timeline of herb's journey
   - Step-by-step process tracking
   - Status indicators for each step

## 📱 Mobile-Optimized Design

### Responsive Layout
- Works on all screen sizes
- Touch-friendly interface
- Easy navigation

### Clean UI/UX
- Modern card-based design
- Color-coded status indicators
- Intuitive user flow

## 🧪 Testing the Consumer Portal

### Method 1: QR Scanner (Demo Mode)
1. Click "Start QR Scanner"
2. Wait for simulated scan (3 seconds)
3. View herb details

### Method 2: Manual QR Input
1. Enter QR code in the input field
2. Click "Get Details"
3. View comprehensive information

### Sample QR Codes to Test
- Use any herb ID from the database
- Or batch ID from processing batches
- System will fetch all related information

## 🔧 Technical Implementation

### API Endpoints
- `POST /api/auth/login` - Consumer authentication
- `GET /api/herbs/qr/:qrCode` - QR code scanning

### Data Integration
- Harvest information
- Test results
- Certificates
- Processing batches
- Supply chain steps

### Frontend Features
- QR scanner simulation
- Manual QR input
- Dynamic data display
- Mobile optimization

## 📊 Sample Data Available

The system includes sample data for testing:

### Herb Information
- **Species**: Tulsi (Holy Basil)
- **Scientific Name**: Ocimum tenuiflorum
- **Variety**: Krishna Tulsi
- **Origin**: Organic Farm, Uttarakhand

### Test Results
- Purity Test: 98.5% (Passed)
- Heavy Metals Test: 0.02 ppm (Passed)
- Pesticide Residue: 0.01 mg/kg (Passed)

### Certificates
- Organic Certification (Valid)
- Quality Assurance Certificate (Valid)

### Supply Chain Steps
1. Harvest (Completed)
2. Testing (Completed)
3. Processing (Completed)
4. Certification (Completed)

## 🎯 User Experience Flow

1. **Role Selection**: Choose "Consumer" from role cards
2. **Authentication**: Login with consumer credentials
3. **QR Scanning**: Use camera or manual input
4. **Information Display**: View comprehensive herb details
5. **Verification**: Verify authenticity and quality

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- Secure API endpoints
- Data validation

## 📱 Mobile Features

- Touch-friendly interface
- Responsive design
- Camera integration
- Offline capability (for viewing)

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production
```bash
npm run build
```

## 🐛 Troubleshooting

### Common Issues
1. **Server not running**: Make sure MongoDB is running
2. **Login failed**: Check credentials and role
3. **QR scan failed**: This is expected for demo mode
4. **No data found**: Check if sample data is created

### Solutions
1. Start MongoDB: `mongod`
2. Run setup: `node setup.js`
3. Start server: `npm start`
4. Check browser console for errors

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify server is running on port 5000
3. Ensure MongoDB is connected
4. Check browser compatibility

## 🎉 Success Indicators

When everything is working correctly:
- ✅ Server running on port 5000
- ✅ Consumer login successful
- ✅ QR scanner interface loads
- ✅ Herb details display properly
- ✅ Mobile responsive design

## 🔄 Next Steps

1. **Test all features**: Try both QR scanning methods
2. **Explore data**: View test results and certificates
3. **Check mobile**: Test on different screen sizes
4. **Verify security**: Test authentication and authorization

The Consumer Portal provides a complete solution for consumers to verify herb products and access detailed information about their journey through the supply chain! 🌿
