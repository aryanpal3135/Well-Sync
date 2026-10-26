const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB Atlas
const connectDB = require('./config/db');
connectDB();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint (Essential for Render & Postman)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌿 WellSync Backend API is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Mount REST API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/cycle', require('./routes/cycleRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve Frontend statically so entire fullstack app can run from single server or deployed URL
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API 404 & Centralized Error Handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// If API route was called but not matched
app.use('/api/*', notFound);

// Centralized error handling
app.use(errorHandler);

// For non-API routes, fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 WellSync Server running on http://localhost:${PORT}`);
  console.log(`🌐 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`📁 Static Frontend served from: ${frontendPath}`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
});

module.exports = app;
