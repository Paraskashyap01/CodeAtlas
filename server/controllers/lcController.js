import { getLCDataForAuthenticatedUser } from '../services/leetcodeService.js';

export const getLCStats = async (req, res) => {
  const response = await getLCDataForAuthenticatedUser(req.userId);
  return res.json(response);
};
