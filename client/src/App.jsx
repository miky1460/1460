import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', end: true },
  { path: '/employees', label: 'Employees', icon: '👥' },
  { path: '/attendance', label: 'Attendance', icon: '📅' },
  { path: '/leaves', label: 'Leaves', icon: '🏖️' },
  { path: '/payroll', label: 'Payroll', icon: '💰' },
  { path: '/reports', label: 'Reports', icon: '📈' },
];

// Bottom nav shows only 5 most important items on mobile
const mobileNavItems = [
  { path: '/', label: 'Home', icon: '📊', end: true },
  { path: '/attendance', label: 'Attend', icon: '📅' },
  { path: '/leaves', label: 'Leave', icon: '🏖️' },
  { path: '/employees', label: 'Staff', icon: '👥' },
  { path: '/reports', label: 'Reports', icon: '📈' },
];

function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
      />

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">👥</span>
          <div>
            <h1>HR Portal</h1>
            <span>Management System</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Main Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, color: '#c7d2fe' }}>HR Management v1.0</div>
          <div style={{ marginTop: 2 }}>© 2025 Your Company</div>
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
            <div className="user-avatar">AD</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {mobileNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-emoji">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout title="Dashboard"><Dashboard /></Layout>} />
        <Route path="/employees" element={<Layout title="Employees"><Employees /></Layout>} />
        <Route path="/attendance" element={<Layout title="Attendance"><Attendance /></Layout>} />
        <Route path="/leaves" element={<Layout title="Leave Management"><Leaves /></Layout>} />
        <Route path="/payroll" element={<Layout title="Payroll"><Payroll /></Layout>} />
        <Route path="/reports" element={<Layout title="Reports"><Reports /></Layout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
