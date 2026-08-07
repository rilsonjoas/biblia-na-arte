import { createClient } from '@supabase/supabase-js'
import type { Database } from './types-supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'biblianaarte-web',
    },
  },
})

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST116') {
    return 'Nenhum resultado encontrado'
  }
  
  if (error?.code === 'PGRST301') {
    return 'Erro de permissão'
  }
  
  return error?.message || 'Erro desconhecido do banco de dados'
}

// Test connection function
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('artworks')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.error('Connection test error:', error)
    return false
  }
}