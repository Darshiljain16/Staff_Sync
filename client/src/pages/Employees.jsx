import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, PageHeader, StatusBadge } from '../components/ui';
import { toInput } from '../utils';

const BLANK = {
  name: '', email: '', password: '', role: 'employee', department: '',
  designation: '', phone: '', manager: '', joinDate: '', active: true,
};

export default function Employees() {
  const { user } = useAuth();
  const isHr = user.role === 'hr';
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null); // null = hidden
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api
      .get('/employees')
      .then((res) => setList(res.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  }, []);
  useEffect(load, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const openNew = () => {
    setEditingId(null);
    setForm(BLANK);
  };

  const openEdit = (emp) => {
    setEditingId(emp._id);
    setForm({
      ...BLANK,
      ...emp,
      password: '',
      manager: emp.manager?._id || '',
      joinDate: toInput(emp.joinDate),
    });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      if (editingId) await api.put(`/employees/${editingId}`, body);
      else await api.post('/employees', body);
      setMsg({ ok: editingId ? 'Employee updated' : 'Employee created' });
      setForm(null);
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const remove = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      setMsg({ ok: 'Employee deleted' });
      load();
    } catch (err) {
      setMsg({ err: errMsg(err) });
    }
  };

  const managers = list.filter((u) => u.role === 'manager');

  return (
    <>
      <PageHeader title={isHr ? 'Employees' : 'My team'}>
        {isHr && (
          <button className="btn btn-primary" onClick={openNew}>
            + Add employee
          </button>
        )}
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {form && (
        <form className="card shadow-sm mb-4" onSubmit={save}>
          <div className="card-header fw-semibold">{editingId ? 'Edit employee' : 'New employee'}</div>
          <div className="card-body row g-3">
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input className="form-control" required value={form.name} onChange={set('name')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Password {editingId && <span className="text-muted">(leave blank to keep)</span>}</label>
              <input
                type="password"
                className="form-control"
                minLength={6}
                required={!editingId}
                value={form.password}
                onChange={set('password')}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={set('role')}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={set('department')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Designation</label>
              <input className="form-control" value={form.designation} onChange={set('designation')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Reports to</label>
              <select className="form-select" value={form.manager} onChange={set('manager')}>
                <option value="">— None —</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Join date</label>
              <input type="date" className="form-control" value={form.joinDate} onChange={set('joinDate')} />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check">
                <input id="active" type="checkbox" className="form-check-input" checked={form.active} onChange={set('active')} />
                <label htmlFor="active" className="form-check-label">
                  Account active
                </label>
              </div>
            </div>
          </div>
          <div className="card-footer d-flex gap-2">
            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Reports to</th>
                <th>Status</th>
                {isHr && <th />}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No employees found
                  </td>
                </tr>
              )}
              {list.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="fw-semibold">{u.name}</div>
                    <div className="small text-muted">{u.email}</div>
                  </td>
                  <td>
                    <StatusBadge status={u.role} />
                  </td>
                  <td>{u.department || '—'}</td>
                  <td>{u.designation || '—'}</td>
                  <td>{u.manager?.name || '—'}</td>
                  <td>
                    <StatusBadge status={u.active ? 'active' : 'inactive'} />
                  </td>
                  {isHr && (
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u)} disabled={u._id === user._id}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
