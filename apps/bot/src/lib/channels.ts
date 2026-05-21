// Channel IDs come from env vars — explicit IDs are more reliable than name-based lookup.
// Set these per deployment in Railway / your hosting platform.

const RESULTS: Record<string, string | undefined> = {
  solar: process.env.CHANNEL_RESULTS_SOLAR,
  lunar: process.env.CHANNEL_RESULTS_LUNAR,
  gaia: process.env.CHANNEL_RESULTS_GAIA,
};

const RESCHEDULES: Record<string, string | undefined> = {
  solar: process.env.CHANNEL_RESCHEDULES_SOLAR,
  lunar: process.env.CHANNEL_RESCHEDULES_LUNAR,
  gaia: process.env.CHANNEL_RESCHEDULES_GAIA,
};

export function getAdminReviewChannelId(): string {
  const id = process.env.CHANNEL_ADMIN_REVIEW;
  if (!id) throw new Error('CHANNEL_ADMIN_REVIEW env var is not set');
  return id;
}

export function getResultsChannelId(divisionId: string): string {
  const id = RESULTS[divisionId.toLowerCase()];
  if (!id) throw new Error(`CHANNEL_RESULTS_${divisionId.toUpperCase()} env var is not set`);
  return id;
}

export function getReschedulesChannelId(divisionId: string): string {
  const id = RESCHEDULES[divisionId.toLowerCase()];
  if (!id) throw new Error(`CHANNEL_RESCHEDULES_${divisionId.toUpperCase()} env var is not set`);
  return id;
}
