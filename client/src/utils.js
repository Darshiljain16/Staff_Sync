const pad = (n) => String(n).padStart(2, '0');

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—');

// Local YYYY-MM-DD, matches what <input type="date"> uses and what the API stores for attendance
export const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayInput = () => dateStr();
export const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const addDays = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  return dateStr(new Date(y, m - 1, d + n));
};
export const mondayOf = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return dateStr(new Date(y, m - 1, d - ((new Date(y, m - 1, d).getDay() + 6) % 7)));
};
export const fmtDay = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
};
