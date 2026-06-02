import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('agent'); // 'agent' or 'admin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      onLogin(data.user, data.access, data.refresh);
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">

        <div className="login-tabs" style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setLoginType('agent'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: loginType === 'agent' ? '2px solid var(--accent)' : '2px solid transparent',
              color: loginType === 'agent' ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: loginType === 'agent' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Agent Portal
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('admin'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: loginType === 'admin' ? '2px solid var(--accent)' : '2px solid transparent',
              color: loginType === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: loginType === 'admin' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Admin Portal
          </button>
        </div>

        <h1 className="login-title">
          {loginType === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
        </h1>
        <p className="login-subtitle">
          {loginType === 'admin' ? 'System administration and user management' : 'Secure lead management pipeline'}
        </p>

        {error && (
          <div style={{
            background: 'var(--color-rejected-light)',
            color: 'var(--color-rejected)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <div className="password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '40px' }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? 'Signing in…'
              : loginType === 'admin'
                ? 'Sign In to Admin Dashboard'
                : 'Sign In to Agent Pipeline'}
          </button>
        </form>

      </div>
    </div>
  );
}
