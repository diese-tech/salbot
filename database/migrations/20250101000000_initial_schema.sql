-- Initial schema for SAL operations platform
-- See docs/database/schema.md for full documentation

-- Divisions (top-level league grouping)
CREATE TABLE divisions (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                            text NOT NULL,
  slug                            text NOT NULL UNIQUE,
  season                          text NOT NULL,
  is_active                       boolean NOT NULL DEFAULT true,
  discord_results_channel_id      text,
  discord_reschedules_channel_id  text,
  created_at                      timestamptz NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES divisions(id),
  name        text NOT NULL,
  slug        text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(division_id, slug)
);

-- Players
CREATE TABLE players (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id   text NOT NULL UNIQUE,
  display_name text NOT NULL,
  team_id      uuid REFERENCES teams(id),
  is_captain   boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Matches
CREATE TABLE matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id         text UNIQUE,
  division_id         uuid NOT NULL REFERENCES divisions(id),
  week                integer NOT NULL,
  team_a_id           uuid NOT NULL REFERENCES teams(id),
  team_b_id           uuid NOT NULL REFERENCES teams(id),
  scheduled_at        timestamptz NOT NULL,
  status              text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'forfeited', 'cancelled', 'pending_result')),
  winner_team_id      uuid REFERENCES teams(id),
  score               text,
  completed_at        timestamptz,
  proof_thread_id     text,
  proof_thread_url    text,
  screenshot_count    integer NOT NULL DEFAULT 0,
  screenshot_expected integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (team_a_id <> team_b_id)
);

-- Pending actions (approval queue)
CREATE TABLE pending_actions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                      text NOT NULL
    CHECK (type IN ('match_result', 'reschedule', 'admin_review')),
  status                    text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'pending_info', 'approved', 'denied', 'cancelled')),
  requested_by_discord_id   text NOT NULL,
  match_id                  uuid REFERENCES matches(id),
  division_id               uuid REFERENCES divisions(id),
  payload_json              jsonb NOT NULL DEFAULT '{}',
  admin_note                text,
  source_discord_message_url text,
  admin_review_message_id   text,
  public_receipt_message_id text,
  approved_by_discord_id    text,
  approved_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Audit logs (immutable, append-only)
CREATE TABLE audit_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type       text NOT NULL,
  entity_type       text NOT NULL,
  entity_id         uuid NOT NULL,
  pending_action_id uuid REFERENCES pending_actions(id),
  actor_discord_id  text NOT NULL,
  old_value_json    jsonb,
  new_value_json    jsonb,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Pending stat records (ForgeLens output — NOT official stats)
CREATE TABLE pending_stat_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id                uuid NOT NULL REFERENCES matches(id),
  player_id               uuid REFERENCES players(id),
  screenshot_url          text NOT NULL,
  extracted_json          jsonb NOT NULL DEFAULT '{}',
  stats_json              jsonb,
  confidence              numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source                  text NOT NULL DEFAULT 'ocr'
    CHECK (source IN ('ocr', 'manual')),
  status                  text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'corrected', 'superseded')),
  reviewed_by_discord_id  text,
  reviewed_at             timestamptz,
  correction_note         text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Official player stats (written only after admin approval)
CREATE TABLE player_stats (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id               uuid NOT NULL REFERENCES matches(id),
  player_id              uuid NOT NULL REFERENCES players(id),
  pending_stat_record_id uuid REFERENCES pending_stat_records(id),
  kills                  integer,
  deaths                 integer,
  assists                integer,
  damage_dealt           integer,
  healing_done           integer,
  god_played             text,
  role                   text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Indexes
CREATE INDEX idx_matches_division_id ON matches(division_id);
CREATE INDEX idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX idx_matches_team_b_id ON matches(team_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_pending_actions_match_id ON pending_actions(match_id);
CREATE INDEX idx_pending_actions_status ON pending_actions(status);
CREATE INDEX idx_pending_actions_type ON pending_actions(type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_pending_action_id ON audit_logs(pending_action_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_discord_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_pending_stat_records_match_id ON pending_stat_records(match_id);
CREATE INDEX idx_pending_stat_records_status ON pending_stat_records(status);
CREATE INDEX idx_player_stats_match_id ON player_stats(match_id);
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
