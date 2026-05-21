import type { SupabaseClient } from '@supabase/supabase-js';

export async function getEligibleMatchesForCaptain(db: SupabaseClient, orgId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await db
    .from('matches')
    .select(`
      id, week, scheduled_date, scheduled_time, status,
      home_org:orgs!home_org_id(id, name, tag),
      away_org:orgs!away_org_id(id, name, tag),
      division:divisions(id, name)
    `)
    .or(`home_org_id.eq.${orgId},away_org_id.eq.${orgId}`)
    .eq('status', 'scheduled')
    .gte('scheduled_date', today)
    .order('scheduled_date')
    .order('scheduled_time');

  if (error) return [];
  return data ?? [];
}
