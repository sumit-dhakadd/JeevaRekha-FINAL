# Troubleshooting Guide

## Common Issues and Solutions

### 1. MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
1. Check if MongoDB is installed:
   ```bash
   mongod --version
   ```

2. Start MongoDB service:
   - **Windows:**
     ```cmd
     net start MongoDB
     ```
   - **macOS (with Homebrew):**
     ```bash
     brew services start mongodb-community
     ```
   - **Linux:**
     ```bash
     sudo systemctl start mongod
     ```

3. Or start MongoDB manually:
   ```bash
   mongod
   ```

4. Test connection:
   ```bash
   npm run check-mongodb
   ```

### 2. Module Not Found Error

**Error:** `Cannot find module 'bcryptjs'` or similar

**Solution:**
```bash
npm install
```

### 3. Permission Denied Error

**Error:** `EACCES: permission denied`

**Solution:**
- **Windows:** Run terminal as Administrator
- **macOS/Linux:** Use `sudo` if needed or fix permissions

### 4. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Find process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # macOS/Linux
   lsof -i :5000
   ```

2. Kill the process:
   ```bash
   # Windows
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   kill -9 <process_id>
   ```

3. Or change port in server.js:
   ```javascript
   const PORT = process.env.PORT || 3000; // Change from 5000 to 3000
   ```

### 5. Database Setup Fails

**Error:** `Database setup error`

**Solution:**
1. Ensure MongoDB is running
2. Check database permissions
3. Try clearing the database:
   ```bash
   mongo
   use herb-supply-chain
   db.dropDatabase()
   exit
   ```
4. Run setup again:
   ```bash
   npm run setup
   ```

### 6. File Upload Issues

**Error:** `ENOENT: no such file or directory, open 'uploads/...'`

**Solution:**
The setup script should create the uploads directory automatically, but if it doesn't:
```bash
mkdir uploads
```

### 7. CORS Issues in Browser

**Error:** `Access to fetch at 'http://localhost:5000' from origin 'file://' has been blocked by CORS policy`

**Solution:**
1. Use a local development server instead of opening HTML files directly
2. Install and use Live Server extension in VS Code
3. Or use Python's built-in server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

### 8. Mobile App Issues

**Error:** GPS not working or camera not accessible

**Solution:**
1. Use HTTPS in production
2. For local testing, use `http://localhost` instead of `file://`
3. Enable location and camera permissions in browser

## Step-by-Step Setup

1. **Install Node.js** (v14 or higher)
   - Download from https://nodejs.org/

2. **Install MongoDB**
   - **Windows:** Download from https://www.mongodb.com/try/download/community
   - **macOS:** `brew install mongodb-community`
   - **Linux:** Follow instructions at https://docs.mongodb.com/manual/installation/

3. **Start MongoDB**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Check MongoDB Connection**
   ```bash
   npm run check-mongodb
   ```

6. **Setup Database**
   ```bash
   npm run setup
   ```

7. **Start Server**
   ```bash
   npm start
   ```

8. **Access Applications**
   - Open the HTML files in a web browser
   - Use a local development server for best results

## Getting Help

If you're still experiencing issues:

1. Check the console output for specific error messages
2. Ensure all dependencies are installed: `npm install`
3. Verify MongoDB is running: `npm run check-mongodb`
4. Check if port 5000 is available
5. Try running with administrator/sudo privileges if needed

## System Requirements

- **Node.js:** v14 or higher
- **MongoDB:** v4.4 or higher
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 1GB free space
- **OS:** Windows 10+, macOS 10.14+, or Linux



