const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), classController.createClass);
router.get('/', protect, classController.getAllClasses);
router.get('/:id', protect, classController.getClassById);
router.put('/:id', protect, authorize('admin'), classController.updateClass);
router.delete('/:id', protect, authorize('admin'), classController.deleteClass);

module.exports = router;
