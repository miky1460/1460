import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard data.</div>;

  const statusBadge = (s) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s}</span>;
  };

  const maxDept = Math.max(...(data.deptBreakdown?.map(d => d.count) || [1]));

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{data.totalEmployees}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{data.totalDepts} departments</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Present Today</div>
          <div className="stat-value">{data.presentToday}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {data.totalEmployees > 0 ? Math.round(data.presentToday / data.totalEmployees * 100) : 0}% attendance
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🏖️</div>
          <div className="stat-label">On Leave Today</div>
          <div className="stat-value">{data.onLeaveToday}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{data.pendingLeaves} pending requests</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Monthly Payroll</div>
          <div className="stat-value">${(data.totalPayroll || 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{data.pendingPayroll} pending payments</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Department Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Department Breakdown</h3>
            <Link to="/employees" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="chart-bar-container">
            {data.deptBreakdown?.map(d => (
              <div key={d.department} className="chart-bar-row">
                <div className="chart-bar-label">{d.department}</div>
                <div className="chart-bar-bg">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${(d.count / maxDept) * 100}%` }}
                  >
                    {d.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Leave Requests</h3>
            <Link to="/leaves" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {data.recentLeaves?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>No leave requests</h4>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recentLeaves?.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f9fafb', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{l.first_name} {l.last_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {l.leave_type} · {l.start_date} → {l.end_date}
                    </div>
                  </div>
                  {statusBadge(l.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/employees" className="btn btn-primary">+ Add Employee</Link>
          <Link to="/attendance" className="btn btn-success">Mark Attendance</Link>
          <Link to="/leaves" className="btn btn-warning">Review Leaves</Link>
          <Link to="/payroll" className="btn btn-info">Run Payroll</Link>
          <Link to="/reports" className="btn btn-ghost">View Reports</Link>
        </div>
      </div>
    </div>
  );
}
