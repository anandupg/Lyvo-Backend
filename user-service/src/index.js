const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose'); // Correct import

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.1.6:3000'],
  credentials: true
}));

app.use(express.json());
const dotenv = require('dotenv');
dotenv.config();

const connectdb = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not set in your environment variables. Please add it to your .env file.');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};
//efkjheifhe

connectdb(); // Call the function to connect

// Import and use user routes
const userRoutes = require('./routes');
app.use('/api', userRoutes);

app.get('/', (req, res) => res.send('User Service Running'));

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`User Service listening on port ${PORT}`));  