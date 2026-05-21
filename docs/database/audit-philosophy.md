# Audit Philosophy

The audit log is the most important table in the system. It is the single answer to "what happened, when, and who did it."

---

## Design Principles

### Immutable

`audit_logs` rows are written once and never changed. No UPDATE. No DELETE. If an action was taken and later reversed, the reversal is a new audit log entry — not a modification of the original.

This provides a complete, unalterable history.

### Append-only

New rows are added. Existing rows stay. This means the full history of any entity is always recoverable by querying `WHERE entity_id = $id ORDER BY created_at`.

### Human-attributable

Every entry carries `actor_discord_id`. Every mutation is attributable to a specific person. "The bot approved it" is not a valid audit entry — the bot should carry the admin Discord ID of the person who pressed Approve.

### Before/After diffs

Every mutation records `old_value_json` and `new_value_json`. This makes rollback analysis trivial: you can see exactly what changed and reconstruct the previous state.

### Scope

The audit log covers:

- `pending_action` lifecycle events (created, approved, denied, cancelled)
- Match mutations (result recorded, rescheduled, corrected)
- Stat events (OCR pending record created, approved, rejected, corrected)
- Admin overrides
- Player/team link changes

The audit log does **not** need to cover:

- Read operations
- Webhook ping/pong
- Discord message delivery status

---

## Compliance Use Case

The audit log is part of the Hi-Rez compliance trail. If a prizing dispute occurs, the audit log provides:

- When a match result was submitted
- Who submitted it
- What admin approved it
- What screenshots were attached
- Whether any corrections were made after the fact

This is why the audit log is immutable and why `old_value_json` / `new_value_json` are required on mutations.

---

## Querying Audit History

Example: full history of a match

```sql
SELECT *
FROM audit_logs
WHERE entity_id = $match_id
   OR (entity_type = 'pending_action' AND pending_action_id IN (
       SELECT id FROM pending_actions WHERE match_id = $match_id
   ))
ORDER BY created_at;
```

Example: all actions by an admin

```sql
SELECT *
FROM audit_logs
WHERE actor_discord_id = $discord_id
ORDER BY created_at DESC;
```

---

## On Admin Overrides

Admin overrides are the one case where a mutation happens without a preceding captain command. They are still fully audited:

```sql
INSERT INTO audit_logs (
  action_type, entity_type, entity_id,
  actor_discord_id, old_value_json, new_value_json, note
) VALUES (
  'admin_override', 'match', $match_id,
  $admin_discord_id, $old, $new,
  'Score correction: Team A won 2-1 not 2-0 per Hi-Rez clarification'
);
```

The `note` field is required for overrides.
