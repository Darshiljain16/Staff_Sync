import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, PageHeader } from '../components/ui';
import { fmtDate } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, []);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} />
      <Alert msg={msg} onClose={() => setMsg(null)} />
      {data && (
        <>
          <div className="row g-3 mb-4">
            {data.stats.map((s) => (
              <div className="col-6 col-lg-3" key={s.label}>
                <div className="card stat-card shadow-sm h-100">
                  <div className="card-body">
                    <div className="text-muted small">{s.label}</div>
                    <div className="value">{s.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card shadow-sm">
            <div className="card-header fw-semibold">Latest announcements</div>
            <ul className="list-group list-group-flush">
              {data.announcements.length === 0 && <li className="list-group-item text-muted">Nothing posted yet.</li>}
              {data.announcements.map((a) => (
                <li className="list-group-item" key={a._id}>
                  <div className="fw-semibold">{a.title}</div>
                  <div>{a.body}</div>
                  <div className="small text-muted">
                    {a.author?.name} · {fmtDate(a.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
