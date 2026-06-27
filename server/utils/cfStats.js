const ratingBucket = (rating) => {
  if (typeof rating !== 'number' || Number.isNaN(rating)) return null;
  if (rating < 1200) return 'easy';
  if (rating < 1800) return 'medium';
  return 'hard';
};

const problemKey = (problem = {}) => {
  if (!problem.contestId || !problem.index) return problem.name || '';
  return `${problem.contestId}-${problem.index}`;
};

const dayKeyFromSeconds = (seconds) => {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
};

export const buildCFDerivedStats = (submissions = []) => {
  const solvedProblems = new Set();
  const attemptedByTag = new Map();
  const solvedByTag = new Map();
  const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
  const calendarCounts = new Map();
  const recentSubmissions = [];

  for (const submission of submissions) {
    if (!submission) continue;

    const problem = submission.problem || {};
    const key = problemKey(problem);
    const tags = Array.isArray(problem.tags) ? problem.tags : [];
    const day = dayKeyFromSeconds(submission.creationTimeSeconds);
    const accepted = submission.verdict === 'OK';

    for (const tag of tags) {
      attemptedByTag.set(tag, (attemptedByTag.get(tag) || 0) + 1);
    }

    if (accepted && key && !solvedProblems.has(key)) {
      solvedProblems.add(key);

      const bucket = ratingBucket(problem.rating);
      if (bucket) solvedByDifficulty[bucket] += 1;

      for (const tag of tags) {
        solvedByTag.set(tag, (solvedByTag.get(tag) || 0) + 1);
      }
    }

    if (accepted && day) {
      calendarCounts.set(day, (calendarCounts.get(day) || 0) + 1);
    }

    recentSubmissions.push({
      id: submission.id,
      contestId: submission.contestId ?? problem.contestId,
      creationTimeSeconds: submission.creationTimeSeconds,
      verdict: submission.verdict,
      problemName: problem.name,
      problemRating: problem.rating ?? null,
      problemIndex: problem.index,
      tags,
    });
  }

  const topicStats = [...attemptedByTag.entries()]
    .map(([tag, attempts]) => ({
      tag,
      attempts,
      solved: solvedByTag.get(tag) || 0,
      accuracy: attempts ? Math.round(((solvedByTag.get(tag) || 0) / attempts) * 100) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts || a.tag.localeCompare(b.tag));

  const weakTopics = topicStats
    .filter((topic) => topic.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 5);

  recentSubmissions.sort((a, b) => (b.creationTimeSeconds || 0) - (a.creationTimeSeconds || 0));

  return {
    solvedCount: solvedProblems.size,
    difficultyDistribution: solvedByDifficulty,
    topicStats,
    weakTopics,
    calendar: [...calendarCounts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    recentSubmissions: recentSubmissions.slice(0, 10),
  };
};
