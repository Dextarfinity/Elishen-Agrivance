// Router + event wiring
const main = document.getElementById('main');
window._view = 'dashboard';

// ---- role-based access: Purchases → Settings are admin-only ----5 211111222222223
const ADMIN_VIEWS = ['matrix', 'stocktake', 'purchases', 'expenses', 'accounts', 'team',
  'monitoring', 'reports', 'settings'];
// the money core is OWNER-tier: only users with the Owner role (Henry, Katherine)
const OWNER_VIEWS = ['accounts', 'team', 'expenses'];
const isOwner = () => {
  const roles = window._user?.roles || '';
  const name = (window._user?.name || '').trim();
  return /\bowner\b/i.test(roles) || /^\s*Glomer\s+Celestino\s*$/i.test(name);
};
// controls a non-admin never gets: history/money rewrites, pricing, stock, approvals
const ADMIN_CONTROLS = '[data-editsale],[data-cancel],[data-delsale],[data-editpay],[data-delpay],'
  + '[data-editorder],[data-deldr],[data-pricing],[data-approve],[data-usertoggle],'
  + '[data-poadd],[data-podel],[data-podelso],[data-ponew],[data-crud-new],[data-crud-edit],[data-crud-del]';
function applyRbacDom() {
  if (isAdmin()) return;
  document.querySelectorAll(ADMIN_CONTROLS).forEach((el) => el.remove());
}
const isAdmin = () => /\badmin\b/i.test(window._user?.roles || '');

// ---- COD vs Term pricing ----------------------------------------------------
// Feeds and Topbreed are discounted in flat pesos per bag, and how the customer
// pays decides the figure: a Cash sale is COD and gets more off; every credit
// term (7/15/30 days, End of month, Credit, or a custom one) is on Terms. An
// unset term reads as Terms, so a blank field never over-discounts a sale.
function saleTermText() {
  const sel = document.getElementById('termPreset');
  const custom = document.querySelector('#saleForm [name=term]');
  const v = (sel && sel.value && sel.value !== 'Custom…') ? sel.value : (custom?.value || '');
  return String(v).trim().toLowerCase();
}
const termIsCod = () => /^(cash|cod)\b/.test(saleTermText());
const bagDiscountOf = (i) => Number(termIsCod() ? i?.cod_discount : i?.term_discount) || 0;

function applyRoleGates() {
  document.querySelectorAll('#sidebar button[data-view]').forEach((b) => {
    const v = b.dataset.view;
    const hidden = (ADMIN_VIEWS.includes(v) && !isAdmin())
      || (OWNER_VIEWS.includes(v) && !isOwner());
    b.style.display = hidden ? 'none' : '';
  });
  const sidebar = document.getElementById('sidebar');
  let chip = document.getElementById('userchip');
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'userchip';
    chip.style.cssText = 'margin-top:auto;padding:10px 6px 4px;border-top:1px solid rgba(255,255,255,.15);font-size:12px';
    sidebar.insertBefore(chip, document.getElementById('syncdot'));
  }
  // the user block is a clickable menu: Profile (time in/out, PIN) or Log out
  chip.style.position = 'relative';
  chip.innerHTML = `
    <button type="button" id="userChipBtn" style="all:unset;display:block;width:100%;cursor:pointer;
        padding:6px 8px;border-radius:8px" title="Profile & log out">
      <span style="display:flex;align-items:center;gap:6px">
        <span style="font-weight:700;color:#fff">${window._user.name}</span>
        <span style="margin-left:auto;color:var(--sidebar-ink)">&#9662;</span>
      </span>
      <span style="display:block;opacity:.75;font-size:11.5px;margin-top:2px">${window._user.roles}</span>
    </button>
    <div id="userMenu" class="hidden" style="position:absolute;bottom:calc(100% + 6px);left:0;right:0;
        background:#fff;border-radius:10px;box-shadow:0 8px 26px rgba(0,0,0,.35);overflow:hidden;z-index:80">
      <button type="button" id="umProfile" style="all:unset;display:block;width:100%;box-sizing:border-box;
        cursor:pointer;padding:11px 14px;font-size:13.5px;color:var(--ink)">Profile — time in / out</button>
      <button type="button" id="umLogout" style="all:unset;display:block;width:100%;box-sizing:border-box;
        cursor:pointer;padding:11px 14px;font-size:13.5px;color:var(--bad);border-top:1px solid var(--border)">Log out</button>
    </div>`;
  const menu = document.getElementById('userMenu');
  document.getElementById('userChipBtn').onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  };
  document.addEventListener('click', () => menu.classList.add('hidden'));
  [document.getElementById('umProfile'), document.getElementById('umLogout')].forEach((b) =>
    b.onmouseenter = () => b.style.background = 'var(--surface-2)');
  [document.getElementById('umProfile'), document.getElementById('umLogout')].forEach((b) =>
    b.onmouseleave = () => b.style.background = '');
  document.getElementById('umLogout').onclick = async () => {
    try { await api.post('/api/logout'); } catch {}   // revoke server-side; offline is fine too
    localStorage.removeItem('ea_user');
    localStorage.removeItem('ea_token');
    location.reload();
  };
  document.getElementById('umProfile').onclick = () => { menu.classList.add('hidden'); openProfile(); };
  if (window._notifPoll) window._notifPoll();   // bell appears as soon as someone is logged in
}

