import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TODAY = new Date().toISOString().split('T')[0];
const TYPES = ['expense', 'budget', 'invoice', 'payment'];
const CATEGORIES = ['payroll', 'utilities', 'equipment', 'rent', 'marketing', 'travel', 'maintenance', 'other'];
const STATUSES = ['pending', 'approved', 'paid', 'rejected'];
const TYPE_COLOR = { expense:'danger', budget:'info', invoice:'warning', payment:'success' };
const STATUS_COLOR = { pending:'warning', approved:'info', paid:'success', rejected:'danger' };

const fmt = (n) => 'PKR ' + Number(n||0).toLocaleString();

export default function Finance() {
  const { authFetch, isCEO, isAdmin, isFinance } = useAuth();
  const canApprove = isCEO || isAdmin;
  const canCreate  = isCEO || isAdmin || isFinance;

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type:'', status:'', month:'', year: new Date().getFullYear() });
  const [tab, setTab] = useState('entries');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type:'expense', category:'utilities', title:'', amount:'', date:TODAY, department:'', status:'pending', description:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v))).toString();
    const p1 = authFetch(`/api/finance${qs?'?'+qs:''}`).then(r=>r.json()).then(setEntries).catch(()=>{});
    const p2 = authFetch('/api/finance/summary').then(r=>r.json()).then(setSummary).catch(()=>{});
    Promise.all([p1,p2]).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, [filters]);

  const openAdd = () => {
    setEditing(null);
    setForm({ type:'expense', category:'utilities', title:'', amount:'', date:TODAY, department:'', status:'pending', description:'' });
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ type:e.type, category:e.category, title:e.title, amount:e.amount, date:e.date, department:e.department||'', status:e.status, description:e.description||'' });
    setShowModal(true);
  };

  const handleSave = async (ev) => {
    ev.preventDefault(); setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/finance/${editing.id}` : '/api/finance';
    await authFetch(url, { method, body: JSON.stringify(form) });
    setSaving(false); setShowModal(false); load();
  };

  const handleApprove = async (id, status) => {
    await authFetch(`/api/finance/${id}/approve`, { method:'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await authFetch(`/api/finance/${id}`, { method:'DELETE' });
    load();
  };

  const totalExpenses = entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const totalBudget   = entries.filter(e=>e.type==='budget').reduce((s,e)=>s+e.amount,0);
  const totalInvoice  = entries.filter(e=>e.type==='invoice').reduce((s,e)=>s+e.amount,0);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card danger">
          <div className="stat-icon">💸</div>
          <div className="stat-label">Expenses (Filtered)</div>
          <div className="stat-value" style={{ fontSize:18 }}>{fmt(totalExpenses)}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-label">Budget (Filtered)</div>
          <div className="stat-value" style={{ fontSize:18 }}>{fmt(totalBudget)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Invoices (Filtered)</div>
          <div className="stat-value" style={{ fontSize:18 }}>{fmt(totalInvoice)}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value">{summary?.pending ?? '—'}</div>
          <div style={{ fontSize:12, color:'#6b7280' }}>This month</div>
        </div>
      </div>

      <div className="card">
        {/* Filters + Add button */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
          <select value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))}>
            <option value="">All Types</option>
            {TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
            <option value="">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select value={filters.month} onChange={e=>setFilters(f=>({...f,month:e.target.value}))}>
            <option value="">All Months</option>
            {Array.from({length:12},(_,i)=>(
              <option key={i+1} value={String(i+1).padStart(2,'0')}>
                {new Date(2000,i).toLocaleString('default',{month:'long'})}
              </option>
            ))}
          </select>
          <input type="number" value={filters.year} onChange={e=>setFilters(f=>({...f,year:e.target.value}))}
            style={{ width:90 }} placeholder="Year" />
          <div style={{ marginLeft:'auto' }}>
            {canCreate && <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Entry</button>}
          </div>
        </div>

        {loading ? <div className="loading">Loading...</div> :
          !entries.length ? (
            <div className="empty-state"><div className="empty-icon">💼</div><h4>No finance entries found</h4></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Title</th><th>Type</th><th>Category</th>
                  <th>Amount</th><th>Department</th><th>Date</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight:500 }}>{e.title}</div>
                        {e.description && <div style={{ fontSize:12, color:'#6b7280' }}>{e.description.substring(0,60)}{e.description.length>60?'...':''}</div>}
                      </td>
                      <td><span className={`badge badge-${TYPE_COLOR[e.type]||'gray'}`}>{e.type}</span></td>
                      <td style={{ textTransform:'capitalize' }}>{e.category}</td>
                      <td style={{ fontWeight:600 }}>{fmt(e.amount)}</td>
                      <td>{e.department||'—'}</td>
                      <td>{e.date}</td>
                      <td><span className={`badge badge-${STATUS_COLOR[e.status]||'gray'}`}>{e.status}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          {canCreate && <button className="btn btn-info btn-sm" onClick={()=>openEdit(e)}>Edit</button>}
                          {canApprove && e.status==='pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={()=>handleApprove(e.id,'approved')}>Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={()=>handleApprove(e.id,'rejected')}>Reject</button>
                            </>
                          )}
                          {canApprove && e.status==='approved' && (
                            <button className="btn btn-primary btn-sm" onClick={()=>handleApprove(e.id,'paid')}>Mark Paid</button>
                          )}
                          {canApprove && <button className="btn btn-ghost btn-sm" onClick={()=>handleDelete(e.id)}>Del</button>}
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
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Finance Entry' : 'Add Finance Entry'}</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type *</label>
                    <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} required>
                      {TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
                      {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Title *</label>
                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="e.g. Office Rent March 2026" />
                  </div>
                  <div className="form-group">
                    <label>Amount (PKR) *</label>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                      <option value="">— Select —</option>
                      <option>Operations</option><option>HR</option><option>Finance</option>
                      <option>Admin</option><option>Management</option><option>IT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                      {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Description</label>
                    <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                      rows={2} placeholder="Optional notes..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
