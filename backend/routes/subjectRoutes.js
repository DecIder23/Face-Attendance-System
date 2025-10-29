const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), subjectController.createSubject);
router.get('/', protect, subjectController.getAllSubjects);
router.get('/:id', protect, subjectController.getSubjectById);
router.put('/:id', protect, authorize('admin'), subjectController.updateSubject);
router.delete('/:id', protect, authorize('admin'), subjectController.deleteSubject);

module.exports = router;
