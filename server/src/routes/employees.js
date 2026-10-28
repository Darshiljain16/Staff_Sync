import { Router } from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, pick } from '../utils/helpers.js';

const router = Router();
router.use(protect, authorize('hr', 'manager'));

const FIELDS = ['name', 'email', 'role', 'department', 'designation', 'phone', 'manager', 'joinDate', 'active'];

// HR sees everyone, a manager sees their own team
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'hr' ? {} : { manager: req.user._id };
    const users = await User.find(filter).populate('manager', 'name').sort({ name: 1 });
    res.json(users);
  })
);

router.post(
  '/',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const data = pick(req.body, FIELDS);
    if (data.manager === '') data.manager = null;
    const user = await User.create({ ...data, password: req.body.password });
    res.status(201).json(user);
  })
);

router.put(
  '/:id',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const data = pick(req.body, FIELDS);
    if (data.manager === '') data.manager = null;
    if (user._id.equals(req.user._id) && (data.role !== undefined || data.active === false)) {
      return res.status(400).json({ message: 'You cannot change your own role or deactivate yourself' });
    }
    Object.assign(user, data);
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json(user);
  })
);

router.delete(
  '/:id',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    if (req.user._id.equals(req.params.id)) return res.status(400).json({ message: 'You cannot delete yourself' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  })
);

export default router;
