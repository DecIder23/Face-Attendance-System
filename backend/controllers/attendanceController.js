const { Sequelize } = require('sequelize');
const defineAttendanceModel = require('../models/Attendance');
const db = require('../models');
const AttendanceSession = db.AttendanceSession;
const { sendSms } = require('../utils/notifications');

// Initialize the model (you'll need to pass your sequelize instance)
let Attendance;

const initializeAttendanceModel = (sequelize) => {
    Attendance = defineAttendanceModel(sequelize);
    return Attendance;
};

// Mark attendance for a student
const markAttendance = async (req, res) => {
    try {
    const { student_name, student_email, status = 'present', subject = 'General', markedBy = null } = req.body;

        if (!student_name) {
            return res.status(400).json({
                success: false,
                message: 'Student name is required'
            });
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Check if attendance already exists for this student today
        const existingAttendance = await Attendance.findOne({
            where: {
                student_name: student_name,
                date: today
            }
        });

        if (existingAttendance) {
            return res.status(200).json({
                success: true,
                message: 'Attendance already marked for today',
                data: existingAttendance,
                alreadyMarked: true
            });
        }

        // Create new attendance record
        const attendanceRecord = await Attendance.create({
            student_name: student_name,
            student_email: student_email || null,
            subject: subject,
            date: today,
            time_in: new Date(),
            status: status,
            markedBy: markedBy
        });

        console.log(`Attendance marked for ${student_name} at ${new Date().toLocaleString()}`);

        // Try to send SMS to student if phone is available
        try {
            // Attempt to find a student record to get phone
            let student = null;
            if (student_email) student = await db.Student.findOne({ where: { email: student_email } });
            if (!student) student = await db.Student.findOne({ where: { name: student_name } });
            if (!student && student_name) student = await db.Student.findOne({ where: { studentId: student_name } });
            const phone = student ? student.phone : null;
            if (phone) {
                const msg = `Your ${subject} attendance for ${today} is ${status}.`;
                sendSms(phone, msg).catch(e => console.error('SMS send error:', e));
            }
        } catch (e) {
            console.error('Error attempting to send SMS after marking attendance:', e.message || e);
        }

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: attendanceRecord,
            alreadyMarked: false
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        
        // Handle unique constraint violation
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(200).json({
                success: true,
                message: 'Attendance already marked for today',
                alreadyMarked: true
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message
        });
    }
};

// Get attendance records with optional filters
const getAttendance = async (req, res) => {
    try {
        const { date, student_name, limit = 50, offset = 0 } = req.query;
        
        const whereClause = {};
        
        if (date) {
            whereClause.date = date;
        }
        
        if (student_name) {
            whereClause.student_name = {
                [Sequelize.Op.iLike]: `%${student_name}%`
            };
        }

        const attendanceRecords = await Attendance.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['date', 'DESC'], ['time_in', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: attendanceRecords.rows,
            total: attendanceRecords.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance records',
            error: error.message
        });
    }
};

// Get today's attendance
const getTodayAttendance = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const todayAttendance = await Attendance.findAll({
            where: {
                date: today
            },
            order: [['time_in', 'ASC']]
        });

        res.status(200).json({
            success: true,
            date: today,
            count: todayAttendance.length,
            data: todayAttendance
        });

    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s attendance',
            error: error.message
        });
    }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const whereClause = {};
        
        if (start_date && end_date) {
            whereClause.date = {
                [Sequelize.Op.between]: [start_date, end_date]
            };
        } else if (start_date) {
            whereClause.date = {
                [Sequelize.Op.gte]: start_date
            };
        } else if (end_date) {
            whereClause.date = {
                [Sequelize.Op.lte]: end_date
            };
        }

        const stats = await Attendance.findAll({
            attributes: [
                'student_name',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_days'],
                [Sequelize.fn('MIN', Sequelize.col('date')), 'first_attendance'],
                [Sequelize.fn('MAX', Sequelize.col('date')), 'last_attendance']
            ],
            where: whereClause,
            group: ['student_name'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance statistics',
            error: error.message
        });
    }
};

