import { Router } from 'express';
import Leave from '../models/Leave.js';
import Attendance from '../models/Attendance.js';
import Timesheet from '../models/Timesheet.js';
import Training from '../models/Training.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import { protect } from '../middleware/auth.js';
import { addDays, asyncHandler, localDate, manageableIds, mondayOf } from '../utils/helpers.js';

const router = Router();
router.use(protect);

// Role-aware summary cards: [{ label, value, icon }] plus my last 7 days of hours and the latest news
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.user;
    const today = localDate();
    let stats;

    if (me.role === 'employee') {
      const [pending, todays, sheet, active] = await Promise.all([
        Leave.countDocuments({ status: 'pending', employee: me._id }),
        Attendance.findOne({ employee: me._id, date: today }),
        Timesheet.findOne({ employee: me._id, weekStart: mondayOf(today) }),
        Training.countDocuments({ participants: { $elemMatch: { user: me._id, status: { $ne: 'completed' } } } }),
      ]);
      stats = [
        { label: 'My pending leaves', value: pending, icon: 'calendar-check' },
        { label: "Today's attendance", value: todays ? (todays.checkOut ? 'Checked out' : 'Checked in') : 'Not marked', icon: 'clock-history' },
        { label: 'Hours this week', value: sheet ? sheet.totalHours : 0, icon: 'journal-text' },
        { label: 'Active trainings', value: active, icon: 'mortarboard' },
      ];
    } else {
      const ids = await manageableIds(me);
      const [pendingLeaves, pendingSheets, present] = await Promise.all([
        Leave.countDocuments({ status: 'pending', employee: { $in: ids } }),
        Timesheet.countDocuments({ status: 'submitted', employee: { $in: ids } }),
        Attendance.countDocuments({ date: today, employee: { $in: ids } }),
      ]);
      const everyone = me.role === 'manager' ? ids.length : await User.countDocuments({ active: true });
      stats = [
        { label: me.role === 'manager' ? 'Team size' : 'Active employees', value: everyone, icon: 'people' },
        { label: 'Leaves to review', value: pendingLeaves, icon: 'calendar-check' },
        { label: 'Timesheets to review', value: pendingSheets, icon: 'journal-text' },
        { label: 'Checked in today', value: present, icon: 'clock-history' },
      ];
    }

    // my hours for the last 7 days (for the little bar chart)
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const records = await Attendance.find({ employee: me._id, date: { $in: days } });
    const week = days.map((date) => ({ date, hours: records.find((r) => r.date === date)?.hours || 0 }));

    const announcements = await Announcement.find().populate('author', 'name').sort({ createdAt: -1 }).limit(3);
    res.json({ stats, week, announcements });
  })
);

export default router;
