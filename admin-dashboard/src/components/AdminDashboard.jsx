import React, { useState } from 'react';

export default function AdminDashboard({
  leads,
  users,
  logs,
  onAddUserClick,
  onToggleUserStatus,
  onEditUserClick,
  onViewLeadDetails,
  onResetDatabase
}) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'leads', 'users', 'reports', 'settings'

  // Leads list states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // 1. Calculate administrative metrics
  const totalLeads = leads.length;
  const openLeads = leads.filter(l => l.status === 'open').length;
  const activePipeline = leads.filter(l => l.status === 'accepted').length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const rejectedLeads = leads.filter(l => l.status === 'rejected').length;
  
  const closedCount = convertedLeads + rejectedLeads;
  const conversionRate = closedCount > 0 
    ? Math.round((convertedLeads / closedCount) * 100) 
    : 0;

  const totalValue = leads.reduce((acc, lead) => acc + (lead.budget || 0), 0);

  // Filter master list
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    
    let matchesAssignee = true;
    if (assigneeFilter !== 'All') {
      if (assigneeFilter === 'unassigned') {
        matchesAssignee = !lead.assignedTo;
      } else {
        matchesAssignee = lead.assignedTo === assigneeFilter;
      }
    }
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Recent leads (sorted by last updated / created)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUserMetrics = (userId) => {
    const userLeads = leads.filter(l => l.assignedTo === userId);
    return {
      claimed: userLeads.filter(l => l.status === 'accepted').length,
      converted: userLeads.filter(l => l.status === 'converted').length,
      rejected: userLeads.filter(l => l.status === 'rejected').length
    };
  };

  // Rendering Right Panels based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="main-content-panel">
            {/* KPI Cards Grid */}
            <div className="kpi-grid">
              <div className="kpi-card" onClick={() => setActiveTab('leads')}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Leads</span>
                  <span className="kpi-value">{totalLeads}</span>
                  <span className="kpi-subtext">{openLeads} open in pool</span>
                </div>
                <div className="kpi-icon icon-purple">💼</div>
              </div>

              <div className="kpi-card" onClick={() => setActiveTab('leads')}>
                <div className="kpi-info">
                  <span className="kpi-label">Accepted Leads</span>
                  <span className="kpi-value">{activePipeline}</span>
                  <span className="kpi-subtext">Currently in pipeline</span>
                </div>
                <div className="kpi-icon icon-accepted">⏳</div>
              </div>

              <div className="kpi-card" onClick={() => setActiveTab('leads')}>
                <div className="kpi-info">
                  <span className="kpi-label">Rejected Leads</span>
                  <span className="kpi-value">{rejectedLeads}</span>
                  <span className="kpi-subtext">Leads dropped</span>
                </div>
                <div className="kpi-icon icon-rejected">❌</div>
              </div>

              <div className="kpi-card" onClick={() => setActiveTab('leads')}>
                <div className="kpi-info">
                  <span className="kpi-label">Converted Leads</span>
                  <span className="kpi-value">{convertedLeads}</span>
                  <span className="kpi-subtext">Conversion rate: {conversionRate}%</span>
                </div>
                <div className="kpi-icon icon-converted">🏆</div>
              </div>
            </div>

            <div className="work-grid" style={{ gridTemplateColumns: '2.3fr 1fr' }}>
              {/* Recent Leads Table */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span>⚡</span> Recent Activity Leads
                  </h3>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => setActiveTab('leads')}
                  >
                    View All Leads
                  </button>
                </div>
                <div className="panel-body">
                  <div className="table-wrapper">
                    <table className="lead-table">
                      <thead>
                        <tr>
                          <th>Lead Info</th>
                          <th>Company</th>
                          <th>Budget</th>
                          <th>Assignee</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLeads.map((lead) => (
                          <tr key={lead.id} onClick={() => onViewLeadDetails(lead)}>
                            <td>
                              <div className="user-cell">
                                <div className="avatar" style={{
                                  backgroundColor: lead.assignedTo 
                                    ? (users.find(u => u.id === lead.assignedTo)?.color || 'var(--accent)')
                                    : 'var(--text-muted)',
                                  width: '30px', height: '30px', fontSize: '0.8rem'
                                }}>
                                  {lead.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="user-cell-info">
                                  <span className="user-cell-name">{lead.name}</span>
                                  <span className="user-cell-email">{lead.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>{lead.company}</td>
                            <td style={{ fontWeight: '600' }}>{formatCurrency(lead.budget)}</td>
                            <td>
                              {lead.assignedTo ? (
                                <span style={{ fontWeight: '500' }}>{lead.assignedToName}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${lead.status}`}>
                                {lead.status === 'accepted' ? 'pipeline' : lead.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span>📝</span> Live Activity Log
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="audit-log-list" style={{ maxHeight: '310px' }}>
                    {logs.slice(0, 15).reverse().map((log) => (
                      <div key={log.id} className="audit-log-item">
                        <span className={`audit-indicator ${log.type}`} />
                        <div className="audit-details">
                          <span className="audit-text">{log.text}</span>
                          <span className="audit-time">{log.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'leads':
        return (
          <div className="main-content-panel">
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  <span>📋</span> Master Lead Inventory ({filteredLeads.length})
                </h3>
              </div>
              <div className="panel-body">
                {/* Search & Filter Bar */}
                <div className="filters-bar">
                  <div className="search-input-wrapper">
                    <svg className="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search master list by customer, company, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="select-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="open">Open (Unassigned)</option>
                    <option value="accepted">Accepted (In Pipeline)</option>
                    <option value="converted">Converted (Closed)</option>
                    <option value="rejected">Rejected (Closed)</option>
                  </select>

                  <select
                    className="select-filter"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                  >
                    <option value="All">All Assignees</option>
                    <option value="unassigned">Unassigned</option>
                    {users.filter(u => u.role === 'agent').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {filteredLeads.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="lead-table">
                      <thead>
                        <tr>
                          <th>Lead Info</th>
                          <th>Company</th>
                          <th>Budget</th>
                          <th>Assignee</th>
                          <th>Source</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} onClick={() => onViewLeadDetails(lead)}>
                            <td>
                              <div className="user-cell">
                                <div className="avatar" style={{
                                  backgroundColor: lead.assignedTo 
                                    ? (users.find(u => u.id === lead.assignedTo)?.color || 'var(--accent)')
                                    : 'var(--text-muted)',
                                  width: '30px', height: '30px', fontSize: '0.8rem'
                                }}>
                                  {lead.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="user-cell-info">
                                  <span className="user-cell-name">{lead.name}</span>
                                  <span className="user-cell-email">{lead.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>{lead.company}</td>
                            <td style={{ fontWeight: '600' }}>{formatCurrency(lead.budget)}</td>
                            <td>
                              {lead.assignedTo ? (
                                <span style={{ fontWeight: '500' }}>{lead.assignedToName}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                              )}
                            </td>
                            <td>
                              <span className="source-badge">{lead.source}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${lead.status}`}>
                                {lead.status === 'accepted' ? 'pipeline' : lead.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📂</span>
                    <div className="empty-title">No leads found</div>
                    <div className="empty-desc">No entries match your search criteria. Try modifying your filter conditions.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="main-content-panel">
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>👥</span> Users & Admins Directory
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>
                    Total Admins: <strong>{users.filter(u => u.role === 'admin').length}</strong> | 
                    Total Agents: <strong>{users.filter(u => u.role === 'agent').length}</strong>
                  </div>
                </h3>
                <button className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} onClick={onAddUserClick}>
                  ➕ Add User / Admin
                </button>
              </div>
              
              <div className="panel-body">
                <div className="table-wrapper">
                  <table className="lead-table">
                    <thead>
                      <tr>
                        <th>User Info</th>
                        <th>System Role</th>
                        <th>Account Status</th>
                        <th>Activity Performance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const stats = getUserMetrics(u.id);
                        return (
                          <tr key={u.id}>
                            <td>
                              <div className="user-cell">
                                <div className="avatar" style={{ backgroundColor: u.color, width: '32px', height: '32px', fontSize: '0.85rem' }}>
                                  {u.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="user-cell-info">
                                  <span className="user-cell-name">{u.name}</span>
                                  <span className="user-cell-email">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="status-badge" style={{
                                border: u.role === 'admin' ? '1px solid rgba(170, 59, 255, 0.3)' : '1px solid var(--border-color)',
                                background: u.role === 'admin' ? 'rgba(170, 59, 255, 0.1)' : 'var(--bg-tertiary)',
                                color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)'
                              }}>
                                👤 {u.role === 'admin' ? 'ADMIN' : 'AGENT'}
                              </span>
                            </td>
                            <td>
                              <span className="users-table-cell">
                                <span className={`user-status-dot ${u.status}`} />
                                <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{u.status}</span>
                              </span>
                            </td>
                            <td>
                              {u.role === 'agent' ? (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  Claimed: <strong>{stats.claimed}</strong> | 
                                  Converted: <strong style={{ color: 'var(--color-converted)' }}>{stats.converted}</strong> | 
                                  Rejected: <strong style={{ color: 'var(--color-rejected)' }}>{stats.rejected}</strong>
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Full Dashboard Administrator</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.65rem',
                                  marginRight: '0.5rem',
                                  color: 'var(--color-open)',
                                  borderColor: 'rgba(18, 83, 226, 0.2)'
                                }}
                                onClick={() => onEditUserClick(u)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.65rem',
                                  color: u.status === 'active' ? 'var(--color-rejected)' : 'var(--color-converted)',
                                  borderColor: u.status === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  pointerEvents: u.id === 'u-1' ? 'none' : 'auto',
                                  opacity: u.id === 'u-1' ? 0.35 : 1
                                }}
                                onClick={() => onToggleUserStatus(u.id)}
                                disabled={u.id === 'u-1'}
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        // Compute statistics for lead sources
        const sourceCounts = leads.reduce((acc, lead) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
          return acc;
        }, {});

        return (
          <div className="main-content-panel">
            <div className="work-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Lead Source Breakdown Chart Panel */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span>📈</span> Lead Acquisition Sources
                  </h3>
                </div>
                <div className="panel-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {Object.entries(sourceCounts).map(([source, count]) => {
                      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                      return (
                        <div key={source} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
                            <span>{source}</span>
                            <span>{count} leads ({percentage}%)</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${percentage}%`,
                              background: source === 'Website' ? 'var(--color-open)' :
                                         source === 'Referral' ? 'var(--color-converted)' :
                                         source === 'LinkedIn' ? 'var(--accent)' : 'var(--color-accepted)',
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Agent Performance Panel */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <span>🏆</span> Agent Conversion Leaderboard
                  </h3>
                </div>
                <div className="panel-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {users.filter(u => u.role === 'agent').map(agent => {
                      const stats = getUserMetrics(agent.id);
                      const closed = stats.converted + stats.rejected;
                      const rate = closed > 0 ? Math.round((stats.converted / closed) * 100) : 0;
                      return (
                        <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="avatar" style={{ backgroundColor: agent.color, width: '28px', height: '28px', fontSize: '0.8rem' }}>
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{agent.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Claimed: {stats.claimed} | Closed: {closed}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-converted)' }}>
                              {rate}% Converted
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stats.converted} sales</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="main-content-panel">
            <div className="panel" style={{ maxWidth: '600px' }}>
              <div className="panel-header">
                <h3 className="panel-title">
                  <span>⚙️</span> System Settings & Sandbox Controls
                </h3>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.35rem' }}>Database Diagnostics</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Resetting the sandbox database will erase all modifications, notes, claimed leads, 
                    and newly added users, restoring the system back to the initial seeded mock files.
                  </p>
                  <button 
                    type="button" 
                    className="btn-sm reject" 
                    style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to completely reset the system database back to defaults?")) {
                        onResetDatabase();
                      }
                    }}
                  >
                    💥 Erase and Reset Sandbox Database
                  </button>
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.35rem' }}>System Environment</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                    <span style={{ fontWeight: '600' }}>Active Workspace</span>
                    <span style={{ fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>admin-dashboard</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>State Synchronization</span>
                    <span style={{ color: 'var(--color-converted)', fontWeight: '700' }}>● Persisted in localStorage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Left Component */}
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="sidebar-item-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <span className="sidebar-item-icon">📋</span>
              <span>Leads</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="sidebar-item-icon">👥</span>
              <span>Users</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="sidebar-item-icon">📈</span>
              <span>Reports</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="sidebar-item-icon">⚙️</span>
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content Area Right */}
      <div style={{ flex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );
}
