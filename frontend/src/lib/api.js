import { getMock } from './mockStore.js';

export async function apiGet(path, params) {
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '' && v !== 'All') url.searchParams.set(k, v);
    });
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    if (!json.success && json.data == null) throw new Error(json.message || 'failed');
    return json.data ?? json;
  } catch {
    const mock = getMock(path);
    if (mock !== null) return mock;
    throw new Error(`No mock for ${path}`);
  }
}

export async function apiPost(path, body) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    return json.data ?? json;
  } catch {
    const mock = getMock(path);
    if (mock !== null) return mock;
    return { id: Date.now(), status: 'RECORDED' };
  }
}

export async function apiPatch(path, body) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sih_token') : null;
  try {
    const res = await fetch(path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return body || {};
  }
}
