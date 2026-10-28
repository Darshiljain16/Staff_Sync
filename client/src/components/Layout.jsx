import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', roles: ['hr', 'manager', 'employee'], end: true },
  { to: '/employees', label: 'Employees', roles: ['hr', 'manager'] },
  { to: '/leaves', label: 'Leaves', roles: ['hr', 'manager', 'employee'] },
  { to: '/attendance', label: 'Attendance', roles: ['hr', 'manager', 'employee'] },
  { to: '/training', label: 'Training', roles: ['hr', 'manager', 'employee'] },
  { to: '/announcements', label: 'Announcements', roles: ['hr', 'manager', 'employee'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column flex-md-row">
      <aside className="sidebar p-3 d-flex flex-column">
        <div className="brand mb-3">StaffSync</div>
        <nav className="nav flex-md-column gap-1 flex-grow-1">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-3 text-white-50 small">
          <div className="text-white">{user.name}</div>
          <div className="text-capitalize mb-2">{user.role}</div>
          <button className="btn btn-outline-light btn-sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-grow-1 p-3 p-md-4">
        <Outlet />
      </main>
    </div>
  );
}
