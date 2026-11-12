const db = require('../db');
const bcrypt = require('bcryptjs');

// Create new student ID
exports.createStudentId = async (req, res) => {
    try {
        const { student_id } = req.body;

        if (!student_id) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Check if student_id already exists
        const [existingRows] = await db.execute(
            'SELECT * FROM student_ids WHERE student_id = ?',
            [student_id]
        );

        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'Student ID already exists' });
        }

        // Create new student ID
        const [result] = await db.execute(
            'INSERT INTO student_ids (student_id) VALUES (?)',
            [student_id]
        );

        res.status(201).json({
            message: 'Student ID created successfully',
            id: result.insertId,
            student_id: student_id
        });
    } catch (error) {
        console.error('Create student ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all student IDs
exports.getStudentIds = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT si.*, u.name, u.email FROM student_ids si LEFT JOIN users u ON si.student_id = u.student_id ORDER BY si.created_at DESC'
        );

        res.json({ studentIds: rows });
    } catch (error) {
        console.error('Get student IDs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete student ID
exports.deleteStudentId = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if student ID is registered
        const [rows] = await db.execute(
            'SELECT * FROM student_ids WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student ID not found' });
        }

        if (rows[0].is_registered) {
            return res.status(400).json({ message: 'Cannot delete registered Student ID' });
        }

        await db.execute('DELETE FROM student_ids WHERE id = ?', [id]);

        res.json({ message: 'Student ID deleted successfully' });
    } catch (error) {
        console.error('Delete student ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Total equipment count
        const [equipmentRows] = await db.execute(
            'SELECT COUNT(*) as total FROM equipment'
        );

        // Available equipment count
        const [availableRows] = await db.execute(
            'SELECT SUM(available_quantity) as available FROM equipment'
        );

        // Total bookings count
        const [bookingRows] = await db.execute(
            'SELECT COUNT(*) as total FROM bookings'
        );

        // Total students
        const [studentRows] = await db.execute(
            'SELECT COUNT(*) as total FROM users WHERE role = ?',
            ['student']
        );

        // Pending maintenance
        const [maintenanceRows] = await db.execute(
            'SELECT COUNT(*) as total FROM maintenance WHERE status IN (?, ?)',
            ['reported', 'in_progress']
        );

        res.json({
            totalEquipment: equipmentRows[0].total,
            availableEquipment: availableRows[0].available || 0,
            totalBookings: bookingRows[0].total,
            totalStudents: studentRows[0].total,
            pendingMaintenance: maintenanceRows[0].total
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create admin user (for initial setup)
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const [existingRows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'admin']
        );

        res.status(201).json({
            message: 'Admin created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, role, student_id, created_at FROM users ORDER BY name'
        );
        res.json({ users: rows });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
