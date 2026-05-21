# ADR-005: All Approvals Route Through pending_actions

**Status:** Accepted
**Date:** 2025-01-01
**Deciders:** Platform architecture

---

## Context

The platform supports multiple workflow types: match result reporting, reschedule requests, admin review escalations. Each could have its own approval mechanism (separate Discord channels, separate button handlers, separate status tracking).

---

## Decision

All workflows that require admin approval create a `pending_actions` record. The approval pipeline is shared infrastructure — not duplicated per workflow type.

---

## Rationale

- **Unified review surface** — admins have one `#admin-review` channel and one admin queue in the website. They do not need to monitor multiple channels or pipelines.
- **Consistent audit trail** — every approval goes through the same state machine: `pending → approved/denied`. The audit log pattern is identical for all types.
- **Single approval handler** — the button interaction handler dispatches on `pending_action.type`. Adding a new workflow requires a new type handler, not a new approval system.
- **Race condition protection** — the stale approval check (`WHERE status = 'pending'`) works the same for all types.
- **Queue visibility** — the website admin queue can show all pending actions regardless of type, sortable by priority, age, or division.
- **Cancellation** — if a captain needs to withdraw a pending submission, one cancellation path works for all types.

---

## Consequences

### Positive

- One approval system to maintain and test
- Unified admin queue experience
- New workflows are additive, not architectural
- Consistent audit trail across all workflow types

### Negative

- `pending_actions.payload_json` must accommodate varied shapes for different action types; this requires discipline in payload documentation
- Type-specific validation must be handled in the type-specific handler, not in shared infrastructure

### Risks

- If the core approval infrastructure has a bug, it affects all workflows simultaneously (mitigated by comprehensive testing of the approval pipeline)
- `payload_json` schema drift across types (mitigated by documenting expected payload shapes per type and validating with TypeScript types)

---

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| Separate table per action type | Duplicates infrastructure; admin must monitor multiple sources |
| Inline approvals (no pending record) | No audit trail; no idempotency protection; no stale check |
| External workflow system (e.g., Linear, Jira) | Overkill; outside Discord/Supabase stack; high friction for admins |
