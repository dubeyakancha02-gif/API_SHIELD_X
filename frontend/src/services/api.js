/**
 * API Shield - Frontend Service Layer
 * Clean, standard fetch HTTP helper functions with credentials and CSRF support.
 */

const BASE_URL = '/api';

/**
 * Standard request wrapper with credentials and CSRF protection headers
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly session cookies are transmitted
  });

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || 'Authentication required');
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  // Handle empty 204 or responses with no content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Authenticate administrator with email and password
 */
export async function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

/**
 * Invalidate server-side session and remove cookie
 */
export async function logout() {
  return request('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Bootstrap current session and retrieve authenticated user profile
 */
export async function fetchCurrentUser() {
  return request('/auth/me');
}

/**
 * Fetch dashboard statistics
 */
export async function fetchStats() {
  return request('/stats');
}

/**
 * Fetch all registered APIs
 */
export async function fetchApis() {
  return request('/apis');
}

/**
 * Register a new API endpoint
 */
export async function createApi(apiData) {
  return request('/apis', {
    method: 'POST',
    body: apiData,
  });
}

/**
 * Update an existing API endpoint
 */
export async function updateApi(id, apiData) {
  return request(`/apis/${id}`, {
    method: 'PUT',
    body: apiData,
  });
}

/**
 * Delete an API endpoint from database
 */
export async function deleteApi(id) {
  return request(`/apis/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Execute a passive security scan against an API endpoint
 */
export async function executeScan(scanData) {
  return request('/scans/run', {
    method: 'POST',
    body: scanData,
  });
}

/**
 * Fetch all historical scan reports
 */
export async function fetchReports() {
  return request('/scans');
}

/**
 * Fetch detailed findings for a specific scan report
 */
export async function fetchReportDetails(reportId) {
  return request(`/scans/${reportId}`);
}
