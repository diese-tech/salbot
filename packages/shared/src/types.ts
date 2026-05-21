export type PendingActionType = 'match_result' | 'reschedule' | 'admin_review' | 'alias_change';

export type PendingActionStatus =
  | 'pending'
  | 'pending_info'
  | 'approved'
  | 'denied'
  | 'cancelled';

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'postponed';

export type AuditActionType =
  | 'pending_action_created'
  | 'pending_action_approved'
  | 'pending_action_denied'
  | 'pending_action_needs_info'
  | 'pending_action_cancelled'
  | 'match_result_recorded'
  | 'match_rescheduled'
  | 'stat_approved'
  | 'stat_rejected'
  | 'stat_corrected'
  | 'ign_updated'
  | 'admin_override';

export type StatRecordStatus = 'pending' | 'approved' | 'rejected' | 'corrected' | 'superseded';

export interface ParsedScore {
  winnerGames: number;
  loserGames: number;
  gamesPlayed: number;
  expectedScreenshots: number;
}

export interface MatchResultPayload {
  winnerOrgId: string;
  score: string;
  parsed: ParsedScore;
}

export interface ReschedulePayload {
  newScheduledAt: string;
  reason?: string;
}

export interface AliasChangePayload {
  targetPlayerId: string;
  oldIgn: string;
  newIgn: string;
  proofScreenshotUrl: string;
}
