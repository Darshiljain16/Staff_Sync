const COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  present: 'success',
  late: 'warning',
  enrolled: 'secondary',
  'in-progress': 'info',
  completed: 'success',
  hr: 'danger',
  manager: 'primary',
  employee: 'secondary',
  active: 'success',
  inactive: 'secondary',
};

export function StatusBadge({ status }) {
  return <span className={`badge text-bg-${COLORS[status] || 'secondary'} text-capitalize`}>{status}</span>;
}

// msg = { ok: '...' } | { err: '...' } | null
export function Alert({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${msg.err ? 'danger' : 'success'} alert-dismissible`} role="alert">
      {msg.err || msg.ok}
      <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
    </div>
  );
}

export function PageHeader({ title, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <h2 className="h4 mb-0">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
