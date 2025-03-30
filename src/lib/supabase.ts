import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
async function checkSupabaseConnection() {
  try {
    // Use a more generic approach to check connection
    const { error } = await supabase.auth.getSession()
    if (error) {
      console.error('Supabase connection error:', error.message)
    } else {
      console.log('Supabase connection successful!') 
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
  }
} 
checkSupabaseConnection()


