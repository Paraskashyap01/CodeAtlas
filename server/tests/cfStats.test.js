import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCFDerivedStats } from '../utils/cfStats.js';

test('weak topics use the configured minimum attempt threshold', () => {
  process.env.WEAK_TOPIC_MIN_ATTEMPTS = '5';

  const stats = buildCFDerivedStats([
    { verdict: 'OK', creationTimeSeconds: 1, problem: { contestId: 1, index: 'A', tags: ['dp'], rating: 1200 } },
    { verdict: 'WRONG_ANSWER', creationTimeSeconds: 2, problem: { contestId: 1, index: 'B', tags: ['dp'], rating: 1300 } },
    { verdict: 'WRONG_ANSWER', creationTimeSeconds: 3, problem: { contestId: 1, index: 'C', tags: ['dp'], rating: 1400 } },
    { verdict: 'WRONG_ANSWER', creationTimeSeconds: 4, problem: { contestId: 1, index: 'D', tags: ['dp'], rating: 1500 } },
    { verdict: 'WRONG_ANSWER', creationTimeSeconds: 5, problem: { contestId: 1, index: 'E', tags: ['dp'], rating: 1600 } },
  ]);

  assert.equal(stats.weakTopics.length, 1);
  assert.equal(stats.weakTopics[0].tag, 'dp');
});
