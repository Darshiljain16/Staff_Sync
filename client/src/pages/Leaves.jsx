import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Avatar, Empty, Icon, PageHeader, StatusBadge, Tabs } from '../components/ui';
import { fmtDate, todayInput } from '../utils';

const BLANK = { type: 'casual', startDate: '', endDate: '', reason: '' };

export default function Leaves() {
  const { user } = useAuth();
  const canReview = user.role !== 'employee';
  const [tab, setTab] = useState('mine');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api
      .get('/leaves', { params: { scope: tab } })
      .then((res) => setItems(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, [tab]);
  useEffect(load, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const apply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', form);
      setForm(BLANK);
      setMsg({ ok: 'Leave request submitted' });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const review = async (leave, status) => {
    try {
      await api.patch(`/leaves/${leave._id}/status`, { status });
      setMsg({ ok: `Leave ${status}` });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const withdraw = async (leave) => {
    try {
      await api.delete(`/leaves/${leave._id}`);
      setMsg({ ok: 'Leave request withdrawn' });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const days = (l) => Math.round((new Date(l.endDate) - new Date(l.startDate)) / 864e5) + 1;

  return (
    <>
      <PageHeader title="Leaves" subtitle="Apply for time off and track approvals." />
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {canReview && (
        <Tabs items={[['mine', 'My leaves'], ['review', 'To review']]} value={tab} onChange={setTab} />
      )}

      {tab === 'mine' && (
        <form className="card mb-4" onSubmit={apply}>
          <div className="card-header">Apply for leave</div>
          <div className="card-body row g-3">
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={set('type')}>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="annual">Annual</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">From</label>
              <input type="date" className="form-control" required min={todayInput()} value={form.startDate} onChange={set('startDate')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">To</label>
              <input type="date" className="form-control" required min={form.startDate || todayInput()} value={form.endDate} onChange={set('endDate')} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Reason</label>
              <input className="form-control" required value={form.reason} onChange={set('reason')} />
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-primary">
              <Icon name="send" className="me-2" />
              Submit request
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                {tab === 'review' && <th>Employee</th>}
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id}>
                  {tab === 'review' && (
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={l.employee?.name} size={32} />
                        <div>
                          <div className="fw-semibold">{l.employee?.name}</div>
                          <div className="small text-muted">{l.employee?.department}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="text-capitalize">{l.type}</td>
                  <td className="text-nowrap">
                    {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                    <div className="small text-muted">{days(l)} day{days(l) > 1 ? 's' : ''}</div>
                  </td>
                  <td>{l.reason}</td>
                  <td>
                    <StatusBadge status={l.status} />
                    {l.reviewedBy && <div className="small text-muted mt-1">by {l.reviewedBy.name}</div>}
                  </td>
                  <td className="text-end text-nowrap">
                    {tab === 'mine' && l.status === 'pending' && (
                      <button className="btn btn-sm btn-light text-danger" onClick={() => withdraw(l)}>
                        Withdraw
                      </button>
                    )}
                    {tab === 'review' && l.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-success me-1" onClick={() => review(l, 'approved')}>
                          Approve
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => review(l, 'rejected')}>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <Empty icon="calendar2-x" text="No leave requests" />}
        </div>
      </div>
    </>
  );
}
