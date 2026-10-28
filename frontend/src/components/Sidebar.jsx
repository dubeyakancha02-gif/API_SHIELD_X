import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  ShieldCheck, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

/**
 * Sidebar Component
 * Dark navy navigation sidebar supporting expanded and collapsed states.
 */
export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apis', label: 'My APIs', icon: Server },
    { id: 'scanner', label: 'Security Scanner', icon: ShieldCheck },
    { id: 'reports', label: 'Scan Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/shield-logo.svg" alt="API Shield Logo" className="sidebar-logo" />
          <span className="brand-name">API Shield</span>
        </div>
        <button 
          className="sidebar-collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={19} className="nav-item-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Educational badge */}
      <div className="sidebar-footer">
        <p style={{ fontWeight: 600, color: '#CBD5E1', marginBottom: '2px' }}>API Shield v1.0</p>
        <p>Defensive API Auditor</p>
      </div>
    </aside>
  );
}
