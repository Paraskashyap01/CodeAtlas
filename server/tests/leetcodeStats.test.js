import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAcceptedByWeek } from '../services/leetcodeService.js';

test('LeetCode accepted-by-week counts unique accepted problems', () => {
  const monday = Math.floor(Date.parse('2026-09-07T10:00:00.000Z') / 1000);
  const acceptedByWeek = buildAcceptedByWeek([
    { statusDisplay: 'Accepted', timestamp: String(monday), titleSlug: 'two-sum' },
    { statusDisplay: 'Accepted', timestamp: String(monday + 60), titleSlug: 'two-sum' },
    { statusDisplay: 'Accepted', timestamp: String(monday + 120), titleSlug: 'three-sum' },
    { statusDisplay: 'Wrong Answer', timestamp: String(monday + 180), titleSlug: 'four-sum' },
  ]);

  assert.deepEqual(acceptedByWeek, { '2026-09-07': 2 });
});