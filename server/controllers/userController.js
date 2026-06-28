import User from '../models/user.js';
import { validateHandle, apiError } from '../utils/validation.js';

// Once a user has saved a handle, it is locked: it can never be changed to
// a different value, and no other account can ever claim it. This keeps
// "one email -> one CF handle + one LC handle" true for the lifetime of the
// account. Submitting the same value again (no-op) is allowed; clearing a
// handle is not allowed once set, since that would free it up for reuse.
export const updateHandles = async (req, res) => {
  const { cfHandle, lcHandle } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return apiError(res, 404, 'User not found');
    }

    const trimmedCf = typeof cfHandle === 'string' ? cfHandle.trim() : undefined;
    const trimmedLc = typeof lcHandle === 'string' ? lcHandle.trim() : undefined;

    // Validate format first
    if (trimmedCf && !validateHandle(trimmedCf)) {
      return apiError(res, 400, 'Invalid Codeforces handle format (1-50 chars, alphanumeric, dash, underscore only)');
    }
    if (trimmedLc && !validateHandle(trimmedLc)) {
      return apiError(res, 400, 'Invalid LeetCode handle format (1-50 chars, alphanumeric, dash, underscore only)');
    }

    // Lock: once set, a handle cannot be changed to a different value.
    if (user.cfHandle && trimmedCf && trimmedCf !== user.cfHandle) {
      return apiError(res, 403, `Your Codeforces handle is already set to "${user.cfHandle}" and cannot be changed.`);
    }
    if (user.lcHandle && trimmedLc && trimmedLc !== user.lcHandle) {
      return apiError(res, 403, `Your LeetCode handle is already set to "${user.lcHandle}" and cannot be changed.`);
    }

    // Cross-account uniqueness: make sure no other user already owns this
    // handle before we try to save (gives a clean error instead of relying
    // only on the DB unique-index error below).
    if (trimmedCf && !user.cfHandle) {
      const taken = await User.findOne({ cfHandle: trimmedCf, _id: { $ne: user._id } });
      if (taken) {
        return apiError(res, 409, 'That Codeforces handle is already linked to another account.');
      }
    }
    if (trimmedLc && !user.lcHandle) {
      const taken = await User.findOne({ lcHandle: trimmedLc, _id: { $ne: user._id } });
      if (taken) {
        return apiError(res, 409, 'That LeetCode handle is already linked to another account.');
      }
    }

    // Only ever move from "unset" -> "set". Already-set+same-value is a no-op.
    if (trimmedCf && !user.cfHandle) user.cfHandle = trimmedCf;
    if (trimmedLc && !user.lcHandle) user.lcHandle = trimmedLc;

    await user.save();

    res.json({
      success: true,
      user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle },
    });
  } catch (error) {
    // Safety net: if two requests race past the findOne check above, Mongo's
    // unique index is the final word and throws E11000.
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const label = field === 'lcHandle' ? 'LeetCode' : 'Codeforces';
      return apiError(res, 409, `That ${label} handle is already linked to another account.`);
    }
    console.error(error);
    apiError(res, 500, 'Unable to update handles');
  }
};
