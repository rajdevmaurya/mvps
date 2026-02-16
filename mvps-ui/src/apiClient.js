import tokenManager from './auth/tokenManager';

// Default to going through the API gateway so that
// authentication and token relay work like core-service.
// From the browser (origin http://127.0.0.1:8082), calls will
// go to /mvps-api/** on the gateway, which then forwards to mvps-api.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/mvps-api/v1';

// Singleton promise to prevent concurrent token refresh attempts
let refreshPromise = null;

function buildUrl(path, params) {
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath = `${base}${cleanPath}`;

  // If fullPath is absolute, use it directly; otherwise, resolve relative to current origin
  const url = (fullPath.startsWith('http://') || fullPath.startsWith('https://'))
    ? new URL(fullPath)
    : new URL(fullPath, window.location.origin);
  if (params) {
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
  }
  return url.toString();
}

function authHeaders() {
  const token = tokenManager.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Refresh the access token, coalescing concurrent calls into a single request.
 */
async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = tokenManager.refresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/oauth2/authorization/gateway';
  }
}

/**
 * Execute a fetch request with automatic 401 retry (token refresh).
 */
async function fetchWithAuth(url, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    try {
      await refreshToken();
      const retryHeaders = { ...authHeaders(), ...(options.headers || {}) };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } catch {
      // refresh failed - fall through to 401 handling below
    }
  }

  return response;
}

export async function fetchData(path, params) {
  const url = buildUrl(path, params);
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    throw new Error(`API request failed with status ${response.status}`);
  }

  const json = await response.json();
  return json;
}

export async function postJson(path, body) {
  const url = buildUrl(path);
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    let text = '';
    try { text = await response.text(); } catch { /* ignore */ }
    throw new Error(
      `API POST failed with status ${response.status}: ${text || 'Unknown error'}`,
    );
  }

  const json = await response.json();
  return json;
}

export async function putJson(path, body) {
  const url = buildUrl(path);
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    let text = '';
    try { text = await response.text(); } catch { /* ignore */ }
    throw new Error(
      `API PUT failed with status ${response.status}: ${text || 'Unknown error'}`,
    );
  }

  // Some endpoints may not return a body
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function patchJson(path, body) {
  const url = buildUrl(path);
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    let text = '';
    try { text = await response.text(); } catch { /* ignore */ }
    throw new Error(
      `API PATCH failed with status ${response.status}: ${text || 'Unknown error'}`,
    );
  }

  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function deleteJson(path) {
  const url = buildUrl(path);
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    let text = '';
    try { text = await response.text(); } catch { /* ignore */ }
    throw new Error(
      `API DELETE failed with status ${response.status}: ${text || 'Unknown error'}`,
    );
  }

  try {
    return await response.json();
  } catch {
    return {};
  }
}

export { API_BASE_URL };
