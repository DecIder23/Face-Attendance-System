// faceRecognition.js
// Enhanced face recognition module for group photo attendance marking
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { initializeAttendanceModel } = require('./controllers/attendanceController');

// For demo purposes, we'll simulate face recognition
// In production, you would integrate with actual face recognition libraries

/**
 * Recognize faces in group photo and match with student database.
 * @param {string} imagePath - Path to the uploaded group photo.
 * @param {Array} students - Array of student objects from the class.
 * @param {Object} options - Additional options (subject, classId, date).
 * @returns {Promise<Object>} - Resolves to object with recognized students and attendance summary.
 */
function recognizeFaces(imagePath, students, options = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`Processing group photo: ${imagePath}`);
            console.log(`Students in class: ${students.length}`);
            
            // Check if image file exists
            if (!fs.existsSync(imagePath)) {
                throw new Error('Uploaded image file not found');
            }

            // For demo purposes, simulate face recognition
            // In production, replace this with actual face recognition logic
            const recognizedStudents = await simulateFaceRecognition(students, options);
            
            // Prepare response with attendance summary
            const presentStudents = recognizedStudents.filter(s => s.status === 'present');
            const absentStudents = recognizedStudents.filter(s => s.status === 'absent');
            
            const result = {
                success: true,
                students: recognizedStudents,
                summary: {
                    total: students.length,
                    present: presentStudents.length,
                    absent: absentStudents.length,
                    presentList: presentStudents.map(s => s.name),
                    absentList: absentStudents.map(s => s.name)
                },
                processedAt: new Date().toISOString(),
                imagePath: imagePath
            };
            
            console.log(`Face recognition complete: ${presentStudents.length}/${students.length} students present`);
            resolve(result);
            
        } catch (error) {
            console.error('Face recognition error:', error);
            reject(error);
        }
    });
}

/**
 * Simulate face recognition for demo purposes
 * In production, replace with actual face recognition logic
 */
async function simulateFaceRecognition(students, options) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentTime = new Date().toISOString();
    
    // For demo: randomly mark 60-80% of students as present
    const presentPercentage = 0.6 + Math.random() * 0.2; // 60-80%
    const numberOfPresent = Math.floor(students.length * presentPercentage);
    
    // Shuffle students and mark first N as present
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    
    return shuffledStudents.map((student, index) => {
        const isPresent = index < numberOfPresent;
        return {
            id: student.id || student.studentId,
            studentId: student.id || student.studentId,
            name: student.name || student.studentName,
            email: student.email,
            status: isPresent ? 'present' : 'absent',
            time: isPresent ? currentTime : '',
            recognitionConfidence: isPresent ? (0.7 + Math.random() * 0.3).toFixed(2) : null
        };
    });
}

/**
 * Process group photo and mark attendance in database
 * @param {string} imagePath - Path to the uploaded group photo.
 * @param {Array} students - Array of student objects from the class.
 * @param {Object} options - Additional options (subject, classId, date).
 * @returns {Promise<Object>} - Resolves to attendance result with database updates.
 */
async function processGroupPhotoAttendance(imagePath, students, options = {}) {
    try {
        // Step 1: Recognize faces in the group photo
        const recognitionResult = await recognizeFaces(imagePath, students, options);
        
        // Step 2: Mark attendance in database for present students
        const attendanceResults = [];
        const { markAttendance } = require('./controllers/attendanceController');
        
        for (const student of recognitionResult.students) {
            try {
                // Create a mock request/response for the attendance controller
                const mockReq = {
                    body: {
                        student_name: student.name,
                        student_email: student.email || null,
                        status: student.status, // Include the status (present/absent)
                        subject: options.subject || 'General',
                        markedBy: options.markedBy || options.teacherName || 'Camera'
                    }
                };
                
                const mockRes = {
                    status: (code) => ({
                        json: (data) => {
                            attendanceResults.push({
                                studentName: student.name,
                                success: code === 201 || code === 200,
                                alreadyMarked: data.alreadyMarked || false,
                                message: data.message,
                                status: student.status
                            });
                        }
                    })
                };
                
                await markAttendance(mockReq, mockRes);
            } catch (error) {
                console.error(`Error marking attendance for ${student.name}:`, error);
                attendanceResults.push({
                    studentName: student.name,
                    success: false,
                    error: error.message,
                    status: student.status
                });
            }
        }
        
        return {
            ...recognitionResult,
            attendanceMarked: attendanceResults,
            databaseUpdated: true
        };
        
    } catch (error) {
        console.error('Error processing group photo attendance:', error);
        throw error;
    }
}

module.exports = { 
    recognizeFaces, 
    processGroupPhotoAttendance,
    simulateFaceRecognition 
};
