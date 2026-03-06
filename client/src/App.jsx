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

const ROLE_BADGE = { admin: { label: '👑 Admin', color: '#dc2626' }, hr: { label: '🧑‍💼 HR', color: '#7c3aed' }, employee: { label: '👤 Employee', color: '#2563eb' } };

function Layout({ children, title }) {
  const { user, logout, isAdmin, canManage } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const badge = ROLE_BADGE[user?.role] || {};

  // Nav items filtered by role
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', end: true, show: true },
    { path: '/employees', label: canManage ? 'Employees' : 'My Profile', icon: '👥', show: true },
    { path: '/attendance', label: 'Attendance', icon: '📅', show: true },
    { path: '/leaves', label: 'Leave Management', icon: '🏖️', show: true },
    { path: '/payroll', label: 'Payroll', icon: '💰', show: true },
    { path: '/reports', label: 'Reports', icon: '📈', show: canManage },
    { path: '/users', label: 'User Accounts', icon: '🔐', show: isAdmin },
  ].filter(i => i.show);

  const mobileNav = navItems.slice(0, 5);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={closeSidebar} />

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo" style={{ padding: '14px 12px' }}>
          <img src="/kandz-logo-white.svg" alt="KANDZ Communications" style={{ width: '100%', maxWidth: 180, height: 'auto', display: 'block' }} />
        </div>

        {/* Logged-in user info */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#d1fae5' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: badge.color, fontWeight: 600, background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: 20, marginTop: 4 }}>{badge.label}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main Menu</div>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={closeSidebar}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
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
  const { user, loading, isAdmin, canManage } = useAuth();
  if (loading) return <div className="loading" style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>Loading...</div>;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Layout title="Dashboard"><Dashboard /></Layout>} />
      <Route path="/employees" element={<Layout title={canManage ? 'Employees' : 'My Profile'}><Employees /></Layout>} />
      <Route path="/attendance" element={<Layout title="Attendance"><Attendance /></Layout>} />
      <Route path="/leaves" element={<Layout title="Leave Management"><Leaves /></Layout>} />
      <Route path="/payroll" element={<Layout title="Payroll"><Payroll /></Layout>} />
      {canManage && <Route path="/reports" element={<Layout title="Reports"><Reports /></Layout>} />}
      {isAdmin && <Route path="/users" element={<Layout title="User Accounts"><UserManagement /></Layout>} />}
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
