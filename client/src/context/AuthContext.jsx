import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hr_token');
    const saved = localStorage.getItem('hr_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('hr_token', data.token);
    localStorage.setItem('hr_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    setUser(null);
  };

  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('hr_token');
    return fetch(`${API}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  };

  const role = user?.role;
  const isCEO          = role === 'ceo';
  const isAdmin        = role === 'admin';
  const isHR           = role === 'hr';
  const isOpsManager   = role === 'ops_manager';
  const isTeamLead     = role === 'team_lead';
  const isAgent        = role === 'agent';
  const isOfficeManager= role === 'office_manager';
  const isFinance      = role === 'finance';
  const isEmployee     = role === 'employee';

  // Legacy helpers
  const canManage      = isCEO || isAdmin || isHR;
  const isManagement   = isCEO || isAdmin;
  const canViewAll     = isCEO || isAdmin;

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, authFetch,
      isCEO, isAdmin, isHR, isOpsManager, isTeamLead,
      isAgent, isOfficeManager, isFinance, isEmployee,
      canManage, isManagement, canViewAll,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
