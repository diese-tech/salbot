import type { SupabaseClient } from '@supabase/supabase-js';

export async function getCaptainByDiscordId(db: SupabaseClient, discordId: string) {
  const { data, error } = await db
    .from('players')
    .select('id, discord_username, ign, org_id, is_captain, division_id')
    .eq('discord_id', discordId)
    .eq('is_captain', true)
    .single();

  if (error) return null;
  return data;
}
