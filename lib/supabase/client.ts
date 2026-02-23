import { createClient } from '@supabase/supabase-js';
import { validateEnv } from '@/lib/env';

validateEnv();

export function getBrowserSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
}
