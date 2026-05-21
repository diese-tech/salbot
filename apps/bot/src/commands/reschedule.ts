// /reschedule command stub
// Full implementation: Phase 2 (see docs/ROADMAP.md)
//
// Flow:
//   1. Resolve captain
//   2. Fetch eligible future matches → show dropdown
//   3. Captain selects match + new date/time
//   4. createPendingAction({ type: 'reschedule', ... })
//   5. Post public receipt in #reschedules-[division]
//   6. Post admin review card

export const rescheduleCommand = {
  name: 'reschedule',
  description: 'Request a match reschedule',
};