// ---- live camera capture: the ONLY way to attach a punch photo (no file uploads) ----
// resolves to a JPEG data URL, null (user cancelled), or 'nocam' (no usable camera)
//
// opts.facing picks which lens opens first — 'user' for selfies (attendance),
// 'environment' for photographing something (store fronts, receipts). Phones carry
// several lenses, so the user can flip front/back or pick any camera by name; the
// choice is remembered per purpose so the right lens opens next time.
function openCameraShot(title, opts = {}) {
  return new Promise(async (resolve) => {
    let facing = opts.facing === 'environment' ? 'environment' : 'user';
    const memKey = () => `ea_cam_${facing}`;
    let deviceId = localStorage.getItem(memKey()) || '';
    let devices = [];
    let stream = null;

    // Try the remembered camera first, then any lens facing the right way, then
    // whatever exists — a remembered camera can vanish (unplugged webcam, new phone).
    async function openStream() {
      const size = { width: { ideal: 1280 }, height: { ideal: 960 } };
      const attempts = [];
      if (deviceId) attempts.push({ video: { ...size, deviceId: { exact: deviceId } }, audio: false });
      attempts.push({ video: { ...size, facingMode: { ideal: facing } }, audio: false });
      attempts.push({ video: true, audio: false });
      for (const c of attempts) {
        try { return await navigator.mediaDevices.getUserMedia(c); } catch {}
      }
      return null;
    }
    // Labels are only readable after permission is granted, so this runs post-stream.
    async function listCameras() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        devices = all.filter((d) => d.kind === 'videoinput')
          .map((d, i) => ({ id: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      } catch { devices = []; }
    }
    // Track what actually opened: the browser may hand back a different lens than asked.
    function syncActive() {
      const s = stream && stream.getVideoTracks()[0]?.getSettings
        ? stream.getVideoTracks()[0].getSettings() : {};
      if (s.deviceId) deviceId = s.deviceId;
      if (s.facingMode) facing = s.facingMode === 'environment' ? 'environment' : 'user';
      try { if (deviceId) localStorage.setItem(memKey(), deviceId); } catch {}
    }

    stream = await openStream();
    if (!stream) return resolve('nocam');
    syncActive();
    await listCameras();

    document.getElementById('camModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'camModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-box" style="width:min(520px,96%)">
        <div class="modal-head"><h3 style="margin:0;flex:1">${title}</h3>
          <button type="button" class="mini" id="camCancel">Cancel</button></div>
        <div class="modal-body" style="padding:16px;text-align:center">
          <video id="camVideo" autoplay playsinline muted
            style="width:100%;max-height:320px;border-radius:10px;background:#000"></video>
          <img id="camShot" class="hidden" style="width:100%;max-height:320px;border-radius:10px" alt="">
          <div id="camPick" class="hidden" style="margin-top:10px">
            <label style="font-size:12.5px;color:#555">Camera
              <select id="camSelect" style="margin-left:6px;padding:6px;max-width:78%"></select>
            </label>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px">
            <button type="button" class="mini hidden" id="camFlip">&#8646; Flip camera</button>
            <button type="button" class="primary" id="camSnap">Take photo</button>
            <button type="button" class="mini hidden" id="camRetake">Retake</button>
            <button type="button" class="primary hidden" id="camUse">Use this photo</button>
          </div>
          <div id="camErr" style="color:#b02020;font-size:12.5px;margin-top:8px"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const video = document.getElementById('camVideo');
    const sel = document.getElementById('camSelect');
    const flip = document.getElementById('camFlip');
    const err = document.getElementById('camErr');
    let shot = null;

    // a front lens is mirrored so it behaves like a mirror; a rear lens must not be
    const isFront = () => facing !== 'environment';
    const paint = () => {
      video.srcObject = stream;
      video.style.transform = isFront() ? 'scaleX(-1)' : 'none';
      flip.classList.toggle('hidden', devices.length < 2);
      document.getElementById('camPick').classList.toggle('hidden', devices.length < 2);
      sel.innerHTML = devices.map((d) =>
        `<option value="${d.id}"${d.id === deviceId ? ' selected' : ''}>${d.label}</option>`).join('');
    };
    paint();

    const stopStream = () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
    const close = (val) => { stopStream(); modal.remove(); resolve(val); };

    // swap lenses without dropping the modal; on failure keep the old stream running
    async function switchTo(next) {
      const prev = { stream, deviceId, facing };
      err.textContent = '';
      stopStream();
      stream = null;
      if (next.deviceId !== undefined) deviceId = next.deviceId;
      if (next.facing) { facing = next.facing; deviceId = localStorage.getItem(memKey()) || ''; }
      stream = await openStream();
      if (!stream) {                       // nothing opened — put the old lens back
        deviceId = prev.deviceId; facing = prev.facing;
        stream = await openStream();
        err.textContent = 'Could not switch camera — staying on the current one.';
      }
      if (!stream) return close('nocam');  // the old one is gone too
      syncActive();
      await listCameras();
      paint();
    }

    flip.onclick = () => switchTo({ facing: isFront() ? 'environment' : 'user' });
    sel.onchange = () => switchTo({ deviceId: sel.value });
    document.getElementById('camCancel').onclick = () => close(null);
    document.getElementById('camSnap').onclick = () => {
      const c = document.createElement('canvas');
      c.width = video.videoWidth || 640; c.height = video.videoHeight || 480;
      const cx = c.getContext('2d');
      if (isFront()) { cx.translate(c.width, 0); cx.scale(-1, 1); }  // un-mirror selfies
      cx.drawImage(video, 0, 0, c.width, c.height);
      shot = c.toDataURL('image/jpeg', 0.7);
      document.getElementById('camShot').src = shot;
      document.getElementById('camShot').classList.remove('hidden');
      video.classList.add('hidden');
      document.getElementById('camPick').classList.add('hidden');
      flip.classList.add('hidden');
      document.getElementById('camSnap').classList.add('hidden');
      document.getElementById('camRetake').classList.remove('hidden');
      document.getElementById('camUse').classList.remove('hidden');
    };
    document.getElementById('camRetake').onclick = () => {
      shot = null;
      document.getElementById('camShot').classList.add('hidden');
      video.classList.remove('hidden');
      document.getElementById('camPick').classList.toggle('hidden', devices.length < 2);
      flip.classList.toggle('hidden', devices.length < 2);
      document.getElementById('camSnap').classList.remove('hidden');
      document.getElementById('camRetake').classList.add('hidden');
      document.getElementById('camUse').classList.add('hidden');
    };
    document.getElementById('camUse').onclick = () => close(shot);
  });
}

// record a punch: live selfie required, then geotag, then save
async function doPunch(type, done) {
  const shot = await openCameraShot(`${type} — take your photo`);
  if (shot === null) { done && done(); return; }     // user backed out
  let photo = null;
  if (shot === 'nocam') {
    if (!confirm(`No camera found (or permission denied). ${type} without a photo? ` +
      `(admins will see "no photo")`)) { done && done(); return; }
  } else photo = shot;
  const send = async (coords) => {
    try {
      await api.post('/api/attendance', {
        user_name: window._user.name, type, photo,
        lat: coords ? coords.latitude : null, lng: coords ? coords.longitude : null,
        accuracy: coords ? coords.accuracy : null,
      });
    } catch (e) { if (!e.queued) alert('Error: ' + e.message); }
    done && done();
  };
  if (!navigator.geolocation) return send(null);
  navigator.geolocation.getCurrentPosition(
    (p) => send(p.coords),
    () => {
      if (confirm(`${type} without location? (GPS unavailable or permission denied — admins will see "no location")`)) send(null);
      else done && done();
    },
    { enableHighAccuracy: true, timeout: 8000 });
}

// admins view a punch photo on demand (fetched singly — the list stays light)
document.addEventListener('click', async (e) => {
  const b = e.target.closest && e.target.closest('[data-attphoto]');
  if (!b) return;
  try {
    const { photo } = await api.get(`/api/attendance/${b.dataset.attphoto}/photo`);
    if (!photo) return alert('No photo on this punch.');
    const ov = document.createElement('div');
    ov.className = 'modal';
    ov.innerHTML = `<div class="modal-box" style="width:min(560px,96%)">
      <div class="modal-head"><h3 style="margin:0;flex:1">Punch photo</h3>
        <button type="button" class="mini" id="apClose">Close</button></div>
      <div class="modal-body" style="padding:12px;text-align:center">
        <img src="${photo}" style="max-width:100%;border-radius:10px" alt="punch photo"></div></div>`;
    document.body.appendChild(ov);
    ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
    ov.querySelector('#apClose').onclick = () => ov.remove();
  } catch (err) { alert('Error: ' + err.message); }
});

// ---- profile modal: identity, attendance (time in/out + today), change PIN ----
async function openProfile() {
  document.getElementById('profileModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'profileModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-box" style="width:min(480px,96%)">
      <div class="modal-head"><h3 style="margin:0;flex:1">Profile</h3>
        <button type="button" class="mini" id="profClose">Close</button></div>
      <div class="modal-body" style="padding:16px">
        <div style="font-weight:800;font-size:16px">${window._user.name}</div>
        <div style="color:var(--ink-2);margin:2px 0 6px">${window._user.roles}</div>
        <div id="profSync" style="font-size:12px;color:var(--ink-2);margin-bottom:14px"></div>
        <h4 style="margin:0 0 6px">Attendance</h4>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <button type="button" class="primary" id="profAttBtn" disabled>…</button>
          <span id="profAttStatus" style="color:var(--ink-2)">Loading…</span>
        </div>
        <div id="profPunches" style="font-size:12.5px;color:var(--ink-2);margin-bottom:16px"></div>
        <h4 style="margin:0 0 6px">Change PIN</h4>
        <form id="pinForm" class="form" style="box-shadow:none;border:1px solid var(--border)">
          <div class="grid3">
            <label>Current PIN <input type="password" name="old_pin" inputmode="numeric" required></label>
            <label>New PIN (4+ digits) <input type="password" name="new_pin" inputmode="numeric" required minlength="4"></label>
            <label>Repeat new PIN <input type="password" name="new_pin2" inputmode="numeric" required></label>
          </div>
          <button type="submit" class="primary">Update PIN</button>
          <small id="pinMsg" style="margin-left:10px"></small>
        </form>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.getElementById('profClose').onclick = () => modal.remove();
  // mirror the live-sync state (green = live, gold = offline/retrying)
  const syncRow = document.getElementById('profSync');
  const tick = () => {
    if (!document.body.contains(syncRow)) return clearInterval(iv);
    const dot = document.getElementById('syncdot');
    syncRow.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;
      background:${dot?.classList.contains('stale') ? '#d6a712' : '#35c46a'};margin-right:6px"></span>
      ${dot?.textContent || 'Live'}`;
  };
  const iv = setInterval(tick, 1000);
  tick();
  const refresh = async () => {
    try {
      const rows = await api.get('/api/attendance');
      const today = new Date().toLocaleDateString();
      const mine = rows.filter((r) => r.user_name === window._user.name
        && new Date(r.ts).toLocaleDateString() === today);
      const last = mine[0];
      const btn = document.getElementById('profAttBtn');
      const st = document.getElementById('profAttStatus');
      if (!btn) return;
      btn.textContent = (last && last.type === 'Time in') ? 'Time out' : 'Time in';
      btn.disabled = false;
      st.textContent = last
        ? `Last: ${last.type} · ${new Date(last.ts).toLocaleTimeString()}`
        : 'Not timed in today';
      document.getElementById('profPunches').innerHTML = mine.length
        ? 'Today: ' + mine.slice().reverse().map((r) =>
            `${r.type === 'Time in' ? 'In' : 'Out'} ${new Date(r.ts).toLocaleTimeString()}`).join(' · ')
        : '';
    } catch {}
  };
  document.getElementById('profAttBtn').onclick = () => {
    const btn = document.getElementById('profAttBtn');
    const type = btn.textContent.trim();
    btn.disabled = true;
    doPunch(type, refresh);
  };
  document.getElementById('pinForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const msg = document.getElementById('pinMsg');
    if (f.new_pin !== f.new_pin2) { msg.textContent = 'New PINs do not match.'; msg.className = 'checkbad'; return; }
    try {
      await api.post('/api/change_pin', {
        user_id: window._user.id, old_pin: f.old_pin, new_pin: f.new_pin });
      msg.textContent = '✓ PIN updated.'; msg.className = 'checkok';
      e.target.reset();
    } catch (err) { msg.textContent = err.message; msg.className = 'checkbad'; }
  };
  refresh();
}

async function renderLogin() {
  let users = [];
  try { users = await api.get('/api/login_users'); } catch {}
  const ov = document.createElement('div');
  ov.id = 'loginOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#173f1e;display:flex;align-items:center;justify-content:center;padding:16px';
  ov.innerHTML = `
    <form id="loginForm" style="background:#fff;border-radius:14px;padding:28px 26px;width:min(380px,100%);box-shadow:0 12px 40px rgba(0,0,0,.35)">
      <div style="font-family:Georgia,serif;font-size:34px;font-weight:800;letter-spacing:-2px">
        <span style="color:#1e5c28">E</span><span style="color:#e3a71f">S</span></div>
      <div style="font-weight:800;letter-spacing:.06em">ELISHEN AGRIVANCE</div>
      <div style="font-size:12px;color:#666;margin-bottom:16px">Sales &amp; Inventory Management System</div>
      <label style="display:block;font-size:12.5px;color:#444;margin-bottom:10px">User
        <select name="user_id" required style="width:100%;margin-top:4px;padding:8px">
          <option value="">— select your name —</option>
          ${users.filter((u) => u.active).map((u) =>
            `<option value="${u.id}">${u.name} — ${u.roles}</option>`).join('')}
        </select></label>
      <label style="display:block;font-size:12.5px;color:#444;margin-bottom:14px">PIN
        <input name="pin" type="password" inputmode="numeric" autocomplete="off" required
          style="width:100%;margin-top:4px;padding:8px"></label>
      <button type="submit" class="primary" style="width:100%">Log in</button>
      <div id="loginErr" style="color:#b02020;font-size:12.5px;margin-top:8px"></div>
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e3e6ea;font-size:12px;color:#666">
        Server: <b>${window.API_BASE}</b>
        ${users.length ? '' : ' — <span style="color:#b02020">cannot reach the server</span>'}
        <button type="button" id="srvChange" class="mini" style="margin-left:8px">Change</button>
      </div>
    </form>`;
  document.body.appendChild(ov);
  document.getElementById('srvChange').onclick = () => {
    const v = prompt('Server address, e.g. https://elishenagrivance.com (or http://192.168.1.50:3001 on the shop LAN)',
      window.API_BASE);
    if (v === null) return;
    localStorage.setItem('api_base', v.trim().replace(/\/+$/, ''));
    location.reload();
  };
  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      const { token, ...u } = await api.post('/api/login', { user_id: Number(f.user_id), pin: f.pin });
      localStorage.setItem('ea_token', token);        // session token for every later call
      window._user = u;
      localStorage.setItem('ea_user', JSON.stringify(u));
      ov.remove();
      applyRoleGates();
      show('dashboard');
    } catch (err) {
      document.getElementById('loginErr').textContent = err.message;
    }
  };
}

async function show(view) {
  if (ADMIN_VIEWS.includes(view) && !isAdmin()) {
    main.innerHTML = '<div class="error">Admins only — this page is restricted to Admin accounts.</div>';
    return;
  }
  if (OWNER_VIEWS.includes(view) && !isOwner()) {
    main.innerHTML = '<div class="error">Owners only — this page is restricted to Owner accounts.</div>';
    return;
  }
  // page history so the phone's back button walks backwards instead of exiting
  const fromPop = window._fromPop; window._fromPop = false;
  if (window._view !== view) {
    if (window._navSkipPush) window._navSkipPush = false;
    else {
      (window._navStack = window._navStack || []).push(window._view);
      if (window._navStack.length > 50) window._navStack.shift();
    }
    if (!fromPop) { try { history.pushState({ v: view }, ''); } catch {} }
  }
  window._view = view;
  document.querySelectorAll('#sidebar button').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === view));
  main.innerHTML = '<div class="loading">Loading…</div>';
  const dot = document.getElementById('syncdot');
  try {
    window._tblSeq = 0;                 // stable per-render table keys
    main.innerHTML = await views[view]();
    wire(view);
    wireCrud();
    wireSalesActions();
    if (typeof window.injectPrintButton === 'function') window.injectPrintButton();
    if (dot) {
      dot.textContent = `Live · synced ${new Date().toLocaleTimeString()}`;
      dot.classList.remove('stale');
    }
  } catch (e) {
    main.innerHTML = `<div class="error">${e.message}<br>
      <small>Is the API server running? (${window.API_BASE})</small></div>`;
    if (dot) { dot.textContent = 'Offline — retrying'; dot.classList.add('stale'); }
  }
}

// Print DR, but never fail silently: if print.js did not load, or the receipt
// data cannot be fetched, say so instead of leaving a button that does nothing.
async function runPrintDR(deliveryId) {
  if (typeof window.printDeliveryReceipt !== 'function') {
    alert('The printing module did not load, so the Delivery Receipt cannot be built.\n\n'
      + 'Close and reopen the app. If it keeps happening, tell Glomer — print.js is missing.');
    return;
  }
  try {
    await window.printDeliveryReceipt(deliveryId);
  } catch (e) {
    alert('Could not print this Delivery Receipt: ' + (e.message || e));
  }
}

// Pay / Void / Delete buttons on Sales + Receivables
function wireSalesActions() {
  document.querySelectorAll('[data-pay]').forEach((b) => b.onclick = () => {
    window._payPrefill = Number(b.dataset.pay);
    show('payments');
  });
  applyRbacDom();   // strip admin-only controls for non-admins on every (re)render
  document.querySelectorAll('[data-approve]').forEach((b) => b.onclick = async () => {
    if (!confirm('Approve this sale? It becomes final (Completed).')) return;
    try { await api.put(`/api/sales/${b.dataset.approve}`, { status: 'Completed' }); show(window._view); }
    catch (e) { alert('Error: ' + e.message); }
  });
  document.querySelectorAll('[data-editsale]').forEach((b) =>
    b.onclick = () => startEditSale(Number(b.dataset.editsale)));
    document.querySelectorAll('[data-editpay]').forEach((b) => b.onclick = () => {
    const p = (window._payRows || []).find((x) => x.id === Number(b.dataset.editpay));
    const modal = document.getElementById('payEditModal'), form = document.getElementById('payEditForm');
    if (!p || !modal || !form) return;
    form.id.value = p.id;
    form.or_no.value = p.or_no ?? '';
    form.date.value = String(p.date).slice(0, 10);
    form.amount.value = Number(p.amount);
    form.account_id.value = p.account_id ?? '';
    form.notes.value = p.notes ?? '';
    form.payer_name.value = p.payer_name ?? p.received_by ?? '';
    if (form.cheque_status) form.cheque_status.value = p.cheque_status ?? '';
    const sigInput = form.querySelector('[name=signature]');
    if (sigInput) sigInput.value = p.signature || '';
    form.dataset.version = p.version ?? '';
    document.getElementById('payEditTitle').textContent =
      `Edit payment — ${p.sales_no} · ${p.customer}`;
    document.getElementById('orEditCheck').textContent = '';
    modal.classList.remove('hidden');
  });
  document.querySelectorAll('[data-delpay]').forEach((b) => b.onclick = async () => {
    if (!confirm('Delete this payment? The invoice balance will increase.')) return;
    try { await api.del(`/api/payments/${b.dataset.delpay}`); show(window._view); }
    catch (e) { alert('Error: ' + e.message); }
  });
  document.querySelectorAll('[data-cancel]').forEach((b) => b.onclick = async () => {
    if (!confirm('Cancel this invoice? It will be excluded from stock and money totals.')) return;
    try { await api.put(`/api/sales/${b.dataset.cancel}`, { status: 'Cancelled' }); show(window._view); }
    catch (e) { alert('Error: ' + e.message); }
  });
  document.querySelectorAll('[data-delsale]').forEach((b) => b.onclick = async () => {
    if (!confirm('Permanently DELETE this invoice and its line items?')) return;
    try { await api.del(`/api/sales/${b.dataset.delsale}`); show(window._view); }
    catch (e) { alert('Error: ' + e.message); }
  });
  // Delivery Receipts: create from invoice → save & print; report actions
  document.querySelectorAll('[data-makedr]').forEach((b) => b.onclick = () => {
    const modal = document.getElementById('drModal');
    const form = document.getElementById('drForm');
    form.reset();
    form.sale_id.value = b.dataset.makedr;
    form.date.value = new Date().toISOString().slice(0, 10);
    // DR numbers run in series too — filled in, still editable
    api.get('/api/next_no?kind=dr')
      .then((r) => { if (!form.dr_no.value.trim()) form.dr_no.value = r.next; })
      .catch(() => {});
    const sale = (window._salesRows || []).find((s) => s.id === Number(b.dataset.makedr));
    document.getElementById('drModalTitle').textContent =
      `New Delivery Receipt — Invoice #${sale?.sales_no ?? ''} · ${sale?.customer ?? ''}`;
    // default the driver to the invoice's sales rep — the rep is normally who
    // delivers, and a blank field prints a DR with no one named as deliverer
    if (sale && sale.sales_rep_id) {
      api.get('/api/sales_reps').then((reps) => {
        const r = reps.find((x) => x.id === Number(sale.sales_rep_id));
        if (r && !form.delivered_by.value.trim()) form.delivered_by.value = r.name;
      }).catch(() => {});
    }
    modal.classList.remove('hidden');
    // live uniqueness check on DR No.
    const out = document.getElementById('drCheck');
    let t;
    form.dr_no.oninput = () => {
      clearTimeout(t);
      const v = form.dr_no.value.trim();
      if (!v) { out.textContent = ''; return; }
      t = setTimeout(async () => {
        try {
          const r = await api.get(`/api/check/dr?no=${encodeURIComponent(v)}`);
          out.textContent = r.exists ? '✗ already used — must be unique' : '✓ available';
          out.className = r.exists ? 'checkbad' : 'checkok';
        } catch {}
      }, 350);
    };
    document.getElementById('drModalClose').onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      try {
        const d = await api.post(`/api/sales/${f.sale_id}/deliveries`, f);
        modal.classList.add('hidden');
        await runPrintDR(d.id);
        show(window._view);
      } catch (err) { alert('Error: ' + err.message); }
    };
  });
  document.querySelectorAll('[data-printdr]').forEach((b) =>
    b.onclick = () => runPrintDR(Number(b.dataset.printdr)));
  document.querySelectorAll('[data-markdel]').forEach((b) => b.onclick = async () => {
    // receiver signs on-screen; the background-less signature affixes onto the DR
    const r = await openSignPad({ title: 'Mark delivered — receiver signs here' });
    if (!r) return;
    try {
      await api.put(`/api/deliveries/${b.dataset.markdel}`, {
        status: 'Delivered', received_by: r.name || null,
        delivered_date: new Date().toISOString().slice(0, 10),
        signature: r.signature,
      });
      show(window._view);
    } catch (e) { alert('Error: ' + e.message); }
  });
  // the receiver changed the order at delivery? open the invoice with everything editable
  document.querySelectorAll('[data-editorder]').forEach((b) => b.onclick = async () => {
    await show('sales');
    startEditSale(Number(b.dataset.editorder));
  });
  document.querySelectorAll('[data-deldr]').forEach((b) => b.onclick = async () => {
    if (!confirm('Delete this Delivery Receipt record?')) return;
    try { await api.del(`/api/deliveries/${b.dataset.deldr}`); show(window._view); }
    catch (e) { alert('Error: ' + e.message); }
  });
  // full edit of a DR record (dr_no stays unique — server enforces, UI pre-checks)
  document.querySelectorAll('[data-editdr]').forEach((b) => b.onclick = async () => {
    const rows = await api.get('/api/deliveries');
    const d = rows.find((x) => x.id === Number(b.dataset.editdr));
    if (!d) return;
    const modal = document.getElementById('drEditModal');
    const form = document.getElementById('drEditForm');
    form.id.value = d.id;
    form.dr_no.value = d.dr_no ?? '';
    form.date.value = d.date ? String(d.date).slice(0, 10) : '';
    form.delivered_by.value = d.delivered_by ?? '';
    form.vehicle.value = d.vehicle ?? '';
    form.status.value = d.status ?? 'Pending';
    form.received_by.value = d.received_by ?? '';
    form.delivered_date.value = d.delivered_date ? String(d.delivered_date).slice(0, 10) : '';
    form.notes.value = d.notes ?? '';
    form.dataset.version = d.version ?? '';
    // receiver's affixed signature (transparent PNG) — preview, recapture, or remove
    const sigPrev = document.getElementById('drSigPreview');
    const renderSig = () => {
      sigPrev.innerHTML = form.dataset.signature
        ? `<img src="${form.dataset.signature}" style="height:44px" alt="signature">
           <small style="color:var(--ink-2)">${form.received_by.value || ''}</small>`
        : '<small style="color:var(--ink-2)">No signature captured yet.</small>';
    };
    form.dataset.signature = d.signature || '';
    renderSig();
    document.getElementById('drSigCapture').onclick = async () => {
      const r = await openSignPad({ title: `Signature — DR ${d.dr_no}`, name: form.received_by.value });
      if (!r) return;
      if (r.name) form.received_by.value = r.name;
      if (r.signature) form.dataset.signature = r.signature;
      renderSig();
    };
    document.getElementById('drSigClear').onclick = () => { form.dataset.signature = ''; renderSig(); };
    document.getElementById('drEditTitle').textContent =
      `Edit DR ${d.dr_no} — Invoice #${d.sales_no} · ${d.customer}`;
    const out = document.getElementById('drEditCheck');
    out.textContent = '';
    let t;
    form.dr_no.oninput = () => {
      clearTimeout(t);
      const v = form.dr_no.value.trim();
      if (!v || v === d.dr_no) { out.textContent = ''; return; }
      t = setTimeout(async () => {
        try {
          const r = await api.get(`/api/check/dr?no=${encodeURIComponent(v)}`);
          out.textContent = r.exists ? '✗ already used — must be unique' : '✓ available';
          out.className = r.exists ? 'checkbad' : 'checkok';
        } catch {}
      }, 350);
    };
    modal.classList.remove('hidden');
    document.getElementById('drEditClose').onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const id = f.id; delete f.id;
      for (const k of Object.keys(f)) if (f[k] === '') f[k] = null;
      if (form.dataset.version) f.version = Number(form.dataset.version);
      f.signature = form.dataset.signature || null;
      try {
        await api.put(`/api/deliveries/${id}`, f);
        modal.classList.add('hidden');
        show(window._view);
      } catch (err) { alert('Error: ' + err.message); }
    };
  });

  // one-click PO receive: stamp today, fill received qty, flip status → stock updates
  document.querySelectorAll('[data-receive]').forEach((b) => b.onclick = async () => {
    try {
      await api.put(`/api/purchases/${b.dataset.receive}`, {
        received_date: new Date().toISOString().slice(0, 10),
        received_qty: Number(b.dataset.qty),
        status: 'Received',
      });
      show(window._view);
    } catch (e) { alert('Error: ' + e.message); }
  });
  // draft POs from reorder suggestions, one button per vendor group
  document.querySelectorAll('[data-draftpo]').forEach((b) => b.onclick = async () => {
    const vendor = b.dataset.draftpo;
    const items = (window._reorder || []).filter((r) => (r.vendor ?? 'No preferred vendor') === vendor);
    const today = new Date().toISOString().slice(0, 10);
    let made = 0;
    try {
      for (const r of items) {
        const qty = Number(document.querySelector(`[data-reoqty="${r.id}"]`)?.value) || 0;
        if (qty <= 0) continue;
        await api.post('/api/purchases', {
          order_date: today, item_id: r.id, purchase_qty: qty, received_qty: 0,
          unit_cost: Number(r.cost) || 0, status: 'Ordered',
          vendor_id: r.preferred_vendor_id ?? null,
          notes: 'Drafted from reorder suggestions',
        });
        made++;
      }
      alert(`${made} purchase order(s) drafted for ${vendor}.`);
      show('purchases');
    } catch (e) { alert('Error: ' + e.message); }
  });

  // ---- CRUD on the URC-format SO blocks (live /api/purchases, no local copies) ----
  const poModal = document.getElementById('poModal'), poForm = document.getElementById('poForm');
  const openPo = (title, vals) => {
    if (!poModal || !poForm) return;
    document.getElementById('poModalTitle').textContent = title;
    poForm.reset();
    poForm.dataset.version = vals.version ?? '';
    poForm.ref_id.required = false;
    poForm.ref_id.placeholder = '';
    for (const [k, v] of Object.entries(vals)) {
      if (poForm[k] !== undefined) poForm[k].value = v ?? '';
    }
    poModal.classList.remove('hidden');
  };
  if (poModal && poForm && !poForm._wired) {
    poForm._wired = true;
    document.getElementById('poModalClose').onclick = () => poModal.classList.add('hidden');
    poModal.onclick = (e) => { if (e.target === poModal) poModal.classList.add('hidden'); };
    poForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(poForm));
      const body = {
        order_date: f.order_date, received_date: f.received_date || null,
        expiry_date: f.expiry_date || null,
        ref_id: f.ref_id || null, item_id: Number(f.item_id),
        purchase_qty: Number(f.purchase_qty), received_qty: Number(f.received_qty) || 0,
        unit_cost: Number(f.unit_cost) || 0, account_id: f.account_id || null,
        status: f.status, vendor_id: f.vendor_id || null, notes: f.notes || null,
      };
      if (f.id && poForm.dataset.version) body.version = Number(poForm.dataset.version);
      try {
        if (f.id) await api.put(`/api/purchases/${f.id}`, body);
        else await api.post('/api/purchases', body);
        poModal.classList.add('hidden');
        show('purchases');
      } catch (err) { alert('Error: ' + err.message); }
    };
  }
  document.querySelectorAll('[data-poedit]').forEach((b) => b.onclick = () => {
    const l = (window._poRows || []).find((x) => x.id === Number(b.dataset.poedit));
    if (!l) return;
    openPo(`Edit line — ${l.ref_id ?? 'purchase'}`, {
      id: l.id, version: l.version, ref_id: l.ref_id, order_date: String(l.order_date).slice(0, 10),
      received_date: l.received_date ? String(l.received_date).slice(0, 10) : '',
      expiry_date: l.expiry_date ? String(l.expiry_date).slice(0, 10) : '',
      item_id: l.item_id, purchase_qty: Number(l.purchase_qty), received_qty: Number(l.received_qty),
      unit_cost: Number(l.unit_cost), status: l.status, vendor_id: l.vendor_id,
      account_id: l.account_id, notes: l.notes,
    });
  });
  document.querySelectorAll('[data-ponew]').forEach((b) => b.onclick = () => {
    openPo('New purchase order — first line', {
      id: '', ref_id: '', order_date: new Date().toISOString().slice(0, 10),
      received_date: '', status: 'Ordered',
    });
    // a new PO needs its SO/Ref No. so it gets its own block; more lines via "Add line"
    if (poForm) {
      poForm.ref_id.required = true;
      poForm.ref_id.placeholder = 'e.g. SO 1890XXXXXX — required';
      const urc = [...poForm.vendor_id.options].find((o) => o.textContent.includes('Universal Robina'));
      if (urc) poForm.vendor_id.value = urc.value;
      poForm.ref_id.focus();
    }
  });
  document.querySelectorAll('[data-poadd]').forEach((b) => b.onclick = () => {
    const ref = b.dataset.poadd;
    const h = (window._poRows || []).find((x) => x.ref_id === ref);
    openPo(`Add line — ${ref}`, {
      id: '', ref_id: ref,
      order_date: h ? String(h.order_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      received_date: h?.received_date ? String(h.received_date).slice(0, 10) : '',
      status: h?.status ?? 'Received', vendor_id: h?.vendor_id ?? '',
    });
  });
  document.querySelectorAll('[data-podel]').forEach((b) => b.onclick = async () => {
    if (!confirm('Delete this purchase line? Stock from its received qty will be removed.')) return;
    try { await api.del(`/api/purchases/${b.dataset.podel}`); show('purchases'); }
    catch (e) { alert('Error: ' + e.message); }
  });
  document.querySelectorAll('[data-podelso]').forEach((b) => b.onclick = async () => {
    const ref = b.dataset.podelso;
    const lines = (window._poRows || []).filter((x) => x.ref_id === ref);
    if (!confirm(`Delete ALL ${lines.length} line(s) of ${ref}? Stock from received quantities will be removed.`)) return;
    try {
      for (const l of lines) await api.del(`/api/purchases/${l.id}`);
      show('purchases');
    } catch (e) { alert('Error: ' + e.message); }
  });
}

