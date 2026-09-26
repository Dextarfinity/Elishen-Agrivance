// Print reports: every page gets a "Print report" button that renders the
// page's current data as a formal letterhead report and opens print preview.

// per-view print scope: when set, only these elements make it into the report
// (inventory prints the item catalog only — not batches, production, or BOM)
const PRINT_SCOPE = { inventory: '[data-crud="items"]' };

// ---------- e-signature lines: one mechanism for every "signature over printed name" ----------
// Every document marks its signing lines with sigSlot(); the preview turns each
// one into a tap-to-sign target that reuses the app's signature pad. A line left
// unsigned prints exactly as the blank ruled line it always was, so ink still
// works. The printed name sits on the line and the ink over it -- "signature over
// printed name", literally.
//   doc/key -- the document this line belongs to (see DOC_SIGN on the server):
//              a DR or payroll run by its id; a statement, report or DTR by its
//              customer/page/employee and day or period. A signed line is saved
//              with the preview's Save button and comes back on every reopening.
//   self    -- an internal line (Prepared, Checked, Approved, Issued): the pad
//              offers the signed-in user's name, since it is usually theirs
//   date    -- selector of a "Date:" blank to fill when the line is signed
//   who     -- whose names the pad lists: 'staff' or 'customer'
//   suggest -- the customer the signature is for: their people are listed first
const SIG_CSS = `
  .esig { flex: 1; text-align: center; font-size: 10.5px; color: #444; }
  .esig-space { position: relative; height: 40px; display: flex; align-items: flex-end;
    justify-content: center; }
  .esig-name { position: relative; font-weight: 700; color: #111; font-size: 11px; padding-bottom: 2px; }
  .esig-ink { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
    height: 46px; max-width: 96%; pointer-events: none; }
  .esig-line { border-bottom: 1px solid #111; }
  .esig-cap { margin-top: 4px; }
  .esig-when { display: block; font-size: 9px; color: #666; margin-top: 1px; }`;
function sigSlot({ caption, role, name = '', doc = '', key = '', saved = null, when = '',
  self = false, date = '', label = 'Printed name', who = self ? 'staff' : 'customer', suggest = '' }) {
  const s = saved || {};
  const nm = s.name || name || '';
  const signedOn = s.signature ? (s.signed_at || when) : when;
  return `<div class="esig${s.signature ? ' signed' : ''}" data-sig="${esc(role)}"
      data-sigcap="${esc(caption)}" data-signame="${esc(nm)}" data-siglabel="${esc(label)}"
      ${doc && key !== '' && key != null ? `data-sigdoc="${esc(doc)}" data-sigkey="${esc(String(key))}"` : ''}
      ${self ? 'data-sigself="1"' : ''} ${date ? `data-sigdate="${esc(date)}"` : ''}
      data-sigwho="${esc(who)}" ${suggest ? `data-sigsuggest="${esc(suggest)}"` : ''}>
    <div class="esig-space">${nm ? `<span class="esig-name">${esc(nm)}</span>` : ''}${s.signature
      ? `<img class="esig-ink" src="${esc(s.signature)}" alt="">` : ''}</div>
    <div class="esig-line"></div>
    <div class="esig-cap">${esc(caption)}${signedOn
      ? `<span class="esig-when">${s.signature ? 'signed ' : ''}${esc(sigStamp(signedOn))}</span>`
      : ''}</div>
  </div>`;
}
const localDay = () => new Date().toLocaleDateString('en-CA');     // YYYY-MM-DD, local
// "2026-09-11 14:05" when a signature carries its own time; a bare date stays a date
function sigStamp(v) {
  const s = String(v || '');
  if (!/\d:\d/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d)) return s.slice(0, 10);
  return `${d.toLocaleDateString('en-CA')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}
// the saved signatures of one document, by line; an older server has none
async function loadDocSigs(type, key) {
  if (!key) return {};
  const rows = await api.get(`/api/doc_signatures?doc_type=${type}&doc_key=${encodeURIComponent(key)}`)
    .catch(() => []);
  return Object.fromEntries((rows || []).map((x) => [x.role, x]));
}

// rootEl prints just that part of the page (one table section, one modal body);
// omitted, the whole page prints as before
// sig: { key, saved } -- this report's signing lines, as printed today
function buildPrintHTML(title, rootEl, sig = {}) {
  const rs = (caption, role) => sigSlot({ caption, role, self: true,
    doc: sig.key ? 'REPORT' : '', key: sig.key || '', saved: (sig.saved || {})[role] });
  const clone = (rootEl || document.getElementById('main')).cloneNode(true);
  clone.querySelectorAll('.modal, .loading, .error, .printbtn').forEach((e) => e.remove());
  // pagination chrome is a screen control, never part of a report
  clone.querySelectorAll('.pgbar').forEach((e) => e.remove());
  // collapsed sections still print in full
  clone.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''));
  // a per-view scope only makes sense when printing the whole page
  const scopeSel = rootEl ? null : PRINT_SCOPE[window._view];
  if (scopeSel) {
    const keep = clone.querySelectorAll(scopeSel);
    if (keep.length) {
      const holder = document.createElement('div');
      keep.forEach((k) => holder.appendChild(k));
      clone.innerHTML = '';
      clone.appendChild(holder);
    }
  }
  // paginated tables print in FULL — reports must carry every row, not one page
  clone.querySelectorAll('[data-tbl]').forEach((w) => {
    const c = window._tblCache && window._tblCache[w.dataset.tbl];
    // one unprintable section must not take the whole report down with it
    try {
      if (c && typeof window.fullTableHTML === 'function') {
        w.innerHTML = window.fullTableHTML(c.sorted || c.rows, c.cols);
      }
    } catch (e) { /* leave the on-screen page of that table as it stands */ }
  });
  // inputs/selects become their plain values (so filters & draft entries print readably)
  clone.querySelectorAll('input, select, textarea').forEach((el) => {
    const span = document.createElement('span');
    if (el.type === 'checkbox') span.textContent = el.checked ? 'Yes' : 'No';
    else if (el.tagName === 'SELECT') span.textContent = el.selectedOptions[0]?.textContent ?? '';
    else span.textContent = el.value ?? '';
    span.className = 'pv';
    el.replaceWith(span);
  });
  clone.querySelectorAll('button, datalist, small').forEach((e) => e.remove());
  // drop action columns: any column whose header AND every body cell are empty
  // (Edit/Delete/Pricing buttons were just removed, leaving hollow columns)
  clone.querySelectorAll('table').forEach((tbl) => {
    const head = tbl.querySelector('thead tr');
    if (!head) return;
    const rows = [...tbl.querySelectorAll('tbody tr')];
    for (let c = head.cells.length - 1; c >= 0; c--) {
      if (head.cells[c].textContent.trim()) continue;
      const colEmpty = rows.every((r) => !r.cells[c] || !r.cells[c].textContent.trim());
      if (colEmpty) {
        head.cells[c].remove();
        rows.forEach((r) => r.cells[c] && r.cells[c].remove());
      }
    }
  });
  clone.querySelector('h2')?.remove(); // re-rendered in the letterhead
  const now = new Date();
  const currency = window._currency || '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title} — Elishen Agrivance</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #111; font-size: 12px;
         padding: 28px 32px; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #1e5c28;
           padding-bottom: 12px; margin-bottom: 14px; }
  .lh-logo { font-family: Georgia, serif; font-size: 38px; font-weight: 800; letter-spacing: -2px; }
  .lh-logo .e { color: #1e5c28; } .lh-logo .s { color: #e3a71f; }
  .lh-name { font-size: 17px; font-weight: 800; letter-spacing: .08em; }
  .lh-sub { font-size: 10.5px; color: #555; margin-top: 2px; }
  h1 { font-size: 15px; margin: 10px 0 2px; text-transform: uppercase; letter-spacing: .05em; }
  .meta { color: #555; font-size: 10.5px; margin-bottom: 14px; }
  h3 { font-size: 12.5px; margin: 16px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1px solid #bbb; padding: 4px 7px; text-align: left; }
  th { background: #efefe9; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; }
  td { padding: 6px 7px; }   /* wider row gaps → unambiguous page-break bands */
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .cards { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .card { border: 1px solid #bbb; border-radius: 6px; padding: 8px 12px; min-width: 150px; }
  .card span { font-size: 9.5px; text-transform: uppercase; color: #555; display: block; }
  .card strong { font-size: 15px; }
  .badge { font-weight: 600; }
  .hbar-row { display: grid; grid-template-columns: 160px 1fr 60px; gap: 8px; align-items: center; padding: 2px 0; }
  .hbar-track { background: #eee; height: 10px; } .hbar-fill { height: 100%; background: #1e5c28 !important; }
  .hbar-val { text-align: right; }
  .vcols { display: flex; align-items: flex-end; gap: 3px; height: 110px; border: 1px solid #ccc; padding: 8px; }
  .vcol { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
  .vcol-bar { width: 70%; background: #1e5c28; } .vcol-val, .vcol-lab { font-size: 8.5px; }
  .empty { color: #777; font-style: italic; }
  .twocol { display: block; }
  .tablewrap { overflow: visible; }
  .form, .rangeform, .arhead { border: 1px solid #ddd; padding: 8px 10px; margin-bottom: 10px;
    border-radius: 6px; display: flex; flex-wrap: wrap; gap: 14px; }
  label { font-size: 10.5px; color: #444; display: inline-flex; gap: 5px; align-items: baseline; }
  .pv { font-weight: 600; color: #111; }
  .grid3 { display: flex; flex-wrap: wrap; gap: 14px; }
  .crudform { display: none; }
  footer { display: flex; gap: 40px; margin-top: 34px; page-break-inside: avoid; }
  ${SIG_CSS}
  @page { margin: 12mm; }
</style></head><body>
  <header>
    <div class="lh-logo"><span class="e">E</span><span class="s">S</span></div>
    <div>
      <div class="lh-name">ELISHEN AGRIVANCE</div>
      <div class="lh-sub">Sales &amp; Inventory Management System · Universal Robina Dealer</div>
    </div>
  </header>
  <h1>${title} Report</h1>
  <div class="meta">Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()} · Currency: ${currency || 'PHP'}</div>
  <main>${clone.innerHTML}</main>
  <footer>
    ${rs('Prepared by', 'prepared')}
    ${rs('Checked by', 'checked')}
    ${rs('Approved by', 'approved')}
  </footer>
</body></html>`;
}

