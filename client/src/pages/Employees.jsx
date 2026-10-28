import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { Alert, Avatar, Empty, Icon, PageHeader, ROLE_LABEL, StatusBadge } from '../components/ui';
import { toInput } from '../utils';

const BLANK = {
  name: '', email: '', password: '', role: 'employee', department: '',
  designation: '', phone: '', manager: '', joinDate: '', active: true,
};

// Who each role reports to
const BOSS_ROLES = { employee: ['manager', 'ceo'], manager: ['ceo'], hr: ['ceo'], ceo: [], admin: [] };

export default function Employees() {
  const { user } = useAuth();
  const canEditPeople = user.role === 'admin' || user.role === 'hr';
  const roleChoices = user.role === 'admin' ? ['employee', 'manager', 'hr', 'ceo', 'admin'] : ['employee', 'manager'];

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

  const changeRole = (e) => {
    const role = e.target.value;
    const stillValid = list.find((u) => u._id === form.manager && BOSS_ROLES[role].includes(u.role));
    setForm({ ...form, role, manager: stillValid ? form.manager : '' });
  };

  const bosses = form ? list.filter((u) => u.active && BOSS_ROLES[form.role].includes(u.role) && u._id !== editingId) : [];

  const openNew = () => {
    setEditingId(null);
    setForm(BLANK);
  };

  const openEdit = (emp) => {
    setEditingId(emp._id);
    setForm({ ...BLANK, ...emp, password: '', manager: emp.manager?._id || '', joinDate: toInput(emp.joinDate) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      if (editingId) await api.put(`/employees/${editingId}`, body);
      else await api.post('/employees', body);
      setMsg({ ok: editingId ? 'Employee updated' : 'Employee added' });
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

  // HR can only change managers and employees; admin can change anyone
  const canTouch = (u) => canEditPeople && (user.role === 'admin' || ['manager', 'employee'].includes(u.role));

  return (
    <>
      <PageHeader title={canEditPeople || user.role === 'ceo' ? 'Employees' : 'My team'} subtitle={`${list.length} people`}>
        {canEditPeople && (
          <button className="btn btn-primary" onClick={openNew}>
            <Icon name="person-plus-fill" className="me-2" />
            Add employee
          </button>
        )}
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {form && (
        <form className="card mb-4" onSubmit={save}>
          <div className="card-header">{editingId ? 'Edit employee' : 'Add a new employee'}</div>
          <div className="card-body row g-3">
            <div className="col-md-4">
              <label className="form-label">Full name</label>
              <input className="form-control" required value={form.name} onChange={set('name')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Password {editingId && <span className="fw-normal">(blank = keep)</span>}</label>
              <input type="password" className="form-control" minLength={6} required={!editingId} value={form.password} onChange={set('password')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={changeRole}>
                {roleChoices.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Reports to</label>
              {BOSS_ROLES[form.role].length === 0 ? (
                <input className="form-control" disabled value="No manager needed" />
              ) : (
                <select className="form-select" required value={form.manager} onChange={set('manager')}>
                  <option value="">Select manager…</option>
                  {bosses.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({ROLE_LABEL[m.role]})
                    </option>
                  ))}
                </select>
              )}
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
            <div className="col-md-3">
              <label className="form-label">Join date</label>
              <input type="date" className="form-control" value={form.joinDate} onChange={set('joinDate')} />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check form-switch">
                <input id="active" type="checkbox" role="switch" className="form-check-input" checked={form.active} onChange={set('active')} />
                <label htmlFor="active" className="form-check-label">
                  Account active
                </label>
              </div>
            </div>
          </div>
          <div className="card-footer d-flex gap-2">
            <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add employee'}</button>
            <button type="button" className="btn btn-light" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Reports to</th>
                <th>Status</th>
                {canEditPeople && <th />}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <Avatar name={u.name} />
                      <div>
                        <div className="fw-semibold">{u.name}</div>
                        <div className="small text-muted">{u.designation || u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={u.role} />
                  </td>
                  <td>{u.department || '—'}</td>
                  <td>{u.manager?.name || '—'}</td>
                  <td>
                    <StatusBadge status={u.active ? 'active' : 'inactive'} />
                  </td>
                  {canEditPeople && (
                    <td className="text-end text-nowrap">
                      {canTouch(u) && (
                        <>
                          <button className="btn btn-sm btn-light me-1" onClick={() => openEdit(u)} title="Edit">
                            <Icon name="pencil-square" />
                          </button>
                          <button className="btn btn-sm btn-light text-danger" onClick={() => remove(u)} disabled={u._id === user._id} title="Delete">
                            <Icon name="trash" />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <Empty icon="people" text="No employees yet" />}
        </div>
      </div>
    </>
  );
}
