import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardStats } from '../services/dashboardService.js';

test('dashboard stats merge platform calendars and calculate the current streak', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  const stats = buildDashboardStats({
    cfData: { calendar: [{ date: today, count: 2 }] },
    lcData: { calendar: [{ date: today, count: 1 }, { date: yesterday, count: 4 }] },
  });

  assert.deepEqual(stats.mergedCalendar, [
    { date: yesterday, count: 4 },
    { date: today, count: 3 },
  ]);
  assert.equal(stats.currentStreak, 2);
});

test('dashboard stats return an empty calendar and zero streak without activity', () => {
  const stats = buildDashboardStats({ cfData: null, lcData: null });

  assert.deepEqual(stats.mergedCalendar, []);
  assert.equal(stats.currentStreak, 0);
});