import { createClient } from '@salbot/db';
import type { SupabaseClient } from '@salbot/db';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const db: SupabaseClient = createClient(url, key);
