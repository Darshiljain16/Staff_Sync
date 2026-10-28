import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';
import { Alert, Icon } from '../components/ui';

const DEMO = [
  ['Admin', 'admin@staffsync.com'],
  ['CEO', 'ceo@staffsync.com'],
  ['HR', 'hr@staffsync.com'],
  ['Manager', 'manager@staffsync.com'],
  ['Employee', 'rahul@staffsync.com'],
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setMsg({ err: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-split">
      <div className="login-hero">
        <div className="brand px-0">
          <span className="brand-logo">
            <Icon name="people-fill" />
          </span>
          StaffSync
        </div>
        <h1 className="mt-4">Everything HR,<br />in one place.</h1>
        <p className="text-white-50 fs-5">Employees, leaves, attendance, timesheets and training for your whole company.</p>
        <div className="hero-point"><Icon name="diagram-3-fill" /> Clear reporting lines from employee to CEO</div>
        <div className="hero-point"><Icon name="clock-history" /> One-click check in and check out</div>
        <div className="hero-point"><Icon name="journal-check" /> Weekly timesheets with manager approval</div>
      </div>
      <div className="login-form">
        <div style={{ width: 380, maxWidth: '100%' }}>
          <h2 className="fw-bold mb-1">Welcome back</h2>
          <p className="text-muted mb-4">Sign in to your StaffSync account</p>
          <Alert msg={msg} onClose={() => setMsg(null)} />
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary w-100 py-2" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="mt-4">
            <div className="small text-muted mb-2">Demo accounts (password <code>Password@123</code>)</div>
            <div className="d-flex flex-wrap gap-2">
              {DEMO.map(([label, email]) => (
                <button key={email} type="button" className="demo-btn" onClick={() => setForm({ email, password: 'Password@123' })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
