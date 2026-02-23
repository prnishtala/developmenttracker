import { createClient } from '@supabase/supabase-js';
import { validateEnv } from '@/lib/env';

validateEnv();

export function getServiceSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
