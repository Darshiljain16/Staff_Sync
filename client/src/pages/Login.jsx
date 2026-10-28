import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';
import { Alert } from '../components/ui';

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
    <div className="login-wrap p-3">
      <div className="card shadow-sm" style={{ width: 400, maxWidth: '100%' }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1">StaffSync</h1>
          <p className="text-muted">Modern human resource management</p>
          <Alert msg={msg} onClose={() => setMsg(null)} />
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="small text-muted mt-3">
            Demo (after <code>npm run seed</code>): hr@staffsync.com, manager@staffsync.com, rahul@staffsync.com —
            password <code>Password@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
