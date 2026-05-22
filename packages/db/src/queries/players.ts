import type { SupabaseClient } from '@supabase/supabase-js';

const PLAYER_FIELDS = 'id, discord_username, ign, display_alias, org_id, is_captain, division_id';

export async function getCaptainByDiscordId(db: SupabaseClient, discordId: string) {
  const { data, error } = await db
    .from('players')
    .select(PLAYER_FIELDS)
    .eq('discord_id', discordId)
    .eq('is_captain', true)
    .single();

  if (error) return null;
  return data;
}

export async function getPlayerByDiscordId(db: SupabaseClient, discordId: string) {
  const { data, error } = await db
    .from('players')
    .select(PLAYER_FIELDS)
    .eq('discord_id', discordId)
    .single();

  if (error) return null;
  return data;
}

export async function updatePlayerIgnAndAlias(
  db: SupabaseClient,
  playerId: string,
  newIgn: string
) {
  const { error } = await db
    .from('players')
    .update({ ign: newIgn, display_alias: newIgn })
    .eq('id', playerId);

  if (error) throw error;
}
