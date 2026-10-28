import User from '../models/User.js';

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// Local-time YYYY-MM-DD (attendance is keyed by calendar day)
export const localDate = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

// Ids of the active employees reporting to this manager
export const teamIds = (manager) => User.find({ manager: manager._id, active: true }).distinct('_id');

// HR can manage anyone; a manager can manage only their direct reports.
export const canManage = async (actor, targetId) => {
  if (actor.role === 'hr') return true;
  if (actor.role === 'manager') return !!(await User.exists({ _id: targetId, manager: actor._id }));
  return false;
};
