import type { SupabaseClient } from '@supabase/supabase-js';

export async function getEligibleMatchesForCaptain(db: SupabaseClient, teamId: string) {
  const { data, error } = await db
    .from('matches')
    .select(`
      id, external_id, week, scheduled_at, status,
      team_a:teams!team_a_id(id, name),
      team_b:teams!team_b_id(id, name),
      division:divisions(id, name, slug)
    `)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at');

  if (error) return [];
  return data ?? [];
}
