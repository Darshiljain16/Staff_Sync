import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, PageHeader, StatusBadge } from '../components/ui';
import { fmtDate } from '../utils';

const BLANK = { title: '', description: '', trainer: '', startDate: '', endDate: '', participantIds: [] };

export default function Training() {
  const { user } = useAuth();
  const canManage = user.role !== 'employee';
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]); // who a manager/HR can assign
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api
      .get('/training')
      .then((res) => setItems(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!canManage) return;
    api
      .get('/employees')
      .then((res) => setPeople(res.data.filter((u) => u.active && u._id !== user._id)))
      .catch(() => {});
  }, [canManage, user._id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const togglePerson = (id) =>
    setForm({
      ...form,
      participantIds: form.participantIds.includes(id)
        ? form.participantIds.filter((x) => x !== id)
        : [...form.participantIds, id],
    });

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/training', form);
      setForm(null);
      setMsg({ ok: 'Training program created' });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const act = async (fn, okText) => {
    try {
      await fn();
      if (okText) setMsg({ ok: okText });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const enroll = (t) => act(() => api.post(`/training/${t._id}/enroll`), 'You are enrolled');
  const progress = (t, status) => act(() => api.patch(`/training/${t._id}/progress`, { status }));
  const remove = (t) => {
    if (window.confirm(`Delete "${t.title}"?`)) act(() => api.delete(`/training/${t._id}`), 'Training deleted');
  };

  return (
    <>
      <PageHeader title="Training & development">
        {canManage && (
          <button className="btn btn-primary" onClick={() => setForm(BLANK)}>
            + New program
          </button>
        )}
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {form && (
        <form className="card shadow-sm mb-4" onSubmit={create}>
          <div className="card-header fw-semibold">New training program</div>
          <div className="card-body row g-3">
            <div className="col-md-6">
              <label className="form-label">Title</label>
              <input className="form-control" required value={form.title} onChange={set('title')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Trainer</label>
              <input className="form-control" value={form.trainer} onChange={set('trainer')} />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={set('description')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Start</label>
              <input type="date" className="form-control" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">End</label>
              <input type="date" className="form-control" min={form.startDate} value={form.endDate} onChange={set('endDate')} />
            </div>
            <div className="col-12">
              <label className="form-label">Assign to {user.role === 'manager' ? 'your team' : 'employees'}</label>
              <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {people.length === 0 && <span className="text-muted">No employees available</span>}
                {people.map((p) => (
                  <div className="form-check" key={p._id}>
                    <input
                      id={`p-${p._id}`}
                      type="checkbox"
                      className="form-check-input"
                      checked={form.participantIds.includes(p._id)}
                      onChange={() => togglePerson(p._id)}
                    />
                    <label htmlFor={`p-${p._id}`} className="form-check-label">
                      {p.name} <span className="text-muted small">{p.department}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card-footer d-flex gap-2">
            <button className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && <p className="text-muted">No training programs yet.</p>}
      <div className="row g-3">
        {items.map((t) => {
          const mine = t.participants.find((p) => p.user?._id === user._id);
          const canDelete = user.role === 'hr' || (user.role === 'manager' && t.createdBy?._id === user._id);
          return (
            <div className="col-lg-6" key={t._id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h3 className="h5">{t.title}</h3>
                    {mine && <StatusBadge status={mine.status} />}
                  </div>
                  {t.description && <p className="mb-2">{t.description}</p>}
                  <div className="small text-muted mb-2">
                    {t.trainer && <>Trainer: {t.trainer} · </>}
                    {fmtDate(t.startDate)} → {fmtDate(t.endDate)} · by {t.createdBy?.name}
                  </div>
                  {canManage && (
                    <div className="small">
                      <div className="fw-semibold">Participants ({t.participants.length})</div>
                      {t.participants.length === 0 && <span className="text-muted">None yet</span>}
                      {t.participants.map((p) => (
                        <div key={p.user?._id}>
                          {p.user?.name} <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-footer d-flex gap-2 flex-wrap">
                  {!mine && (
                    <button className="btn btn-sm btn-primary" onClick={() => enroll(t)}>
                      Enroll
                    </button>
                  )}
                  {mine?.status === 'enrolled' && (
                    <button className="btn btn-sm btn-info" onClick={() => progress(t, 'in-progress')}>
                      Start
                    </button>
                  )}
                  {mine && mine.status !== 'completed' && (
                    <button className="btn btn-sm btn-success" onClick={() => progress(t, 'completed')}>
                      Mark complete
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => remove(t)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
