import { Router } from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler, pick, MANAGEMENT } from '../utils/helpers.js';

const router = Router();
router.use(protect, authorize(...MANAGEMENT));

const FIELDS = ['name', 'email', 'role', 'department', 'designation', 'phone', 'manager', 'joinDate', 'active'];

// Reporting line: employee -> manager or CEO, manager -> CEO, HR -> CEO, admin/CEO -> nobody
const MANAGER_ROLES = { employee: ['manager', 'ceo'], manager: ['ceo'], hr: ['ceo'], ceo: [], admin: [] };

// Admin can create any role; HR can only create managers and employees
const assignableRoles = (actor) => (actor.role === 'admin' ? Object.keys(MANAGER_ROLES) : ['manager', 'employee']);

const checkReporting = async (role, managerId) => {
  const allowed = MANAGER_ROLES[role];
  if (!allowed || allowed.length === 0) return null;
  if (!managerId) return `Please choose a manager for this ${role}`;
  const boss = await User.exists({ _id: managerId, active: true, role: { $in: allowed } });
  return boss ? null : `The manager of a ${role} must be: ${allowed.join(' or ')}`;
};

// HR may only touch managers and employees; admin may touch anyone
const canEdit = (actor, target) => actor.role === 'admin' || ['manager', 'employee'].includes(target.role);

// HR/admin/CEO see everyone, a manager sees their team
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'manager' ? { manager: req.user._id } : {};
    res.json(await User.find(filter).populate('manager', 'name role').sort({ name: 1 }));
  })
);

router.post(
  '/',
  authorize('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const data = pick(req.body, FIELDS);
    data.role = data.role || 'employee';
    if (!assignableRoles(req.user).includes(data.role)) {
      return res.status(403).json({ message: `You cannot create a ${data.role}` });
    }
    if (!data.manager) data.manager = null;
    const problem = await checkReporting(data.role, data.manager);
    if (problem) return res.status(400).json({ message: problem });
    if (MANAGER_ROLES[data.role].length === 0) data.manager = null;

    const user = await User.create({ ...data, password: req.body.password });
    res.status(201).json(await user.populate('manager', 'name role'));
  })
);

router.put(
  '/:id',
  authorize('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    if (!canEdit(req.user, user)) return res.status(403).json({ message: `You cannot edit a ${user.role}` });

    const data = pick(req.body, FIELDS);
    if (data.manager === '') data.manager = null;
    const isSelf = user._id.equals(req.user._id);
    if (isSelf && ((data.role && data.role !== user.role) || data.active === false)) {
      return res.status(400).json({ message: 'You cannot change your own role or deactivate yourself' });
    }
    if (data.role && !assignableRoles(req.user).includes(data.role)) {
      return res.status(403).json({ message: `You cannot make someone a ${data.role}` });
    }

    const role = data.role || user.role;
    const manager = data.manager !== undefined ? data.manager : user.manager;
    const problem = await checkReporting(role, manager);
    if (problem) return res.status(400).json({ message: problem });
    if (MANAGER_ROLES[role].length === 0) data.manager = null;

    const leavingTeamLead = (data.role && data.role !== user.role) || data.active === false;
    if (leavingTeamLead && (await User.exists({ manager: user._id, active: true }))) {
      return res.status(400).json({ message: 'Move this person’s team to another manager first' });
    }

    Object.assign(user, data);
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json(await user.populate('manager', 'name role'));
  })
);

router.delete(
  '/:id',
  authorize('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    if (user._id.equals(req.user._id)) return res.status(400).json({ message: 'You cannot delete yourself' });
    if (!canEdit(req.user, user)) return res.status(403).json({ message: `You cannot delete a ${user.role}` });
    if (await User.exists({ manager: user._id })) {
      return res.status(400).json({ message: 'Move this person’s team to another manager first' });
    }
    await user.deleteOne();
    res.json({ message: 'Employee deleted' });
  })
);

export default router;
