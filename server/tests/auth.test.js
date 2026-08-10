import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail } from '../controllers/authController.js';

test('normalizeEmail lowercases and trims input', () => {
  assert.equal(normalizeEmail('  User@Example.com '), 'user@example.com');
  assert.equal(normalizeEmail('USER@EXAMPLE.COM'), 'user@example.com');
});
