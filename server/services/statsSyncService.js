import User from '../models/user.js';
import { refreshCFDataForUser } from './codeforcesService.js';
import { refreshLCDataForUser } from './leetcodeService.js';

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const DEFAULT_CONCURRENCY = 5;

const refreshUserStats = async (user) => {
  const jobs = [];
  if (user.cfHandle) {
    jobs.push(refreshCFDataForUser(user._id, user.cfHandle));
  }
  if (user.lcHandle) {
    jobs.push(refreshLCDataForUser(user._id, user.lcHandle));
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn(`Stats refresh failed for user ${user._id}:`, result.reason.message);
    }
  }
};

export const refreshAllUserStats = async ({ concurrency = DEFAULT_CONCURRENCY } = {}) => {
  const users = await User.find({
    $or: [
      { cfHandle: { $exists: true, $nin: [null, ''] } },
      { lcHandle: { $exists: true, $nin: [null, ''] } },
    ],
  }).select('_id cfHandle lcHandle').lean();

  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < users.length) {
      const user = users[nextIndex];
      nextIndex += 1;
      await refreshUserStats(user);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, users.length) }, worker)
  );
  console.log(`Refreshed platform stats for ${users.length} user(s).`);
};

export const startStatsSyncJob = () => {
  const intervalMs = Number(process.env.STATS_SYNC_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      await refreshAllUserStats();
    } catch (error) {
      console.error('Stats sync job failed:', error.message);
    } finally {
      running = false;
    }
  };

  void run();
  return setInterval(run, intervalMs);
};
