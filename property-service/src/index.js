const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.1.6:3000'],
  credentials: true
}));

app.use(express.json());
const dotenv = require('dotenv');
dotenv.config();

// MongoDB connection
const connectdb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lyvo';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected to:', mongoUri);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectdb();

// Import and use property routes
const propertyRoutes = require('./routes');
app.use('/api', propertyRoutes);

// Import and use notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.send('Add Property Service Running'));

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      status: 'success',
      message: 'Database connection test',
      connectionState: states[connectionState],
      isConnected: connectionState === 1
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.get('/test-cloudinary', (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Cloudinary configuration test',
      cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
        api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Cloudinary test failed', error: error.message });
  }
});

// Test upload endpoint
app.post('/test-upload', (req, res) => {
  try {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'test-' + uniqueSuffix + path.extname(file.originalname));
      }
    });
    
    const upload = multer({ storage: storage });
    
    upload.single('testFile')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      try {
        // Import the uploadImage function
        const { uploadImage } = require('./controller');
        const result = await uploadImage(req.file);
        
        res.json({
          status: 'success',
          message: 'File uploaded successfully',
          result: result
        });
      } catch (uploadError) {
        res.status(500).json({
          status: 'error',
          message: 'Upload failed',
          error: uploadError.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Test failed', error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3003;
const server = app.listen(PORT, () => console.log(`Add Property Service listening on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using this port and try again.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
