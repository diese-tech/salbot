# Database Schema

Supabase is the source of truth. All entities, relationships, and lifecycle state live here.

This document describes the intended schema. Actual migrations live in [`database/migrations/`](../../database/migrations/).

---

## Naming Conventions

- Table names: `snake_case`, plural (`matches`, `pending_actions`)
- Column names: `snake_case`
- Foreign key columns: `{entity}_id` (e.g., `team_id`, `division_id`)
- Timestamp columns: `created_at`, `updated_at`, `completed_at`, `approved_at`
- Boolean columns: `is_{state}` (e.g., `is_active`)
- Status columns: `status` with constrained enum values
- JSON payload columns: `{name}_json` (e.g., `payload_json`, `old_value_json`)

---

## Core Tables

### `divisions`

Top-level league grouping. All other entities are scoped to a division.

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL                    -- "Gold", "Silver", "Bronze"
slug          text NOT NULL UNIQUE             -- "gold", "silver"
season        text NOT NULL                    -- "2025-spring"
is_active     boolean NOT NULL DEFAULT true
discord_results_channel_id  text              -- #match-results-{slug}
discord_reschedules_channel_id text           -- #reschedules-{slug}
created_at    timestamptz NOT NULL DEFAULT now()
```

### `teams`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
division_id   uuid NOT NULL REFERENCES divisions(id)
name          text NOT NULL
slug          text NOT NULL
is_active     boolean NOT NULL DEFAULT true
created_at    timestamptz NOT NULL DEFAULT now()
```

### `players`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
discord_id    text NOT NULL UNIQUE
display_name  text NOT NULL
team_id       uuid REFERENCES teams(id)         -- null = free agent
is_captain    boolean NOT NULL DEFAULT false
is_active     boolean NOT NULL DEFAULT true
created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()
```

### `matches`

The central entity. Every result, reschedule, and stat record links to a match.

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
external_id           text UNIQUE                  -- e.g., "sal-w3-gold-004"
division_id           uuid NOT NULL REFERENCES divisions(id)
week                  integer NOT NULL
team_a_id             uuid NOT NULL REFERENCES teams(id)
team_b_id             uuid NOT NULL REFERENCES teams(id)
scheduled_at          timestamptz NOT NULL
status                text NOT NULL DEFAULT 'scheduled'
  -- scheduled | completed | forfeited | cancelled | pending_result
winner_team_id        uuid REFERENCES teams(id)
score                 text                          -- "2-1"
completed_at          timestamptz
proof_thread_id       text                          -- Discord thread ID
proof_thread_url      text
screenshot_count      integer NOT NULL DEFAULT 0
screenshot_expected   integer                       -- computed from score
created_at            timestamptz NOT NULL DEFAULT now()
updated_at            timestamptz NOT NULL DEFAULT now()
```

### `pending_actions`

The approval queue. Every actionable captain command creates one. No mutation happens without a pending_action.

```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
type                      text NOT NULL
  -- match_result | reschedule | admin_review
status                    text NOT NULL DEFAULT 'pending'
  -- pending | pending_info | approved | denied | cancelled
requested_by_discord_id   text NOT NULL
match_id                  uuid REFERENCES matches(id)
division_id               uuid REFERENCES divisions(id)
payload_json              jsonb NOT NULL DEFAULT '{}'
admin_note                text
source_discord_message_url text
admin_review_message_id   text                       -- Discord message ID of review card
public_receipt_message_id text                       -- Discord message ID of public post
approved_by_discord_id    text
approved_at               timestamptz
created_at                timestamptz NOT NULL DEFAULT now()
updated_at                timestamptz NOT NULL DEFAULT now()
```

### `audit_logs`

Immutable. Written on every mutation. Never updated, never deleted.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
action_type         text NOT NULL
  -- pending_action_created | pending_action_approved | pending_action_denied
  -- match_result_recorded | match_rescheduled | stat_approved | stat_rejected
  -- admin_override | player_linked | player_unlinked
entity_type         text NOT NULL       -- "match" | "pending_action" | "player_stat"
entity_id           uuid NOT NULL
pending_action_id   uuid REFERENCES pending_actions(id)
actor_discord_id    text NOT NULL
old_value_json      jsonb
new_value_json      jsonb
note                text
created_at          timestamptz NOT NULL DEFAULT now()
```

### `pending_stat_records`

ForgeLens output. One record per player per screenshot set. Admin reviews before writing to `player_stats`.

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
match_id          uuid NOT NULL REFERENCES matches(id)
player_id         uuid REFERENCES players(id)      -- null = player not yet linked
screenshot_url    text NOT NULL
extracted_json    jsonb NOT NULL                    -- raw OCR output
stats_json        jsonb                             -- parsed stats
confidence        numeric(4,3) NOT NULL             -- 0.000 – 1.000
status            text NOT NULL DEFAULT 'pending'
  -- pending | approved | rejected | corrected
reviewed_by_discord_id  text
reviewed_at       timestamptz
correction_note   text
created_at        timestamptz NOT NULL DEFAULT now()
updated_at        timestamptz NOT NULL DEFAULT now()
```

### `player_stats`

Official stats. Written only after admin approval of a `pending_stat_record`.

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
match_id              uuid NOT NULL REFERENCES matches(id)
player_id             uuid NOT NULL REFERENCES players(id)
pending_stat_record_id uuid REFERENCES pending_stat_records(id)
kills                 integer
deaths                integer
assists               integer
damage_dealt          integer
healing_done          integer
god_played            text
role                  text
created_at            timestamptz NOT NULL DEFAULT now()
```

---

## Relationship Summary

```
divisions
  └── teams
        └── players
  └── matches
        ├── pending_actions
        ├── pending_stat_records → player_stats
        └── [proof_thread references]

audit_logs → (entity_type, entity_id) polymorphic
           → pending_actions
```

---

## Mutation Patterns

See [`mutation-patterns.md`](mutation-patterns.md) for the full contract on how mutations are executed.

Key rules:
1. Every mutation to `matches`, `player_stats`, or `standings` requires a prior `pending_action`.
2. Every mutation writes a corresponding `audit_log` entry.
3. `audit_logs` are INSERT-only. No UPDATE, no DELETE.
4. `pending_stat_records` are never directly promoted. They are reviewed, then a new `player_stats` row is written.
