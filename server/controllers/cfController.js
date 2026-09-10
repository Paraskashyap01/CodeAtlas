import { getCFDataForAuthenticatedUser } from '../services/codeforcesService.js';

export const getCFStats = async (req, res) => {
  const response = await getCFDataForAuthenticatedUser(req.userId);
  return res.json(response);
};

