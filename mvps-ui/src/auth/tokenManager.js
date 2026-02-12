let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export async function refresh() {
  try {
    const gateway = process.env.REACT_APP_GATEWAY_URL || '';
    const url = gateway ? `${gateway.replace(/\/$/, '')}/auth/refresh` : '/auth/refresh';
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) {
      accessToken = null;
      throw new Error('refresh failed');
    }
    const json = await resp.json();
    accessToken = json.access_token || json.token || null;
    return accessToken;
  } catch (e) {
    accessToken = null;
    throw e;
  }
}

export function clear() {
  accessToken = null;
  // tell server to clear refresh cookie; don't block on it
  try {
    const gateway = process.env.REACT_APP_GATEWAY_URL || '';
    const url = gateway ? `${gateway.replace(/\/$/, '')}/auth/logout` : '/auth/logout';
    fetch(url, { method: 'POST', credentials: 'include' });
  } catch (e) {
    // ignore
  }
}

const tokenManager = { getAccessToken, setAccessToken, refresh, clear };

export default tokenManager;
