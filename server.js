require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// 404 handler for API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Fallback to index.html for non-API GET requests
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  return res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;

