import React, { useState } from 'react';

const AVATAR_COLORS = [
  '#aa3bff', // Purple
  '#00d2fc', // Cyan
  '#ff9f43', // Orange
  '#10ac84', // Emerald
  '#ee5253', // Red
  '#54a0ff', // Blue
  '#ff9ff3', // Pink
  '#05c46b'  // Green
];

export default function UserModal({ onClose, onAddUser, onEditUser, userToEdit }) {
  const [name, setName] = useState(userToEdit ? userToEdit.name : '');
  const [email, setEmail] = useState(userToEdit ? userToEdit.email : '');
  const [password, setPassword] = useState(userToEdit ? userToEdit.password : '');
  const [role, setRole] = useState(userToEdit ? userToEdit.role : 'agent');
  const [color, setColor] = useState(userToEdit ? userToEdit.color : AVATAR_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    const userData = {
      name,
      email,
      password,
      role,
      color
    };

    if (userToEdit) {
      onEditUser({
        ...userToEdit,
        ...userData
      });
    } else {
      onAddUser({
        ...userData,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0]
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {userToEdit ? `Edit User Account: ${userToEdit.name}` : 'Register New Dashboard Account'}
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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

            <div className="modal-form-grid">
              <div className="form-group col-span-2">
                <label className="form-label" htmlFor="user-fullname">Full Name *</label>
                <input
                  id="user-fullname"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Johnathan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-email">Email Address *</label>
                <input
                  id="user-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. jsmith@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-pass">Login Password *</label>
                <input
                  id="user-pass"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-role">System Role</label>
                <select
                  id="user-role"
                  className="select-filter"
                  style={{ width: '100%', height: '42px', padding: '0.5rem' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={userToEdit && userToEdit.id === 'u-1'} // Alina Reji cannot have her primary admin role downgraded
                >
                  <option value="agent">Agent (Lead Pool Access)</option>
                  <option value="admin">Administrator (Full Controls)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Theme Color</label>
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        backgroundColor: c,
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        border: color === c ? '3px solid var(--text-primary)' : '1px solid transparent',
                        cursor: 'pointer',
                        transform: color === c ? 'scale(1.15)' : 'none',
                        transition: 'all var(--transition-fast)'
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {userToEdit ? 'Save Changes' : 'Register User Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