function reportTitle() {
  return (document.querySelector('#main h2')?.childNodes[0]?.textContent
    || document.querySelector('#main h2')?.textContent || 'Report').trim();
}

// ---------- editable preview ----------
// Everything in a preview can be corrected before it is printed: a wrong spelling,
// a note added by hand, a row struck out. Edits live only in the preview — they
// change the paper, never the database — and they are carried into the PDF too.
const PV_EDIT_CSS = `
  [data-pvedit] { outline: 0; }
  [data-pvedit]:focus-within { }
  [data-pvedit] *:focus { outline: 2px dashed #e3a71f; outline-offset: 2px; border-radius: 2px; }
  #pvhint { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9998; padding: 7px 16px;
    background: rgba(30,92,40,.94); color: #fff; cursor: pointer;
    font: 600 12px "Segoe UI", Arial, sans-serif; }
  @media screen { body { padding-bottom: 44px !important; } }
  @media print {
    #pvhint { display: none !important; }
    body { padding-bottom: 0 !important; }
    [data-pvedit] *:focus { outline: 0 !important; }
  }`;

// ---------- signing on the preview ----------
// Every sigSlot() line becomes a tap target that opens the app's own signature
// pad, inside the preview. Signing puts the ink on the paper at once and marks
// the line "not saved yet"; the preview's Save button keeps each signature and
// name with its document, so they are there again when it is reopened. Leaving,
// printing or making a PDF with unsaved signatures saves them first (or asks).
// Screen-only styling: none of it reaches paper or PDF.
const PV_SIG_CSS = `
  @media screen {
    [data-sig] { cursor: pointer; border-radius: 6px; transition: background .12s; }
    [data-sig]:hover { background: rgba(227,167,31,.14); }
    [data-sig]:not(.signed) .esig-line { border-bottom-color: #c98a0b; }
    [data-sig]:not(.signed) .esig-cap::after { content: ' · tap to sign'; color: #b07a0a; font-weight: 700; }
    [data-sig][data-pending] { background: rgba(176,32,32,.07); }
    [data-sig][data-pending] .esig-cap::after { content: ' · not saved yet'; color: #b02020; font-weight: 700; }
  }`;
// The signing state of one preview: the lines signed but not yet saved, and how
// to save them. Kept on the document, where the preview's buttons can reach it.
// onChange(ctl) runs whenever that state moves, to repaint the Save button.
function makeSignable(doc, onChange = () => {}) {
  if (!doc || !doc.body) return null;
  const slots = [...doc.querySelectorAll('[data-sig]')];
  if (!slots.length) return null;
  const st = doc.createElement('style');
  st.id = 'pvSigStyle';
  st.textContent = PV_SIG_CSS;
  doc.head.appendChild(st);
  const ctl = {
    pending: new Map(),                           // slot -> { name, signature }
    saveable: slots.some((s) => s.dataset.sigdoc),
    savedAny: false,
    changed() { onChange(ctl); },
    // save every pending line; returns what failed (those stay pending)
    async saveAll() {
      const failed = [];
      for (const [slot, r] of [...ctl.pending]) {
        try {
          await saveSignature(slot.dataset, r);
          ctl.pending.delete(slot);
          slot.removeAttribute('data-pending');
          ctl.savedAny = true;
        } catch (e) { failed.push(`${slot.dataset.sigcap}: ${e.message}`); }
      }
      ctl.changed();
      return failed;
    },
  };
  doc.__sig = ctl;
  slots.forEach((slot) => {
    // an island in the editable page: a tap signs, it does not drop a text caret
    slot.setAttribute('contenteditable', 'false');
    slot.onclick = (e) => { e.preventDefault(); e.stopPropagation(); signSlot(doc, slot, ctl); };
  });
  const hint = doc.getElementById('pvhint');
  if (hint) hint.textContent += ctl.saveable
    ? ' Tap a signature line to sign it, then press Save so the signature stays with this document.'
    : ' Tap a signature line to sign it on screen.';
  ctl.changed();
  return ctl;
}
async function signSlot(doc, slot, ctl) {
  // a preview in an iframe asks through the app window; a pop-up asks in itself
  const view = doc.defaultView;
  const dlg = view && view.frameElement ? window : (view || window);
  if (typeof window.openSignPad !== 'function') {
    dlg.alert('The signature pad did not load. Close and reopen the app.');
    return;
  }
  const d = slot.dataset;
  const wasSigned = slot.classList.contains('signed');
  const r = await window.openSignPad({
    title: `Sign — ${esc(d.sigcap)}`, doc, nameLabel: esc(d.siglabel || 'Printed name'),
    name: d.signame || (d.sigself ? (window._user?.name || '') : ''),
    who: d.sigwho || 'customer', suggest: d.sigsuggest ? [d.sigsuggest] : [],
  });
  if (!r) return;
  if (!r.signature) {
    if (!wasSigned) return;                      // nothing drawn, nothing to take off
    if (!dlg.confirm(`Remove the signature on "${d.sigcap}"?`)) return;
  }
  paintSignature(doc, slot, r);
  if (d.sigdoc && ctl) {
    ctl.pending.set(slot, r);
    slot.setAttribute('data-pending', '');
    ctl.changed();
  }
}
function saveSignature(d, r) {
  // the receiver's signature has always been part of the delivery itself
  if (d.sigdoc === 'DR' && d.sig === 'customer') {
    return api.put(`/api/deliveries/${Number(d.sigkey)}`,
      { received_by: r.name || null, signature: r.signature || null });
  }
  return api.put('/api/doc_signatures', { doc_type: d.sigdoc, doc_key: d.sigkey, role: d.sig,
    name: r.name || null, signature: r.signature || null });
}
function paintSignature(doc, slot, r) {
  const nm = (r.name || '').trim();
  slot.dataset.signame = nm;
  slot.querySelector('.esig-space').innerHTML =
    (nm ? `<span class="esig-name">${esc(nm)}</span>` : '')
    + (r.signature ? `<img class="esig-ink" src="${r.signature}" alt="">` : '');
  slot.classList.toggle('signed', !!r.signature);
  const cap = slot.querySelector('.esig-cap');
  cap.querySelector('.esig-when')?.remove();
  if (!r.signature) return;
  cap.insertAdjacentHTML('beforeend',
    `<span class="esig-when">signed ${esc(sigStamp(new Date().toISOString()))}</span>`);
  const dateField = slot.dataset.sigdate && doc.querySelector(slot.dataset.sigdate);
  if (dateField && !dateField.textContent.trim()) dateField.textContent = localDay();
}
const sigFailText = (failed) => `${failed.length} signature${failed.length > 1 ? 's were' : ' was'} `
  + `not saved:\n• ${failed.join('\n• ')}`;
