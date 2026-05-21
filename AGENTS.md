# AGENTS.md — SAL Operations Platform

This file defines the rules for AI-assisted implementation on this project.

Read this before implementing anything.

---

## What This Project Is

A competition operations platform for the SAL league.

It is NOT a Discord bot project.

The Discord bot is one component of four. The system's job is:

- structured match result intake
- admin approval pipelines
- compliance-grade evidence collection
- OCR-assisted stat extraction
- audit-logged state management

---

## What Supabase Owns

Supabase is the single source of truth.

Supabase owns:
- match records and lifecycle
- schedules and standings
- player/team relationships
- pending actions
- audit logs
- evidence references
- stat records

Discord is a display and intake surface only.

Do not treat Discord message history as a data store.

---

## Architecture Rules

### No direct mutations without pending_actions

Every match result, reschedule, or stat change must:

1. Create a `pending_action` record
2. Go through admin review
3. Execute the mutation on approval
4. Write to `audit_logs`

There is no shortcut path.

### No silent mutations

Every state change to `matches`, `player_stats`, or `standings` must write an `audit_logs` entry with:
- `actor_discord_id`
- `old_value_json`
- `new_value_json`

### audit_logs are immutable

Never UPDATE or DELETE `audit_logs` rows.

Corrections are new rows, not edits.

### OCR never auto-approves

ForgeLens creates `pending_stat_records`.

It does NOT write to `player_stats` directly.

Every stat record requires admin approval.

---

## Command Rules

Slash commands are the official workflow.

Message scanning is a fallback only.

Scanning must NEVER autonomously create a `pending_action` without human confirmation.

---

## Match Selection

Captains do not type team names.

Bot resolves:
1. Discord user ID → player record
2. player record → team
3. team → eligible matches from Supabase dropdown

Always use the dropdown pattern. Never ask captains to type team names.

---

## Implementation Constraints

Do NOT:
- Add features beyond what the current phase requires
- Introduce in-memory state as a substitute for Supabase reads
- Skip `audit_logs` on any mutation to match-related tables
- Allow ForgeLens to write directly to `player_stats`
- Create duplicate approval systems — use `pending_actions`
- Add error handling for scenarios that cannot happen
- Write clever abstractions without clear justification

DO:
- Write to `audit_logs` on every state mutation
- Route all approvals through `pending_actions`
- Use Supabase dropdowns for match selection
- Keep command handlers thin — business logic belongs in `packages/shared` or service functions
- Protect against double-approval race conditions on pending actions

---

## Current Phase

**Phase 0 — Scaffold complete.**

Next: **Phase 1 — `/report-result` + approval pipeline end-to-end.**

See `ROADMAP.md` for phase definitions.

See `MVP.md` for scope boundaries.

---

## Before Implementing Any New Feature

1. Is it in the current phase scope? If not, stop.
2. Does it mutate match state? If yes, does it go through `pending_actions`?
3. Does it write to `audit_logs`?
4. Does it add an approval handler if it adds a new `pending_action` type?
5. Is the captain workflow using the dropdown pattern?

If any answer is wrong, fix it before merging.

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/architecture/overview.md` | System design |
| `docs/architecture/platform-split.md` | Component boundaries |
| `docs/database/schema.md` | Table definitions |
| `docs/database/mutation-patterns.md` | How state changes |
| `docs/workflows/approval-pipeline.md` | Approval infrastructure |
| `docs/adrs/` | Why the system looks this way |
| `docs/AI_WORKFLOW_GUARDRAILS.md` | Implementation safety rules |

---

## Queries Go Through packages/db

Do not write raw Supabase queries inline in command handlers.

All Supabase interactions belong in `packages/db/src/queries/`.

This prevents ad-hoc mutations scattered across the codebase.
