import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

export function createClient(url: string, key: string) {
  return supabaseCreateClient(url, key);
}
