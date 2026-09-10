import User from '../models/user.js';
import { validateHandle } from '../utils/validation.js';
import { httpError } from '../utils/errors.js';
import { clearCFDataForUser, getCFDataForUser } from '../services/codeforcesService.js';
import { clearLCDataForUser, getLCDataForUser } from '../services/leetcodeService.js';
import { buildDashboardStats } from '../services/dashboardService.js';

export const getDashboardStats = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, 'User not found');

  const [cfResult, lcResult] = await Promise.allSettled([
    user.cfHandle ? getCFDataForUser(user._id, user.cfHandle) : null,
    user.lcHandle ? getLCDataForUser(user._id, user.lcHandle) : null,
  ]);
  const cfData = cfResult.status === 'fulfilled' ? cfResult.value : null;
  const lcData = lcResult.status === 'fulfilled' ? lcResult.value : null;

  return res.json({
    success: true,
    cf: cfData,
    lc: lcData,
    ...buildDashboardStats({ cfData, lcData }),
  });
};

export const updateHandles = async (req, res) => {
  const { cfHandle, lcHandle } = req.body;

  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, 'User not found');

  const trimmedCf = typeof cfHandle === 'string' ? cfHandle.trim() : undefined;
  const trimmedLc = typeof lcHandle === 'string' ? lcHandle.trim() : undefined;

  if (trimmedCf && !validateHandle(trimmedCf)) {
    throw httpError(400, 'Invalid Codeforces handle format (1-50 chars, alphanumeric, dash, underscore only)');
  }
  if (trimmedLc && !validateHandle(trimmedLc)) {
    throw httpError(400, 'Invalid LeetCode handle format (1-50 chars, alphanumeric, dash, underscore only)');
  }

  if (trimmedCf && trimmedCf !== user.cfHandle) {
    const taken = await User.findOne({ cfHandle: trimmedCf, _id: { $ne: user._id } });
    if (taken) throw httpError(409, 'That Codeforces handle is already linked to another account.');
  }
  if (trimmedLc && trimmedLc !== user.lcHandle) {
    const taken = await User.findOne({ lcHandle: trimmedLc, _id: { $ne: user._id } });
    if (taken) throw httpError(409, 'That LeetCode handle is already linked to another account.');
  }

  const nextCfHandle = trimmedCf === undefined ? user.cfHandle : trimmedCf || null;
  const nextLcHandle = trimmedLc === undefined ? user.lcHandle : trimmedLc || null;
  const cfChanged = nextCfHandle !== (user.cfHandle || null);
  const lcChanged = nextLcHandle !== (user.lcHandle || null);
  user.cfHandle = nextCfHandle;
  user.lcHandle = nextLcHandle;

  await user.save();
  if (cfChanged) await clearCFDataForUser(user._id);
  if (lcChanged) await clearLCDataForUser(user._id);

  res.json({
    success: true,
    user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle },
  });
};
