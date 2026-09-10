import jwt from 'jsonwebtoken';
import { apiError } from '../utils/validation.js';

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.cpgt_auth;
  if (!token) return apiError(res, 401, 'Authentication required');
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return apiError(res, 500, 'JWT secret not configured');
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
    return apiError(res, 401, 'Invalid or expired token');
  }
};

export default authMiddleware;

