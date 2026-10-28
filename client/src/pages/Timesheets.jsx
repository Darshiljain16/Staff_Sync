import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Avatar, Empty, Icon, PageHeader, StatusBadge, Tabs } from '../components/ui';
import { addDays, fmtDay, fmtDate, mondayOf, todayInput } from '../utils';

export default function Timesheets() {
  const { user } = useAuth();
  const canReview = user.role !== 'employee';
  const [tab, setTab] = useState('mine');
  const [msg, setMsg] = useState(null);

  // ----- my timesheet -----
  const [week, setWeek] = useState(mondayOf(todayInput()));
  const [sheet, setSheet] = useState({ status: 'draft', entries: [] });
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const locked = ['submitted', 'approved'].includes(sheet.status);
  const total = rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

  const loadWeek = useCallback(() => {
    api
      .get(`/timesheets/week/${week}`)
      .then((res) => {
        setSheet(res.data);
        setRows(res.data.entries.map((e) => ({ ...e })));
      })
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, [week]);
  useEffect(loadWeek, [loadWeek]);

  const loadHistory = useCallback(() => {
    api.get('/timesheets/mine').then((res) => setHistory(res.data)).catch(() => {});
  }, []);
  useEffect(loadHistory, [loadHistory]);

  const setRow = (i, k, v) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRow = () =>
    setRows([
      ...rows,
      { date: days.includes(todayInput()) ? todayInput() : week, project: rows.at(-1)?.project || '', description: '', hours: 8 },
    ]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const save = async () => {
    const { data } = await api.put(`/timesheets/week/${week}`, { entries: rows.map((r) => ({ ...r, hours: Number(r.hours) })) });
    setSheet(data);
    return data;
  };

  const saveDraft = async () => {
    try {
      await save();
      setMsg({ ok: 'Draft saved' });
      loadHistory();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const submit = async () => {
    try {
      await save();
      const { data } = await api.post(`/timesheets/week/${week}/submit`);
      setSheet(data);
      setMsg({ ok: 'Timesheet submitted for approval' });
      loadHistory();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  // ----- review -----
  const [reviewStatus, setReviewStatus] = useState('submitted');
  const [toReview, setToReview] = useState([]);

  const loadReview = useCallback(() => {
    if (tab !== 'review') return;
    api
      .get('/timesheets/review', { params: { status: reviewStatus } })
      .then((res) => setToReview(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, [tab, reviewStatus]);
  useEffect(loadReview, [loadReview]);

  const review = async (s, status) => {
    try {
      await api.patch(`/timesheets/${s._id}/status`, { status });
      setMsg({ ok: `Timesheet ${status}` });
      loadReview();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  return (
    <>
      <PageHeader title="Timesheets" subtitle="Log the hours you worked each week and send them for approval." />
      <Alert msg={msg} onClose={() => setMsg(null)} />
      {canReview && <Tabs items={[['mine', 'My timesheet'], ['review', 'To review']]} value={tab} onChange={setTab} />}

      {tab === 'mine' && (
        <div className="row g-3">
          <div className="col-xl-9">
            <div className="card">
              <div className="card-header d-flex flex-wrap align-items-center gap-2">
                <button className="btn btn-sm btn-light" onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week">
                  <Icon name="chevron-left" />
                </button>
                <div className="fw-semibold">
                  {fmtDate(week)} – {fmtDate(addDays(week, 6))}
                </div>
                <button className="btn btn-sm btn-light" onClick={() => setWeek(addDays(week, 7))} aria-label="Next week">
                  <Icon name="chevron-right" />
                </button>
                <button className="btn btn-sm btn-light" onClick={() => setWeek(mondayOf(todayInput()))}>
                  This week
                </button>
                <span className="ms-auto">
                  <StatusBadge status={sheet.status} />
                </span>
              </div>
              <div className="card-body">
                {sheet.status === 'rejected' && (
                  <div className="alert alert-warning border-0 rounded-3">
                    <Icon name="exclamation-triangle" className="me-2" />
                    Your manager sent this timesheet back. Fix the entries and submit it again.
                  </div>
                )}
                {rows.length === 0 && <Empty icon="journal-plus" text="No entries yet. Add your first one." />}
                {rows.map((r, i) => (
                  <div className="row g-2 mb-2 align-items-center" key={i}>
                    <div className="col-md-2">
                      <select className="form-select" disabled={locked} value={r.date} onChange={(e) => setRow(i, 'date', e.target.value)}>
                        {days.map((d) => (
                          <option key={d} value={d}>
                            {fmtDay(d)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <input className="form-control" placeholder="Project" disabled={locked} value={r.project} onChange={(e) => setRow(i, 'project', e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="What did you work on?" disabled={locked} value={r.description || ''} onChange={(e) => setRow(i, 'description', e.target.value)} />
                    </div>
                    <div className="col-6 col-md-2">
                      <input type="number" min="0.25" max="24" step="0.25" className="form-control" disabled={locked} value={r.hours} onChange={(e) => setRow(i, 'hours', e.target.value)} />
                    </div>
                    <div className="col-6 col-md-1 text-end">
                      {!locked && (
                        <button className="btn btn-light text-danger" onClick={() => removeRow(i)} aria-label="Remove row">
                          <Icon name="x-lg" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!locked && (
                  <button className="btn btn-light mt-2" onClick={addRow}>
                    <Icon name="plus-lg" className="me-2" />
                    Add entry
                  </button>
                )}
              </div>
              <div className="card-footer d-flex flex-wrap align-items-center gap-2">
                <div className="fw-semibold me-auto">Total: {Math.round(total * 100) / 100} hours</div>
                {!locked && (
                  <>
                    <button className="btn btn-light" onClick={saveDraft}>
                      Save draft
                    </button>
                    <button className="btn btn-primary" onClick={submit} disabled={rows.length === 0}>
                      <Icon name="send" className="me-2" />
                      Submit for approval
                    </button>
                  </>
                )}
                {locked && <span className="text-muted small">This timesheet is {sheet.status} and can’t be edited.</span>}
              </div>
            </div>
          </div>
          <div className="col-xl-3">
            <div className="card">
              <div className="card-header">Recent weeks</div>
              <div className="list-group list-group-flush">
                {history.length === 0 && <div className="p-3 text-muted small">Nothing saved yet</div>}
                {history.map((h) => (
                  <button key={h._id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => setWeek(h.weekStart)}>
                    <span>
                      <div className="fw-semibold small">{fmtDate(h.weekStart)}</div>
                      <div className="small text-muted">{h.totalHours} h</div>
                    </span>
                    <StatusBadge status={h.status} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'review' && (
        <>
          <select className="form-select w-auto mb-3" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
            <option value="submitted">Waiting for approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {toReview.length === 0 && (
            <div className="card">
              <Empty icon="journal-check" text="Nothing here" />
            </div>
          )}
          {toReview.map((s) => (
            <div className="card mb-3" key={s._id}>
              <div className="card-header d-flex align-items-center gap-3">
                <Avatar name={s.employee?.name} size={34} />
                <div>
                  <div className="fw-semibold">{s.employee?.name}</div>
                  <div className="small text-muted">
                    Week of {fmtDate(s.weekStart)} · {s.totalHours} hours
                  </div>
                </div>
                <span className="ms-auto">
                  <StatusBadge status={s.status} />
                </span>
              </div>
              <div className="table-responsive">
                <table className="table mb-0">
                  <tbody>
                    {s.entries.map((e, i) => (
                      <tr key={i}>
                        <td className="text-nowrap">{fmtDay(e.date)}</td>
                        <td className="fw-semibold">{e.project}</td>
                        <td className="text-muted">{e.description}</td>
                        <td className="text-end">{e.hours} h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {s.status === 'submitted' && (
                <div className="card-footer d-flex gap-2">
                  <button className="btn btn-success" onClick={() => review(s, 'approved')}>
                    Approve
                  </button>
                  <button className="btn btn-outline-danger" onClick={() => review(s, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}
