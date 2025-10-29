const express = require('express');
const multer = require('multer');
const path = require('path');
const { recognizeFaces, processGroupPhotoAttendance } = require('../faceRecognition');
const db = require('../models'); // Import all models
const Student = db.Student; // Use the Sequelize Student model

const {
    markAttendance,
    getAttendance,
    getTodayAttendance,
    getAttendanceStats,
    saveAttendanceWithFile,
    getStudentAttendance,
    getStudentAttendanceCombined
} = require('../controllers/attendanceController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary upload folder

// POST /api/attendance/save - Save attendance for multiple students with file upload
router.post('/save', upload.single('attendanceFile'), saveAttendanceWithFile);

// POST /api/attendance/mark-by-face
router.post('/mark-by-face', upload.single('file'), async (req, res) => {
    try {
        const { subject, classId, date } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image file uploaded' 
            });
        }
        
        const imagePath = req.file.path;
        console.log(`Processing group photo for class ${classId}, subject ${subject}, date ${date}`);
        
        // Fetch students for the class
        let students = [];
        try {
            if (Student) {
                students = await Student.findAll({ where: { classId } });
                students = students.map(s => s.toJSON());
            } else {
                // Fallback: use mock student data if Student model is not available
                students = [
                    { id: 'ST001', name: 'John Doe', email: 'john@example.com' },
                    { id: 'ST002', name: 'Jane Smith', email: 'jane@example.com' },
                    { id: 'ST003', name: 'Mike Johnson', email: 'mike@example.com' },
                    { id: 'ST004', name: 'Sarah Wilson', email: 'sarah@example.com' },
                    { id: 'ST005', name: 'David Brown', email: 'david@example.com' }
                ];
                console.log('Using mock student data for demo');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            // Use mock data as fallback
            students = [
                { id: 'ST001', name: 'John Doe', email: 'john@example.com' },
                { id: 'ST002', name: 'Jane Smith', email: 'jane@example.com' },
                { id: 'ST003', name: 'Mike Johnson', email: 'mike@example.com' },
                { id: 'ST004', name: 'Sarah Wilson', email: 'sarah@example.com' },
                { id: 'ST005', name: 'David Brown', email: 'david@example.com' }
            ];
        }
        
        if (students.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No students found for this class' 
            });
        }
        
        // Process group photo and mark attendance
        const result = await processGroupPhotoAttendance(imagePath, students, {
            subject,
            classId,
            date
        });
        
        // Clean up uploaded file
        const fs = require('fs');
        try {
            fs.unlinkSync(imagePath);
        } catch (cleanupError) {
            console.warn('Could not delete uploaded file:', cleanupError.message);
        }
        
        res.json({
            success: true,
            students: result.students,
            summary: result.summary,
            attendanceMarked: result.attendanceMarked,
            message: `Face recognition complete! ${result.summary.present}/${result.summary.total} students marked present.`
        });
        
    } catch (err) {
        console.error('Face recognition error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Face recognition failed: ' + err.message 
        });
    }
});

// POST /api/attendance/mark - Mark attendance for a student (called from camera face recognition)
router.post('/mark', markAttendance);

// POST /api/attendance/mark-status - Mark attendance with specific status (present/absent)
router.post('/mark-status', async (req, res) => {
    try {
        const { student_name, student_email, status } = req.body;
        
        if (!student_name) {
            return res.status(400).json({
                success: false,
                message: 'Student name is required'
            });
        }
        
        if (!status || !['present', 'absent'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "present" or "absent"'
            });
        }
        
        // Call the markAttendance function with status
        const mockReq = {
            body: { student_name, student_email, status }
        };
        
        await markAttendance(mockReq, res);
        
    } catch (error) {
        console.error('Error marking attendance with status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message
        });
    }
});

// GET /api/attendance - Get attendance records with optional filters
router.get('/', getAttendance);

// GET /api/attendance/today - Get today's attendance
router.get('/today', getTodayAttendance);

// GET /api/attendance/stats - Get attendance statistics
router.get('/stats', getAttendanceStats);

// GET /api/attendance/student/:studentId - Get all attendance records for a student
router.get('/student/:studentId', getStudentAttendanceCombined);

module.exports = router;
