import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LEAVE_TYPES = ['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY_FORM = { employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' };

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);
  const [balanceEmp, setBalanceEmp] = useState('');
  const [balance, setBalance] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (monthFilter) params.month = monthFilter;
    axios.get('/api/leaves', { params })
      .then(r => setLeaves(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('/api/employees', { params: { status: 'active' } }).then(r => setEmployees(r.data));
  }, []);

  useEffect(() => { load(); }, [statusFilter, monthFilter]);

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/leaves', form);
      showMsg('success', 'Leave request submitted!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error submitting leave');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.put(`/api/leaves/${id}`, { status, approved_by: 'Admin' });
      showMsg('success', `Leave ${status}!`);
      load();
    } catch (err) {
      showMsg('error', 'Error updating status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this leave request?')) return;
    await axios.delete(`/api/leaves/${id}`);
    showMsg('success', 'Leave request deleted');
    load();
  };

  const loadBalance = async () => {
    if (!balanceEmp) return;
    const r = await axios.get(`/api/leaves/balance/${balanceEmp}`);
    setBalance(r.data);
  };

  useEffect(() => { if (balanceEmp) loadBalance(); else setBalance(null); }, [balanceEmp]);

  const statusBadge = (s) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s}</span>;
  };

  const typeBadge = (t) => <span className="badge badge-purple">{t}</span>;

  return (
    <div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="page-header">
        <div>
          <h3>Leave Management</h3>
          <p>Manage employee leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
      </div>

      {/* Leave Balance Checker */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Leave Balance Checker</h4>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <select value={balanceEmp} onChange={e => setBalanceEmp(e.target.value)} style={{ maxWidth: 280 }}>
            <option value="">Select an employee...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
          </select>
        </div>
        {balance && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {Object.entries(balance).map(([type, b]) => (
              <div key={type} style={{ padding: '10px 16px', background: '#f9fafb', borderRadius: 8, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{type}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: b.remaining > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                  {b.remaining} days
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{b.used} used / {b.allowed} total</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="search-bar">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>

        {loading ? <div className="loading">Loading...</div> : leaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏖️</div>
            <h4>No leave requests found</h4>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Employee</th><th>Type</th><th>Duration</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.first_name} {l.last_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{l.emp_code} · {l.department}</div>
                    </td>
                    <td>{typeBadge(l.leave_type)}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{l.start_date}</div>
                      <div style={{ fontSize: 13 }}>{l.end_date}</div>
                    </td>
                    <td><strong>{l.days}</strong></td>
                    <td style={{ maxWidth: 180, fontSize: 13, color: '#6b7280' }}>{l.reason || '-'}</td>
                    <td>{statusBadge(l.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {l.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleStatus(l.id, 'approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatus(l.id, 'rejected')}>Reject</button>
                          </>
                        )}
                        {l.status === 'approved' && (
                          <button className="btn btn-warning btn-sm" onClick={() => handleStatus(l.id, 'rejected')}>Revoke</button>
                        )}
                        {l.status === 'pending' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(l.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Leave Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Leave Request</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Employee *</label>
                    <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} required>
                      <option value="">Select employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Leave Type *</label>
                    <select value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})}>
                      {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Reason</label>
                  <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                    placeholder="Optional reason for the leave request..." rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
