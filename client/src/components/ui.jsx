export const ROLE_LABEL = { admin: 'Admin', ceo: 'CEO', hr: 'HR', manager: 'Manager', employee: 'Employee' };

const COLORS = {
  pending: 'warning', approved: 'success', rejected: 'danger', submitted: 'info', draft: 'secondary',
  present: 'success', late: 'warning',
  enrolled: 'secondary', 'in-progress': 'info', completed: 'success',
  admin: 'dark', ceo: 'purple', hr: 'danger', manager: 'primary', employee: 'secondary',
  active: 'success', inactive: 'secondary',
};

export function StatusBadge({ status }) {
  return <span className={`soft soft-${COLORS[status] || 'secondary'}`}>{ROLE_LABEL[status] || status}</span>;
}

export const Icon = ({ name, className = '' }) => <i className={`bi bi-${name} ${className}`} />;

const HUES = [243, 199, 160, 28, 340, 270, 12, 190];
export function Avatar({ name = '?', size = 36 }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const hue = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 65% 52%)` }}>
      {initials}
    </span>
  );
}

// msg = { ok: '...' } | { err: '...' } | null
export function Alert({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${msg.err ? 'danger' : 'success'} alert-dismissible border-0 rounded-3`} role="alert">
      <Icon name={msg.err ? 'exclamation-circle' : 'check-circle'} className="me-2" />
      {msg.err || msg.ok}
      <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      <div className="d-flex gap-2">{children}</div>
    </div>
  );
}

export function Empty({ icon = 'inbox', text }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      {text}
    </div>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <ul className="nav nav-pills mb-3 gap-1">
      {items.map(([key, label]) => (
        <li className="nav-item" key={key}>
          <button className={`nav-link ${value === key ? 'active' : 'bg-white text-body'}`} onClick={() => onChange(key)}>
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