// Save attendance for multiple students with file upload
const saveAttendanceWithFile = async (req, res) => {
    try {
        const { subject, classId, date, teacher_id } = req.body;
        let students = [];
        if (req.body.students) {
            students = JSON.parse(req.body.students);
        }
        const filePath = req.file ? req.file.path : null;
        if (!subject || !classId || !date || !students.length) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (subject, classId, date, students)'
            });
        }
    // Calculate present and absent students (normalize to strings to avoid type mismatch)
    const presentStudents = students.filter(s => s.status === 'present').map(s => String(s.studentId || s.id));
    const absentStudents = students.filter(s => s.status === 'absent').map(s => String(s.studentId || s.id));

        // Look up teacher name by ID if provided
        let teacherName = null;
        if (teacher_id) {
            try {
                const teacher = await db.Teacher.findByPk(teacher_id);
                if (teacher) {
                    teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
                }
            } catch (e) {}
        }

        // Create AttendanceSession with present/absent students and teacher name
        const session = await AttendanceSession.create({
            subject,
            classId,
            date,
            filePath,
            present_students: presentStudents,
            absent_students: absentStudents,
            teacher_name: teacherName
        });
        // Save attendance for each student, link to session
        const savedRecords = [];
    for (const s of students) {
            // Check if already marked for this student/date/session
            const existing = await Attendance.findOne({
                where: {
                    student_name: s.name,
                    date: date
                }
            });
            if (existing) {
                savedRecords.push({ ...existing.toJSON(), alreadyMarked: true });
                continue;
            }
            // Normalize time_in: ensure it's a valid Date object or ISO string
            let timeIn = new Date();
            if (s.time) {
                // Try parsing directly
                const direct = Date.parse(s.time);
                if (!isNaN(direct)) {
                    timeIn = new Date(direct);
                } else {
                    // Try combining date and time (e.g., '2025-10-16 09:30:00')
                    const combined = new Date(`${date} ${s.time}`);
                    if (!isNaN(combined.getTime())) {
                        timeIn = combined;
                    } else {
                        // fallback to now
                        timeIn = new Date();
                    }
                }
            }

            const record = await Attendance.create({
                student_name: s.name,
                student_email: s.email || null,
                subject: subject,
                date: date,
                time_in: timeIn,
                status: s.status,
                markedBy: teacherName || null
                // Optionally add sessionId if you add a foreign key
                // sessionId: session.id
            });
            savedRecords.push({ ...record.toJSON(), alreadyMarked: false });

            // Send SMS to student phone if available (present and absent both)
            try {
                let student = null;
                if (s.studentId) student = await db.Student.findOne({ where: { studentId: s.studentId } });
                if (!student && s.email) student = await db.Student.findOne({ where: { email: s.email } });
                if (!student) student = await db.Student.findOne({ where: { name: s.name } });
                const phone = student ? student.phone : null;
                if (phone) {
                    const msg = `Your ${subject} attendance for ${date} is ${s.status}.`;
                    sendSms(phone, msg).catch(e => console.error('SMS send error:', e));
                }
            } catch (e) {
                console.error('Error sending SMS in bulk save for', s.name, e.message || e);
            }
        }
        res.status(201).json({
            success: true,
            message: 'Attendance saved for all students',
            data: savedRecords,
            session: session,
            file: filePath
        });

        // Fire-and-forget: send attendance notifications in background
        try {
            setImmediate(() => {
                sendAttendanceNotifications(session.id).catch(e => console.error('Background SMS error:', e));
            });
        } catch (e) {
            console.error('Failed to schedule background notifications:', e.message || e);
        }
    } catch (error) {
        console.error('Error saving attendance with file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save attendance',
            error: error.message
        });
    }
};

