import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'JWT secret not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;
