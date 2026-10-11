/**
 * AVANYX Store Internal Storage Adapter
 * Routes all media and verification documents to internal AVANYX Upload Service.
 * Does not use external Firebase Storage or Cloudflare/Supabase buckets.
 */

import {
  uploadToAvanyxStorage,
  uploadAadhaarFront,
  uploadLiveSelfie,
  uploadVerificationDocument as uploadDocInternal,
  AvanyxStorageFolder
} from './avanyxUploadService';

export interface VerificationUploadResult {
  publicUrl: string;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
}

/**
 * Uploads sensitive verification documents securely via AVANYX Upload Service.
 */
export async function uploadVerificationDocument(
  file: File | Blob,
  userId: string,
  category: 'developer' | 'student',
  docType: 'aadhaar_front' | 'selfie' | 'marksheet' | 'tc' | 'general'
): Promise<VerificationUploadResult> {
  let folder: AvanyxStorageFolder = '/private/verification/documents/';
  if (docType === 'aadhaar_front') {
    folder = '/private/verification/aadhaar/';
  } else if (docType === 'selfie') {
    folder = '/private/verification/selfie/';
  }

  const result = await uploadToAvanyxStorage(file, {
    folder,
    userId
  });

  return {
    publicUrl: result.publicUrl,
    storagePath: result.storagePath,
    fileName: result.sanitizedName,
    fileSizeBytes: result.fileSizeBytes
  };
}

/**
 * Universal media uploader for AVANYX Upload Service.
 */
export async function uploadMediaToFirebaseStorage(
  file: File | Blob,
  pathOrFolder: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  let folder: AvanyxStorageFolder = '/public/apps/';
  if (pathOrFolder.includes('logo') || pathOrFolder.includes('icon')) {
    folder = '/public/logos/';
  } else if (pathOrFolder.includes('banner')) {
    folder = '/public/banners/';
  } else if (pathOrFolder.includes('screenshot')) {
    folder = '/public/screenshots/';
  } else if (pathOrFolder.includes('aadhaar')) {
    folder = '/private/verification/aadhaar/';
  } else if (pathOrFolder.includes('selfie')) {
    folder = '/private/verification/selfie/';
  } else if (pathOrFolder.includes('document') || pathOrFolder.includes('student')) {
    folder = '/private/verification/documents/';
  }

  const result = await uploadToAvanyxStorage(file, {
    folder,
    userId: 'user_upload',
    onProgress
  });

  return result.publicUrl;
}