// ---- e-signature pad: draws on a transparent canvas → background-less PNG ----
// (the white box is CSS-only; the exported image contains just the ink)
function openSignPad({ title = 'Receive & sign', askName = true, name = '' } = {}) {
  return new Promise((resolve) => {
    document.getElementById('signModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'signModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-box" style="width:min(560px,96%)">
        <div class="modal-head"><h3 style="margin:0;flex:1">${title}</h3>
          <button type="button" class="mini" id="signClose">Cancel</button></div>
        <div class="modal-body" style="padding:16px">
          ${askName ? `<label style="margin-bottom:10px">Received by (printed name)
            <input id="signName" value="${(name || '').replace(/"/g, '&quot;')}" autocomplete="off"></label>` : ''}
          <div style="font-size:12.5px;color:var(--ink-2);font-weight:600;margin:8px 0 4px">
            Signature — sign inside the box (finger, stylus, or mouse)</div>
          <canvas id="signPad" width="1000" height="360"
            style="width:100%;height:180px;border:1.5px dashed var(--border-strong);border-radius:8px;
                   background:#fff;touch-action:none;cursor:crosshair"></canvas>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button type="button" class="mini" id="signClear">Clear</button>
            <span style="flex:1"></span>
            <button type="button" class="primary" id="signSave">Save</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const canvas = document.getElementById('signPad');
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#14203a';
    let drawing = false, drew = false;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * canvas.width / r.width,
               y: (e.clientY - r.top) * canvas.height / r.height };
    };
    canvas.onpointerdown = (e) => {
      e.preventDefault(); drawing = true; drew = true;
      canvas.setPointerCapture(e.pointerId);
      const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.1, p.y + 0.1); ctx.stroke();
    };
    canvas.onpointermove = (e) => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    canvas.onpointerup = () => { drawing = false; };
    const close = (val) => { modal.remove(); resolve(val); };
    modal.onclick = (e) => { if (e.target === modal) close(null); };
    document.getElementById('signClear').onclick = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); drew = false; };
    document.getElementById('signClose').onclick = () => close(null);
    document.getElementById('signSave').onclick = () => close({
      name: askName ? document.getElementById('signName').value.trim() : null,
      signature: drew ? canvas.toDataURL('image/png') : null,   // transparent PNG
    });
  });
}

// Open an existing invoice in the New Sale modal with EVERYTHING editable:
// date, invoice #, customer, terms, items, prices, discounts. Loads a fresh
// copy (with its version) so concurrent edits are detected on save.
async function startEditSale(id) {
  const nsModal = document.getElementById('newSaleModal');
  const body = document.getElementById('newSaleBody');
  if (!nsModal || !body) { alert('Open the Sales page to edit an invoice.'); return; }
  body.innerHTML = '<div class="loading">Loading…</div>';
  nsModal.classList.remove('hidden');
  const all = await api.get('/api/sales');
  const s = all.find((x) => x.id === id);
  if (!s) { body.innerHTML = '<p class="empty">Invoice not found.</p>'; return; }
  body.innerHTML = (await views.newsale()).replace('<h2>New Sale</h2>', '');
  window._editSale = { id: s.id, version: s.version };
  window._saleData.lines.push(...(s.items || []).map((it) => ({
    item_id: it.item_id, name: it.item, alias: it.alias, qty: Number(it.qty),
    unit_price: Number(it.unit_price), discount: Number(it.discount) || 0,
    promo: !!it.promo,
  })));
  wire('newsale');
  const f = document.getElementById('saleForm');
  f.sales_no.value = s.sales_no;
  f.date.value = String(s.date).slice(0, 10);
  f.customer.value = s.customer ?? '';
  f.store_farm.value = s.store_farm ?? '';
  f.contact_no.value = s.contact_no ?? '';
  f.tax_pct.value = Number(s.tax_pct) || 0;
  f.discount_pct.value = Number(s.discount_pct) || 0;
  if (s.account_id) f.account_id.value = s.account_id;
  if (s.sales_rep_id) f.sales_rep_id.value = s.sales_rep_id;
  const termSel = document.getElementById('termPreset');
  if (s.term) {
    const match = [...termSel.options].find((o) =>
      o.value.toLowerCase() === String(s.term).trim().toLowerCase());
    if (match) termSel.value = match.value;
    else {
      termSel.value = 'Custom…';
      f.term.value = s.term;
      document.getElementById('customTermWrap')?.classList.remove('hidden');
    }
  }
  f.due_date.value = s.due_date ? String(s.due_date).slice(0, 10) : '';
  const mkt = document.getElementById('mktBilled');
  if (mkt) mkt.checked = !!s.billed_by_marketing;
  // An invoice written before a product carried a per-bag discount opens showing
  // none, so editing an old sale would quietly undercut the customer. Fill the
  // current figure in — only now that the term is on the form, since the term is
  // what decides COD or Term rate. Lines that already hold a discount are left
  // as saved (never doubled) and promo free goods stay at 0.00.
  window._saleData.lines.forEach((l) => {
    if (l.promo || Number(l.discount)) return;
    const bag = bagDiscountOf(window._saleData.items.find((i) => i.id === l.item_id));
    if (bag) l.discount = bag;
  });
  // any invoice-level peso discount that isn't carried on the lines
  const lineDisc = window._saleData.lines.reduce((a, l) => a + l.qty * (l.discount || 0), 0);
  const subtotal = window._saleData.lines.reduce((a, l) => a + l.qty * l.unit_price, 0);
  const pct = subtotal * (Number(s.discount_pct) || 0) / 100;
  f.discount_amt.value = Math.max(0,
    Math.round((Number(s.discount) - lineDisc - pct) * 100) / 100);
  // payments live in the ledger — hidden here so edits never touch paid amounts
  f.amount_paid.closest('label').style.display = 'none';
  f.or_no.closest('label').style.display = 'none';
  document.querySelector('#newSaleModal .modal-head h3').textContent = `Edit Sale — ${s.sales_no}`;
  f.tax_pct.dispatchEvent(new Event('input'));    // re-render lines + totals
}

// ---- Customer Information Sheets ----------------------------------------
// Open to every signed-in user: no role gate here, and the buttons deliberately
// avoid the ADMIN_CONTROLS selectors so applyRbacDom() leaves them in place.
function openCisSheet(sheet, type) {
  window._cisEdit = sheet || null;
  window._cisType = type || (sheet && sheet.sheet_type) || 'store';
  show('cisform');
}
// Jump straight to a customer's sheet — creating it pre-linked if none exists yet.
async function openCisForCustomer(customerId, customerName) {
  try {
    const list = await api.get(`/api/cis?customer_id=${encodeURIComponent(customerId)}`);
    if (list.length) return openCisSheet(await api.get(`/api/cis/${list[0].id}`));
    openCisSheet({ customer_id: customerId, account_name: customerName || '', specimens: [] }, 'store');
  } catch (e) { alert('Error: ' + e.message); }
}
function wireCisLinks() {
  document.querySelectorAll('[data-cissheet]').forEach((b) => b.onclick = (e) => {
    e.preventDefault();
    openCisForCustomer(b.dataset.cissheet, b.dataset.cisname || '');
  });
  document.querySelectorAll('[data-cisprint]').forEach((b) => b.onclick = () => {
    if (typeof window.printCIS === 'function') window.printCIS(b.dataset.cisprint);
    else alert('Print module not loaded yet — try again in a moment.');
  });
}
function wireCisList() {
  document.querySelectorAll('[data-cisnew]').forEach((b) => b.onclick = () =>
    openCisSheet(null, b.dataset.cisnew));
  document.querySelectorAll('[data-cisopen]').forEach((b) => b.onclick = async () => {
    try { openCisSheet(await api.get(`/api/cis/${b.dataset.cisopen}`)); }
    catch (e) { alert('Error: ' + e.message); }
  });
  document.querySelectorAll('[data-cisdel]').forEach((b) => b.onclick = async () => {
    if (!confirm('Delete this information sheet? The customer record itself is not affected.')) return;
    try { await api.del(`/api/cis/${b.dataset.cisdel}`); show('cis'); }
    catch (e) { alert('Error: ' + e.message); }
  });
  document.querySelectorAll('[data-cisfilter]').forEach((b) => b.onclick = () => {
    window._cisFilter = b.dataset.cisfilter; show('cis');
  });
  const s = document.getElementById('cisSearch');
  if (s) {
    let t;
    s.oninput = () => { clearTimeout(t); t = setTimeout(() => {
      window._cisSearch = s.value;
      window._cisRefocus = true;          // the re-render replaces this input
      show('cis');
    }, 350); };
    if (window._cisRefocus) {             // keep typing where the user left off
      window._cisRefocus = false;
      s.focus();
      s.setSelectionRange(s.value.length, s.value.length);
    }
  }
}
function wireCisForm() {
  const form = document.getElementById('cisForm');
  if (!form) return;
  const sheet = window._cisEdit || {};
  // specimens live outside the form fields: name + optional drawn signature
  window._cisSpec = Array.isArray(sheet.specimens) ? sheet.specimens.slice(0, 6) : [];
  while (window._cisSpec.length < 6) window._cisSpec.push({ name: '', signature: null });
  window._cisCertSig = sheet.certified_signature || null;

  const renderSpecs = () => {
    document.getElementById('cisSpecimens').innerHTML = window._cisSpec.map((sp, i) => `
      <div class="cis-spec">
        <span class="cis-num">${i + 1}.</span>
        <input data-specname="${i}" value="${esc(sp.name || '')}" placeholder="printed name"
          autocomplete="off">
        ${sp.signature
          ? `<span style="display:flex;gap:6px;align-items:center">
               <img class="cis-sigimg" src="${sp.signature}" alt="specimen signature">
               <button type="button" class="mini danger" data-specclear="${i}">×</button></span>`
          : `<button type="button" class="mini" data-specsign="${i}">Sign</button>`}
      </div>`).join('');
    document.querySelectorAll('[data-specname]').forEach((inp) => inp.oninput = () => {
      window._cisSpec[Number(inp.dataset.specname)].name = inp.value;
    });
    document.querySelectorAll('[data-specsign]').forEach((b) => b.onclick = async () => {
      const i = Number(b.dataset.specsign);
      const r = await openSignPad({ title: `Signature specimen ${i + 1}`, askName: true,
        name: window._cisSpec[i].name || '' });
      if (!r) return;
      if (r.name) window._cisSpec[i].name = r.name;
      if (r.signature) window._cisSpec[i].signature = r.signature;
      renderSpecs();
    });
    document.querySelectorAll('[data-specclear]').forEach((b) => b.onclick = () => {
      window._cisSpec[Number(b.dataset.specclear)].signature = null; renderSpecs();
    });
  };
  const renderCert = () => {
    document.getElementById('cisCertSig').innerHTML = window._cisCertSig
      ? `<img class="cis-sigimg" src="${window._cisCertSig}" alt="customer signature">
         <button type="button" class="mini danger" id="cisCertClear">Remove</button>`
      : '<button type="button" class="mini" id="cisCertSign">Capture customer signature</button>';
    const sign = document.getElementById('cisCertSign');
    if (sign) sign.onclick = async () => {
      const r = await openSignPad({ title: 'Customer’s signature over printed name',
        askName: true, name: form.certified_name.value || '' });
      if (!r) return;
      if (r.name) form.certified_name.value = r.name;
      window._cisCertSig = r.signature || null;
      renderCert();
    };
    const clr = document.getElementById('cisCertClear');
    if (clr) clr.onclick = () => { window._cisCertSig = null; renderCert(); };
  };
  renderSpecs();
  renderCert();

  // store ⇄ farm: the corporation block and the wording follow the paper forms
  const applyType = () => {
    const type = form.querySelector('[name=sheet_type]:checked')?.value || 'store';
    const noun = type === 'farm' ? 'Farm' : 'Store';
    document.getElementById('cisCorp').classList.toggle('hidden', type === 'farm');
    const a = form.querySelector('[data-noun]');
    if (a) a.textContent = `${noun} established on`;
    const b = form.querySelector('[data-noun-addr]');
    if (b) b.textContent = `Complete ${noun} Address`;
  };
  form.querySelectorAll('[name=sheet_type]').forEach((r) => r.onchange = applyType);
  applyType();

  // say plainly what the link choice will do before the sheet is saved
  const link = document.getElementById('cisCustLink');
  const linkHint = document.getElementById('cisLinkHint');
  if (link && linkHint) {
    const paintHint = () => {
      const name = (form.account_name.value || '').trim();
      linkHint.textContent = link.value === 'new'
        ? (name
          ? `Saving adds “${name}” as a customer and links this sheet to it. `
            + 'A customer of that name already on file is reused, never duplicated.'
          : 'Saving adds the Account Name above as a customer and links this sheet to it.')
        : link.value
          ? 'This sheet stays linked to the customer selected above.'
          : 'This sheet will not be tied to any customer record.';
    };
    link.onchange = paintHint;
    form.account_name.addEventListener('input', paintHint);
    paintHint();
  }

  const back = document.getElementById('cisBack');
  if (back) back.onclick = () => { window._cisEdit = null; show('cis'); };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    body.terms_credit = form.terms_credit.checked;
    body.terms_check = form.terms_check.checked;
    body.customer_id = body.customer_id || null;
    // a specimen row counts only if it carries a name or an actual signature
    body.specimens = window._cisSpec.filter((sp) => (sp.name || '').trim() || sp.signature);
    body.certified_signature = window._cisCertSig;
    const id = form.dataset.id;
    if (id && form.dataset.version) body.version = Number(form.dataset.version);
    try {
      const saved = id ? await api.put(`/api/cis/${id}`, body) : await api.post('/api/cis', body);
      window._cisEdit = null;
      window._cisCustomers = null;      // a customer may have just been created — reload the picker
      const madeNew = body.customer_id === 'new' && saved && saved.customer_id;
      toast(madeNew
        ? `Sheet saved — “${(body.account_name || '').trim()}” is now a customer.`
        : id ? 'Information sheet updated.' : 'Information sheet saved.');
      show('cis');
      return saved;
    } catch (err) { alert('Error: ' + err.message); }
  };
}

