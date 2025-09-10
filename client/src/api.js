// api.js
export async function getJSON(url, params) {
  const u = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
    });
  }
  const res = await fetch(u, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {})
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function api(url, options = {}) {
  const headers = options.headers || {};
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  options.headers = headers;

  if (options.body && headers['Content-Type'] === 'application/json' && typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
  }
  return res.json();
}
