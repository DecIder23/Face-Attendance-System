const express = require('express');
const router = express.Router();
const lectureScheduleController = require('../controllers/lectureScheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), lectureScheduleController.createLectureSchedule);
router.get('/', protect, lectureScheduleController.getAllLectureSchedules);
router.get('/:id', protect, lectureScheduleController.getLectureScheduleById);
router.put('/:id', protect, authorize('admin'), lectureScheduleController.updateLectureSchedule);
router.delete('/:id', protect, authorize('admin'), lectureScheduleController.deleteLectureSchedule);
router.post('/bulk', protect, authorize('admin'), lectureScheduleController.bulkUploadLectureSchedules);
router.delete('/slot/:slotId', protect, authorize('admin'), lectureScheduleController.deleteLectureScheduleBySlotId);

module.exports = router;
