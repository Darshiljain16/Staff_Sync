import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Timesheets from './pages/Timesheets';
import Training from './pages/Training';
import Announcements from './pages/Announcements';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="employees"
          element={
            <Protected roles={['admin', 'ceo', 'hr', 'manager']}>
              <Employees />
            </Protected>
          }
        />
        <Route path="leaves" element={<Leaves />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="training" element={<Training />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
