import React from 'react';
import { Plus, ShieldCheck, LogOut, User } from 'lucide-react';

/**
 * Topbar Component
 * Displays the page title, brief explanation of the view, primary quick actions,
 * and authenticated user profile with working Logout action.
 */
export default function Topbar({ activePage, onOpenAddApi, onGoToScanner, user, onLogout }) {
  const pageMeta = {
    dashboard: {
      title: 'Security Dashboard',
      description: 'Overview of registered endpoints, scan history, and active findings.',
    },
    apis: {
      title: 'My APIs',
      description: 'Manage and validate your registered API services and endpoints.',
    },
    scanner: {
      title: 'Security Scanner',
      description: 'Run passive defensive header and configuration security audits.',
    },
    reports: {
      title: 'Scan Reports',
      description: 'Review comprehensive historical audit reports and remediation guides.',
    },
    settings: {
      title: 'System Settings',
      description: 'Database status, scan rules configuration, and academic viva details.',
    },
  };

  const current = pageMeta[activePage] || { title: 'API Shield', description: '' };

  return (
    <header className="topbar">
      <div className="topbar-info">
        <h1>{current.title}</h1>
        <p>{current.description}</p>
      </div>
      
      <div className="topbar-actions">
        {activePage !== 'scanner' && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onGoToScanner}
          >
            <ShieldCheck size={16} />
            Quick Scan
          </button>
        )}
        <button 
          type="button" 
          className="btn btn-primary btn-sm"
          onClick={onOpenAddApi}
        >
          <Plus size={16} />
          Add API
        </button>

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginLeft: '0.5rem',
            paddingLeft: '0.75rem',
            borderLeft: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontWeight: '500',
              backgroundColor: 'var(--bg-main)',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <User size={14} color="#64748B" />
              <span>{user.email}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              title="Sign out of API Shield"
              style={{ color: '#DC2626' }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
