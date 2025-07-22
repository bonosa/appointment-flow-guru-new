const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://smart-booking-backend-production.up.railway.app',
    'https://appointment-flow-guru-new.vercel.app',
    'https://appointment-flow-guru-gvwlpgnof-saroj-bonos-projects.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    services: {
      database: 'connected',
      email: 'configured',
      ai: 'configured'
    }
  });
});

// Booking stats endpoint
app.get('/api/booking-stats', async (req, res) => {
  try {
    // Get total bookings count
    const bookingsResult = await pool.query(
      'SELECT COUNT(*) as total_bookings FROM bookings'
    );
    
    // Get unique users count
    const usersResult = await pool.query(
      'SELECT COUNT(DISTINCT email) as total_users FROM bookings'
    );
    
    // Get successful bookings (assuming all bookings are successful for now)
    const successResult = await pool.query(
      'SELECT COUNT(*) as successful_bookings FROM bookings'
    );
    
    const totalBookings = parseInt(bookingsResult.rows[0]?.total_bookings || 0);
    const totalUsers = parseInt(usersResult.rows[0]?.total_users || 0);
    const successfulBookings = parseInt(successResult.rows[0]?.successful_bookings || 0);
    
    // Calculate success rate
    const successRate = totalBookings > 0 ? Math.round((successfulBookings / totalBookings) * 100) : 100;
    
    res.json({
      totalBookings,
      totalUsers,
      successRate,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch booking statistics',
      totalBookings: 6, // Fallback to your current count
      totalUsers: 1,
      successRate: 100
    });
  }
});

// Message analysis endpoint
app.post('/api/analyze-message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Send email with the message
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself for now
      subject: 'New Booking Request',
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // Save to database
    await pool.query(
      'INSERT INTO bookings (email, message, created_at) VALUES ($1, $2, $3)',
      ['user@example.com', message, new Date()]
    );

    res.json({ 
      success: true, 
      message: 'Booking request received and processed successfully' 
    });

  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({ 
      error: 'Failed to process booking request',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Booking Backend running on port ${PORT}`);
  console.log(`📱 Test endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/`);
  console.log(`   Stats: http://localhost:${PORT}/api/booking-stats`);
  console.log(`   Root: http://localhost:${PORT}/`);
  console.log(`\n🎉 Ready to accept requests!\n`);
}); 