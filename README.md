# Jeeva-Rekha: Herb Supply Chain Management System

A comprehensive blockchain-based herb supply chain management system that ensures traceability, quality, and transparency from farm to consumer.

## 🌿 Features

### Farmer/Collector Mobile App
- **GPS Location Capture**: Real-time location tracking for harvest sites
- **Herb Species Selection**: Comprehensive species database with varieties
- **Photo Documentation**: High-quality image capture for harvest records
- **Harvest Data Entry**: Detailed form for recording harvest information
- **Offline Capability**: Works without internet connection

### Laboratory Testing Dashboard
- **Sample Registration**: Digital sample tracking and management
- **Test Results Entry**: Comprehensive testing interface for various parameters
- **Quality Certification Portal**: Automated certificate generation
- **Digital Signature Verification**: Secure digital signatures for test results
- **Real-time Monitoring**: Live updates on testing progress

### Processing Facility Interface
- **Batch Tracking Dashboard**: Complete batch lifecycle management
- **Processing Step Logging**: Detailed step-by-step processing records
- **Quality Control Checkpoints**: Automated quality assurance workflows
- **Packaging and Labeling System**: Integrated packaging management
- **Inventory Management**: Real-time inventory tracking

### Supply Chain Manager Dashboard
- **Real-time Inventory Tracking**: Live inventory monitoring across all facilities
- **Analytics and Reporting Interface**: Comprehensive business intelligence
- **Compliance Monitoring Screen**: Regulatory compliance tracking
- **Alert and Notification System**: Proactive alert management
- **Performance Metrics**: KPI tracking and optimization

### Consumer Mobile App
- **QR Code Scanner Interface**: Easy product verification
- **Herb Provenance Display**: Complete supply chain transparency
- **Interactive Map**: Visual journey of herbs from farm to consumer
- **Certificate and Test Results View**: Access to quality documentation
- **History Tracking**: Personal scan history and favorites

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd herb-supply-chain-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the applications**
   - **Farmer App**: Open `mobile-app/index.html` in your browser
   - **Lab Dashboard**: Open `lab-dashboard/index.html` in your browser
   - **Processing Facility**: Open `processing-facility/index.html` in your browser
   - **Supply Chain Manager**: Open `supply-chain-dashboard/index.html` in your browser
   - **Consumer App**: Open `consumer-app/index.html` in your browser

## 📱 Mobile App Setup

### For Mobile Testing
1. Use a local development server (e.g., Live Server in VS Code)
2. Access the apps via your mobile device's IP address
3. Enable camera permissions for QR code scanning
4. Enable location services for GPS functionality

### For Production Deployment
1. Build the mobile apps using a framework like Cordova or Capacitor
2. Deploy to app stores (Google Play Store, Apple App Store)
3. Configure push notifications
4. Set up proper SSL certificates

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and user management
- **Herb**: Product information and tracking
- **Harvest**: Farm-level data collection
- **TestResult**: Laboratory testing data
- **ProcessingBatch**: Processing facility operations
- **Inventory**: Supply chain inventory management
- **Certificate**: Quality and compliance certificates

### Key Relationships
- Users can have multiple roles (farmer, lab technician, processor, etc.)
- Herbs are linked to harvests, test results, and processing batches
- Certificates are generated from test results
- Inventory tracks products through the supply chain

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different access levels for different user types
- **Digital Signatures**: Cryptographic verification of test results
- **Data Encryption**: Sensitive data encryption at rest and in transit
- **Audit Trail**: Complete activity logging for compliance

## 📊 Analytics and Reporting

### Key Metrics
- Harvest volume and quality trends
- Processing efficiency rates
- Supply chain performance indicators
- Compliance status tracking
- Consumer engagement metrics

### Report Types
- Inventory reports
- Quality assurance reports
- Performance analytics
- Compliance reports
- Custom business intelligence dashboards

## 🌍 Integration Capabilities

### External Services
- **Maps Integration**: Google Maps/Mapbox for location services
- **QR Code Generation**: Dynamic QR code creation
- **Email Notifications**: Automated alert system
- **SMS Integration**: Critical alert notifications
- **Blockchain Integration**: Future blockchain implementation

### API Endpoints
- RESTful API for all operations
- WebSocket support for real-time updates
- Mobile-optimized endpoints
- Third-party integration hooks

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t herb-supply-chain .
docker run -p 5000:5000 herb-supply-chain
```

## 📈 Future Enhancements

- **Blockchain Integration**: Immutable supply chain records
- **IoT Integration**: Sensor data from farms and facilities
- **AI/ML Analytics**: Predictive quality analysis
- **Mobile App Stores**: Native mobile applications
- **Multi-language Support**: Internationalization
- **Advanced Reporting**: Custom report builder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🙏 Acknowledgments

- Jeeva-Rekha team for the vision and requirements
- Open source community for the amazing tools and libraries
- Farmers and consumers for their valuable feedback

---

**Built with ❤️ for a transparent and sustainable herb supply chain**




