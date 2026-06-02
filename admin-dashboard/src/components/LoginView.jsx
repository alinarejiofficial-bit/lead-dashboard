import React, { useState } from 'react';

export default function LoginView({ users, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const foundUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      if (foundUser.status === 'inactive') {
        setError('This account is currently deactivated. Contact Alina.');
        return;
      }
      setError('');
      onLogin(foundUser);
    } else {
      setError('Invalid email or password. Hint: admin/admin or password');
    }
  };

  const handleQuickLogin = (user) => {
    if (user.status === 'inactive') {
      setError('This account is currently deactivated. Contact Alina.');
      return;
    }
    setError('');
    onLogin(user);
  };

  // Get active users for quick login
  const demoUsers = users;

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-section login-logo">LF</div>
        <h1 className="login-title">LeadFlow Portal</h1>
        <p className="login-subtitle">Secure lead management dashboard administration</p>

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
              placeholder="e.g. alina@leadflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary">
            Sign In to Dashboard
          </button>
        </form>

        <div className="demo-accounts-divider">
          Quick Access Sandbox Profiles
        </div>

        <div className="demo-grid">
          {demoUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              className="demo-btn"
              onClick={() => handleQuickLogin(u)}
            >
              <div
                className="avatar"
                style={{ backgroundColor: u.color }}
              >
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="demo-name">{u.name}</div>
              <div
                className="demo-role"
                style={{
                  color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)'
                }}
              >
                {u.role}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
