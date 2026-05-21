# ADR-001: Supabase as the Single Source of Truth

**Status:** Accepted
**Date:** 2025-01-01
**Deciders:** Platform architecture

---

## Context

A league operations platform needs to store matches, schedules, player rosters, standings, and audit history. Two storage candidates exist: Discord (messages, threads, channel state) and a dedicated database.

Early bot implementations often treat Discord as informal storage — reading back channel history, parsing pinned messages, or maintaining state in bot memory. This causes systemic failures: message deletion destroys data, bot restarts lose in-memory state, Discord rate limits make reads unreliable, and there is no structured query surface.

---

## Decision

Supabase (PostgreSQL) is the single source of truth for all platform state.

Discord is a display and intake surface only. Discord posts are receipts, not records.

---

## Rationale

- **Durability** — PostgreSQL with Supabase managed hosting provides guaranteed persistence. Discord message history can be deleted, edited, or pruned.
- **Queryability** — SQL enables structured queries for standings, audit history, match lookup by captain. Discord does not.
- **Recovery** — if the bot restarts, crashes, or is offline for hours, no data is lost. Supabase holds everything. The bot reconnects and resumes.
- **Auditability** — `audit_logs` in Supabase provide immutable history. Discord message edits do not.
- **Compliance** — Hi-Rez prizing verification requires traceable, structured records. Supabase provides this; Discord does not.
- **Multi-service** — both the bot and the website need access to the same state. A shared database is the only sane approach.

---

## Consequences

### Positive

- Full state recovery after any bot outage
- Website panel has direct database access for complex operations
- Audit logs are immutable and structured
- No dependency on Discord message history for operational data

### Negative

- Every operation requires a Supabase round-trip; no in-memory shortcuts
- Bot startup requires a database connection to function
- Schema changes require migrations and coordination

### Risks

- Supabase outage means full system halt (mitigated by Supabase SLA and connection pooling)
- Schema migrations must be carefully managed across bot + website deployments

---

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| Discord as state store | Message history is unreliable, unparseable, rate-limited, and non-queryable |
| Bot in-memory state | Lost on restart; not shared with website; not auditable |
| SQLite/local DB | Not accessible by website; not suitable for multi-service deployment |
| Redis | Appropriate for caching/queues but not authoritative state |
