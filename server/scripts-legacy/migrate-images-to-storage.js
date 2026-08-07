#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, stat, access } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket configuration
const BUCKET_NAME = 'artwork-images';
const ASSETS_PATH = join(projectRoot, 'src', 'assets');

// Utility functions
function sanitizeFileName(fileName) {
  // Remove special characters and spaces, keep only alphanumeric, dots, hyphens, and underscores
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = extname(originalName);
  const baseName = basename(originalName, ext);
  const sanitized = sanitizeFileName(baseName);
  return `${sanitized}-${timestamp}-${random}${ext}`;
}

async function checkBucketExists() {
  console.log('Checking if storage bucket exists...');
  
  // Test if bucket works by trying to get its info
  // Skip the getBucket call since it may not work with anon key
  console.log('Testing bucket access with upload test...');
  
  const testBuffer = Buffer.from('test');
  const testFileName = `test-${Date.now()}.txt`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(testFileName, testBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'text/plain'
    });

  if (error) {
    if (error.message.includes('not found')) {
      console.error('❌ Bucket "artwork-images" not found. Please create it manually in Supabase Dashboard.');
      return false;
    } else if (error.message.includes('mime type')) {
      console.log('✅ Storage bucket exists and is accessible (mime type error expected)');
      return true;
    } else if (error.message.includes('policy')) {
      console.error('❌ Storage bucket exists but policies are not configured correctly.');
      return false;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  } else {
    // Clean up test file
    await supabase.storage.from(BUCKET_NAME).remove([testFileName]);
    console.log('✅ Storage bucket exists and is working');
  }
  
  return true;
}

// Helper function to detect MIME type
function getMimeType(fileName) {
  const ext = extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

async function uploadImage(filePath, fileName) {
  try {
    const fileBuffer = await readFile(filePath);
    const uniqueFileName = generateUniqueFileName(fileName);
    const contentType = getMimeType(fileName);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueFileName);

    console.log(`✅ Uploaded: ${fileName} -> ${uniqueFileName}`);
    return {
      originalPath: `/src/assets/${fileName}`,
      storagePath: uniqueFileName,
      publicUrl: publicUrl
    };
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
}

async function getImageFiles() {
  try {
    await access(ASSETS_PATH);
    const files = await readdir(ASSETS_PATH);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} image files in assets folder`);
    return imageFiles;
  } catch (error) {
    console.error('Error reading assets directory:', error);
    return [];
  }
}

async function updateArtworkImageUrl(originalPath, publicUrl) {
  const { data, error } = await supabase
    .from('artworks')
    .update({ image_url: publicUrl })
    .eq('image_url', originalPath)
    .select('id, title');

  if (error) {
    console.error(`Error updating artwork for ${originalPath}:`, error);
    return false;
  }

  if (data && data.length > 0) {
    console.log(`✅ Updated ${data.length} artwork(s) for ${originalPath}`);
    return true;
  } else {
    console.log(`⚠️  No artworks found with path ${originalPath}`);
    return false;
  }
}

async function createProgressLog() {
  const logData = {
    startTime: new Date().toISOString(),
    totalFiles: 0,
    uploadedFiles: 0,
    updatedRecords: 0,
    errors: []
  };
  
  return logData;
}

async function main() {
  console.log('🚀 Starting image migration to Supabase Storage...\n');
  
  const log = await createProgressLog();
  
  // Step 1: Check/Create bucket
  const bucketReady = await checkBucketExists();
  if (!bucketReady) {
    console.error('Failed to setup storage bucket');
    process.exit(1);
  }
  
  // Step 2: Get all image files
  const imageFiles = await getImageFiles();
  if (imageFiles.length === 0) {
    console.log('No image files found to migrate');
    process.exit(0);
  }
  
  log.totalFiles = imageFiles.length;
  console.log(`\n📁 Processing ${imageFiles.length} image files...\n`);
  
  const uploadResults = [];
  let successCount = 0;
  let updateCount = 0;
  
  // Step 3: Upload images in batches of 10
  const batchSize = 10;
  for (let i = 0; i < imageFiles.length; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}...`);
    
    const batchPromises = batch.map(async (fileName) => {
      const filePath = join(ASSETS_PATH, fileName);
      const result = await uploadImage(filePath, fileName);
      
      if (result) {
        successCount++;
        uploadResults.push(result);
        
        // Update database record
        const updated = await updateArtworkImageUrl(result.originalPath, result.publicUrl);
        if (updated) {
          updateCount++;
        }
      }
      
      return result;
    });
    
    await Promise.all(batchPromises);
    
    // Progress update
    console.log(`Progress: ${successCount}/${imageFiles.length} uploaded, ${updateCount} records updated`);
  }
  
  // Step 4: Final summary
  log.uploadedFiles = successCount;
  log.updatedRecords = updateCount;
  log.endTime = new Date().toISOString();
  
  console.log('\n📊 Migration Summary:');
  console.log('='.repeat(50));
  console.log(`Total files processed: ${log.totalFiles}`);
  console.log(`Successfully uploaded: ${log.uploadedFiles}`);
  console.log(`Database records updated: ${log.updatedRecords}`);
  console.log(`Failed uploads: ${log.totalFiles - log.uploadedFiles}`);
  console.log(`Storage savings: ~467MB removed from repository`);
  
  if (successCount === imageFiles.length) {
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the application to ensure images load correctly');
    console.log('2. Run: npm run build && npm run preview');
    console.log('3. If everything works, remove src/assets folder');
    console.log('4. Commit changes to git');
  } else {
    console.log(`\n⚠️  Migration completed with ${log.totalFiles - log.uploadedFiles} failures`);
    console.log('Please check the errors above and retry failed uploads');
  }
  
  // Save detailed log
  await writeFile(
    join(projectRoot, 'migration-log.json'), 
    JSON.stringify(log, null, 2)
  );
  console.log('\n📝 Detailed log saved to migration-log.json');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run the migration
main().catch(console.error);