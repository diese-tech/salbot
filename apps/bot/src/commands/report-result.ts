// /report-result command stub
// Full implementation: Phase 1 (see docs/ROADMAP.md)
//
// Flow:
//   1. Resolve captain from interaction.user.id
//   2. Fetch eligible matches → show dropdown
//   3. Captain selects match, enters winner + score
//   4. createPendingAction({ type: 'match_result', ... })
//   5. Post public receipt embed
//   6. Create proof thread
//   7. Post admin review card

export const reportResultCommand = {
  name: 'report-result',
  description: 'Submit a match result for admin review',
};
