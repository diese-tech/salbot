import { createClient as supabaseCreateClient, type SupabaseClient } from '@supabase/supabase-js';

export function createClient(url: string, key: string): SupabaseClient {
  return supabaseCreateClient(url, key);
}
