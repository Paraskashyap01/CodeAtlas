export const buildLeaderboardData = (users, cfStats, lcStats) => {
  const cfByUserId = new Map(cfStats.map((stats) => [String(stats.userId), stats]));
  const lcByUserId = new Map(lcStats.map((stats) => [String(stats.userId), stats]));

  return users.map((user) => {
    const cfData = cfByUserId.get(String(user._id));
    const lcData = lcByUserId.get(String(user._id));
    return {
      id: user._id,
      displayName: user.cfHandle || user.lcHandle || user.email,
      cfHandle: user.cfHandle || null,
      lcHandle: user.lcHandle || null,
      cfRating: cfData?.handle === user.cfHandle ? cfData.currentRating : null,
      cfSolvedCount: cfData?.handle === user.cfHandle ? cfData.solvedCount : null,
      lcSolvedCount: lcData?.handle === user.lcHandle ? lcData.solvedBreakdown?.all ?? null : null,
      friendCount: user.friends?.length || 0,
    };
  });
};
