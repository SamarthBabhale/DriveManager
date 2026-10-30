const JSON_HEADERS = { 'Content-Type': 'application/json' };

class ApiError extends Error {
  constructor(message, offline) { super(message); this.offline = offline; }
}

async function call(url, opts) {
  let res;
  try { res = await fetch(url, opts); }
  catch { throw new ApiError('Cannot reach the server.', true); }
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch { /* no JSON body */ }
    if (!body && res.status >= 500) throw new ApiError('Drive-Service is not reachable. Start it on port 8091.', true);
    throw new ApiError(body?.detail || body?.title || `${res.status} ${res.statusText}`, false);
  }
  return res.status === 204 ? null : res.json();
}

const parent = id => (id ? `?parentId=${encodeURIComponent(id)}` : '');

export const api = {
  list: id => call('/api/items' + parent(id)),
  createFolder: (name, parentId) =>
    call('/api/folders', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name, parentId }) }),
  upload: (file, parentId) => {
    const form = new FormData();
    form.append('file', file);
    return call('/api/files' + parent(parentId), { method: 'POST', body: form });
  },
  remove: id => call('/api/items/' + encodeURIComponent(id), { method: 'DELETE' }),
  contentUrl: id => `/api/files/${encodeURIComponent(id)}/content`
};
