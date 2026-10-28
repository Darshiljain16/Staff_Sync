import { Router } from 'express';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, localDate, teamIds } from '../utils/helpers.js';

const router = Router();
router.use(protect);

router.post(
  '/check-in',
  asyncHandler(async (req, res) => {
    const date = localDate();
    if (await Attendance.exists({ employee: req.user._id, date })) {
      return res.status(400).json({ message: 'You already checked in today' });
    }
    const now = new Date();
    const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const record = await Attendance.create({
      employee: req.user._id,
      date,
      checkIn: now,
      status: late ? 'late' : 'present',
    });
    res.status(201).json(record);
  })
);

router.post(
  '/check-out',
  asyncHandler(async (req, res) => {
    const record = await Attendance.findOne({ employee: req.user._id, date: localDate() });
    if (!record) return res.status(400).json({ message: 'You have not checked in today' });
    if (record.checkOut) return res.status(400).json({ message: 'You already checked out today' });

    record.checkOut = new Date();
    record.hours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
    await record.save();
    res.json(record);
  })
);

// My records for a month (?month=YYYY-MM, defaults to the current month)
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : localDate().slice(0, 7);
    const records = await Attendance.find({
      employee: req.user._id,
      date: { $regex: `^${month}` },
    }).sort({ date: -1 });
    res.json(records);
  })
);

// HR: everyone, manager: team. Check-ins for one day.
router.get(
  '/',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : localDate();
    const ids = req.user.role === 'hr' ? await User.find({ active: true }).distinct('_id') : await teamIds(req.user);

    const records = await Attendance.find({ date, employee: { $in: ids } })
      .populate('employee', 'name department')
      .sort({ checkIn: 1 });
    res.json({ date, records });
  })
);

export default router;
