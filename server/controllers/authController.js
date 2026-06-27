import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

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
        return res.status(400).json({ message: errors.array().map((error) => error.msg).join(', ') });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    try {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({ email: normalizedEmail, passwordHash });
        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({ token, user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to register user' });
    }
};

export const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array().map((error) => error.msg).join(', ') });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.json({ token, user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to log in' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to fetch profile' });
    }
};

