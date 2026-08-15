import { getLCDataForAuthenticatedUser } from '../services/leetcodeService.js';
import { apiError } from '../utils/validation.js';

export const getLCStats = async (req, res) => {
  try {
    const response = await getLCDataForAuthenticatedUser(req.userId);
    return res.json(response);
  } catch (error) {
    if (error?.statusCode === 400) {
      return apiError(res, 400, 'LeetCode handle not set');
    }

    console.error(error);
    return apiError(res, 500, 'Unable to fetch LeetCode stats');
  }
};
