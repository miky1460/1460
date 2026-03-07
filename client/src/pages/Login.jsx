import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span style={{ fontSize: 42, fontWeight: 900, color: '#000', background: '#4cba6f', padding: '8px 24px', borderRadius: 4, letterSpacing: 4, display: 'inline-block' }}>KANDZ</span>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>Demo Accounts:</strong></p>
          <div className="hint-table" style={{ fontSize: 12 }}>
            <div><span className="badge badge-admin">CEO</span> ceo@kandz.io / CEO@1234</div>
            <div><span className="badge badge-admin">Admin</span> admin@kandz.io / Admin@123</div>
            <div><span className="badge badge-hr">HR Manager</span> carol@kandz.io / HR@1234</div>
            <div><span className="badge badge-info">Ops Manager</span> omar@kandz.io / Ops@1234</div>
            <div><span className="badge badge-success">Team Lead</span> tariq@kandz.io / TL@1234</div>
            <div><span className="badge badge-success">Agent</span> sara@kandz.io / Sara@123</div>
            <div><span className="badge badge-warning">Finance</span> david@kandz.io / Finance@123</div>
            <div><span className="badge badge-emp">Office Mgr</span> eve@kandz.io / Office@123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
