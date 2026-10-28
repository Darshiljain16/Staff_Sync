import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Empty, Icon, PageHeader } from '../components/ui';
import { fmtDate } from '../utils';

const TONES = ['#4f46e5', '#0ea5e9', '#f59e0b', '#10b981'];

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

  const max = data ? Math.max(8, ...data.week.map((d) => d.hours)) : 8;

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]} 👋`} subtitle="Here is what’s happening today." />
      <Alert msg={msg} onClose={() => setMsg(null)} />
      {data && (
        <>
          <div className="row g-3 mb-4">
            {data.stats.map((s, i) => (
              <div className="col-6 col-xl-3" key={s.label}>
                <div className="card h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="stat-icon" style={{ background: `${TONES[i % 4]}1a`, color: TONES[i % 4] }}>
                      <Icon name={s.icon} />
                    </div>
                    <div>
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3">
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header">My hours — last 7 days</div>
                <div className="card-body">
                  <div className="bars">
                    {data.week.map((d) => (
                      <div className="bar-col" key={d.date}>
                        <div className="small text-muted mb-1">{d.hours || ''}</div>
                        <div className={`bar ${d.hours ? '' : 'empty-bar'}`} style={{ height: `${(d.hours / max) * 100}%` }} />
                        <div className="small text-muted mt-1">{new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header">Latest announcements</div>
                <div className="card-body py-2">
                  {data.announcements.length === 0 && <Empty icon="megaphone" text="Nothing posted yet" />}
                  {data.announcements.map((a) => (
                    <div className="news-item" key={a._id}>
                      <div className="fw-semibold">{a.title}</div>
                      <div className="text-body-secondary">{a.body}</div>
                      <div className="small text-muted mt-1">
                        {a.author?.name} · {fmtDate(a.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
