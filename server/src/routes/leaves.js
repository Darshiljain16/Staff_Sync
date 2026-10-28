import { Router } from 'express';
import Leave from '../models/Leave.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, canManage, manageableIds, pick, MANAGEMENT } from '../utils/helpers.js';

const router = Router();
router.use(protect);

// scope=mine (default): my own leaves
// scope=review (management roles): leaves I am allowed to approve or reject
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let filter = { employee: req.user._id };
    if (req.query.scope === 'review') {
      if (!MANAGEMENT.includes(req.user.role)) return res.status(403).json({ message: 'You do not have access to this' });
      filter = { employee: { $in: await manageableIds(req.user) } };
    }
    const leaves = await Leave.find(filter)
      .populate('employee', 'name department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = pick(req.body, ['type', 'startDate', 'endDate', 'reason']);
    if (new Date(data.endDate) < new Date(data.startDate)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    const overlap = await Leave.exists({
      employee: req.user._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: new Date(data.endDate) },
      endDate: { $gte: new Date(data.startDate) },
    });
    if (overlap) return res.status(400).json({ message: 'You already have a leave request for these dates' });

    const leave = await Leave.create({ ...data, employee: req.user._id });
    res.status(201).json(leave);
  })
);

// Employees can withdraw their own pending requests
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const leave = await Leave.findOne({ _id: req.params.id, employee: req.user._id });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be withdrawn' });
    await leave.deleteOne();
    res.json({ message: 'Leave request withdrawn' });
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
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.employee.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot review your own leave request' });
    }
    if (!(await canManage(req.user, leave.employee))) {
      return res.status(403).json({ message: 'You cannot review this employee’s leave' });
    }
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Leave was already reviewed' });

    leave.status = status;
    leave.reviewedBy = req.user._id;
    await leave.save();
    res.json(leave);
  })
);

export default router;
