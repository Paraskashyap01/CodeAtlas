import { validationResult } from 'express-validator';
import Goal from '../models/Goal.js';
import CachedCFData from '../models/CachedCFData.js';
import CachedLCData from '../models/CachedLCData.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';
import { apiError } from '../utils/validation.js';

const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const syncGoalProgress = async (userId, goal) => {
  if (!goal) return null;
  const cfCache = await CachedCFData.findOne({ userId });
  const lcCache = await CachedLCData.findOne({ userId });

  // NOTE: Week boundaries use UTC. If a user is in UTC+5:30 (IST) and submits on Monday 00:30 IST,
  // it will be counted as Sunday 19:00 UTC (previous day). This is intentional for consistency.
  // For a more user-friendly experience, consider storing user timezone preference.
  const weekStart = goal.weekStart ? new Date(goal.weekStart) : getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Count Codeforces accepted submissions this week
  let cfSolvedCount = 0;
  if (cfCache?.submissions?.length) {
    const acceptedThisWeek = (cfCache.submissions || []).filter((submission) => {
      if (submission.verdict !== 'OK') return false;
      const createdAt = submission.creationTimeSeconds ? new Date(submission.creationTimeSeconds * 1000) : null;
      if (!createdAt) return false;
      return createdAt >= weekStart && createdAt < weekEnd;
    });
    cfSolvedCount = new Set(acceptedThisWeek.map((submission) => `${submission.problem?.contestId ?? ''}-${submission.problem?.index ?? ''}`)).size;
  }

  // Count LeetCode accepted submissions this week using calendar data
  let lcSolvedCount = 0;
  if (lcCache?.calendar?.length) {
    lcSolvedCount = (lcCache.calendar || []).reduce((sum, entry) => {
      if (!entry.date) return sum;
      const entryDate = new Date(entry.date);
      if (entryDate >= weekStart && entryDate < weekEnd) {
        return sum + (entry.count || 0);
      }
      return sum;
    }, 0);
  }

  // Total solved count from both platforms
  const solvedCount = cfSolvedCount + lcSolvedCount;
  goal.solvedCount = solvedCount;
  goal.done = solvedCount >= goal.targetCount;
  await goal.save();
  return goal;
};

export const createGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const weekStart = getWeekStart();
    const payload = {
      userId: req.userId,
      weekStart,
      goalDescription: req.body.goalDescription,
      targetCount: req.body.targetCount,
      solvedCount: req.body.solvedCount || 0,
    };
    payload.done = payload.solvedCount >= payload.targetCount;

    const goal = await Goal.findOneAndUpdate({ userId: req.userId, weekStart }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    // Sync on create: if user just set a new goal, reflect current progress from CF submissions
    const syncedGoal = await syncGoalProgress(req.userId, goal);
    res.status(201).json({ success: true, goal: syncedGoal || goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to save goal' });
  }
};

export const getCurrentGoal = async (req, res) => {
  try {
    const weekStart = getWeekStart();
    const goal = await Goal.findOne({ userId: req.userId, weekStart });
    // Return goal as-is; only sync on createGoal or explicit updateGoalProgress
    // This avoids unnecessary re-scans of the submission cache on every dashboard load
    res.json({ success: true, goal, weekStart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to fetch goal' });
  }
};

export const updateGoalProgress = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (typeof req.body.solvedCount === 'number') goal.solvedCount = req.body.solvedCount;
    if (typeof req.body.done === 'boolean') {
      goal.done = req.body.done;
    } else {
      goal.done = goal.solvedCount >= goal.targetCount;
    }

    await goal.save();
    res.json({ goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update goal' });
  }
};
