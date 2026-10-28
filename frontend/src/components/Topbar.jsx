import React from 'react';
import { Plus, ShieldCheck } from 'lucide-react';

/**
 * Topbar Component
 * Displays the page title, brief explanation of the view, and primary quick actions.
 */
export default function Topbar({ activePage, onOpenAddApi, onGoToScanner }) {
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
      </div>
    </header>
  );
}
