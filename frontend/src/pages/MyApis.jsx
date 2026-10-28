import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, ExternalLink, Globe, Search } from 'lucide-react';
import Modal from '../components/Modal';

/**
 * MyApis Page
 * Manages registered API services with CRUD operations, search filter, and instant scan triggers.
 */
export default function MyApis({ 
  apis = [], 
  isLoading = false,
  onAddApi, 
  onUpdateApi, 
  onDeleteApi, 
  onRunScanForApi 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState(null);
  const [deletingApi, setDeletingApi] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState('Production');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Open modal for adding a new API
  const handleOpenAdd = () => {
    setName('');
    setUrl('');
    setEnvironment('Production');
    setDescription('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open modal for editing an existing API
  const handleOpenEdit = (api) => {
    setEditingApi(api);
    setName(api.name);
    setUrl(api.url);
    setEnvironment(api.environment || 'Production');
    setDescription(api.description || '');
    setFormError('');
  };

  // Validate and submit Add / Edit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter an API service name.');
      return;
    }

    if (!url.trim()) {
      setFormError('Please enter an API base URL.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setFormError('URL must begin with http:// or https://');
      return;
    }

    try {
      new URL(url); // standard browser URL validation
    } catch {
      setFormError('Please enter a valid URL (e.g., https://api.github.com)');
      return;
    }

    const payload = {
      name: name.trim(),
      url: url.trim(),
      environment,
      description: description.trim(),
    };

    if (editingApi) {
      await onUpdateApi(editingApi.id, payload);
      setEditingApi(null);
    } else {
      await onAddApi(payload);
      setIsAddModalOpen(false);
    }
  };

  // Confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (deletingApi) {
      await onDeleteApi(deletingApi.id);
      setDeletingApi(null);
    }
  };

  // Filter APIs by name or URL
  const filteredApis = apis.filter((api) =>
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search saved APIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={handleOpenAdd}
        >
          <Plus size={16} />
          Add API
        </button>
      </div>

      {/* API Table / List */}
      <div className="card">
        {isLoading ? (
          <div className="empty-state">
            <p>Loading registered APIs from database...</p>
          </div>
        ) : filteredApis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Globe size={26} />
            </div>
            <h3>{searchTerm ? 'No matching APIs found' : 'No APIs registered yet'}</h3>
            <p>
              {searchTerm 
                ? 'Try searching with a different keyword.' 
                : 'Save your API endpoints here to perform repeated security scans and track posture over time.'}
            </p>
            {!searchTerm && (
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleOpenAdd}
              >
                <Plus size={15} />
                Register First API
              </button>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>API Service</th>
                  <th>Base URL</th>
                  <th>Environment</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.map((api) => (
                  <tr key={api.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{api.name}</div>
                      {api.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{api.description}</div>
                      )}
                    </td>
                    <td>
                      <a 
                        href={api.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="font-mono"
                        style={{ fontSize: '0.8125rem', color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {api.url}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: api.environment === 'Production' ? '#EFF6FF' : '#F1F5F9',
                        color: api.environment === 'Production' ? '#1D4ED8' : '#475569',
                        borderColor: api.environment === 'Production' ? '#BFDBFE' : '#CBD5E1'
                      }}>
                        {api.environment || 'Production'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {api.created_at ? new Date(api.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onRunScanForApi(api)}
                          title="Run security scan on this API"
                        >
                          <ShieldCheck size={14} />
                          Scan
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(api)}
                          title="Edit API details"
                          aria-label="Edit API"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingApi(api)}
                          title="Delete API"
                          aria-label="Delete API"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit API Modal */}
      <Modal 
        isOpen={isAddModalOpen || !!editingApi} 
        onClose={() => { setIsAddModalOpen(false); setEditingApi(null); }}
        title={editingApi ? 'Edit API Endpoint' : 'Register New API Endpoint'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="api-name">Service Name *</label>
            <input
              id="api-name"
              type="text"
              className="form-control"
              placeholder="e.g., User Authentication Service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="api-url">Base URL *</label>
            <input
              id="api-url"
              type="text"
              className="form-control font-mono"
              placeholder="https://api.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="form-helper">Enter the complete HTTP or HTTPS endpoint.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="api-env">Environment</label>
            <select
              id="api-env"
              className="form-control"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
              <option value="Local">Local (Localhost)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="api-desc">Description (Optional)</label>
            <textarea
              id="api-desc"
              className="form-control"
              rows={2}
              placeholder="Brief note about the endpoints purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setIsAddModalOpen(false); setEditingApi(null); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingApi ? 'Save Changes' : 'Register API'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deletingApi} 
        onClose={() => setDeletingApi(null)} 
        title="Confirm Deletion"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
          Are you sure you want to delete <strong>{deletingApi?.name}</strong>? This action removes the API and its scan history from the local database.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setDeletingApi(null)}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleConfirmDelete}
          >
            Delete Endpoint
          </button>
        </div>
      </Modal>
    </div>
  );
}