// The Save button reads the preview's signing state: how many are waiting.
function paintSaveButton(btn, ctl) {
  if (!btn) return;
  btn.hidden = !(ctl && ctl.saveable);
  if (btn.hidden) return;
  const n = ctl.pending.size;
  btn.disabled = !n;
  btn.textContent = n ? `Save signatures (${n})` : ctl.savedAny ? '✓ Signatures saved' : 'Save signatures';
  btn.title = n ? 'Keep these signatures and names with this document' : 'Sign a line first';
}
async function runSave(btn, ctl, dlg) {
  if (!ctl || !ctl.pending.size) return;
  btn.disabled = true; btn.textContent = 'Saving…';
  const failed = await ctl.saveAll();              // repaints the button when done
  if (failed.length) dlg.alert(sigFailText(failed));
}
// A printed or PDF copy of a signed document keeps its signatures too: the paper
// and the record must agree. If saving fails, the user decides.
async function saveBeforeOutput(ctl, dlg) {
  if (!ctl || !ctl.pending.size) return true;
  const failed = await ctl.saveAll();
  return !failed.length || dlg.confirm(`${sigFailText(failed)}\n\nContinue anyway?`);
}
// Leaving with unsaved signatures: save them (the usual answer) or confirm the loss.
async function saveBeforeLeaving(ctl, dlg) {
  if (!ctl || !ctl.pending.size) return true;
  const n = ctl.pending.size, s = n > 1 ? 's' : '';
  if (dlg.confirm(`Save the ${n} unsaved signature${s} before leaving?\n\n`
    + 'OK — save and leave\nCancel — leave without saving')) {
    const failed = await ctl.saveAll();
    if (!failed.length) return true;
    dlg.alert(`${sigFailText(failed)}\n\nThe preview stays open so nothing is lost.`);
    return false;
  }
  return dlg.confirm(`Leave without saving? The ${n} signature${s} will be lost.`);
}

// make the document's content editable, leaving the toolbar alone
function makeEditable(doc) {
  if (!doc || !doc.body) return;
  const st = doc.createElement('style');
  st.id = 'pvEditStyle';
  st.textContent = PV_EDIT_CSS;
  doc.head.appendChild(st);
  [...doc.body.children].forEach((el) => {
    if (el.id === 'pvbar' || el.id === 'pvhint') return;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-pvedit', '');
    el.setAttribute('spellcheck', 'false');
  });
  const hint = doc.createElement('div');
  hint.id = 'pvhint';
  hint.textContent = 'Click any text to correct it before printing — edits apply to this printout only, '
    + 'not to your records. (Tap to dismiss)';
  hint.onclick = () => hint.remove();
  doc.body.appendChild(hint);
}

// the document as it stands now, edits and all, with the preview's own furniture
// stripped out — this is what the PDF must be built from
function editedHTML(doc, fallback) {
  try {
    const root = doc.documentElement.cloneNode(true);
    root.querySelectorAll('#pvbar, #pvhint, #pvEditStyle, #pvBarStyle, #pvSigStyle, #signModal, #signPadStyle')
      .forEach((e) => e.remove());
    root.querySelectorAll('[data-sig]').forEach((e) => {
      e.removeAttribute('contenteditable');
      e.removeAttribute('data-pending');
    });
    root.querySelectorAll('[data-pvedit]').forEach((e) => {
      e.removeAttribute('contenteditable');
      e.removeAttribute('data-pvedit');
      e.removeAttribute('spellcheck');
    });
    return '<!doctype html>' + root.outerHTML;
  } catch { return fallback; }
}

// Every print path goes through this preview: the document opens in a new
// window with a choice bar — nothing prints until the user picks an action.
// On the phone app (or when pop-ups are blocked) it opens as an IN-APP overlay
// with a Back button, so the user is never stranded on the preview.
// The desktop build must not open a second window: Electron gives it its own
// BrowserWindow, and when that closes the main window is left without focus --
// clicks and typing go nowhere until the user alt-tabs or minimises and reopens.
// The in-app overlay avoids the problem entirely and prints just the same.
const isDesktopApp = () =>
  /electron/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
function openPrintPreview(html, pdfName) {
  const native = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  const inApp = native || isDesktopApp();
  let w = null;
  if (!inApp) { try { w = window.open('', '_blank', 'width=980,height=760'); } catch (e) { w = null; } }
  if (!w) return openPreviewOverlay(html, pdfName, native);
  w.document.write(html);
  w.document.close();
  const doc = w.document;
  const st = doc.createElement('style');
  st.id = 'pvBarStyle';
  st.textContent = `
    #pvbar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      display: flex; align-items: center; gap: 10px; padding: 9px 16px;
      background: #1e5c28; color: #fff; font: 600 13px "Segoe UI", Arial, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,.25); }
    #pvbar span { flex: 1; }
    #pvbar button { border: 0; border-radius: 5px; padding: 7px 16px; cursor: pointer;
      font: 700 13px "Segoe UI", Arial, sans-serif; }
    #pvPrint { background: #e3a71f; color: #1c1c1c; }
    #pvPdf { background: #fff; color: #1e5c28; }
    #pvSave { background: #fff; color: #b02020; }
    #pvbar button:disabled { opacity: .6; cursor: default; }
    body { margin-top: 54px !important; }
    @media print { #pvbar { display: none !important; } body { margin-top: 0 !important; } }`;
  doc.head.appendChild(st);
  const bar = doc.createElement('div');
  bar.id = 'pvbar';
  bar.innerHTML = `<span>Preview — editable; correct anything, then choose an action</span>
    <button type="button" id="pvSave" hidden>Save signatures</button>
    <button type="button" id="pvPdf">Save as PDF</button>
    <button type="button" id="pvPrint">Print</button>`;
  doc.body.prepend(bar);
  makeEditable(doc);
  const saveBtn = doc.getElementById('pvSave');
  const ctl = makeSignable(doc, (c) => paintSaveButton(saveBtn, c));
  saveBtn.onclick = () => runSave(saveBtn, ctl, w);
  // a pop-up closed with unsaved signatures: the browser's own "leave?" prompt
  w.addEventListener('beforeunload', (e) => {
    if (ctl && ctl.pending.size) { e.preventDefault(); e.returnValue = ''; }
  });
  doc.getElementById('pvPrint').onclick = async () => {
    if (!(await saveBeforeOutput(ctl, w))) return;
    try { w.focus(); w.print(); } catch (e) {}
  };
  const pdfBtn = doc.getElementById('pvPdf');
  pdfBtn.onclick = async () => {
    if (!(await saveBeforeOutput(ctl, w))) return;
    pdfBtn.disabled = true; pdfBtn.textContent = 'Generating…';
    // build the PDF from the document as edited, not the original markup
    try { await htmlToPdf(editedHTML(doc, html), pdfName); }
    catch (e) { alert('PDF error: ' + e.message); }
    finally { pdfBtn.disabled = false; pdfBtn.textContent = 'Save as PDF'; }
  };
}

