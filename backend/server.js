// Load environment variables from .env (if present)
require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const defineUserModel = require('./models/User');
const { initializeAttendanceModel } = require('./controllers/attendanceController');
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const lectureScheduleRoutes = require('./routes/lectureScheduleRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const imageSyncRoutes = require('./routes/imageSyncRoutes');

const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(cors({
    origin: ['http://127.0.0.1:5505', 'http://localhost:5505'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
// Increase payload size limit to 10mb for JSON and urlencoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database connection setup
const sequelize = new Sequelize('fyp_backend', 'postgres', 'admin', {
    host: 'localhost',
    port: 9000,
    dialect: 'postgres' // or 'mysql'
});

// Test database connection
sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.log('Error: ' + err));

// Define models
const User = defineUserModel(sequelize);
const Attendance = initializeAttendanceModel(sequelize);

// Sync models with database (creates tables if they don't exist)
sequelize.sync({ alter: true }) // Use alter: true to update tables without dropping data
    .then(async () => {
        console.log('Database synced!');
        // Ensure default admin user exists
        const adminUsername = 'Admin';
        const adminPassword = '1234';
        const adminRole = 'admin';
        const existingAdmin = await User.findOne({ where: { username: adminUsername, role: adminRole } });
        if (!existingAdmin) {
            await User.create({ username: adminUsername, password: adminPassword, role: adminRole });
            console.log('Default admin user created.');
        } else {
            console.log('Default admin user already exists.');
        }
    })
    .catch(err => console.log('Error syncing database: ' + err));

// Basic route
// Use authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lectureSchedules', lectureScheduleRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/excel', require('./routes/attendanceExcelRoutes'));
app.use('/api/images', imageSyncRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
