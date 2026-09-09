import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLeaderboardData } from '../utils/leaderboard.js';

test('leaderboard merges persisted stats without platform API calls', () => {
  const users = [
    { _id: 'user-1', email: 'one@example.com', cfHandle: 'one', lcHandle: 'one-lc', friends: ['friend'] },
    { _id: 'user-2', email: 'two@example.com', cfHandle: 'two', lcHandle: null, friends: [] },
  ];

  const leaderboard = buildLeaderboardData(
    users,
    [
      { userId: 'user-1', handle: 'one', currentRating: 1600, solvedCount: 42 },
      { userId: 'user-2', handle: 'old-two', currentRating: 1900, solvedCount: 99 },
    ],
    [{ userId: 'user-1', handle: 'one-lc', solvedBreakdown: { all: 80 } }]
  );

  assert.deepEqual(leaderboard, [
    {
      id: 'user-1',
      displayName: 'one',
      cfHandle: 'one',
      lcHandle: 'one-lc',
      cfRating: 1600,
      cfSolvedCount: 42,
      lcSolvedCount: 80,
      friendCount: 1,
    },
    {
      id: 'user-2',
      displayName: 'two',
      cfHandle: 'two',
      lcHandle: null,
      cfRating: null,
      cfSolvedCount: null,
      lcSolvedCount: null,
      friendCount: 0,
    },
  ]);
});