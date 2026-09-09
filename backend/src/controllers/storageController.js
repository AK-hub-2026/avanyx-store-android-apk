const path = require('path');
const { validateFileForBucket, uploadToSupabaseStorage, deleteFromSupabaseStorage } = require('../services/supabaseStorageService');
const { createSuccessResponse, createErrorResponse } = require('../models/responseModels');
const { ApiError } = require('../models/exceptionModels');

/**
 * Upload Developer Profile Image
 */
async function uploadDeveloperProfile(req, res) {
  try {
    const user = req.user;
    const file = req.file;

    validateFileForBucket('developer-profile', file);

    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    const timestamp = Date.now();
    const fileName = `${user.uid}/profile_${timestamp}${ext}`;

    const result = await uploadToSupabaseStorage({
      bucketName: 'developer-profile',
      fileName,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      oldFilePath: req.body.oldFilePath || null
    });

    res.json(createSuccessResponse({
      bucket: 'developer-profile',
      fileName: result.path,
      publicUrl: result.publicUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedByUid: user.uid
    }, 'Developer profile image uploaded successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

/**
 * Upload Developer Banner
 */
async function uploadDeveloperBanner(req, res) {
  try {
    const user = req.user;
    const file = req.file;

    validateFileForBucket('developer-banner', file);

    const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const fileName = `${user.uid}/banner_${timestamp}${ext}`;

    const result = await uploadToSupabaseStorage({
      bucketName: 'developer-banner',
      fileName,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      oldFilePath: req.body.oldFilePath || null
    });

    res.json(createSuccessResponse({
      bucket: 'developer-banner',
      fileName: result.path,
      publicUrl: result.publicUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedByUid: user.uid
    }, 'Developer banner image uploaded successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

/**
 * Upload App Icon
 */
async function uploadAppIcon(req, res) {
  try {
    const user = req.user;
    const file = req.file;
    const appId = req.body.appId || req.query.appId || 'app_draft';

    validateFileForBucket('app-icons', file);

    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    const timestamp = Date.now();
    const fileName = `${appId}/icon_${timestamp}${ext}`;

    const result = await uploadToSupabaseStorage({
      bucketName: 'app-icons',
      fileName,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      oldFilePath: req.body.oldFilePath || null
    });

    res.json(createSuccessResponse({
      bucket: 'app-icons',
      appId,
      fileName: result.path,
      publicUrl: result.publicUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedByUid: user.uid
    }, 'App icon asset uploaded successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

/**
 * Upload App Banner
 */
async function uploadAppBanner(req, res) {
  try {
    const user = req.user;
    const file = req.file;
    const appId = req.body.appId || req.query.appId || 'app_draft';

    validateFileForBucket('app-banners', file);

    const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const fileName = `${appId}/banner_${timestamp}${ext}`;

    const result = await uploadToSupabaseStorage({
      bucketName: 'app-banners',
      fileName,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      oldFilePath: req.body.oldFilePath || null
    });

    res.json(createSuccessResponse({
      bucket: 'app-banners',
      appId,
      fileName: result.path,
      publicUrl: result.publicUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedByUid: user.uid
    }, 'App banner asset uploaded successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

/**
 * Upload App Screenshot
 */
async function uploadAppScreenshot(req, res) {
  try {
    const user = req.user;
    const file = req.file;
    const appId = req.body.appId || req.query.appId || 'app_draft';

    validateFileForBucket('app-screenshots', file);

    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    const timestamp = Date.now();
    const index = req.body.index || '0';
    const fileName = `${appId}/screenshot_${index}_${timestamp}${ext}`;

    const result = await uploadToSupabaseStorage({
      bucketName: 'app-screenshots',
      fileName,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      oldFilePath: req.body.oldFilePath || null
    });

    res.json(createSuccessResponse({
      bucket: 'app-screenshots',
      appId,
      fileName: result.path,
      publicUrl: result.publicUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedByUid: user.uid
    }, 'App screenshot uploaded successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

/**
 * Upload App Video
 */
async function uploadAppVideo(req, res) {
  try {
    const user = req.user;
    const file = req.file;
    const appId = req.body.appId || req.query.appId || 'app_draft';

    validateFileForBucket('app-videos', file);

    const ext = path.extname(file.originalname || '.mp4').toLowerCase() || '.mp4';
    const timestamp = Date.now();
    const fileName = `${appId}/video_${timestamp}${ext}`;

    const result = await uploadToSupabaseStorage({
      bucketName: 'app-videos',
      fileName,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      oldFilePath: req.body.oldFilePath || null
    });

    res.json(createSuccessResponse({
      bucket: 'app-videos',
      appId,
      fileName: result.path,
      publicUrl: result.publicUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      uploadedByUid: user.uid
    }, 'App preview video uploaded successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

/**
 * Delete File from Storage
 */
async function deleteFile(req, res) {
  try {
    const { bucketName, filePath } = req.body;
    if (!bucketName || !filePath) {
      throw new ApiError(400, 'MISSING_PARAMS', 'bucketName and filePath are required to delete a storage object');
    }

    const success = await deleteFromSupabaseStorage(bucketName, filePath);
    if (!success) {
      throw new ApiError(500, 'DELETE_FAILED', `Failed deleting object '${filePath}' from bucket '${bucketName}'`);
    }

    res.json(createSuccessResponse({ bucket: bucketName, filePath }, 'Storage asset deleted successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(createErrorResponse(error));
  }
}

module.exports = {
  uploadDeveloperProfile,
  uploadDeveloperBanner,
  uploadAppIcon,
  uploadAppBanner,
  uploadAppScreenshot,
  uploadAppVideo,
  deleteFile
};
