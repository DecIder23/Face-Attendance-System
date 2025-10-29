// Dump latest attendance and attendance_sessions for debugging
require('dotenv').config();
const db = require('../models');

(async () => {
    try {
        await db.sequelize.authenticate();
        console.log('DB connected from dump script');

        const Attendance = db.Attendance;
        const AttendanceSession = db.AttendanceSession;

        const attendances = await Attendance.findAll({ order: [['date', 'DESC'], ['time_in', 'DESC']], limit: 20 });
        console.log('--- Latest Attendance (up to 20) ---');
        attendances.forEach(a => console.log(JSON.stringify(a.toJSON())));

        const sessions = await AttendanceSession.findAll({ order: [['date', 'DESC']], limit: 20 });
        console.log('--- Latest AttendanceSession (up to 20) ---');
        sessions.forEach(s => console.log(JSON.stringify(s.toJSON())));

        process.exit(0);
    } catch (err) {
        console.error('Error in dump script:', err);
        process.exit(1);
    }
})();
