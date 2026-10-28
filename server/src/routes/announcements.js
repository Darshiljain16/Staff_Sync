import { Router } from 'express';
import Announcement from '../models/Announcement.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, pick } from '../utils/helpers.js';

const router = Router();
router.use(protect);

const POSTERS = ['admin', 'ceo', 'hr'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await Announcement.find().populate('author', 'name').sort({ createdAt: -1 }));
  })
);

router.post(
  '/',
  authorize(...POSTERS),
  asyncHandler(async (req, res) => {
    const item = await Announcement.create({ ...pick(req.body, ['title', 'body']), author: req.user._id });
    res.status(201).json(item);
  })
);

router.delete(
  '/:id',
  authorize(...POSTERS),
  asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  })
);

export default router;
