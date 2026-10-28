import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Avatar, Icon, ROLE_LABEL } from './ui';

const MANAGEMENT = ['admin', 'ceo', 'hr', 'manager'];
const ALL = [...MANAGEMENT, 'employee'];

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'grid-1x2-fill', roles: ALL, end: true },
  { to: '/employees', label: 'Employees', icon: 'people-fill', roles: MANAGEMENT },
  { to: '/leaves', label: 'Leaves', icon: 'calendar2-check-fill', roles: ALL },
  { to: '/attendance', label: 'Attendance', icon: 'clock-history', roles: ALL },
  { to: '/timesheets', label: 'Timesheets', icon: 'journal-text', roles: ALL },
  { to: '/training', label: 'Training', icon: 'mortarboard-fill', roles: ALL },
  { to: '/announcements', label: 'Announcements', icon: 'megaphone-fill', roles: ALL },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className={`backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-logo">
            <Icon name="people-fill" />
          </span>
          StaffSync
        </div>
        <nav>
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="side-link" onClick={() => setOpen(false)}>
              <Icon name={n.icon} />
              {n.to === '/employees' && user.role === 'manager' ? 'My team' : n.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <Avatar name={user.name} size={38} />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="name text-truncate">{user.name}</div>
            <div className="role">{ROLE_LABEL[user.role]}</div>
          </div>
          <button className="btn btn-sm text-white-50 p-1" title="Sign out" onClick={signOut}>
            <Icon name="box-arrow-right" className="fs-5" />
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="btn btn-light" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="list" className="fs-5" />
          </button>
          <strong>StaffSync</strong>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
