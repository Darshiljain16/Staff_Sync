import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Avatar, Empty, Icon, PageHeader, StatusBadge, Tabs } from '../components/ui';
import { fmtTime, todayInput } from '../utils';

export default function Attendance() {
  const { user } = useAuth();
  const canView = user.role !== 'employee';
  const [tab, setTab] = useState('mine');
  const [msg, setMsg] = useState(null);
  const [now, setNow] = useState(new Date());

  const [mine, setMine] = useState([]); // my records this month
  const [date, setDate] = useState(todayInput());
  const [records, setRecords] = useState([]); // records of the people I manage for `date`

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadMine = useCallback(() => {
    api
      .get('/attendance/me')
      .then((res) => setMine(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, []);
  useEffect(loadMine, [loadMine]);

  useEffect(() => {
    if (tab !== 'team') return;
    api
      .get('/attendance', { params: { date } })
      .then((res) => setRecords(res.data.records))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, [tab, date]);

  const today = mine.find((r) => r.date === todayInput());
  const hoursThisMonth = mine.reduce((sum, r) => sum + (r.hours || 0), 0);

  const mark = async (action) => {
    try {
      await api.post(`/attendance/${action}`);
      setMsg({ ok: action === 'check-in' ? 'Checked in. Have a great day!' : 'Checked out. See you tomorrow!' });
      loadMine();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  return (
    <>
      <PageHeader title="Attendance" subtitle="Check in when you start and check out when you finish." />
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {canView && <Tabs items={[['mine', 'My attendance'], ['team', 'My people']]} value={tab} onChange={setTab} />}

      {tab === 'mine' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body d-flex flex-wrap align-items-center gap-3">
                  <div className="flex-grow-1">
                    <div className="clock">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    <div className="text-muted">
                      {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                      {today && ` · In ${fmtTime(today.checkIn)}${today.checkOut ? ` · Out ${fmtTime(today.checkOut)}` : ''}`}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-success px-3" disabled={!!today} onClick={() => mark('check-in')}>
                      <Icon name="box-arrow-in-right" className="me-2" />
                      Check in
                    </button>
                    <button className="btn btn-outline-danger px-3" disabled={!today || !!today.checkOut} onClick={() => mark('check-out')}>
                      <Icon name="box-arrow-right" className="me-2" />
                      Check out
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="stat-value">{mine.length}</div>
                  <div className="stat-label">Days present this month</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="stat-value">{Math.round(hoursThisMonth * 10) / 10}</div>
                  <div className="stat-label">Hours this month</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">This month</div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((r) => (
                    <tr key={r._id}>
                      <td>{r.date}</td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td>{r.hours ?? '—'}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mine.length === 0 && <Empty icon="clock" text="No records yet this month" />}
            </div>
          </div>
        </>
      )}

      {tab === 'team' && (
        <>
          <input type="date" className="form-control w-auto mb-3" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="card">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={r.employee?.name} size={30} />
                          {r.employee?.name}
                        </div>
                      </td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length === 0 && <Empty icon="clock" text="Nobody checked in on this day" />}
            </div>
          </div>
        </>
      )}
    </>
  );
}
