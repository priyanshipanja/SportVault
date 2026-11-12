const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
    try {
        const dbName = process.env.DB_NAME || 'sportsvault';
        
        // Connect without database first to create it
        let connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Connected to MySQL server');

        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`Database "${dbName}" created or already exists`);

        // Close and reconnect with database
        await connection.end();
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });
        console.log(`Connected to database "${dbName}"`);

        // Create tables one by one
        const tables = [
            `CREATE TABLE IF NOT EXISTS student_ids (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE NOT NULL,
                is_registered BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'student') DEFAULT 'student',
                student_id VARCHAR(50) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES student_ids(student_id) ON DELETE SET NULL
            )`,
            `CREATE TABLE IF NOT EXISTS equipment (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                description TEXT,
                total_quantity INT NOT NULL DEFAULT 0,
                available_quantity INT NOT NULL DEFAULT 0,
                status ENUM('available', 'issued', 'maintenance', 'damaged') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS equipment_issues (
                id INT AUTO_INCREMENT PRIMARY KEY,
                equipment_id INT NOT NULL,
                user_id INT NOT NULL,
                issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                return_date TIMESTAMP NULL,
                status ENUM('issued', 'returned') DEFAULT 'issued',
                FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS venues (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location VARCHAR(200),
                capacity INT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                venue_id INT NOT NULL,
                user_id INT NOT NULL,
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                purpose VARCHAR(200),
                status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS maintenance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                equipment_id INT NOT NULL,
                issue_description TEXT NOT NULL,
                reported_by INT NOT NULL,
                status ENUM('reported', 'in_progress', 'completed', 'cancelled') DEFAULT 'reported',
                reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_date TIMESTAMP NULL,
                repair_cost DECIMAL(10, 2),
                notes TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
                FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const tableSQL of tables) {
            await connection.query(tableSQL);
        }
        console.log('All tables created successfully');

        // Insert sample venues
        const [venueRows] = await connection.execute('SELECT COUNT(*) as count FROM venues');
        if (venueRows[0].count === 0) {
            await connection.execute(`
                INSERT INTO venues (name, location, capacity, description) VALUES
                ('Main Cricket Ground', 'Sports Complex A', 500, 'Full-size cricket ground with pavilion'),
                ('Football Field 1', 'Sports Complex A', 200, 'Standard size football field with floodlights'),
                ('Basketball Court', 'Indoor Arena', 100, 'Indoor basketball court with seating'),
                ('Tennis Court 1', 'Tennis Complex', 50, 'Hard court tennis facility'),
                ('Badminton Hall', 'Indoor Arena', 80, '4 badminton courts with wooden flooring'),
                ('Volleyball Court', 'Beach Sports Area', 100, 'Beach volleyball court')
            `);
            console.log('Sample venues inserted');
        }

        // Insert sample equipment
        const [equipmentRows] = await connection.execute('SELECT COUNT(*) as count FROM equipment');
        if (equipmentRows[0].count === 0) {
            await connection.execute(`
                INSERT INTO equipment (name, category, description, total_quantity, available_quantity, status) VALUES
                ('Cricket Bat', 'Cricket', 'English willow cricket bat', 20, 20, 'available'),
                ('Cricket Ball', 'Cricket', 'Leather cricket ball', 50, 50, 'available'),
                ('Football', 'Football', 'Size 5 professional football', 30, 30, 'available'),
                ('Basketball', 'Basketball', 'Official size basketball', 25, 25, 'available'),
                ('Tennis Racket', 'Tennis', 'Professional tennis racket', 15, 15, 'available'),
                ('Tennis Ball', 'Tennis', 'Tennis ball can (3 balls)', 40, 40, 'available'),
                ('Badminton Racket', 'Badminton', 'Carbon fiber badminton racket', 30, 30, 'available'),
                ('Shuttlecock', 'Badminton', 'Feather shuttlecock tube', 50, 50, 'available'),
                ('Volleyball', 'Volleyball', 'Official size volleyball', 20, 20, 'available'),
                ('Hockey Stick', 'Hockey', 'Composite hockey stick', 25, 25, 'available')
            `);
            console.log('Sample equipment inserted');
        }

        // Check if admin exists
        const [adminRows] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        if (adminRows[0].count === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['System Admin', 'admin@sportvault.com', hashedPassword, 'admin']
            );
            console.log('Default admin user created');
        }

        console.log('\n=================================');
        console.log('Database setup completed successfully!');
        console.log('=================================');
        console.log('Default Admin: admin@sportvault.com / admin123');
        console.log('=================================');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Database setup failed:', error.message);
        process.exit(1);
    }
};

setupDatabase();
