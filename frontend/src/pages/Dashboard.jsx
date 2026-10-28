import React from 'react';
import { 
  Server, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';

/**
 * Dashboard Page
 * Visual overview of APIs, scan totals, findings breakdown, and recent scan logs.
 */
export default function Dashboard({ 
  stats = { total_apis: 0, total_scans: 0, total_findings: 0, total_secure: 0 },
  recentScans = [],
  onOpenAddApi,
  onGoToScanner,
  onGoToReports
}) {
  return (
    <div className="page-container">
      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        <MetricCard 
          label="Total APIs" 
          value={stats.total_apis} 
          icon={Server} 
          description="Registered endpoints" 
          iconBg="#EFF6FF" 
          iconColor="#2563EB" 
        />
        <MetricCard 
          label="Scans Completed" 
          value={stats.total_scans} 
          icon={ShieldCheck} 
          description="Audits conducted" 
          iconBg="#F0FDF4" 
          iconColor="#16A34A" 
        />
        <MetricCard 
          label="Open Findings" 
          value={stats.total_findings} 
          icon={AlertTriangle} 
          description="Warnings & failures" 
          iconBg="#FEF2F2" 
          iconColor="#DC2626" 
        />
        <MetricCard 
          label="Secure Checks" 
          value={stats.total_secure} 
          icon={CheckCircle2} 
          description="Passed defensive rules" 
          iconBg="#ECFDF5" 
          iconColor="#059669" 
        />
      </div>

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Recent Activity Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Security Scans</h2>
              <p className="card-subtitle">Latest automated passive header audits</p>
            </div>
            {recentScans.length > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={onGoToReports}
              >
                View All
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {recentScans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Shield size={26} />
              </div>
              <h3>No security scans yet</h3>
              <p>Register your first API endpoint and run a passive security audit to see results here.</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={onOpenAddApi}
                >
                  <Plus size={15} />
                  Add New API
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={onGoToScanner}
                >
                  <ShieldCheck size={15} />
                  Run Scan
                </button>
              </div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Target API</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.slice(0, 5).map((scan) => (
                    <tr key={scan.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{scan.api_name || 'Direct Scan'}</div>
                        <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {scan.scanned_url}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} color="#94A3B8" />
                          {new Date(scan.scanned_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={scan.overall_status || 'PASS'} />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ color: scan.failed_checks > 0 ? '#DC2626' : '#16A34A' }}>
                          {scan.failed_checks} Fail, {scan.warning_checks} Warn
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Summary & Quick Actions Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onOpenAddApi}
              >
                <Plus size={16} />
                Register New API
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onGoToScanner}
              >
                <ShieldCheck size={16} />
                Run Security Audit
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onGoToReports}
              >
                <ArrowRight size={16} />
                Browse Scan History
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Passive Checks Overview</h2>
            </div>
            <div className="card-body" style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>🛡️ <strong>HTTPS Transport</strong>: Enforces TLS encryption</div>
              <div>🔒 <strong>HSTS</strong>: Strict-Transport-Security header</div>
              <div>📑 <strong>MIME Sniffing</strong>: X-Content-Type-Options</div>
              <div>🖼️ <strong>Clickjacking</strong>: X-Frame-Options protection</div>
              <div>🌐 <strong>CORS Policies</strong>: Checks wildcard origin risks</div>
              <div>🔍 <strong>Information Disclosure</strong>: Server version leaks</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
