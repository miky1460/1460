import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Operations from './pages/Operations';
import Finance from './pages/Finance';
import Announcements from './pages/Announcements';
import OfficeRequests from './pages/OfficeRequests';
import Recruitment from './pages/Recruitment';
import Policies from './pages/Policies';

const ROLE_BADGE = {
  ceo:          { label: '👑 CEO',            color: '#dc2626' },
  admin:        { label: '🔐 Admin',          color: '#7c3aed' },
  hr:           { label: '🧑‍💼 HR',            color: '#2563eb' },
  ops_manager:  { label: '📊 Ops Manager',    color: '#0891b2' },
  team_lead:    { label: '🎯 Team Lead',      color: '#0d9488' },
  agent:        { label: '📞 Agent',          color: '#16a34a' },
  office_manager:{ label: '🏢 Office Mgr',   color: '#9333ea' },
  finance:      { label: '💼 Finance',        color: '#ca8a04' },
  employee:     { label: '👤 Employee',       color: '#6b7280' },
};

function Layout({ children, title }) {
  const { user, logout, isCEO, isAdmin, isHR, isOpsManager, isTeamLead, isAgent, isOfficeManager, isFinance, canManage } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const badge = ROLE_BADGE[user?.role] || {};

  const isOps = isOpsManager || isTeamLead || isAgent;

  const navItems = [
    { path: '/',              label: 'Dashboard',       icon: '📊', end: true, show: true },
    // HR & Employee Management
    { path: '/employees',     label: canManage ? 'Employees' : 'My Profile', icon: '👥', show: true },
    { path: '/attendance',    label: 'Attendance',      icon: '📅', show: true },
    { path: '/leaves',        label: 'Leave Management',icon: '🏖️', show: !isOpsManager && !isFinance && !isOfficeManager },
    { path: '/payroll',       label: 'Payroll',         icon: '💰', show: isCEO || isAdmin || isHR || isFinance },
    { path: '/reports',       label: 'HR Reports',      icon: '📈', show: canManage },
    { path: '/recruitment',   label: 'Recruitment',     icon: '🎯', show: isCEO || isAdmin || isHR },
    { path: '/policies',      label: 'Policy Playbook', icon: '📋', show: true },
    // Operations
    { path: '/operations',    label: 'Operations',      icon: '📞', show: isCEO || isAdmin || isOps },
    // Finance / Bookkeeping (dept heads submit their own entries)
    { path: '/finance',       label: isFinance||isCEO||isAdmin ? 'Finance' : 'My Bookkeeping', icon: '💼', show: isCEO || isAdmin || isFinance || isHR || isOpsManager || isOfficeManager },
    // Office
    { path: '/office',        label: 'Office Requests', icon: '🏢', show: isCEO || isAdmin || isOfficeManager },
    // Communication
    { path: '/announcements', label: 'Announcements',   icon: '📢', show: true },
    // Admin
    { path: '/users',         label: 'User Accounts',   icon: '🔐', show: isAdmin || isCEO },
  ].filter(i => i.show);

  const mobileNav = navItems.slice(0, 5);
  const closeSidebar = () => setSidebarOpen(false);

  // Group nav items for display
  const coreItems = navItems.filter(i => ['/', '/employees', '/attendance', '/leaves', '/payroll', '/reports', '/recruitment', '/policies'].includes(i.path));
  const opsItems  = navItems.filter(i => ['/operations'].includes(i.path));
  const bizItems  = navItems.filter(i => ['/finance', '/office', '/announcements'].includes(i.path));
  const adminItems= navItems.filter(i => ['/users'].includes(i.path));

  const NavGroup = ({ title: gt, items }) => items.length === 0 ? null : (
    <>
      <div className="nav-section-title">{gt}</div>
      {items.map(item => (
        <NavLink key={item.path} to={item.path} end={item.end}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={closeSidebar}>
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={closeSidebar} />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo" style={{ padding: '14px 12px' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#000', background: '#4cba6f', padding: '6px 18px', borderRadius: 4, letterSpacing: 2, display: 'inline-block' }}>KANDZ</span>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#d1fae5' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: badge.color, fontWeight: 600, background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: 20, marginTop: 4 }}>{badge.label}</div>
        </div>

        <nav className="sidebar-nav">
          <NavGroup title="Main" items={coreItems} />
          <NavGroup title="Operations" items={opsItems} />
          <NavGroup title="Business" items={bizItems} />
          <NavGroup title="Admin" items={adminItems} />
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, color: '#86efac', marginBottom: 8 }}>KANDZ Communications v2.0</div>
          <button onClick={logout} className="btn" style={{ width: '100%', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <h2>{title}</h2>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">{today}</span>
            <div className="user-avatar" title={user?.name}>{user?.name?.substring(0,2).toUpperCase()}</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {mobileNav.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-emoji">{item.icon}</span>
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ProtectedApp() {
  const { user, loading, isCEO, isAdmin, isHR, isOpsManager, isTeamLead, isAgent, isOfficeManager, isFinance, canManage } = useAuth();
  if (loading) return <div className="loading" style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>Loading...</div>;
  if (!user) return <Login />;

  const isOps = isOpsManager || isTeamLead || isAgent;

  return (
    <Routes>
      <Route path="/"              element={<Layout title="Dashboard"><Dashboard /></Layout>} />
      <Route path="/employees"     element={<Layout title={canManage ? 'Employees' : 'My Profile'}><Employees /></Layout>} />
      <Route path="/attendance"    element={<Layout title="Attendance"><Attendance /></Layout>} />
      <Route path="/leaves"        element={<Layout title="Leave Management"><Leaves /></Layout>} />
      <Route path="/announcements" element={<Layout title="Announcements"><Announcements /></Layout>} />

      {(isCEO||isAdmin||isHR||isFinance) && (
        <Route path="/payroll" element={<Layout title="Payroll"><Payroll /></Layout>} />
      )}
      {canManage && (
        <Route path="/reports" element={<Layout title="Reports"><Reports /></Layout>} />
      )}
      {(isCEO||isAdmin||isHR) && (
        <Route path="/recruitment" element={<Layout title="Recruitment Pipeline"><Recruitment /></Layout>} />
      )}
      <Route path="/policies" element={<Layout title="Policy Playbook"><Policies /></Layout>} />
      {(isCEO||isAdmin||isOps) && (
        <Route path="/operations" element={<Layout title="Operations"><Operations /></Layout>} />
      )}
      {(isCEO||isAdmin||isFinance||isHR||isOpsManager||isOfficeManager) && (
        <Route path="/finance" element={<Layout title={isFinance||isCEO||isAdmin ? 'Finance' : 'My Bookkeeping'}><Finance /></Layout>} />
      )}
      {(isCEO||isAdmin||isOfficeManager) && (
        <Route path="/office" element={<Layout title="Office Requests"><OfficeRequests /></Layout>} />
      )}
      {(isAdmin||isCEO) && (
        <Route path="/users" element={<Layout title="User Accounts"><UserManagement /></Layout>} />
      )}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
