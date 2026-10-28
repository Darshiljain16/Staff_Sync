import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Avatar, Empty, Icon, PageHeader } from '../components/ui';
import { fmtDate } from '../utils';

export default function Announcements() {
  const { user } = useAuth();
  const canPost = ['admin', 'ceo', 'hr'].includes(user.role);
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
      <PageHeader title="Announcements" subtitle="News and updates from the company." />
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {canPost && (
        <form className="card mb-4" onSubmit={post}>
          <div className="card-header">Post an announcement</div>
          <div className="card-body">
            <input className="form-control mb-2" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="form-control" rows={3} placeholder="Message" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="card-footer">
            <button className="btn btn-primary">
              <Icon name="megaphone" className="me-2" />
              Post
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && (
        <div className="card">
          <Empty icon="megaphone" text="No announcements yet" />
        </div>
      )}
      {items.map((a) => (
        <div className="card mb-3" key={a._id}>
          <div className="card-body">
            <div className="d-flex gap-3">
              <Avatar name={a.author?.name} size={40} />
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <h2 className="h5 mb-0">{a.title}</h2>
                  {canPost && (
                    <button className="btn btn-sm btn-light text-danger" onClick={() => remove(a._id)} title="Delete">
                      <Icon name="trash" />
                    </button>
                  )}
                </div>
                <div className="small text-muted mb-2">
                  {a.author?.name} · {fmtDate(a.createdAt)}
                </div>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
