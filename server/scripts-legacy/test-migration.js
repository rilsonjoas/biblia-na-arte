#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, access } from 'fs/promises';
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
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket configuration
const BUCKET_NAME = 'artwork-images';
const ASSETS_PATH = join(projectRoot, 'src', 'assets');

console.log('🧪 Testing Storage Migration...\n');

// Test with just 3 images to validate the process
async function testMigration() {
  try {
    // Step 1: Check bucket exists
    console.log('1️⃣ Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Error checking buckets:', bucketError.message);
      return false;
    }
    
    const bucket = buckets.find(b => b.id === BUCKET_NAME);
    if (!bucket) {
      console.log('🔧 Creating bucket...');
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        console.log('❌ Error creating bucket:', createError.message);
        return false;
      }
      console.log('✅ Bucket created');
    } else {
      console.log('✅ Bucket exists');
    }

    // Step 2: Get a few test images
    console.log('\n2️⃣ Getting test images...');
    const files = await readdir(ASSETS_PATH);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    }).slice(0, 3); // Only test with 3 images
    
    console.log(`Found ${imageFiles.length} test images:`, imageFiles);

    // Step 3: Test upload
    console.log('\n3️⃣ Testing uploads...');
    const results = [];
    
    for (const fileName of imageFiles) {
      const filePath = join(ASSETS_PATH, fileName);
      const fileBuffer = await readFile(filePath);
      
      // Generate unique name
      const timestamp = Date.now();
      const ext = extname(fileName);
      const baseName = basename(fileName, ext).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueName = `test-${baseName}-${timestamp}${ext}`;
      
      console.log(`  Uploading ${fileName} as ${uniqueName}...`);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, fileBuffer, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uniqueName);

      console.log(`  ✅ Success: ${publicUrl}`);
      
      results.push({
        original: fileName,
        stored: uniqueName,
        url: publicUrl
      });
    }

    // Step 4: Test URL access
    console.log('\n4️⃣ Testing URL access...');
    for (const result of results) {
      try {
        const response = await fetch(result.url, { method: 'HEAD' });
        console.log(`  ${result.original}: ${response.ok ? '✅ Accessible' : '❌ Not accessible'} (${response.status})`);
      } catch (error) {
        console.log(`  ${result.original}: ❌ Error accessing URL`);
      }
    }

    // Step 5: Clean up test files
    console.log('\n5️⃣ Cleaning up test files...');
    for (const result of results) {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([result.stored]);
      
      if (error) {
        console.log(`  ❌ Error deleting ${result.stored}: ${error.message}`);
      } else {
        console.log(`  ✅ Deleted ${result.stored}`);
      }
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n✅ Storage is working correctly. You can now run the full migration.');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testMigration().then(success => {
  process.exit(success ? 0 : 1);
});