// Background: send SMS notifications for a saved AttendanceSession
const sendAttendanceNotifications = async (sessionId) => {
    try {
        const session = await AttendanceSession.findByPk(sessionId);
        if (!session) {
            console.warn('No AttendanceSession found for id', sessionId);
            return;
        }

        const subject = session.subject || 'Subject';
        const date = session.date;
        const presentArr = Array.isArray(session.present_students) ? session.present_students : [];
        const absentArr = Array.isArray(session.absent_students) ? session.absent_students : [];

        const allIds = Array.from(new Set([...presentArr, ...absentArr]));
        const numericIds = allIds.filter(x => /^\d+$/.test(String(x))).map(x => parseInt(x));
        const stringIds = allIds.filter(x => !/^\d+$/.test(String(x))).map(x => String(x));

        let students = [];
        if (numericIds.length > 0) {
            const byId = await db.Student.findAll({ where: { id: numericIds } });
            students = students.concat(byId);
        }
        if (stringIds.length > 0) {
            const byStudentId = await db.Student.findAll({ where: { studentId: stringIds } });
            students = students.concat(byStudentId);
        }

        // Deduplicate students by id
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s; });

        // For any ids that could not be resolved to Student records, we skip sending SMS.

        // Prepare send promises
        const sendPromises = Object.values(studentMap).map(student => {
            const sid = String(student.id);
            const altId = student.studentId ? String(student.studentId) : null;
            const isPresent = presentArr.some(x => String(x) === sid || String(x) === altId || String(x) === student.email);
            const isAbsent = absentArr.some(x => String(x) === sid || String(x) === altId || String(x) === student.email);
            const status = isPresent ? 'present' : (isAbsent ? 'absent' : 'absent');
            const phone = student.phone;
            if (!phone) return Promise.resolve({ success: false, reason: 'no phone', studentId: student.id });
            const message = `Your ${subject} attendance for ${date} is ${status}.`;
            return sendSms(phone, message).then(result => ({ success: result.success, sid: result.sid, studentId: student.id, result }))
                .catch(err => ({ success: false, error: err && err.message ? err.message : String(err), studentId: student.id }));
        });

        const results = await Promise.allSettled(sendPromises);
        results.forEach(r => {
            if (r.status === 'fulfilled') {
                // r.value
                // Log each result
                // We already log inside sendSms; keep light logging here
                // console.log('SMS send result:', r.value);
            } else {
                console.error('SMS send rejected:', r.reason);
            }
        });

        console.log(`Background SMS sending completed for session ${sessionId}`);

    } catch (error) {
        console.error('Error in sendAttendanceNotifications:', error && error.message ? error.message : error);
    }
};

// Get all attendance records for a student, grouped by subject
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        // Find student by id
        const student = await db.Student.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        // Find all attendance records for this student
        const records = await db.Attendance.findAll({
            where: { student_name: student.name },
            order: [['date', 'DESC'], ['time_in', 'DESC']]
        });
        // Map to frontend format
        const attendanceRecords = records.map(r => ({
            date: r.date,
            subject: r.subject || '', // If you store subject in Attendance
            status: r.status,
            time: r.time_in ? new Date(r.time_in).toLocaleTimeString() : '',
            markedBy: r.markedBy || 'System' // If you store markedBy
        }));
        res.json({
            name: student.name,
            attendanceRecords
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student attendance', error: error.message });
    }
};

