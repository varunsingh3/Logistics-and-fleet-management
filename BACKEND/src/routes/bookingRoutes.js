const express = require('express');
const router = express.Router();
const { getBookings, cancelBooking } = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getBookings);
router.patch('/:id/cancel', authenticateToken, cancelBooking);

module.exports = router;
