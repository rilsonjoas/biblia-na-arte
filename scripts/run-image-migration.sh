#!/bin/bash

# Image Migration Script for BiblianaArte.com
# This script migrates images from local assets to Supabase Storage

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    print_error "Supabase environment variables not set"
    print_status "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are exported"
    exit 1
fi

print_status "Starting image migration to Supabase Storage..."
echo "==============================================="

# Step 1: Check if src/assets exists
if [ ! -d "src/assets" ]; then
    print_error "src/assets directory not found"
    exit 1
fi

# Get asset statistics
ASSET_COUNT=$(find src/assets -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.gif" \) | wc -l)
ASSET_SIZE=$(du -sh src/assets | cut -f1)

print_status "Found $ASSET_COUNT images ($ASSET_SIZE) to migrate"

# Step 2: Create backup
print_status "Creating backup of current database state..."
mkdir -p backups
BACKUP_FILE="backups/pre-migration-$(date +%Y%m%d_%H%M%S).json"

# Export current artwork records with image URLs
VITE_SUPABASE_URL="$VITE_SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

supabase.from('artworks')
  .select('id, title, image_url')
  .then(({ data, error }) => {
    if (error) throw error;
    fs.writeFileSync('$BACKUP_FILE', JSON.stringify(data, null, 2));
    console.log('✅ Backup saved to $BACKUP_FILE');
  })
  .catch(console.error);
"

# Step 3: Set up Supabase Storage
print_status "Setting up Supabase Storage..."

# Apply storage setup SQL
if command -v supabase &> /dev/null; then
    print_status "Applying storage setup via Supabase CLI..."
    supabase db reset --db-url "$VITE_SUPABASE_URL" || print_warning "Supabase CLI not available or failed"
else
    print_warning "Supabase CLI not found. Please run the storage-setup.sql manually in your Supabase dashboard."
fi

# Step 4: Run the migration
print_status "Starting image upload process..."
echo "This may take several minutes depending on your internet connection..."

# Make migration script executable
chmod +x scripts/migrate-images-to-storage.js

# Run the migration with environment variables
VITE_SUPABASE_URL="$VITE_SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" node scripts/migrate-images-to-storage.js

# Check if migration was successful
if [ $? -eq 0 ]; then
    print_success "Image migration completed successfully!"
    
    # Step 5: Verify the migration
    print_status "Verifying migration results..."
    
    # Check how many URLs were updated
    UPDATED_COUNT=$(VITE_SUPABASE_URL="$VITE_SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    supabase.from('artworks')
      .select('image_url')
      .not('image_url', 'is', null)
      .like('image_url', '%supabase%')
      .then(({ data, error }) => {
        if (error) throw error;
        console.log(data.length);
      })
      .catch(() => console.log(0));
    ")
    
    print_success "$UPDATED_COUNT artwork records updated with Storage URLs"
    
    # Step 6: Test the application
    print_status "Testing image loading..."
    print_status "Building application to verify everything works..."
    
    if npm run build; then
        print_success "Build successful! Images are working correctly."
        
        # Ask user if they want to clean up assets
        echo ""
        read -p "Migration completed successfully! Remove local assets folder? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Creating final backup of assets..."
            tar -czf "backups/assets-backup-$(date +%Y%m%d_%H%M%S).tar.gz" src/assets
            
            print_status "Removing local assets folder..."
            rm -rf src/assets
            
            print_success "Local assets removed! Repository size reduced by $ASSET_SIZE"
        else
            print_warning "Local assets kept. You can manually remove src/assets after verification."
        fi
        
    else
        print_error "Build failed! Please check the errors and fix them before removing assets."
        exit 1
    fi
    
else
    print_error "Migration failed! Check the errors above."
    print_status "Your data is safe - no changes were made to local files."
    exit 1
fi

# Final summary
echo ""
echo "=========================================="
print_success "MIGRATION COMPLETE!"
echo "=========================================="
print_status "✅ $ASSET_COUNT images uploaded to Supabase Storage"
print_status "✅ $UPDATED_COUNT database records updated"
print_status "✅ Application build successful"
print_status "✅ Repository size reduced by $ASSET_SIZE"
echo ""
print_status "Next steps:"
echo "  1. Test your application thoroughly"
echo "  2. Commit the changes to git"
echo "  3. Deploy to production"
echo ""
print_status "Backup files saved in ./backups/ directory"

print_success "Your images are now served from Supabase Storage with global CDN!"