function wire(view) {
  if (view === 'cis') wireCisList();
  if (view === 'cisform') wireCisForm();
  wireCisLinks();                          // "Information sheet" buttons on other pages
  if (view === 'newsale') wireNewsale();   // standalone fallback (no nav entry anymore)
  // New Sale now lives in a modal on the Sales page; same form, same wiring
  if (view === 'sales') {
    const nsBtn = document.getElementById('openNewSale');
    const nsModal = document.getElementById('newSaleModal');
    if (nsBtn && nsModal) {
      nsBtn.onclick = async () => {
        window._editSale = null;
        const body = document.getElementById('newSaleBody');
        body.innerHTML = '<div class="loading">Loading…</div>';
        document.querySelector('#newSaleModal .modal-head h3').textContent = 'New Sale';
        nsModal.classList.remove('hidden');
        body.innerHTML = (await views.newsale()).replace('<h2>New Sale</h2>', '');
        wireNewsale();
      };
      document.getElementById('newSaleClose').onclick = () => {
        if (window._saleData?.lines.length
          && !confirm('Discard the changes? Unsaved edits will be lost.')) return;
        window._editSale = null;
        nsModal.classList.add('hidden');
      };
    }
  }

  function wireNewsale() {
    const lines = window._saleData.lines;
    // invoice numbers run in series: fill in the next one, still editable, and
    // only when the field is empty so an edit in progress is never overwritten
    const invIn = document.querySelector('#saleForm [name=sales_no]');
    if (invIn && !invIn.value.trim() && !window._editSale) {
      api.get('/api/next_no?kind=invoice')
        .then((r) => { if (!invIn.value.trim()) invIn.value = r.next; })
        .catch(() => {});
    }
    // URC tier pricing: SRP, or SRP less the item's stored outright (and COD) discounts
    const tierPriceOf = (i) => {
      const srp = Number(i.sales_price) || 0;
      const tier = document.getElementById('priceTier')?.value || 'srp';
      // Flat per-bag discount on feeds and Topbreed. How the customer pays decides
      // the figure: a Cash (COD) sale gets more off than one on credit Terms. It
      // applies on every price tier — feeds carry no percentage discount, so this
      // is the only cut they get and it must not vanish on the plain SRP tier.
      const bag = Number(bagDiscountOf(i)) || 0;
      if (tier === 'srp' || !Number(i.outright_rate)) return Math.round((srp - bag) * 100) / 100;
      let p = srp * (1 - Number(i.outright_rate));
      if (tier === 'cod') p *= (1 - (Number(i.cod_rate) || 0));
      return Math.round((p - bag) * 100) / 100;
    };
    const listPriceOf = (i) => Math.round((Number(i.sales_price) || 0) * 100) / 100;
    // when the tier changes (customer selected / manual), every line re-prices itself:
    // unit cost stays the LIST price; the tier lands in the DISCOUNT column (net = cost − disc)
    // promo free goods: "10 + 1" etc. — extra ITEMS paid by URC marketing, not a price cut.
    // They go on their own 0.00 line so inventory still counts them out.
    const dealOf = (item) => {
      const m = String(item?.dealer_deal || item?.deal || '').match(/(\d+)\s*\+\s*(\d+)/);
      return m ? { base: Number(m[1]), extra: Number(m[2]), label: `${m[1]} + ${m[2]}` } : null;
    };
    const applyPromo = (itemId, { ask = false } = {}) => {
      const item = window._saleData.items.find((i) => i.id === itemId);
      const deal = dealOf(item);
      if (!deal) return;
      const paid = lines.find((l) => l.item_id === itemId && !l.promo);
      const paidQty = paid ? Number(paid.qty) : 0;
      const freeDue = Math.floor(paidQty / deal.base) * deal.extra;
      const promoLine = lines.find((l) => l.item_id === itemId && l.promo);
      const already = promoLine ? promoLine.qty : 0;
      if (freeDue <= already) {
        if (!ask) alert(`Promo ${deal.label}: needs at least ${deal.base} paid unit(s) of ${item.name} ` +
          `per free unit — currently ${paidQty} paid, ${already} free already applied.`);
        return;
      }
      if (ask && !confirm(
        `Promo ${deal.label} on ${itemLabelFull(item)}:\nadd ${freeDue - already} FREE unit(s)? ` +
        `(free goods paid by URC marketing — they still deduct from inventory)`)) return;
      if (promoLine) promoLine.qty = freeDue;
      else lines.push({ item_id: itemId, name: item.name, alias: item.alias, qty: freeDue,
                        unit_price: 0, discount: 0, promo: true });
      renderLines();
    };
    const repriceLines = () => lines.forEach((l) => {
      if (l.promo) return;                       // promo free goods stay at 0.00
      const item = window._saleData.items.find((i) => i.id === l.item_id);
      if (item) {
        l.unit_price = listPriceOf(item);
        l.discount = Math.round((listPriceOf(item) - tierPriceOf(item)) * 100) / 100;
      }
    });
    const renderLines = () => {
      const subtotal = lines.reduce((a, l) => a + l.qty * l.unit_price, 0);          // unit-cost total
      const lineDisc = lines.reduce((a, l) => a + l.qty * (l.discount || 0), 0);     // per-line discounts
      const taxPct = Number(document.querySelector('[name=tax_pct]').value) || 0;
      const discPct = Number(document.querySelector('[name=discount_pct]').value) || 0;
      const discAmt = Number(document.querySelector('[name=discount_amt]')?.value) || 0;
      const tax = subtotal * taxPct / 100;
      const disc = subtotal * discPct / 100 + discAmt;
      document.getElementById('lines').innerHTML = lines.length
        ? `<div class="tablewrap"><table><thead><tr><th>Item</th><th style="width:80px">Qty</th><th style="width:105px">Unit cost</th>
             <th style="width:95px">Discount</th><th style="width:95px">Net price</th><th>Amount</th><th></th></tr></thead><tbody>
           ${lines.map((l, i) => l.promo
             ? `<tr><td>${itemLabelHtml(l)} <span class="badge green">PROMO — free, paid by URC marketing</span></td>
             <td><input type="number" step="any" min="0" value="${l.qty}" data-editqty="${i}" style="width:70px"></td>
             <td class="num">0.00</td><td class="num">—</td><td class="num">0.00</td><td class="num">0.00</td>
             <td><button type="button" class="mini danger" data-rm="${i}">Remove</button></td></tr>`
             : `<tr><td>${itemLabelHtml(l)}</td>
             <td><input type="number" step="any" min="0.001" value="${l.qty}" data-editqty="${i}" style="width:70px"></td>
             <td><input type="number" step="any" min="0" value="${l.unit_price}" data-editprice="${i}" style="width:95px"></td>
             <td><input type="number" step="any" min="0" value="${l.discount || 0}" data-editdisc="${i}" style="width:85px"></td>
             <td class="num">${(l.unit_price - (l.discount || 0)).toFixed(2)}</td>
             <td class="num">${(l.qty * (l.unit_price - (l.discount || 0))).toFixed(2)}</td>
             <td><span class="actions">${(() => {
               const deal = dealOf(window._saleData.items.find((x) => x.id === l.item_id));
               return deal ? `<button type="button" class="mini add" data-promoline="${i}"
                 title="Add the free goods (paid by URC marketing)">Promo ${deal.label}</button>` : '';
             })()}<button type="button" class="mini danger" data-rm="${i}">Remove</button></span></td></tr>`).join('')}
           </tbody></table></div>` : '<p class="empty">No items yet — click "Add items…" to search and add.</p>';
      window._saleTotal = subtotal + tax - lineDisc - disc;
      document.getElementById('totals').innerHTML =
        `Unit-cost total: <b>${subtotal.toFixed(2)}</b> · Tax: <b>${tax.toFixed(2)}</b> ·
         Discounts: <b>−${(lineDisc + disc).toFixed(2)}</b> ·
         Net total (amount due): <b>${(subtotal + tax - lineDisc - disc).toFixed(2)}</b>`;
      document.querySelectorAll('[data-rm]').forEach((b) =>
        b.onclick = () => { lines.splice(Number(b.dataset.rm), 1); renderLines(); });
      document.querySelectorAll('[data-editqty]').forEach((inp) =>
        inp.onchange = () => { lines[Number(inp.dataset.editqty)].qty = Number(inp.value) || 0; renderLines(); });
      document.querySelectorAll('[data-editprice]').forEach((inp) =>
        inp.onchange = () => { lines[Number(inp.dataset.editprice)].unit_price = Number(inp.value) || 0; renderLines(); });
      document.querySelectorAll('[data-editdisc]').forEach((inp) =>
        inp.onchange = () => { lines[Number(inp.dataset.editdisc)].discount = Number(inp.value) || 0; renderLines(); });
      document.querySelectorAll('[data-promoline]').forEach((b) =>
        b.onclick = () => applyPromo(lines[Number(b.dataset.promoline)].item_id));
    };
    // ---- item picker modal: search, see details, add many without closing ----
    const modal = document.getElementById('pickerModal');
    const renderPicker = (q = '') => {
      const ql = q.toLowerCase();
      const rows = window._saleData.items.filter((i) =>
        !ql || i.name.toLowerCase().includes(ql) ||
        String(i.alias || '').toLowerCase().includes(ql) ||   // warehouse short code
        String(i.sku || '').toLowerCase().includes(ql) ||
        String(i.category || '').toLowerCase().includes(ql));
      const tierPrice = tierPriceOf;
      document.getElementById('pickerList').innerHTML = rows.length ? `
        <table><thead><tr><th>Item</th><th>Category</th><th style="text-align:right">Price (tier)</th>
          <th>Deal</th><th style="text-align:right">Stock</th><th style="width:80px">Qty</th><th></th></tr></thead><tbody>
        ${rows.map((i) => `<tr>
          <td>${itemLabelHtml(i)}</td><td>${i.category ?? '-'}</td>
          <td class="num">${i.sales_price != null ? tierPrice(i).toFixed(2) : '—'}</td>
          <td>${(i.dealer_deal || i.deal) ? `<span class="badge green">${i.dealer_deal || i.deal}</span>` : ''}
            ${i.exp_soon ? `<span class="badge amber" title="Sell this stock first (FEFO)">EXP ${i.exp_soon}</span>` : ''}</td>
          <td class="num"><span class="badge ${i.status === 'In Stock' ? 'green' : i.status === 'Low Stock' ? 'amber' : 'red'}">${Number(i.on_hand)}</span></td>
          <td><input type="number" step="any" min="0.001" value="1" data-pickqty="${i.id}" style="width:70px"></td>
          <td><button type="button" class="mini add" data-pick="${i.id}">Add</button></td>
        </tr>`).join('')}</tbody></table>` : '<p class="empty">No items match.</p>';
      document.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => {
        const item = window._saleData.items.find((i) => i.id === Number(b.dataset.pick));
        const qty = Number(document.querySelector(`[data-pickqty="${item.id}"]`).value) || 1;
        const existing = lines.find((l) => l.item_id === item.id && !l.promo);
        if (existing) existing.qty += qty;
        else lines.push({
          item_id: item.id, name: item.name, alias: item.alias, qty,
          unit_price: listPriceOf(item),
          discount: Math.round((listPriceOf(item) - tierPrice(item)) * 100) / 100,
        });
        applyPromo(item.id, { ask: true });
        b.textContent = 'Added';
        setTimeout(() => { b.textContent = 'Add'; }, 900);
        renderLines();
      });
    };
    document.getElementById('openPicker').onclick = () => {
      modal.classList.remove('hidden');
      renderPicker(document.getElementById('pickerSearch').value);
      document.getElementById('pickerSearch').focus();
    };
    document.getElementById('pickerClose').onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    document.getElementById('pickerSearch').oninput = (e) => renderPicker(e.target.value);

    // manual tier change also re-prices every line already added
    document.getElementById('priceTier').onchange = () => {
      repriceLines();
      renderLines();
      const hint = document.getElementById('tierHint');
      if (hint) hint.textContent = '';
    };

    // ---- term presets: auto-compute due date (editable); Custom reveals free text ----
    const termSel = document.getElementById('termPreset');
    const customWrap = document.getElementById('customTermWrap');
    const dateIn = document.querySelector('[name=date]');
    const dueIn = document.querySelector('[name=due_date]');
    const computeDue = () => {
      const t = termSel.value;
      customWrap.classList.toggle('hidden', t !== 'Custom…');
      if (!dateIn.value) return;
      const m = t.match(/^(\d+)\s*days?$/i);
      // "1 up 1 down" settles when the customer's next order is placed, so there
      // is no calendar due date to compute and the balance simply stays open
      if (/1\s*up\s*1\s*down/i.test(t)) { dueIn.value = ''; return; }
      if (t.toLowerCase() === 'cash') {
        dueIn.value = dateIn.value;
        // cash sale = paid in full at the counter
        const paidIn = document.querySelector('[name=amount_paid]');
        if (!Number(paidIn.value)) paidIn.value = (window._saleTotal || 0).toFixed(2);
      } else if (m) {
        const d = new Date(dateIn.value + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + Number(m[1]));
        dueIn.value = d.toISOString().slice(0, 10);
      } else if (/end of month/i.test(t)) {
        const d = new Date(dateIn.value + 'T00:00:00Z');
        dueIn.value = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
          .toISOString().slice(0, 10);
      }
      // Custom…: due date left to the user
    };
    // switching between Cash and a credit term changes the per-bag discount, so
    // every line already on the invoice re-prices itself the moment it changes
    // reprice FIRST: a Cash term pre-fills "amount paid" from the running total, so
    // the lines must already carry the COD rate or the counter is handed a stale figure
    const onTermChange = () => { repriceLines(); renderLines(); computeDue(); };
    termSel.onchange = onTermChange;
    document.querySelector('#saleForm [name=term]')?.addEventListener('change', onTermChange);
    dateIn.addEventListener('change', computeDue);
    computeDue();

    // ---- customer selection: searchable modal (like the item picker) ----
    const applyCustomer = (c) => {
      const f = document.getElementById('saleForm');
      f.customer.value = c.customer;
      f.store_farm.value = c.store_farm ?? '';
      f.contact_no.value = c.contact_no ?? '';
      // the customer's saved URC tier auto-applies: discounts deduct on every line
      const tierSel = document.getElementById('priceTier');
      const tier = c.tier || 'srp';
      if (tierSel && tierSel.value !== tier) {
        tierSel.value = tier;
        repriceLines();
        renderLines();
      }
      const hint = document.getElementById('tierHint');
      if (hint) hint.textContent = tier !== 'srp'
        ? `✓ ${tier === 'cod' ? 'COD dealer' : 'Outright dealer'} discount auto-applied for this customer`
        : '';
      if (c.term) {
        const match = [...termSel.options].find((o) => o.value.toLowerCase() === c.term.trim().toLowerCase());
        if (match) termSel.value = match.value;
        else { termSel.value = 'Custom…'; f.term.value = c.term; }
      }
      // the customer's usual term decides COD vs Term per-bag rates, and setting a
      // <select> in code fires no change event — reprice the lines by hand, or an
      // invoice keeps the wrong rate right up to saving
      onTermChange();
    };
    const custModal = document.getElementById('custModal');
    const renderCust = (q = '') => {
      const ql = q.toLowerCase();
      const arMap = window._saleData.arMap || {};
      const rows = window._saleData.customers.filter((c) =>
        !ql || c.customer.toLowerCase().includes(ql) ||
        String(c.store_farm || '').toLowerCase().includes(ql));
      document.getElementById('custList2').innerHTML = rows.length ? `
        <table><thead><tr><th>Customer</th><th>Address / Farm</th><th>Usual term</th>
          <th>Pricing</th><th style="text-align:right">Outstanding</th><th></th></tr></thead><tbody>
        ${rows.map((c, i) => {
          const bal = arMap[c.customer.trim().toUpperCase()] || 0;
          const tierLab = c.tier === 'cod' ? '<span class="badge green">COD dealer</span>'
            : c.tier === 'outright' ? '<span class="badge green">Outright dealer</span>' : 'Retail';
          return `<tr>
            <td><b>${c.customer}</b></td>
            <td>${c.store_farm ?? ''}</td>
            <td>${c.term ?? ''}</td>
            <td>${tierLab}</td>
            <td class="num">${bal > 0 ? `<span class="badge amber">${(window._currency || '') + bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>` : '—'}</td>
            <td><button type="button" class="mini add" data-pickcust="${i}">Select</button></td>
          </tr>`;
        }).join('')}</tbody></table>` : '<p class="empty">No customers match — type the name directly to create a new one.</p>';
      document.querySelectorAll('[data-pickcust]').forEach((b) => b.onclick = () => {
        applyCustomer(rows[Number(b.dataset.pickcust)]);
        custModal.classList.add('hidden');
      });
    };
    document.getElementById('openCust').onclick = () => {
      custModal.classList.remove('hidden');
      renderCust(document.getElementById('custSearch').value);
      document.getElementById('custSearch').focus();
    };
    document.getElementById('custClose').onclick = () => custModal.classList.add('hidden');
    custModal.onclick = (e) => { if (e.target === custModal) custModal.classList.add('hidden'); };
    document.getElementById('custSearch').oninput = (e) => renderCust(e.target.value);
    // typing an existing name manually still autofills details
    document.querySelector('[name=customer]').addEventListener('change', (e) => {
      const c = window._saleData.customers.find((x) =>
        x.customer.trim().toUpperCase() === e.target.value.trim().toUpperCase());
      if (c) applyCustomer(c);
    });

    // ---- live uniqueness checks (values stay hand-typed) ----
    const uniqueCheck = (input, endpoint, out) => {
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        const v = input.value.trim();
        if (!v) { out.textContent = ''; return; }
        t = setTimeout(async () => {
          try {
            const r = await api.get(`${endpoint}?no=${encodeURIComponent(v)}`);
            out.textContent = r.exists ? '✗ already used — must be unique' : '✓ available';
            out.className = r.exists ? 'checkbad' : 'checkok';
          } catch {}
        }, 350);
      });
    };
    uniqueCheck(document.querySelector('[name=sales_no]'),
      '/api/check/invoice' + (window._editSale ? `?not=${window._editSale.id}` : ''),
      document.getElementById('invCheck'));
    uniqueCheck(document.querySelector('[name=or_no]'), '/api/check/or', document.getElementById('orCheck'));
    ['tax_pct', 'discount_pct', 'discount_amt'].forEach((n) =>
      document.querySelector(`[name=${n}]`).addEventListener('input', renderLines));
    document.getElementById('saleForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      // resolve term: preset value, or the custom text when "Custom…" is chosen
      f.term = f.term_preset === 'Custom…' ? (f.term || 'Custom') : f.term_preset;
      delete f.term_preset;
      const subtotal = lines.reduce((a, l) => a + l.qty * l.unit_price, 0);          // unit-cost total
      const lineDisc = lines.reduce((a, l) => a + l.qty * (l.discount || 0), 0);
      const tax = subtotal * (Number(f.tax_pct) || 0) / 100;
      const disc = subtotal * (Number(f.discount_pct) || 0) / 100 + (Number(f.discount_amt) || 0);
      try {
        if (window._editSale) {
          // full edit — version-checked so a concurrent edit gets a clear 409, not overwritten
          const upd = await api.put(`/api/sales/${window._editSale.id}/full`, {
            sales_no: f.sales_no, date: f.date, customer: f.customer,
            store_farm: f.store_farm || null, term: f.term || null,
            due_date: f.due_date || null, contact_no: f.contact_no || null,
            account_id: f.account_id || null, sales_rep_id: f.sales_rep_id || null,
            billed_by_marketing: !!document.getElementById('mktBilled')?.checked,
            subtotal, tax_pct: Number(f.tax_pct) || 0, tax_amount: tax,
            discount_pct: Number(f.discount_pct) || 0, discount: lineDisc + disc,
            total: subtotal + tax - lineDisc - disc,
            version: window._editSale.version,
            items: lines,
          });
          window._editSale = null;
          document.getElementById('newSaleModal')?.classList.add('hidden');
          if (upd && upd.warnings && upd.warnings.length) alert('Sale updated.\n\n' + upd.warnings.join('\n'));
          else alert('Sale updated.');
          show('sales');
          return;
        }
        const res = await api.post('/api/sales', {
          ...f,
          due_date: f.due_date || null,
          account_id: f.account_id || null, sales_rep_id: f.sales_rep_id || null,
          // a checkbox absent from the form data reads as unchecked, never "on"
          billed_by_marketing: !!document.getElementById('mktBilled')?.checked,
          subtotal, tax_amount: tax, discount: lineDisc + disc,
          total: subtotal + tax - lineDisc - disc,
          amount_paid: Number(f.amount_paid) || 0,
          status: 'Completed',
          items: lines,
        });
        // remember the tier used, so this customer's discount auto-applies next time
        if (f.customer?.trim()) {
          try {
            await api.put('/api/customer_tier', {
              customer: f.customer.trim(), tier: f.price_tier || 'srp',
            });
          } catch {}
        }
        if (res && res.warnings && res.warnings.length) {
          alert('Sale saved.\n\n' + res.warnings.join('\n'));
        } else alert('Sale saved.');
        show('sales');
      } catch (err) {
        if (err.queued) { show('sales'); return; }   // stored offline — will sync
        alert('Error: ' + err.message);
      }
    };
  }

  if (view === 'matrix') {
    const apply = document.getElementById('mxApply');
    if (apply) {
      apply.onclick = () => {
        window._matrixRange = {
          from: document.getElementById('mxFrom').value,
          to: document.getElementById('mxTo').value,
        };
        show('matrix');
      };
      document.getElementById('mxClear').onclick = () => {
        window._matrixRange = { from: '', to: '' };
        show('matrix');
      };
    }
    document.querySelectorAll('[data-pricelist]').forEach((b) =>
      b.onclick = () => printPriceList(b.dataset.pricelist));
    // remember which report sections are open on this device
    document.querySelectorAll('details.collapse[data-clp]').forEach((d) => d.ontoggle = () => {
      let st = {};
      try { st = JSON.parse(localStorage.getItem('ea_matrix_clp') || '{}'); } catch {}
      st[d.dataset.clp] = d.open;
      localStorage.setItem('ea_matrix_clp', JSON.stringify(st));
    });
    const dc = document.getElementById('draftClaimBtn');
    if (dc) dc.onclick = async () => {
      const p = window._matrixPromo || { qty: 0, cost: 0 };
      if (!p.qty) return alert('No promo free goods in the selected range — nothing to claim yet.');
      if (!confirm(`Draft a claim to URC for ${p.qty} promo unit(s), ${p.cost.toFixed(2)}?`)) return;
      try {
        await api.post('/api/claims', {
          claim_type: 'Promo free goods', period_from: p.from, period_to: p.to,
          qty: p.qty, amount: p.cost, status: 'Draft',
          notes: 'Auto-drafted from the Matrix Report promo tally',
        });
        show('matrix');
      } catch (e) { alert('Error: ' + e.message); }
    };
  }

  if (view === 'visits') {
    // store picker: searchable modal table (same pattern as the customer picker),
    // typing a brand-new store name directly still works
    const vsModal = document.getElementById('visitStoreModal');
    if (vsModal) {
      const renderStores = (qq = '') => {
        const ql = qq.toLowerCase();
        const rows = (window._visitCustomers || []).filter((c) =>
          !ql || c.name.toLowerCase().includes(ql)
          || String(c.address || '').toLowerCase().includes(ql));
        document.getElementById('visitStoreList').innerHTML = rows.length ? `
          <table><thead><tr><th>Store / customer</th><th>Address</th><th>Contact</th>
            <th>Pricing</th><th></th></tr></thead><tbody>
          ${rows.map((c, i) => `<tr>
            <td><b>${c.name}</b></td>
            <td>${c.address ?? ''}</td>
            <td>${c.contact_no ?? ''}</td>
            <td>${c.tier === 'cod' ? '<span class="badge green">COD dealer</span>'
                : c.tier === 'outright' ? '<span class="badge green">Outright dealer</span>' : 'Retail'}</td>
            <td><button type="button" class="mini add" data-pickstore="${i}">Select</button></td>
          </tr>`).join('')}</tbody></table>`
          : '<p class="empty">No match — close this and type the new store name directly.</p>';
        document.querySelectorAll('[data-pickstore]').forEach((b) => b.onclick = () => {
          document.querySelector('#visitForm [name=store_name]').value = rows[Number(b.dataset.pickstore)].name;
          vsModal.classList.add('hidden');
        });
      };
      document.getElementById('visitPick').onclick = () => {
        vsModal.classList.remove('hidden');
        renderStores(document.getElementById('visitStoreSearch').value);
        document.getElementById('visitStoreSearch').focus();
      };
      document.getElementById('visitStoreClose').onclick = () => vsModal.classList.add('hidden');
      vsModal.onclick = (e) => { if (e.target === vsModal) vsModal.classList.add('hidden'); };
      document.getElementById('visitStoreSearch').oninput = (e) => renderStores(e.target.value);
    }
    const vf = document.getElementById('visitForm');
    if (vf) vf.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(vf));
      // verification: live storefront photo, then geotag, then save
      const shot = await openCameraShot(`Store visit — ${f.store_name}`, { facing: 'environment' });
      if (shot === null) return;                    // user backed out
      let photo = null;
      if (shot === 'nocam') {
        if (!confirm('No camera available. Submit the visit without a photo? (admins will see "no photo")')) return;
      } else photo = shot;
      const send = async (coords) => {
        try {
          await api.post('/api/store_visits', {
            user_name: window._user.name, store_name: f.store_name.trim(), photo,
            q_order: f.q_order || null, q_products: f.q_products || null,
            q_remarks: f.q_remarks || null,
            lat: coords ? coords.latitude : null, lng: coords ? coords.longitude : null,
            accuracy: coords ? coords.accuracy : null,
          });
          alert('Visit recorded.');
          show('visits');
        } catch (err) {
          if (err.queued) { show('visits'); return; }
          alert('Error: ' + err.message);
        }
      };
      if (!navigator.geolocation) return send(null);
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords),
        () => {
          if (confirm('Submit without location? (GPS unavailable — admins will see "no location")')) send(null);
        },
        { enableHighAccuracy: true, timeout: 8000 });
    };
    document.querySelectorAll('[data-visitphoto]').forEach((b) => b.onclick = async () => {
      try {
        const { photo } = await api.get(`/api/store_visits/${b.dataset.visitphoto}/photo`);
        if (!photo) return alert('No photo on this visit.');
        const ov = document.createElement('div');
        ov.className = 'modal';
        ov.innerHTML = `<div class="modal-box" style="width:min(560px,96%)">
          <div class="modal-head"><h3 style="margin:0;flex:1">Store visit photo</h3>
            <button type="button" class="mini" id="svClose">Close</button></div>
          <div class="modal-body" style="padding:12px;text-align:center">
            <img src="${photo}" style="max-width:100%;border-radius:10px" alt="visit"></div></div>`;
        document.body.appendChild(ov);
        ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
        ov.querySelector('#svClose').onclick = () => ov.remove();
      } catch (err) { alert('Error: ' + err.message); }
    });
    document.querySelectorAll('[data-visitdel]').forEach((b) => b.onclick = async () => {
      if (!confirm('Delete this visit record?')) return;
      try { await api.del(`/api/store_visits/${b.dataset.visitdel}`); show('visits'); }
      catch (e) { alert('Error: ' + e.message); }
    });
  }

  if (view === 'monitoring') {
    const ap = document.getElementById('dtrApply');
    if (ap) {
      ap.onclick = () => {
        window._dtrRange = {
          from: document.getElementById('dtrFrom').value,
          to: document.getElementById('dtrTo').value,
        };
        show('monitoring');
      };
      document.getElementById('dtrMonth').onclick = () => {
        window._dtrRange = null;
        show('monitoring');
      };
    }
    document.querySelectorAll('[data-dtrprint]').forEach((b) =>
      b.onclick = () => printDTR(b.dataset.dtrprint));
    // create a payroll run: DTR pay + commission − manual deductions = net
    document.querySelectorAll('[data-payrun]').forEach((b) => b.onclick = () => {
      const s = window._dtrData.staff.find((x) => x.name === b.dataset.payrun);
      if (!s) return;
      document.getElementById('payrollModal')?.remove();
      const gross = s.salary + s.commission;
      const m = document.createElement('div');
      m.id = 'payrollModal';
      m.className = 'modal';
      m.innerHTML = `<div class="modal-box" style="width:min(560px,96%)">
        <div class="modal-head"><h3 style="margin:0;flex:1">Payroll run — ${s.name}</h3>
          <button type="button" class="mini" id="prClose">Close</button></div>
        <div class="modal-body" style="padding:16px">
          <p style="color:var(--ink-2);font-size:13px;margin-bottom:10px">
            Period ${window._dtrData.from} → ${window._dtrData.to} ·
            ${s.present} day(s) × ${s.rate}/day = <b>${s.salary.toFixed(2)}</b>
            &nbsp;+&nbsp; commission <b>${s.commission.toFixed(2)}</b></p>
          <form id="prForm" class="form" style="box-shadow:none;border:1px solid var(--border)">
            <div class="grid3">
              <label>SSS <input type="number" step="any" min="0" name="sss" value="0"></label>
              <label>PhilHealth <input type="number" step="any" min="0" name="philhealth" value="0"></label>
              <label>Pag-IBIG <input type="number" step="any" min="0" name="pagibig" value="0"></label>
              <label>Other deductions <input type="number" step="any" min="0" name="other_ded" value="0"></label>
              <label style="grid-column:1/-1">Notes <input name="notes"></label>
            </div>
            <div class="totals" id="prNet">NET PAY: <b>${gross.toFixed(2)}</b></div>
            <button type="submit" class="primary">Save payroll run</button>
          </form>
        </div></div>`;
      document.body.appendChild(m);
      m.onclick = (e) => { if (e.target === m) m.remove(); };
      document.getElementById('prClose').onclick = () => m.remove();
      const f = document.getElementById('prForm');
      const net = () => Math.round((gross
        - (Number(f.sss.value) || 0) - (Number(f.philhealth.value) || 0)
        - (Number(f.pagibig.value) || 0) - (Number(f.other_ded.value) || 0)) * 100) / 100;
      f.oninput = () => { document.getElementById('prNet').innerHTML = `NET PAY: <b>${net().toFixed(2)}</b>`; };
      f.onsubmit = async (e) => {
        e.preventDefault();
        try {
          await api.post('/api/payroll_runs', {
            user_name: s.name, period_from: window._dtrData.from, period_to: window._dtrData.to,
            days: s.present, hours: s.hoursTot, daily_rate: s.rate,
            gross_dtr: s.salary, commission: s.commission,
            sss: Number(f.sss.value) || 0, philhealth: Number(f.philhealth.value) || 0,
            pagibig: Number(f.pagibig.value) || 0, other_ded: Number(f.other_ded.value) || 0,
            net: net(), notes: f.notes.value || null,
          });
          m.remove();
          show('monitoring');
        } catch (err) { alert('Error: ' + err.message); }
      };
    });
    document.querySelectorAll('[data-payslip]').forEach((b) =>
      b.onclick = () => printPayslip(Number(b.dataset.payslip)));
    document.querySelectorAll('[data-payrundel]').forEach((b) => b.onclick = async () => {
      if (!confirm('Delete this payroll run record?')) return;
      try { await api.del(`/api/payroll_runs/${b.dataset.payrundel}`); show('monitoring'); }
      catch (e) { alert('Error: ' + e.message); }
    });
    // admins adjust an employee's daily rate right on their DTR panel
    document.querySelectorAll('[data-dtrsave]').forEach((b) => b.onclick = async () => {
      const inp = document.querySelector(`[data-dtrrate="${b.dataset.dtrsave}"]`);
      const rate = Number(inp?.value);
      if (isNaN(rate) || rate < 0) return alert('Enter a valid daily rate.');
      try {
        await api.put(`/api/users/${b.dataset.dtrsave}`, { daily_rate: rate });
        show('monitoring');
      } catch (e) { alert('Error: ' + e.message); }
    });
  }

  if (view === 'receivables') {
    const sel = document.getElementById('arCustomer');
    if (sel) sel.onchange = () => { window._arCustomer = sel.value; show('receivables'); };
    const soa = document.getElementById('soaBtn');
    if (soa) soa.onclick = () => {
      const name = document.getElementById('arCustomer')?.selectedOptions[0]?.textContent;
      if (name) printSOA(name.trim());
    };
    // apply an advance onto one of that customer's open invoices
    document.querySelectorAll('[data-applyadv]').forEach((b) => b.onclick = async () => {
      const adv = (window._advances || []).find((a) => a.id === Number(b.dataset.applyadv));
      if (!adv) return;
      const remaining = Number(adv.amount) - Number(adv.applied);
      const sales = await api.get(`/api/sales?customer=${encodeURIComponent(adv.customer)}`);
      const open = sales.filter((s) => !String(s.status).toLowerCase().includes('cancel')
        && Number(s.total) - Number(s.amount_paid) > 0.005);
      if (!open.length) return alert(`No open invoices for ${adv.customer} — encode the sale first, then apply this advance.`);
      const pick = prompt(
        `Apply advance of ${remaining.toFixed(2)} from ${adv.customer}.\nOpen invoices:\n`
        + open.map((s, i) => `${i + 1}. ${s.sales_no} — balance ${(Number(s.total) - Number(s.amount_paid)).toFixed(2)}`).join('\n')
        + `\n\nEnter the number of the invoice to pay:`, '1');
      if (pick === null) return;
      const s = open[Number(pick) - 1];
      if (!s) return alert('Invalid choice.');
      const bal = Number(s.total) - Number(s.amount_paid);
      const amtStr = prompt(`Amount to apply to ${s.sales_no} (balance ${bal.toFixed(2)}, advance remaining ${remaining.toFixed(2)}):`,
        Math.min(bal, remaining).toFixed(2));
      if (amtStr === null) return;
      const amt = Number(amtStr);
      if (!(amt > 0) || amt > remaining + 0.005) return alert('Invalid amount.');
      try {
        await api.post(`/api/advances/${adv.id}/apply`, { sale_id: s.id, amount: amt });
        show('receivables');
      } catch (e) { alert('Error: ' + e.message); }
    });
  }

  if (view === 'payments') {
    const pf = document.getElementById('payForm');
    if (pf) {
      pf.onsubmit = async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(pf));
        try {
          await api.post(`/api/sales/${f.sale_id}/payments`, {
            date: f.date, amount: Number(f.amount),
            account_id: f.account_id || null, or_no: f.or_no || null, notes: f.notes || null,
            payer_name: f.payer_name || null, signature: f.signature || null,
            cheque_status: f.cheque_status || null,
          });
          show('payments');
        } catch (err) {
          if (err.queued) { show('payments'); return; }
          alert('Error: ' + err.message);
        }
      };
      // OR No. live uniqueness check
      // payment on account: an amount, not an invoice
      const apf = document.getElementById('acctPayForm');
      if (apf) apf.onsubmit = async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(apf));
        const out = document.getElementById('acctPayResult');
        try {
          const r = await api.post('/api/customers/payment', {
            customer: f.customer, date: f.date, amount: Number(f.amount),
            account_id: f.account_id || null, or_no: f.or_no || null,
            notes: f.notes || null, cheque_status: f.cheque_status || null,
          });
          // show where the money went before the view reloads
          const rows = r.applied.map((a) => `<li>${a.sales_no} — ${fmt(a.amount)}`
            + (a.still_open > 0.005 ? ` (${fmt(a.still_open)} still open)` : ' — settled') + '</li>').join('');
          out.innerHTML = `<div class="notice ok"><strong>${fmt(r.received)} received from ${esc(r.customer)}.</strong>`
            + (rows ? `<ul style="margin:6px 0 0 18px">${rows}</ul>` : '')
            + (r.held_as_credit > 0.005
                ? `<p style="margin:6px 0 0">${fmt(r.held_as_credit)} held as credit on the account —
                   no open invoice left to apply it to.</p>` : '')
            + '</div>';
          setTimeout(() => show('payments'), 2500);
        } catch (err) {
          if (err.queued) { show('payments'); return; }
          out.innerHTML = `<div class="notice bad">${esc(err.message)}</div>`;
        }
      };

      const orIn = pf.querySelector('[name=or_no]'), orOut = document.getElementById('orCheck');
      let t;
      orIn.addEventListener('input', () => {
        clearTimeout(t);
        const v = orIn.value.trim();
        if (!v) { orOut.textContent = ''; return; }
        t = setTimeout(async () => {
          try {
            const r = await api.get(`/api/check/or?no=${encodeURIComponent(v)}`);
            orOut.textContent = r.exists ? '✗ already used — must be unique' : '✓ available';
            orOut.className = r.exists ? 'checkbad' : 'checkok';
          } catch {}
        }, 350);
      });
      // signature capture for payments
      const paySigPreview = document.getElementById('paySigPreview');
      const paySigCapture = document.getElementById('paySigCapture');
      const paySigClear = document.getElementById('paySigClear');
      const sigInput = pf.querySelector('[name=signature]');
      const renderPaySig = () => {
        paySigPreview.innerHTML = sigInput.value
          ? `<img src="${sigInput.value}" style="height:44px" alt="signature"><small style="color:var(--ink-2)">${pf.payer_name.value || ''}</small>`
          : '<small style="color:var(--ink-2)">No signature captured yet.</small>';
      };
      if (paySigCapture) paySigCapture.onclick = async () => {
        const r = await openSignPad({ title: 'Payment — payer signs here', name: pf.payer_name.value, askName: true });
        if (!r) return;
        if (r.name) pf.payer_name.value = r.name;
        if (r.signature) sigInput.value = r.signature;
        renderPaySig();
      };
      if (paySigClear) paySigClear.onclick = () => { sigInput.value = ''; renderPaySig(); };
      renderPaySig();
    }
    // edit-payment modal (add the OR No. from the booklet later, fix date/amount)
    const pem = document.getElementById('payEditModal'), pef = document.getElementById('payEditForm');
    if (pem && pef) {
      document.getElementById('payEditClose').onclick = () => pem.classList.add('hidden');
      pem.onclick = (e) => { if (e.target === pem) pem.classList.add('hidden'); };
      const eIn = pef.querySelector('[name=or_no]'), eOut = document.getElementById('orEditCheck');
      let te;
      eIn.addEventListener('input', () => {
        clearTimeout(te);
        const v = eIn.value.trim();
        if (!v) { eOut.textContent = ''; return; }
        te = setTimeout(async () => {
          try {
            const r = await api.get(`/api/check/or?no=${encodeURIComponent(v)}&not=${pef.id.value}`);
            eOut.textContent = r.exists ? '✗ already used — must be unique' : '✓ available';
            eOut.className = r.exists ? 'checkbad' : 'checkok';
          } catch {}
        }, 350);
      });
      pef.onsubmit = async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(pef));
        try {
          await api.put(`/api/payments/${f.id}`, {
            date: f.date, amount: Number(f.amount),
            account_id: f.account_id || null, or_no: f.or_no || null, notes: f.notes || null,
            payer_name: f.payer_name || null, signature: f.signature || null,
            cheque_status: f.cheque_status || null,
            version: pef.dataset.version ? Number(pef.dataset.version) : undefined,
          });
          pem.classList.add('hidden');
          show('payments');
        } catch (err) { alert('Error: ' + err.message); }
      };
      // edit modal signature capture
      const payEditSigPreview = document.getElementById('payEditSigPreview');
      const payEditSigCapture = document.getElementById('payEditSigCapture');
      const payEditSigClear = document.getElementById('payEditSigClear');
      const pefSigInput = pef.querySelector('[name=signature]');
      const renderPayEditSig = () => {
        payEditSigPreview.innerHTML = pefSigInput.value
          ? `<img src="${pefSigInput.value}" style="height:44px" alt="signature"><small style="color:var(--ink-2)">${pef.payer_name.value || ''}</small>`
          : '<small style="color:var(--ink-2)">No signature captured yet.</small>';
      };
      if (payEditSigCapture) payEditSigCapture.onclick = async () => {
        const r = await openSignPad({ title: 'Payment — payer signs here', name: pef.payer_name.value, askName: true });
        if (!r) return;
        if (r.name) pef.payer_name.value = r.name;
        if (r.signature) pefSigInput.value = r.signature;
        renderPayEditSig();
      };
      if (payEditSigClear) payEditSigClear.onclick = () => { pefSigInput.value = ''; renderPayEditSig(); };
      renderPayEditSig();
    }
  }

  if (view === 'dashboard') {
    const rf = document.getElementById('rangeForm');
    if (rf) rf.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(rf));
      if (f.from && f.to) { window._dashRange = { from: f.from, to: f.to }; show('dashboard'); }
    };
    const rc = document.getElementById('rangeClear');
    if (rc) rc.onclick = () => { window._dashRange = null; show('dashboard'); };
  }

  if (view === 'accounts') {
    const xf = document.getElementById('xferForm');
    if (xf) xf.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(xf));
      if (f.from_account_id === f.to_account_id) return alert('Choose two different accounts.');
      const bal = window._acctBalances || [];
      const src = bal.find((b) => String(b.id) === f.from_account_id);
      const dst = bal.find((b) => String(b.id) === f.to_account_id);
      const amt = Number(f.amount);
      if (src && Number(src.current_balance) < amt
        && !confirm(`${src.name} only has ${Number(src.current_balance).toFixed(2)} — this transfer takes it negative. Continue?`)) return;
      if (!confirm(`Transfer ${amt.toFixed(2)} from ${src?.name} to ${dst?.name}?`)) return;
      try {
        await api.post('/api/transfer', {
          from_account_id: Number(f.from_account_id), to_account_id: Number(f.to_account_id),
          amount: amt, date: f.date || null, description: f.description || null,
        });
        show('accounts');
      } catch (err) { alert('Error: ' + err.message); }
    };
  }

  if (view === 'reports') {
    const da = document.getElementById('dailyApply');
    if (da) {
      da.onclick = () => { window._dailyDate = document.getElementById('dailyDate').value; show('reports'); };
      document.getElementById('dailyToday').onclick = () => { window._dailyDate = null; show('reports'); };
      document.getElementById('sbExport').onclick = () => exportSalesBookCSV(
        document.getElementById('sbFrom').value, document.getElementById('sbTo').value);
    }
    const tf = document.getElementById('taxYearForm');
    if (tf) tf.onsubmit = (e) => {
      e.preventDefault();
      window._taxYear = Number(new FormData(tf).get('year'));
      show('reports');
    };
  }

  if (view === 'invdash') {
    const st = window._invdash;
    const wireForm = (id, fn) => {
      const f = document.getElementById(id);
      if (f) f.onsubmit = (e) => { e.preventDefault(); fn(Object.fromEntries(new FormData(f))); show('invdash'); };
    };
    wireForm('yearForm', (f) => st.year = Number(f.year));
    wireForm('monthForm', (f) => st.month = Number(f.month));
    wireForm('ssForm', (f) => st.ss = f);
    wireForm('piForm', (f) => st.pi = f);
    wireForm('pvForm', (f) => st.pv = f);

    // ---- category price-matrix modal: EXACT column layouts from the URC file ----
    const catModal = document.getElementById('catModal');
    const N = (v, d = 2) => (v == null || isNaN(v)) ? '' :
      Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
    const sum = (o) => Object.values(o || {}).reduce((a, b) => a + Number(b), 0);

    // GameFowl sheet: R4-R6 headers, verbatim
    const layoutGamefowl = {
      cols: ['Gamefowl Feeds', 'EX DAVAO Plant Price', 'Distibutor Discount', 'Pick up Discount',
             'BDF Discount', 'Manpower Discount', 'PRICE BEFORE CBD', 'PBD Discount  5%',
             'NET PRICE / Capital', 'Distributor Income', 'Add FTH'],
      row: (i, b) => {
        const d = b?.discounts || {};
        const before = b?.ex_plant != null ? b.ex_plant - sum(d) : null;
        const pbd = before != null ? before * (b.pbd_rate ?? 0.05) : null;
        return [i.name, N(b?.ex_plant), N(d.distributor, 0), N(d.pickup, 0), N(d.bdf, 0),
                N(d.manpower, 1), N(before), N(pbd), N(i.cost),
                N(b?.distributor_income, 0), N(b?.fth, 0)];
      },
    };
    // Hogs sheet: R5-R6 headers, verbatim (G column has no header in the sheet)
    const layoutHogs = {
      cols: ['', 'Ex-Bukidnon Plant Price', 'Distibutor Discount', 'Pick up Discount',
             "Business Dev't Discount", 'Manpower Discount', '', 'Payment Before Delivery Discount',
             'NET PRICE / Capital', 'Distributor Income'],
      row: (i, b) => {
        const d = b?.discounts || {};
        const before = b?.ex_plant != null ? b.ex_plant - sum(d) : null;
        return [i.name, N(b?.ex_plant), N(d.distributor, 0), N(d.pickup, 0), N(d.bdf, 0),
                N(d.manpower, 0), N(before), b?.pbd_rate != null ? String(b.pbd_rate) : '',
                N(i.cost), N(b?.distributor_income, 0)];
      },
    };
    // Pets sheet: R3-R5 headers, verbatim
    const layoutPets = {
      cols: ['TOPBREED PET FOOD', 'EX DAVAO Plant Price', 'OD Discount', 'Pick up', 'BDF',
             'Manpower', 'Special', 'PRICE BEFORE CBD', 'PBD Discount  5%', 'VAT 0.12',
             'NET PRICE / Capital'],
      row: (i, b) => {
        const d = b?.discounts || {};
        const before = b?.ex_plant != null ? b.ex_plant - sum(d) : null;
        const pbd = before != null ? before * (b.pbd_rate ?? 0.05) : null;
        const vat = (before != null && pbd != null) ? (before - pbd) * 0.12 : null;
        return [i.name, N(b?.ex_plant), N(d.od, 0), N(d.pickup, 2), N(d.bdf, 0), N(d.manpower, 0),
                N(d.special, 0), N(before), N(pbd), N(vat), N(i.cost)];
      },
    };
    // RobiChem sheet: R1-R2 headers, verbatim
    const layoutRobi = {
      cols: ['PRODUCT CODE', 'Packaging', 'Invoice Price', 'DISCOUNT LESS 20%', 'LESS 10%',
             'LESS 20%', 'NET PRICE (VAT - EX)', 'NET PRICE + 12% vat', 'Deal  (URC - DISTRIBUTOR)',
             'Distributor SRP', 'OUTRIGHT 0.15', 'COD 0.05', 'Deal (distributor - dealer)'],
      row: (i, b) => {
        const inv = b?.invoice;
        const srp = i.sales_price;
        const outright = (srp != null && Number(i.outright_rate)) ? srp * i.outright_rate : null;
        const cod = (srp != null && outright != null && Number(i.cod_rate)) ? (srp - outright) * i.cod_rate : null;
        let d1 = null, d2 = null, d3 = null, netEx = null;
        const m = b?.model || 'standard';
        if (inv != null) {
          if (m === 'scm') {                       // 10% volume · 20% pick-up · 5% PBD — straight off invoice
            d1 = inv * 0.1; d2 = inv * 0.2; d3 = inv * 0.05;
            netEx = inv - d1 - d2 - d3;
          } else if (m === 'wheatgerm') {          // 10% · 5% · pick-up pesos · 20%, no VAT
            const pick = Number(b.pickup_pesos) || 0;
            d1 = inv * 0.1; d2 = (inv - d1) * 0.05; d3 = (inv - d1 - d2 - pick) * 0.2;
            netEx = inv - d1 - d2 - d3 - pick;
          } else if (m === 'dealer') {             // peso Volume / PD / PBD
            d1 = Number(b.volume); d2 = Number(b.pd); d3 = Number(b.pbd_pesos);
            netEx = inv - d1 - d2 - d3;
          } else {                                 // standard 20/10/20
            d1 = inv * 0.2; d2 = (inv - d1) * 0.1; d3 = (inv - d1 - d2) * 0.2;
            netEx = inv - d1 - d2 - d3;
          }
        }
        return [i.name, b?.packaging ?? i.packaging ?? '', N(inv, 0), N(d1), N(d2), N(d3), N(netEx),
                N(i.cost), i.deal ?? '', N(srp), N(outright), N(cod), b?.dealer_deal ?? ''];
      },
    };
    const layoutFor = (cat) => {
      if (cat === 'Gamefowl') return layoutGamefowl;
      if (cat === 'Robichem') return layoutRobi;
      if (cat === 'Supreme Hogs' || cat === 'Premium Hogs' || cat === 'Stargain Hogs') return layoutHogs;
      return layoutPets;   // Pet Food / Pet Supplies / Pet Treats share the Pets sheet
    };

    const matrixTable = (L, items) => `
      <div class="tablewrap"><table>
        <thead><tr>${L.cols.map((c, ix) => `<th ${ix ? 'style="text-align:right"' : ''}>${c}</th>`).join('')}<th></th></tr></thead>
        <tbody>${items.map((i) => {
          const cells = L.row(i, i.price_breakdown);
          return `<tr>${cells.map((c, ix) => `<td class="${ix ? 'num' : ''}">${c}</td>`).join('')}
            <td><button type="button" class="mini" data-pricing="${i.id}"
              title="Edit this product's pricing — SRP, discounts, matrix build-up">Edit</button></td></tr>`;
        }).join('')}</tbody>
      </table></div>`;
    document.querySelectorAll('.catlink').forEach((a) => a.onclick = (e) => {
      e.preventDefault();
      const cat = a.dataset.cat;
      const items = (window._invItems || []).filter((i) => (i.category || '(none)') === cat);
      // items priced via a URC RobiChem section render with that layout,
      // exactly like the sheet keeps them in their own sub-table
      const robiFam = items.filter((i) => ['standard', 'scm', 'wheatgerm', 'dealer']
        .includes(i.price_breakdown && i.price_breakdown.model));
      const rest = items.filter((i) => !robiFam.includes(i));
      const L = layoutFor(cat);
      let html = '<p class="matrix-head">ELISHEN AGRIVANCE DISTRIBUTION — BUTUAN CITY</p>';
      if (cat === 'Robichem') html += matrixTable(layoutRobi, items);
      else {
        if (rest.length) html += matrixTable(L, rest);
        if (robiFam.length) html += matrixTable(layoutRobi, robiFam);
      }
      document.getElementById('catModalTitle').textContent = cat;
      document.getElementById('catModalBody').innerHTML = html;
      catModal.classList.remove('hidden');
    });
    document.getElementById('catModalClose').onclick = () => catModal.classList.add('hidden');
    catModal.onclick = (e) => { if (e.target === catModal) catModal.classList.add('hidden'); };
  }

  if (view === 'expenses') {
    // receipt proof: live camera capture only (same policy as attendance selfies)
    document.querySelectorAll('[data-expsnapreceipt]').forEach((b) => b.onclick = async () => {
      const shot = await openCameraShot('Snap the receipt', { facing: 'environment' });
      if (shot === null) return;
      if (shot === 'nocam') return alert('No camera found — receipts must be photographed live.');
      try {
        await api.put(`/api/expenses/${b.dataset.expsnapreceipt}`, { receipt: shot });
        show('expenses');
      } catch (e) { alert('Error: ' + e.message); }
    });
    document.querySelectorAll('[data-expviewreceipt]').forEach((b) => b.onclick = async () => {
      try {
        const { receipt } = await api.get(`/api/expenses/${b.dataset.expviewreceipt}/receipt`);
        if (!receipt) return alert('No receipt on this expense.');
        const ov = document.createElement('div');
        ov.className = 'modal';
        ov.innerHTML = `<div class="modal-box" style="width:min(560px,96%)">
          <div class="modal-head"><h3 style="margin:0;flex:1">Expense receipt</h3>
            <button type="button" class="mini" id="erClose">Close</button></div>
          <div class="modal-body" style="padding:12px;text-align:center">
            <img src="${receipt}" style="max-width:100%;border-radius:10px" alt="receipt"></div></div>`;
        document.body.appendChild(ov);
        ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
        ov.querySelector('#erClose').onclick = () => ov.remove();
      } catch (e) { alert('Error: ' + e.message); }
    });
    const rb = document.getElementById('runRecurring');
    if (rb) rb.onclick = async () => {
      try {
        const r = await api.post('/api/recurring/run', {});
        alert(r.posted ? `${r.posted} recurring expense(s) posted.` : 'Nothing due — all recurring expenses are up to date.');
        show('expenses');
      } catch (e) { alert('Error: ' + e.message); }
    };
  }

  if (view === 'deliveries') {
    const btn = document.getElementById('drBulkDeliver');
    const counter = document.getElementById('drSelCount');
    const selected = () => [...document.querySelectorAll('.drsel:checked')].map((c) => Number(c.dataset.drsel));
    const refresh = () => {
      const n = selected().length;
      if (counter) counter.textContent = n ? `${n} selected` : '';
      if (btn) btn.disabled = n === 0;
      const all = document.getElementById('drSelAll');
      const boxes = document.querySelectorAll('.drsel');
      if (all && boxes.length) all.checked = n === boxes.length;
    };
    // delegated so selections keep working after repaging/filtering
    document.getElementById('main').addEventListener('change', (e) => {
      if (e.target.classList?.contains('drsel')) refresh();
      if (e.target.id === 'drSelAll') {
        document.querySelectorAll('.drsel').forEach((c) => c.checked = e.target.checked);
        refresh();
      }
    });
    if (btn) btn.onclick = async () => {
      const ids = selected();
      if (!ids.length) return;
      const received_by = document.getElementById('drBulkReceiver').value.trim() || null;
      if (!confirm(`Mark ${ids.length} delivery(ies) as Delivered${received_by ? ` — received by ${received_by}` : ''}?`)) return;
      const today = new Date().toISOString().slice(0, 10);
      try {
        for (const id of ids) {
          await api.put(`/api/deliveries/${id}`, {
            status: 'Delivered', received_by, delivered_date: today,
          });
        }
        show('deliveries');
      } catch (e) { alert('Error: ' + e.message); }
    };
  }

  if (view === 'team') {
    const sf = document.getElementById('srcForm');
    if (sf) sf.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(sf));
      window._src = { rep: f.rep, from: f.from, to: f.to };
      show('team');
    };
    const cs = document.getElementById('commSheetBtn');
    if (cs) cs.onclick = () => {
      const f = Object.fromEntries(new FormData(sf));
      printCommissionSheet(f.rep, f.from, f.to);
    };
    const bf = document.getElementById('budgetForm');
    if (bf) bf.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(bf));
      try { await api.put('/api/settings', { allocation_budget: f.allocation_budget || 0 }); show('team'); }
      catch (err) { alert('Error: ' + err.message); }
    };
  }

  if (view === 'inventory') {
    const pf = document.getElementById('produceForm');
    if (pf) pf.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(pf));
      try {
        const r = await api.post('/api/produce', {
          finished_item_id: Number(f.finished_item_id), qty: Number(f.qty), date: f.date });
        alert(`Produced: +${r.produced} finished, ${r.components_consumed} materials consumed (batch ${r.batch_no}).`);
        show(window._view);
      } catch (err) { alert('Error: ' + err.message); }
    };
  }

  if (view === 'stocktake') {
    const stock = window._stockRows;
    document.querySelectorAll('.stockcount').forEach((inp) => inp.oninput = () => {
      const i = Number(inp.dataset.ix);
      const adj = document.getElementById('adj' + i);
      if (inp.value === '') { adj.textContent = '—'; adj.className = 'num adjcell'; return; }
      const diff = Number(inp.value) - Number(stock[i].on_hand);
      adj.textContent = (diff > 0 ? '+' : '') + diff;
      adj.className = 'num adjcell ' + (diff > 0 ? 'pos' : diff < 0 ? 'neg' : '');
    });
    document.getElementById('stockTakeForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      // stock may have moved (sales, deliveries) while counting — the page never
      // auto-refreshes here. Recompute every adjustment against LIVE stock so the
      // final on-hand equals exactly what was counted, never a double deduction.
      let freshBy = {};
      try {
        const freshStock = await api.get('/api/reports/item_stock');
        freshBy = Object.fromEntries(freshStock.map((s) => [s.id, Number(s.on_hand)]));
      } catch (err) { alert('Cannot reach the server — try again.'); return; }
      const batches = [];
      const drifted = [];
      document.querySelectorAll('.stockcount').forEach((inp) => {
        if (inp.value === '') return;
        const i = Number(inp.dataset.ix);
        const live = freshBy[stock[i].id] ?? Number(stock[i].on_hand);
        if (live !== Number(stock[i].on_hand)) {
          drifted.push(`${stock[i].name}: shown ${Number(stock[i].on_hand)}, now ${live}`);
        }
        const diff = Number(inp.value) - live;
        if (diff !== 0) batches.push({ item_id: stock[i].id, qty: diff, name: stock[i].name });
      });
      if (drifted.length && !confirm(
        `Heads up — stock moved while you were counting (adjustments were recomputed against the LIVE numbers):\n\n`
        + drifted.join('\n') + '\n\nContinue saving?')) return;
      const minChanges = [];
      document.querySelectorAll('.minstock').forEach((inp) => {
        const i = Number(inp.dataset.ix);
        if (inp.value !== '' && Number(inp.value) !== Number(stock[i].minimum_stock)) {
          minChanges.push({ item_id: stock[i].id, minimum_stock: Number(inp.value) });
        }
      });
      if (!batches.length && !minChanges.length) { alert('No changes to save.'); return; }
      if (!confirm(`Save ${batches.length} count adjustment(s) and ${minChanges.length} minimum-stock change(s)?`)) return;
      try {
        for (const b of batches) {
          await api.post('/api/manual_inventory', {
            date: f.date, batch_no: f.batch_no, item_id: b.item_id, qty: b.qty,
            notes: 'Stock take adjustment',
          });
        }
        for (const m of minChanges) {
          await api.put(`/api/items/${m.item_id}`, { minimum_stock: m.minimum_stock });
        }
        alert(`Saved: ${batches.length} adjustment(s), ${minChanges.length} minimum(s) updated.`);
        show(window._view);
      } catch (err) { alert('Error: ' + err.message); }
    };
  }

  if (view === 'settings') {
    // one-click account disable/enable (never your own logged-in account)
    document.querySelectorAll('[data-usertoggle]').forEach((b) => b.onclick = async () => {
      const id = Number(b.dataset.usertoggle);
      const on = b.dataset.on === 'true';
      if (on && window._user && id === window._user.id)
        return alert('You cannot disable your own account while logged in.');
      if (on && !confirm('Disable this account? They will no longer be able to log in.')) return;
      try { await api.put(`/api/users/${id}`, { active: !on }); show('settings'); }
      catch (e) { alert('Error: ' + e.message); }
    });
    document.getElementById('settingsForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const apiBase = document.getElementById('apiBase').value.trim();
      if (apiBase && apiBase !== window.API_BASE) {
        localStorage.setItem('api_base', apiBase);
        window.API_BASE = apiBase;
      }
      delete f.apiBase;
      try { await api.put('/api/settings', f); alert('Saved.'); }
      catch (err) { alert('Error: ' + err.message); }
    };
  }
}