// Get all attendance records for a student, checking both Attendance and AttendanceSession tables
const getStudentAttendanceCombined = async (req, res) => {
    try {
        const { studentId } = req.params;
        // Find student by id
        const student = await db.Student.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        // Get full name for matching in AttendanceSession arrays
        const fullName = `${student.firstName} ${student.lastName}`.trim();

        // Find all attendance records for this student (Attendance table)
        const possibleNames = [fullName];
        if (student.email) possibleNames.push(student.email);
        if (student.studentId) possibleNames.push(String(student.studentId));

        const records = await db.Attendance.findAll({
            where: { student_name: { [Sequelize.Op.in]: possibleNames } },
            order: [['date', 'DESC'], ['time_in', 'DESC']]
        });

        // Find all AttendanceSessions (we'll filter per session)
        const sessions = await db.AttendanceSession.findAll({
            where: {},
            order: [['date', 'DESC']]
        });

        // For each session, if student is in present_students or absent_students, add a record
        const sessionRecords = [];
        const studentIdStr = String(student.id);
        const studentIdAlt = student.studentId ? String(student.studentId) : null;
        const studentEmail = student.email || null;

        sessions.forEach(session => {
            const presentArr = Array.isArray(session.present_students) ? session.present_students : [];
            const absentArr = Array.isArray(session.absent_students) ? session.absent_students : [];

            const isPresent = presentArr.some(x => String(x) === studentIdStr || String(x) === studentIdAlt || String(x) === studentEmail);
            const isAbsent = absentArr.some(x => String(x) === studentIdStr || String(x) === studentIdAlt || String(x) === studentEmail);

            if (isPresent || isAbsent) {
                sessionRecords.push({
                    date: session.date,
                    subject: session.subject || '',
                    status: isPresent ? 'present' : 'absent',
                    time: '',
                    markedBy: session.teacher_name || 'System'
                });
            }
        });

        // Build maps keyed by date|subject to merge entries.
        const map = {}; // key -> { date, subject, attendanceEntry, sessionEntry }

        // Add Attendance table records
        records.forEach(r => {
            const date = r.date;
            const subject = r.subject || '';
            const key = `${date}|${subject}`;
            map[key] = map[key] || { date, subject, attendanceEntry: null, sessionEntry: null };
            map[key].attendanceEntry = {
                status: r.status,
                time: r.time_in ? new Date(r.time_in).toLocaleTimeString() : '',
                markedBy: r.markedBy || 'System'
            };
        });

        // Add session records
        sessionRecords.forEach(s => {
            const date = s.date;
            const subject = s.subject || '';
            const key = `${date}|${subject}`;
            map[key] = map[key] || { date, subject, attendanceEntry: null, sessionEntry: null };
            // If multiple sessions for same date+subject exist, prefer first (teacher_name should be same)
            map[key].sessionEntry = {
                status: s.status,
                time: s.time || '',
                markedBy: s.markedBy || 'System'
            };
        });

        // Now compute final records per key according to rules:
        // - If present in either table => status = 'present'
        // - markedBy: if both present => combine Attendance.markedBy (or 'System') and session.teacher_name
        //   if only one present, use that source's name (attendance.markedBy or session.teacher_name)
        const attendanceRecords = Object.values(map).map(entry => {
            const att = entry.attendanceEntry;
            const sess = entry.sessionEntry;
            let status = 'absent';
            let time = '';
            let markedBy = 'System';

            const attPresent = att && att.status === 'present';
            const sessPresent = sess && sess.status === 'present';

            if (attPresent || sessPresent) {
                status = 'present';
            } else {
                status = (att && att.status) || (sess && sess.status) || 'absent';
            }

            // time preference: attendance time if available, else session time
            if (att && att.time) time = att.time;
            else if (sess && sess.time) time = sess.time;

            // markedBy combining rules
            if (attPresent && sessPresent) {
                const attName = (att && att.markedBy) ? att.markedBy : 'System';
                const sessName = (sess && sess.markedBy) ? sess.markedBy : 'System';
                // If both are the same, just use one; otherwise combine
                if (attName === sessName) markedBy = attName;
                else markedBy = `${attName} & ${sessName}`;
            } else if (attPresent) {
                markedBy = (att && att.markedBy) ? att.markedBy : 'System';
            } else if (sessPresent) {
                markedBy = (sess && sess.markedBy) ? sess.markedBy : 'System';
            } else {
                // neither present: pick any available markedBy or System
                if (att && att.markedBy) markedBy = att.markedBy;
                else if (sess && sess.markedBy) markedBy = sess.markedBy;
                else markedBy = 'System';
            }

            return {
                date: entry.date,
                subject: entry.subject || '',
                status,
                time,
                markedBy
            };
        }).sort((a, b) => b.date.localeCompare(a.date));
        res.json({
            name: fullName,
            attendanceRecords
        });
    } catch (error) {
        console.error('Error fetching student attendance (combined):', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student attendance', error: error.message });
    }
};

module.exports = {
    initializeAttendanceModel,
    markAttendance,
    getAttendance,
    getTodayAttendance,
    getAttendanceStats,
    saveAttendanceWithFile,
    getStudentAttendance,
    getStudentAttendanceCombined
};
