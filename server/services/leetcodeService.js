import axios from 'axios';

const LC_URL = 'https://leetcode.com/graphql';
const CACHE_TTL_MS = 30 * 60 * 1000;

const query = `query userProfile($username: String!) {
  matchedUser(username: $username) {
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
      totalSubmissionNum {
        difficulty
        count
      }
    }
    profile {
      ranking
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
  }
}`;

const GRAPHQL_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://leetcode.com/',
  Origin: 'https://leetcode.com',
};

export const fetchLCData = async (handle) => {
  try {
    const response = await axios.post(
      LC_URL,
      { query, variables: { username: handle } },
      { headers: GRAPHQL_HEADERS, timeout: 10000 }
    );

    const matchedUser = response.data?.data?.matchedUser;
    if (!matchedUser) {
      console.error('LeetCode response body:', JSON.stringify(response.data));
      throw new Error('LeetCode returned an unexpected profile payload');
    }

    const contestRanking = response.data?.data?.userContestRanking;

    const stats = {
      submitStats: matchedUser.submitStats,
      ranking: {
        rating: contestRanking?.rating ?? null,
        globalRanking: contestRanking?.globalRanking ?? matchedUser.profile?.ranking ?? null,
      },
    };

    return {
      handle,
      stats,
      fetchedAt: new Date(),
    };
  } catch (error) {
    const message = error.response?.status === 429
      ? 'LeetCode rate limited this request. Please try again shortly.'
      : 'LeetCode profile data is temporarily unavailable.';
    throw new Error(message);
  }
};

export const fetchLCCalendar = async (handle) => {
  try {
    // Primary source: noworneverev/leetcode-api (more reliable, actively maintained)
    // API: https://github.com/noworneverev/leetcode-api
    const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${handle}/calendar`, {
      timeout: 10000,
    });

    if (!response.data?.calendar) {
      return [];
    }

    // Transform calendar data to match our format: [{ date, count }]
    // The API returns calendar as object with timestamps as keys and submission counts as values
    const calendarData = Object.entries(response.data.calendar).map(([timestamp, count]) => ({
      date: new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0],
      count: parseInt(count) || 0,
    }));

    return calendarData;
  } catch (primaryError) {
    // Fallback: try alfa-leetcode-api if primary source fails
    try {
      console.warn(`Primary LeetCode API failed for ${handle}, trying fallback...`);
      const response = await axios.get(`https://alfa-leetcode-api.onrender.com/${handle}/calendar`, {
        timeout: 10000,
      });

      if (!response.data?.calendar) {
        return [];
      }

      const calendarData = Object.entries(response.data.calendar).map(([timestamp, count]) => ({
        date: new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0],
        count: parseInt(count) || 0,
      }));

      return calendarData;
    } catch (fallbackError) {
      // Calendar fetch is optional - don't throw, just return empty array
      console.warn(`Unable to fetch LeetCode calendar for ${handle} (both primary and fallback failed)`);
      return [];
    }
  }
};

export const isCacheFresh = (fetchedAt) => {
  if (!fetchedAt) return false;
  return Date.now() - new Date(fetchedAt).getTime() < CACHE_TTL_MS;
};
