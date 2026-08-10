import { getCFDataForAuthenticatedUser } from '../services/codeforcesService.js';
import { apiError } from '../utils/validation.js';

export const getCFStats = async (req, res) => {
  try {
    const response = await getCFDataForAuthenticatedUser(req.userId);
    return res.json(response);
  } catch (error) {
    if (error?.statusCode === 400) {
      return apiError(res, 400, 'Codeforces handle not set');
    }

    console.error(error);
    return apiError(res, 500, 'Unable to fetch Codeforces stats');
  }
};

