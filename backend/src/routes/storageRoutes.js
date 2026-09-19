const express = require('express');
const multer = require('multer');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Configure Multer for memory buffer handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max limit
  }
});

// All storage endpoints require authenticated Firebase user
router.use(authenticate());

// Developer Profile & Banner Assets
router.post(
  '/upload/developer-profile',
  requireRole('DEVELOPER'),
  upload.single('file'),
  storageController.uploadDeveloperProfile
);

router.post(
  '/upload/developer-banner',
  requireRole('DEVELOPER'),
  upload.single('file'),
  storageController.uploadDeveloperBanner
);

// App Store Assets
router.post(
  '/upload/app-icon',
  requireRole('DEVELOPER'),
  upload.single('file'),
  storageController.uploadAppIcon
);

router.post(
  '/upload/app-banner',
  requireRole('DEVELOPER'),
  upload.single('file'),
  storageController.uploadAppBanner
);

router.post(
  '/upload/app-screenshot',
  requireRole('DEVELOPER'),
  upload.single('file'),
  storageController.uploadAppScreenshot
);

router.post(
  '/upload/app-video',
  requireRole('DEVELOPER'),
  upload.single('file'),
  storageController.uploadAppVideo
);

// Delete file
router.post(
  '/delete',
  requireRole('DEVELOPER'),
  storageController.deleteFile
);

module.exports = router;
