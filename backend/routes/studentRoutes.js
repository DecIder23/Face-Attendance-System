const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), studentController.createStudent);
router.get('/', protect, studentController.getAllStudents);
router.get('/me', protect, studentController.getCurrentStudent);
router.get('/:id', protect, studentController.getStudentById);
router.put('/:id', protect, authorize('admin'), studentController.updateStudent);
router.delete('/:id', protect, authorize('admin'), studentController.deleteStudent);

module.exports = router;
