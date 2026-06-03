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

export default function UserModal({ onClose, onAddUser, onEditUser, userToEdit, currentUser }) {
  const [name, setName] = useState(userToEdit ? userToEdit.name : '');
  const [email, setEmail] = useState(userToEdit ? userToEdit.email : '');
  const [password, setPassword] = useState(userToEdit ? userToEdit.password : '');
  const [role, setRole] = useState(userToEdit ? userToEdit.role : 'agent');
  const [color, setColor] = useState(userToEdit ? userToEdit.color : AVATAR_COLORS[0]);
  const [avatar, setAvatar] = useState(userToEdit ? (userToEdit.avatar || '') : '');
  const [avatarType, setAvatarType] = useState(userToEdit && userToEdit.avatar ? 'image' : 'color');
  const [avatarImage, setAvatarImage] = useState(userToEdit ? userToEdit.avatar : '');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarImage(event.target.result);
      setAvatar(event.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || (!userToEdit && !password)) {
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
      role,
      color,
      avatar: avatarType === 'image' ? (avatarImage || '') : ''
    };

    if (password) {
      userData.password = password;
    }

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
                  placeholder="Enter full name"
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
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-pass">
                  Login Password {userToEdit ? '(optional)' : '*'}
                </label>
                <input
                  id="user-pass"
                  type="password"
                  className="form-input"
                  placeholder={userToEdit ? "Leave blank to keep unchanged" : "Minimum 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!userToEdit}
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
                  disabled={(userToEdit && userToEdit.id === 'u-1') || (currentUser && currentUser.email !== 'alina@leadflow.com')}
                >
                  <option value="agent">Agent (Lead Pool Access)</option>
                  <option value="admin">Administrator (Full Controls)</option>
                </select>
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Profile Avatar Customization</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginTop: '0.25rem'
                }}>
                  {/* Live Avatar Preview */}
                  <div 
                    className="avatar" 
                    style={{ 
                      backgroundColor: color,
                      width: '60px',
                      height: '60px',
                      fontSize: '1.5rem',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {avatarType === 'image' && avatarImage ? (
                      <img 
                        src={avatarImage} 
                        alt="Avatar Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?'
                    )}
                  </div>

                  {/* Avatar Type Selection & Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={`btn-sm ${avatarType === 'color' ? 'accept' : ''}`}
                        style={{ border: '1px solid var(--border-color)', background: avatarType === 'color' ? '' : 'transparent' }}
                        onClick={() => setAvatarType('color')}
                      >
                        🎨 Initials & Color
                      </button>
                      <button
                        type="button"
                        className={`btn-sm ${avatarType === 'image' ? 'accept' : ''}`}
                        style={{ border: '1px solid var(--border-color)', background: avatarType === 'image' ? '' : 'transparent' }}
                        onClick={() => setAvatarType('image')}
                      >
                        📷 Upload Photo
                      </button>
                    </div>

                    {avatarType === 'color' ? (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {AVATAR_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            style={{
                              backgroundColor: c,
                              width: '24px',
                              height: '24px',
                              borderRadius: 'var(--radius-full)',
                              border: color === c ? '2.5px solid var(--text-primary)' : '1px solid transparent',
                              cursor: 'pointer',
                              transform: color === c ? 'scale(1.15)' : 'none',
                              transition: 'all var(--transition-fast)'
                            }}
                            title={c}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input
                          type="file"
                          accept="image/*"
                          id="avatar-file-input"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="avatar-file-input"
                          className="btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.45rem 0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            margin: 0
                          }}
                        >
                          Choose Image File
                        </label>
                        {avatarImage && (
                          <button
                            type="button"
                            className="btn-sm reject"
                            style={{ padding: '0.45rem 0.75rem' }}
                            onClick={() => setAvatarImage('')}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
