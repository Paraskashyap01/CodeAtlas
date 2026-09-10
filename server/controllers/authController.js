import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { httpError } from '../utils/errors.js';

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

const AUTH_COOKIE = 'cpgt_auth';
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};

const setAuthCookie = (res, token) => {
    res.cookie(AUTH_COOKIE, token, cookieOptions);
};

export const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw httpError(400, errors.array().map((error) => error.msg).join(', '));
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) throw httpError(400, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ email: normalizedEmail, passwordHash });
    await user.save();

    const token = generateToken(user._id);
    setAuthCookie(res, token);
    res.status(201).json({ success: true, user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
};

export const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw httpError(400, errors.array().map((error) => error.msg).join(', '));
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw httpError(401, 'Invalid credentials');

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) throw httpError(401, 'Invalid credentials');

    const token = generateToken(user._id);
    setAuthCookie(res, token);
    res.json({ success: true, user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
};

export const logout = async (req, res) => {
    res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
    res.json({ success: true });
};

export const getProfile = async (req, res) => {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) throw httpError(404, 'User not found');
    res.json({ success: true, user });
};

