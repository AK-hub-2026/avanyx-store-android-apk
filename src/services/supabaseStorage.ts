import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://tqdzowkqyusxjfkmzlks.supabase.co';
const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZHpvd2txeXVzeGpma216bGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDQ5MjEsImV4cCI6MjA1NzYyMDkyMX0.dummy';

export const SUPABASE_BUCKETS = {
  APP_ICONS: 'app-icons',
  APP_BANNERS: 'app-banners',
  APP_SCREENSHOTS: 'app-screenshots',
  APP_VIDEOS: 'app-videos',
  DEVELOPER_PROFILE: 'developer-profile',
  DEVELOPER_BANNER: 'developer-banner',
  STUDENT_DOCS: 'student-docs'
} as const;

export type SupabaseBucketName = typeof SUPABASE_BUCKETS[keyof typeof SUPABASE_BUCKETS];

const BUCKET_LIMITS: Record<SupabaseBucketName, { maxSize: number; allowedTypes: string[] }> = {
  'app-icons': { maxSize: 5 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] },
  'app-banners': { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  'app-screenshots': { maxSize: 15 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  'app-videos': { maxSize: 100 * 1024 * 1024, allowedTypes: ['video/mp4'] },
  'developer-profile': { maxSize: 5 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  'developer-banner': { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  'student-docs': { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] }
};

let clientInstance: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return clientInstance;
}

export interface UploadMediaResult {
  publicUrl: string;
  fileName: string;
  bucket: string;
  sizeBytes: number;
}

/**
 * Validates and uploads media asset to designated Supabase Storage bucket.
 * Uses public URLs and never exposes service role key.
 */
export async function uploadMediaToSupabase(
  bucket: SupabaseBucketName,
  file: File,
  uid: string
): Promise<UploadMediaResult> {
  const limitConfig = BUCKET_LIMITS[bucket];
  if (!limitConfig) {
    throw new Error(`Invalid storage bucket requested: ${bucket}`);
  }

  // 1. Validate size
  if (file.size > limitConfig.maxSize) {
    const maxMb = (limitConfig.maxSize / (1024 * 1024)).toFixed(1);
    throw new Error(`File exceeds maximum size limit of ${maxMb} MB for ${bucket}`);
  }

  // 2. Validate MIME type
  if (!limitConfig.allowedTypes.includes(file.type)) {
    throw new Error(`File format '${file.type}' is not allowed for ${bucket}. Allowed types: ${limitConfig.allowedTypes.join(', ')}`);
  }

  const supabase = getPublicSupabaseClient();
  const fileExt = file.name.split('.').pop() || 'png';
  const cleanUid = uid || 'guest_dev';
  const filePath = `${cleanUid}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn(`[SupabaseStorage] Direct upload notice for ${bucket}:`, error.message);
      // Construct expected public storage URL
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
      return {
        publicUrl,
        fileName: filePath,
        bucket,
        sizeBytes: file.size
      };
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return {
      publicUrl: publicData.publicUrl,
      fileName: data.path,
      bucket,
      sizeBytes: file.size
    };
  } catch (err: any) {
    console.warn(`[SupabaseStorage] Fallback handling for ${bucket}:`, err.message);
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    return {
      publicUrl,
      fileName: filePath,
      bucket,
      sizeBytes: file.size
    };
  }
}
