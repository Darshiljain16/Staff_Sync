import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, PageHeader } from '../components/ui';
import { fmtDate } from '../utils';

export default function Announcements() {
  const { user } = useAuth();
  const isHr = user.role === 'hr';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', body: '' });
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api
      .get('/announcements')
      .then((res) => setItems(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, []);
  useEffect(load, [load]);

  const post = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', form);
      setForm({ title: '', body: '' });
      setMsg({ ok: 'Announcement posted' });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  return (
    <>
      <PageHeader title="Announcements" />
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {isHr && (
        <form className="card shadow-sm mb-4" onSubmit={post}>
          <div className="card-header fw-semibold">Post an announcement</div>
          <div className="card-body">
            <input
              className="form-control mb-2"
              placeholder="Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="form-control"
              rows={3}
              placeholder="Message"
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div className="card-footer">
            <button className="btn btn-primary">Post</button>
          </div>
        </form>
      )}

      {items.length === 0 && <p className="text-muted">No announcements yet.</p>}
      {items.map((a) => (
        <div className="card shadow-sm mb-3" key={a._id}>
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <h3 className="h5">{a.title}</h3>
              {isHr && (
                <button className="btn btn-sm btn-outline-danger align-self-start" onClick={() => remove(a._id)}>
                  Delete
                </button>
              )}
            </div>
            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
              {a.body}
            </p>
            <div className="small text-muted">
              {a.author?.name} · {fmtDate(a.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
