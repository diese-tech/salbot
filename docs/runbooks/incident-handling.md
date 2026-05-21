# Incident Handling

Operational incidents affecting league operations. Use this during live incidents.

---

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Match results cannot be submitted; active match in progress | Immediate |
| P2 | Bot offline; matches in flight have pending actions unprocessed | < 30 min |
| P3 | OCR processing failing; stat records not being generated | < 2 hours |
| P4 | Website admin panel degraded; Discord approvals still functional | < 4 hours |

---

## P1: Bot Cannot Accept Commands

Symptoms: `/report-result` returns an error or no response.

Steps:

1. Check bot process status
2. Check Supabase connectivity from bot (`GET /health` on Supabase URL)
3. Check Discord API status at discordstatus.com
4. Review bot error logs
5. If bot is down: restart process
6. If Supabase is down: inform affected captains, log pending submissions manually for later entry

Recovery after restart:
- All `pending_actions` with `status = 'pending'` are preserved in Supabase
- Admins can still process them via the website admin panel
- No data is lost from bot downtime

---

## P2: Pending Actions Stuck

Symptoms: Admin review cards not updating; approvals not executing.

Steps:

1. Check if bot is receiving Discord interaction events
2. Verify Supabase write permissions (`service_role` key in use)
3. Check for locked rows in `pending_actions` (uncommon but possible under high load)
4. Try approving via website admin panel as fallback

Website admin panel is a full fallback for all Discord approval actions. If Discord interactions are broken but the website is up, admin operations can continue uninterrupted.

---

## P3: ForgeLens Offline

Symptoms: Screenshots uploading, no `pending_stat_records` being created.

Impact: Stats not extracted. Match approval workflow is unaffected.

Steps:

1. Check ForgeLens process / deployment status
2. Review ForgeLens error logs for OCR failures
3. Check Supabase connectivity from ForgeLens

Recovery:
- ForgeLens retry queue will process backed-up screenshots on restart
- If screenshots have expired from Discord CDN, check Supabase Storage for archived copies
- If no archive exists, admins will need to re-upload or manually enter stats

---

## P4: Supabase Degraded

Full platform halt. Both bot and website depend on Supabase.

Steps:

1. Check Supabase status at status.supabase.com
2. Inform team of degraded state
3. Do not attempt manual database fixes during an active incident

Recovery:
- Platform resumes automatically when Supabase recovers
- No state is lost; all writes were either committed before the outage or rejected

---

## Manual Stat Entry

If ForgeLens is offline and admins need to enter stats manually:

1. Open website admin panel → Match → Stat Entry
2. For each player in each game, enter stats manually
3. Stats submitted via manual entry create `pending_stat_records` with `source = 'manual'` and `confidence = 1.0`
4. Proceed through normal approval flow

---

## Post-Incident

After any P1 or P2 incident:

1. Write a brief incident note (what happened, what was done, any data inconsistencies)
2. Check `pending_actions` for any stuck in `pending` state that need manual review
3. Check `audit_logs` for any gap in the timeline during the incident window
4. If any match mutations happened outside the normal pipeline during the incident, enter correction audit log entries via admin panel
