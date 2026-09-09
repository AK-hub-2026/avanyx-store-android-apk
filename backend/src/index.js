const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const storageRoutes = require('./routes/storageRoutes');
const developerRoutes = require('./routes/developerRoutes');
const { createErrorResponse } = require('./models/responseModels');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[AVANYX Backend] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'AVANYX Store Secure Backend Engine', phase: 2, timestamp: Date.now() });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Storage Routes
app.use('/api/storage', storageRoutes);

// Developer Routes
app.use('/api/developer', developerRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[AVANYX Backend Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(createErrorResponse(err));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 AVANYX Store Backend listening on port ${PORT}`);
    console.log(`🔐 Firebase JWT Verification & Role Engine Active`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
