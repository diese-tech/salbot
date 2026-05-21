import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendingActionType } from '@salbot/shared';

export async function createPendingAction(
  db: SupabaseClient,
  params: {
    type: PendingActionType;
    requestedByDiscordId: string;
    matchId?: string;
    divisionId?: string;
    payloadJson: Record<string, unknown>;
  }
) {
  const { data, error } = await db
    .from('pending_actions')
    .insert({
      type: params.type,
      requested_by_discord_id: params.requestedByDiscordId,
      match_id: params.matchId ?? null,
      division_id: params.divisionId ?? null,
      payload_json: params.payloadJson,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingAction(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('pending_actions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function claimPendingActionForApproval(
  db: SupabaseClient,
  id: string,
  adminDiscordId: string
): Promise<boolean> {
  // Atomic claim: only succeeds if status is still 'pending'
  const { count } = await db
    .from('pending_actions')
    .update({
      status: 'approved',
      approved_by_discord_id: adminDiscordId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select();

  return (count ?? 0) > 0;
}
