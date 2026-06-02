import React, { useState } from 'react';

export default function AgentDashboard({
  currentUser,
  leads,
  onAcceptLead,
  onUpdateLeadStatus,
  onViewLeadDetails,
  isAdminView = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Calculate Agent specific metrics
  const myLeads = leads.filter(l => l.assignedTo === currentUser.id);
  const myPending = myLeads.filter(l => l.status === 'accepted').length;
  const myConverted = myLeads.filter(l => l.status === 'converted').length;
  const myRejected = myLeads.filter(l => l.status === 'rejected').length;
  const myTotal = myLeads.length;

  const successRate = myConverted + myRejected > 0 
    ? Math.round((myConverted / (myConverted + myRejected)) * 100) 
    : 0;

  // 2. Filter the Available Lead Pool
  const openLeads = leads.filter(l => l.status === 'open' && !l.assignedTo);
  const filteredOpenLeads = openLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const handleClaim = (leadId, leadName) => {
    onAcceptLead(leadId, currentUser.id);
    showTempCelebration(`Successfully claimed lead "${leadName}"! It is now locked to your pipeline.`);
  };

  const handleStatusChange = (leadId, newStatus, leadName) => {
    onUpdateLeadStatus(leadId, newStatus);
    if (newStatus === 'converted') {
      showTempCelebration(`🎉 Spectacular! Lead "${leadName}" has been successfully converted!`);
    } else if (newStatus === 'rejected') {
      showTempCelebration(`Lead "${leadName}" status updated to Rejected.`);
    }
  };

  const showTempCelebration = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4500);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="agent-dashboard">
      
      {successMsg && (
        <div className="success-banner">
          <span>✨</span> {successMsg}
        </div>
      )}

      {/* Welcome Banner Panel — hidden when admin is viewing via switcher */}
      {!isAdminView && (
        <div className="welcome-banner-card" style={{ marginBottom: '2rem' }}>
          <div className="welcome-banner-content">
            <h1 className="welcome-banner-title">Hello, {currentUser.name}!</h1>
            <p className="welcome-banner-text">
              Ready to claim some new contracts? There are currently <strong>{openLeads.length} open leads</strong> available in the pool!
            </p>
            <div className="welcome-banner-actions">
              <button 
                type="button" 
                className="welcome-btn-primary"
                onClick={() => {
                  const searchInput = document.querySelector('.search-input');
                  if (searchInput) searchInput.focus();
                }}
              >
                🤝 Claim Leads Now
              </button>
            </div>
          </div>
          <div className="welcome-banner-avatar-wrapper">
            <div 
              className="welcome-banner-avatar"
              style={{ backgroundColor: currentUser.color || 'var(--accent)' }}
            >
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Active Pipeline</span>
            <span className="kpi-value">{myPending}</span>
            <span className="kpi-subtext">Claimed leads in progress</span>
          </div>
          <div className="kpi-icon icon-accepted">⏳</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Closed Converted</span>
            <span className="kpi-value">{myConverted}</span>
            <span className="kpi-subtext">Successful conversions</span>
          </div>
          <div className="kpi-icon icon-converted">🏆</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Closed Rejected</span>
            <span className="kpi-value">{myRejected}</span>
            <span className="kpi-subtext">Leads dropped</span>
          </div>
          <div className="kpi-icon icon-rejected">❌</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Conversion Rate</span>
            <span className="kpi-value">{successRate}%</span>
            <span className="kpi-subtext">Based on closed sales</span>
          </div>
          <div className="kpi-icon icon-purple">📈</div>
        </div>
      </div>

      <div className="work-grid">
        
        {/* Left Side: Open Lead Pool */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <span>🌎</span> Available Lead Pool
              <span className="status-badge open" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                {openLeads.length} Open
              </span>
            </h3>
          </div>
          
          <div className="panel-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              These leads are unassigned. Accept a lead to lock it to your account.
            </p>

            <div className="filters-bar">
              <div className="search-input-wrapper">
                <svg className="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search available leads by name, email, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="select-filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="All">All Sources</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Google Search">Google Search</option>
              </select>
            </div>

            {filteredOpenLeads.length > 0 ? (
              <div className="table-wrapper">
                <table className="lead-table">
                  <thead>
                    <tr>
                      <th>Customer Info</th>
                      <th>Company</th>
                      <th>Source</th>
                      <th>Budget</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOpenLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td onClick={() => onViewLeadDetails(lead)}>
                          <div className="user-cell">
                            <div className="avatar" style={{ backgroundColor: 'var(--accent)', fontSize: '0.8rem', width: '30px', height: '30px' }}>
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="user-cell-info">
                              <span className="user-cell-name">{lead.name}</span>
                              <span className="user-cell-email">{lead.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{lead.company}</td>
                        <td>
                          <span className="source-badge">{lead.source}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{formatCurrency(lead.budget)}</td>
                        <td>
                          <div className="btn-action-group">
                            <button
                              type="button"
                              className="btn-sm accept"
                              onClick={() => handleClaim(lead.id, lead.name)}
                            >
                              🤝 Claim Lead
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🏖️</span>
                <div className="empty-title">All caught up!</div>
                <div className="empty-desc">
                  {searchTerm || sourceFilter !== 'All' 
                    ? "No available leads match your current search filters." 
                    : "No unassigned leads exist in the pool right now."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: My Pipeline */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <span>💼</span> My Leads Pipeline ({myLeads.length})
            </h3>
          </div>
          
          <div className="panel-body" style={{ padding: '1rem 0' }}>
            {myLeads.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem' }}>
                {myLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div 
                        style={{ cursor: 'pointer' }}
                        onClick={() => onViewLeadDetails(lead)}
                      >
                        <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {lead.name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {lead.company} • {formatCurrency(lead.budget)}
                        </span>
                      </div>
                      <span className={`status-badge ${lead.status}`}>
                        {lead.status === 'accepted' ? 'pipeline' : lead.status}
                      </span>
                    </div>

                      {/* Status Change Buttons */}
                      <div className="btn-action-group" style={{ marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleStatusChange(lead.id, 'accepted', lead.name)}
                        >
                          📞 Contacted
                        </button>
                        <button
                          type="button"
                          className="btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleStatusChange(lead.id, 'interested', lead.name)}
                        >
                          👍 Interested
                        </button>
                        <button
                          type="button"
                          className="btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleStatusChange(lead.id, 'not_interested', lead.name)}
                        >
                          👎 Not Interested
                        </button>
                        <button
                          type="button"
                          className="btn-sm convert"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleStatusChange(lead.id, 'converted', lead.name)}
                        >
                          🏆 Convert
                        </button>
                        <button
                          type="button"
                          className="btn-sm reject"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleStatusChange(lead.id, 'rejected', lead.name)}
                        >
                          ❌ Drop
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem', width: '100%', textAlign: 'center' }}
                        onClick={() => onViewLeadDetails(lead)}
                      >
                        ✏️ Edit Notes & Logs
                      </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <span className="empty-icon">🎒</span>
                <div className="empty-title">Pipeline Empty</div>
                <div className="empty-desc">
                  Claim leads from the available pool on the left to start working!
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
