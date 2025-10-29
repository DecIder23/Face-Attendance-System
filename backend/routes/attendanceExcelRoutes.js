const express = require('express');
const router = express.Router();
const { markAttendance } = require('../controllers/attendanceExcelController');

router.post('/mark', markAttendance);

module.exports = router;
