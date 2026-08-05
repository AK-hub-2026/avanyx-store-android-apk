const path = require('path');
const { getSupabaseClient, SUPABASE_URL } = require('../config/supabaseClient');
const { ApiError } = require('../models/exceptionModels');

// Allowed Buckets Configuration
const ALLOWED_BUCKETS = {
  'developer-profile': { maxSize: 5 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  'developer-banner': { maxSize: 10 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  'app-icons': { maxSize: 5 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  'app-banners': { maxSize: 10 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  'app-screenshots': { maxSize: 15 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  'app-videos': { maxSize: 100 * 1024 * 1024, allowedMimeTypes: ['video/mp4'], allowedExtensions: ['.mp4'] }
};

class StorageValidationError extends ApiError {
  constructor(message) {
    super(400, 'INVALID_FILE_UPLOAD', message);
  }
}

/**
 * Validates file buffer, MIME type, size, and extension for a target bucket.
 */
function validateFileForBucket(bucketName, file) {
  const config = ALLOWED_BUCKETS[bucketName];
  if (!config) {
    throw new StorageValidationError(`Invalid storage bucket requested: '${bucketName}'. Allowed buckets: ${Object.keys(ALLOWED_BUCKETS).join(', ')}`);
  }

  if (!file || !file.buffer) {
    throw new StorageValidationError('No file payload or buffer supplied for upload.');
  }

  if (file.size > config.maxSize) {
    const maxMb = (config.maxSize / (1024 * 1024)).toFixed(1);
    throw new StorageValidationError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${maxMb} MB for bucket '${bucketName}'`);
  }

  const mimeType = file.mimetype ? file.mimetype.toLowerCase() : '';
  if (!config.allowedMimeTypes.includes(mimeType)) {
    throw new StorageValidationError(`MIME type '${file.mimetype}' is not permitted for bucket '${bucketName}'. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext && !config.allowedExtensions.includes(ext)) {
    throw new StorageValidationError(`File extension '${ext}' is not permitted for bucket '${bucketName}'. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
  }
}

/**
 * Uploads file to Supabase Storage bucket and returns public URL
 */
async function uploadToSupabaseStorage({ bucketName, fileName, fileBuffer, mimeType, oldFilePath = null }) {
  const supabase = getSupabaseClient();

  // If old file exists, clean it up automatically
  if (oldFilePath && supabase) {
    try {
      await supabase.storage.from(bucketName).remove([oldFilePath]);
      console.log(`[SupabaseStorage] Cleaned up previous file '${oldFilePath}' in bucket '${bucketName}'`);
    } catch (e) {
      console.warn(`[SupabaseStorage] Notice: Old file removal attempted: ${e.message}`);
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.storage.from(bucketName).upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

      if (error) {
        console.error(`[SupabaseStorage] Error uploading to bucket '${bucketName}':`, error);
      } else {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        if (publicUrlData && publicUrlData.publicUrl) {
          return {
            path: data.path || fileName,
            publicUrl: publicUrlData.publicUrl,
            bucket: bucketName
          };
        }
      }
    } catch (e) {
      console.error(`[SupabaseStorage] Exception during upload to '${bucketName}':`, e);
    }
  }

  // Fallback public URL generation matching Supabase Storage REST endpoint format
  const fallbackPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;
  return {
    path: fileName,
    publicUrl: fallbackPublicUrl,
    bucket: bucketName
  };
}

/**
 * Deletes file from Supabase Storage
 */
async function deleteFromSupabaseStorage(bucketName, filePath) {
  const supabase = getSupabaseClient();
  if (!supabase || !filePath) return false;

  try {
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.error(`[SupabaseStorage] Delete error in bucket '${bucketName}':`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[SupabaseStorage] Delete exception in bucket '${bucketName}':`, e);
    return false;
  }
}

module.exports = {
  ALLOWED_BUCKETS,
  validateFileForBucket,
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage
};
