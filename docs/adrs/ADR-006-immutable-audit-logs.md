# ADR-006: audit_logs Are Immutable and Append-Only

**Status:** Accepted
**Date:** 2025-01-01
**Deciders:** Platform architecture

---

## Context

The platform makes state-changing decisions that affect league standings and prizing. These decisions must be traceable and defensible. The question is whether the audit log should be editable (for corrections) or immutable.

---

## Decision

`audit_logs` rows are INSERT-only. No UPDATE. No DELETE. Corrections or reversals are new entries, not modifications of old ones.

---

## Rationale

- **Non-repudiation** — an immutable log cannot be silently edited to cover mistakes or disputes. Every action is permanently on record.
- **Compliance** — Hi-Rez prizing verification may require demonstrating the sequence of events. An editable log could theoretically be manipulated; an immutable log cannot.
- **Forensic value** — if a dispute arises, the full sequence of events is available: original action, any corrections, admin override, final state. An editable log would lose intermediate states.
- **Simplicity** — append-only logs are simpler to reason about. There are no UPDATE paths to test, no concurrency issues around simultaneous edits.
- **Correction model** — the correct way to handle a bad action is to take a corrective action and log that too. This is more informative than erasing history.

---

## Consequences

### Positive

- Complete, tamper-evident history for any entity
- Prizing disputes can be answered with a full timeline
- No risk of history being accidentally or maliciously erased
- Correction actions are themselves visible in the log

### Negative

- Log size grows indefinitely (mitigated by PostgreSQL partitioning or archival policy)
- "Cleaning up" test data in development requires truncating `audit_logs` explicitly (acceptable in dev)
- Mistakes are permanently visible, which may feel uncomfortable for admins initially

### Risks

- Log growth becomes a storage concern over multiple seasons (mitigated by archival policy: move logs older than N seasons to cold storage)
- Developers tempted to DELETE log entries for cleanup in staging must be clearly directed not to do this in production

---

## Enforcement

The following Supabase RLS policy should be applied to `audit_logs`:

```sql
-- Allow inserts from service role only
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO service_role WITH CHECK (true);

-- No updates allowed from any role
CREATE POLICY "audit_logs_no_update" ON audit_logs
  FOR UPDATE USING (false);

-- No deletes allowed from any role
CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE USING (false);
```

This enforces immutability at the database level, not just by convention.

---

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| Editable audit log | Destroys non-repudiation; compliance risk |
| Soft deletes | Still modifies records; complicates queries |
| External append-only log (e.g., S3) | Splits audit surface; harder to query |
| No audit log | Unacceptable for compliance and dispute resolution |
