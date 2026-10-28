import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user || !user.active || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json(await req.user.populate('manager', 'name role'));
  })
);

export default router;
