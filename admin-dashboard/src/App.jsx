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

  // Initialize and seed database from API / localStorage
  useEffect(() => {
    // 1. Load Leads from Django API (with localStorage fallback)
    const loadLeads = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/leads/');
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

    // 2. Seed Users
    const savedUsers = localStorage.getItem('leadflow_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      localStorage.setItem('leadflow_users', JSON.stringify(initialUsers));
      setUsers(initialUsers);
    }

    // 3. Seed Logs
    const savedLogs = localStorage.getItem('leadflow_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      localStorage.setItem('leadflow_logs', JSON.stringify(initialLogs));
      setLogs(initialLogs);
    }

    // 4. Persistence of session login
    const savedSession = localStorage.getItem('leadflow_current_user');
    if (savedSession) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
    }
  }, []);

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
  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin' && user.email === 'alina@leadflow.com') {
      localStorage.setItem('leadflow_admin_session', 'true');
    }
    localStorage.setItem('leadflow_current_user', JSON.stringify(user));
    addLog(`${user.name} logged into the dashboard.`, 'note');
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog(`${currentUser.name} signed out.`, 'note');
    }
    setCurrentUser(null);
    localStorage.removeItem('leadflow_current_user');
    localStorage.removeItem('leadflow_admin_session');
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
      const response = await fetch(`http://127.0.0.1:8000/api/leads/${leadId}/`, {
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
      const response = await fetch(`http://127.0.0.1:8000/api/leads/${leadId}/`, {
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
      const response = await fetch(`http://127.0.0.1:8000/api/leads/${leadId}/`, {
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
  const handleAddUser = (newUserObj) => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to register new user accounts!");
      return;
    }
    const newId = `u-${Date.now()}`;
    const preparedUser = { ...newUserObj, id: newId };
    
    const updatedUsers = [...users, preparedUser];
    saveUsersToStorage(updatedUsers);
    
    addLog(`Administrator Alina Reji registered new account: ${preparedUser.name}`, 'create');
    triggerSuccessBanner(`🎉 Successfully registered new user "${preparedUser.name}" (${preparedUser.role.toUpperCase()})! They are active and can now log in using password "${preparedUser.password}".`);
  };

  const handleEditUser = (updatedUserObj) => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to edit user accounts!");
      return;
    }
    const updatedUsers = users.map(u => u.id === updatedUserObj.id ? updatedUserObj : u);
    saveUsersToStorage(updatedUsers);
    
    // If Alina updated her own avatar/theme/details, update the session
    if (currentUser.id === updatedUserObj.id) {
      setCurrentUser(updatedUserObj);
      localStorage.setItem('leadflow_current_user', JSON.stringify(updatedUserObj));
    }

    addLog(`Administrator Alina Reji updated user account: ${updatedUserObj.name}`, 'note');
    triggerSuccessBanner(`🎉 Successfully updated user account "${updatedUserObj.name}"!`);
  };

  const handleToggleUserStatus = (userId) => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to alter user account statuses!");
      return;
    }
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const nextStatus = user.status === 'active' ? 'inactive' : 'active';
        addLog(`Admin Alina Reji updated status of user ${user.name} to ${nextStatus.toUpperCase()}`, 'note');
        triggerSuccessBanner(`User "${user.name}" account status has been updated to ${nextStatus.toUpperCase()}.`);
        return { ...user, status: nextStatus };
      }
      return user;
    });
    saveUsersToStorage(updatedUsers);
  };

  const handleResetDatabase = async () => {
    if (!currentUser || currentUser.email !== 'alina@leadflow.com') {
      alert("Access Denied: Only Alina Reji is authorized to reset the sandbox database!");
      return;
    }
    // Try backend API reset/seed
    try {
      const response = await fetch('http://127.0.0.1:8000/api/leads/reset/', {
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
          users={users} 
          onLogin={handleLogin} 
        />
      )}
    </div>
  );
}

export default App;
