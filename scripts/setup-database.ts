#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🏗️  Setting up Supabase database...')
  
  try {
    // Read the schema file
    const schemaPath = join(process.cwd(), 'supabase', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    console.log('📖 Reading schema from supabase/schema.sql...')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`   Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.warn(`   ⚠️  Warning for statement ${i + 1}: ${error.message}`)
          // Continue with other statements
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err: any) {
        console.warn(`   ⚠️  Error in statement ${i + 1}: ${err.message}`)
        // Continue with other statements
      }
    }
    
    console.log('✅ Database setup completed!')
    console.log('💡 Note: Some warnings are normal if tables already exist.')
    console.log('🚀 You can now run: npm run db:migrate')
    
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n💡 Alternative setup method:')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase/schema.sql')
    console.log('4. Execute the SQL')
    console.log('5. Then run: npm run db:migrate')
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
}

export { setupDatabase }