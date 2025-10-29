const express = require('express');
const router = express.Router();
const { syncStudentImages, listStudentImages } = require('../controllers/imageSyncController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin-only endpoint to sync images
router.get('/sync-student-images', protect, authorize('admin'), syncStudentImages);

router.get('/list-student-images', listStudentImages);

module.exports = router;
