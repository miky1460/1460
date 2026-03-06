import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Design', 'Legal'];
const EMPTY_FORM = {
  employee_id: '', first_name: '', last_name: '', email: '', phone: '',
  department: '', position: '', salary: '', join_date: ''
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);
  const [viewEmp, setViewEmp] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (deptFilter) params.department = deptFilter;
    if (statusFilter) params.status = statusFilter;
    axios.get('/api/employees', { params })
      .then(r => setEmployees(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, deptFilter, statusFilter]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ ...emp, salary: String(emp.salary) });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`/api/employees/${editing.id}`, { ...form, salary: parseFloat(form.salary) });
        setMessage({ type: 'success', text: 'Employee updated successfully!' });
      } else {
        await axios.post('/api/employees', { ...form, salary: parseFloat(form.salary) });
        setMessage({ type: 'success', text: 'Employee added successfully!' });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'An error occurred' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeactivate = async (emp) => {
    if (!confirm(`Deactivate ${emp.first_name} ${emp.last_name}?`)) return;
    await axios.delete(`/api/employees/${emp.id}`);
    setMessage({ type: 'success', text: 'Employee deactivated.' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const statusBadge = (s) => (
    <span className={`badge ${s === 'active' ? 'badge-success' : 'badge-gray'}`}>{s}</span>
  );

  return (
    <div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="page-header">
        <div>
          <h3>Employee Directory</h3>
          <p>{employees.length} employee(s) found</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            placeholder="Search by name, ID, or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? <div className="loading">Loading...</div> :
          employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h4>No employees found</h4>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Department</th><th>Position</th>
                    <th>Salary</th><th>Join Date</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td><strong>{emp.employee_id}</strong></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{emp.first_name} {emp.last_name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{emp.email}</div>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.position}</td>
                      <td>${Number(emp.salary).toLocaleString()}</td>
                      <td>{emp.join_date}</td>
                      <td>{statusBadge(emp.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setViewEmp(emp)}>View</button>
                          <button className="btn btn-info btn-sm" onClick={() => openEdit(emp)}>Edit</button>
                          {emp.status === 'active' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(emp)}>Off</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Employee ID *</label>
                    <input value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
                      placeholder="EMP001" required disabled={!!editing} />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="email@company.com" required />
                  </div>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                      placeholder="First name" required />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                      placeholder="Last name" required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="555-0100" />
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Position *</label>
                    <input value={form.position} onChange={e => setForm({...form, position: e.target.value})}
                      placeholder="Job title" required />
                  </div>
                  <div className="form-group">
                    <label>Annual Salary ($) *</label>
                    <input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})}
                      placeholder="50000" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Join Date *</label>
                    <input type="date" value={form.join_date} onChange={e => setForm({...form, join_date: e.target.value})} required />
                  </div>
                  {editing && (
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {viewEmp && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewEmp(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Employee Details</h3>
              <button className="modal-close" onClick={() => setViewEmp(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 700, color: '#4f46e5' }}>
                  {viewEmp.first_name[0]}{viewEmp.last_name[0]}
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 600 }}>{viewEmp.first_name} {viewEmp.last_name}</h4>
                <p style={{ color: '#6b7280' }}>{viewEmp.position} · {viewEmp.department}</p>
              </div>
              <div className="form-grid">
                {[
                  ['Employee ID', viewEmp.employee_id],
                  ['Email', viewEmp.email],
                  ['Phone', viewEmp.phone || '-'],
                  ['Annual Salary', `$${Number(viewEmp.salary).toLocaleString()}`],
                  ['Join Date', viewEmp.join_date],
                  ['Status', viewEmp.status],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                    <div style={{ marginTop: 4, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
