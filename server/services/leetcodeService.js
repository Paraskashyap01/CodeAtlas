import axios from 'axios';

// Base URL is configurable so the API can be swapped (e.g. to a self-hosted
// instance) without touching any code - see server/.env LEETCODE_API_BASE.
const LC_API_BASE = process.env.LEETCODE_API_BASE || 'https://leetcode-api-pied.vercel.app';
const CACHE_TTL_MS = 30 * 60 * 1000;

const client = axios.create({
  baseURL: LC_API_BASE,
  timeout: 10000,
});

// Wraps a GET call with a consistent error message. `optional` calls return
// a fallback value instead of throwing, since some sections of the LC page
// (badges, skills, contests) shouldn't break the whole page if they fail.
const safeGet = async (path, { optional = false, fallback = null } = {}) => {
  try {
    const response = await client.get(path);
    return response.data;
  } catch (error) {
    if (optional) return fallback;
    const message = error.response?.status === 404
      ? 'LeetCode user not found.'
      : error.response?.status === 429
        ? 'LeetCode API rate limited this request. Please try again shortly.'
        : 'LeetCode API is temporarily unavailable.';
    throw new Error(message);
  }
};

// --- Individual endpoint fetchers -----------------------------------------

export const fetchLCProfile = (handle) => safeGet(`/user/${encodeURIComponent(handle)}`);

export const fetchLCContests = (handle) =>
  safeGet(`/user/${encodeURIComponent(handle)}/contests`, {
    optional: true,
    fallback: { userContestRanking: null, userContestRankingHistory: [] },
  });

export const fetchLCSubmissions = (handle) =>
  safeGet(`/user/${encodeURIComponent(handle)}/submissions`, { optional: true, fallback: [] });

export const fetchLCBadges = (handle) =>
  safeGet(`/user/${encodeURIComponent(handle)}/badges`, {
    optional: true,
    fallback: { badges: [], upcomingBadges: [] },
  });

export const fetchLCSkills = (handle) =>
  safeGet(`/user/${encodeURIComponent(handle)}/skills`, {
    optional: true,
    fallback: { fundamental: [], intermediate: [], advanced: [] },
  });

export const fetchLCDaily = () =>
  safeGet('/daily', { optional: true, fallback: null });

// Calendar comes back as { submissionCalendar: { "<unixSeconds>": count, ... }, streak, totalActiveDays, activeYears }
// Normalize it to [{ date: 'YYYY-MM-DD', count }] to match the shape the
// dashboard heatmap already expects from Codeforces.
export const fetchLCCalendar = async (handle) => {
  const data = await safeGet(`/user/${encodeURIComponent(handle)}/calendar`, {
    optional: true,
    fallback: null,
  });

  if (!data?.submissionCalendar) {
    return { calendar: [], streak: 0, totalActiveDays: 0, activeYears: [] };
  }

  const calendar = Object.entries(data.submissionCalendar).map(([timestamp, count]) => ({
    date: new Date(parseInt(timestamp, 10) * 1000).toISOString().split('T')[0],
    count: parseInt(count, 10) || 0,
  }));

  return {
    calendar,
    streak: data.streak || 0,
    totalActiveDays: data.totalActiveDays || 0,
    activeYears: data.activeYears || [],
  };
};

// --- Aggregate fetch used by the controller --------------------------------
// Pulls everything the LeetCode page needs in one go. Profile is required
// (throws if it fails); everything else degrades gracefully so one flaky
// endpoint doesn't take down the whole page.
export const fetchLCFullProfile = async (handle) => {
  const [profile, contests, submissions, badges, skills, calendarData, daily] = await Promise.all([
    fetchLCProfile(handle),
    fetchLCContests(handle),
    fetchLCSubmissions(handle),
    fetchLCBadges(handle),
    fetchLCSkills(handle),
    fetchLCCalendar(handle),
    fetchLCDaily(),
  ]);

  const acSubmissionNum = profile?.submitStats?.acSubmissionNum || [];
  const totalSubmissionNum = profile?.submitStats?.totalSubmissionNum || [];

  const findByDifficulty = (arr, difficulty) => arr.find((x) => x.difficulty === difficulty);

  const solvedBreakdown = {
    all: findByDifficulty(acSubmissionNum, 'All')?.count ?? 0,
    easy: findByDifficulty(acSubmissionNum, 'Easy')?.count ?? 0,
    medium: findByDifficulty(acSubmissionNum, 'Medium')?.count ?? 0,
    hard: findByDifficulty(acSubmissionNum, 'Hard')?.count ?? 0,
  };

  const totalBreakdown = {
    all: findByDifficulty(totalSubmissionNum, 'All')?.count ?? 0,
    easy: findByDifficulty(totalSubmissionNum, 'Easy')?.count ?? 0,
    medium: findByDifficulty(totalSubmissionNum, 'Medium')?.count ?? 0,
    hard: findByDifficulty(totalSubmissionNum, 'Hard')?.count ?? 0,
  };

  return {
    handle,
    profile: {
      avatar: profile?.profile?.userAvatar ?? null,
      realName: profile?.profile?.realName ?? null,
      ranking: profile?.profile?.ranking ?? null,
      reputation: profile?.profile?.reputation ?? null,
      country: profile?.profile?.countryName ?? null,
      aboutMe: profile?.profile?.aboutMe ?? null,
      contestBadge: profile?.contestBadge ?? null,
    },
    solvedBreakdown,
    totalBreakdown,
    contestRanking: contests?.userContestRanking ?? null,
    contestHistory: contests?.userContestRankingHistory ?? [],
    submissions: submissions ?? [],
    badges: badges?.badges ?? [],
    upcomingBadges: badges?.upcomingBadges ?? [],
    skills: skills ?? { fundamental: [], intermediate: [], advanced: [] },
    calendar: calendarData.calendar,
    streak: calendarData.streak,
    totalActiveDays: calendarData.totalActiveDays,
    daily,
    fetchedAt: new Date(),
  };
};

export const isCacheFresh = (fetchedAt) => {
  if (!fetchedAt) return false;
  return Date.now() - new Date(fetchedAt).getTime() < CACHE_TTL_MS;
};
