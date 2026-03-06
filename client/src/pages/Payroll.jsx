import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Payroll() {
  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ employee_id: '', basic_salary: '', bonus: '', deductions: '' });

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000); };

  const load = () => {
    setLoading(true);
    const params = { month: selectedMonth, year: selectedYear };
    if (statusFilter) params.status = statusFilter;
    axios.get('/api/payroll', { params })
      .then(r => setPayroll(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('/api/employees', { params: { status: 'active' } }).then(r => setEmployees(r.data));
  }, []);

  useEffect(() => { load(); }, [selectedMonth, selectedYear, statusFilter]);

  const handleGenerate = async () => {
    if (!confirm(`Generate payroll for all active employees for ${selectedMonth} ${selectedYear}?`)) return;
    setGenerating(true);
    try {
      const r = await axios.post('/api/payroll/generate', { month: selectedMonth, year: selectedYear });
      showMsg('success', r.data.message);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error generating payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = async (id) => {
    if (!confirm('Mark this payroll as paid?')) return;
    try {
      await axios.put(`/api/payroll/${id}/pay`);
      showMsg('success', 'Payroll marked as paid!');
      load();
    } catch (err) {
      showMsg('error', 'Error');
    }
  };

  const openEdit = (rec) => {
    setEditModal(rec);
    setEditForm({ basic_salary: rec.basic_salary, bonus: rec.bonus, deductions: rec.deductions });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/payroll/${editModal.id}`, {
        basic_salary: parseFloat(editForm.basic_salary),
        bonus: parseFloat(editForm.bonus || 0),
        deductions: parseFloat(editForm.deductions || 0),
      });
      showMsg('success', 'Payroll updated!');
      setEditModal(null);
      load();
    } catch (err) {
      showMsg('error', 'Error updating payroll');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payroll', {
        employee_id: addForm.employee_id,
        month: selectedMonth,
        year: selectedYear,
        basic_salary: parseFloat(addForm.basic_salary),
        bonus: parseFloat(addForm.bonus || 0),
        deductions: parseFloat(addForm.deductions || 0),
      });
      showMsg('success', 'Payroll entry added!');
      setAddModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const totals = payroll.reduce((acc, r) => ({
    basic: acc.basic + r.basic_salary,
    bonus: acc.bonus + r.bonus,
    deductions: acc.deductions + r.deductions,
    net: acc.net + r.net_salary,
  }), { basic: 0, bonus: 0, deductions: 0, net: 0 });

  const statusBadge = (s) => (
    <span className={`badge ${s === 'paid' ? 'badge-success' : 'badge-warning'}`}>{s}</span>
  );

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="page-header">
        <div>
          <h3>Payroll Management</h3>
          <p>Manage and process employee salaries</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setAddModal(true)}>+ Add Entry</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-label">Total Basic</div>
          <div className="stat-value" style={{ fontSize: 22 }}>${totals.basic.toLocaleString()}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Total Bonus</div>
          <div className="stat-value" style={{ fontSize: 22 }}>${totals.bonus.toLocaleString()}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Total Deductions</div>
          <div className="stat-value" style={{ fontSize: 22 }}>${totals.deductions.toLocaleString()}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Net Payroll</div>
          <div className="stat-value" style={{ fontSize: 22 }}>${totals.net.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {loading ? <div className="loading">Loading...</div> : payroll.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h4>No payroll records for {selectedMonth} {selectedYear}</h4>
            <p style={{ marginTop: 8 }}>Click "Generate Payroll" to create records for all active employees</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Employee</th><th>Department</th><th>Basic Salary</th><th>Bonus</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {payroll.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{p.emp_code} · {p.position}</div>
                    </td>
                    <td>{p.department}</td>
                    <td>${p.basic_salary.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>+${p.bonus.toLocaleString()}</td>
                    <td style={{ color: 'var(--danger)' }}>-${p.deductions.toLocaleString()}</td>
                    <td><strong>${p.net_salary.toLocaleString()}</strong></td>
                    <td>
                      {statusBadge(p.status)}
                      {p.paid_date && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{p.paid_date}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        {p.status === 'pending' && (
                          <button className="btn btn-success btn-sm" onClick={() => handlePay(p.id)}>Pay</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                  <td colSpan={2}>Totals ({payroll.length} employees)</td>
                  <td>${totals.basic.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)' }}>+${totals.bonus.toLocaleString()}</td>
                  <td style={{ color: 'var(--danger)' }}>-${totals.deductions.toLocaleString()}</td>
                  <td>${totals.net.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Edit Payroll Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Payroll — {editModal.first_name} {editModal.last_name}</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Basic Salary ($)</label>
                    <input type="number" value={editForm.basic_salary} onChange={e => setEditForm({...editForm, basic_salary: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Bonus ($)</label>
                    <input type="number" value={editForm.bonus} onChange={e => setEditForm({...editForm, bonus: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Deductions ($)</label>
                    <input type="number" value={editForm.deductions} onChange={e => setEditForm({...editForm, deductions: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Net Salary (calculated)</label>
                    <input value={`$${((parseFloat(editForm.basic_salary)||0) + (parseFloat(editForm.bonus)||0) - (parseFloat(editForm.deductions)||0)).toLocaleString()}`} readOnly style={{ background: '#f9fafb' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payroll Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Payroll Entry — {selectedMonth} {selectedYear}</h3>
              <button className="modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Employee *</label>
                    <select value={addForm.employee_id} onChange={e => {
                      const emp = employees.find(em => em.id === e.target.value);
                      setAddForm({...addForm, employee_id: e.target.value, basic_salary: emp ? emp.salary : ''});
                    }} required>
                      <option value="">Select employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Basic Salary ($) *</label>
                    <input type="number" value={addForm.basic_salary} onChange={e => setAddForm({...addForm, basic_salary: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Bonus ($)</label>
                    <input type="number" value={addForm.bonus} onChange={e => setAddForm({...addForm, bonus: e.target.value})} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Deductions ($)</label>
                    <input type="number" value={addForm.deductions} onChange={e => setAddForm({...addForm, deductions: e.target.value})} placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
