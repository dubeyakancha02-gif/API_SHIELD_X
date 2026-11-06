import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Modal from './components/Modal';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import MyApis from './pages/MyApis';
import SecurityScanner from './pages/SecurityScanner';
import ScanReports from './pages/ScanReports';
import Settings from './pages/Settings';
import { 
  fetchCurrentUser,
  logout,
  fetchStats, 
  fetchApis, 
  createApi, 
  updateApi, 
  deleteApi, 
  executeScan, 
  fetchReports, 
  fetchReportDetails 
} from './services/api';

/**
 * Main Application Shell
 * Controls active view routing, topbar actions, shared API state, and global modals.
 */
export default function App() {
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [backendNotice, setBackendNotice] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [stats, setStats] = useState({ total_apis: 0, total_scans: 0, total_findings: 0, total_secure: 0 });
  const [apis, setApis] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoadingApis, setIsLoadingApis] = useState(false);

  // Scanner state
  const [selectedApiForScan, setSelectedApiForScan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Global Add API Modal state
  const [isAddApiModalOpen, setIsAddApiModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalUrl, setModalUrl] = useState('');
  const [modalEnv, setModalEnv] = useState('Production');
  const [modalDesc, setModalDesc] = useState('');
  const [modalError, setModalError] = useState('');

  // Initial load
  const loadInitialData = async () => {
    setIsLoadingApis(true);
    try {
      const [statsData, apisData, reportsData] = await Promise.allSettled([
        fetchStats(),
        fetchApis(),
        fetchReports(),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (apisData.status === 'fulfilled') setApis(apisData.value);
      if (reportsData.status === 'fulfilled') setReports(reportsData.value);
    } catch (err) {
      if (err.status === 401) {
        setCurrentUser(null);
      }
      console.warn('Backend data load error:', err);
    } finally {
      setIsLoadingApis(false);
    }
  };

  // Session Bootstrap on mount with strict timeout and offline detection
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const bootstrapAuth = async () => {
      try {
        const authData = await fetchCurrentUser({ signal: controller.signal });
        if (isMounted && authData && authData.user) {
          setCurrentUser(authData.user);
          setBackendNotice(null);
          loadInitialData();
        }
      } catch (err) {
        if (isMounted) {
          setCurrentUser(null);
          if (err.isNetworkError || err.status === 503 || err.status === 502 || err.status === 504) {
            setBackendNotice('FastAPI backend is offline on port 8000. Start it in the backend directory.');
          }
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    };

    bootstrapAuth();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setBackendNotice(null);
    loadInitialData();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setApis([]);
      setReports([]);
      setStats({ total_apis: 0, total_scans: 0, total_findings: 0, total_secure: 0 });
    }
  };

  // Handlers for Add API
  const handleOpenAddApi = () => {
    setModalName('');
    setModalUrl('');
    setModalEnv('Production');
    setModalDesc('');
    setModalError('');
    setIsAddApiModalOpen(true);
  };

  const handleCreateApiSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!modalName.trim()) {
      setModalError('Please enter an API name.');
      return;
    }
    if (!modalUrl.trim() || (!modalUrl.startsWith('http://') && !modalUrl.startsWith('https://'))) {
      setModalError('Valid URL required (http:// or https://)');
      return;
    }

    try {
      const newApi = await createApi({
        name: modalName.trim(),
        url: modalUrl.trim(),
        environment: modalEnv,
        description: modalDesc.trim(),
      });
      setApis((prev) => [newApi, ...prev]);
      setStats((prev) => ({ ...prev, total_apis: prev.total_apis + 1 }));
      setIsAddApiModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Error creating API');
    }
  };

  const handleUpdateApi = async (id, payload) => {
    try {
      const updated = await updateApi(id, payload);
      setApis((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeleteApi = async (id) => {
    try {
      await deleteApi(id);
      setApis((prev) => prev.filter((a) => a.id !== id));
      setStats((prev) => ({ ...prev, total_apis: Math.max(0, prev.total_apis - 1) }));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Run scan trigger
  const handleRunScan = async (scanPayload) => {
    setIsScanning(true);
    setScanError(null);
    setScanResults(null);

    try {
      const result = await executeScan(scanPayload);
      setScanResults(result);
      // Refresh reports and stats
      loadInitialData();
    } catch (err) {
      setScanError(err.message || 'Security scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  // Quick navigation to scanner with pre-selected API
  const handleRunScanForApi = (api) => {
    setSelectedApiForScan(api);
    setScanResults(null);
    setScanError(null);
    setActivePage('scanner');
  };

  // Unauthenticated visitors immediately see the Login portal (never blocked by splash loader)
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        backendNotice={backendNotice} 
        isCheckingSession={authChecking} 
      />
    );
  }

  return (
    <div className="app-container">
      {/* Dark Navy Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar 
          activePage={activePage} 
          onOpenAddApi={handleOpenAddApi} 
          onGoToScanner={() => {
            setSelectedApiForScan(null);
            setActivePage('scanner');
          }}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Routing */}
        <main>
          {activePage === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              recentScans={reports} 
              onOpenAddApi={handleOpenAddApi}
              onGoToScanner={() => setActivePage('scanner')}
              onGoToReports={() => setActivePage('reports')}
            />
          )}

          {activePage === 'apis' && (
            <MyApis 
              apis={apis} 
              isLoading={isLoadingApis}
              onAddApi={async (payload) => {
                const created = await createApi(payload);
                setApis((prev) => [created, ...prev]);
                setStats((prev) => ({ ...prev, total_apis: prev.total_apis + 1 }));
              }}
              onUpdateApi={handleUpdateApi}
              onDeleteApi={handleDeleteApi}
              onRunScanForApi={handleRunScanForApi}
            />
          )}

          {activePage === 'scanner' && (
            <SecurityScanner 
              apis={apis}
              selectedApi={selectedApiForScan}
              onRunScan={handleRunScan}
              scanResults={scanResults}
              isScanning={isScanning}
              scanError={scanError}
              onResetScan={() => {
                setScanResults(null);
                setScanError(null);
              }}
            />
          )}

          {activePage === 'reports' && (
            <ScanReports 
              reports={reports}
              isLoading={false}
              onGoToScanner={() => setActivePage('scanner')}
              onFetchReportDetails={fetchReportDetails}
            />
          )}

          {activePage === 'settings' && (
            <Settings />
          )}
        </main>
      </div>

      {/* Global Add API Modal */}
      <Modal 
        isOpen={isAddApiModalOpen} 
        onClose={() => setIsAddApiModalOpen(false)}
        title="Register New API Endpoint"
      >
        <form onSubmit={handleCreateApiSubmit}>
          {modalError && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {modalError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="global-api-name">Service Name *</label>
            <input
              id="global-api-name"
              type="text"
              className="form-control"
              placeholder="e.g., Payment Gateway API"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="global-api-url">Base URL *</label>
            <input
              id="global-api-url"
              type="text"
              className="form-control font-mono"
              placeholder="https://api.example.com"
              value={modalUrl}
              onChange={(e) => setModalUrl(e.target.value)}
              required
            />
            <p className="form-helper">Enter the complete endpoint with http:// or https://</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="global-api-env">Environment</label>
            <select
              id="global-api-env"
              className="form-control"
              value={modalEnv}
              onChange={(e) => setModalEnv(e.target.value)}
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
              <option value="Local">Local (Localhost)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="global-api-desc">Description (Optional)</label>
            <textarea
              id="global-api-desc"
              className="form-control"
              rows={2}
              placeholder="Brief note about the service..."
              value={modalDesc}
              onChange={(e) => setModalDesc(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsAddApiModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register API
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
