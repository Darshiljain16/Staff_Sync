import { Router } from 'express';
import Timesheet from '../models/Timesheet.js';
import { protect, authorize } from '../middleware/auth.js';
import { addDays, asyncHandler, canManage, manageableIds, mondayOf, MANAGEMENT } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Normalises :weekStart to the Monday of that week, or answers 400
const weekOf = (req, res) => {
  if (!DATE.test(req.params.weekStart)) {
    res.status(400).json({ message: 'Invalid week' });
    return null;
  }
  return mondayOf(req.params.weekStart);
};

// My timesheet for a week (an empty draft if nothing was saved yet)
router.get(
  '/week/:weekStart',
  asyncHandler(async (req, res) => {
    const weekStart = weekOf(req, res);
    if (!weekStart) return;
    const sheet = await Timesheet.findOne({ employee: req.user._id, weekStart });
    res.json(sheet || { weekStart, entries: [], status: 'draft', totalHours: 0 });
  })
);

// Save my timesheet as a draft
router.put(
  '/week/:weekStart',
  asyncHandler(async (req, res) => {
    const weekStart = weekOf(req, res);
    if (!weekStart) return;

    let sheet = await Timesheet.findOne({ employee: req.user._id, weekStart });
    if (sheet && ['submitted', 'approved'].includes(sheet.status)) {
      return res.status(400).json({ message: `This timesheet is ${sheet.status} and can no longer be edited` });
    }

    const days = new Set(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));
    const perDay = {};
    const entries = [];
    for (const e of Array.isArray(req.body.entries) ? req.body.entries : []) {
      const hours = Number(e.hours);
      if (!days.has(e.date)) return res.status(400).json({ message: 'Each entry must fall inside the selected week' });
      if (!String(e.project || '').trim()) return res.status(400).json({ message: 'Every entry needs a project' });
      if (!(hours >= 0.25 && hours <= 24)) return res.status(400).json({ message: 'Hours must be between 0.25 and 24' });
      perDay[e.date] = (perDay[e.date] || 0) + hours;
      if (perDay[e.date] > 24) return res.status(400).json({ message: `More than 24 hours logged on ${e.date}` });
      entries.push({ date: e.date, project: String(e.project).trim(), description: String(e.description || '').trim(), hours });
    }

    sheet = sheet || new Timesheet({ employee: req.user._id, weekStart });
    sheet.entries = entries;
    sheet.status = 'draft';
    await sheet.save();
    res.json(sheet);
  })
);

router.post(
  '/week/:weekStart/submit',
  asyncHandler(async (req, res) => {
    const weekStart = weekOf(req, res);
    if (!weekStart) return;

    const sheet = await Timesheet.findOne({ employee: req.user._id, weekStart });
    if (!sheet || sheet.entries.length === 0) return res.status(400).json({ message: 'Add at least one entry first' });
    if (!['draft', 'rejected'].includes(sheet.status)) {
      return res.status(400).json({ message: `This timesheet is already ${sheet.status}` });
    }
    sheet.status = 'submitted';
    sheet.submittedAt = new Date();
    await sheet.save();
    res.json(sheet);
  })
);

// My recent timesheets
router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json(await Timesheet.find({ employee: req.user._id }).sort({ weekStart: -1 }).limit(12));
  })
);

// Timesheets of the people I manage (?status=submitted|approved|rejected, default submitted)
router.get(
  '/review',
  authorize(...MANAGEMENT),
  asyncHandler(async (req, res) => {
    const status = ['submitted', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'submitted';
    const sheets = await Timesheet.find({ status, employee: { $in: await manageableIds(req.user) } })
      .populate('employee', 'name department')
      .sort({ submittedAt: 1 });
    res.json(sheets);
  })
);

router.patch(
  '/:id/status',
  authorize(...MANAGEMENT),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const sheet = await Timesheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Timesheet not found' });
    if (!(await canManage(req.user, sheet.employee))) {
      return res.status(403).json({ message: 'You cannot review this timesheet' });
    }
    if (sheet.status !== 'submitted') return res.status(400).json({ message: 'Only submitted timesheets can be reviewed' });

    sheet.status = status;
    sheet.reviewedBy = req.user._id;
    await sheet.save();
    res.json(sheet);
  })
);

export default router;
