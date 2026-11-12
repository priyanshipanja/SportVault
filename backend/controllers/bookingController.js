const db = require('../db');

// Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        let query = `
            SELECT b.*, v.name as venue_name, v.location, u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN venues v ON b.venue_id = v.id
            JOIN users u ON b.user_id = u.id
        `;
        let params = [];

        // If student, only show their bookings
        if (req.user.role === 'student') {
            query += ' WHERE b.user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY b.booking_date DESC, b.start_time DESC';

        const [rows] = await db.execute(query, params);

        res.json({ bookings: rows });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const { venue_id, booking_date, start_time, end_time, purpose } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!venue_id || !booking_date || !start_time || !end_time) {
            return res.status(400).json({ message: 'Venue, date, and time are required' });
        }

        // Check if venue exists
        const [venueRows] = await db.execute(
            'SELECT * FROM venues WHERE id = ?',
            [venue_id]
        );

        if (venueRows.length === 0) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        // Check for double booking
        const [conflictRows] = await db.execute(
            `SELECT * FROM bookings 
             WHERE venue_id = ? 
             AND booking_date = ? 
             AND status != ?
             AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))`,
            [venue_id, booking_date, 'cancelled', start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (conflictRows.length > 0) {
            return res.status(409).json({ message: 'Slot already booked, try another time' });
        }

        // Create booking
        const [result] = await db.execute(
            'INSERT INTO bookings (venue_id, user_id, booking_date, start_time, end_time, purpose) VALUES (?, ?, ?, ?, ?, ?)',
            [venue_id, userId, booking_date, start_time, end_time, purpose || '']
        );

        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: result.insertId
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update booking status (Admin only)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [rows] = await db.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await db.execute(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );

        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel booking (Student can cancel their own)
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [rows] = await db.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const booking = rows[0];

        // Check if user owns this booking or is admin
        if (req.user.role !== 'admin' && booking.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await db.execute(
            'UPDATE bookings SET status = ? WHERE id = ?',
            ['cancelled', id]
        );

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get available slots for a venue on a specific date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { venue_id, date } = req.query;

        if (!venue_id || !date) {
            return res.status(400).json({ message: 'Venue ID and date are required' });
        }

        // Get existing bookings for the venue on that date
        const [rows] = await db.execute(
            `SELECT start_time, end_time FROM bookings 
             WHERE venue_id = ? AND booking_date = ? AND status != ?`,
            [venue_id, date, 'cancelled']
        );

        res.json({ bookedSlots: rows });
    } catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all venues
exports.getVenues = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM venues ORDER BY name');
        res.json({ venues: rows });
    } catch (error) {
        console.error('Get venues error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Import booking from CSV (admin only)
exports.importBooking = async (req, res) => {
    try {
        const { user_name, venue_name, booking_date, start_time, end_time, purpose, status } = req.body;

        // Find user by name
        const [userRows] = await db.execute(
            'SELECT id FROM users WHERE name = ?',
            [user_name]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ message: `User "${user_name}" not found` });
        }

        // Find venue by name
        const [venueRows] = await db.execute(
            'SELECT id FROM venues WHERE name = ?',
            [venue_name]
        );

        if (venueRows.length === 0) {
            return res.status(400).json({ message: `Venue "${venue_name}" not found` });
        }

        await db.execute(
            'INSERT INTO bookings (venue_id, user_id, booking_date, start_time, end_time, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [venueRows[0].id, userRows[0].id, booking_date, start_time, end_time, purpose || '', status || 'pending']
        );

        res.status(201).json({ message: 'Booking imported successfully' });
    } catch (error) {
        console.error('Import booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
