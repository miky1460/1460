import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TODAY = new Date().toISOString().split('T')[0];

const TYPES    = ['expense', 'budget', 'invoice', 'payment'];
const STATUSES = ['pending', 'approved', 'paid', 'rejected'];
const TYPE_COLOR   = { expense:'danger', budget:'info', invoice:'warning', payment:'success' };
const STATUS_COLOR = { pending:'warning', approved:'info', paid:'success', rejected:'danger' };

// Department-specific categories
const DEPT_CATEGORIES = {
  HR:         ['recruitment', 'training', 'benefits', 'staff_welfare', 'hr_events', 'other'],
  Operations: ['project_cost', 'commissions', 'tools_software', 'client_expense', 'agent_bonus', 'other'],
  Finance:    ['banking', 'taxes', 'audit', 'insurance', 'accounting', 'other'],
  Admin:      ['office_supplies', 'utilities', 'maintenance', 'rent', 'cleaning', 'other'],
  Management: ['marketing', 'travel', 'legal', 'consulting', 'events', 'other'],
  default:    ['payroll', 'utilities', 'equipment', 'rent', 'marketing', 'travel', 'maintenance', 'other'],
};

const DEPT_ICONS = { HR:'🧑‍💼', Operations:'📞', Finance:'💼', Admin:'🏢', Management:'👑' };

// Role → dept map (mirrors backend)
const ROLE_DEPT = {
  hr:             'HR',
  ops_manager:    'Operations',
  office_manager: 'Admin',
  finance:        'Finance',
};

const DEPTS = ['All', 'HR', 'Operations', 'Finance', 'Admin', 'Management'];

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString();
const cap = (s) => s ? s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : s;

