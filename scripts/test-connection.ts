#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('🔗 Testing Supabase connection...')
console.log(`📍 URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('artworks').select('count', { count: 'exact', head: true })
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.log('⚠️  Database tables do not exist yet - this is expected!')
        console.log('✅ Connection successful, but schema needs to be created')
        
        console.log('\n🏗️  Next steps:')
        console.log('1. Go to: https://supabase.com/dashboard/projects')
        console.log(`2. Find your project with URL: ${supabaseUrl}`)
        console.log('3. Go to SQL Editor')
        console.log('4. Copy and paste the contents of supabase/schema.sql')
        console.log('5. Execute the SQL')
        console.log('6. Run: npm run db:migrate')
        
      } else {
        console.error('❌ Connection error:', error.message)
        process.exit(1)
      }
    } else {
      console.log(`✅ Connection successful! Found ${data?.length || 0} tables`)
      console.log('🚀 You can run: npm run db:migrate')
    }
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection()
}

export { testConnection }