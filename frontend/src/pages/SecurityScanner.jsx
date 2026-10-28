import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Lock, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

/**
 * SecurityScanner Page
 * Interactive auditing console where users can run defensive checks against an API endpoint.
 */
export default function SecurityScanner({ 
  apis = [], 
  selectedApi = null, 
  onRunScan,
  scanResults = null,
  isScanning = false,
  scanError = null,
  onResetScan
}) {
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedApiId, setSelectedApiId] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Sync state if an API was selected from another page
  useEffect(() => {
    if (selectedApi) {
      setTargetUrl(selectedApi.url);
      setSelectedApiId(selectedApi.id);
    }
  }, [selectedApi]);

  // Handle dropdown selection
  const handleSelectApiChange = (e) => {
    const apiId = e.target.value;
    setSelectedApiId(apiId);
    if (apiId) {
      const found = apis.find((a) => a.id === parseInt(apiId, 10));
      if (found) {
        setTargetUrl(found.url);
      }
    }
  };

  // Trigger scan execution
  const handleStartScan = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!targetUrl.trim()) {
      setValidationError('Please select or enter an API URL to scan.');
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      setValidationError('Target URL must start with http:// or https://');
      return;
    }

    if (!hasPermission) {
      setValidationError('You must verify you have permission to test this API endpoint.');
      return;
    }

    onRunScan({
      api_id: selectedApiId ? parseInt(selectedApiId, 10) : null,
      url: targetUrl.trim(),
    });
  };

  return (
    <div className="page-container">
      {/* Scanner Control Form Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Defensive API Security Audit</h2>
            <p className="card-subtitle">
              Inspects HTTP response headers, transport encryption, and cross-origin access control rules.
            </p>
          </div>
          {scanResults && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onResetScan}
            >
              <RefreshCw size={14} />
              New Scan
            </button>
          )}
        </div>

        <div className="card-body">
          <form onSubmit={handleStartScan}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              
              {/* Select Saved API */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="select-saved-api">Choose Saved API</label>
                <select
                  id="select-saved-api"
                  className="form-control"
                  value={selectedApiId}
                  onChange={handleSelectApiChange}
                  disabled={isScanning}
                >
                  <option value="">-- Choose from saved APIs --</option>
                  {apis.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.environment})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Endpoint URL */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="target-endpoint-url">Target Endpoint URL *</label>
                <input
                  id="target-endpoint-url"
                  type="text"
                  className="form-control font-mono"
                  placeholder="https://api.example.com/health"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  disabled={isScanning}
                  required
                />
              </div>

            </div>

            {/* Permission Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <input
                id="permission-checkbox"
                type="checkbox"
                checked={hasPermission}
                onChange={(e) => setHasPermission(e.target.checked)}
                disabled={isScanning}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label 
                htmlFor="permission-checkbox" 
                style={{ fontSize: '0.8125rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
              >
                I confirm that I own this API endpoint or have explicit authorization to perform security testing on it.
              </label>
            </div>

            {/* Validation / Execution Error */}
            {(validationError || scanError) && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{validationError || scanError}</span>
              </div>
            )}

            {/* Trigger Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isScanning}
                style={{ minWidth: '160px' }}
              >
                {isScanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Scanning Endpoint...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Run Security Scan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live Scan Results Section */}
      {isScanning && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Loader2 size={36} color="#2563EB" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>
            Auditing Security Headers & Configuration...
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Sending safe, non-destructive HTTP request to inspect response headers and TLS encryption status.
          </p>
        </div>
      )}

      {scanResults && !isScanning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary Banner */}
          <div className="card" style={{ backgroundColor: scanResults.overall_status === 'SECURE' ? '#F0FDF4' : '#FEF2F2', borderColor: scanResults.overall_status === 'SECURE' ? '#BBF7D0' : '#FECACA' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                    Audit Report for: <span className="font-mono">{scanResults.scanned_url}</span>
                  </h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#475569' }}>
                  Completed {new Date(scanResults.scanned_at || Date.now()).toLocaleTimeString()} • {scanResults.passed_checks} Passed, {scanResults.warning_checks} Warnings, {scanResults.failed_checks} Failures
                </p>
              </div>
              <StatusBadge status={scanResults.overall_status} />
            </div>
          </div>

          {/* Individual Findings List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Detailed Check Findings ({scanResults.findings?.length || 0})</h2>
              <p className="card-subtitle">Transparent results derived directly from HTTP responses</p>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {scanResults.findings?.map((finding, idx) => (
                <div key={idx} className="finding-item">
                  <div className="finding-item-header">
                    <div className="finding-title-group">
                      <span className="finding-title">{finding.title}</span>
                      {finding.severity && (
                        <span style={{ 
                          fontSize: '0.6875rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.45rem', 
                          borderRadius: '4px',
                          backgroundColor: finding.severity === 'HIGH' ? '#FEE2E2' : finding.severity === 'MEDIUM' ? '#FEF3C7' : '#EFF6FF',
                          color: finding.severity === 'HIGH' ? '#B91C1C' : finding.severity === 'MEDIUM' ? '#92400E' : '#1D4ED8'
                        }}>
                          {finding.severity} SEVERITY
                        </span>
                      )}
                    </div>
                    <StatusBadge status={finding.status} />
                  </div>

                  <p className="finding-desc">{finding.description}</p>

                  {/* Evidence Box */}
                  <div className="finding-box">
                    <div className="finding-box-label">Observed Response Evidence:</div>
                    <code className="font-mono" style={{ color: '#0F172A', wordBreak: 'break-all' }}>
                      {finding.evidence || 'No header observed'}
                    </code>
                  </div>

                  {/* Recommendation Box */}
                  {finding.recommendation && (
                    <div className="finding-box" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: '0.5rem' }}>
                      <div className="finding-box-label" style={{ color: '#166534' }}>Recommended Defensive Fix:</div>
                      <div style={{ color: '#14532D', fontSize: '0.8125rem' }}>
                        {finding.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
