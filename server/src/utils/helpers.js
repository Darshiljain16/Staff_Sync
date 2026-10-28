import User from '../models/User.js';

// Roles that can review other people's work (leaves, timesheets) and see attendance
export const MANAGEMENT = ['admin', 'ceo', 'hr', 'manager'];

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

const pad = (n) => String(n).padStart(2, '0');

// Local-time YYYY-MM-DD (attendance and timesheets are keyed by calendar day)
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + n));
};

// Monday of the week containing dateStr
export const mondayOf = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return localDate(new Date(y, m - 1, d - ((day + 6) % 7)));
};

// Ids of the people this user is allowed to manage (never includes themselves):
//   admin / ceo -> everyone, hr -> employees and managers, manager -> direct reports
export const manageableIds = async (actor) => {
  let filter;
  if (actor.role === 'admin' || actor.role === 'ceo') filter = { active: true };
  else if (actor.role === 'hr') filter = { active: true, role: { $in: ['employee', 'manager'] } };
  else if (actor.role === 'manager') filter = { active: true, manager: actor._id };
  else return [];
  const ids = await User.find(filter).distinct('_id');
  return ids.filter((id) => !id.equals(actor._id));
};

export const canManage = async (actor, targetId) => {
  if (actor._id.equals(targetId)) return false;
  return (await manageableIds(actor)).some((id) => id.equals(targetId));
};
