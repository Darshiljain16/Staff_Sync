import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Avatar, PageHeader, StatusBadge } from '../components/ui';
import { fmtDate } from '../utils';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState(null);

  const saveDetails = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/me', form);
      setUser(data);
      setMsg({ ok: 'Profile updated' });
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setMsg({ err: 'New passwords do not match' });
    try {
      await api.put('/auth/me', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg({ ok: 'Password changed' });
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Your details and account security." />
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <Avatar name={user.name} size={72} />
              <h2 className="h5 mt-3 mb-1">{user.name}</h2>
              <StatusBadge status={user.role} />
              <dl className="row text-start mt-4 mb-0 small">
                <dt className="col-5 text-muted">Email</dt>
                <dd className="col-7 text-break">{user.email}</dd>
                <dt className="col-5 text-muted">Department</dt>
                <dd className="col-7">{user.department || '—'}</dd>
                <dt className="col-5 text-muted">Designation</dt>
                <dd className="col-7">{user.designation || '—'}</dd>
                <dt className="col-5 text-muted">Reports to</dt>
                <dd className="col-7">{user.manager?.name || '—'}</dd>
                <dt className="col-5 text-muted">Joined</dt>
                <dd className="col-7">{fmtDate(user.joinDate)}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <form className="card mb-3" onSubmit={saveDetails}>
            <div className="card-header">Contact details</div>
            <div className="card-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Full name</label>
                <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary">Save changes</button>
            </div>
          </form>

          <form className="card" onSubmit={changePassword}>
            <div className="card-header">Change password</div>
            <div className="card-body row g-3">
              <div className="col-md-4">
                <label className="form-label">Current password</label>
                <input type="password" className="form-control" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">New password</label>
                <input type="password" className="form-control" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Confirm new password</label>
                <input type="password" className="form-control" required minLength={6} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary">Update password</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
