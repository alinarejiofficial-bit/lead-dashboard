import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck } from 'lucide-react';

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
      {/* Decorative Background Elements */}
      <div className="login-grid-overlay"></div>
      <div className="login-bg-shape shape-top-right"></div>
      <div className="login-bg-shape shape-bottom-left"></div>
      <div className="login-dot-grid dot-grid-left"></div>
      <div className="login-dot-grid dot-grid-right"></div>

      <div className="login-card">
        
        {/* Portal Tabs */}
        <div className="login-tabs-container">
          <button
            type="button"
            className={`login-tab-btn ${loginType === 'agent' ? 'active' : ''}`}
            onClick={() => { setLoginType('agent'); setError(''); }}
          >
            Agent Portal
          </button>
          <button
            type="button"
            className={`login-tab-btn ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => { setLoginType('admin'); setError(''); }}
          >
            Admin Portal
          </button>
        </div>

        {/* Header Icon + Titles */}
        <div className="login-header-row">
          <div className="login-icon-box">
            <div className="security-icon-wrapper">
              <User size={28} strokeWidth={1.5} className="login-user-icon" />
              <div className="login-shield-badge">
                <ShieldCheck size={14} strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <div className="login-header-text">
            <h2 className="login-title">
              {loginType === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
            </h2>
            <p className="login-subtitle">
              {loginType === 'admin' ? 'System administration and user management' : 'Secure lead management pipeline'}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="login-error-banner">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="email-input">EMAIL ADDRESS</label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon-left" size={18} />
              <input
                id="email-input"
                type="email"
                className="login-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-form-label" htmlFor="password-input">PASSWORD</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon-left" size={18} />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                {loginType === 'admin' ? 'Sign In to Admin Dashboard' : 'Sign In to Agent Pipeline'}
                <svg className="login-submit-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="login-footer">
          <span className="login-footer-line"></span>
          <span className="login-footer-text">Your data is protected with enterprise-grade security</span>
          <span className="login-footer-line"></span>
        </div>

      </div>
    </div>
  );
}
