import { supabase } from './supabase';

// Storage configuration
export const STORAGE_BUCKET = 'artwork-images';

/**
 * Upload an image to Supabase Storage
 * @param file - File object to upload
 * @param fileName - Optional custom file name
 * @returns Promise with upload result and public URL
 */
export async function uploadImageToStorage(
  file: File, 
  fileName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate a unique file name if not provided
    const uniqueFileName = fileName || generateUniqueFileName(file.name);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uniqueFileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param filePath - Path of the file in storage
 * @returns Promise with deletion result
 */
export async function deleteImageFromStorage(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get public URL for a storage file
 * @param filePath - Path of the file in storage
 * @returns Public URL string
 */
export function getStorageUrl(filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  
  return publicUrl;
}

/**
 * Extract file path from a storage URL
 * @param url - Full storage URL
 * @returns File path or null if not a storage URL
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const storagePattern = new RegExp(`/storage/v1/object/public/${STORAGE_BUCKET}/(.+)`);
    const match = url.match(storagePattern);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique file name for storage
 * @param originalName - Original file name
 * @returns Unique file name
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const baseName = originalName.split('.').slice(0, -1).join('.')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${baseName}-${timestamp}-${random}${extension ? '.' + extension : ''}`;
}

/**
 * Validate if file is an allowed image type
 * @param file - File to validate
 * @returns Boolean indicating if file is valid
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Arquivo muito grande. Máximo de 50MB permitido.' 
    };
  }
  
  return { valid: true };
}

/**
 * Get storage statistics
 * @returns Promise with storage usage stats
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSizeMB: number;
  success: boolean;
  error?: string;
}> {
  try {
    // This would require a custom function in Supabase
    // For now, we'll return a placeholder
    const { data, error } = await supabase
      .from('storage_stats')
      .select('*')
      .single();

    if (error && !error.message.includes('does not exist')) {
      return { 
        success: false, 
        error: error.message,
        totalFiles: 0,
        totalSizeMB: 0
      };
    }

    return {
      success: true,
      totalFiles: data?.total_files || 0,
      totalSizeMB: data?.total_size_mb || 0
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalFiles: 0,
      totalSizeMB: 0
    };
  }
}

/**
 * Check if an image URL is from Supabase Storage
 * @param url - Image URL to check
 * @returns Boolean indicating if URL is from storage
 */
export function isStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
}

/**
 * Check if an image URL is a local asset
 * @param url - Image URL to check
 * @returns Boolean indicating if URL is a local asset
 */
export function isLocalAsset(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/src/assets/');
}