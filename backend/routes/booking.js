const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Routes for all authenticated users
router.get('/', verifyToken, bookingController.getAllBookings);
router.post('/', verifyToken, bookingController.createBooking);
router.get('/venues', verifyToken, bookingController.getVenues);
router.get('/available-slots', verifyToken, bookingController.getAvailableSlots);

// Cancel booking (owner or admin)
router.put('/:id/cancel', verifyToken, bookingController.cancelBooking);

// Admin only routes
router.put('/:id/status', verifyToken, requireAdmin, bookingController.updateBookingStatus);
router.post('/import', verifyToken, requireAdmin, bookingController.importBooking);

module.exports = router;
