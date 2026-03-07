import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => 'PKR ' + Number(n||0).toLocaleString();

function StatCard({ icon, label, value, sub, color='primary', to }) {
  const inner = (
    <div className={`stat-card ${color}`} style={to?{cursor:'pointer'}:{}}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {sub && <div style={{ fontSize:12, color:'#6b7280' }}>{sub}</div>}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration:'none' }}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { authFetch, isCEO, isAdmin, isHR, isOpsManager, isTeamLead, isAgent, isOfficeManager, isFinance, canManage } = useAuth();
  const isManagement = isCEO || isAdmin;

  const [hr, setHr]         = useState(null);
  const [ops, setOps]       = useState(null);
  const [finSum, setFinSum] = useState(null);
  const [ann, setAnn]       = useState([]);
  const [offReqs, setOffReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loads = [];
    if (isCEO || isAdmin || isHR || canManage) {
      loads.push(authFetch('/api/reports/dashboard').then(r=>r.json()).then(setHr).catch(()=>{}));
    }
    if (isCEO || isAdmin || isOpsManager) {
      loads.push(authFetch('/api/operations/reports/today').then(r=>r.json()).then(setOps).catch(()=>{}));
    }
    if (isCEO || isAdmin || isFinance) {
      loads.push(authFetch('/api/finance/summary').then(r=>r.json()).then(setFinSum).catch(()=>{}));
    }
    loads.push(authFetch('/api/announcements').then(r=>r.json()).then(d=>setAnn(Array.isArray(d)?d.slice(0,5):[])).catch(()=>{}));
    if (isManagement || isOfficeManager) {
      loads.push(authFetch('/api/office/requests?status=pending').then(r=>r.json()).then(setOffReqs).catch(()=>{}));
    }
    Promise.all(loads).finally(()=>setLoading(false));
  }, []);

  const statusBadge = (s) => {
    const map = { pending:'warning', approved:'success', rejected:'danger' };
    return <span className={`badge badge-${map[s]||'gray'}`}>{s}</span>;
  };

  if (loading) return <div className="loading" style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>Loading dashboard...</div>;

  return (
    <div>
      {/* HR Stats */}
      {hr && (
        <>
          <div style={{fontWeight:700,fontSize:13,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>👥 People & HR</div>
          <div className="stat-grid" style={{marginBottom:20}}>
            <StatCard icon="👥" label="Total Employees" value={hr.totalEmployees} sub={`${hr.totalDepts} departments`} color="primary" to="/employees" />
            <StatCard icon="✅" label="Present Today" value={hr.presentToday} sub={`${hr.totalEmployees>0?Math.round(hr.presentToday/hr.totalEmployees*100):0}% attendance`} color="success" to="/attendance" />
            <StatCard icon="🏖️" label="On Leave Today" value={hr.onLeaveToday} sub={`${hr.pendingLeaves} pending`} color="warning" to="/leaves" />
            <StatCard icon="💰" label="Monthly Payroll" value={fmt(hr.totalPayroll)} sub={`${hr.pendingPayroll} pending`} color="info" to="/payroll" />
          </div>
        </>
      )}

      {/* Ops Stats */}
      {ops && (
        <>
          <div style={{fontWeight:700,fontSize:13,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>📞 Operations — Today</div>
          <div className="stat-grid" style={{marginBottom:20}}>
            <StatCard icon="📞" label="Calls Made" value={ops.summary?.totalCalls} color="primary" to="/operations" />
            <StatCard icon="🎯" label="Leads Generated" value={ops.summary?.totalLeads} color="success" to="/operations" />
            <StatCard icon="✅" label="Conversions" value={ops.summary?.totalConv} color="info" to="/operations" />
            <StatCard icon="📄" label="Data Entries" value={ops.summary?.totalEntries} color="warning" to="/operations" />
          </div>
        </>
      )}

      {/* Finance Stats */}
      {finSum && (
        <>
          <div style={{fontWeight:700,fontSize:13,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>💼 Finance — This Month</div>
          <div className="stat-grid" style={{marginBottom:20}}>
            {finSum.rows?.map(r => (
              <StatCard key={r.type}
                icon={r.type==='expense'?'💸':r.type==='budget'?'📋':r.type==='invoice'?'🧾':'💳'}
                label={r.type.charAt(0).toUpperCase()+r.type.slice(1)}
                value={fmt(r.total)} sub={`${r.count} entries`}
                color={r.type==='expense'?'danger':r.type==='budget'?'info':'warning'}
                to="/finance" />
            ))}
            {finSum.pending > 0 && <StatCard icon="⚠️" label="Pending Approvals" value={finSum.pending} color="warning" to="/finance" />}
          </div>
        </>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* Announcements */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:600}}>📢 Announcements</h3>
            <Link to="/announcements" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {!ann.length ? (
            <div className="empty-state"><div className="empty-icon">📢</div><h4>No announcements</h4></div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {ann.map(a => (
                <div key={a.id} style={{padding:'10px 12px',background:'#f9fafb',borderRadius:8,borderLeft:`3px solid ${a.priority==='urgent'?'#dc2626':a.priority==='important'?'#f59e0b':'#16a34a'}`}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{a.title}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>{a.content.substring(0,80)}{a.content.length>80?'...':''}</div>
                  <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>
                    <span className={`badge badge-${a.priority==='urgent'?'danger':a.priority==='important'?'warning':'gray'}`} style={{fontSize:10}}>{a.priority}</span>
                    {' '}{a.author_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave requests or office requests */}
        <div className="card">
          {hr?.recentLeaves?.length > 0 ? (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600}}>🏖️ Recent Leave Requests</h3>
                <Link to="/leaves" className="btn btn-ghost btn-sm">View All</Link>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {hr.recentLeaves.map(l => (
                  <div key={l.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px',background:'#f9fafb',borderRadius:8}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:500}}>{l.first_name} {l.last_name}</div>
                      <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{l.leave_type} · {l.start_date} → {l.end_date}</div>
                    </div>
                    {statusBadge(l.status)}
                  </div>
                ))}
              </div>
            </>
          ) : offReqs.length > 0 ? (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600}}>📦 Pending Office Requests</h3>
                <Link to="/office" className="btn btn-ghost btn-sm">View All</Link>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {offReqs.slice(0,5).map(r => (
                  <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px',background:'#f9fafb',borderRadius:8}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:500}}>{r.title}</div>
                      <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{r.category} · {r.priority} priority</div>
                    </div>
                    <span className={`badge badge-${r.priority==='urgent'?'danger':r.priority==='high'?'warning':'gray'}`}>{r.priority}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state"><div className="empty-icon">📋</div><h4>All clear</h4></div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{marginTop:20}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Quick Actions</h3>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {canManage && <Link to="/employees" className="btn btn-primary">+ Add Employee</Link>}
          {(canManage||isAgent||isTeamLead) && <Link to="/attendance" className="btn btn-success">Mark Attendance</Link>}
          {canManage && <Link to="/leaves" className="btn btn-warning">Review Leaves</Link>}
          {(isCEO||isAdmin||isFinance) && <Link to="/payroll" className="btn btn-info">Payroll</Link>}
          {(isCEO||isAdmin||isOpsManager||isTeamLead||isAgent) && <Link to="/operations" className="btn btn-primary">Operations</Link>}
          {(isCEO||isAdmin||isOfficeManager) && <Link to="/office" className="btn btn-ghost">Office Requests</Link>}
          {(isCEO||isAdmin||isFinance) && <Link to="/finance" className="btn btn-ghost">Finance</Link>}
          <Link to="/announcements" className="btn btn-ghost">Announcements</Link>
        </div>
      </div>
    </div>
  );
}
