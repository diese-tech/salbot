# ADR-002: Slash Commands Are the Primary Workflow; Scanning Is Fallback Only

**Status:** Accepted
**Date:** 2025-01-01
**Deciders:** Platform architecture

---

## Context

League captains need to submit match results and reschedule requests. Two implementation approaches exist:

1. **Command-based** — captains use slash commands; bot processes structured input
2. **Scan-based** — captains post in a channel; bot parses natural language or structured formats

A hybrid is possible where scanning promotes messages to pending actions automatically.

---

## Decision

Slash commands are the official workflow. Message scanning is a safety net that may prompt captains to use a command, but never autonomously creates an official pending action.

---

## Rationale

- **Unambiguous input** — dropdown-driven match selection eliminates typos, fuzzy matching, and wrong-match linking. Score input is validated before submission. Scanning cannot reliably handle all edge cases.
- **Deterministic output** — every command creates exactly one `pending_action` with known fields. Parsed messages may be incomplete.
- **Identity verification** — slash commands are tied to the Discord user ID, which is resolved to a verified captain row before the dropdown is shown. Scanning cannot enforce captain-only submission.
- **Idempotency** — commands have retry protection built in. Scanned messages submitted twice create ambiguity.
- **Admin clarity** — admins review cards with structured data. A card that originated from a slash command has consistent, complete fields. A card from a scanned message may have partial data.
- **Compliance** — official submissions require an official intake mechanism. An admin approving a scanned message is approving ambiguous input. An admin approving a command submission is approving validated, structured data.

---

## Consequences

### Positive

- Captains always have a clear, guided submission path
- Admin review cards are always complete and structured
- No parsing logic to maintain for natural language or format variations
- Identity and eligibility are enforced at the command level

### Negative

- Captains who are unfamiliar with slash commands have a learning curve
- The bot cannot autonomously capture results from captains who ignore commands
- Scanning as a fallback requires manual admin intervention to convert to a formal submission

### Risks

- Captain adoption requires onboarding and documentation; mitigated by making commands discoverable and low-friction
- Scanning fallback, if implemented, must never be allowed to create a `pending_action` without a human confirmation step

---

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| Full scan-based workflow | Ambiguous, unreliable, not audit-safe |
| Hybrid with auto-promotion | Risks creating unvalidated pending actions from misformatted or duplicate messages |
| Both equal priority | Dilutes focus; creates two maintenance surfaces for core workflows |
