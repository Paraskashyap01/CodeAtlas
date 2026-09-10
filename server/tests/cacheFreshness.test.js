import test from 'node:test';
import assert from 'node:assert/strict';
import { isFresh } from '../utils/cacheFreshness.js';

test('cache freshness rejects missing and expired timestamps', () => {
  const now = Date.parse('2026-09-10T12:00:00.000Z');

  assert.equal(isFresh(undefined, now), false);
  assert.equal(isFresh('2026-09-10T09:59:59.999Z', now), false);
  assert.equal(isFresh('2026-09-10T10:00:00.000Z', now), true);
  assert.equal(isFresh('2026-09-10T11:59:59.999Z', now), true);
});
