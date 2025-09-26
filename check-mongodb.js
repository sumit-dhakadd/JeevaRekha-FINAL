const mongoose = require('mongoose');

async function checkMongoDB() {
  try {
    console.log('Checking MongoDB connection...');
    
    await mongoose.connect('mongodb://localhost:27017/herb-supply-chain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB is running and accessible');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.log('\nTo fix this issue:');
    console.log('1. Make sure MongoDB is installed on your system');
    console.log('2. Start MongoDB service:');
    console.log('   - Windows: net start MongoDB');
    console.log('   - macOS: brew services start mongodb-community');
    console.log('   - Linux: sudo systemctl start mongod');
    console.log('3. Or start MongoDB manually: mongod');
    return false;
  }
}

checkMongoDB().then(success => {
  process.exit(success ? 0 : 1);
});



