import jwt from 'jsonwebtoken';
import { apiError } from '../utils/validation.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiError(res, 401, 'Authorization token required');
  }

  const token = authHeader.split(' ')[1];
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

