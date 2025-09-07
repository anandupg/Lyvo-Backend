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
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set in environment variables');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectdb();

// Import and use property routes
const propertyRoutes = require('./routes');
app.use('/api', propertyRoutes);

app.get('/', (req, res) => res.send('Add Property Service Running'));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Add Property Service listening on port ${PORT}`));
