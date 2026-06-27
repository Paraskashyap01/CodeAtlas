import { validationResult } from 'express-validator';
import Goal from '../models/Goal.js';
import CachedCFData from '../models/CachedCFData.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';

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
  const cache = await CachedCFData.findOne({ userId });
  if (!cache?.submissions?.length) return goal;

  const weekStart = goal.weekStart ? new Date(goal.weekStart) : getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const acceptedThisWeek = (cache.submissions || []).filter((submission) => {
    if (submission.verdict !== 'OK') return false;
    const createdAt = submission.creationTimeSeconds ? new Date(submission.creationTimeSeconds * 1000) : null;
    if (!createdAt) return false;
    return createdAt >= weekStart && createdAt < weekEnd;
  });

  const solvedCount = new Set(acceptedThisWeek.map((submission) => `${submission.problem?.contestId ?? ''}-${submission.problem?.index ?? ''}`)).size;
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

    const syncedGoal = await syncGoalProgress(req.userId, goal);
    res.status(201).json({ goal: syncedGoal || goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to save goal' });
  }
};

export const getCurrentGoal = async (req, res) => {
  try {
    const weekStart = getWeekStart();
    const goal = await Goal.findOne({ userId: req.userId, weekStart });
    const syncedGoal = goal ? await syncGoalProgress(req.userId, goal) : null;
    res.json({ goal: syncedGoal || goal, weekStart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch goal' });
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
