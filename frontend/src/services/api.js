/**
 * API Shield - Frontend Service Layer
 * Clean, standard fetch HTTP helper functions communicating with FastAPI backend.
 */

const BASE_URL = '/api';

/**
 * Fetch dashboard statistics (total APIs, scans completed, findings count)
 */
export async function fetchStats() {
  const response = await fetch(`${BASE_URL}/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch all registered APIs
 */
export async function fetchApis() {
  const response = await fetch(`${BASE_URL}/apis`);
  if (!response.ok) {
    throw new Error(`Failed to fetch APIs: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Register a new API endpoint
 */
export async function createApi(apiData) {
  const response = await fetch(`${BASE_URL}/apis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save API');
  }
  return response.json();
}

/**
 * Update an existing API endpoint
 */
export async function updateApi(id, apiData) {
  const response = await fetch(`${BASE_URL}/apis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update API');
  }
  return response.json();
}

/**
 * Delete an API endpoint from database
 */
export async function deleteApi(id) {
  const response = await fetch(`${BASE_URL}/apis/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete API');
  }
  return response.json();
}

/**
 * Execute a passive security scan against an API endpoint
 */
export async function executeScan(scanData) {
  const response = await fetch(`${BASE_URL}/scans/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scanData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to complete security scan');
  }
  return response.json();
}

/**
 * Fetch all historical scan reports
 */
export async function fetchReports() {
  const response = await fetch(`${BASE_URL}/scans`);
  if (!response.ok) {
    throw new Error(`Failed to fetch scan reports: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch detailed findings for a specific scan report
 */
export async function fetchReportDetails(reportId) {
  const response = await fetch(`${BASE_URL}/scans/${reportId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch report details: ${response.statusText}`);
  }
  return response.json();
}