// ---- per-item Pricing editor (Inventory) — category-specific discount models ----
function pricingModel(item) {
  const b = item.price_breakdown || {};
  // explicit model wins — merged items (e.g. Shampooch under Pet Supplies) keep their URC cascade
  if (['standard', 'scm', 'wheatgerm', 'dealer'].includes(b.model)) return 'robichem';
  if (item.category === 'Robichem' || b.less) return 'robichem';
  if (['Pet Food', 'Pet Supplies', 'Pet Treats'].includes(item.category) ||
      (b.discounts && 'special' in b.discounts)) return 'pets';
  return 'feeds';
}

function openPricingEditor(id) {
  // items come from whichever page is active: Inventory's CRUD rows, or the
  // Inventory Dashboard's merged records (full breakdowns) when editing there
  const pool = window._view === 'invdash'
    ? (window._invItems || [])
    : ((window._crudRows && window._crudRows.items) || window._invItems || []);
  const item = pool.find((r) => r.id === id);
  if (!item) return;
  const b = item.price_breakdown || {};
  const model = pricingModel(item);
  const modal = document.getElementById('priceModal');
  const body = document.getElementById('priceModalBody');
  document.getElementById('priceModalTitle').textContent = `${item.name} — pricing (${model})`;
  const F = (id_, label, val, step = 'any') =>
    `<label>${label} <input type="number" step="${step}" id="${id_}" value="${val ?? ''}"></label>`;

  if (model === 'robichem') {
    // four sub-models straight from the sheet's sections
    const sub = b.model || 'standard';
    const finishSave = async (capital, srp, patch) => {
      try {
        await api.put(`/api/items/${id}`, {
          cost: Math.round(capital * 10000) / 10000,
          sales_price: srp != null ? Math.round(srp * 10000) / 10000 : null,
          price_breakdown: { ...b, ...patch },
        });
        modal.classList.add('hidden');
        show(window._view);
      } catch (e) { alert('Error: ' + e.message); }
    };
    const preview = (net, capital, srp) => {
      const outright = srp != null ? srp * (Number(item.outright_rate) || 0) : null;
      const cod = srp != null ? (srp - outright) * (Number(item.cod_rate) || 0) : null;
      pPreview.innerHTML = `NET (VAT-ex): <b>${net.toFixed(2)}</b> · Capital: <b>${capital.toFixed(2)}</b>` +
        (srp != null ? ` · SRP: <b>${srp.toFixed(2)}</b> · Outright: <b>${(srp - outright).toFixed(2)}</b> ·
         COD dealer: <b>${(srp - outright - cod).toFixed(2)}</b> · Profit/unit: <b>${(srp - capital).toFixed(2)}</b>`
        : ' · <i>no SRP in the URC price list — set a markup to create one</i>');
    };

    if (sub === 'dealer') {
      // Dealers Discount section: peso Volume / PD / PBD, +12% VAT, SRP markup
      body.innerHTML = `<div class="form"><div class="grid3">
          ${F('pInv', 'Invoice Price (Ex-Luzon plant)', b.invoice)}
          ${F('pVol', 'Volume Discount (pesos)', b.volume)}
          ${F('pPd', 'PD (pesos)', b.pd)}
          ${F('pPbd', 'PBD 5% (pesos)', b.pbd_pesos)}
          <label>+12% VAT <input type="checkbox" id="pVat" ${b.vat !== 'none' ? 'checked' : ''}></label>
          ${F('pMk', 'SRP markup (1.4 = +40%)', b.srp_markup ?? 1.4)}
        </div><div class="totals" id="pPreview"></div>
        <button type="button" class="primary" id="pSave">Save pricing</button></div>`;
      const calc = () => {
        const net = (Number(pInv.value) || 0) - (Number(pVol.value) || 0) - (Number(pPd.value) || 0) - (Number(pPbd.value) || 0);
        const capital = net * (pVat.checked ? 1.12 : 1);
        const srp = capital * (Number(pMk.value) || 1);
        preview(net, capital, srp);
        return { capital, srp };
      };
      body.querySelectorAll('input').forEach((i) => i.oninput = calc); calc();
      pSave.onclick = () => { const { capital, srp } = calc();
        finishSave(capital, srp, { invoice: Number(pInv.value), volume: Number(pVol.value),
          pd: Number(pPd.value), pbd_pesos: Number(pPbd.value),
          vat: pVat.checked ? 'add_12' : 'none', srp_markup: Number(pMk.value) }); };
    } else if (sub === 'wheatgerm') {
      // Wheat Germ section: 10% → 5% → pick-up pesos → 20%, NO VAT
      body.innerHTML = `<div class="form"><div class="grid3">
          ${F('pInv', 'Invoice Price', b.invoice)}
          ${F('pPick', 'Pick-up (pesos)', b.pickup_pesos ?? 0)}
          ${F('pMk', 'SRP markup (1.4 = +40%)', b.srp_markup ?? 1.4)}
        </div>
        <p class="empty">Cascade per URC sheet: less 10%, less 5%, less pick-up, less 20% — no VAT.</p>
        <div class="totals" id="pPreview"></div>
        <button type="button" class="primary" id="pSave">Save pricing</button></div>`;
      const calc = () => {
        const inv = Number(pInv.value) || 0, pick = Number(pPick.value) || 0;
        const d1 = inv * 0.1, d2 = (inv - d1) * 0.05, d3 = (inv - d1 - d2 - pick) * 0.2;
        const capital = inv - d1 - d2 - d3 - pick;
        const srp = capital * (Number(pMk.value) || 1);
        preview(capital, capital, srp);
        return { capital, srp };
      };
      body.querySelectorAll('input').forEach((i) => i.oninput = calc); calc();
      pSave.onclick = () => { const { capital, srp } = calc();
        finishSave(capital, srp, { invoice: Number(pInv.value),
          pickup_pesos: Number(pPick.value), srp_markup: Number(pMk.value) }); };
    } else {
      // standard (20/10/20) and SCM (10% volume / 20% pick-up / 5% PBD) — % cascades
      const defaults = sub === 'scm' ? [0.1, 0.2, 0.05] : [0.2, 0.1, 0.2];
      const labels = b.labels || (sub === 'scm'
        ? ['Volume discount 10%', 'Pick-up 20%', 'PBD 5%']
        : ['Less 20% (Distributor)', 'Less 10% (Volume)', 'Less 20% (Pick-up)']);
      const less = Array.isArray(b.less) && typeof b.less[0] === 'number' ? b.less : defaults;
      body.innerHTML = `<div class="form"><div class="grid3">
          ${F('pInv', 'Invoice Price (Ex-Plant)', b.invoice)}
          ${F('pL1', labels[0] + ' (rate)', less[0])}
          ${F('pL2', labels[1] + ' (rate)', less[1])}
          ${F('pL3', labels[2] + ' (rate)', less[2])}
          <label>+12% VAT <input type="checkbox" id="pVat" ${b.vat !== 'none' ? 'checked' : ''}></label>
          ${F('pMk', 'SRP markup (blank = no SRP)', b.srp_markup ?? '')}
        </div><div class="totals" id="pPreview"></div>
        <button type="button" class="primary" id="pSave">Save pricing</button></div>`;
      const calc = () => {
        const inv = Number(pInv.value) || 0;
        // per the sheet: standard section COMPOUNDS the discounts;
        // SCM section takes each percentage straight off the invoice
        const net = sub === 'scm'
          ? inv * (1 - Number(pL1.value) - Number(pL2.value) - Number(pL3.value))
          : inv * (1 - Number(pL1.value)) * (1 - Number(pL2.value)) * (1 - Number(pL3.value));
        const capital = net * (pVat.checked ? 1.12 : 1);
        const mk = Number(pMk.value);
        const srp = mk > 0 ? capital * mk : null;
        preview(net, capital, srp);
        return { capital, srp };
      };
      body.querySelectorAll('input').forEach((i) => i.oninput = calc); calc();
      pSave.onclick = () => { const { capital, srp } = calc();
        finishSave(capital, srp, { invoice: Number(pInv.value),
          less: [Number(pL1.value), Number(pL2.value), Number(pL3.value)],
          vat: pVat.checked ? 'add_12' : 'none',
          srp_markup: Number(pMk.value) > 0 ? Number(pMk.value) : undefined }); };
    }
  } else {
    const d = b.discounts || {};
    const isPets = model === 'pets';
    body.innerHTML = `<div class="form">
      <div class="grid3">
        ${F('pEx', 'Ex-Plant Price', b.ex_plant)}
        ${isPets ? F('pOD', 'OD Discount', d.od) : F('pDist', 'Distributor Discount', d.distributor)}
        ${F('pPick', 'Pick up Discount', d.pickup)}
        ${F('pBdf', isPets ? 'BDF' : "BDF / Business Dev't Discount", d.bdf)}
        ${F('pMan', 'Manpower Discount', d.manpower)}
        ${isPets ? F('pSpec', 'Special Discount', d.special) : ''}
        ${F('pPbd', 'PBD rate (0.05 = 5%)', b.pbd_rate ?? 0.05)}
        ${isPets ? `<label>+12% VAT added back <input type="checkbox" id="pVat" checked></label>` : ''}
      </div>
      <div class="totals" id="pPreview"></div>
      <button type="button" class="primary" id="pSave">Save pricing</button>
    </div>`;
    const calc = () => {
      const ex = Number(pEx.value) || 0;
      const ds = [isPets ? Number(pOD.value) : Number(pDist.value), Number(pPick.value),
                  Number(pBdf.value), Number(pMan.value), isPets ? Number(pSpec.value) : 0]
        .reduce((a, v) => a + (v || 0), 0);
      const before = ex - ds;
      const pbdAmt = before * (Number(pPbd.value) || 0);
      let capital = before - pbdAmt;
      if (isPets && pVat.checked) capital += (before - pbdAmt) * 0.12;
      const srp = Number(item.sales_price) || 0;
      pPreview.innerHTML = `Price before PBD: <b>${before.toFixed(2)}</b> · PBD: <b>${pbdAmt.toFixed(2)}</b> ·
        Capital: <b>${capital.toFixed(2)}</b>${srp ? ` · SRP: <b>${srp.toFixed(2)}</b> ·
        Profit/bag: <b>${(srp - capital).toFixed(2)}</b>` : ' · <i>set SRP on the item form</i>'}`;
      return { capital };
    };
    body.querySelectorAll('input').forEach((i) => i.oninput = calc);
    calc();
    pSave.onclick = async () => {
      const { capital } = calc();
      const discounts = isPets
        ? { od: Number(pOD.value), pickup: Number(pPick.value), bdf: Number(pBdf.value),
            manpower: Number(pMan.value), special: Number(pSpec.value) }
        : { distributor: Number(pDist.value), pickup: Number(pPick.value),
            bdf: Number(pBdf.value), manpower: Number(pMan.value) };
      try {
        await api.put(`/api/items/${id}`, {
          cost: Math.round(capital * 10000) / 10000,
          price_breakdown: { ...b, ex_plant: Number(pEx.value), discounts,
            pbd_rate: Number(pPbd.value), vat: isPets && pVat.checked ? 'add_12' : 'none' },
        });
        modal.classList.add('hidden');
        show(window._view);
      } catch (e) { alert('Error: ' + e.message); }
    };
  }
  modal.classList.remove('hidden');
  document.getElementById('priceModalClose').onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-pricing]');
  if (b) openPricingEditor(Number(b.dataset.pricing));
});