export default function Finance() {
  const { user, authFetch, isCEO, isAdmin, isFinance, isHR, isOpsManager, isOfficeManager } = useAuth();

  const canViewAll  = isCEO || isAdmin || isFinance;
  const canApprove  = isCEO || isAdmin || isFinance;
  const myDept      = ROLE_DEPT[user?.role] || null;

  // Which tabs does this user see?
  const visibleDepts = canViewAll ? DEPTS : ['My Dept'];

  const [deptTab, setDeptTab]   = useState(canViewAll ? 'All' : 'My Dept');
  const [entries, setEntries]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ type:'', status:'', month:'', year: String(new Date().getFullYear()) });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    type:'expense', category:'', title:'', amount:'', date:TODAY,
    department: myDept || '', status:'pending', description:''
  });

  const activeDept = deptTab === 'My Dept' ? myDept : (deptTab === 'All' ? '' : deptTab);
  const cats = DEPT_CATEGORIES[activeDept] || DEPT_CATEGORIES[myDept] || DEPT_CATEGORIES.default;

  const load = () => {
    setLoading(true);
    const params = { ...filters };
    if (activeDept) params.department = activeDept;
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v))).toString();
    const p1 = authFetch(`/api/finance${qs?'?'+qs:''}`).then(r=>r.json()).then(d=>setEntries(Array.isArray(d)?d:[])).catch(()=>{});
    const p2 = authFetch('/api/finance/summary').then(r=>r.json()).then(setSummary).catch(()=>{});
    Promise.all([p1,p2]).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, [filters, deptTab]);

  const openAdd = () => {
    const dept = canViewAll ? (activeDept||'') : (myDept||'');
    const deptCats = DEPT_CATEGORIES[dept] || DEPT_CATEGORIES.default;
    setEditing(null);
    setForm({ type:'expense', category: deptCats[0]||'', title:'', amount:'', date:TODAY, department:dept, status:'pending', description:'' });
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ type:e.type, category:e.category, title:e.title, amount:String(e.amount), date:e.date, department:e.department||'', status:e.status, description:e.description||'' });
    setShowModal(true);
  };

  const handleSave = async (ev) => {
    ev.preventDefault(); setSaving(true);
    const method = editing ? 'PUT' : 'POST';
    const url    = editing ? `/api/finance/${editing.id}` : '/api/finance';
    const r = await authFetch(url, { method, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { alert(d.error || 'Failed'); return; }
    setShowModal(false); load();
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

  // Summary cards
  const totalExpense = entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const totalBudget  = entries.filter(e=>e.type==='budget').reduce((s,e)=>s+e.amount,0);
  const totalInvoice = entries.filter(e=>e.type==='invoice').reduce((s,e)=>s+e.amount,0);
  const totalPending = entries.filter(e=>e.status==='pending').length;

  // Dept breakdown for CEO/Finance view
  const deptBreakdown = (() => {
    if (!summary?.byDept?.length) return [];
    const map = {};
    summary.byDept.forEach(r => {
      if (!map[r.department]) map[r.department] = { dept:r.department, expense:0, budget:0, invoice:0 };
      map[r.department][r.type] = (map[r.department][r.type]||0) + r.total;
    });
    return Object.values(map);
  })();

  const formDeptCats = DEPT_CATEGORIES[form.department] || DEPT_CATEGORIES.default;

  return (
    <div>
      {/* Summary Stats */}
      <div className="stat-grid" style={{ marginBottom:20 }}>
        <div className="stat-card danger">
          <div className="stat-icon">💸</div>
          <div className="stat-label">Expenses</div>
          <div className="stat-value" style={{ fontSize:16 }}>{fmt(totalExpense)}</div>
          <div style={{ fontSize:12,color:'#6b7280' }}>{deptTab !== 'All' ? deptTab : 'All Depts'}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-label">Budget</div>
          <div className="stat-value" style={{ fontSize:16 }}>{fmt(totalBudget)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Invoices</div>
          <div className="stat-value" style={{ fontSize:16 }}>{fmt(totalInvoice)}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value">{summary?.pending ?? totalPending}</div>
          <div style={{ fontSize:12,color:'#6b7280' }}>Awaiting Finance</div>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="tab-bar" style={{ marginBottom:16 }}>
        {visibleDepts.map(d => (
          <button key={d} onClick={()=>setDeptTab(d)}
            className={`tab-btn${deptTab===d?' active':''}`}>
            {DEPT_ICONS[d] || ''} {d === 'My Dept' ? `My Dept (${myDept})` : d}
          </button>
        ))}
      </div>

      {/* Department breakdown (CEO/Finance only when All tab) */}
      {canViewAll && deptTab === 'All' && deptBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, color:'#374151' }}>This Month — Department Breakdown</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Department</th><th>Expenses</th><th>Budget</th><th>Invoices</th><th>Total</th></tr></thead>
              <tbody>
                {deptBreakdown.map(d => (
                  <tr key={d.dept}>
                    <td><strong>{DEPT_ICONS[d.dept]||'📁'} {d.dept}</strong></td>
                    <td style={{ color:'#dc2626' }}>{fmt(d.expense||0)}</td>
                    <td style={{ color:'#2563eb' }}>{fmt(d.budget||0)}</td>
                    <td style={{ color:'#d97706' }}>{fmt(d.invoice||0)}</td>
                    <td style={{ fontWeight:700 }}>{fmt((d.expense||0)+(d.budget||0)+(d.invoice||0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="card">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
          <select value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))}>
            <option value="">All Types</option>
            {TYPES.map(t=><option key={t} value={t}>{cap(t)}</option>)}
          </select>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
            <option value="">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{cap(s)}</option>)}
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
            style={{ width:85 }} placeholder="Year" />
          <div style={{ marginLeft:'auto' }}>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Entry</button>
          </div>
        </div>

        {loading ? <div className="loading">Loading...</div> :
          !entries.length ? (
            <div className="empty-state">
              <div className="empty-icon">{DEPT_ICONS[activeDept] || '💼'}</div>
              <h4>No entries for {deptTab === 'My Dept' ? myDept : deptTab}</h4>
              <p style={{ color:'#6b7280', fontSize:14 }}>Start by adding your department's expenses or budget entries.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Title</th><th>Type</th><th>Category</th>
                  <th>Amount</th>
                  {canViewAll && <th>Department</th>}
                  <th>Date</th><th>Status</th>
                  {canViewAll && <th>Submitted By</th>}
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight:500 }}>{e.title}</div>
                        {e.description && <div style={{ fontSize:12,color:'#6b7280' }}>{e.description.substring(0,60)}{e.description.length>60?'...':''}</div>}
                      </td>
                      <td><span className={`badge badge-${TYPE_COLOR[e.type]||'gray'}`}>{e.type}</span></td>
                      <td style={{ textTransform:'capitalize', fontSize:13 }}>{cap(e.category)}</td>
                      <td style={{ fontWeight:700, whiteSpace:'nowrap' }}>{fmt(e.amount)}</td>
                      {canViewAll && <td><span style={{ fontSize:12 }}>{DEPT_ICONS[e.department]||''} {e.department||'—'}</span></td>}
                      <td style={{ whiteSpace:'nowrap' }}>{e.date}</td>
                      <td><span className={`badge badge-${STATUS_COLOR[e.status]||'gray'}`}>{e.status}</span></td>
                      {canViewAll && <td style={{ fontSize:13, color:'#6b7280' }}>{e.created_by_name||'—'}</td>}
                      <td>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          <button className="btn btn-info btn-sm" onClick={()=>openEdit(e)}>Edit</button>
                          {canApprove && e.status==='pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={()=>handleApprove(e.id,'approved')}>✓</button>
                              <button className="btn btn-danger btn-sm"  onClick={()=>handleApprove(e.id,'rejected')}>✗</button>
                            </>
                          )}
                          {canApprove && e.status==='approved' && (
                            <button className="btn btn-primary btn-sm" onClick={()=>handleApprove(e.id,'paid')}>Paid</button>
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
              <h3>{editing ? 'Edit Entry' : `Add Entry${myDept && !canViewAll ? ` — ${myDept}` : ''}`}</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Department selector — only for Finance/CEO/Admin */}
                  {canViewAll && (
                    <div className="form-group">
                      <label>Department</label>
                      <select value={form.department}
                        onChange={e => {
                          const newDept = e.target.value;
                          const newCats = DEPT_CATEGORIES[newDept] || DEPT_CATEGORIES.default;
                          setForm(f=>({...f, department:newDept, category:newCats[0]||''}));
                        }}>
                        <option value="">— Select —</option>
                        <option value="HR">🧑‍💼 HR</option>
                        <option value="Operations">📞 Operations</option>
                        <option value="Finance">💼 Finance</option>
                        <option value="Admin">🏢 Admin</option>
                        <option value="Management">👑 Management</option>
                      </select>
                    </div>
                  )}
                  {!canViewAll && (
                    <div className="form-group">
                      <label>Department</label>
                      <input value={form.department} disabled style={{ background:'#f9fafb' }} />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Type *</label>
                    <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} required>
                      {TYPES.map(t=><option key={t} value={t}>{cap(t)}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Category *</label>
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
                      <option value="">— Select Category —</option>
                      {formDeptCats.map(c=><option key={c} value={c}>{cap(c)}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Title *</label>
                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required
                      placeholder={form.department==='HR'?'e.g. New Hire Recruitment Drive':form.department==='Operations'?'e.g. Alpha Campaign Project Cost':'e.g. Description of entry'} />
                  </div>

                  <div className="form-group">
                    <label>Amount (PKR) *</label>
                    <input type="number" min="0" step="0.01" value={form.amount}
                      onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required placeholder="0" />
                  </div>

                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required />
                  </div>

                  {canViewAll && (
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                        {STATUSES.map(s=><option key={s} value={s}>{cap(s)}</option>)}
                      </select>
                    </div>
                  )}
                  {!canViewAll && (
                    <div className="form-group">
                      <label>Status</label>
                      <input value="Pending Finance Approval" disabled style={{ background:'#f9fafb', fontSize:13 }} />
                    </div>
                  )}

                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Description / Notes</label>
                    <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                      rows={2} placeholder="Details about this entry..."
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                  </div>
                </div>

                {!canViewAll && (
                  <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13, color:'#92400e' }}>
                    ℹ️ Your entry will be submitted as <strong>Pending</strong> and reviewed by the Finance team for approval.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
