const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/cameraController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), cameraController.createCamera);
router.get('/', protect, cameraController.getAllCameras);
router.get('/:id', protect, cameraController.getCameraById);
router.put('/:id', protect, authorize('admin'), cameraController.updateCamera);
router.delete('/:id', protect, authorize('admin'), cameraController.deleteCamera);

module.exports = router;
