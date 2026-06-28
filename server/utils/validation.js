import mongoose from 'mongoose';

// Validate competitive programming handles
// Codeforces/LeetCode handles: alphanumeric, underscore, dash; 1-50 chars
export const validateHandle = (handle) => {
  if (!handle || typeof handle !== 'string') return false;
  const trimmed = handle.trim();
  return /^[a-zA-Z0-9_-]{1,50}$/.test(trimmed);
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Standardized API response shape
export const apiResponse = (res, statusCode, { message, data = null, success = true } = {}) => {
  res.status(statusCode).json({
    success,
    message,
    ...(data && { data }),
  });
};

// Error response wrapper
export const apiError = (res, statusCode, message) => {
  apiResponse(res, statusCode, { message, success: false });
};
