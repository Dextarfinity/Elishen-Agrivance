// Thin API client — with transaction toasts and double-submit protection.

// ---- toast: every transaction tells the user how it went ----
function toast(msg, ok = true) {
  let t = document.getElementById('txToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'txToast';
    t.style.cssText = 'position:fixed;bottom:26px;left:50%;transform:translateX(-50%);'
      + 'padding:10px 20px;border-radius:999px;font:600 13.5px "Segoe UI",Arial,sans-serif;'
      + 'color:#fff;z-index:960;display:none;box-shadow:0 6px 20px rgba(0,0,0,.3);'
      + 'max-width:92vw;text-align:center';
    document.body.appendChild(t);
  }
  t.style.background = ok ? 'rgba(30,92,40,.96)' : 'rgba(179,38,30,.96)';
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => { t.style.display = 'none'; }, ok ? 2600 : 4200);
}

// mutations currently on the wire — identical duplicates (double-taps on slow
// connections) are refused instead of hitting the server twice
const _inflight = new Set();
let _txSeq = 0;                      // total mutations ever started (monotonic)
window._apiBusy = () => _inflight.size;
window._apiTxSeq = () => _txSeq;

// background calls that shouldn't chatter with success toasts
const QUIET = [/^\/api\/notifications/, /^\/api\/login$/, /^\/api\/logout$/, /^\/api\/customer_tier$/];

// session token from login — sent as a Bearer header on every request
function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('ea_token');
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}
// the server no longer recognizes this device's session — back to the login screen
function sessionExpired() {
  localStorage.removeItem('ea_user');
  localStorage.removeItem('ea_token');
  toast('Session expired — please log in again.', false);
  setTimeout(() => location.reload(), 900);
}

// ---- offline queue: field transactions survive dead signal ----
// only NEW records queue (idempotent-ish); edits/deletes stay online-only
const QUEUEABLE = [
  /^\/api\/sales$/,                     // encode a sale
  /^\/api\/sales\/\d+\/payments$/,      // receive a payment
  /^\/api\/attendance$/,                // time in / out
  /^\/api\/store_visits$/,              // field visit report
];
function _queueKey() { return 'ea_offline_queue'; }
function readQueue() {
  try { return JSON.parse(localStorage.getItem(_queueKey()) || '[]'); } catch { return []; }
}
function writeQueue(q) {
  localStorage.setItem(_queueKey(), JSON.stringify(q));
  if (window._renderOfflineChip) window._renderOfflineChip(q.length);
}
window._offlineCount = () => readQueue().length;
function enqueueOffline(method, path, body, who) {
  const q = readQueue();
  q.push({ id: Date.now() + '-' + Math.floor(Math.random() * 9999),
           method, path, body, who, ts: new Date().toISOString() });
  writeQueue(q);
}

const api = {
  async req(path, opts = {}) {
    const method = (opts.method || 'GET').toUpperCase();
    const mutating = method !== 'GET';
    const key = mutating
      ? `${method} ${path} ${opts.body ? JSON.stringify(opts.body).slice(0, 300) : ''}`
      : null;
    if (mutating) {
      if (_inflight.has(key)) {
        toast('Still saving — please wait…', false);
        throw new Error('This exact request is already in progress.');
      }
      _inflight.add(key);
      _txSeq++;
    }
    try {
      const res = await fetch(`${window.API_BASE}${path}`, {
        headers: authHeaders(),
        ...opts,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).error || res.statusText;
        // a dead/revoked session on any non-login call → clean local logout
        if (res.status === 401 && !/^\/api\/(login|change_pin)/.test(path)
            && localStorage.getItem('ea_token')) {
          sessionExpired();
          throw new Error(msg);
        }
        if (mutating) toast(msg || 'Transaction failed', false);
        throw new Error(msg);
      }
      if (mutating && !QUIET.some((rx) => rx.test(path.replace(/\?.*$/, '')))) {
        toast('✓ Transaction completed');
      }
      return res.json();
    } catch (e) {
      // network drop (fetch throws before any response)
      if (mutating && /fetch|network/i.test(String(e.message))) {
        let who = '';
        try { who = (JSON.parse(localStorage.getItem('ea_user') || 'null') || {}).name || ''; } catch {}
        if (method === 'POST' && QUEUEABLE.some((rx) => rx.test(path))) {
          enqueueOffline(method, path, opts.body, who);
          toast('No signal — saved OFFLINE on this device. It will sync automatically.', true);
          const err = new Error('queued-offline');
          err.queued = true;
          throw err;
        }
        toast('No connection — the transaction did NOT go through. Try again.', false);
      }
      throw e;
    } finally {
      if (mutating) _inflight.delete(key);
    }
  },
  get:  (p)      => api.req(p),
  post: (p, b)   => api.req(p, { method: 'POST', body: b }),
  put:  (p, b)   => api.req(p, { method: 'PUT', body: b }),
  del:  (p)      => api.req(p, { method: 'DELETE' }),
};

// replay queued offline transactions, oldest first; drop only on server verdicts
async function syncOfflineQueue() {
  let q = readQueue();
  if (!q.length) return;
  let synced = 0;
  for (const item of [...q]) {
    try {
      const res = await fetch(`${window.API_BASE}${item.path}`, {
        method: item.method,
        headers: authHeaders(),
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        synced++;
        q = q.filter((x) => x.id !== item.id);
        writeQueue(q);
      } else if (res.status >= 400 && res.status < 500) {
        // the server understood and refused — retrying forever won't help
        const msg = (await res.json().catch(() => ({}))).error || res.statusText;
        toast(`Offline entry rejected on sync: ${msg}`, false);
        q = q.filter((x) => x.id !== item.id);
        writeQueue(q);
      } else {
        break;                       // server trouble — keep and retry later
      }
    } catch {
      break;                         // still no connection — retry later
    }
  }
  if (synced) toast(`✓ Synced ${synced} offline transaction(s)`);
}
