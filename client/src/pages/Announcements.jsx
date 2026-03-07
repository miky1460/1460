import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLOR = { normal:'gray', important:'warning', urgent:'danger' };
const AUDIENCE_COLOR = { all:'success', management:'info', ops:'primary', hr:'warning', finance:'danger' };
const CATEGORIES = ['general', 'hr', 'ops', 'finance', 'management', 'it'];

const fmtDate = (s) => {
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

export default function Announcements() {
  const { authFetch, isCEO, isAdmin, isHR, isOpsManager, isFinance, isOfficeManager } = useAuth();
  const canPost = isCEO || isAdmin || isHR || isOpsManager || isFinance || isOfficeManager;
  const canDelete = isCEO || isAdmin || isHR;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title:'', content:'', category:'general', audience:'all', priority:'normal', expires_at:'' });
  const [saving, setSaving] = useState(false);
  const [filterAudience, setFilterAudience] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const load = () => {
    setLoading(true);
    authFetch('/api/announcements').then(r=>r.json()).then(setAnnouncements).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title:'', content:'', category:'general', audience:'all', priority:'normal', expires_at:'' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ title:a.title, content:a.content, category:a.category, audience:a.audience, priority:a.priority, expires_at:a.expires_at||'' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/announcements/${editing.id}` : '/api/announcements';
    const body = { ...form };
    if (!body.expires_at) delete body.expires_at;
    await authFetch(url, { method, body: JSON.stringify(body) });
    setSaving(false); setShowModal(false); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await authFetch(`/api/announcements/${id}`, { method:'DELETE' });
    load();
  };

  const filtered = announcements.filter(a => {
    if (filterAudience && a.audience !== filterAudience) return false;
    if (filterPriority && a.priority !== filterPriority) return false;
    return true;
  });

  const urgent = filtered.filter(a=>a.priority==='urgent');
  const rest   = filtered.filter(a=>a.priority!=='urgent');

  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20, alignItems:'center' }}>
        <select value={filterAudience} onChange={e=>setFilterAudience(e.target.value)}>
          <option value="">All Channels</option>
          <option value="all">All Staff</option>
          <option value="management">Management Only</option>
          <option value="ops">Operations</option>
          <option value="hr">HR</option>
          <option value="finance">Finance</option>
        </select>
        <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="important">Important</option>
          <option value="normal">Normal</option>
        </select>
        {canPost && (
          <button className="btn btn-primary" style={{ marginLeft:'auto' }} onClick={openAdd}>
            + New Announcement
          </button>
        )}
      </div>

      {loading ? <div className="loading">Loading announcements...</div> : (
        <div>
          {/* Urgent banners */}
          {urgent.map(a => (
            <div key={a.id} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:16, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:18 }}>🚨</span>
                  <span className="badge badge-danger">URGENT</span>
                  <span className={`badge badge-${AUDIENCE_COLOR[a.audience]||'gray'}`}>{a.audience === 'all' ? 'All Staff' : a.audience.toUpperCase()}</span>
                  <span style={{ fontSize:12, color:'#6b7280', textTransform:'capitalize' }}>{a.category}</span>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{fmtDate(a.created_at)}</span>
                  {canPost && <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(a)}>Edit</button>}
                  {canDelete && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(a.id)}>Del</button>}
                </div>
              </div>
              <div style={{ fontWeight:700, fontSize:16, color:'#991b1b', margin:'8px 0 4px' }}>{a.title}</div>
              <div style={{ color:'#374151', fontSize:14, lineHeight:1.5 }}>{a.content}</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:8 }}>
                Posted by {a.author_name} · {a.author_position}
              </div>
            </div>
          ))}

          {/* Regular announcements */}
          {!rest.length && !urgent.length ? (
            <div className="empty-state card">
              <div className="empty-icon">📢</div>
              <h4>No announcements</h4>
              <p style={{ color:'#6b7280', fontSize:14 }}>No announcements match your filters.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {rest.map(a => (
                <div key={a.id} style={{
                  background:'#fff', border:`1px solid ${a.priority==='important'?'#fde68a':'#e5e7eb'}`,
                  borderLeft:`4px solid ${a.priority==='important'?'#f59e0b':'#16a34a'}`,
                  borderRadius:10, padding:16
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      {a.priority === 'important' && <span className="badge badge-warning">Important</span>}
                      <span className={`badge badge-${AUDIENCE_COLOR[a.audience]||'gray'}`} style={{ fontSize:11 }}>
                        {a.audience === 'all' ? '📢 All Staff' : a.audience === 'management' ? '👔 Management' : a.audience.toUpperCase()}
                      </span>
                      <span style={{ fontSize:11, color:'#9ca3af', textTransform:'capitalize', background:'#f3f4f6', padding:'2px 8px', borderRadius:20 }}>{a.category}</span>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>{fmtDate(a.created_at)}</span>
                      {canPost && <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(a)}>Edit</button>}
                      {canDelete && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(a.id)}>Del</button>}
                    </div>
                  </div>
                  <div style={{ fontWeight:600, fontSize:15, color:'#111827', marginBottom:6 }}>{a.title}</div>
                  <div style={{ color:'#374151', fontSize:14, lineHeight:1.6 }}>{a.content}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>
                    {a.author_name} · {a.author_position}
                    {a.expires_at && ` · Expires: ${a.expires_at.split('T')[0]}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Announcement title" />
                </div>
                <div className="form-group">
                  <label>Content *</label>
                  <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} required rows={4}
                    placeholder="Write your announcement here..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Channel / Audience</label>
                    <select value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value}))}>
                      <option value="all">All Staff</option>
                      {(isCEO||isAdmin) && <option value="management">Management Only</option>}
                      <option value="ops">Operations</option>
                      <option value="hr">HR</option>
                      <option value="finance">Finance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                      {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expires On</label>
                    <input type="date" value={form.expires_at} onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Posting...':'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
