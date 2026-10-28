import { Router } from 'express';
import Training from '../models/Training.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, pick, teamIds } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const populate = (q) => q.populate('createdBy', 'name').populate('participants.user', 'name department');

// Everyone can browse the catalogue
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await populate(Training.find().sort({ startDate: -1, createdAt: -1 })));
  })
);

// A manager may only add their own team; HR may add any active employee.
const allowedUserIds = async (actor, ids = []) => {
  const pool = actor.role === 'hr' ? await User.find({ active: true }).distinct('_id') : await teamIds(actor);
  const allowed = new Set(pool.map(String));
  return ids.filter((id) => allowed.has(String(id)));
};

router.post(
  '/',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const data = pick(req.body, ['title', 'description', 'trainer', 'startDate', 'endDate']);
    const ids = await allowedUserIds(req.user, req.body.participantIds);
    const training = await Training.create({
      ...data,
      createdBy: req.user._id,
      participants: ids.map((user) => ({ user })),
    });
    res.status(201).json(await populate(Training.findById(training._id)));
  })
);

router.post(
  '/:id/enroll',
  asyncHandler(async (req, res) => {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });
    if (training.participants.some((p) => p.user.equals(req.user._id))) {
      return res.status(400).json({ message: 'You are already enrolled' });
    }
    training.participants.push({ user: req.user._id });
    await training.save();
    res.json(await populate(Training.findById(training._id)));
  })
);

router.patch(
  '/:id/progress',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be in-progress or completed' });
    }
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });

    const entry = training.participants.find((p) => p.user.equals(req.user._id));
    if (!entry) return res.status(403).json({ message: 'You are not part of this training' });

    entry.status = status;
    entry.completedAt = status === 'completed' ? new Date() : undefined;
    await training.save();
    res.json(await populate(Training.findById(training._id)));
  })
);

router.delete(
  '/:id',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });
    if (req.user.role !== 'hr' && !training.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the creator or HR can delete this training' });
    }
    await training.deleteOne();
    res.json({ message: 'Training deleted' });
  })
);

export default router;
