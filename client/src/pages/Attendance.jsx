import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, PageHeader, StatusBadge } from '../components/ui';
import { fmtTime, todayInput } from '../utils';

export default function Attendance() {
  const { user } = useAuth();
  const canView = user.role !== 'employee';
  const [tab, setTab] = useState('mine');
  const [msg, setMsg] = useState(null);

  const [mine, setMine] = useState([]); // my records this month
  const [date, setDate] = useState(todayInput());
  const [records, setRecords] = useState([]); // everyone's (HR) or team's (manager) records for `date`

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

  const mark = async (action) => {
    try {
      await api.post(`/attendance/${action}`);
      setMsg({ ok: action === 'check-in' ? 'Checked in' : 'Checked out' });
      loadMine();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  return (
    <>
      <PageHeader title="Attendance" />
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {canView && (
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
              My attendance
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'team' ? 'active' : ''}`} onClick={() => setTab('team')}>
              {user.role === 'hr' ? 'Everyone' : 'My team'}
            </button>
          </li>
        </ul>
      )}

      {tab === 'mine' && (
        <>
          <div className="card shadow-sm mb-4">
            <div className="card-body d-flex flex-wrap align-items-center gap-3">
              <div className="flex-grow-1">
                <div className="fw-semibold">Today</div>
                <div className="text-muted">
                  {today
                    ? `In ${fmtTime(today.checkIn)}${today.checkOut ? ` · Out ${fmtTime(today.checkOut)}` : ''}`
                    : 'You have not checked in yet'}
                </div>
              </div>
              <button className="btn btn-success" disabled={!!today} onClick={() => mark('check-in')}>
                Check in
              </button>
              <button className="btn btn-outline-danger" disabled={!today || !!today.checkOut} onClick={() => mark('check-out')}>
                Check out
              </button>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header fw-semibold">This month</div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No records yet
                      </td>
                    </tr>
                  )}
                  {mine.map((r) => (
                    <tr key={r._id}>
                      <td>{r.date}</td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'team' && (
        <>
          <input type="date" className="form-control w-auto mb-3" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="card shadow-sm">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No check-ins on this day
                      </td>
                    </tr>
                  )}
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>{r.employee?.name}</td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
