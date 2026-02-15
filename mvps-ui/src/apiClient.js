import tokenManager from './auth/tokenManager';

// Default to going through the API gateway so that
// authentication and token relay work like core-service.
// From the browser (origin http://127.0.0.1:8082), calls will
// go to /mvps-api/** on the gateway, which then forwards to mvps-api.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/mvps-api/v1';

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

export async function fetchData(path, params) {
  const url = buildUrl(path, params);
  let response = await fetch(url, {
    headers: tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : undefined,
  });

  if (response.status === 401) {
    // try refresh once
    try {
      await tokenManager.refresh();
      response = await fetch(url, {
        headers: tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : undefined,
      });
    } catch (e) {
      // refresh failed - fall through to existing 401 handling
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      // Treat 401 as "not logged in" and start login flow via gateway
      window.location.href = '/oauth2/authorization/gateway';
    }
    throw new Error(`API request failed with status ${response.status}`);
  }

  const json = await response.json();

  // Most endpoints wrap payload in { success, data, pagination? }
  if (json && Object.prototype.hasOwnProperty.call(json, 'data')) {
    return json;
  }

  return json;
}

export async function postJson(path, body) {
  const url = buildUrl(path);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/oauth2/authorization/gateway';
    }
    const text = await response.text();
    throw new Error(
      `API POST failed with status ${response.status}: ${text || 'Unknown error'}`,
    );
  }

  const json = await response.json();
  return json;
}

export async function putJson(path, body) {
  const url = buildUrl(path);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/oauth2/authorization/gateway';
    }
    const text = await response.text();
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
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/oauth2/authorization/gateway';
    }
    const text = await response.text();
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
  const response = await fetch(url, {
    method: 'DELETE',
    headers: tokenManager.getAccessToken() ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` } : undefined,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/oauth2/authorization/gateway';
    }
    const text = await response.text();
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
