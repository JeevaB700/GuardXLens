require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const { createDefaultAdmin } = require('./controllers/authController');
const { logActivity, getLogs } = require('./controllers/logController');
const { protect } = require('./middleware/authMiddleware');
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON bodies

// --- MONGODB CONNECTION ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host} 🍃`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Stop server if DB fails
  }
};

// Call the connection function
// Call the connection function
connectDB().then(() => {
  createDefaultAdmin(); // <--- Run this immediately after DB connects
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/log', protect, logActivity);  // Student logs violation
app.get('/api/admin/logs', getLogs);         // Admin views logs

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;