import { useState, useEffect } from 'react';
import { initialUsers, initialLeads, initialLogs } from './data/mockData';
import LoginView from './components/LoginView';
import AdminDashboard from './components/AdminDashboard';
import AgentDashboard from './components/AgentDashboard';
import LeadDetailModal from './components/LeadDetailModal';
import UserModal from './components/UserModal';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('leadflow_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('leadflow_theme', theme);
  }, [theme]);

  // Modals state
  const [detailLead, setDetailLead] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const triggerSuccessBanner = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const apiFetch = async (url, options = {}) => {
    let token = localStorage.getItem('leadflow_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let fetchOptions = {
      ...options,
      headers,
    };

    try {
      let response = await fetch(url, fetchOptions);
      if (response.status === 401) {
        // Access token might be expired. Let's attempt to refresh it!
        const refreshToken = localStorage.getItem('leadflow_refresh');
        if (refreshToken) {
          console.log('Access token expired. Attempting token refresh...');
          try {
            const refreshRes = await fetch('http://127.0.0.1:8000/api/auth/refresh/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              console.log('Token refreshed successfully.');
              
              localStorage.setItem('leadflow_token', refreshData.access);
              if (refreshData.refresh) {
                localStorage.setItem('leadflow_refresh', refreshData.refresh);
              }
              
              // Retry original request with new access token
              headers['Authorization'] = `Bearer ${refreshData.access}`;
              fetchOptions.headers = headers;
              response = await fetch(url, fetchOptions);
              
              if (response.status === 401) {
                throw new Error('Unauthorized after refresh');
              }
              return response;
            } else {
              throw new Error('Refresh token rejected');
            }
          } catch (refreshErr) {
            console.warn('Token refresh failed. Revoking session.', refreshErr);
            handleLogout();
            triggerSuccessBanner('🔒 Your session has expired. Please sign in again.');
            throw new Error('Unauthorized');
          }
        } else {
          console.warn('Unauthorized request and no refresh token found. Revoking session.');
          handleLogout();
          triggerSuccessBanner('🔒 Your session has expired. Please sign in again.');
          throw new Error('Unauthorized');
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  };

  // 1. Initialize logs and session on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('leadflow_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      localStorage.setItem('leadflow_logs', JSON.stringify(initialLogs));
      setLogs(initialLogs);
    }

    const savedSession = localStorage.getItem('leadflow_current_user');
    const token = localStorage.getItem('leadflow_token');
    if (savedSession && token) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
    }
  }, []);

  // 2. Reactive leads and users loading after login / session restore
  useEffect(() => {
    if (!currentUser) return;

    const loadLeads = async () => {
      try {
        const response = await apiFetch('http://127.0.0.1:8000/api/leads/');
        if (!response.ok) throw new Error('API server returned error');
        const data = await response.json();
        setLeads(data);
        localStorage.setItem('leadflow_leads', JSON.stringify(data));
      } catch (err) {
        console.warn('Backend API not available. Loading from localStorage fallback.', err);
        const savedLeads = localStorage.getItem('leadflow_leads');
        if (savedLeads) {
          setLeads(JSON.parse(savedLeads));
        } else {
          localStorage.setItem('leadflow_leads', JSON.stringify(initialLeads));
          setLeads(initialLeads);
        }
      }
    };
    loadLeads();

    const loadUsers = async () => {
      try {
        const res = await apiFetch('http://127.0.0.1:8000/api/users/');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.warn('Could not load users from API. Using localStorage fallback.', err);
        const savedUsers = localStorage.getItem('leadflow_users');
        if (savedUsers) setUsers(JSON.parse(savedUsers));
        else setUsers(initialUsers);
      }
    };
    loadUsers();
  }, [currentUser]);

  // Save changes helper
  const saveLeadsToStorage = (updatedLeads) => {
    localStorage.setItem('leadflow_leads', JSON.stringify(updatedLeads));
    setLeads(updatedLeads);
    
    // Update active details modal if open
    if (detailLead) {
      const refreshedLead = updatedLeads.find(l => l.id === detailLead.id);
      if (refreshedLead) setDetailLead(refreshedLead);
    }
  };

  const saveUsersToStorage = (updatedUsers) => {
    localStorage.setItem('leadflow_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const addLog = (text, type = 'note') => {
    const newLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      text,
      type
    };
    const updatedLogs = [...logs, newLog];
    localStorage.setItem('leadflow_logs', JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
  };

  // Actions
  const handleLogin = (user, token, refresh) => {
    setCurrentUser(user);
    if (user.role === 'admin' && user.email === 'alina@leadflow.com') {
      localStorage.setItem('leadflow_admin_session', 'true');
    }
    localStorage.setItem('leadflow_current_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('leadflow_token', token);
    }
    if (refresh) {
      localStorage.setItem('leadflow_refresh', refresh);
    }
    addLog(`${user.name} logged into the dashboard.`, 'note');
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog(`${currentUser.name} signed out.`, 'note');
    }
    setCurrentUser(null);
    localStorage.removeItem('leadflow_current_user');
    localStorage.removeItem('leadflow_admin_session');
    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_refresh');
  };

  const handleSandboxSwitch = (userId) => {
    // Session switching is restricted strictly to when an admin session is active
    if (localStorage.getItem('leadflow_admin_session') !== 'true') {
      alert("Access Denied: Only Alina Reji is authorized to use the Sandbox Session Switcher!");
      return;
    }
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setCurrentUser(selectedUser);
      localStorage.setItem('leadflow_current_user', JSON.stringify(selectedUser));
      addLog(`[Sandbox] Switched session to ${selectedUser.name}`, 'note');
    }
  };

  // Lead Actions
  const handleAcceptLead = async (leadId, userId) => {
    const agent = users.find(u => u.id === userId);
    if (!agent) return;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const updatedLeadData = {
      ...targetLead,
      status: 'accepted',
      assignedTo: userId,
      assignedToName: agent.name,
      updatedAt: timestamp,
      notes: [
        ...targetLead.notes,
        { date: timestamp, text: `Lead accepted & locked to pipeline by agent ${agent.name}.` }
      ]
    };

    // Try backend API integration
    try {
      const response = await apiFetch(`http://127.0.0.1:8000/api/leads/${leadId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeadData)
      });
      if (response.ok) {
        const savedLead = await response.json();
        const updatedLeads = leads.map(l => l.id === leadId ? savedLead : l);
        saveLeadsToStorage(updatedLeads);
      } else {
        throw new Error('API update failed');
      }
    } catch (err) {
      console.warn('Could not sync with backend. Saving locally.', err);
      const updatedLeads = leads.map(l => l.id === leadId ? updatedLeadData : l);
      saveLeadsToStorage(updatedLeads);
    }

    const leadName = targetLead.name || 'Unknown';
    addLog(`Agent ${agent.name} accepted Lead: ${leadName}`, 'accept');
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    if (!currentUser) return;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const updatedLeadData = {
      ...targetLead,
      status: newStatus,
      updatedAt: timestamp,
      notes: [
        ...targetLead.notes,
        { date: timestamp, text: `Status updated to ${newStatus.toUpperCase()} by ${currentUser.name}.` }
      ]
    };

    // Try backend API integration
    try {
      const response = await apiFetch(`http://127.0.0.1:8000/api/leads/${leadId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeadData)
      });
      if (response.ok) {
        const savedLead = await response.json();
        const updatedLeads = leads.map(l => l.id === leadId ? savedLead : l);
        saveLeadsToStorage(updatedLeads);
      } else {
        throw new Error('API update failed');
      }
    } catch (err) {
      console.warn('Could not sync status with backend. Saving locally.', err);
      const updatedLeads = leads.map(l => l.id === leadId ? updatedLeadData : l);
      saveLeadsToStorage(updatedLeads);
    }

    const leadName = targetLead.name || 'Unknown';
    addLog(`Agent ${currentUser.name} marked Lead "${leadName}" as ${newStatus}`, newStatus === 'converted' ? 'convert' : 'reject');
  };

  const handleAddNote = async (leadId, noteObj) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const updatedLeadData = {
      ...targetLead,
      notes: [...targetLead.notes, noteObj]
    };

    // Try backend API integration
    try {
      const response = await apiFetch(`http://127.0.0.1:8000/api/leads/${leadId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeadData)
      });
      if (response.ok) {
        const savedLead = await response.json();
        const updatedLeads = leads.map(l => l.id === leadId ? savedLead : l);
        saveLeadsToStorage(updatedLeads);
      } else {
        throw new Error('API note save failed');
      }
    } catch (err) {
      console.warn('Could not sync note with backend. Saving locally.', err);
      const updatedLeads = leads.map(l => l.id === leadId ? updatedLeadData : l);
      saveLeadsToStorage(updatedLeads);
    }

    const leadName = targetLead.name || 'Unknown';
    addLog(`${currentUser.name} logged a timeline note for Lead: ${leadName}`, 'note');
  };

  // User Actions
  const handleAddUser = async (newUserObj) => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to register new user accounts!");
      return;
    }
    try {
      const res = await apiFetch('http://127.0.0.1:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserObj),
      });
      if (!res.ok) throw new Error('API error');
      const created = await res.json();
      setUsers(prev => [...prev, created]);
      addLog(`Administrator Alina Reji registered new account: ${created.name}`, 'create');
      triggerSuccessBanner(`🎉 Successfully registered "${created.name}" (${created.role.toUpperCase()})!`);
    } catch (err) {
      console.error('Failed to create user via API', err);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleEditUser = async (updatedUserObj) => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to edit user accounts!");
      return;
    }
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/users/${updatedUserObj.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUserObj),
      });
      if (!res.ok) throw new Error('API error');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      if (currentUser.id === updated.id) {
        setCurrentUser(updated);
        localStorage.setItem('leadflow_current_user', JSON.stringify(updated));
      }
      addLog(`Administrator Alina Reji updated user account: ${updated.name}`, 'note');
      triggerSuccessBanner(`🎉 Successfully updated "${updated.name}"!`);
    } catch (err) {
      console.error('Failed to update user via API', err);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to alter user account statuses!");
      return;
    }
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, status: nextStatus }),
      });
      if (!res.ok) throw new Error('API error');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      addLog(`Admin Alina Reji updated status of ${user.name} to ${nextStatus.toUpperCase()}`, 'note');
      triggerSuccessBanner(`User "${user.name}" status updated to ${nextStatus.toUpperCase()}.`);
    } catch (err) {
      console.error('Failed to toggle user status via API', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleResetDatabase = async () => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to reset the sandbox database!");
      return;
    }
    // Try backend API reset/seed
    try {
      const response = await apiFetch('http://127.0.0.1:8000/api/leads/reset/', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        localStorage.setItem('leadflow_leads', JSON.stringify(data.leads));
      } else {
        throw new Error('API reset failed');
      }
    } catch (err) {
      console.warn('Could not reset database on backend. Resetting locally.', err);
      localStorage.setItem('leadflow_leads', JSON.stringify(initialLeads));
      setLeads(initialLeads);
    }

    localStorage.removeItem('leadflow_users');
    localStorage.removeItem('leadflow_logs');
    
    localStorage.setItem('leadflow_users', JSON.stringify(initialUsers));
    localStorage.setItem('leadflow_logs', JSON.stringify(initialLogs));
    
    setUsers(initialUsers);
    setLogs(initialLogs);
    
    const adminUser = initialUsers[0]; // Alina Reji
    setCurrentUser(adminUser);
    localStorage.setItem('leadflow_current_user', JSON.stringify(adminUser));
    
    triggerSuccessBanner("💥 Sandbox database has been successfully reset back to defaults!");
  };

  return (
    <div className="app-container">
      {currentUser ? (
        <>
          {/* Dashboard Header Panel */}
          <header className="app-header">
            <div className="brand-section">
              <h2 className="brand-name">LeadFlow Dashboard</h2>
            </div>

            <div className="nav-actions">
              {/* Dev Sandbox Session Switcher (Alina Reji Only) */}
              {localStorage.getItem('leadflow_admin_session') === 'true' && (
                <div className="sandbox-switcher">
                  <span className="sandbox-label">🧪 Sandbox Switcher:</span>
                  <select
                    className="sandbox-select"
                    value={currentUser.id}
                    onChange={(e) => handleSandboxSwitch(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) {u.status === 'inactive' ? '[inactive]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* User Account Info */}
              <div className="user-profile">
                <div 
                  className="avatar" 
                  style={{ backgroundColor: currentUser.color || 'var(--accent)' }}
                >
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="user-info">
                  <span className="user-display-name">{currentUser.name}</span>
                  <span className="user-role-badge">{currentUser.role} Account</span>
                </div>
              </div>

              <button className="logout-button" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </header>

          {/* Core Body routing depending on roles */}
          <main className="dashboard-content">
            {successMsg && (
              <div className="success-banner" style={{ marginBottom: '1.5rem' }}>
                <span>✨</span> {successMsg}
              </div>
            )}
            
            {currentUser.role === 'admin' && currentUser.email === 'alina@leadflow.com' ? (
              <AdminDashboard
                currentUser={currentUser}
                leads={leads}
                users={users}
                logs={logs}
                onAddUserClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                onToggleUserStatus={handleToggleUserStatus}
                onEditUserClick={(user) => {
                  setEditingUser(user);
                  setShowUserModal(true);
                }}
                onViewLeadDetails={setDetailLead}
                onResetDatabase={handleResetDatabase}
                onAcceptLead={handleAcceptLead}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                theme={theme}
                onThemeChange={setTheme}
              />
            ) : (
              <AgentDashboard
                currentUser={currentUser}
                leads={leads}
                onAcceptLead={handleAcceptLead}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                onViewLeadDetails={setDetailLead}
                isAdminView={localStorage.getItem('leadflow_admin_session') === 'true'}
              />
            )}
          </main>

          {/* Details Modal */}
          {detailLead && (
            <LeadDetailModal
              lead={detailLead}
              currentUser={currentUser}
              onClose={() => setDetailLead(null)}
              onAddNote={handleAddNote}
            />
          )}

          {/* User registration modal */}
          {showUserModal && currentUser.email === 'alina@leadflow.com' && (
            <UserModal
              onClose={() => {
                setShowUserModal(false);
                setEditingUser(null);
              }}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              userToEdit={editingUser}
            />
          )}
        </>
      ) : (
        <LoginView
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}

export default App;