// in-app preview: fullscreen iframe + top bar (Back / Save as PDF / Print)
function openPreviewOverlay(html, pdfName, native) {
  document.getElementById('pvOverlay')?.remove();
  const ov = document.createElement('div');
  ov.id = 'pvOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:900;background:#e9ebee;display:flex;flex-direction:column';
  ov.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;padding:10px 12px;background:#1e5c28;color:#fff;
                padding-top:max(10px, env(safe-area-inset-top))">
      <button type="button" id="pvOvBack" style="border:0;border-radius:8px;padding:9px 14px;
        background:#fff;color:#1e5c28;font-weight:700;cursor:pointer">&lsaquo; Back</button>
      <b style="flex:1;font-size:14px">Preview <span style="font-weight:400;opacity:.85">— tap text to edit</span></b>
      <style>#pvOverlay button:disabled { opacity: .6; cursor: default; }</style>
      <button type="button" id="pvOvSave" hidden style="border:0;border-radius:8px;padding:9px 14px;
        background:#fff;color:#b02020;font-weight:700;cursor:pointer">Save signatures</button>
      <button type="button" id="pvOvPdf" style="border:0;border-radius:8px;padding:9px 14px;
        background:#e3a71f;color:#1c1c1c;font-weight:700;cursor:pointer">Save as PDF</button>
      ${native ? '' : `<button type="button" id="pvOvPrint" style="border:0;border-radius:8px;
        padding:9px 14px;background:#fff;color:#1e5c28;font-weight:700;cursor:pointer">Print</button>`}
    </div>
    <iframe style="flex:1;width:100%;border:0;background:#fff"></iframe>`;
  document.body.appendChild(ov);
  const frame = ov.querySelector('iframe');
  // the srcdoc document only exists once it has loaded — make it editable then
  const saveBtn = document.getElementById('pvOvSave');
  const sigCtl = () => frame.contentDocument && frame.contentDocument.__sig;
  frame.onload = () => {
    try { makeEditable(frame.contentDocument); } catch (e) {}
    try { makeSignable(frame.contentDocument, (c) => paintSaveButton(saveBtn, c)); } catch (e) {}
  };
  saveBtn.onclick = () => runSave(saveBtn, sigCtl(), window);
  frame.srcdoc = html;
  // Closing the preview hands the keyboard back to the page. The iframe holds
  // focus while it is open, and on some builds it keeps it after removal, which
  // leaves the app looking frozen -- the same symptom a second window caused.
  const closePreview = () => {
    ov.remove();
    try {
      document.activeElement?.blur?.();
      window.focus();
      document.getElementById('main')?.focus?.({ preventScroll: true });
    } catch (e) { /* focus is best-effort */ }
  };
  // never lose a signature on the way out: unsaved ones are saved, or the loss confirmed
  const leave = async () => {
    if (!(await saveBeforeLeaving(sigCtl(), window))) return;
    closePreview();
  };
  document.getElementById('pvOvBack').onclick = leave;
  // Esc closes it too, so there is always a way out without reaching for a button
  ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') leave(); });
  document.getElementById('pvOvPdf').onclick = async (e) => {
    const b = e.target;
    if (!(await saveBeforeOutput(sigCtl(), window))) return;
    b.disabled = true; b.textContent = 'Generating…';
    // build the PDF from the document as edited, not the original markup
    try { await htmlToPdf(editedHTML(frame.contentDocument, html), pdfName); }
    catch (err) { alert('PDF error: ' + err.message); }
    b.disabled = false; b.textContent = 'Save as PDF';
  };
  const pr = document.getElementById('pvOvPrint');
  if (pr) pr.onclick = async () => {
    if (!(await saveBeforeOutput(sigCtl(), window))) return;
    try { ov.querySelector('iframe').contentWindow.print(); } catch (e) {}
  };
}

// A printed report's signatures belong to that page's report as printed today:
// reprinting it today shows who prepared, checked and approved it; tomorrow's
// copy starts blank.
const reportKey = (title) => `${window._view || 'page'}|${title}|${localDay()}`;
async function printReport() {
  const title = reportTitle(), key = reportKey(title);
  openPrintPreview(buildPrintHTML(title, null, { key, saved: await loadDocSigs('REPORT', key) }), title);
}

// Print ONE section on its own letterhead — a table block on a page, or the body
// of a modal. Paginated tables still print every row, because buildPrintHTML
// swaps the visible page for the cached full set.
async function printSection(el, title) {
  if (!el) return printReport();
  const name = title || sectionTitle(el), key = reportKey(name);
  openPrintPreview(buildPrintHTML(name, el, { key, saved: await loadDocSigs('REPORT', key) }), name);
}

// the nearest heading above a section names it; fall back to the page title
function sectionTitle(el) {
  let n = el;
  while (n && n !== document.body) {
    for (let p = n.previousElementSibling; p; p = p.previousElementSibling) {
      if (/^H[2-4]$/.test(p.tagName)) {
        const t = (p.childNodes[0]?.textContent || p.textContent || '').trim();
        if (t) return t;
      }
    }
    n = n.parentElement;
  }
  return reportTitle();
}

// Save the current page's report as a .pdf directly (A4, paginated)
async function saveReportPdf(btn) {
  const title = reportTitle();
  const orig = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  try {
    const key = reportKey(title);
    await htmlToPdf(buildPrintHTML(title, null, { key, saved: await loadDocSigs('REPORT', key) }), title);
  } catch (e) {
    alert('PDF error: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = orig; }
  }
}

// Render any print-ready HTML to a paginated A4 PDF (pixel-scan safe page cuts)
async function htmlToPdf(html, baseName) {
  {
    // render the HTML off-screen at a fixed A4-ish width
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed; left:-10000px; top:0; width:820px; height:1200px; border:0;';
    document.body.appendChild(frame);
    frame.contentDocument.open();
    frame.contentDocument.write(html);
    frame.contentDocument.close();
    await new Promise((r) => setTimeout(r, 350));   // let styles/layout settle

    // rasterize once at readable resolution, then slice into A4 pages as JPEG
    const body = frame.contentDocument.body;
    const canvas = await html2canvas(body, {
      scale: 1.5, windowWidth: 820, backgroundColor: '#ffffff', logging: false,
    });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Pixel-perfect page breaks. A cut is only allowed:
    //  (a) on a TABLE ROW BOUNDARY — an ink-free band that contains the row's
    //      horizontal border line (a gray line spanning the table width), or
    //  (b) in a wide ink-free gap between blocks (headings, cards, charts).
    // This makes it impossible to split a row: padding inside a row has no
    // horizontal border line, so it never qualifies.
    const findSafeCut = (idealCut, minCut) => {
      const look = Math.min(900, idealCut - minCut);
      if (look <= 0) return idealCut;
      const y0 = idealCut - look;
      const img = ctx.getImageData(0, y0, canvas.width, look).data;
      const samples = Math.floor(canvas.width / 3);
      const rowInfo = (r) => {
        const base = r * canvas.width * 4;
        let gray = 0;
        for (let x = 0; x < canvas.width; x += 3) {
          const i = base + x * 4;
          const lum = 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2];
          if (lum < 160) return { clean: false, borderFrac: 0 };  // ink — not cuttable
          if (lum <= 225) gray++;                                  // border-gray pixel
        }
        return { clean: true, borderFrac: gray / samples };
      };
      let run = 0, runBottom = -1, borderRow = -1;
      for (let r = look - 1; r >= 0; r--) {
        const info = rowInfo(r);
        if (!info.clean) { run = 0; runBottom = -1; borderRow = -1; continue; }
        if (run === 0) runBottom = r;
        run++;
        if (info.borderFrac >= 0.3) borderRow = r;   // a horizontal rule spans this row
        // (a) row boundary: modest band that contains a border line → cut just below it
        if (borderRow >= 0 && run >= 8) return y0 + Math.min(borderRow + 3, runBottom);
        // (b) block gap: generous whitespace with no border needed → cut mid-band
        if (run >= 22) return y0 + r + Math.floor(run / 2);
      }
      return idealCut;   // no safe band found (dense page) — fall back to hard cut
    };

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = 190, pageH = 272;                    // printable area (A4 minus margins)
    const pxPerMm = canvas.width / pageW;
    const pageHpx = Math.floor(pageH * pxPerMm);
    for (let y = 0, first = true; y < canvas.height; first = false) {
      let cut = Math.min(y + pageHpx, canvas.height);
      if (cut < canvas.height) cut = findSafeCut(cut, y + Math.floor(pageHpx * 0.4));
      const sliceH = cut - y;
      const slice = document.createElement('canvas');
      slice.width = canvas.width; slice.height = sliceH;
      slice.getContext('2d').drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (!first) doc.addPage();
      doc.addImage(slice.toDataURL('image/jpeg', 0.85), 'JPEG', 10, 12, pageW, sliceH / pxPerMm);
      y = cut;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const fname = `${baseName.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_')}_${stamp}.pdf`;
    if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      // phone app: write to app cache and hand off to the Android share sheet
      // (save to Files/Drive, send via chat, or print from there)
      const b64 = doc.output('datauristring').split(',')[1];
      const { Filesystem, Share } = Capacitor.Plugins;
      await Filesystem.writeFile({ path: fname, data: b64, directory: 'CACHE' });
      const { uri } = await Filesystem.getUri({ path: fname, directory: 'CACHE' });
      await Share.share({ title: fname, files: [uri] });
    } else {
      doc.save(fname);
    }
    frame.remove();
  }
}

// pages that are data-entry only — no report to print there
const NO_PRINT_VIEWS = ['newsale', 'stocktake', 'settings'];

