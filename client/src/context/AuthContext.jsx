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

  // Attach token to all API calls
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

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isEmployee = user?.role === 'employee';
  const canManage = isAdmin || isHR; // can see all employees/attendance/leaves

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, authFetch, isAdmin, isHR, isEmployee, canManage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
