import { Router } from 'express';
import Leave from '../models/Leave.js';
import Attendance from '../models/Attendance.js';
import Training from '../models/Training.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, localDate, teamIds } from '../utils/helpers.js';

const router = Router();
router.use(protect);

// Role-aware summary cards: [{ label, value }]
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.user;
    const today = localDate();
    let stats;

    if (me.role === 'hr') {
      const [employees, pending, present, trainings] = await Promise.all([
        User.countDocuments({ active: true }),
        Leave.countDocuments({ status: 'pending', employee: { $ne: me._id } }),
        Attendance.countDocuments({ date: today }),
        Training.countDocuments(),
      ]);
      stats = [
        { label: 'Active employees', value: employees },
        { label: 'Pending leave requests', value: pending },
        { label: 'Checked in today', value: present },
        { label: 'Training programs', value: trainings },
      ];
    } else if (me.role === 'manager') {
      const ids = await teamIds(me);
      const [pending, present, trainings] = await Promise.all([
        Leave.countDocuments({ status: 'pending', employee: { $in: ids } }),
        Attendance.countDocuments({ date: today, employee: { $in: ids } }),
        Training.countDocuments({ 'participants.user': { $in: ids } }),
      ]);
      stats = [
        { label: 'Team size', value: ids.length },
        { label: 'Pending team leaves', value: pending },
        { label: 'Team checked in today', value: present },
        { label: 'Team trainings', value: trainings },
      ];
    } else {
      const [pending, today_, active] = await Promise.all([
        Leave.countDocuments({ status: 'pending', employee: me._id }),
        Attendance.findOne({ employee: me._id, date: today }),
        Training.countDocuments({ participants: { $elemMatch: { user: me._id, status: { $ne: 'completed' } } } }),
      ]);
      stats = [
        { label: 'My pending leaves', value: pending },
        { label: "Today's attendance", value: today_ ? (today_.checkOut ? 'Checked out' : 'Checked in') : 'Not marked' },
        { label: 'Active trainings', value: active },
      ];
    }

    const announcements = await Announcement.find().populate('author', 'name').sort({ createdAt: -1 }).limit(3);
    res.json({ stats, announcements });
  })
);

export default router;
