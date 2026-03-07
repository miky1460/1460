import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TODAY = new Date().toISOString().split('T')[0];

const REPORT_TYPE_LABEL = { agent: 'Agent / SDR', team_lead: 'Team Lead' };

function StatCard({ icon, label, value, sub, color = 'primary' }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>}
    </div>
  );
}

export default function Operations() {
  const { user, authFetch, isAgent, isTeamLead, isOpsManager, isCEO, isAdmin } = useAuth();
  const isManager = isCEO || isAdmin || isOpsManager;

  const [tab, setTab] = useState(isManager ? 'overview' : 'submit');
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState(null);

  // Submit form state
  const [form, setForm] = useState({
    report_date: TODAY,
    report_type: isTeamLead ? 'team_lead' : 'agent',
    project_name: '',
    calls_made: '', calls_answered: '', leads_generated: '', conversions: '', avg_call_duration: '', data_entries: '',
    team_size: '', team_target: '', team_achieved: '', team_issues: '', notes: '',
  });
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Project form
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name:'', client:'', type:'outbound', status:'active', start_date:'', daily_target:'', description:'' });

  const load = () => {
    setLoading(true);
    const p1 = authFetch('/api/operations/reports').then(r=>r.json()).then(setReports).catch(()=>{});
    const p2 = authFetch('/api/operations/projects').then(r=>r.json()).then(setProjects).catch(()=>{});
    const p3 = isManager
      ? authFetch('/api/operations/reports/today').then(r=>r.json()).then(setTodaySummary).catch(()=>{})
      : Promise.resolve();
    Promise.all([p1,p2,p3]).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSubmitMsg('');
    const body = { ...form };
    Object.keys(body).forEach(k => { if (body[k]===''||body[k]===null) delete body[k]; });
    try {
      const r = await authFetch('/api/operations/reports', { method:'POST', body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setSubmitMsg('Error: ' + d.error); }
      else {
        setSubmitMsg('Report submitted successfully!');
        setForm(f=>({...f, report_date: TODAY, notes:'', calls_made:'', calls_answered:'', leads_generated:'', conversions:'', data_entries:'', team_issues:'', team_achieved:''}));
        load();
      }
    } catch { setSubmitMsg('Network error'); }
    finally { setSubmitting(false); }
  };

  const markReviewed = async (id) => {
    await authFetch(`/api/operations/reports/${id}/review`, { method:'PUT' });
    load();
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    const r = await authFetch('/api/operations/projects', { method:'POST', body: JSON.stringify(projectForm) });
    if (r.ok) { setShowProjectModal(false); setProjectForm({ name:'', client:'', type:'outbound', status:'active', start_date:'', daily_target:'', description:'' }); load(); }
  };

  const tabs = [
    ...(isManager ? [{ key:'overview', label:'📊 Overview' }] : []),
    { key:'submit', label: isTeamLead ? '📝 Submit TL Report' : '📝 Submit Daily Report' },
    { key:'history', label:'📋 Report History' },
    { key:'projects', label:'🗂️ Projects' },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`tab-btn${tab===t.key?' active':''}`}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div>
          <div className="stat-grid">
            <StatCard icon="📞" label="Calls Today" value={todaySummary?.summary?.totalCalls ?? '—'} color="primary" />
            <StatCard icon="🎯" label="Leads Today" value={todaySummary?.summary?.totalLeads ?? '—'} color="success" />
            <StatCard icon="✅" label="Conversions" value={todaySummary?.summary?.totalConv ?? '—'} color="info" />
            <StatCard icon="📄" label="Data Entries" value={todaySummary?.summary?.totalEntries ?? '—'} color="warning" />
          </div>

          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Today's Reports — {TODAY}</h3>
            {loading ? <div className="loading">Loading...</div> :
              !todaySummary?.reports?.length ? (
                <div className="empty-state"><div className="empty-icon">📋</div><h4>No reports submitted today</h4></div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr>
                      <th>Agent / TL</th><th>Type</th><th>Project</th>
                      <th>Calls</th><th>Leads</th><th>Conv.</th><th>Entries</th>
                      <th>Team Target</th><th>Achieved</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                      {todaySummary.reports.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.employee_name}</strong><div style={{fontSize:11,color:'#6b7280'}}>{r.position}</div></td>
                          <td><span className={`badge badge-${r.report_type==='team_lead'?'info':'success'}`}>{REPORT_TYPE_LABEL[r.report_type]}</span></td>
                          <td>{r.project_name||'—'}</td>
                          <td>{r.calls_made||'—'}</td>
                          <td>{r.leads_generated||'—'}</td>
                          <td>{r.conversions||'—'}</td>
                          <td>{r.data_entries||'—'}</td>
                          <td>{r.team_target||'—'}</td>
                          <td>{r.team_achieved||'—'}</td>
                          <td><span className={`badge badge-${r.status==='reviewed'?'success':'warning'}`}>{r.status}</span></td>
                          <td>
                            {r.status !== 'reviewed' && (
                              <button className="btn btn-success btn-sm" onClick={()=>markReviewed(r.id)}>Mark Reviewed</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* SUBMIT REPORT TAB */}
      {tab === 'submit' && (
        <div className="card" style={{ maxWidth: 680 }}>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:20 }}>
            {isTeamLead ? 'Submit Team Lead Report' : 'Submit Daily Activity Report'}
          </h3>
          {submitMsg && (
            <div className={`alert ${submitMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom:16 }}>{submitMsg}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={form.report_date} max={TODAY}
                  onChange={e=>setForm(f=>({...f,report_date:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Project / Campaign</label>
                <select value={form.project_name} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))}>
                  <option value="">-- Select Project --</option>
                  {projects.filter(p=>p.status==='active').map(p=>(
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Agent fields */}
            {(isAgent || (isManager && form.report_type === 'agent')) && (
              <>
                <div style={{ fontWeight:600, color:'#374151', margin:'16px 0 8px', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Call Activity</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Calls Made</label>
                    <input type="number" min="0" value={form.calls_made} onChange={e=>setForm(f=>({...f,calls_made:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Calls Answered</label>
                    <input type="number" min="0" value={form.calls_answered} onChange={e=>setForm(f=>({...f,calls_answered:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Leads Generated</label>
                    <input type="number" min="0" value={form.leads_generated} onChange={e=>setForm(f=>({...f,leads_generated:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Conversions</label>
                    <input type="number" min="0" value={form.conversions} onChange={e=>setForm(f=>({...f,conversions:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Data Entries</label>
                    <input type="number" min="0" value={form.data_entries} onChange={e=>setForm(f=>({...f,data_entries:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Avg Call Duration (min)</label>
                    <input type="number" min="0" step="0.1" value={form.avg_call_duration} onChange={e=>setForm(f=>({...f,avg_call_duration:e.target.value}))} placeholder="0" />
                  </div>
                </div>
              </>
            )}

            {/* Team Lead fields */}
            {(isTeamLead || (isManager && form.report_type === 'team_lead')) && (
              <>
                <div style={{ fontWeight:600, color:'#374151', margin:'16px 0 8px', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Team Performance</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Team Size</label>
                    <input type="number" min="0" value={form.team_size} onChange={e=>setForm(f=>({...f,team_size:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Daily Target</label>
                    <input type="number" min="0" value={form.team_target} onChange={e=>setForm(f=>({...f,team_target:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Achieved</label>
                    <input type="number" min="0" value={form.team_achieved} onChange={e=>setForm(f=>({...f,team_achieved:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Issues / Blockers</label>
                    <textarea value={form.team_issues} onChange={e=>setForm(f=>({...f,team_issues:e.target.value}))}
                      placeholder="Any issues faced today..." rows={2} style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Notes / Comments</label>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                placeholder="Any additional notes..." rows={3}
                style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop:16 }}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      {/* REPORT HISTORY TAB */}
      {tab === 'history' && (
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Report History</h3>
          {loading ? <div className="loading">Loading...</div> :
            !reports.length ? (
              <div className="empty-state"><div className="empty-icon">📋</div><h4>No reports found</h4></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr>
                    {isManager && <th>Agent / TL</th>}
                    <th>Date</th><th>Type</th><th>Project</th>
                    <th>Calls</th><th>Leads</th><th>Conv.</th><th>Entries</th>
                    <th>Status</th>
                    {isManager && <th>Actions</th>}
                  </tr></thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        {isManager && <td><strong>{r.employee_name}</strong></td>}
                        <td>{r.report_date}</td>
                        <td><span className={`badge badge-${r.report_type==='team_lead'?'info':'success'}`}>{REPORT_TYPE_LABEL[r.report_type]}</span></td>
                        <td>{r.project_name||'—'}</td>
                        <td>{r.calls_made||'—'}</td>
                        <td>{r.leads_generated||'—'}</td>
                        <td>{r.conversions||'—'}</td>
                        <td>{r.data_entries||'—'}</td>
                        <td><span className={`badge badge-${r.status==='reviewed'?'success':'warning'}`}>{r.status}</span></td>
                        {isManager && (
                          <td>
                            {r.status !== 'reviewed' && (
                              <button className="btn btn-success btn-sm" onClick={()=>markReviewed(r.id)}>Review</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* PROJECTS TAB */}
      {tab === 'projects' && (
        <div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:600 }}>Active Projects / Campaigns</h3>
              {isManager && (
                <button className="btn btn-primary btn-sm" onClick={()=>setShowProjectModal(true)}>+ New Project</button>
              )}
            </div>
            {loading ? <div className="loading">Loading...</div> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:16, background:'#fff' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ fontWeight:600, fontSize:15 }}>{p.name}</div>
                      <span className={`badge badge-${p.status==='active'?'success':p.status==='paused'?'warning':'gray'}`}>{p.status}</span>
                    </div>
                    {p.client && <div style={{ fontSize:13, color:'#6b7280', marginBottom:4 }}>Client: <strong>{p.client}</strong></div>}
                    <div style={{ fontSize:12, color:'#6b7280', marginBottom:8 }}>
                      Type: {p.type} · Daily Target: <strong>{p.daily_target || 'N/A'}</strong>
                    </div>
                    {p.start_date && <div style={{ fontSize:12, color:'#9ca3af' }}>Started: {p.start_date}</div>}
                    {p.description && <div style={{ fontSize:13, color:'#374151', marginTop:8, borderTop:'1px solid #f3f4f6', paddingTop:8 }}>{p.description}</div>}
                  </div>
                ))}
                {!projects.length && <div className="empty-state"><div className="empty-icon">🗂️</div><h4>No projects yet</h4></div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowProjectModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Project / Campaign</h3>
              <button className="modal-close" onClick={()=>setShowProjectModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProject}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Project Name *</label>
                    <input value={projectForm.name} onChange={e=>setProjectForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. Alpha Campaign" />
                  </div>
                  <div className="form-group">
                    <label>Client</label>
                    <input value={projectForm.client} onChange={e=>setProjectForm(f=>({...f,client:e.target.value}))} placeholder="Client name" />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={projectForm.type} onChange={e=>setProjectForm(f=>({...f,type:e.target.value}))}>
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                      <option value="data_entry">Data Entry</option>
                      <option value="chat">Chat Support</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Daily Target</label>
                    <input type="number" min="0" value={projectForm.daily_target} onChange={e=>setProjectForm(f=>({...f,daily_target:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={projectForm.start_date} onChange={e=>setProjectForm(f=>({...f,start_date:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={projectForm.status} onChange={e=>setProjectForm(f=>({...f,status:e.target.value}))}>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Description</label>
                    <textarea value={projectForm.description} onChange={e=>setProjectForm(f=>({...f,description:e.target.value}))}
                      rows={2} placeholder="Project details..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, resize:'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
