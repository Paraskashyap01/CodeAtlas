import User from '../models/user.js';
import { validateHandle, apiError } from '../utils/validation.js';

export const updateHandles = async (req, res) => {
  const { cfHandle, lcHandle } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return apiError(res, 404, 'User not found');
    }

    // Validate handles if provided
    if (cfHandle && !validateHandle(cfHandle)) {
      return apiError(res, 400, 'Invalid Codeforces handle format (1-50 chars, alphanumeric, dash, underscore only)');
    }
    if (lcHandle && !validateHandle(lcHandle)) {
      return apiError(res, 400, 'Invalid LeetCode handle format (1-50 chars, alphanumeric, dash, underscore only)');
    }

    user.cfHandle = cfHandle ? cfHandle.trim() : user.cfHandle;
    user.lcHandle = lcHandle ? lcHandle.trim() : user.lcHandle;
    await user.save();

    res.json({ user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to update handles');
  }
};

