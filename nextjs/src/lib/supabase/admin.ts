import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types'

/**
 * Creates a Supabase admin client with secret key
 * This client bypasses RLS and should only be used in server-side code
 * for administrative operations like inviting users
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.PRIVATE_SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase URL or Secret Key')
  }

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

