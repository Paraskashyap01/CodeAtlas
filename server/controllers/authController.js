import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { apiError } from '../utils/validation.js';

const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiError(res, 400, errors.array().map((error) => error.msg).join(', '));
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    try {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return apiError(res, 400, 'Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({ email: normalizedEmail, passwordHash });
        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({ success: true, token, user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
    } catch (error) {
        console.error(error);
        apiError(res, 500, 'Unable to register user');
    }
};

export const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiError(res, 400, errors.array().map((error) => error.msg).join(', '));
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return apiError(res, 401, 'Invalid credentials');
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return apiError(res, 401, 'Invalid credentials');
        }

        const token = generateToken(user._id);
        res.json({ success: true, token, user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
    } catch (error) {
        console.error(error);
        apiError(res, 500, 'Unable to log in');
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            return apiError(res, 404, 'User not found');
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        apiError(res, 500, 'Unable to fetch profile');
    }
};

