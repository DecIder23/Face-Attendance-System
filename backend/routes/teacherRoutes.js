const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), teacherController.createTeacher);
router.get('/', protect, teacherController.getAllTeachers);
router.get('/profile', protect, teacherController.getTeacherProfile);
router.get('/:id', protect, teacherController.getTeacherById);
router.put('/:id', protect, authorize('admin'), teacherController.updateTeacher);
router.delete('/:id', protect, authorize('admin'), teacherController.deleteTeacher);

module.exports = router;