// Open a small modal to register a condition adjustment (Opened / Damaged)
function openConditionModal(itemId, status) {
  document.getElementById('condModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'condModal'; modal.className = 'modal';
  const today = new Date().toISOString().slice(0, 10);
  modal.innerHTML = `
    <div class="modal-box" style="width:min(420px,96%)">
      <div class="modal-head"><h3 style="margin:0;flex:1">Mark ${status} — item ${itemId}</h3>
        <button type="button" class="mini" id="condClose">Close</button></div>
      <div class="modal-body" style="padding:12px">
        <form id="condForm" class="form">
          <div class="grid2">
            <label>Date <input type="date" name="date" value="${today}" required></label>
            <label>Qty (use negative to reduce) <input type="number" step="any" name="qty" required></label>
          </div>
          <label>Notes <input name="notes" placeholder="Optional note"></label>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button type="submit" class="primary">Save</button>
            <button type="button" class="ghost" id="condCancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const form = modal.querySelector('#condForm');
  modal.querySelector('#condClose').onclick = () => modal.remove();
  modal.querySelector('#condCancel').onclick = () => modal.remove();
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const date = data.get('date');
    const qty = Number(data.get('qty')) || 0;
    const notes = `${status.toLowerCase()}:${data.get('notes') || ''}`;
    try {
      await api.post('/api/manual_inventory', {
        date, batch_no: `COND-${status}-${itemId}-${Date.now()}`, item_id: Number(itemId), qty, notes,
      });
      modal.remove();
      show(window._view);
    } catch (err) { alert('Error: ' + err.message); }
  };
}

document.addEventListener('click', (e) => {
  const pb = e.target.closest && e.target.closest('[data-mark-opened]');
  if (pb) { openConditionModal(pb.dataset.markOpened, 'Opened'); return; }
  const pd = e.target.closest && e.target.closest('[data-mark-damaged]');
  if (pd) { openConditionModal(pd.dataset.markDamaged, 'Damaged'); return; }
});

// ---- pagination controls (delegated once; re-renders only the one table) ----
function repageTable(key) {
  const wrap = document.querySelector(`[data-tbl="${CSS.escape(key)}"]`);
  if (!wrap || !window._tblCache[key]) return;
  wrap.outerHTML = tableShell(key);
  wireCrud();
  wireSalesActions();
}
document.addEventListener('change', (e) => {
  const d = e.target.dataset || {};
  if (d.pgsize) {
    const v = e.target.value;
    window._pg[d.pgsize].size = v === 'All' ? 'All' : Number(v);
    window._pg[d.pgsize].page = 0;
    repageTable(d.pgsize);
  } else if (d.pgfrom || d.pgto) {
    const key = d.pgfrom || d.pgto;
    window._pg[key][d.pgfrom ? 'from' : 'to'] = e.target.value;
    window._pg[key].page = 0;
    repageTable(key);
  }
});
// live text filter (debounced; keeps focus and caret through the re-render)
let _pgqTimer;
document.addEventListener('input', (e) => {
  const key = e.target.dataset && e.target.dataset.pgq;
  if (!key) return;
  clearTimeout(_pgqTimer);
  const v = e.target.value, caret = e.target.selectionStart;
  _pgqTimer = setTimeout(() => {
    window._pg[key].q = v;
    window._pg[key].page = 0;
    repageTable(key);
    const inp = document.querySelector(`[data-pgq="${CSS.escape(key)}"]`);
    if (inp) { inp.focus(); try { inp.setSelectionRange(caret, caret); } catch {} }
  }, 250);
});
document.addEventListener('click', (e) => {
  const t = e.target.closest && e.target.closest('[data-pgprev],[data-pgnext],[data-pgclear]');
  if (!t) return;
  const d = t.dataset;
  if (d.pgclear) {
    Object.assign(window._pg[d.pgclear], { q: '', from: '', to: '', page: 0 });
    repageTable(d.pgclear);
    return;
  }
  const key = d.pgprev || d.pgnext;
  window._pg[key].page += d.pgnext ? 1 : -1;
  repageTable(key);
});

// ---- purchase orders: stock follows the order as it is typed ----
// What is ordered is normally what arrives, so the received quantity mirrors the
// ordered one and the status jumps to Received — which is what makes the items
// count into inventory straight away instead of waiting for a separate Receive.
// Touching the received field by hand stops the mirroring for that entry, so a
// short or partial delivery is still recorded truthfully.
document.addEventListener('input', (e) => {
  const t = e.target;
  if (!t || !t.name || (t.name !== 'purchase_qty' && t.name !== 'received_qty')) return;
  const form = t.closest('form');
  if (!form) return;
  const ordered = form.querySelector('[name=purchase_qty]');
  const received = form.querySelector('[name=received_qty]');
  if (!ordered || !received) return;
  if (t === received) { received.dataset.touched = '1'; return; }
  if (received.dataset.touched === '1') return;
  received.value = ordered.value;
  const status = form.querySelector('[name=status]');
  if (status && Number(ordered.value) > 0 && [...status.options].some((o) => o.value === 'Received')) {
    status.value = 'Received';
  }
  const recvDate = form.querySelector('[name=received_date]');
  if (recvDate && !recvDate.value) {
    const od = form.querySelector('[name=order_date]');
    recvDate.value = (od && od.value) || new Date().toISOString().slice(0, 10);
  }
});

// ---- per-section print (delegated, so it works on re-renders and inside modals) ----
// Prints just the section the button sits in, on the same letterhead as the page
// report, and with every row of a paginated table rather than the visible page.
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-secprint]');
  if (!b) return;
  const section = b.closest('.tablewrap') || b.closest('.modal-body') || b.parentElement;
  if (typeof window.printSection !== 'function') return alert('Print module not loaded yet.');
  try { window.printSection(section); } catch (err) { alert('Print error: ' + (err.message || err)); }
});

document.querySelectorAll('#sidebar button[data-view]').forEach((b) =>
  b.onclick = () => {
    if (window._closeDrawer) window._closeDrawer();   // picking a page closes the drawer
    show(b.dataset.view);
  });

// ---- phone back button: overlays close first, then page history, then
// ---- double-press + confirm to exit (never a surprise app exit) ----
window._navStack = window._navStack || [];
{
  const closeTopLayer = () => {
    const pv = document.getElementById('pvOverlay');
    if (pv) { pv.remove(); return true; }
    const cam = document.getElementById('camModal');
    if (cam) { cam.querySelector('#camCancel')?.click(); return true; }
    const sig = document.getElementById('signModal');
    if (sig) { sig.querySelector('#signClose')?.click(); return true; }
    const prof = document.getElementById('profileModal');
    if (prof) { prof.remove(); return true; }
    const panel = document.getElementById('notifPanel');
    if (panel && !panel.classList.contains('hidden')) { panel.classList.add('hidden'); return true; }
    const menu = document.getElementById('userMenu');
    if (menu && !menu.classList.contains('hidden')) { menu.classList.add('hidden'); return true; }
    const openModal = [...document.querySelectorAll('.modal:not(.hidden)')].pop();
    if (openModal) {
      const closeBtn = openModal.querySelector('.modal-head button.mini');
      if (closeBtn) closeBtn.click(); else openModal.classList.add('hidden');
      return true;
    }
    if (document.body.classList.contains('sb-open')) {
      document.body.classList.remove('sb-open');
      return true;
    }
    return false;
  };
  let lastBack = 0;
  window._appBack = () => {
    if (closeTopLayer()) return;
    if (window._navStack.length) {
      window._navSkipPush = true;
      show(window._navStack.pop());
      return;
    }
    const now = Date.now();
    if (now - lastBack < 1900) {
      lastBack = 0;
      if (confirm('Exit Elishen Agrivance?')) {
        try { Capacitor.Plugins.App.exitApp(); } catch { try { window.close(); } catch {} }
      }
      return;
    }
    lastBack = now;
    let t = document.getElementById('backToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'backToast';
      t.style.cssText = 'position:fixed;bottom:26px;left:50%;transform:translateX(-50%);'
        + 'background:rgba(18,30,15,.93);color:#fff;padding:9px 18px;border-radius:999px;'
        + 'font-size:13px;z-index:950;display:none';
      document.body.appendChild(t);
    }
    t.textContent = 'Press back again to exit';
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 1900);
  };
  // native Android hardware button (Capacitor App plugin)
  if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    try {
      Capacitor.Plugins.App.addListener('backButton', () => window._appBack());
      // coming back to the app refreshes alerts right away
      Capacitor.Plugins.App.addListener('resume', () => window._notifPoll && window._notifPoll());
    } catch {}
  }
  // browser back (phone browsers / desktop) walks the same page history
  window.addEventListener('popstate', (e) => {
    if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) return;
    const v = e.state && e.state.v;
    if (!v || !window._user) return;
    window._fromPop = true;
    window._navSkipPush = true;
    show(v);
  });
}

// ---- double-submit protection: any submit button locks itself ("Saving…")
// ---- until the transaction settles — slow connections can't fire it twice ----
document.addEventListener('submit', (e) => {
  const btn = e.submitter
    || e.target.querySelector('button[type="submit"]')
    || e.target.querySelector('button.primary');
  if (!btn || btn.disabled) return;
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  const restore = () => {
    btn.disabled = false;
    if (btn.isConnected) btn.textContent = orig;
  };
  const failsafe = setTimeout(() => { clearInterval(iv); restore(); }, 15000);
  const seq0 = (window._apiTxSeq && window._apiTxSeq()) || 0;
  let waited = 0;
  const iv = setInterval(() => {
    waited += 200;
    const busy = (window._apiBusy && window._apiBusy()) || 0;
    const fired = ((window._apiTxSeq && window._apiTxSeq()) || 0) > seq0;
    if ((fired && busy === 0)                         // transaction settled
      || (!fired && waited >= 1600)                   // validation-only submit
      || !btn.isConnected) {                          // view re-rendered
      clearInterval(iv); clearTimeout(failsafe); restore();
    }
  }, 200);
}, true);

// ---- notification bell: casual transaction notices from teammates ----
{
  const bell = document.createElement('button');
  bell.id = 'notifBell';
  bell.type = 'button';
  bell.title = 'Notifications — what teammates just did';
  bell.style.cssText = 'position:fixed;top:12px;right:14px;z-index:590;display:none;'
    + 'padding:8px 14px;border:1px solid var(--border-strong);border-radius:999px;'
    + 'background:var(--surface);cursor:pointer;font:600 13px "Segoe UI",Arial,sans-serif;'
    + 'color:var(--ink-2);box-shadow:var(--shadow)';
  const panel = document.createElement('div');
  panel.id = 'notifPanel';
  panel.className = 'hidden';
  panel.style.cssText = 'position:fixed;top:52px;right:14px;z-index:590;width:min(390px,92vw);'
    + 'max-height:62vh;overflow-y:auto;background:var(--surface);border:1px solid var(--border);'
    + 'border-radius:12px;box-shadow:0 10px 34px rgba(0,0,0,.28)';
  document.body.append(bell, panel);
  let cache = { items: [], unread: 0, last_seen: 0 };
  const renderBell = () => {
    bell.style.display = window._user ? '' : 'none';
    bell.innerHTML = 'Alerts' + (cache.unread
      ? ` <span style="background:var(--bad);color:#fff;border-radius:999px;padding:1px 7px;font-size:11.5px">${cache.unread}</span>`
      : '');
  };
  const rel = (ts) => {
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(ts).toLocaleString();
  };
  const renderPanel = () => {
    panel.innerHTML = '<div style="padding:11px 14px;font-weight:700;border-bottom:1px solid var(--border)">Notifications</div>'
      + (cache.items.length ? cache.items.map((n) => {
          const fresh = n.id > cache.last_seen && n.actor !== window._user?.name;
          return `<div style="padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;${fresh ? '' : 'opacity:.68'}">
            <div>${String(n.message).replace(/</g, '&lt;')}</div>
            <small style="color:var(--ink-2)">${rel(n.ts)}</small>
          </div>`;
        }).join('')
      : '<div style="padding:16px;color:var(--ink-2)">Nothing yet — teammates\' sales, payments, and deliveries will show here.</div>');
  };
  // on the phone app, fresh events also pop as REAL system notifications
  const pushNative = async () => {
    if (!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;
    try {
      const LN = Capacitor.Plugins.LocalNotifications;
      if (!LN) return;
      let lastPushed = Number(localStorage.getItem('ea_last_pushed') || 0);
      const fresh = cache.items.filter((n) => n.id > lastPushed
        && n.actor !== (window._user && window._user.name));
      if (!fresh.length) return;
      const perm = await LN.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LN.requestPermissions();
        if (req.display !== 'granted') return;
      }
      await LN.schedule({ notifications: fresh.slice(0, 5).map((n) => ({
        id: n.id % 100000,
        title: 'Elishen Agrivance',
        body: n.message,
        schedule: { at: new Date(Date.now() + 300) },
      })) });
      localStorage.setItem('ea_last_pushed', String(Math.max(...fresh.map((n) => n.id))));
    } catch {}
  };
  window._notifPoll = async () => {
    if (!window._user) { renderBell(); return; }
    try { cache = await api.get('/api/notifications'); pushNative(); } catch {}
    renderBell();
  };
  bell.onclick = async (e) => {
    e.stopPropagation();
    if (panel.classList.contains('hidden')) {
      renderPanel();
      panel.classList.remove('hidden');
      try { await api.post('/api/notifications/seen', {}); cache.unread = 0; renderBell(); } catch {}
    } else panel.classList.add('hidden');
  };
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== bell) panel.classList.add('hidden');
  });
  setInterval(window._notifPoll, 10000);
  window._notifPoll();

  // amber chip beside Alerts while offline transactions wait to sync
  const oc = document.createElement('div');
  oc.id = 'offlineChip';
  oc.style.cssText = 'position:fixed;top:12px;right:96px;z-index:590;display:none;'
    + 'padding:8px 14px;border-radius:999px;background:#fdf3d7;color:#9a6b00;'
    + 'font:600 13px "Segoe UI",Arial,sans-serif;border:1px solid #e3cf9b';
  document.body.appendChild(oc);
  window._renderOfflineChip = (n) => {
    oc.style.display = n > 0 ? '' : 'none';
    oc.textContent = `Offline: ${n} to sync`;
  };
  window._renderOfflineChip((window._offlineCount && window._offlineCount()) || 0);
  setInterval(() => { if (typeof syncOfflineQueue === 'function') syncOfflineQueue(); }, 20000);
  window.addEventListener('online', () => { if (typeof syncOfflineQueue === 'function') syncOfflineQueue(); });
}

// ---- sidebar: collapsible on desktop, off-canvas drawer on phones ----
{
  const sbT = document.getElementById('sbToggle');
  const appEl = document.getElementById('app');
  const mq = matchMedia('(max-width: 720px)');
  const backdrop = document.createElement('div');
  backdrop.id = 'sbBackdrop';
  document.body.appendChild(backdrop);
  window._closeDrawer = () => document.body.classList.remove('sb-open');
  backdrop.onclick = window._closeDrawer;
  const syncLabel = () => {
    if (mq.matches) {
      sbT.textContent = 'Menu';
      sbT.title = 'Open menu';
    } else {
      const col = appEl.classList.contains('sb-collapsed');
      sbT.innerHTML = col ? '&rsaquo;' : '&lsaquo;';
      sbT.title = col ? 'Show menu' : 'Hide menu';
    }
  };
  const setSb = (collapsed) => {
    appEl.classList.toggle('sb-collapsed', collapsed);
    document.body.classList.toggle('sb-collapsed', collapsed);
    localStorage.setItem('ea_sidebar_collapsed', collapsed ? '1' : '0');
    syncLabel();
  };
  sbT.onclick = () => {
    if (mq.matches) document.body.classList.toggle('sb-open');
    else setSb(!appEl.classList.contains('sb-collapsed'));
  };
  (mq.addEventListener ? mq.addEventListener('change', syncLabel) : mq.addListener(syncLabel));
  setSb(localStorage.getItem('ea_sidebar_collapsed') === '1');
}

// Load currency symbol once, then boot (login first if no saved session)
try { window._user = JSON.parse(localStorage.getItem('ea_user') || 'null'); } catch { window._user = null; }
// pre-token upgrade leftovers: a saved user without a session token can't call
// the API anymore — send them through login once to pick up a token
if (window._user && !localStorage.getItem('ea_token')) {
  localStorage.removeItem('ea_user');
  window._user = null;
}
api.get('/api/settings')
  .then((s) => { window._currency = s.currency_symbol || ''; })
  .catch(() => {})
  .finally(() => {
    if (window._user) { applyRoleGates(); show('dashboard'); }
    else renderLogin();
  });

// ---- Realtime: soft refresh every 8s ----
// Re-computes the current view in the background, then swaps ONLY the data
// regions (tables, cards, charts, totals) whose content changed. Forms, focus,
// and scroll position are never touched — no full-page flicker.
const DATA_REGIONS = '.tablewrap, .cards, .hbar, .vcols, .totals, .empty, .arcard';

async function softRefresh() {
  if (!window._user) return;                    // login screen up — nothing to refresh
  if (document.hidden) return;
  const el = document.activeElement;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
  if (document.querySelector('.crudform:not(.hidden)')) return;
  if (document.querySelector('.modal:not(.hidden)')) return;   // never refresh under an open modal
  if (document.querySelector('.drsel:checked')) return;        // never wipe an in-progress bulk selection
  if (window._view === 'newsale' && window._saleData?.lines.length) return;
  if (window._view === 'stocktake') return;   // never interrupt a stock count
  if (window._view === 'cisform') return;     // never wipe a half-filled information sheet

  const dot = document.getElementById('syncdot');
  try {
    const view = window._view;
    window._tblSeq = 0;                       // keep table keys aligned with show()
    const html = await views[view]();
    if (view !== window._view) return;        // user navigated away mid-fetch
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // modal internals are transient UI, never part of the region diff —
    // otherwise an open/filled modal forces the disruptive full-render fallback
    const regions = (root) => [...root.querySelectorAll(DATA_REGIONS)]
      .filter((n) => !n.closest('.modal'));
    const cur = regions(main);
    const nxt = regions(tmp);
    let touched = false;
    if (cur.length !== nxt.length) {
      // structure changed (e.g. empty-state → table) — full render, keeping scroll
      const sx = window.scrollX, sy = window.scrollY;
      main.innerHTML = html;
      wire(view);
      if (typeof window.injectPrintButton === 'function') window.injectPrintButton();
      window.scrollTo(sx, sy);
      touched = true;
    } else {
      cur.forEach((node, i) => {
        if (node.outerHTML !== nxt[i].outerHTML) {
          node.replaceWith(nxt[i]);
          touched = true;
        }
      });
    }
    if (touched) { wireCrud(); wireSalesActions(); }
    if (dot) {
      dot.textContent = `Live · synced ${new Date().toLocaleTimeString()}`;
      dot.classList.remove('stale');
    }
  } catch (e) {
    if (dot) { dot.textContent = 'Offline — retrying'; dot.classList.add('stale'); }
  }
}
setInterval(softRefresh, 8000);
