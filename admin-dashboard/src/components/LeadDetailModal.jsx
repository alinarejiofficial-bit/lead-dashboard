import React, { useState } from 'react';

export default function LeadDetailModal({ lead, currentUser, onClose, onAddNote }) {
  const [newNote, setNewNote] = useState('');

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const formattedNote = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      text: `${currentUser.name}: ${newNote.trim()}`
    };

    onAddNote(lead.id, formattedNote);
    setNewNote('');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div>
            <span className={`status-badge ${lead.status}`} style={{ marginBottom: '0.35rem' }}>
              {lead.status}
            </span>
            <h3 className="modal-title" style={{ fontSize: '1.4rem' }}>{lead.name}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="lead-detail-grid">
            
            {/* Left Column: Metadata list */}
            <div className="lead-metadata-list">
              <div className="meta-item">
                <span className="meta-label">Company Name</span>
                <span className="meta-value">{lead.company || 'Not Specified'}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Email Address</span>
                <span className="meta-value">
                  <a href={`mailto:${lead.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {lead.email}
                  </a>
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Phone Number</span>
                <span className="meta-value">{lead.phone || 'No phone recorded'}</span>
              </div>

              <div className="meta-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span className="meta-label">Project Budget</span>
                  <span className="meta-value" style={{ color: 'var(--color-converted)', fontWeight: '700' }}>
                    {formatCurrency(lead.budget)}
                  </span>
                </div>
                <div>
                  <span className="meta-label">Lead Source</span>
                  <span className="source-badge" style={{ marginTop: '0.2rem', display: 'inline-block' }}>
                    {lead.source}
                  </span>
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">Assignment Status</span>
                <span className="meta-value">
                  {lead.assignedTo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-accepted)'
                      }} />
                      <span>Assigned to <strong>{lead.assignedToName}</strong></span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned (Open Lead Pool)</span>
                  )}
                </span>
              </div>

              <form onSubmit={handleSaveNote} className="note-input-box">
                <span className="meta-label" style={{ marginBottom: '-0.35rem' }}>Add Timeline Update / Call Note</span>
                <textarea
                  className="note-textarea"
                  placeholder="Record conversation details, status reasoning, next action items..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', alignSelf: 'flex-end', fontSize: '0.8rem' }}>
                  Log Timeline Entry
                </button>
              </form>
            </div>

            {/* Right Column: Interaction Logs / Timeline */}
            <div>
              <h4 className="meta-label" style={{ marginBottom: '0.75rem' }}>Lead Activity Timeline</h4>
              
              {lead.notes && lead.notes.length > 0 ? (
                <div className="timeline">
                  {[...lead.notes].reverse().map((note, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <span className="timeline-date">{note.date}</span>
                        <p className="timeline-text">{note.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <span className="empty-icon">📅</span>
                  <div className="empty-title">No actions recorded</div>
                  <div className="empty-desc">Timeline logs will appear as notes are logged.</div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close details
          </button>
        </div>
      </div>
    </div>
  );
}
