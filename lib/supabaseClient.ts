import { createClient } from '@supabase/supabase-js'

// Type-safe env vars (no hardcoded values)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Ensure environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
