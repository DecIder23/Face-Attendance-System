const express = require('express');
const router = express.Router();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Teacher, Student } = require('../models');

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.create({ username, password });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        res.status(400).json({ error: error.message || 'An unknown error occurred during registration.' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let foundUser = null;
        let role = null;

        // Admin login: check Users table for username 'Admin'
        if (email === 'Admin') {
            const adminUser = await User.findOne({ where: { username: 'Admin', role: 'admin' } });
            if (adminUser && await bcrypt.compare(password, adminUser.password)) {
                foundUser = adminUser;
                role = 'admin';
            }
        } else {
            // For teacher/student login, use email
            // Try to find teacher
            const teacher = await Teacher.findOne({ where: { email } });
            if (teacher && await bcrypt.compare(password, teacher.password)) {
                foundUser = teacher;
                role = 'teacher';
            } else {
                // Try to find student
                const student = await Student.findOne({ where: { email } });
                if (student && await bcrypt.compare(password, student.password)) {
                    foundUser = student;
                    role = 'student';
                }
            }
        }

        if (!foundUser) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let jwtPayload = { id: foundUser.id, role: role };
        if (foundUser.email) {
            jwtPayload.email = foundUser.email;
        } else if (foundUser.username) {
            jwtPayload.email = foundUser.username;
        }
        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.status(200).json({ message: 'Logged in successfully', token, user: { id: foundUser.id, email: foundUser.email || foundUser.username, role: role } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
