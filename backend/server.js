/**
 * Express Server Entry Point
 * Run: npm run dev (development with nodemon)
 *      npm start (production)
 * 
 * API Docs: http://localhost:5000/api
 * Python ML Backend: http://localhost:8000
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';

import predictRoutes from './routes/predict.js';
import filterRoutes from './routes/filters.js';
import collegeRoutes from './routes/colleges.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_predictor';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Middleware ──────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// ── Database Connection ──────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Store ML service URL in app context
app.locals.mlServiceUrl = ML_SERVICE_URL;

// ── Routes ──────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/colleges', collegeRoutes);

// ── Error Handling ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ── Start Server ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  College Predictor API Server                       ║
║  Port: ${PORT}                                              ║
║  MongoDB: ${MONGO_URI}                   ║
║  ML Service: ${ML_SERVICE_URL}                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                   ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
