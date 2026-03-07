import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['stationery', 'equipment', 'maintenance', 'furniture', 'IT', 'other'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const PRIORITY_COLOR = { low:'gray', normal:'info', high:'warning', urgent:'danger' };
const STATUS_COLOR   = { pending:'warning', approved:'success', rejected:'danger', fulfilled:'info' };

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '—';

export default function OfficeRequests() {
  const { authFetch, isCEO, isAdmin, isOfficeManager } = useAuth();
  const canCreate  = isCEO || isAdmin || isOfficeManager;
  const canApprove = isCEO || isAdmin;
  const canManage  = canCreate;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ status:'', category:'' });
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(null); // request object
  const [form, setForm] = useState({ category:'equipment', title:'', description:'', priority:'normal' });
  const [actionForm, setActionForm] = useState({ status:'approved', notes:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v))).toString();
    authFetch(`/api/office/requests${qs?'?'+qs:''}`).then(r=>r.json()).then(setRequests).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    await authFetch('/api/office/requests', { method:'POST', body: JSON.stringify(form) });
    setSaving(false); setShowModal(false); load();
  };

  const handleAction = async (e) => {
    e.preventDefault(); setSaving(true);
    await authFetch(`/api/office/requests/${showActionModal.id}`, { method:'PUT', body: JSON.stringify(actionForm) });
    setSaving(false); setShowActionModal(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this request?')) return;
    await authFetch(`/api/office/requests/${id}`, { method:'DELETE' });
    load();
  };

  const counts = { total: requests.length, pending: requests.filter(r=>r.status==='pending').length, approved: requests.filter(r=>r.status==='approved').length, fulfilled: requests.filter(r=>r.status==='fulfilled').length };

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card primary"><div className="stat-icon">📋</div><div className="stat-label">Total Requests</div><div className="stat-value">{counts.total}</div></div>
        <div className="stat-card warning"><div className="stat-icon">⏳</div><div className="stat-label">Pending</div><div className="stat-value">{counts.pending}</div></div>
        <div className="stat-card success"><div className="stat-icon">✅</div><div className="stat-label">Approved</div><div className="stat-value">{counts.approved}</div></div>
        <div className="stat-card info"><div className="stat-icon">📦</div><div className="stat-label">Fulfilled</div><div className="stat-value">{counts.fulfilled}</div></div>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
          {canCreate && (
            <button className="btn btn-primary" style={{ marginLeft:'auto' }}
              onClick={()=>{ setForm({ category:'equipment', title:'', description:'', priority:'normal' }); setShowModal(true); }}>
              + New Request
            </button>
          )}
        </div>

        {loading ? <div className="loading">Loading...</div> :
          !requests.length ? (
            <div className="empty-state"><div className="empty-icon">📦</div><h4>No requests found</h4></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Title</th><th>Category</th><th>Priority</th>
                  <th>Status</th><th>Requested By</th><th>Date</th>
                  {canApprove && <th>Approved By</th>}
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight:500 }}>{r.title}</div>
                        {r.description && <div style={{ fontSize:12, color:'#6b7280' }}>{r.description.substring(0,60)}{r.description.length>60?'...':''}</div>}
                        {r.notes && <div style={{ fontSize:12, color:'#374151', marginTop:2, fontStyle:'italic' }}>Note: {r.notes}</div>}
                      </td>
                      <td style={{ textTransform:'capitalize' }}>{r.category}</td>
                      <td><span className={`badge badge-${PRIORITY_COLOR[r.priority]||'gray'}`}>{r.priority}</span></td>
                      <td><span className={`badge badge-${STATUS_COLOR[r.status]||'gray'}`}>{r.status}</span></td>
                      <td>{r.requester_name}</td>
                      <td>{fmtDate(r.created_at)}</td>
                      {canApprove && <td>{r.approved_by || '—'}</td>}
                      <td>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {canApprove && r.status === 'pending' && (
                            <button className="btn btn-success btn-sm" onClick={()=>{ setShowActionModal(r); setActionForm({ status:'approved', notes:'' }); }}>
                              Review
                            </button>
                          )}
                          {canApprove && r.status === 'approved' && (
                            <button className="btn btn-info btn-sm" onClick={()=>{ setShowActionModal(r); setActionForm({ status:'fulfilled', notes:'' }); }}>
                              Mark Fulfilled
                            </button>
                          )}
                          {canApprove && <button className="btn btn-ghost btn-sm" onClick={()=>handleDelete(r.id)}>Del</button>}
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

      {/* New Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Office Request</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
                      {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                      {PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Title *</label>
                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Brief description of what's needed" />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Details</label>
                    <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                      rows={3} placeholder="Quantity, specifications, reason..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Submitting...':'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review/Action Modal */}
      {showActionModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowActionModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Review Request</h3>
              <button className="modal-close" onClick={()=>setShowActionModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAction}>
              <div className="modal-body">
                <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:16 }}>
                  <div style={{ fontWeight:600, marginBottom:4 }}>{showActionModal.title}</div>
                  <div style={{ fontSize:13, color:'#6b7280' }}>{showActionModal.description}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Priority: {showActionModal.priority} · Category: {showActionModal.category}</div>
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select value={actionForm.status} onChange={e=>setActionForm(f=>({...f,status:e.target.value}))}>
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="fulfilled">Mark Fulfilled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={actionForm.notes} onChange={e=>setActionForm(f=>({...f,notes:e.target.value}))}
                    rows={2} placeholder="Optional notes..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowActionModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
