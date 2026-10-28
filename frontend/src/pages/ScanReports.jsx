import React, { useState } from 'react';
import { FileText, Eye, ShieldCheck, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

/**
 * ScanReports Page
 * Displays historical scan audits saved in the database with modal report inspector.
 */
export default function ScanReports({ 
  reports = [], 
  isLoading = false,
  onGoToScanner,
  onFetchReportDetails
}) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Open modal and load specific report findings
  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setLoadingDetails(true);
    try {
      const details = await onFetchReportDetails(report.id);
      setReportDetails(details);
    } catch {
      setReportDetails(report);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Historical audit log of security scans stored in your local SQLite database.
          </p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary btn-sm"
          onClick={onGoToScanner}
        >
          <ShieldCheck size={16} />
          New Security Scan
        </button>
      </div>

      {/* Reports Table Card */}
      <div className="card">
        {isLoading ? (
          <div className="empty-state">
            <p>Loading historical audit reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={26} />
            </div>
            <h3>No audit reports recorded yet</h3>
            <p>
              Once you run a security scan from the <strong>Security Scanner</strong> or <strong>My APIs</strong> page, the complete audit log will be archived here.
            </p>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onGoToScanner}
            >
              <ShieldCheck size={15} />
              Run First Scan
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit Target</th>
                  <th>Timestamp</th>
                  <th>Overall Status</th>
                  <th>Checks Summary</th>
                  <th style={{ textAlign: 'right' }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>
                        {report.api_name || 'Direct Endpoint'}
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {report.scanned_url}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} color="#94A3B8" />
                        {new Date(report.scanned_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={report.overall_status || 'PASS'} />
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: '#059669', fontWeight: 600 }}>{report.passed_checks} Pass</span>
                      {report.warning_checks > 0 && (
                        <span style={{ color: '#D97706', fontWeight: 600, marginLeft: '0.5rem' }}>
                          • {report.warning_checks} Warn
                        </span>
                      )}
                      {report.failed_checks > 0 && (
                        <span style={{ color: '#DC2626', fontWeight: 600, marginLeft: '0.5rem' }}>
                          • {report.failed_checks} Fail
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye size={14} />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      <Modal 
        isOpen={!!selectedReport} 
        onClose={() => { setSelectedReport(null); setReportDetails(null); }}
        title={`Audit Report #${selectedReport?.id}`}
        maxWidth="680px"
      >
        {loadingDetails ? (
          <div className="empty-state">
            <p>Loading findings breakdown...</p>
          </div>
        ) : (
          <div>
            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                  {selectedReport?.scanned_url}
                </span>
                <StatusBadge status={selectedReport?.overall_status} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Scanned on {new Date(selectedReport?.scanned_at || Date.now()).toLocaleString()} • Total checks: {selectedReport?.total_checks}
              </div>
            </div>

            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#0F172A' }}>
              Findings & Recommendations ({reportDetails?.findings?.length || 0})
            </h3>

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {reportDetails?.findings?.map((finding, idx) => (
                <div key={idx} className="finding-item" style={{ marginBottom: 0, padding: '1rem' }}>
                  <div className="finding-item-header" style={{ marginBottom: '0.35rem' }}>
                    <span className="finding-title" style={{ fontSize: '0.875rem' }}>{finding.title}</span>
                    <StatusBadge status={finding.status} />
                  </div>
                  <p className="finding-desc" style={{ marginBottom: '0.5rem' }}>{finding.description}</p>
                  
                  <div className="finding-box" style={{ padding: '0.5rem' }}>
                    <div className="finding-box-label">Evidence:</div>
                    <code className="font-mono" style={{ fontSize: '0.75rem' }}>
                      {finding.evidence || 'Header absent'}
                    </code>
                  </div>

                  {finding.recommendation && (
                    <div className="finding-box" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', padding: '0.5rem', marginTop: '0.4rem' }}>
                      <div className="finding-box-label" style={{ color: '#166534' }}>Remediation:</div>
                      <div style={{ color: '#14532D', fontSize: '0.75rem' }}>
                        {finding.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ margin: '1.25rem -1.5rem -1.5rem -1.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => { setSelectedReport(null); setReportDetails(null); }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
