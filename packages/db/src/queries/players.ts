import type { SupabaseClient } from '@supabase/supabase-js';

export async function getCaptainByDiscordId(db: SupabaseClient, discordId: string) {
  const { data, error } = await db
    .from('players')
    .select('id, display_name, team_id, is_captain, is_active')
    .eq('discord_id', discordId)
    .eq('is_captain', true)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}
