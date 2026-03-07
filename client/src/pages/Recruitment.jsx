import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const STATUS_CONFIG = {
  applied:     { label: 'Applied',     color: '#2563eb', bg: '#dbeafe', icon: '📋' },
  shortlisted: { label: 'Shortlisted', color: '#7c3aed', bg: '#ede9fe', icon: '⭐' },
  screened:    { label: 'Screened',    color: '#0891b2', bg: '#cffafe', icon: '🔍' },
  hired:       { label: 'Hired',       color: '#16a34a', bg: '#dcfce7', icon: '✅' },
  rejected:    { label: 'Rejected',    color: '#dc2626', bg: '#fee2e2', icon: '❌' },
};

const SOURCES = ['Rozee.pk', 'LinkedIn', 'Indeed', 'Referral', 'Walk-in', 'direct', 'Other'];
const DEPARTMENTS = ['HR', 'Operations', 'Finance', 'Admin', 'Management'];

const token = () => localStorage.getItem('token');

const apiFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } });

export default function Recruitment() {
  const { isHR, isAdmin, isCEO } = useAuth();
  const canManage = isHR || isAdmin || isCEO;

  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState({ applied: 0, shortlisted: 0, screened: 0, hired: 0, rejected: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showModal, setShowModal] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', position_applied: '',
    department: 'Operations', source: 'Rozee.pk', remarks: '',
    status: 'applied', interview_date: '', interview_notes: '',
    offered_salary: '', joining_date: '', rejected_reason: '',
  });
  const [cvFile, setCvFile] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (filterDept) params.append('department', filterDept);
    if (search) params.append('search', search);
    const [cRes, sRes] = await Promise.all([
      apiFetch(`/api/recruitment?${params}`),
      apiFetch('/api/recruitment/summary'),
    ]);
    if (cRes.ok) setCandidates(await cRes.json());
    if (sRes.ok) setSummary(await sRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, filterDept, search]);

  const openAdd = () => {
    setEditCandidate(null);
    setForm({ full_name: '', email: '', phone: '', position_applied: '', department: 'Operations', source: 'Rozee.pk', remarks: '', status: 'applied', interview_date: '', interview_notes: '', offered_salary: '', joining_date: '', rejected_reason: '' });
    setCvFile(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCandidate(c);
    setForm({
      full_name: c.full_name, email: c.email || '', phone: c.phone || '',
      position_applied: c.position_applied, department: c.department, source: c.source,
      remarks: c.remarks || '', status: c.status,
      interview_date: c.interview_date || '', interview_notes: c.interview_notes || '',
      offered_salary: c.offered_salary || '', joining_date: c.joining_date || '',
      rejected_reason: c.rejected_reason || '',
    });
    setCvFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (cvFile) fd.append('cv', cvFile);

    const url = editCandidate ? `/api/recruitment/${editCandidate.id}` : '/api/recruitment';
    const method = editCandidate ? 'PUT' : 'POST';
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    if (res.ok) {
      setShowModal(false);
      load();
    } else {
      const err = await res.json();
      alert(err.error || 'Error saving candidate');
    }
  };

  const quickStatus = async (id, status) => {
    await fetch(`${API}/api/recruitment/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteCandidate = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    await apiFetch(`/api/recruitment/${id}`, { method: 'DELETE' });
    load();
  };

  const grouped = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = candidates.filter(c => c.status === s);
    return acc;
  }, {});

  const cvUrl = (filename) => `${API}/uploads/cvs/${filename}`;

  return (
    <div style={{ padding: '0 0 80px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Recruitment Pipeline</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Track candidates from application to hiring</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd}>+ Add Candidate</button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
          <div key={s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            style={{
              background: filterStatus === s ? cfg.color : '#fff',
              color: filterStatus === s ? '#fff' : '#111',
              border: `2px solid ${cfg.color}`,
              borderRadius: 12, padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 24 }}>{cfg.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{summary[s]}</div>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: filterStatus === s ? 0.9 : 0.7 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {['pipeline', 'table'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === t ? '3px solid #2563eb' : '3px solid transparent',
              fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? '#2563eb' : '#6b7280',
              fontSize: 14, marginBottom: -2,
            }}>
            {t === 'pipeline' ? '📊 Kanban View' : '📋 List View'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        {(filterStatus || filterDept || search) && (
          <button onClick={() => { setFilterStatus(''); setFilterDept(''); setSearch(''); }}
            style={{ padding: '8px 14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
      ) : activeTab === 'pipeline' ? (
        /* Kanban View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
            <div key={s} style={{ background: '#f9fafb', borderRadius: 12, border: `1px solid ${cfg.color}30`, overflow: 'hidden' }}>
              <div style={{ background: cfg.color, color: '#fff', padding: '10px 14px', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>{cfg.icon} {cfg.label}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '1px 10px' }}>{grouped[s].length}</span>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                {grouped[s].length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>No candidates</div>
                )}
                {grouped[s].map(c => (
                  <div key={c.id} style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                    onClick={() => setShowDetail(c)}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.full_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{c.position_applied}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.department}</div>
                    {c.cv_filename && (
                      <div style={{ marginTop: 6, fontSize: 11 }}>
                        <a href={cvUrl(c.cv_filename)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#2563eb', textDecoration: 'none' }}>📎 View CV</a>
                      </div>
                    )}
                    {c.remarks && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#374151', background: '#f3f4f6', borderRadius: 4, padding: '4px 6px', borderLeft: '3px solid #d1d5db' }}>
                        {c.remarks.length > 60 ? c.remarks.substring(0, 60) + '...' : c.remarks}
                      </div>
                    )}
                    {canManage && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.keys(STATUS_CONFIG).filter(ns => ns !== s).slice(0, 3).map(ns => (
                          <button key={ns} onClick={(e) => { e.stopPropagation(); quickStatus(c.id, ns); }}
                            style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${STATUS_CONFIG[ns].color}`, borderRadius: 4, background: STATUS_CONFIG[ns].bg, color: STATUS_CONFIG[ns].color, cursor: 'pointer' }}>
                            → {STATUS_CONFIG[ns].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['Candidate', 'Position', 'Department', 'Source', 'Status', 'CV', 'Remarks', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No candidates found</td></tr>
                )}
                {candidates.map((c, i) => {
                  const cfg = STATUS_CONFIG[c.status];
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{c.email}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{c.position_applied}</td>
                      <td style={{ padding: '10px 14px' }}>{c.department}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{c.source}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {c.cv_filename ? (
                          <a href={cvUrl(c.cv_filename)} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#2563eb', fontSize: 12, textDecoration: 'none' }}>
                            📎 {c.cv_original_name || 'View CV'}
                          </a>
                        ) : <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                        <span style={{ fontSize: 12, color: '#374151' }}>
                          {c.remarks ? (c.remarks.length > 50 ? c.remarks.substring(0, 50) + '...' : c.remarks) : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => setShowDetail(c)}
                          style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginRight: 6 }}>
                          View
                        </button>
                        {canManage && (
                          <>
                            <button onClick={() => openEdit(c)}
                              style={{ padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginRight: 6 }}>
                              Edit
                            </button>
                            <button onClick={() => deleteCandidate(c.id)}
                              style={{ padding: '4px 8px', background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                              ✕
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>{editCandidate ? 'Update Candidate' : 'Add New Candidate'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Full Name *</label>
                  <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Position Applied *</label>
                  <input required value={form.position_applied} onChange={e => setForm(f => ({ ...f, position_applied: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Department *</label>
                  <select required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inp}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={inp}>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                    {Object.entries(STATUS_CONFIG).map(([s, cfg]) => <option key={s} value={s}>{cfg.icon} {cfg.label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>CV / Resume (PDF, DOC, Image)</label>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={e => setCvFile(e.target.files[0])}
                    style={{ ...inp, padding: '6px' }} />
                  {editCandidate?.cv_original_name && !cvFile && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Current: {editCandidate.cv_original_name}</div>
                  )}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Remarks / Notes</label>
                  <textarea rows={3} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    style={{ ...inp, resize: 'vertical' }} placeholder="HR notes, initial impression, skills observed..." />
                </div>
                {(form.status === 'screened' || form.status === 'hired') && (
                  <>
                    <div>
                      <label style={lbl}>Interview Date</label>
                      <input type="date" value={form.interview_date} onChange={e => setForm(f => ({ ...f, interview_date: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Offered Salary</label>
                      <input type="number" value={form.offered_salary} onChange={e => setForm(f => ({ ...f, offered_salary: e.target.value }))} style={inp} placeholder="PKR" />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={lbl}>Interview Notes</label>
                      <textarea rows={2} value={form.interview_notes} onChange={e => setForm(f => ({ ...f, interview_notes: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
                    </div>
                  </>
                )}
                {form.status === 'hired' && (
                  <div>
                    <label style={lbl}>Joining Date</label>
                    <input type="date" value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} style={inp} />
                  </div>
                )}
                {form.status === 'rejected' && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Rejection Reason</label>
                    <textarea rows={2} value={form.rejected_reason} onChange={e => setForm(f => ({ ...f, rejected_reason: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editCandidate ? 'Save Changes' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20 }}>{showDetail.full_name}</h3>
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{showDetail.position_applied} — {showDetail.department}</div>
              </div>
              <button onClick={() => setShowDetail(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            {(() => {
              const cfg = STATUS_CONFIG[showDetail.status];
              return (
                <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                  {cfg.icon} {cfg.label}
                </span>
              );
            })()}

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Email', showDetail.email],
                ['Phone', showDetail.phone],
                ['Source', showDetail.source],
                ['Applied', showDetail.created_at?.split('T')[0]],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#9ca3af', fontSize: 13, minWidth: 80 }}>{k}:</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ) : null)}

              {showDetail.cv_filename && (
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>📎</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{showDetail.cv_original_name || 'CV Attached'}</div>
                    <a href={cvUrl(showDetail.cv_filename)} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Open / Download CV</a>
                  </div>
                </div>
              )}

              {showDetail.remarks && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>HR Remarks</div>
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#374151', borderLeft: '3px solid #2563eb' }}>
                    {showDetail.remarks}
                  </div>
                </div>
              )}

              {showDetail.interview_date && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#9ca3af', fontSize: 13, minWidth: 80 }}>Interview:</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{showDetail.interview_date}</span>
                </div>
              )}
              {showDetail.interview_notes && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Interview Notes</div>
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#374151' }}>
                    {showDetail.interview_notes}
                  </div>
                </div>
              )}
              {showDetail.offered_salary && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#9ca3af', fontSize: 13, minWidth: 80 }}>Offered:</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>PKR {Number(showDetail.offered_salary).toLocaleString()}</span>
                </div>
              )}
              {showDetail.joining_date && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#9ca3af', fontSize: 13, minWidth: 80 }}>Joining:</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{showDetail.joining_date}</span>
                </div>
              )}
              {showDetail.rejected_reason && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Rejection Reason</div>
                  <div style={{ background: '#fff1f2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                    {showDetail.rejected_reason}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              {canManage && (
                <button onClick={() => { setShowDetail(null); openEdit(showDetail); }}
                  style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  Edit
                </button>
              )}
              <button onClick={() => setShowDetail(null)}
                style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
