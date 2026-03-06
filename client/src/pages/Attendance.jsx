import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_OPTIONS = ['present', 'absent', 'half_day', 'work_from_home'];

export default function Attendance() {
  const [tab, setTab] = useState('daily');
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState(null);
  const [markModal, setMarkModal] = useState(false);
  const [markForm, setMarkForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '09:00', check_out: '17:30', status: 'present' });

  useEffect(() => {
    axios.get('/api/employees', { params: { status: 'active' } })
      .then(r => setEmployees(r.data));
  }, []);

  const loadDaily = () => {
    setLoading(true);
    axios.get('/api/reports/attendance/daily', { params: { date: selectedDate } })
      .then(r => setRecords(r.data.records || []))
      .finally(() => setLoading(false));
  };

  const loadMonthly = () => {
    setLoading(true);
    axios.get('/api/attendance/summary', { params: { month: selectedMonth, year: selectedYear } })
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'daily') loadDaily();
    else loadMonthly();
  }, [tab, selectedDate, selectedMonth, selectedYear]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleMark = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/attendance', markForm);
      showMsg('success', 'Attendance marked!');
      setMarkModal(false);
      if (tab === 'daily') loadDaily();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const openEdit = (rec) => {
    setEditModal(rec);
    setEditForm({ check_in: rec.check_in === '-' ? '' : rec.check_in, check_out: rec.check_out === '-' ? '' : rec.check_out, status: rec.status });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/attendance', {
        employee_id: editModal.employee_id || employees.find(em => em.first_name === editModal.first_name)?.id,
        date: selectedDate,
        ...editForm
      });
      showMsg('success', 'Attendance updated!');
      setEditModal(null);
      loadDaily();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const statusBadge = (s) => {
    const map = { present: 'success', absent: 'danger', half_day: 'warning', work_from_home: 'info' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s?.replace('_', ' ')}</span>;
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="page-header">
        <div>
          <h3>Attendance Management</h3>
          <p>Track and manage employee attendance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMarkModal(true)}>+ Mark Attendance</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>Daily View</button>
        <button className={`tab ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>Monthly Summary</button>
      </div>

      {tab === 'daily' && (
        <div className="card">
          <div className="search-bar">
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <label style={{ whiteSpace: 'nowrap' }}>Date:</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ maxWidth: 160 }} />
            </div>
          </div>

          {/* Summary counts */}
          {records.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Present', count: records.filter(r => r.status === 'present').length, color: 'var(--success)' },
                { label: 'Absent', count: records.filter(r => r.status === 'absent').length, color: 'var(--danger)' },
                { label: 'Half Day', count: records.filter(r => r.status === 'half_day').length, color: 'var(--warning)' },
                { label: 'WFH', count: records.filter(r => r.status === 'work_from_home').length, color: 'var(--info)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '8px 16px', borderRadius: 8, background: '#f9fafb', borderLeft: `4px solid ${s.color}`, minWidth: 100 }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td><div style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{r.emp_code}</div></td>
                      <td>{r.department}</td>
                      <td>{r.check_in}</td>
                      <td>{r.check_out}</td>
                      <td>{r.hours_worked > 0 ? `${r.hours_worked}h` : '-'}</td>
                      <td>{statusBadge(r.status)}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'monthly' && (
        <div className="card">
          <div className="search-bar">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Department</th><th>Present Days</th><th>Absent Days</th><th>Half Days</th><th>Total Hours</th></tr>
                </thead>
                <tbody>
                  {summary.map(s => (
                    <tr key={s.id}>
                      <td><div style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{s.emp_code}</div></td>
                      <td>{s.department}</td>
                      <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{s.present_days}</span></td>
                      <td><span style={{ color: s.absent_days > 0 ? 'var(--danger)' : '#374151', fontWeight: 600 }}>{s.absent_days}</span></td>
                      <td>{s.half_days}</td>
                      <td>{s.total_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mark Attendance Modal */}
      {markModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMarkModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Mark Attendance</h3>
              <button className="modal-close" onClick={() => setMarkModal(false)}>✕</button>
            </div>
            <form onSubmit={handleMark}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Employee *</label>
                    <select value={markForm.employee_id} onChange={e => setMarkForm({...markForm, employee_id: e.target.value})} required>
                      <option value="">Select employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" value={markForm.date} onChange={e => setMarkForm({...markForm, date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Status *</label>
                    <select value={markForm.status} onChange={e => setMarkForm({...markForm, status: e.target.value})}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div></div>
                  <div className="form-group">
                    <label>Check In</label>
                    <input type="time" value={markForm.check_in} onChange={e => setMarkForm({...markForm, check_in: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Check Out</label>
                    <input type="time" value={markForm.check_out} onChange={e => setMarkForm({...markForm, check_out: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setMarkModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Mark Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Attendance — {editModal.first_name} {editModal.last_name}</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Status</label>
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div></div>
                  <div className="form-group">
                    <label>Check In</label>
                    <input type="time" value={editForm.check_in} onChange={e => setEditForm({...editForm, check_in: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Check Out</label>
                    <input type="time" value={editForm.check_out} onChange={e => setEditForm({...editForm, check_out: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
