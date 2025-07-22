const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// GET /api/booking-stats - Get booking statistics
router.get('/booking-stats', async (req, res) => {
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

module.exports = router; 