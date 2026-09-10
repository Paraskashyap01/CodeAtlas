const DEFAULT_MAX_STALE_MS = 2 * 60 * 60 * 1000;

export const getMaxStaleMs = () => Number(
  process.env.STATS_MAX_STALE_MS || DEFAULT_MAX_STALE_MS
);

export const isFresh = (fetchedAt, now = Date.now()) => {
  const timestamp = new Date(fetchedAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return now - timestamp <= getMaxStaleMs();
};
