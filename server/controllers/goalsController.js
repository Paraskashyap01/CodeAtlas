import { validationResult } from 'express-validator';
import Goal from '../models/Goal.js';
import User from '../models/user.js';
import { getCFDataForUser } from '../services/codeforcesService.js';
import { getLCDataForUser } from '../services/leetcodeService.js';
import { httpError } from '../utils/errors.js';

const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
};

const syncGoalProgress = async (userId, goal) => {
  if (!goal) return null;
  const user = await User.findById(userId);
  if (!user?.cfHandle && !user?.lcHandle) {
    return goal;
  }
  const cfData = user.cfHandle ? await getCFDataForUser(userId, user.cfHandle) : null;
  const lcData = user.lcHandle ? await getLCDataForUser(userId, user.lcHandle) : null;

  // NOTE: Week boundaries use UTC. If a user is in UTC+5:30 (IST) and submits on Monday 00:30 IST,
  // it will be counted as Sunday 19:00 UTC (previous day). This is intentional for consistency.
  // For a more user-friendly experience, consider storing user timezone preference.
  const weekStart = goal.weekStart ? new Date(goal.weekStart) : getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  // Count Codeforces accepted problems this week from the compact persisted aggregate.
  let cfSolvedCount = 0;
  const weekKey = weekStart.toISOString().slice(0, 10);
  if (cfData?.acceptedByWeek && Object.hasOwn(cfData.acceptedByWeek, weekKey)) {
    cfSolvedCount = cfData.acceptedByWeek[weekKey];
  } else if (cfData?.submissions?.length) {
    // Keep compatibility with pre-migration cache entries until they refresh.
    const acceptedThisWeek = (cfData.submissions || []).filter((submission) => {
      if (submission.verdict !== 'OK') return false;
      const createdAt = submission.creationTimeSeconds ? new Date(submission.creationTimeSeconds * 1000) : null;
      if (!createdAt) return false;
      return createdAt >= weekStart && createdAt < weekEnd;
    });
    cfSolvedCount = new Set(acceptedThisWeek.map((submission) => `${submission.problem?.contestId ?? ''}-${submission.problem?.index ?? ''}`)).size;
  }

  // Count unique accepted LeetCode problems using the same metric as Codeforces.
  const lcSolvedCount = lcData?.acceptedByWeek?.[weekKey] || 0;

  // Total solved count from both platforms
  const solvedCount = cfSolvedCount + lcSolvedCount;
  goal.solvedCount = solvedCount;
  goal.done = solvedCount >= goal.targetCount;
  await goal.save();
  return goal;
};

export const createGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(400, errors.array().map((error) => error.msg).join(', '));

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
};


export const getCurrentGoal = async (req, res) => {
  const weekStart = getWeekStart();
  const goal = await Goal.findOne({ userId: req.userId, weekStart });
  const syncedGoal = await syncGoalProgress(req.userId, goal);
  res.json({ success: true, goal: syncedGoal, weekStart });
};


export const updateGoalProgress = async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
  if (!goal) throw httpError(404, 'Goal not found');

    if (typeof req.body.solvedCount === 'number') goal.solvedCount = req.body.solvedCount;
    if (typeof req.body.done === 'boolean') {
      goal.done = req.body.done;
    } else {
      goal.done = goal.solvedCount >= goal.targetCount;
    }

    await goal.save();
  res.json({ goal });
};