// ---------- Delivery Receipt: generated from an invoice, printed on demand ----------
async function printDeliveryReceipt(deliveryId) {
  const [deliveries, sales, settings, reps, sigRows] = await Promise.all([
    api.get('/api/deliveries'), api.get('/api/sales'), api.get('/api/settings'),
    api.get('/api/sales_reps').catch(() => []),
    // a server not yet updated has no signature store: the DR still prints, lines blank
    api.get(`/api/doc_signatures?doc_type=DR&doc_id=${deliveryId}`).catch(() => []),
  ]);
  const sig = Object.fromEntries((sigRows || []).map((x) => [x.role, x]));
  const d = deliveries.find((x) => x.id === deliveryId);
  if (!d) { alert('Delivery not found'); return; }
  const s = sales.find((x) => x.id === d.sale_id) || {};
  const items = s.items || [];
  // A DR written without naming a driver falls back to the invoice's sales rep —
  // the rep IS who delivered it, and a blank "Delivered by" voids the signature line.
  const repName = (reps.find((r) => r.id === Number(s.sales_rep_id)) || {}).name || '';
  const deliveredBy = String(d.delivered_by || '').trim() || repName;
  const totalQty = items.reduce((a, it) => a + Number(it.qty), 0);
  const P = (n) => n == null ? '' :
    Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const total = Number(s.subtotal || 0) + Number(s.tax_amount || 0);
  const html = `<!doctype html><html><head><meta charset="utf-8">
  <title>DR ${d.dr_no} — Elishen Agrivance</title>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body { font-family: Arial, 'Segoe UI', sans-serif; color: #111; padding: 26px 30px; font-size: 13px; }
    .lh { text-align: center; border-bottom: 3px solid #1e5c28; padding-bottom: 10px; }
    .lh .co { font-size: 17px; font-weight: 800; letter-spacing: .03em; }
    .lh .sub { font-size: 11px; color: #333; margin-top: 2px; }
    .titlebar { display: flex; justify-content: space-between; align-items: baseline; margin: 14px 0 8px; }
    .titlebar h1 { font-size: 20px; letter-spacing: .12em; }
    .drno { font-size: 16px; font-weight: 800; color: #b02020; }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12.5px; }
    .meta td { padding: 3px 6px; border-bottom: 1px dotted #999; }
    .meta td.l { color: #444; font-weight: 700; width: 120px; border-bottom: 0; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 6px; }
    table.items th { border: 1.5px solid #111; padding: 6px; font-size: 11px; background: #f0efe9;
      text-transform: uppercase; letter-spacing: .05em; }
    table.items td { border: 1px solid #555; padding: 6px 7px; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 8px; width: 100%; }
    .totals td { padding: 3px 7px; }
    .totals .lab { text-align: right; font-weight: 700; color: #333; }
    .totals .val { text-align: right; width: 130px; font-weight: 800; border-bottom: 1px solid #111; }
    .free { color: #1e5c28; font-weight: 700; }
    .sigs { display: flex; gap: 26px; margin-top: 44px; page-break-inside: avoid; }
    ${SIG_CSS}
    .confirm { margin-top: 22px; font-size: 11.5px; color: #222; }
    .note { margin-top: 12px; font-size: 10.5px; color: #666; }
    @media print { body { padding: 8mm 10mm; } }
  </style></head><body>
    <div class="lh">
      <div class="co">${settings.dr_company || 'ELISHEN AGRIVANCE'}</div>
      <div class="sub">${settings.dr_proprietor || ''}</div>
      <div class="sub">${settings.dr_tin || ''}</div>
      <div class="sub">${settings.dr_address || ''}</div>
    </div>
    <div class="titlebar"><h1>DELIVERY RECEIPT</h1><div class="drno">No. ${d.dr_no}</div></div>
    <table class="meta">
      <tr><td class="l">DELIVERED TO:</td><td>${s.customer ?? ''}</td>
          <td class="l">DATE:</td><td>${String(d.date).slice(0, 10)}</td></tr>
      <tr><td class="l">BUSINESS ADDRESS:</td><td>${s.store_farm ?? ''}</td>
          <td class="l">TERMS:</td><td>${s.term ?? ''}</td></tr>
      <tr><td class="l">INVOICE REF:</td><td>#${s.sales_no ?? ''}</td>
          <td class="l">DELIVERED BY:</td><td>${esc(deliveredBy)}${d.vehicle ? ' · ' + esc(d.vehicle) : ''}</td></tr>
    </table>
    <table class="items">
      <thead><tr><th style="width:30px">#</th><th style="width:55px">QTY</th>
        <th style="width:65px">UNIT</th><th>PARTICULARS</th>
        <th style="width:85px">UNIT COST</th><th style="width:80px">DISCOUNT</th>
        <th style="width:85px">NET PRICE</th><th style="width:95px">AMOUNT</th></tr></thead>
      <tbody>
        ${items.map((it, ix) => `<tr>
          <td class="num">${ix + 1}</td>
          <td class="num">${Number(it.qty)}</td>
          <td>${it.uom ?? ''}</td>
          <td>${it.alias ? `<b>${esc(it.alias)}</b> — ` : ''}${it.item}${it.packaging ? ' — ' + it.packaging : ''}${it.promo
            ? ' <span class="free">(FREE — promo, paid by URC marketing)</span>'
            : Number(it.unit_price) === 0 ? ' <span class="free">(FREE — deal)</span>' : ''}</td>
          <td class="num">${P(it.unit_price)}</td>
          <td class="num">${Number(it.discount) ? P(it.discount) : '—'}</td>
          <td class="num">${P(Number(it.unit_price) - Number(it.discount || 0))}</td>
          <td class="num">${P(it.total_price)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <table class="totals"><tr>
      <td># Items: <b>${totalQty}</b></td>
      <td class="lab">TOTAL:</td><td class="val">${P(total)}</td></tr>
      <tr><td></td><td class="lab">DISCOUNT:</td><td class="val">${P(s.discount)}</td></tr>
      <tr><td></td><td class="lab">AMT. DUE:</td><td class="val">${P(total - Number(s.discount || 0))}</td></tr>
    </table>
    ${items.some((it) => it.promo) ? `
    <div style="margin-top:10px;border:1.5px solid #1e5c28;border-radius:6px;padding:8px 10px;
                font-size:11.5px;color:#1e5c28;font-weight:700">
      PROMO FREE GOODS: ${items.filter((it) => it.promo).reduce((a, it) => a + Number(it.qty), 0)}
      unit(s) on this receipt are free-goods promo items charged to <u>URC MARKETING</u> —
      NOT payable by the customer and NOT chargeable to ${settings.dr_company || 'ELISHEN AGRIVANCE'}.
    </div>` : ''}
    <div class="confirm">Received the above goods in good order and condition.
      Agreed and confirmed as above stated amount.</div>
    <div class="sigs">
      ${sigSlot({ caption: 'Issued by', role: 'issued', doc: 'DR', key: d.id, saved: sig.issued, self: true })}
      ${sigSlot({ caption: 'Checked by', role: 'checked', doc: 'DR', key: d.id, saved: sig.checked, self: true })}
      ${sigSlot({ caption: 'Delivered by', role: 'delivered', doc: 'DR', key: d.id, saved: sig.delivered,
        name: deliveredBy, who: 'staff' })}
      ${sigSlot({ caption: 'Name and signature of Customer / Date', role: 'customer', doc: 'DR', key: d.id,
        name: d.received_by || '', when: d.delivered_date || '', suggest: s.customer || '',
        saved: d.signature ? { name: d.received_by, signature: d.signature } : null })}
    </div>
    <div class="note">DR ${d.dr_no} · Invoice #${s.sales_no ?? ''} · Generated ${new Date().toLocaleString()} · Elishen Agrivance — Sales & Inventory Management System</div>
  </body></html>`;
  openPrintPreview(html, `DR_${d.dr_no}`);
}

// ---------- shared letterhead for business documents ----------
function docShell(title, subtitle, bodyHtml, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8">
  <title>${title} — Elishen Agrivance</title>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111; font-size: 12.5px; padding: 26px 30px; }
    header { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #1e5c28;
             padding-bottom: 12px; margin-bottom: 12px; }
    .lh-logo { font-family: Georgia, serif; font-size: 36px; font-weight: 800; letter-spacing: -2px; }
    .lh-logo .e { color: #1e5c28; } .lh-logo .s { color: #e3a71f; }
    .lh-name { font-size: 16px; font-weight: 800; letter-spacing: .08em; }
    .lh-sub { font-size: 10.5px; color: #555; margin-top: 2px; }
    h1 { font-size: 16px; margin: 8px 0 2px; text-transform: uppercase; letter-spacing: .06em; }
    .meta { color: #555; font-size: 11px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { background: #efefe9; border: 1px solid #999; padding: 6px 8px; font-size: 10.5px;
         text-transform: uppercase; letter-spacing: .04em; text-align: left; }
    td { border: 1px solid #bbb; padding: 6px 8px; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.total td { font-weight: 800; border-top: 2px solid #111; }
    h3 { font-size: 13px; margin: 14px 0 6px; }
    .note { margin-top: 14px; font-size: 10.5px; color: #666; }
    ${SIG_CSS}
    ${extraCss}
  </style></head><body>
    <header>
      <div class="lh-logo"><span class="e">E</span><span class="s">S</span></div>
      <div>
        <div class="lh-name">ELISHEN AGRIVANCE</div>
        <div class="lh-sub">Sales &amp; Inventory Management System · Universal Robina Dealer</div>
      </div>
    </header>
    <h1>${title}</h1>
    <div class="meta">${subtitle}</div>
    ${bodyHtml}
  </body></html>`;
}
const PD = (n) => Number(n || 0).toLocaleString(undefined,
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// small HTML escaper for printing injected names
if (typeof window.esc !== 'function') {
  window.esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Customer Information Sheet: a faithful reprint of the paper form ----------
// Values sit on ruled lines exactly where they sit on the printed template, so a
// filled sheet and a blank one are the same document.
async function printCIS(id) {
  const s = await api.get(`/api/cis/${id}`);
  const isFarm = s.sheet_type === 'farm';
  const noun = isFarm ? 'Farm' : 'Store';
  const E = (v) => esc(v ?? '');
  // a value on a ruled line; empty prints as a blank line to be filled by hand
  const line = (v, w = 'auto') => `<span class="ln" style="min-width:${w}">${E(v)}</span>`;
  const box = (on) => `<span class="bx">${on ? '&#10003;' : ''}</span>`;
  const parts = [['no', 'No.'], ['street', 'Street'], ['purok', 'Purok'], ['barangay', 'Barangay'],
    ['town', 'Town'], ['city', 'City'], ['province', 'Province']];
  const addrBlock = (prefix) => `
    <div class="addr">${parts.map(([k]) => `<span class="ln">${E(s[`${prefix}_${k}`])}</span>`).join('')}</div>
    <div class="addr caps">${parts.map(([, lab]) => `<span>${lab}</span>`).join('')}</div>`;
  const nameBlock = (prefix, n) => `
    <div class="nm"><span class="no">${n}.</span>
      <span class="ln">${E(s[`${prefix}_surname`])}</span>
      <span class="ln">${E(s[`${prefix}_given`])}</span>
      <span class="ln">${E(s[`${prefix}_middle`])}</span></div>
    <div class="nm caps"><span class="no"></span><span>Surname</span><span>Given Name</span><span>Middle Name</span></div>`;
  const spec = Array.isArray(s.specimens) ? s.specimens : [];
  const specSlot = (i) => {
    const sp = spec[i] || {};
    return `<div class="sp"><span class="no">${i + 1}.</span>
      <span class="ln sig">${sp.signature ? `<img src="${sp.signature}" alt="">` : ''}
        ${sp.name ? `<i>${E(sp.name)}</i>` : ''}</span></div>`;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8">
  <title>Customer Information Sheet — ${E(s.account_name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #000; font-size: 12px;
           padding: 22px 30px 30px; }
    .head { display: flex; gap: 16px; align-items: flex-start; }
    .logo { font-family: Georgia, "Times New Roman", serif; font-size: 52px; font-weight: 800;
            letter-spacing: -3px; line-height: .92; }
    .logo .e { color: #1e5c28; } .logo .s { color: #e3a71f; }
    .co { font-size: 19px; font-weight: 800; letter-spacing: .02em; }
    .co-sub { font-size: 10.5px; line-height: 1.5; margin-top: 1px; }
    h1 { text-align: center; font-size: 14px; letter-spacing: .04em; margin: 12px 0 16px;
         text-transform: uppercase; }
    .row { display: flex; align-items: flex-end; gap: 8px; margin-top: 9px; }
    .lab { font-weight: 700; white-space: nowrap; }
    .ln { flex: 1; border-bottom: 1px solid #000; padding: 0 4px 1px; min-height: 15px;
          display: inline-block; }
    .bx { display: inline-block; width: 17px; height: 15px; border: 1px solid #000;
          text-align: center; line-height: 14px; margin: 0 2px; }
    .addr { display: grid; grid-template-columns: .55fr .9fr .7fr 1fr .8fr .8fr .9fr; gap: 6px; }
    .addr.caps { margin-top: 1px; }
    .caps span { font-size: 9.5px; text-align: center; border: 0; }
    .nm { display: grid; grid-template-columns: 16px 1fr 1fr 1fr; gap: 6px; margin-top: 8px;
          align-items: end; }
    .nm.caps { margin-top: 1px; }
    .nm.caps span { font-size: 9.5px; text-align: center; }
    .no { font-weight: 700; }
    .sec { font-weight: 700; margin-top: 12px; }
    .sp { display: grid; grid-template-columns: 16px 1fr; gap: 6px; align-items: end; margin-top: 12px; }
    .sp .sig { min-height: 26px; position: relative; }
    .sp .sig img { max-height: 24px; max-width: 150px; vertical-align: bottom; }
    .sp .sig i { font-size: 9.5px; color: #333; font-style: normal; margin-left: 6px; }
    .specs { display: grid; grid-template-columns: 1fr 1fr; gap: 0 34px; }
    .certify { margin-top: 26px; font-size: 12px; }
    .final { margin-top: 26px; text-align: center; }
    .final .ln { display: block; max-width: 340px; margin: 0 auto; min-height: 30px; }
    .final .ln img { max-height: 28px; }
    .final small { display: block; margin-top: 3px; font-size: 10.5px; }
    .foot { margin-top: 20px; font-size: 9px; color: #555; text-align: right; }
    @media print { body { padding: 10mm 12mm; } .foot { color: #888; } }
    @page { margin: 10mm; }
  </style></head><body>
    <div class="head">
      <div class="logo"><span class="e">E</span><span class="s">S</span></div>
      <div>
        <div class="co">ELISHEN AGRIVANCE</div>
        <div class="co-sub">Gracepatch, Blk 45 Alviola Village, Democrito Plaza Avenue,<br>
          Butuan City, Philippines 8600<br>Mobile No. 09951039419</div>
      </div>
    </div>
    <h1>Customer Information Sheet</h1>

    <div class="row"><span class="lab">Account Name</span><span>:</span>${line(s.account_name)}</div>
    <div class="row"><span class="lab">${noun} established on</span>${line(s.established_on)}
      <span class="lab">Space Rented</span>${box(s.space_tenure === 'rented')}
      <span class="lab">Owned</span>${box(s.space_tenure === 'owned')}</div>

    <div class="row"><span class="lab">Complete ${noun} Address:</span></div>
    ${addrBlock('addr')}

    <div class="row"><span class="lab">Contact Number:</span>${line(s.contact_no)}</div>

    <div class="sec">Owner's Name:</div>
    ${nameBlock('owner1', 1)}
    ${nameBlock('owner2', 2)}

    <div class="sec">Residence Address:</div>
    ${addrBlock('res')}
    <div class="row"><span class="lab">Residential Owned</span>${box(s.res_tenure === 'owned')}
      <span class="lab">Rented</span>${box(s.res_tenure === 'rented')}</div>

    ${isFarm ? '' : `
      <div class="sec">If corporation / cooperative</div>
      <div class="sec" style="font-weight:400">Store Manager/OIC Name</div>
      ${nameBlock('mgr1', 1)}
      ${nameBlock('mgr2', 2)}
      <div class="sec" style="font-weight:400">Complete Address:</div>
      <div class="row"><span class="no">1.</span>${line(s.mgr1_address)}</div>
      <div class="row"><span class="no">2.</span>${line(s.mgr2_address)}</div>`}

    <div class="row"><span class="lab">Terms:</span>${line(s.terms, '150px')}
      <span class="lab">Credit</span>${box(s.terms_credit)}
      <span class="lab">Check</span>${box(s.terms_check)}</div>

    <div class="row"><span class="lab">Bank Name:</span>${line(s.bank_name)}
      <span class="lab">Branch:</span>${line(s.branch)}</div>

    <div class="sec">Signature Specimen:</div>
    <div class="specs">
      <div>${specSlot(0)}${specSlot(1)}${specSlot(2)}</div>
      <div>${specSlot(3)}${specSlot(4)}${specSlot(5)}</div>
    </div>

    <p class="certify">This is to certify that all information given is true and correct.</p>
    <div class="final">
      <span class="ln">${s.certified_signature ? `<img src="${s.certified_signature}" alt="">` : ''}</span>
      <small>${E(s.certified_name)}</small>
      <small>Customer's Signature Over Printed Name</small>
    </div>
    <div class="foot">Sheet #${s.id}${s.created_by ? ` · filed by ${E(s.created_by)}` : ''}
      · printed ${new Date().toLocaleString()}</div>
  </body></html>`;
  openPrintPreview(html, `CIS_${String(s.account_name || 'sheet').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_')}`);
}
window.printCIS = printCIS;

// ---------- Statement of Account: charges, payments, and totals ----------
async function printSOA(customerName) {
  const [sales, payments, customers, advances] = await Promise.all([
    api.get(`/api/sales?customer=${encodeURIComponent(customerName)}`),
    api.get('/api/payments'), api.get('/api/customers'), api.get('/api/customer_advances'),
  ]);
  const key = customerName.trim().toUpperCase();
  const mine = sales.filter((s) => s.customer.trim().toUpperCase() === key
    && !String(s.status).toLowerCase().includes('cancel'));
  const cust = customers.find((c) => c.name.trim().toUpperCase() === key);
  const allPaymentsMine = payments.filter((p) => mine.some((s) => s.id === p.sale_id));
  const paymentsMine = allPaymentsMine.filter((p) =>
    !String(p.notes || '').startsWith('Settled from credit held on the account')
    && !String(p.notes || '').startsWith('Applied from advance'));
  const accountPayments = advances.filter((a) => String(a.customer).trim().toUpperCase() === key
    && (a.cheque_status == null || a.cheque_status === 'Good'));
  if (!mine.length && !accountPayments.length) {
    alert('No invoices or cleared account payments found for this customer.');
    return;
  }
  const totalCharges = mine.reduce((sum, s) => sum + Number(s.total), 0);
  const totalPayments = paymentsMine.reduce((sum, p) => sum + Number(p.amount), 0)
    + accountPayments.reduce((sum, a) => sum + Number(a.amount), 0);
  const balanceDue = totalCharges - totalPayments;
  const events = [];
  mine.forEach((s) => events.push({
    date: String(s.date).slice(0, 10), sort: 0,
    transaction: `Charge — invoice ${s.sales_no}${s.term ? ` (${s.term})` : ''}`,
    reference: s.sales_no, charge: Number(s.total), payment: 0,
  }));
  paymentsMine.forEach((p) => events.push({
    date: String(p.date).slice(0, 10), sort: 1,
    transaction: 'Payment received', reference: p.or_no ? `OR ${p.or_no}` : '—',
    charge: 0, payment: Number(p.amount), signature: p.signature || null,
    payer_name: p.payer_name || null,
  }));
  accountPayments.forEach((a) => events.push({
    date: String(a.date).slice(0, 10), sort: 1,
    transaction: 'Payment on account', reference: a.or_no ? `OR ${a.or_no}` : '—',
    charge: 0, payment: Number(a.amount),
  }));
  events.sort((a, b) => a.date.localeCompare(b.date) || a.sort - b.sort);
  const rows = events.map((e) => {
    const amount = e.charge || e.payment;
    let row = `<tr><td>${e.date}</td><td>${esc(e.transaction)}</td><td>${esc(e.reference)}</td>
      <td class="num">${e.charge ? PD(e.charge) : ''}</td>
      <td class="num">${e.payment ? PD(e.payment) : ''}</td>
      <td class="num">${PD(amount)}</td></tr>`;
    if (e.signature) {
      row += `<tr><td colspan="6" style="padding:8px 10px;background:#f9f9f9">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="min-width:120px;font-size:12px;color:#333"><strong>Payer:</strong>
            ${esc(e.payer_name || '')}</div>
          <div style="flex:1"><img src="${e.signature}" style="height:48px;" alt="signature"></div>
        </div></td></tr>`;
    }
    return row;
  }).join('');
  const today = new Date().toISOString().slice(0, 10);
  // the acknowledgement belongs to this customer's statement as of today
  const soaKey = `${key}|${localDay()}`;
  const soaSig = await loadDocSigs('SOA', soaKey);
  const html = docShell('Statement of Account',
    `Customer: <b>${customerName}</b>${cust?.address ? ' · ' + cust.address : ''}` +
    `${cust?.contact_no ? ' · ' + cust.contact_no : ''} · As of ${today}`,
    `<table>
      <thead><tr><th>Date</th><th>Transaction</th><th>Reference</th>
        <th style="width:95px">Charge</th><th style="width:95px">Payment</th>
        <th style="width:100px">Total amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">No charges or payments recorded.</td></tr>'}
        <tr class="total"><td colspan="3">TOTALS</td>
          <td class="num">${PD(totalCharges)}</td><td class="num">${PD(totalPayments)}</td>
          <td class="num">${PD(balanceDue)}</td></tr>
      </tbody>
    </table>
    <div class="note"><b>How to read this:</b> Charge is the amount billed. Payment is the amount received.
      Total amount shows the charge or payment for that row. The final row totals charges, payments,
      and the remaining balance due.</div>
    <div class="note">Please make payments to ELISHEN AGRIVANCE and request an Official Receipt.
      Kindly disregard amounts already paid but not yet reflected. Generated ${new Date().toLocaleString()}.</div>
    <div class="recvblock">
      <div class="recvby">
        <div class="recvlabel">Date: <span class="recvfill" id="soaAckDate">${soaSig.received
          ? esc(sigStamp(soaSig.received.signed_at).slice(0, 10)) : ''}</span></div>
        <div class="recvlabel recvack">Received and acknowledged by:</div>
        ${sigSlot({ caption: 'Signature over printed name / position', role: 'received',
          doc: 'SOA', key: soaKey, saved: soaSig.received,
          date: '#soaAckDate', label: 'Printed name / position', suggest: customerName })}
      </div>
    </div>`,
    // Bottom right, and kept whole: a statement is handed over and signed, so the
    // acknowledgement must never be orphaned onto a page of its own.
    `.recvblock { display: flex; justify-content: flex-end; margin-top: 46px;
       page-break-inside: avoid; }
     .recvby { width: 340px; }
     .recvlabel { font-size: 12px; margin-bottom: 6px; }
     .recvfill { display: inline-block; width: 210px; border-bottom: 1px solid #111; }
     .recvack { margin-top: 14px; margin-bottom: 0; font-weight: 700; }`);
  openPrintPreview(html, `SOA_${customerName.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_')}`);
}

// ---------- Dealer / retail price list per URC tier ----------
async function printPriceList(tier) {
  const items = await api.get('/api/items');
  const label = tier === 'cod' ? 'COD Dealer' : tier === 'outright' ? 'Outright Dealer' : 'Retail (SRP)';
  const priceOf = (i) => {
    const srp = Number(i.sales_price) || 0;
    if (tier === 'srp' || !Number(i.outright_rate)) return srp;
    let p = srp * (1 - Number(i.outright_rate));
    if (tier === 'cod') p *= (1 - (Number(i.cod_rate) || 0));
    return p;
  };
  const groups = {};
  items.filter((i) => Number(i.sales_price) > 0)
    .forEach((i) => (groups[i.category || 'Others'] ??= []).push(i));
  const body = Object.keys(groups).sort().map((cat) => `
    <h3>${cat}</h3>
    <table><thead><tr><th>Product</th><th style="width:130px">Packaging</th>
      <th style="width:80px">Unit</th><th style="width:110px">Price</th></tr></thead>
    <tbody>${groups[cat].map((i) => `<tr>
      <td>${i.name}${i.deal ? ` <b>(deal ${i.deal})</b>` : ''}</td>
      <td>${i.packaging ?? ''}</td><td>${i.uom ?? ''}</td>
      <td class="num">${PD(priceOf(i))}</td></tr>`).join('')}</tbody></table>`).join('');
  const html = docShell(`Price List — ${label}`,
    `Effective ${new Date().toISOString().slice(0, 10)} · Prices subject to change without prior notice`,
    body + '<div class="note">RobiChem deal items include free goods per the stated deal, paid by URC marketing.</div>');
  openPrintPreview(html, `PriceList_${label.replace(/[^\w]+/g, '_')}`);
}

// ---------- Commission payout sheet per sales rep ----------
async function printCommissionSheet(repId, from, to) {
  const [reps, sales] = await Promise.all([api.get('/api/sales_reps'), api.get('/api/sales')]);
  const rep = reps.find((r) => r.id === Number(repId));
  if (!rep) { alert('Select a sales rep first.'); return; }
  const mine = sales.filter((s) => s.sales_rep_id === rep.id
    && !String(s.status).toLowerCase().includes('cancel')
    && (!from || String(s.date).slice(0, 10) >= from)
    && (!to || String(s.date).slice(0, 10) <= to));
  const rate = Number(rep.commission_rate) || 0;
  const rateFrac = rate > 1 ? rate / 100 : rate;      // stored as % or fraction — accept both
  const total = mine.reduce((a, s) => a + Number(s.total), 0);
  const paid = mine.reduce((a, s) => a + Number(s.amount_paid), 0);
  const html = docShell('Commission Payout Sheet',
    `Sales rep: <b>${rep.name}</b> · Rate: ${(rateFrac * 100).toFixed(2)}% ·
     Period: ${from || 'start'} to ${to || 'today'}`,
    `<table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th>
      <th style="width:100px">Invoice total</th><th style="width:100px">Paid to date</th>
      <th style="width:100px">Commission</th></tr></thead>
    <tbody>${mine.map((s) => `<tr>
      <td>${String(s.date).slice(0, 10)}</td><td>${s.sales_no}</td><td>${s.customer}</td>
      <td class="num">${PD(s.total)}</td><td class="num">${PD(s.amount_paid)}</td>
      <td class="num">${PD(Number(s.total) * rateFrac)}</td></tr>`).join('')
      || '<tr><td colspan="6">No sales in this period.</td></tr>'}
      <tr class="total"><td colspan="3">TOTALS (${mine.length} invoice${mine.length === 1 ? '' : 's'})</td>
        <td class="num">${PD(total)}</td><td class="num">${PD(paid)}</td>
        <td class="num">${PD(total * rateFrac)}</td></tr>
    </tbody></table>
    <div class="note">Commission computed on invoice totals for the period. Collections shown for reference —
      apply the company's payout policy (on sale vs. on collection) before releasing.
      Generated ${new Date().toLocaleString()}.</div>`);
  openPrintPreview(html, `Commission_${rep.name.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_')}`);
}

// ---------- Sales book CSV (BIR-examination style; accountant-friendly) ----------
async function exportSalesBookCSV(from, to) {
  const sales = (window._salesForExport || await api.get('/api/sales'))
    .filter((s) => !String(s.status).toLowerCase().includes('cancel')
      && (!from || String(s.date).slice(0, 10) >= from)
      && (!to || String(s.date).slice(0, 10) <= to))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.sales_no.localeCompare(b.sales_no));
  if (!sales.length) { alert('No sales in that range.'); return; }
  const esc2 = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Date', 'Invoice No', 'Customer', 'VAT status', 'Subtotal', 'Tax', 'Discount',
     'Total', 'Amount paid', 'Balance', 'Status', 'Term'].join(','),
    ...sales.map((s) => [
      String(s.date).slice(0, 10), esc2(s.sales_no), esc2(s.customer),
      Number(s.tax_amount) > 0 ? 'VATable' : 'VAT-exempt',
      s.subtotal, s.tax_amount, s.discount, s.total, s.amount_paid,
      (Number(s.total) - Number(s.amount_paid)).toFixed(2),
      esc2(s.status), esc2(s.term || ''),
    ].join(',')),
  ];
  const csv = '﻿' + rows.join('\r\n');   // BOM so Excel reads UTF-8 (₱, ñ) correctly
  const fname = `SalesBook_${from || 'start'}_to_${to || 'today'}.csv`.replace(/[^\w.\-]+/g, '_');
  if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    const { Filesystem, Share } = Capacitor.Plugins;
    await Filesystem.writeFile({ path: fname, data: csv, directory: 'CACHE', encoding: 'utf8' });
    const { uri } = await Filesystem.getUri({ path: fname, directory: 'CACHE' });
    await Share.share({ title: fname, files: [uri] });
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = fname;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
}

// ---------- Daily Time Record + salary sheet per employee ----------
async function printDTR(name) {
  const data = window._dtrData;
  const s = data && data.staff.find((x) => x.name === name);
  if (!s) { alert('Open the Monitoring page first.'); return; }
  // a DTR's signatures belong to that employee's record for that period
  const dtrKey = `${name}|${data.from}|${data.to}`;
  const dtrSig = await loadDocSigs('DTR', dtrKey);
  const html = docShell('Daily Time Record',
    `Employee: <b>${name}</b> (${s.roles}) · Period: ${data.from} to ${data.to} ·
     Daily rate: ${PD(s.rate)}`,
    `<table><thead><tr><th>Date</th><th>Time in</th><th>Time out</th>
      <th style="width:80px">Hours</th><th>Remarks</th></tr></thead>
    <tbody>${s.days.map((d) => `<tr>
      <td>${d.date}</td><td>${d.in}</td><td>${d.out}</td>
      <td class="num">${d.hours}</td>
      <td>${d.incomplete ? 'incomplete punches' : ''}</td></tr>`).join('')
      || '<tr><td colspan="5">No attendance in this period.</td></tr>'}
      <tr class="total"><td>TOTAL</td><td>${s.present} day(s)</td><td></td>
        <td class="num">${s.hoursTot}</td><td></td></tr>
    </tbody></table>
    <h3>Salary computation</h3>
    <table><thead><tr><th>Days present</th><th>Daily rate</th><th>Gross salary</th>
      <th>Deductions (manual)</th><th>NET PAY</th></tr></thead>
      <tbody><tr><td class="num">${s.present}</td><td class="num">${PD(s.rate)}</td>
        <td class="num"><b>${PD(s.salary)}</b></td><td></td><td></td></tr></tbody></table>
    <div style="display:flex;gap:40px;margin-top:36px;page-break-inside:avoid">
      ${sigSlot({ caption: "Employee's signature", role: 'employee', name, who: 'staff',
        doc: 'DTR', key: dtrKey, saved: dtrSig.employee })}
      ${sigSlot({ caption: 'Approved by (Admin)', role: 'approver', self: true,
        doc: 'DTR', key: dtrKey, saved: dtrSig.approver })}
    </div>
    <div class="note">I certify on my honor that the above is a true and correct report of the
      hours of work performed, verified against the recorded attendance photos and locations.
      Generated ${new Date().toLocaleString()}.</div>`);
  openPrintPreview(html, `DTR_${name.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_')}`);
}

// ---------- payslip from a saved payroll run ----------
async function printPayslip(runId) {
  const r = (window._payrollRuns || []).find((x) => x.id === runId);
  if (!r) { alert('Open the Monitoring page first.'); return; }
  // a payroll run is a stored record, so its signatures come back on every reprint
  const sig = Object.fromEntries((await api.get(`/api/doc_signatures?doc_type=PAYSLIP&doc_id=${r.id}`)
    .catch(() => [])).map((x) => [x.role, x]));
  const ded = Number(r.sss) + Number(r.philhealth) + Number(r.pagibig) + Number(r.other_ded);
  const html = docShell('Payslip',
    `Employee: <b>${r.user_name}</b> · Period: ${String(r.period_from).slice(0, 10)} to
     ${String(r.period_to).slice(0, 10)} · Run #${r.id} of ${new Date(r.created_at).toLocaleDateString()}`,
    `<table><thead><tr><th>Earnings</th><th style="width:130px">Amount</th></tr></thead>
      <tbody>
        <tr><td>DTR pay — ${Number(r.days)} day(s) × ${PD(r.daily_rate)} (${Number(r.hours)} hrs)</td>
          <td class="num">${PD(r.gross_dtr)}</td></tr>
        <tr><td>Commission</td><td class="num">${PD(r.commission)}</td></tr>
        <tr class="total"><td>GROSS PAY</td>
          <td class="num">${PD(Number(r.gross_dtr) + Number(r.commission))}</td></tr>
      </tbody></table>
    <table><thead><tr><th>Deductions</th><th style="width:130px">Amount</th></tr></thead>
      <tbody>
        <tr><td>SSS</td><td class="num">${PD(r.sss)}</td></tr>
        <tr><td>PhilHealth</td><td class="num">${PD(r.philhealth)}</td></tr>
        <tr><td>Pag-IBIG</td><td class="num">${PD(r.pagibig)}</td></tr>
        <tr><td>Other</td><td class="num">${PD(r.other_ded)}</td></tr>
        <tr class="total"><td>TOTAL DEDUCTIONS</td><td class="num">${PD(ded)}</td></tr>
      </tbody></table>
    <table><tbody><tr class="total"><td>NET PAY</td>
      <td class="num" style="width:130px;font-size:15px">${PD(r.net)}</td></tr></tbody></table>
    ${r.notes ? `<div class="note">Notes: ${r.notes}</div>` : ''}
    <div style="display:flex;gap:40px;margin-top:36px;page-break-inside:avoid">
      ${sigSlot({ caption: 'Received by (Employee)', role: 'employee', doc: 'PAYSLIP', key: r.id,
        saved: sig.employee, name: r.user_name, who: 'staff' })}
      ${sigSlot({ caption: 'Approved by (Admin)', role: 'approver', doc: 'PAYSLIP', key: r.id,
        saved: sig.approver, self: true })}
    </div>
    <div class="note">Generated ${new Date().toLocaleString()} · Hours verified against recorded
      attendance (photos + geotags) · Deductions entered manually per current statutory tables.</div>`);
  openPrintPreview(html, `Payslip_${r.user_name.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_')}_${String(r.period_to).slice(0, 10)}`);
}

// injects the buttons beside the page title (idempotent — safe on every render)
function injectPrintButton() {
  if (NO_PRINT_VIEWS.includes(window._view)) return;
  const h2 = document.querySelector('#main h2');
  if (!h2 || h2.querySelector('.printbtn')) return;

  const pdfBtn = document.createElement('button');
  pdfBtn.type = 'button';
  pdfBtn.className = 'mini printbtn';
  pdfBtn.textContent = 'Save as PDF';
  pdfBtn.onclick = () => saveReportPdf(pdfBtn);
  h2.appendChild(pdfBtn);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mini printbtn';
  btn.textContent = 'Print report';
  btn.onclick = printReport;
  h2.appendChild(btn);
}

// expose convenience globals and announce readiness so other scripts can bind
try {
  window.printReport = printReport;
  window.printSection = printSection;
  window.saveReportPdf = saveReportPdf;
  window.printDeliveryReceipt = printDeliveryReceipt;
  window.injectPrintButton = injectPrintButton;
  document.dispatchEvent(new Event('printReady'));
} catch (e) {
  // ignore in constrained runtimes
}
