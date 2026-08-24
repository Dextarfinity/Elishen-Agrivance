// View renderers. Each returns an HTML string; wire-up happens in app.js / crud.js.
const fmt = (n) => (n == null ? '-' :
  (window._currency || '') + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// sentinel for the Receivables customer picker: show every customer's collectibles
// at once rather than one at a time. Not a customer_key, so it can never collide.
const AR_ALL = '__all__';
window.AR_ALL = AR_ALL;
const d10 = (v) => (v ? esc(String(v).slice(0, 10)) : '-');

// ---- product aliases: the shorthand the warehouse writes on order slips ----
// "SI 2 (50KG)" instead of "Supremo Infinity 2 - Chick Grower Crumble". Items
// with no alias (RobiChem and the rest) simply keep showing their full name.
const aliasOf = (i) => String(i?.alias ?? '').trim();
// short, for tight columns and dropdowns
const itemLabel = (i) => aliasOf(i) || String(i?.name ?? '');
// alias first, full name after — for pickers and forms where both help
const itemLabelFull = (i) => (aliasOf(i) ? `${aliasOf(i)} — ${i.name}` : String(i?.name ?? ''));
// alias as a badge with the full name beside it (HTML, already escaped)
const itemLabelHtml = (i) => (aliasOf(i)
  ? `<b>${esc(aliasOf(i))}</b><br><small style="color:var(--ink-2)">${esc(i.name ?? '')}</small>`
  : esc(i?.name ?? ''));
window.aliasOf = aliasOf;
window.itemLabel = itemLabel;
window.itemLabelFull = itemLabelFull;
window.itemLabelHtml = itemLabelHtml;

// ---- paginated table renderer (shared by every list in the system) ----
window._pg = window._pg || {};        // per-table pagination state (survives refreshes)
window._tblCache = {};                // rows/cols per table key, for repaging + print

function tableInnerHTML(rows, cols) {
  return `<table>
    <thead><tr>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${cols.map((c) =>
      `<td class="${c.num ? 'num' : ''}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('')}
    </tbody></table>`;
}
// full, unpaginated table (used by print/PDF so reports always carry every row)
window.fullTableHTML = (rows, cols) => tableInnerHTML(rows, cols);

const _stripDiv = document.createElement('div');
function rowSearchText(r, cols) {
  return cols.map((c) => {
    const v = c.render ? c.render(r) : (r[c.key] ?? '');
    _stripDiv.innerHTML = String(v);
    return _stripDiv.textContent;
  }).join(' ').toLowerCase();
}

function tableShell(key) {
  const { rows: allRows, cols, extra } = window._tblCache[key];
  const pg = window._pg[key] || (window._pg[key] = { page: 0, size: 50, q: '', from: '', to: '' });
  pg.q = pg.q ?? ''; pg.from = pg.from ?? ''; pg.to = pg.to ?? '';

  // which column carries the row's date (for the range filter)
  const dateCol = cols.find((c) => c.key && String(c.key).toLowerCase().includes('date'));
  const rawDate = (r) => dateCol ? String(r[dateCol.key] ?? '').slice(0, 10) : '';

  let rows = allRows;
  if (pg.q) {
    const q = pg.q.toLowerCase();
    rows = rows.filter((r) => rowSearchText(r, cols).includes(q));
  }
  if (dateCol && (pg.from || pg.to)) {
    rows = rows.filter((r) => {
      const d = rawDate(r);
      if (!d) return true;                       // rows without a raw date pass through
      return (!pg.from || d >= pg.from) && (!pg.to || d <= pg.to);
    });
  }

  // Every section carries its own search and its own print button. The date range
  // only appears where the rows actually have a date to filter on.
  const filterBar = `
    <div class="tblfilter">
      <input type="search" data-pgq="${key}" value="${esc(pg.q)}"
        placeholder="Search this section…">
      ${dateCol && allRows.length > 1 ? `
        <label>From <input type="date" data-pgfrom="${key}" value="${pg.from}"></label>
        <label>To <input type="date" data-pgto="${key}" value="${pg.to}"></label>` : ''}
      ${(pg.q || pg.from || pg.to) ? `
        <button type="button" class="mini" data-pgclear="${key}">Clear</button>
        <span class="tblmatch">${rows.length} of ${allRows.length} match</span>` : ''}
      ${extra || ''}
      <button type="button" class="mini secprint" data-secprint="${key}"
        title="Print this section">&#128424;<span class="secprint-t"> Print</span></button>
    </div>`;

  const size = pg.size === 'All' ? Math.max(rows.length, 1) : pg.size;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  if (pg.page >= pages) pg.page = pages - 1;
  const slice = rows.slice(pg.page * size, pg.page * size + size);
  const pager = rows.length > 25 ? `
    <div class="pgbar">
      <span>${rows.length} rows</span>
      <label>Show <select data-pgsize="${key}">
        ${[25, 50, 100, 'All'].map((s) => `<option ${String(pg.size) === String(s) ? 'selected' : ''}>${s}</option>`).join('')}
      </select> per page</label>
      <span class="pgnav">
        <button type="button" class="mini" data-pgprev="${key}" ${pg.page === 0 ? 'disabled' : ''}>‹ Prev</button>
        <span>Page ${pg.page + 1} of ${pages}</span>
        <button type="button" class="mini" data-pgnext="${key}" ${pg.page >= pages - 1 ? 'disabled' : ''}>Next ›</button>
      </span>
    </div>` : '';
  return `<div class="tablewrap" data-tbl="${key}">${filterBar}${tableInnerHTML(slice, cols)}${pager}</div>`;
}

// opts.extra is a control the calling view wants beside this table's own search
// and date range -- kept in the cache so repaging and the soft refresh keep it.
function table(rows, cols, opts = {}) {
  if (!rows.length) return '<p class="empty">No records yet.</p>';
  window._tblSeq = (window._tblSeq || 0) + 1;
  const key = `${window._view}:${window._tblSeq}`;
  window._tblCache[key] = { rows, cols, extra: opts.extra || '' };
  return tableShell(key);
}

const statusBadge = (s) => `<span class="badge ${s === 'In Stock' ? 'green' : s === 'Low Stock' ? 'amber' : 'red'}">${esc(s)}</span>`;

// plain-language description of an audit_log action (shared: Monitoring + Settings)
function describeAudit(a) {
  const m = String(a).match(/^(POST|PUT|DELETE) \/([\w-]+)/);
  if (!m) return a;
  if (/^POST \/sales\/\d+\/payments/.test(a)) return 'Recorded a payment on a sale';
  if (/^POST \/sales\/\d+\/deliveries/.test(a)) return 'Created a delivery receipt';
  if (/\/full$/.test(a)) return 'Edited a sale (full edit)';
  const verb = m[1] === 'POST' ? 'Added' : m[1] === 'PUT' ? 'Edited' : 'Deleted';
  const nice = {
    sales: 'a sale', payments: 'a payment', deliveries: 'a delivery receipt',
    purchases: 'a purchase line', items: 'an item', customers: 'a customer',
    claims: 'a URC claim', users: 'a user account', attendance: 'attendance',
    expenses: 'an expense', accounts: 'an account', customer_tier: 'a customer pricing tier',
    manual_inventory: 'a stock batch', produce: 'a production run', settings: 'settings',
    recurring_expenses: 'a recurring expense', sales_reps: 'a sales rep',
    vendors: 'a vendor', bom_lines: 'a BOM line', profit_goals: 'a profit goal',
    change_pin: 'their own PIN', notifications: 'notifications',
    cis: 'a customer information sheet',
  }[m[2]] || m[2];
  return `${verb} ${nice}`;
}

// ---- tiny chart helpers (self-contained, no libraries) ----
// horizontal bars: identity on the left, magnitude as bar + direct label
function hbar(rows, { label, value, fmtV = (v) => v, color = 'var(--primary)' }) {
  if (!rows.length) return '<p class="empty">No data yet.</p>';
  const max = Math.max(...rows.map((r) => Number(r[value]) || 0), 1);
  return `<div class="hbar">${rows.map((r) => `
    <div class="hbar-row">
      <div class="hbar-label" title="${esc(r[label])}">${esc(r[label])}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(2, (Number(r[value]) || 0) / max * 100)}%; background:${r._color || color}"></div></div>
      <div class="hbar-val">${fmtV(Number(r[value]) || 0)}</div>
    </div>`).join('')}</div>`;
}
// vertical columns (months/days): magnitude over an ordered axis
function vcols(values, labels, { fmtV = (v) => v } = {}) {
  const max = Math.max(...values, 1);
  return `<div class="vcols">${values.map((v, i) => `
    <div class="vcol" title="${esc(labels[i])}: ${fmtV(v)}">
      <div class="vcol-val">${v ? fmtV(v) : ''}</div>
      <div class="vcol-bar" style="height:${Math.max(v ? 4 : 1, v / max * 100)}%"></div>
      <div class="vcol-lab">${esc(labels[i])}</div>
    </div>`).join('')}</div>`;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const views = {
  // ================= Dashboard =================
  async dashboard() {
    const range = window._dashRange;
    const rangeQS = range ? `?from=${range.from}&to=${range.to}` : '';
    const [summary, stock, ar, rangeData] = await Promise.all([
      api.get('/api/reports/monthly_summary'),
      api.get('/api/reports/item_stock'),
      api.get('/api/reports/ar_by_customer'),
      api.get('/api/reports/range_summary' + rangeQS),
    ]);
    const curMonth = summary.at(-1) || { total_income: 0, total_expenses: 0, profit_loss: 0 };
    const income = range ? rangeData.income : curMonth.total_income;
    const expensesV = range ? rangeData.expenses : curMonth.total_expenses;
    const pl = range ? rangeData.profit_loss : curMonth.profit_loss;
    const margin = Number(income) ? (Number(pl) / Number(income) * 100).toFixed(2) : '0.00';
    const low = stock.filter((s) => s.status !== 'In Stock');
    const arTotal = ar.reduce((a, r) => a + Number(r.balance), 0);
    const scope = range ? '(period)' : '(all time)';
    const rangeDetail = `
      <div class="twocol">
        <div>
          <h3>Income summary by category ${scope}</h3>
          ${table(rangeData.income_by_category, [
            { key: 'category', label: 'Category' },
            { key: 'sales', label: 'Sales', num: 1 },
            { key: 'total', label: 'Total', num: 1, render: (r) => fmt(r.total) },
          ])}
          <h3>Income by item ${scope}</h3>${table(rangeData.income_by_item, [
            { key: 'name', label: 'Item' },
            { key: 'qty', label: 'Qty', num: 1 },
            { key: 'revenue', label: 'Revenue', num: 1, render: (r) => fmt(r.revenue) },
            { key: 'gross_profit', label: 'Profit (vs capital)', num: 1, render: (r) => fmt(r.gross_profit) },
          ])}
        </div>
        <div>
          <h3>Expense summary by category ${scope}</h3>
          ${table(rangeData.expenses_by_category, [
            { key: 'category', label: 'Category' },
            { key: 'net', label: 'Net expense', num: 1, render: (r) => fmt(r.net) },
            { key: 'tax', label: 'Tax', num: 1, render: (r) => fmt(r.tax) },
            { key: 'total', label: 'Total', num: 1, render: (r) => fmt(r.total) },
          ])}
        </div>
      </div>`;
    // money figures (income, profit, margins) are the owners' business —
    // staff get an operational dashboard: stock alerts + collections focus
    const admin = isAdmin();
    return `
      <h2>Dashboard</h2>
      ${admin ? `<form id="rangeForm" class="rangeform">
        <label>Start period <input type="date" name="from" value="${range?.from ?? ''}"></label>
        <label>End period <input type="date" name="to" value="${range?.to ?? ''}"></label>
        <button type="submit" class="mini add">Apply</button>
        ${range ? '<button type="button" class="mini" id="rangeClear">Clear</button>' : ''}
      </form>
      <div class="cards">
        <div class="card green"><span>Income ${range ? '(period)' : '(this month)'}</span><strong>${fmt(income)}</strong></div>
        <div class="card red"><span>Expenses ${range ? '(period)' : '(this month)'}</span><strong>${fmt(expensesV)}</strong></div>
        <div class="card ${Number(pl) >= 0 ? 'green' : 'red'}"><span>Profit / Loss</span><strong>${fmt(pl)}</strong></div>
        <div class="card ${Number(margin) >= 0 ? 'green' : 'red'}"><span>Profit margin</span><strong>${margin}%</strong></div>
        <div class="card green"><span>Gross profit vs capital ${scope}</span><strong>${fmt(rangeData.gross_profit)}</strong></div>
        <div class="card amber"><span>Receivables outstanding</span><strong>${fmt(arTotal)}</strong></div>
      </div>
      ${rangeDetail}
      <h3>Monthly summary</h3>
      ${table(summary.slice(-12).reverse(), [
        { key: 'month', label: 'Month' },
        { key: 'total_income', label: 'Income', num: 1, render: (r) => fmt(r.total_income) },
        { key: 'total_expenses', label: 'Expenses', num: 1, render: (r) => fmt(r.total_expenses) },
        { key: 'profit_loss', label: 'P/L', num: 1, render: (r) => fmt(r.profit_loss) },
      ])}` : `
      <div class="cards">
        <div class="card amber"><span>Receivables outstanding</span><strong>${fmt(arTotal)}</strong></div>
        <div class="card ${low.length ? 'red' : 'green'}"><span>Stock alerts</span><strong>${low.length}</strong></div>
      </div>`}
      <h3>Stock alerts (${low.length})</h3>
      ${table(low.slice(0, 15), [
        { key: 'name', label: 'Item' },
        { key: 'on_hand', label: 'On hand', num: 1 },
        { key: 'minimum_stock', label: 'Min', num: 1 },
        { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
      ])}
      ${low.length > 15 ? `<p class="empty">…and ${low.length - 15} more — see Inventory or run a Stock Take.</p>` : ''}`;
  },

  // ================= New Sale (POS) =================
  async newsale() {
    const [items, reps, accounts, customers, settings, arList, itemsFull, purchAll] = await Promise.all([
      api.get('/api/reports/item_stock'), api.get('/api/sales_reps'),
      api.get('/api/accounts'), api.get('/api/customers'), api.get('/api/settings'),
      api.get('/api/reports/ar_by_customer'), api.get('/api/items'), api.get('/api/purchases'),
    ]);
    // selling-side deal (distributor → dealer, free goods paid by URC marketing)
    const ddMap = Object.fromEntries(itemsFull.map((i) => [i.id, i.price_breakdown?.dealer_deal || null]));
    // the per-bag COD/Term discounts come off the items table rather than the stock
    // report, so the sale page prices correctly even before the API is restarted
    const bagMap = Object.fromEntries(itemsFull.map((i) =>
      [i.id, { cod: Number(i.cod_discount) || 0, term: Number(i.term_discount) || 0 }]));
    items.forEach((i) => {
      i.dealer_deal = ddMap[i.id];
      i.cod_discount = Number(bagMap[i.id]?.cod ?? i.cod_discount) || 0;
      i.term_discount = Number(bagMap[i.id]?.term ?? i.term_discount) || 0;
    });
    // FEFO: earliest batch expiry per item (within 90 days) surfaces in the picker
    const expCut = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    const expBy = {};
    purchAll.forEach((p) => {
      if (!p.expiry_date || String(p.status).toLowerCase() !== 'received') return;
      const d = String(p.expiry_date).slice(0, 10);
      if (d <= expCut && (!expBy[p.item_id] || d < expBy[p.item_id])) expBy[p.item_id] = d;
    });
    items.forEach((i) => { i.exp_soon = expBy[i.id] || null; });
    // "1 up 1 down" is a running account: this order is settled when the next
    // one is placed, so it carries no due date and often comes in part-paid.
    const presets = (settings.term_presets || 'Cash,7 days,15 days,30 days,End of month,1 up 1 down')
      .split(',').map((s) => s.trim()).filter(Boolean);
    if (!presets.some((p) => /1\s*up\s*1\s*down/i.test(p))) presets.push('1 up 1 down');
    const arMap = Object.fromEntries(arList.map((a) => [a.customer_key, Number(a.balance)]));
    window._saleData = { items, customers, presets, arMap, lines: [] };
    return `
      <h2>New Sale</h2>
      <form id="saleForm" class="form">
        <div class="grid3">
          <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
          <label>Invoice # (next in series — editable)
            <input name="sales_no" required autocomplete="off">
            <small id="invCheck"></small></label>
          <label>Customer
            <span class="inputwrap">
              <input name="customer" required autocomplete="off" placeholder="type new, or select…">
              <button type="button" class="mini add inbtn" id="openCust">Select…</button>
            </span></label>
          <label>Store/Farm <input name="store_farm"></label>
          <label>Term <select name="term_preset" id="termPreset">
            ${presets.map((p) => `<option>${esc(p)}</option>`).join('')}
            <option>Custom…</option>
          </select></label>
          <label id="customTermWrap" class="hidden">Custom term
            <input name="term" placeholder="e.g. 45 days / special deal"></label>
          <label>Due date (auto from term — editable) <input type="date" name="due_date"></label>
          <label>Contact <input name="contact_no"></label>
          <label>Payment account <select name="account_id"><option value="">—</option>
            ${accounts.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>
          <label>Sales rep <select name="sales_rep_id"><option value="">—</option>
            ${reps.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label>
          <label>Price tier <select id="priceTier" name="price_tier">
            <option value="srp">Retail (SRP)</option>
            <option value="outright">Outright dealer (item disc.)</option>
            <option value="cod">COD dealer (outright + COD disc.)</option>
          </select><small id="tierHint" class="checkok"></small></label>
        </div>
        <label class="mktbox">
          <input type="checkbox" name="billed_by_marketing" id="mktBilled">
          <span><b>Billed by URC marketing</b> — the stock still leaves the warehouse and is
            deducted, but URC pays for it, so this invoice is kept out of Elishen's income,
            receivables, sales tax and commissions.</span>
        </label>
        <h3>Items</h3>
        <button type="button" class="primary" id="openPicker">Add items…</button>
        <div id="lines"></div>
        <div class="grid3">
          <label>Tax % <input type="number" name="tax_pct" value="0" step="any"></label>
          <label>Discount % <input type="number" name="discount_pct" value="0" step="any"></label>
          <label>Discount amount (invoice-level) <input type="number" name="discount_amt" value="0" step="any" min="0"></label>
          <label>Amount paid now <input type="number" name="amount_paid" value="0" step="any"></label>
          <label>OR No. (if paid — manual, unique)
            <input name="or_no" autocomplete="off"><small id="orCheck"></small></label>
        </div>
        <div class="totals" id="totals"></div>
        <button type="submit" class="primary">Save sale</button>
      </form>

      <div id="pickerModal" class="modal hidden">
        <div class="modal-box">
          <div class="modal-head">
            <input id="pickerSearch" placeholder="Search item, SKU, or category…" autocomplete="off">
            <button type="button" class="mini" id="pickerClose">Done</button>
          </div>
          <div class="modal-body" id="pickerList"></div>
        </div>
      </div>

      <div id="custModal" class="modal hidden">
        <div class="modal-box" style="width:min(820px,100%)">
          <div class="modal-head">
            <input id="custSearch" placeholder="Search customer or address…" autocomplete="off">
            <button type="button" class="mini" id="custClose">Close</button>
          </div>
          <div class="modal-body" id="custList2"></div>
        </div>
      </div>`;
  },

  // ================= Payments ledger =================
  async payments() {
    const [pays, sales, accounts, owing] = await Promise.all([
      api.get('/api/payments'), api.get('/api/sales'), api.get('/api/accounts'),
      api.get('/api/customers/balances'),
    ]);
    const open = sales.filter((s) => !String(s.status).toLowerCase().includes('cancel') && s.total - s.amount_paid > 0);
    const pre = window._payPrefill;
    window._payPrefill = null;
    window._payRows = pays;
    const totalReceived = pays.reduce((a, p) => a + Number(p.amount), 0);
    return `<h2>Payments Ledger</h2>
      <form id="payForm" class="form">
        <div class="grid3">
          <label>Invoice <select name="sale_id" required>
            <option value="">— select unpaid invoice —</option>
            ${open.map((s) => `<option value="${s.id}" ${pre === s.id ? 'selected' : ''}>#${esc(s.sales_no)} · ${esc(s.customer)} · balance ${fmt(s.total - s.amount_paid)}</option>`).join('')}
          </select></label>
          <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
          <label>Amount <input type="number" name="amount" step="any" min="0.01" required></label>
          <label>Account <select name="account_id"><option value="">—</option>
            ${accounts.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>
          <label>OR No. (manual — must be unique)
            <input name="or_no" autocomplete="off"><small id="orCheck"></small></label>
          <label>Payer name <input name="payer_name" placeholder="Printed name (optional)"></label>
          <label>Cheque status <select name="cheque_status">
            <option value="">Not a cheque — counts as received</option>
            <option value="Good">Good — cleared, counts as received</option>
            <option value="On hold">On hold — not yet cleared</option>
            <option value="Bounced">Bounced — returns to collectibles</option>
          </select></label>
          <label>Notes <input name="notes"></label>
          <input type="hidden" name="signature">
        </div>
        <p class="hint" style="margin:6px 0 0">A cheque only counts as paid once it is
          <strong>Good</strong>. On hold or bounced leaves the invoice collectible.</p>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <div id="paySigPreview"><small style="color:var(--ink-2)">No signature captured yet.</small></div>
          <span style="flex:1"></span>
          <button type="button" class="mini" id="paySigCapture">Capture signature</button>
          <button type="button" class="mini" id="paySigClear">Clear</button>
        </div>
        <button type="submit" class="primary">Record payment</button>
      </form>
      <h3 style="margin:22px 0 6px">Payment on account</h3>
      <p class="hint" style="margin:0 0 8px">When a customer just hands over an amount rather than
        settling a named invoice. It clears their oldest invoices first; anything left over is held
        as credit on the account instead of being forced onto an invoice.</p>
      <form id="acctPayForm" class="form">
        <div class="grid3">
          <label>Customer <select name="customer" required>
            <option value="">— select customer —</option>
            ${owing.map((c) => `<option value="${esc(c.customer)}">${esc(c.customer)} · owes ${fmt(c.balance)}${Number(c.credit) > 0 ? ` · credit ${fmt(c.credit)}` : ''}</option>`).join('')}
          </select></label>
          <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
          <label>Amount received <input type="number" name="amount" step="any" min="0.01" required></label>
          <label>Account <select name="account_id"><option value="">—</option>
            ${accounts.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>
          <label>OR No. (optional)<input name="or_no" autocomplete="off"></label>
          <label>Cheque status <select name="cheque_status">
            <option value="">Not a cheque — counts as received</option>
            <option value="Good">Good — cleared, counts as received</option>
            <option value="On hold">On hold — not yet cleared</option>
            <option value="Bounced">Bounced — returns to collectibles</option>
          </select></label>
          <label>Notes <input name="notes"></label>
        </div>
        <button type="submit" class="primary">Receive on account</button>
        <div id="acctPayResult" style="margin-top:10px"></div>
      </form>
      <div class="cards" style="margin:14px 0">
        <div class="card green"><span>Total received (ledger)</span><strong>${fmt(totalReceived)}</strong></div>
        <div class="card"><span>Payments recorded</span><strong>${pays.length}</strong></div>
        <div class="card amber"><span>Open invoices</span><strong>${open.length}</strong></div>
      </div>
      ${table(pays, [
        { key: 'date', label: 'Date', render: (r) => d10(r.date) },
        { key: 'or_no', label: 'OR No.', render: (r) => esc(r.or_no ?? '-') },
        { key: 'sales_no', label: 'Invoice #' },
        { key: 'customer', label: 'Customer' },
        { key: 'amount', label: 'Amount', num: 1, render: (r) => fmt(r.amount) },
        { key: 'account', label: 'Account', render: (r) => esc(r.account ?? '-') },
        { key: 'cheque_status', label: 'Cheque', render: (r) => r.cheque_status
            ? `<span class="badge ${r.cheque_status === 'Good' ? 'green'
                : r.cheque_status === 'Bounced' ? 'red' : 'amber'}">${esc(r.cheque_status)}</span>`
            : '-' },
        { key: 'invoice_total', label: 'Invoice total', num: 1, render: (r) => fmt(r.invoice_total) },
        { key: 'amount_paid', label: 'Paid to date', num: 1, render: (r) => fmt(r.amount_paid) },
        { key: 'notes', label: 'Notes' },
        { key: '_a', label: '', render: (r) => `<span class="actions">
            <button type="button" class="mini" data-editpay="${r.id}">Edit</button>
            <button type="button" class="mini danger" data-delpay="${r.id}">Delete</button>
          </span>` },
      ])}
      <div id="payEditModal" class="modal hidden">
        <div class="modal-box" style="width:min(560px,100%)">
          <div class="modal-head"><h3 id="payEditTitle" style="margin:0;flex:1">Edit payment</h3>
            <button type="button" class="mini" id="payEditClose">Close</button></div>
          <div class="modal-body"><form id="payEditForm" class="form">
            <input type="hidden" name="id">
            <input type="hidden" name="signature">
            <label>Payer name <input name="payer_name" placeholder="Printed name (optional)"></label>
            <div class="grid3">
              <label>OR No. (manual — must be unique)
                <input name="or_no" autocomplete="off"><small id="orEditCheck"></small></label>
              <label>Date <input type="date" name="date" required></label>
              <label>Amount <input type="number" name="amount" step="any" min="0.01" required></label>
              <label>Account <select name="account_id"><option value="">—</option>
                ${accounts.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>
              <label>Cheque status <select name="cheque_status">
                <option value="">Not a cheque — counts as received</option>
                <option value="Good">Good — cleared, counts as received</option>
                <option value="On hold">On hold — not yet cleared</option>
                <option value="Bounced">Bounced — returns to collectibles</option>
              </select></label>
              <label>Notes <input name="notes"></label>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
              <div id="payEditSigPreview"><small style="color:var(--ink-2)">No signature captured yet.</small></div>
              <span style="flex:1"></span>
              <button type="button" class="mini" id="payEditSigCapture">Capture signature</button>
              <button type="button" class="mini" id="payEditSigClear">Clear</button>
            </div>
            <button type="submit" class="primary">Save changes</button>
          </form></div>
        </div>
      </div>`;
  },

  // ================= Sales (list + edit/cancel/delete/payment) =================
  async sales() {
    const rows = await api.get('/api/sales');
    window._salesRows = rows;
    return `<h2>Sales</h2>
    <div style="margin:0 0 12px"><button type="button" class="primary" id="openNewSale">+ New Sale</button></div>
    ${table(rows, [
      { key: 'date', label: 'Date', render: (r) => d10(r.date) },
      { key: 'sales_no', label: 'Invoice' },
      { key: 'customer', label: 'Customer' },
      { key: 'items', label: 'Items', render: (r) => esc(r.items
          .map((i) => `${aliasOf(i) || i.item}×${Number(i.qty)}`).join(', ')) },
      { key: 'total', label: 'Total', num: 1, render: (r) => fmt(r.total) },
      { key: 'amount_paid', label: 'Paid', num: 1, render: (r) => fmt(r.amount_paid) },
      { key: 'balance', label: 'Balance', num: 1, render: (r) => fmt(r.total - r.amount_paid) },
      { key: 'status', label: 'Status', render: (r) =>
          r.status?.toLowerCase().includes('cancel') ? `<span class="badge red">${esc(r.status)}</span>`
          : r.status === 'Pending approval' ? `<span class="badge amber">${esc(r.status)}</span>`
          : esc(r.status) },
      { key: '_dr', label: 'Delivery', render: (r) => r.dr_no
          ? `<span class="badge ${r.delivery_status === 'Delivered' ? 'green' : 'amber'}">DR ${esc(r.dr_no)} · ${esc(r.delivery_status)}</span>`
          : `<button type="button" class="mini" data-makedr="${r.id}">DR</button>` },
      { key: '_a', label: '', render: (r) => `<span class="actions">
          ${r.status === 'Pending approval'
            ? `<button type="button" class="mini add" data-approve="${r.id}" title="Make this sale final">Approve</button>` : ''}
          <button type="button" class="mini" data-editsale="${r.id}" title="Edit everything — date, invoice, customer, items">Edit</button>
          <button type="button" class="mini" data-pay="${r.id}" title="Record payment">Pay</button>
          <button type="button" class="mini" data-cancel="${r.id}" title="Cancel invoice">Void</button>
          <button type="button" class="mini danger" data-delsale="${r.id}" title="Delete">Delete</button>
        </span>` },
    ])}
    <div id="newSaleModal" class="modal hidden">
      <div class="modal-box" style="width:min(1100px,96%)">
        <div class="modal-head"><h3 style="margin:0;flex:1">New Sale</h3>
          <button type="button" class="mini" id="newSaleClose">Close</button></div>
        <div class="modal-body" id="newSaleBody"></div>
      </div>
    </div>
    <div id="drModal" class="modal hidden">
      <div class="modal-box" style="width:min(560px,100%)">
        <div class="modal-head"><h3 id="drModalTitle" style="margin:0;flex:1">New Delivery Receipt</h3>
          <button type="button" class="mini" id="drModalClose">Close</button></div>
        <div class="modal-body"><form id="drForm" class="form">
          <input type="hidden" name="sale_id">
          <div class="grid3">
            <label>DR No. (manual — must be unique)
              <input name="dr_no" required autocomplete="off"><small id="drCheck"></small></label>
            <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label>
            <label>Delivered by <input name="delivered_by" placeholder="driver / rep"></label>
            <label>Vehicle / plate <input name="vehicle"></label>
            <label>Notes <input name="notes"></label>
          </div>
          <button type="submit" class="primary">Save &amp; print DR</button>
        </form></div>
      </div>
    </div>`;
  },

  // ================= Store Visits (rep field reports: 3 questions + photo + geotag) =================
  async visits() {
    const [visits, customers, cisRows] = await Promise.all([
      api.get('/api/store_visits'), api.get('/api/customers'), api.get('/api/cis')]);
    window._visitCustomers = customers;
    // a visited store is reachable as a customer record by name; from there the
    // rep can open (or start) that store's information sheet without leaving the page
    const custByName = new Map(customers.map((c) => [c.name.trim().toUpperCase(), c]));
    const cisSheetIds = new Set(cisRows.map((s) => s.customer_id).filter((v) => v != null));
    const admin = isAdmin();
    const mine = admin ? visits
      : visits.filter((v) => v.user_name === (window._user && window._user.name));
    const mapLink = (r) => r.lat != null
      ? `<a class="catlink" target="_blank"
           href="https://www.google.com/maps?q=${Number(r.lat)},${Number(r.lng)}">
           ${Number(r.lat).toFixed(5)}, ${Number(r.lng).toFixed(5)}</a>`
      : '<span class="badge amber">no location</span>';
    return `<h2>Store Visits</h2>
      <p class="empty" style="margin:4px 0 12px">Field visit report: answer the three questions,
        then the app takes a <b>storefront photo</b> (live camera only) and records the
        <b>location</b> as proof of visit.</p>
      <form id="visitForm" class="form">
        <div class="grid3">
          <label>Store / customer
            <span class="inputwrap">
              <input name="store_name" required autocomplete="off"
                placeholder="type a new store, or pick from the list">
              <button type="button" class="mini inbtn" id="visitPick">Select</button>
            </span></label>
        </div>
        <label>1. Did the store order? Why or why not?
          <textarea name="q_order" rows="2" required
            placeholder="e.g. Ordered 20 bags UNO+ Grower — fast movers. / No order — still has stock until next week."></textarea></label>
        <label>2. What products do they currently have / are selling?
          <textarea name="q_products" rows="2" required
            placeholder="e.g. 15 bags Stargain Grower left, Spectrum almost out, competitor brand X on display."></textarea></label>
        <label>3. Remarks / follow-up (requests, competitor activity, next steps)
          <textarea name="q_remarks" rows="2"
            placeholder="e.g. Requesting price list for COD dealers; revisit Friday for PO."></textarea></label>
        <button type="submit" class="primary">Take photo &amp; submit visit</button>
      </form>
      <h3>${admin ? `All visits (${mine.length})` : `My visits (${mine.length})`}</h3>
      ${table(mine, [
        { key: 'ts', label: 'Date / time', render: (r) => new Date(r.ts).toLocaleString() },
        ...(admin ? [{ key: 'user_name', label: 'Rep' }] : []),
        { key: 'store_name', label: 'Store', render: (r) => {
            const c = custByName.get(String(r.store_name || '').trim().toUpperCase());
            return esc(r.store_name ?? '') + (c
              ? `<br><button type="button" class="mini" data-cissheet="${c.id}"
                   data-cisname="${esc(c.name)}">${cisSheetIds.has(c.id)
                     ? 'Info sheet' : '+ Info sheet'}</button>`
              : '');
          } },
        { key: 'q_order', label: 'Order? Why / why not', render: (r) =>
            `<small>${esc((r.q_order || '').slice(0, 120))}</small>` },
        { key: 'q_products', label: 'Products on hand / selling', render: (r) =>
            `<small>${esc((r.q_products || '').slice(0, 120))}</small>` },
        { key: 'q_remarks', label: 'Remarks', render: (r) =>
            `<small>${esc((r.q_remarks || '').slice(0, 100))}</small>` },
        { key: '_photo', label: 'Proof', render: (r) => (r.has_photo
            ? `<button type="button" class="mini" data-visitphoto="${r.id}">Photo</button>`
            : '<span class="badge amber">no photo</span>') + ' ' + mapLink(r) },
        ...(admin ? [{ key: '_a', label: '', render: (r) =>
            `<button type="button" class="mini danger" data-visitdel="${r.id}">Delete</button>` }] : []),
      ])}
      <div id="visitStoreModal" class="modal hidden">
        <div class="modal-box" style="width:min(720px,100%)">
          <div class="modal-head">
            <input id="visitStoreSearch" placeholder="Search stores / customers…" autocomplete="off">
            <button type="button" class="mini" id="visitStoreClose">Close</button>
          </div>
          <div class="modal-body" id="visitStoreList"></div>
        </div>
      </div>`;
  },

  // ================= Deliveries (report + dispatch list) =================
  async deliveries() {
    const rows = await api.get('/api/deliveries');
    const pending = rows.filter((r) => r.status !== 'Delivered');
    return `<h2>Deliveries</h2>
      <div class="cards" style="margin-bottom:14px">
        <div class="card ${pending.length ? 'amber' : 'green'}"><span>Pending deliveries</span><strong>${pending.length}</strong></div>
        <div class="card"><span>Total DRs</span><strong>${rows.length}</strong></div>
      </div>
      ${pending.length ? `
      <div class="bulkbar">
        <label><input type="checkbox" id="drSelAll"> Select all pending</label>
        <span id="drSelCount" class="tblmatch"></span>
        <input id="drBulkReceiver" placeholder="Received by (applies to all selected)" style="max-width:260px">
        <button type="button" class="mini add" id="drBulkDeliver" disabled>Mark selected as delivered</button>
      </div>` : ''}
      ${table(rows, [
        { key: '_sel', label: '', render: (r) => r.status !== 'Delivered'
            ? `<input type="checkbox" class="drsel" data-drsel="${r.id}">` : '' },
        { key: 'dr_no', label: 'DR No.' },
        { key: 'date', label: 'Date', render: (r) => d10(r.date) },
        { key: 'sales_no', label: 'Invoice #' },
        { key: 'customer', label: 'Customer' },
        { key: 'store_farm', label: 'Stores/Farms' },
        { key: 'total', label: 'Amount', num: 1, render: (r) => fmt(r.total) },
        { key: 'delivered_by', label: 'Delivered by', render: (r) => esc(r.delivered_by ?? '') },
        { key: 'status', label: 'Status', render: (r) =>
            `<span class="badge ${r.status === 'Delivered' ? 'green' : 'amber'}">${esc(r.status)}</span>`
            + (r.received_by ? `<br><small>rcvd: ${esc(r.received_by)} ${d10(r.delivered_date)}</small>` : '') },
        { key: '_a', label: '', render: (r) => `<span class="actions">
            <button type="button" class="mini" data-printdr="${r.id}">Print DR</button>
            <button type="button" class="mini" data-editdr="${r.id}">Edit</button>
            <button type="button" class="mini" data-editorder="${r.sale_id}"
              title="Receiver changed the order — add or remove items on the invoice">Edit order</button>
            ${r.status !== 'Delivered' ? `<button type="button" class="mini add" data-markdel="${r.id}">Mark delivered</button>` : ''}
            <button type="button" class="mini danger" data-deldr="${r.id}">Delete</button>
          </span>` },
      ])}
      <div id="drEditModal" class="modal hidden">
        <div class="modal-box" style="width:min(620px,100%)">
          <div class="modal-head"><h3 id="drEditTitle" style="margin:0;flex:1">Edit Delivery Receipt</h3>
            <button type="button" class="mini" id="drEditClose">Close</button></div>
          <div class="modal-body"><form id="drEditForm" class="form">
            <input type="hidden" name="id">
            <div class="grid3">
              <label>DR No. (must stay unique)
                <input name="dr_no" required autocomplete="off"><small id="drEditCheck"></small></label>
              <label>Date <input type="date" name="date"></label>
              <label>Delivered by <input name="delivered_by"></label>
              <label>Vehicle / plate <input name="vehicle"></label>
              <label>Status <select name="status">
                <option>Pending</option><option>Delivered</option></select></label>
              <label>Received by <input name="received_by"></label>
              <label>Delivered date <input type="date" name="delivered_date"></label>
              <label>Notes <input name="notes"></label>
            </div>
            <div style="margin:6px 0 12px">
              <div style="font-size:12.5px;font-weight:600;color:var(--ink-2);margin-bottom:4px">
                Receiver's affixed signature</div>
              <div id="drSigPreview" style="min-height:52px;border:1px dashed var(--border-strong);
                border-radius:8px;padding:6px;display:flex;align-items:center;gap:12px"></div>
              <div class="actions" style="margin-top:6px">
                <button type="button" class="mini" id="drSigCapture">Capture / redo signature</button>
                <button type="button" class="mini danger" id="drSigClear">Remove signature</button>
              </div>
            </div>
            <button type="submit" class="primary">Save changes</button>
          </form></div>
        </div>
      </div>`;
  },

  // ================= Accounts Receivable =================
  async receivables() {
    const [byCust, allOpen, custRows, advances, advAccts, cisRows] = await Promise.all([
      api.get('/api/reports/ar_by_customer'),
      api.get('/api/reports/accounts_receivable'),
      api.get('/api/customers'),
      api.get('/api/customer_advances'),
      opts('/api/accounts'),
      api.get('/api/cis'),
    ]);
    // which customers already have an information sheet on file
    const cisSheetIds = new Set(cisRows.map((s) => s.customer_id).filter((v) => v != null));
    window._advances = advances;
    const advMap = lookupMap(advAccts);
    // aging buckets across ALL open invoices
    const buckets = { current: 0, b30: 0, b60: 0, b90: 0 };
    allOpen.forEach((r) => {
      const d = Number(r.days_overdue), bal = Number(r.balance);
      if (d <= 0) buckets.current += bal;
      else if (d <= 30) buckets.b30 += bal;
      else if (d <= 60) buckets.b60 += bal;
      else buckets.b90 += bal;
    });
    const agingCards = `
      <div class="cards" style="margin-bottom:16px">
        <div class="card green"><span>Current (not due)</span><strong>${fmt(buckets.current)}</strong></div>
        <div class="card amber"><span>1–30 days overdue</span><strong>${fmt(buckets.b30)}</strong></div>
        <div class="card amber"><span>31–60 days overdue</span><strong>${fmt(buckets.b60)}</strong></div>
        <div class="card red"><span>60+ days overdue</span><strong>${fmt(buckets.b90)}</strong></div>
      </div>`;
    // AR_ALL fetches every customer's open invoices at once, so the whole
    // collectible list can be read and printed without stepping through the
    // dropdown one customer at a time.
    const known = (k) => k === AR_ALL || byCust.some((c) => c.customer_key === k);
    const sel = known(window._arCustomer) ? window._arCustomer : (byCust[0]?.customer_key ?? null);
    window._arCustomer = sel;
    const showAll = sel === AR_ALL;
    const selRow = showAll ? null : byCust.find((c) => c.customer_key === sel);
    const isOpen = (s) => !String(s.status).toLowerCase().includes('cancel')
      && Number(s.total) - Number(s.amount_paid) > 0;
    // item lines are on by default; collectors turn them off to see only what is owed
    const showItems = window._arShowItems !== false;
    let detail = '<p class="empty">No outstanding receivables.</p>';
    if (showAll || selRow) {
      const invoices = (showAll
        ? await api.get('/api/sales')
        : await api.get(`/api/sales?customer=${encodeURIComponent(selRow.customer)}`)).filter(isOpen);
      // grouped by customer, oldest debt first, so the follow-up list reads top-down
      if (showAll) {
        invoices.sort((a, b) => String(a.customer ?? '').localeCompare(String(b.customer ?? ''))
          || String(a.date).localeCompare(String(b.date)));
      }
      window._arInvoices = invoices;
      // With items shown this reads like the sheet: one row per item line, invoice
      // details on the first of them. With items hidden it collapses to one row an
      // invoice -- who owes, how much, how late -- which is what collecting needs.
      const lines = showItems
        ? invoices.flatMap((s) =>
            ((s.items && s.items.length) ? s.items : [{}]).map((it, ix) => ({ s, it, first: ix === 0 })))
        : invoices.map((s) => ({ s, it: {}, first: true }));
      const itemCols = [
        { key: 'item', label: 'Item', render: (l) => esc(l.it.item ?? '') },
        { key: 'qty', label: 'Qty', num: 1, render: (l) => l.it.qty != null ? Number(l.it.qty) : '' },
      ];
      detail = table(lines, [
        { key: 'no', label: 'Sales #', render: (l) => l.first ? esc(l.s.sales_no) : '' },
        { key: 'date', label: 'Date', render: (l) => l.first ? d10(l.s.date) : '' },
        { key: 'cust', label: 'Customer', render: (l) => l.first ? esc(l.s.customer) : '' },
        { key: 'farm', label: 'Stores/Farms', render: (l) => l.first ? esc(l.s.store_farm ?? '') : '' },
        { key: 'term', label: 'Term', render: (l) => l.first ? esc(l.s.term ?? '') : '' },
        { key: 'mode', label: 'Payment', render: (l) => l.first ? esc(l.s.payment_mode ?? '') : '' },
        ...(showItems ? itemCols : []),
        { key: 'total', label: 'Invoice total', num: 1, render: (l) => l.first ? fmt(l.s.total) : '' },
        // what has already been received (cleared payments only -- a held or
        // bounced cheque is not money yet), shown so the gap to "To pay" is plain
        { key: 'paid', label: 'Already paid', num: 1, render: (l) => !l.first ? ''
            : (Number(l.s.amount_paid) ? `<span class="paidcell">${fmt(l.s.amount_paid)}</span>` : '—') },
        { key: 'bal', label: 'To pay', num: 1, render: (l) => l.first ? `<strong>${fmt(l.s.total - l.s.amount_paid)}</strong>` : '' },
        { key: 'due', label: 'Days overdue', num: 1, render: (l) => {
            if (!l.first) return '';
            const d = Math.max(0, Math.floor((Date.now() - new Date(l.s.due_date || l.s.date)) / 86400000));
            return d > 0 ? `<span class="badge ${d > 30 ? 'red' : 'amber'}">${d}</span>` : '0';
          } },
        { key: '_a', label: '', render: (l) => l.first ? `<button type="button" class="mini" data-pay="${l.s.id}">Pay</button>` : '' },
      ], { extra: `<label class="tglbox" title="Hide the item lines to see only what each invoice still owes">
          <input type="checkbox" data-showitems="1" ${showItems ? 'checked' : ''}> Show items ordered</label>` });
      // The figure being collected, spelled out under the list: invoiced, less what
      // has already come in, leaves what is still owed. Only the last is collectible.
      const sum = (f) => invoices.reduce((a, s) => a + f(s), 0);
      const invoiced = sum((s) => Number(s.total));
      const paid = sum((s) => Number(s.amount_paid));
      detail += `<p class="artotals">
        ${invoices.length} unpaid invoice(s) &middot; invoiced ${fmt(invoiced)}
        ${paid ? `&minus; already paid ${fmt(paid)}` : ''}
        &middot; <b>to pay: ${fmt(invoiced - paid)}</b></p>`;
      if (!invoices.length) detail = '<p class="empty">No outstanding receivables.</p>';
    }
    return `<h2>Accounts Receivable</h2>
      ${agingCards}
      <div class="arhead">
        <label>Customer <select id="arCustomer">
          <option value="${AR_ALL}" ${showAll ? 'selected' : ''}>All customers — every collectible</option>
          ${byCust.map((c) => `<option value="${esc(c.customer_key)}" ${c.customer_key === sel ? 'selected' : ''}>${esc(c.customer)}</option>`).join('')}
        </select></label>
        ${showAll ? '' : `<button type="button" class="mini add" id="soaBtn"
          title="Statement of Account — invoices, payments, running balance, aging">Print SOA</button>`}
        ${showAll ? '' : (() => {
          const c = custRows.find((x) => x.name.trim().toUpperCase() === (selRow?.customer || '').trim().toUpperCase());
          return c ? `<button type="button" class="mini" data-cissheet="${c.id}" data-cisname="${esc(c.name)}"
            title="Customer Information Sheet on file">${cisSheetIds.has(c.id)
              ? 'Information sheet' : '+ Information sheet'}</button>` : '';
        })()}
        <div class="card amber arcard">
          <span>${showAll
            ? `${byCust.length} customer(s) — outstanding`
            : `${esc(selRow?.customer ?? 'Total')} — outstanding`}</span>
          <strong>${fmt(showAll
            ? byCust.reduce((a, c) => a + Number(c.balance), 0)
            : (selRow?.balance ?? 0))}</strong></div>
        <div class="card arcard"><span>All customers</span>
          <strong>${fmt(byCust.reduce((a, c) => a + Number(c.balance), 0))}</strong></div>
      </div>
      ${detail}
      ${crudBlock('customer_advances', {
        title: 'Customer advances (money received with no invoice yet)',
        endpoint: '/api/customer_advances', rows: advances,
        fields: [
          { name: 'customer', label: 'Customer / payer', required: true },
          { name: 'date', label: 'Date received', type: 'date', required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'account_id', label: 'Deposited to', type: 'select', options: advAccts },
          { name: 'notes', label: 'Notes (check no., bank, what it is for)' },
        ],
        columns: [
          { key: 'date', label: 'Date', render: (r) => d10(r.date) },
          { key: 'customer', label: 'Customer' },
          { key: 'amount', label: 'Amount', num: 1, render: (r) => fmt(r.amount) },
          { key: 'applied', label: 'Applied', num: 1, render: (r) => fmt(r.applied) },
          { key: '_rem', label: 'Remaining', num: 1, render: (r) => {
              const rem = Number(r.amount) - Number(r.applied);
              return rem > 0.005 ? `<b>${fmt(rem)}</b>` : '<span class="badge green">fully applied</span>';
            } },
          { key: 'account_id', label: 'Account', render: (r) => esc(advMap[r.account_id] ?? '') },
          { key: 'notes', label: 'Notes' },
          { key: '_apply', label: '', render: (r) => (Number(r.amount) - Number(r.applied)) > 0.005
              ? `<button type="button" class="mini add" data-applyadv="${r.id}">Apply to invoice</button>` : '' },
        ],
      })}
      ${crudBlock('customers', {
        title: 'Customers (renaming keeps their pricing tier and history)', endpoint: '/api/customers', rows: custRows,
        fields: [
          { name: 'name', label: 'Customer name', required: true },
          { name: 'address', label: 'Address / Store / Farm' },
          { name: 'contact_no', label: 'Contact no.' },
          { name: 'term', label: 'Usual term' },
          { name: 'tier', label: 'Pricing tier', type: 'select', options: [
            { value: 'srp', label: 'Retail (SRP)' },
            { value: 'outright', label: 'Outright dealer' },
            { value: 'cod', label: 'COD dealer' }] },
          { name: 'notes', label: 'Notes' },
        ],
        columns: [
          { key: 'name', label: 'Customer' },
          { key: 'address', label: 'Address' },
          { key: 'contact_no', label: 'Contact' },
          { key: 'term', label: 'Term' },
          { key: 'tier', label: 'Pricing', render: (r) => r.tier === 'cod'
              ? '<span class="badge green">COD dealer</span>'
              : r.tier === 'outright' ? '<span class="badge green">Outright dealer</span>' : 'Retail' },
          { key: 'notes', label: 'Notes' },
          { key: '_cis', label: 'Info sheet', render: (r) =>
              `<button type="button" class="mini" data-cissheet="${r.id}"
                 data-cisname="${esc(r.name)}">${cisSheetIds.has(r.id) ? 'Open sheet' : '+ Create'}</button>` },
        ],
      })}`;
  },

  // ================= Customer Information Sheet (every signed-in user) =================
  // The printed form, digitized: one sheet per store or farm account.
  async cis() {
    const [sheets, customers] = await Promise.all([
      api.get('/api/cis'), api.get('/api/customers')]);
    window._cisCustomers = customers;
    const ql = (window._cisSearch || '').toLowerCase();
    const filter = window._cisFilter || 'all';
    const rows = sheets.filter((s) =>
      (filter === 'all' || s.sheet_type === filter)
      && (!ql || [s.account_name, s.customer_name, s.address, s.owner_name, s.contact_no]
        .some((v) => String(v || '').toLowerCase().includes(ql))));
    const tab = (v, label) => `<button type="button" class="mini ${filter === v ? 'add' : ''}"
      data-cisfilter="${v}">${label}</button>`;
    return `<h2>Customer Information Sheets</h2>
      <p class="empty" style="margin:4px 0 12px">The signed customer form, on file and reprintable.
        Fill one out for every <b>store</b> or <b>farm</b> account. Any staff member may create and
        update sheets.</p>
      <div class="toolbar" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
        <button type="button" class="primary" data-cisnew="store">+ New store sheet</button>
        <button type="button" class="primary" data-cisnew="farm">+ New farm sheet</button>
        <span style="flex:1"></span>
        ${tab('all', `All (${sheets.length})`)}
        ${tab('store', `Stores (${sheets.filter((s) => s.sheet_type === 'store').length})`)}
        ${tab('farm', `Farms (${sheets.filter((s) => s.sheet_type === 'farm').length})`)}
        <input id="cisSearch" placeholder="Search account, owner, address…" autocomplete="off"
          value="${esc(window._cisSearch || '')}" style="max-width:260px">
      </div>
      ${table(rows, [
        { key: 'sheet_type', label: 'Type', render: (r) => r.sheet_type === 'farm'
            ? '<span class="badge green">Farm</span>' : '<span class="badge amber">Store</span>' },
        { key: 'account_name', label: 'Account name', render: (r) => `<b>${esc(r.account_name)}</b>`
            + (r.customer_name ? `<br><small style="color:var(--ink-2)">linked: ${esc(r.customer_name)}</small>` : '') },
        { key: 'owner_name', label: 'Owner' },
        { key: 'address', label: 'Address', render: (r) => `<small>${esc(r.address || '')}</small>` },
        { key: 'contact_no', label: 'Contact' },
        { key: 'terms', label: 'Terms' },
        { key: 'updated_at', label: 'Updated', render: (r) => `<small>${r.updated_at
            ? new Date(r.updated_at).toLocaleDateString() : ''}${r.created_by
            ? `<br>by ${esc(r.created_by)}` : ''}</small>` },
        { key: '_a', label: '', render: (r) => `<span class="actions">
            <button type="button" class="mini" data-cisopen="${r.id}">Open</button>
            <button type="button" class="mini printbtn" data-cisprint="${r.id}">Print</button>
            ${isAdmin() ? `<button type="button" class="mini danger" data-cisdel="${r.id}">Delete</button>` : ''}
          </span>` },
      ])}`;
  },

  // ---- the sheet itself: laid out like the paper form it replaces ----
  async cisform() {
    const s = window._cisEdit || { sheet_type: window._cisType || 'store', specimens: [] };
    const isFarm = s.sheet_type === 'farm';
    const noun = isFarm ? 'Farm' : 'Store';
    const customers = window._cisCustomers || await api.get('/api/customers');
    window._cisCustomers = customers;
    const v = (k) => esc(s[k] ?? '');
    const addr = (prefix, labels) => `<div class="cis-addr">${labels.map(([k, lab]) =>
      `<label class="cis-mini"><span>${lab}</span>
        <input name="${prefix}_${k}" value="${v(`${prefix}_${k}`)}" autocomplete="off"></label>`).join('')}</div>`;
    const ADDR_PARTS = [['no', 'No.'], ['street', 'Street'], ['purok', 'Purok'],
      ['barangay', 'Barangay'], ['town', 'Town'], ['city', 'City'], ['province', 'Province']];
    const nameRow = (prefix, n) => `<div class="cis-name">
      <span class="cis-num">${n}.</span>
      <label class="cis-mini"><span>Surname</span>
        <input name="${prefix}_surname" value="${v(`${prefix}_surname`)}" autocomplete="off"></label>
      <label class="cis-mini"><span>Given Name</span>
        <input name="${prefix}_given" value="${v(`${prefix}_given`)}" autocomplete="off"></label>
      <label class="cis-mini"><span>Middle Name</span>
        <input name="${prefix}_middle" value="${v(`${prefix}_middle`)}" autocomplete="off"></label>
    </div>`;
    return `
      <div class="cis-bar">
        <button type="button" class="mini" id="cisBack">&lsaquo; Back to sheets</button>
        <span style="flex:1"></span>
        ${s.id ? `<button type="button" class="mini printbtn" data-cisprint="${s.id}">Print / PDF</button>` : ''}
        <button type="submit" form="cisForm" class="primary">${s.id ? 'Save changes' : 'Save sheet'}</button>
      </div>
      <form id="cisForm" class="cis-sheet" data-id="${s.id || ''}" data-version="${s.version ?? ''}">
        <div class="cis-head">
          <div class="cis-logo"><span class="e">E</span><span class="s">S</span></div>
          <div>
            <div class="cis-co">ELISHEN AGRIVANCE</div>
            <div class="cis-co-sub">Gracepatch, Blk 45 Alviola Village, Democrito Plaza Avenue,<br>
              Butuan City, Philippines 8600<br>Mobile No. 09951039419</div>
          </div>
        </div>
        <h3 class="cis-title">CUSTOMER INFORMATION SHEET</h3>
        <div class="cis-typepick">
          <label><input type="radio" name="sheet_type" value="store" ${isFarm ? '' : 'checked'}> Store</label>
          <label><input type="radio" name="sheet_type" value="farm" ${isFarm ? 'checked' : ''}> Farm</label>
          <span class="cis-hint">Switching changes which sections appear, exactly like the two paper forms.</span>
        </div>

        <label class="cis-line"><span class="cis-lab">Account Name</span>
          <input name="account_name" value="${v('account_name')}" required autocomplete="off"></label>
        <label class="cis-line"><span class="cis-lab">Link to customer record</span>
          <select name="customer_id" id="cisCustLink">
            <option value="new" ${!s.id && s.customer_id == null ? 'selected' : ''}>
              + New customer — create from the Account Name above</option>
            <option value="" ${s.id && s.customer_id == null ? 'selected' : ''}>— not linked —</option>
            ${customers.map((c) => `<option value="${c.id}" ${String(s.customer_id) === String(c.id)
              ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select></label>
        <div class="cis-hint" id="cisLinkHint"></div>

        <div class="cis-line-2">
          <label class="cis-line"><span class="cis-lab" data-noun>${noun} established on</span>
            <input name="established_on" value="${v('established_on')}" autocomplete="off"
              placeholder="e.g. March 2019"></label>
          <div class="cis-checks"><span class="cis-lab">Space</span>
            <label><input type="radio" name="space_tenure" value="rented"
              ${s.space_tenure === 'rented' ? 'checked' : ''}> Rented</label>
            <label><input type="radio" name="space_tenure" value="owned"
              ${s.space_tenure === 'owned' ? 'checked' : ''}> Owned</label>
          </div>
        </div>

        <div class="cis-lab" data-noun-addr>Complete ${noun} Address</div>
        ${addr('addr', ADDR_PARTS)}

        <label class="cis-line"><span class="cis-lab">Contact Number</span>
          <input name="contact_no" value="${v('contact_no')}" autocomplete="off"></label>

        <div class="cis-lab">Owner's Name</div>
        ${nameRow('owner1', 1)}
        ${nameRow('owner2', 2)}

        <div class="cis-lab">Residence Address</div>
        ${addr('res', ADDR_PARTS)}
        <div class="cis-checks"><span class="cis-lab">Residential</span>
          <label><input type="radio" name="res_tenure" value="owned"
            ${s.res_tenure === 'owned' ? 'checked' : ''}> Owned</label>
          <label><input type="radio" name="res_tenure" value="rented"
            ${s.res_tenure === 'rented' ? 'checked' : ''}> Rented</label>
        </div>

        <section id="cisCorp" class="cis-corp ${isFarm ? 'hidden' : ''}">
          <div class="cis-lab cis-strong">If corporation / cooperative</div>
          <div class="cis-lab">Store Manager / OIC Name</div>
          ${nameRow('mgr1', 1)}
          ${nameRow('mgr2', 2)}
          <div class="cis-lab">Complete Address</div>
          <label class="cis-line"><span class="cis-num">1.</span>
            <input name="mgr1_address" value="${v('mgr1_address')}" autocomplete="off"></label>
          <label class="cis-line"><span class="cis-num">2.</span>
            <input name="mgr2_address" value="${v('mgr2_address')}" autocomplete="off"></label>
        </section>

        <div class="cis-line-2">
          <label class="cis-line"><span class="cis-lab">Terms</span>
            <input name="terms" value="${v('terms')}" autocomplete="off"></label>
          <div class="cis-checks">
            <label><input type="checkbox" name="terms_credit" ${s.terms_credit ? 'checked' : ''}> Credit</label>
            <label><input type="checkbox" name="terms_check" ${s.terms_check ? 'checked' : ''}> Check</label>
          </div>
        </div>

        <div class="cis-line-2">
          <label class="cis-line"><span class="cis-lab">Bank Name</span>
            <input name="bank_name" value="${v('bank_name')}" autocomplete="off"></label>
          <label class="cis-line"><span class="cis-lab">Branch</span>
            <input name="branch" value="${v('branch')}" autocomplete="off"></label>
        </div>

        <div class="cis-lab">Signature Specimens</div>
        <div class="cis-specimens" id="cisSpecimens"></div>

        <p class="cis-certify">This is to certify that all information given is true and correct.</p>
        <div class="cis-sign-final">
          <label class="cis-line"><span class="cis-lab">Customer's printed name</span>
            <input name="certified_name" value="${v('certified_name')}" autocomplete="off"></label>
          <div id="cisCertSig" class="cis-sigbox"></div>
        </div>
      </form>`;
  },

  // ================= Inventory (items CRUD + stock + manual batches + BOM) =================
  async inventory() {
    const [items, stock, vendors, manual, allPurch] = await Promise.all([
      api.get('/api/items'), api.get('/api/reports/item_stock'),
      opts('/api/vendors'), api.get('/api/manual_inventory'), api.get('/api/purchases'),
    ]);
    const stockBy = Object.fromEntries(stock.map((s) => [s.id, s]));
    const vendMap = lookupMap(vendors);
    const itemOpts = items.map((i) => ({ value: i.id, label: itemLabelFull(i) }));
    const itemMap = lookupMap(itemOpts);
    const bom = await api.get('/api/bom_lines');
    // FEFO expiry alerts: received batches expiring within 60 days (or already past)
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const expBatches = allPurch
      .filter((p) => p.expiry_date && String(p.status).toLowerCase() === 'received'
        && String(p.expiry_date).slice(0, 10) <= soon)
      .sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)));
    const expHtml = !expBatches.length ? '' : `
      <h3>Expiry alerts — sell these batches first (FEFO)</h3>
      <div class="tablewrap" style="margin-bottom:16px"><table>
        <thead><tr><th>Item</th><th>Batch / PO ref</th><th>Received</th><th>Qty received</th>
          <th>Expiry</th><th>Days left</th></tr></thead>
        <tbody>${expBatches.map((p) => {
          const exp = String(p.expiry_date).slice(0, 10);
          const days = Math.floor((new Date(exp) - new Date(today)) / 86400000);
          return `<tr>
            <td>${esc(itemMap[p.item_id] ?? '')}</td>
            <td>${esc(p.ref_id ?? '—')}</td>
            <td>${d10(p.received_date)}</td>
            <td class="num">${Number(p.received_qty)}</td>
            <td>${exp}</td>
            <td><span class="badge ${days < 0 ? 'red' : days <= 14 ? 'red' : 'amber'}">
              ${days < 0 ? `EXPIRED ${-days}d ago` : `${days}d`}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    return `<h2>Inventory</h2>
      ${expHtml}
      ${crudBlock('items', {
        title: `Items (${items.length})`, endpoint: '/api/items', rows: items,
        fields: [
          { name: 'name', label: 'Item name', required: true },
          { name: 'alias', label: 'Alias (warehouse short code, e.g. SI 2 (50KG))' },
          { name: 'sku', label: 'SKU' },
          { name: 'category', label: 'Category' },
          { name: 'type', label: 'Type', type: 'select', options: ['Feed', 'Supply', 'Treat', 'Product', 'Material'].map((t) => ({ value: t, label: t })) },
          { name: 'initial_stock', label: 'Initial stock', type: 'number' },
          { name: 'minimum_stock', label: 'Minimum stock', type: 'number' },
          { name: 'packaging', label: 'Packaging (e.g. 5g., 100 ml, 50KG)' },
          { name: 'uom', label: 'Unit of measure', type: 'select',
            options: ['bag', 'box', 'bottle', 'sachet', 'jar', 'piece', 'set', 'carton', 'bundle']
              .map((u) => ({ value: u, label: u })) },
          { name: 'sales_price', label: 'SRP (selling price)', type: 'number' },
          { name: 'cost', label: 'Capital (net cost per unit)', type: 'number' },
          { name: 'deal', label: 'Bonus deal (e.g. 10 + 2)' },
          { name: 'outright_rate', label: 'Outright disc. (0.15 = 15%)', type: 'number' },
          { name: 'cod_rate', label: 'COD disc. (0.05 = 5%)', type: 'number' },
          { name: 'cod_discount', label: 'COD discount per bag in ₱ (cash sales)', type: 'number' },
          { name: 'term_discount', label: 'Term discount per bag in ₱ (sales on credit)', type: 'number' },
          { name: 'preferred_vendor_id', label: 'Preferred vendor', type: 'select', options: vendors },
          { name: 'units_in_purchase', label: 'Units in purchase', type: 'number' },
          { name: 'promotion', label: 'Promotion' },
          { name: 'notes', label: 'Notes' },
        ],
        columns: [
          { key: 'alias', label: 'Alias', render: (r) => aliasOf(r)
              ? `<b>${esc(aliasOf(r))}</b>` : '<small style="color:var(--ink-3)">—</small>' },
          { key: 'name', label: 'Item' }, { key: 'category', label: 'Category' },
          { key: 'packaging', label: 'Packaging', render: (r) => esc(r.packaging ?? '') },
          { key: 'uom', label: 'UoM', render: (r) => esc(r.uom ?? '') },
          { key: '_oh', label: 'On hand', num: 1, render: (r) => Number(stockBy[r.id]?.on_hand ?? 0) },
          { key: 'minimum_stock', label: 'Min', num: 1 },
          { key: 'cost', label: 'Capital', num: 1, render: (r) => fmt(r.cost) },
          { key: 'sales_price', label: 'SRP', num: 1, render: (r) => fmt(r.sales_price) },
          { key: '_pb', label: 'Profit/bag', num: 1, render: (r) =>
              (r.sales_price != null && r.cost != null)
                ? `<strong>${fmt(r.sales_price - r.cost)}</strong>` : '-' },
          { key: '_mg', label: 'Margin', num: 1, render: (r) => {
              const m = stockBy[r.id]?.margin;
              return m != null ? (m * 100).toFixed(1) + '%' : '-'; } },
          { key: 'deal', label: 'Deal', render: (r) => esc(r.deal ?? '') },
          { key: 'cod_discount', label: 'Disc./bag COD · Term', num: 1, render: (r) =>
              (Number(r.cod_discount) || Number(r.term_discount))
                ? `<strong>${fmt(r.cod_discount)}</strong> · ${fmt(r.term_discount)}`
                : '<small style="color:var(--ink-3)">—</small>' },
          { key: '_st', label: 'Status', render: (r) => statusBadge(stockBy[r.id]?.status ?? '-') },
          { key: '_pr', label: '', render: (r) => `<button type="button" class="mini" data-pricing="${r.id}">Pricing</button>` },
            { key: '_cond', label: '', render: (r) =>
              `<button type="button" class="mini" data-mark-opened="${r.id}">Opened</button>
               <button type="button" class="mini danger" data-mark-damaged="${r.id}">Damaged</button>` },
        ],
      })}
      <div id="priceModal" class="modal hidden">
        <div class="modal-box" style="width:min(780px,100%)">
          <div class="modal-head">
            <h3 id="priceModalTitle" style="margin:0; flex:1"></h3>
            <button type="button" class="mini" id="priceModalClose">Close</button>
          </div>
          <div class="modal-body" id="priceModalBody"></div>
        </div>
      </div>
      ${crudBlock('manual_inventory', {
        title: 'Manual inventory batches', endpoint: '/api/manual_inventory', rows: manual,
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'batch_no', label: 'Batch no' },
          { name: 'item_id', label: 'Item', type: 'select', options: itemOpts, required: true },
          { name: 'qty', label: 'Qty (+/-)', type: 'number', required: true },
          { name: 'notes', label: 'Notes' },
        ],
        columns: [
          { key: 'date', label: 'Date', render: (r) => d10(r.date) },
          { key: 'batch_no', label: 'Batch' },
          { key: 'item_id', label: 'Item', render: (r) => esc(itemMap[r.item_id] ?? r.item_id) },
          { key: 'qty', label: 'Qty', num: 1 },
          { key: 'notes', label: 'Notes' },
        ],
      })}
      <h3>Production (uses Bill of Materials)</h3>
      <form id="produceForm" class="form">
        <div class="grid3">
          <label>Finished product <select name="finished_item_id" required>
            ${[...new Set(bom.map((b) => b.finished_item_id))].map((id) =>
              `<option value="${id}">${esc(itemMap[id] ?? id)}</option>`).join('')}
          </select></label>
          <label>Quantity to make <input type="number" name="qty" min="0.001" step="any" required></label>
          <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label>
        </div>
        <button type="submit" class="primary">Produce (adds finished stock, consumes materials)</button>
        ${bom.length ? '' : '<p class="empty">Define BOM lines below first — then production becomes available.</p>'}
      </form>
      ${crudBlock('bom_lines', {
        title: 'Bill of materials (finished product → components)', endpoint: '/api/bom_lines', rows: bom,
        fields: [
          { name: 'finished_item_id', label: 'Finished product', type: 'select', options: itemOpts, required: true },
          { name: 'component_item_id', label: 'Component material', type: 'select', options: itemOpts, required: true },
          { name: 'quantity', label: 'Qty per unit', type: 'number', required: true },
        ],
        columns: [
          { key: 'finished_item_id', label: 'Finished product', render: (r) => esc(itemMap[r.finished_item_id] ?? '') },
          { key: 'component_item_id', label: 'Component', render: (r) => esc(itemMap[r.component_item_id] ?? '') },
          { key: 'quantity', label: 'Qty/unit', num: 1 },
        ],
      })}`;
  },

  // ================= Stock Take =================
  async stocktake() {
    const stock = await api.get('/api/reports/item_stock');
    window._stockRows = stock;
    return `<h2>Stock Take</h2>
      <p class="empty">Enter the <b>actual counted</b> on-hand quantity per item (blank = skip), and set the
      <b>minimum stock</b> reorder level — items at or below their minimum appear in Purchases → Reorder suggestions.
      Saving posts adjustment batches for counts and updates changed minimums.</p>
      <form id="stockTakeForm" class="form">
        <div class="tablewrap"><table>
          <thead><tr><th>Item</th><th>SKU</th><th>System on hand</th><th>Actual count</th><th>Adjustment</th><th>Minimum stock</th></tr></thead>
          <tbody>
            ${stock.map((s, i) => `<tr>
              <td>${itemLabelHtml(s)}</td><td>${esc(s.sku ?? '')}</td>
              <td class="num">${Number(s.on_hand)}</td>
              <td><input type="number" step="any" class="stockcount" data-ix="${i}" placeholder="—"></td>
              <td class="num adjcell" id="adj${i}">—</td>
              <td><input type="number" step="any" min="0" class="minstock" data-ix="${i}" value="${Number(s.minimum_stock)}"></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        <div class="grid3">
          <label>Batch no <input name="batch_no" value="STOCKTAKE-${new Date().toISOString().slice(0, 10)}"></label>
          <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label>
        </div>
        <button type="submit" class="primary">Save stock take</button>
      </form>`;
  },

  // ================= Purchases (CRUD + reorder suggestions + vendors + performance) =================
  async purchases() {
    const [rows, allItems, vendOpts, acctOpts, perf, vendors, reorder] = await Promise.all([
      api.get('/api/purchases'), api.get('/api/items'), opts('/api/vendors'),
      opts('/api/accounts'), api.get('/api/reports/vendor_performance'), api.get('/api/vendors'),
      api.get('/api/reports/reorder'),
    ]);
    // receiving stock is warehouse work — show the code they know, then the full name
    const itemOpts = allItems.map((i) => ({ value: i.id, label: itemLabelFull(i) }));
    const itemMap = lookupMap(itemOpts), vendMap = lookupMap(vendOpts), acctMap = lookupMap(acctOpts);
    window._reorder = reorder;
    // group suggestions by vendor
    const byVendor = {};
    reorder.forEach((r) => (byVendor[r.vendor ?? 'No preferred vendor'] ??= []).push(r));
    const reorderHtml = !reorder.length
      ? '<p class="empty">Nothing to reorder — no items are at or below their minimum stock. (Set minimums in Stock Take.)</p>'
      : Object.entries(byVendor).map(([vendor, items]) => `
        <div class="crudblock">
          <div class="crudhead"><h3 style="margin:0">${esc(vendor)}</h3>
            <button type="button" class="mini add" data-draftpo="${esc(vendor)}">Draft PO (${items.length} item${items.length > 1 ? 's' : ''})</button>
          </div>
          <div class="tablewrap"><table>
            <thead><tr><th>Item</th><th>On hand</th><th>Min</th><th>Suggested qty</th><th>Unit cost</th></tr></thead>
            <tbody>${items.map((r) => `<tr>
              <td>${esc(r.name)}</td>
              <td class="num">${Number(r.on_hand)}</td>
              <td class="num">${Number(r.minimum_stock)}</td>
              <td><input type="number" step="any" min="0" value="${Number(r.suggested_qty)}" data-reoqty="${r.id}" style="width:90px"></td>
              <td class="num">${r.cost != null ? fmt(r.cost) : '—'}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>`).join('');
    // ---- purchase orders grouped in the URC Sales Order format (ref_id = SO No.) ----
    window._poRows = rows;
    const byRef = {};
    rows.filter((r) => r.ref_id).forEach((r) => (byRef[r.ref_id] ??= []).push(r));
    const refGroups = Object.entries(byRef).sort((a, b) =>
      String(a[1][0].order_date).localeCompare(String(b[1][0].order_date)) || a[0].localeCompare(b[0]));
    const poHtml = `
      <div class="crudhead" style="margin-top:18px">
        <h3 style="margin:0">Purchase orders by Sales Order (URC format)</h3>
        <button type="button" class="mini add" data-ponew>New purchase order</button>
      </div>
      ${!refGroups.length ? '<p class="empty">No purchase orders yet — use New purchase order to create the first one.</p>' : ''}
      ${refGroups.map(([ref, lines]) => {
        const h = lines[0];
        const totQty = lines.reduce((a, l) => a + Number(l.received_qty || l.purchase_qty), 0);
        const totAmt = lines.reduce((a, l) => a + Number(l.purchase_qty) * Number(l.unit_cost), 0);
        return `<div class="crudblock">
          <div class="crudhead">
            <h3 style="margin:0">SALES ORDER No. ${esc(ref.replace(/^SO /, ''))}</h3>
            <span class="badge ${String(h.status).toLowerCase() === 'received' ? 'green' : 'amber'}">${esc(h.status)}</span>
            <span style="margin-left:auto"><b>S.O. date:</b> ${d10(h.order_date)}
              &nbsp; <b>Vendor:</b> ${esc(vendMap[h.vendor_id] ?? '—')}</span>
            <span class="actions">
              <button type="button" class="mini add" data-poadd="${esc(ref)}">Add line</button>
              <button type="button" class="mini danger" data-podelso="${esc(ref)}">Delete SO</button>
            </span>
          </div>
          <div class="tablewrap"><table>
            <thead><tr><th>Product description</th><th class="num">Quantity</th>
              <th class="num">Unit cost (net)</th><th class="num">Amount</th><th>Received</th><th></th></tr></thead>
            <tbody>
              ${lines.map((l) => `<tr>
                <td>${esc(itemMap[l.item_id] ?? '')}${Number(l.unit_cost) === 0 ? ' <span class="badge green">FREE — deal</span>' : ''}</td>
                <td class="num">${Number(l.purchase_qty)}</td>
                <td class="num">${Number(l.unit_cost) === 0 ? '0.00' : fmt(l.unit_cost)}</td>
                <td class="num">${fmt(Number(l.purchase_qty) * Number(l.unit_cost))}</td>
                <td>${d10(l.received_date) || '—'}</td>
                <td><span class="actions">
                  <button type="button" class="mini" data-poedit="${l.id}">Edit</button>
                  <button type="button" class="mini danger" data-podel="${l.id}">Delete</button>
                </span></td>
              </tr>`).join('')}
              <tr style="font-weight:700;border-top:2px solid var(--line, #ccc)">
                <td>TOTAL</td><td class="num">${totQty}</td><td></td>
                <td class="num">${fmt(totAmt)}</td><td></td><td></td>
              </tr>
            </tbody>
          </table></div>
        </div>`;
      }).join('')}
      <div id="poModal" class="modal hidden">
        <div class="modal-box" style="width:min(680px,100%)">
          <div class="modal-head"><h3 id="poModalTitle" style="margin:0;flex:1">Purchase line</h3>
            <button type="button" class="mini" id="poModalClose">Close</button></div>
          <div class="modal-body"><form id="poForm" class="form">
            <input type="hidden" name="id">
            <div class="grid3">
              <label>SO / Ref No. <input name="ref_id"></label>
              <label>Order date <input type="date" name="order_date" required></label>
              <label>Received date <input type="date" name="received_date"></label>
              <label>Expiry date (batch — for FEFO alerts) <input type="date" name="expiry_date"></label>
              <label>Item <select name="item_id" required><option value="">—</option>
                ${itemOpts.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></label>
              <label>Ordered qty <input type="number" name="purchase_qty" step="any" min="0" required></label>
              <label>Received qty <input type="number" name="received_qty" step="any" min="0"></label>
              <label>Unit cost (0 = free goods) <input type="number" name="unit_cost" step="any" min="0" required></label>
              <label>Status <select name="status">
                ${['Ordered', 'Partial', 'Received', 'Cancelled'].map((s) => `<option>${s}</option>`).join('')}</select></label>
              <label>Vendor <select name="vendor_id"><option value="">—</option>
                ${vendOpts.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></label>
              <label>Paid from account <select name="account_id"><option value="">—</option>
                ${acctOpts.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></label>
              <label style="grid-column:1/-1">Notes <input name="notes"></label>
            </div>
            <button type="submit" class="primary">Save</button>
          </form></div>
        </div>
      </div>`;
    return `<h2>Purchases</h2>
      <h3>Reorder suggestions (at or below minimum stock)</h3>
      ${reorderHtml}
      ${poHtml}
      ${crudBlock('purchases', {
        title: 'Purchase orders', endpoint: '/api/purchases', rows,
        fields: [
          { name: 'order_date', label: 'Order date', type: 'date', required: true },
          { name: 'received_date', label: 'Received date', type: 'date' },
          { name: 'expiry_date', label: 'Expiry date (batch)', type: 'date' },
          { name: 'ref_id', label: 'Ref/ID' },
          { name: 'item_id', label: 'Item', type: 'select', options: itemOpts, required: true },
          { name: 'purchase_qty', label: 'Ordered qty', type: 'number', required: true },
          { name: 'received_qty', label: 'Received qty', type: 'number' },
          { name: 'unit_cost', label: 'Unit cost', type: 'number', required: true },
          { name: 'account_id', label: 'Paid from account', type: 'select', options: acctOpts },
          { name: 'status', label: 'Status', type: 'select', options: ['Ordered', 'Partial', 'Received', 'Cancelled'].map((s) => ({ value: s, label: s })) },
          { name: 'vendor_id', label: 'Vendor', type: 'select', options: vendOpts },
          { name: 'notes', label: 'Notes' },
        ],
        columns: [
          { key: 'order_date', label: 'Ordered', render: (r) => d10(r.order_date) },
          { key: 'received_date', label: 'Received', render: (r) => d10(r.received_date) },
          { key: 'item_id', label: 'Item', render: (r) => esc(itemMap[r.item_id] ?? '') },
          { key: 'purchase_qty', label: 'Qty', num: 1 },
          { key: 'received_qty', label: 'Recv', num: 1 },
          { key: 'unit_cost', label: 'Unit cost', num: 1, render: (r) => fmt(r.unit_cost) },
          { key: '_tc', label: 'Total', num: 1, render: (r) => fmt(r.purchase_qty * r.unit_cost) },
          { key: 'vendor_id', label: 'Vendor', render: (r) => esc(vendMap[r.vendor_id] ?? '') },
          { key: 'status', label: 'Status' },
          { key: '_recv', label: '', render: (r) =>
              ['received', 'cancelled'].includes(String(r.status).toLowerCase()) ? '' :
              `<button type="button" class="mini add" data-receive="${r.id}" data-qty="${r.purchase_qty}">Receive</button>` },
        ],
      })}
      ${crudBlock('vendors', {
        title: 'Vendors', endpoint: '/api/vendors', rows: vendors,
        fields: [
          { name: 'name', label: 'Vendor name', required: true },
          { name: 'contact_name', label: 'Contact name' },
          { name: 'phone', label: 'Phone' },
          { name: 'email', label: 'Email' },
          { name: 'address', label: 'Address' },
          { name: 'country', label: 'Country' },
          { name: 'notes', label: 'Notes' },
        ],
        columns: [
          { key: 'name', label: 'Vendor' }, { key: 'contact_name', label: 'Contact' },
          { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
          { key: 'address', label: 'Address' }, { key: 'notes', label: 'Notes' },
        ],
      })}
      <h3>Vendor performance</h3>
      ${table(perf, [
        { key: 'name', label: 'Vendor' }, { key: 'orders', label: 'Orders', num: 1 },
        { key: 'total_spent', label: 'Total spent', num: 1, render: (r) => fmt(r.total_spent) },
        { key: 'avg_shipping_days', label: 'Avg ship days', num: 1 },
      ])}`;
  },

  // ================= Expenses =================
  async expenses() {
    const [rows, acctOpts, recurring] = await Promise.all([
      api.get('/api/expenses'), opts('/api/accounts'), api.get('/api/recurring_expenses')]);
    const acctMap = lookupMap(acctOpts);
    return `<h2>Expenses</h2>
      ${crudBlock('recurring_expenses', {
        title: 'Recurring monthly expenses (auto-posted on their day of month)',
        endpoint: '/api/recurring_expenses', rows: recurring,
        fields: [
          { name: 'name', label: 'Name (e.g. Rent, Electricity)', required: true },
          { name: 'category', label: 'Category', required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'tax', label: 'Tax', type: 'number' },
          { name: 'shipping', label: 'Shipping', type: 'number' },
          { name: 'fees', label: 'Fees', type: 'number' },
          { name: 'account_id', label: 'Account', type: 'select', options: acctOpts },
          { name: 'day_of_month', label: 'Day of month (1-28)', type: 'number', required: true },
          { name: 'active', label: 'Active', type: 'checkbox' },
        ],
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'amount', label: 'Amount', num: 1, render: (r) => fmt(r.amount) },
          { key: 'day_of_month', label: 'Day', num: 1 },
          { key: 'account_id', label: 'Account', render: (r) => esc(acctMap[r.account_id] ?? '') },
          { key: 'active', label: 'Active', render: (r) => r.active ? 'Yes' : 'No' },
          { key: 'last_posted', label: 'Last posted', render: (r) => d10(r.last_posted) },
        ],
      })}
      <button type="button" class="mini add" id="runRecurring" style="margin-bottom:14px">Post due recurring expenses now</button>
      ${crudBlock('expenses', {
        title: 'Expenses', endpoint: '/api/expenses', rows: rows.slice().reverse(),
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'ref_id', label: 'Ref/ID' },
          { name: 'category', label: 'Category', required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'tax', label: 'Tax', type: 'number' },
          { name: 'shipping', label: 'Shipping', type: 'number' },
          { name: 'fees', label: 'Fees', type: 'number' },
          { name: 'account_id', label: 'Account', type: 'select', options: acctOpts },
          { name: 'description', label: 'Description' },
          { name: 'remarks', label: 'Remarks' },
        ],
        columns: [
          { key: 'date', label: 'Date', render: (r) => d10(r.date) },
          { key: 'category', label: 'Category' },
          { key: 'amount', label: 'Amount', num: 1, render: (r) => fmt(r.amount) },
          { key: 'tax', label: 'Tax', num: 1, render: (r) => fmt(r.tax) },
          { key: 'shipping', label: 'Shipping', num: 1, render: (r) => fmt(r.shipping) },
          { key: 'fees', label: 'Fees', num: 1, render: (r) => fmt(r.fees) },
          { key: '_net', label: 'Net', num: 1, render: (r) => fmt(Number(r.amount) - Number(r.tax) + Number(r.shipping) + Number(r.fees)) },
          { key: 'account_id', label: 'Account', render: (r) => esc(acctMap[r.account_id] ?? '') },
          { key: 'description', label: 'Description' },
          { key: '_receipt', label: 'Receipt', render: (r) => r.has_receipt
              ? `<button type="button" class="mini" data-expviewreceipt="${r.id}">View receipt</button>`
              : `<button type="button" class="mini" data-expsnapreceipt="${r.id}"
                  title="Live camera only — snap the physical receipt">Snap receipt</button>` },
        ],
      })}`;
  },

  // ================= Accounts (balances + CRUD + balance entries) =================
  async accounts() {
    const [bal, accts, entries, acctOpts] = await Promise.all([
      api.get('/api/reports/account_balances'), api.get('/api/accounts'),
      api.get('/api/balance_entries'), opts('/api/accounts'),
    ]);
    const acctMap = lookupMap(acctOpts);
    window._acctBalances = bal;
    return `<h2>Accounts</h2>
      <h3>Balances</h3>
      ${table(bal, [
        { key: 'name', label: 'Account' },
        { key: 'beginning_balance', label: 'Beginning', num: 1, render: (r) => fmt(r.beginning_balance) },
        { key: 'total_deposits', label: 'Deposits', num: 1, render: (r) => fmt(r.total_deposits) },
        { key: 'total_withdrawals', label: 'Withdrawals', num: 1, render: (r) => fmt(r.total_withdrawals) },
        { key: 'balance_adjustments', label: 'Adjustments', num: 1, render: (r) => fmt(r.balance_adjustments) },
        { key: 'current_balance', label: 'Current', num: 1, render: (r) => `<strong>${fmt(r.current_balance)}</strong>` },
      ])}
      <h3>Transfer between accounts</h3>
      <form id="xferForm" class="form">
        <div class="grid3">
          <label>From account <select name="from_account_id" required><option value="">—</option>
            ${acctOpts.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></label>
          <label>To account <select name="to_account_id" required><option value="">—</option>
            ${acctOpts.map((o) => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></label>
          <label>Amount <input type="number" name="amount" step="any" min="0.01" required></label>
          <label>Date <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label>Description (e.g. deposit of cash sales, petty cash top-up)
            <input name="description"></label>
        </div>
        <button type="submit" class="primary">Transfer</button>
      </form>
      ${crudBlock('accounts', {
        title: 'Accounts', endpoint: '/api/accounts', rows: accts,
        fields: [
          { name: 'name', label: 'Account name', required: true },
          { name: 'beginning_balance', label: 'Beginning balance', type: 'number' },
          { name: 'last_checked', label: 'Last checked', type: 'date' },
        ],
        columns: [
          { key: 'name', label: 'Account' },
          { key: 'beginning_balance', label: 'Beginning', num: 1, render: (r) => fmt(r.beginning_balance) },
          { key: 'last_checked', label: 'Last checked', render: (r) => d10(r.last_checked) },
        ],
      })}
      ${crudBlock('balance_entries', {
        title: 'Deposits / withdrawals (Balance tab)', endpoint: '/api/balance_entries', rows: entries,
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'ref_id', label: 'Ref/ID' },
          { name: 'account_id', label: 'Account', type: 'select', options: acctOpts, required: true },
          { name: 'amount', label: 'Amount (+deposit / −withdrawal)', type: 'number', required: true },
          { name: 'description', label: 'Description' },
          { name: 'remarks', label: 'Remarks' },
        ],
        columns: [
          { key: 'date', label: 'Date', render: (r) => d10(r.date) },
          { key: 'account_id', label: 'Account', render: (r) => esc(acctMap[r.account_id] ?? '') },
          { key: 'amount', label: 'Amount', num: 1, render: (r) => fmt(r.amount) },
          { key: 'description', label: 'Description' },
        ],
      })}`;
  },

  // ================= Team (reps + SRC report + FAT budget + allocations) =================
  async team() {
    const [reps, comms, allocs, settings] = await Promise.all([
      api.get('/api/sales_reps'), api.get('/api/reports/rep_commissions'),
      api.get('/api/financial_allocations'), api.get('/api/settings'),
    ]);

    // ---- SRC: Sales Representative Commissions (per-rep, date-range detail) ----
    const src = window._src || { rep: reps[0]?.id, from: '', to: '' };
    window._src = src;
    let srcDetail = '<p class="empty">No sales for this rep in the selected period.</p>';
    let srcTotal = 0;
    if (src.rep) {
      const qs = [];
      if (src.from) qs.push(`from=${src.from}`);
      if (src.to) qs.push(`to=${src.to}`);
      const sales = (await api.get('/api/sales' + (qs.length ? '?' + qs.join('&') : '')))
        .filter((s) => s.sales_rep_id === Number(src.rep) && !String(s.status).toLowerCase().includes('cancel'));
      srcTotal = sales.reduce((a, s) => a + Number(s.total), 0);
      const lines = sales.flatMap((s) => (s.items.length ? s.items : [{}]).map((it, ix) => ({ s, it, first: ix === 0 })));
      if (lines.length) srcDetail = table(lines, [
        { key: 'date', label: 'Date', render: (l) => l.first ? d10(l.s.date) : '' },
        { key: 'no', label: 'Sales #', render: (l) => l.first ? esc(l.s.sales_no) : '' },
        { key: 'item', label: 'Item', render: (l) => esc(l.it.item ?? '') },
        { key: 'lt', label: 'Total price', num: 1, render: (l) => Number(l.it.total_price) ? fmt(l.it.total_price) : '' },
        { key: 'sub', label: 'Subtotal', num: 1, render: (l) => l.first ? fmt(l.s.subtotal) : '' },
        { key: 'tot', label: 'Total', num: 1, render: (l) => l.first ? `<strong>${fmt(l.s.total)}</strong>` : '' },
      ]);
    }

    // ---- FAT: Financial Allocation Trail (budget → latest rate per category) ----
    const budget = Number(settings.allocation_budget || 0);
    const latest = {};
    for (const a of allocs.slice().sort((x, y) => String(x.date).localeCompare(String(y.date)) || x.id - y.id)) {
      latest[a.allocation] = a.new_rate != null ? Number(a.new_rate) : null;
    }
    const catRows = Object.entries(latest).map(([cat, rate]) => ({
      cat, rate, amount: rate != null ? rate * budget : null }));
    const totRate = catRows.reduce((a, r) => a + (r.rate ?? 0), 0);
    const fatSummary = `
      <div class="twocol">
        <form id="budgetForm" class="form">
          <label>Input budget here
            <input type="number" name="allocation_budget" step="any" value="${budget || ''}"></label>
          <button type="submit" class="primary" style="margin-top:10px">Save budget</button>
        </form>
        <div>
          <div class="cards" style="margin-bottom:12px">
            <div class="card"><span>Total allocated</span><strong>${(totRate * 100).toFixed(2)}%</strong></div>
            <div class="card amber"><span>Allocated amount</span><strong>${fmt(totRate * budget)}</strong></div>
          </div>
          ${table(catRows, [
            { key: 'cat', label: 'Items' },
            { key: 'rate', label: 'Rates', num: 1, render: (r) => r.rate != null ? (r.rate * 100).toFixed(2) + '%' : '-' },
            { key: 'amount', label: 'Amount', num: 1, render: (r) => r.amount != null ? fmt(r.amount) : '-' },
          ])}
        </div>
      </div>`;

    return `<h2>Team</h2>
      <h3>Sales representative commissions (SRC)</h3>
      <form id="srcForm" class="rangeform">
        <label>Sales rep <select name="rep">
          ${reps.map((r) => `<option value="${r.id}" ${Number(src.rep) === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}
        </select></label>
        <label>Start date <input type="date" name="from" value="${src.from}"></label>
        <label>End date <input type="date" name="to" value="${src.to}"></label>
        <button type="submit" class="mini add">Apply</button>
        <button type="button" class="mini" id="commSheetBtn"
          title="Formal payout sheet for the selected rep and period">Print payout sheet</button>
        <div class="card arcard"><span>Total (period)</span><strong>${fmt(srcTotal)}</strong></div>
      </form>
      ${srcDetail}
      <h3>Financial allocation trail (FAT)</h3>
      ${fatSummary}
      ${crudBlock('sales_reps', {
        title: 'Sales reps', endpoint: '/api/sales_reps', rows: reps,
        fields: [
          { name: 'name', label: 'Name', required: true },
          { name: 'commission_rate', label: 'Commission rate (0.05 = 5%)', type: 'number' },
        ],
        columns: [
          { key: 'name', label: 'Rep' },
          { key: 'commission_rate', label: 'Rate', num: 1, render: (r) => (r.commission_rate * 100).toFixed(2) + '%' },
        ],
      })}
      <h3>Commissions (auto-computed)</h3>
      ${table(comms, [
        { key: 'name', label: 'Rep' },
        { key: 'sales_count', label: 'Sales', num: 1 },
        { key: 'total_sales', label: 'Total sales', num: 1, render: (r) => fmt(r.total_sales) },
        { key: 'commission', label: 'Commission', num: 1, render: (r) => fmt(r.commission) },
      ])}
      ${crudBlock('financial_allocations', {
        title: 'Financial allocations', endpoint: '/api/financial_allocations', rows: allocs,
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'user_name', label: 'User', required: true },
          { name: 'allocation', label: 'Allocation', required: true },
          { name: 'old_rate', label: 'Old rate', type: 'number' },
          { name: 'new_rate', label: 'New rate', type: 'number' },
          { name: 'remarks', label: 'Remarks' },
        ],
        columns: [
          { key: 'date', label: 'Date', render: (r) => d10(r.date) },
          { key: 'user_name', label: 'User' },
          { key: 'allocation', label: 'Allocation' },
          { key: 'old_rate', label: 'Old rate', num: 1 },
          { key: 'new_rate', label: 'New rate', num: 1 },
          { key: 'remarks', label: 'Remarks' },
        ],
      })}`;
  },

  // ================= Inventory Dashboard (mirrors the sheet's biggest tab) =================
  // ================= Matrix Report (URC pricing: ex-plant capital → published price) =================
  async matrix() {
    const [items, sales, claims] = await Promise.all([
      api.get('/api/items'), api.get('/api/sales'), api.get('/api/claims')]);
    const feeds = items.filter((i) => i.price_breakdown && i.price_breakdown.dealer_build
      && i.category !== 'Robichem');
    const ORDER = ['Supreme Hogs', 'Premium Hogs', 'Stargain Hogs', 'Gamefowl', 'Pet Food', 'Pet Treats', 'Pet Supplies'];
    const groups = {};
    feeds.forEach((i) => (groups[i.category] ??= []).push(i));
    const cats = [...ORDER.filter((c) => groups[c]),
                  ...Object.keys(groups).filter((c) => !ORDER.includes(c)).sort()];
    const N = (v) => (v == null || isNaN(Number(v))) ? null : Number(v);
    const F = (v) => v == null ? '—'
      : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // monitoring page → every section folds away; open state remembered per device
    let clpState = {};
    try { clpState = JSON.parse(localStorage.getItem('ea_matrix_clp') || '{}'); } catch {}
    const clp = (key, title, inner, defOpen = false) => `
      <details class="collapse" data-clp="${esc(key)}" ${(clpState[key] ?? defOpen) ? 'open' : ''}>
        <summary>${title}</summary>
        <div class="clpbody">${inner}</div>
      </details>`;
    // sheet column order: purchase discounts (ex-plant side) and price build-up (matrix side)
    const DISC = [['distributor', 'Distributor'], ['od', 'OD'], ['pickup', 'Pick-up'],
                  ['bdf', 'BDF'], ['manpower', 'Manpower'], ['special', 'Special']];
    const BUILD = [['distributor_income', 'Distributor income'], ['fth', 'Freight & handling'],
                   ['dist_to_dealer', 'Dist. to Dealer'], ['sales_fund', 'Sales support'],
                   ['manpower_fund', 'Manpower fund'], ['bus_devt', 'Business devt'],
                   ['dealer_discount', 'Dealer discount'], ['cash_discount', 'Cash (COD)'],
                   ['ktech', 'Ktech/SR incentives']];
    const pbdOf = (i) => {
      const b = i.price_breakdown;
      if (N(b.ex_plant) == null || N(b.pbd_rate) == null) return null;
      const base = N(b.ex_plant) - Object.values(b.discounts || {}).reduce((a, v) => a + (N(v) || 0), 0);
      return base * N(b.pbd_rate);
    };
    const vatOf = (i) => {
      const b = i.price_breakdown;
      if (b.vat !== 'add_12' || N(b.ex_plant) == null) return null;
      const base = N(b.ex_plant) - Object.values(b.discounts || {}).reduce((a, v) => a + (N(v) || 0), 0);
      return (base - (pbdOf(i) || 0)) * 0.12;
    };
    const incomeOf = (i) => (N(i.sales_price) != null && N(i.cost) != null)
      ? N(i.sales_price) - N(i.cost) : null;

    const section = (cat) => {
      const rows = groups[cat];
      const discCols = DISC.filter(([k]) => rows.some((i) => N(i.price_breakdown.discounts?.[k]) != null));
      const buildCols = BUILD.filter(([k]) => rows.some((i) => N(i.price_breakdown.dealer_build?.[k]) != null));
      const hasVat = rows.some((i) => vatOf(i) != null);
      const sum = (fn) => rows.reduce((a, i) => a + (fn(i) || 0), 0);
      const avg = (fn) => {
        const vals = rows.map(fn).filter((v) => v != null);
        return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;
      };
      // tallies for the charts (per-sack pesos summed across the line-up)
      const lessenRows = [
        ...discCols.map(([k, lab]) => ({ lab, val: sum((i) => N(i.price_breakdown.discounts?.[k])) })),
        { lab: 'PBD 5%', val: sum(pbdOf) },
      ].filter((r) => r.val > 0);
      const buildRows = buildCols.map(([k, lab]) =>
        ({ lab, val: sum((i) => N(i.price_breakdown.dealer_build?.[k])) })).filter((r) => r.val > 0);
      return clp(`cat-${cat}`, `${esc(cat)} <small style="font-weight:400;color:var(--ink-2)">
          — ${rows.length} products · avg income/sack ${F(avg(incomeOf))}</small>`, `
        <div class="cards" style="margin-bottom:10px">
          <div class="card"><span>Products</span><strong>${rows.length}</strong></div>
          <div class="card green"><span>Avg gross income / sack (publish − capital)</span>
            <strong>${F(avg(incomeOf))}</strong></div>
          <div class="card"><span>Avg distributor income / sack</span>
            <strong>${F(avg((i) => N(i.price_breakdown.dealer_build?.distributor_income)))}</strong></div>
        </div>
        <div class="twocol">
          <div><h4 style="margin:6px 0">What lessens the purchase (per sack, tallied)</h4>
            ${hbar(lessenRows, { label: 'lab', value: 'val', fmtV: F, color: 'var(--accent, #e3a71f)' })}</div>
          <div><h4 style="margin:6px 0">Build-up to published price (per sack, tallied)</h4>
            ${hbar(buildRows, { label: 'lab', value: 'val', fmtV: F })}</div>
        </div>
        <div class="tablewrap" style="margin-top:8px"><table>
          <thead>
            <tr>
              <th rowspan="2">Product</th>
              <th rowspan="2">Ex-plant<br>price</th>
              <th colspan="${discCols.length + 1 + (hasVat ? 1 : 0)}">Discounts (what lessens the purchase)</th>
              <th rowspan="2">Net price /<br>capital</th>
              <th colspan="${buildCols.length}">Add (price build-up)</th>
              <th rowspan="2">NET</th>
              <th rowspan="2">Publish<br>price/bag</th>
              <th rowspan="2">Income /<br>sack</th>
            </tr>
            <tr>
              ${discCols.map(([, lab]) => `<th>${lab}</th>`).join('')}<th>PBD 5%</th>
              ${hasVat ? '<th>VAT 12%</th>' : ''}
              ${buildCols.map(([, lab]) => `<th>${lab}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((i) => {
              const b = i.price_breakdown;
              return `<tr>
                <td>${esc(i.name)}</td>
                <td class="num">${F(N(b.ex_plant))}</td>
                ${discCols.map(([k]) => `<td class="num">${F(N(b.discounts?.[k]))}</td>`).join('')}
                <td class="num">${F(pbdOf(i))}</td>
                ${hasVat ? `<td class="num">${F(vatOf(i))}</td>` : ''}
                <td class="num"><b>${F(N(i.cost))}</b></td>
                ${buildCols.map(([k]) => `<td class="num">${F(N(b.dealer_build?.[k]))}</td>`).join('')}
                <td class="num">${F(N(b.dealer_build?.net_dealer_price))}</td>
                <td class="num"><b>${F(N(i.sales_price))}</b></td>
                <td class="num"><b>${F(incomeOf(i))}</b></td>
              </tr>`;
            }).join('')}
            <tr style="font-weight:700;border-top:2px solid var(--border)">
              <td>TALLY</td>
              <td class="num">${F(sum((i) => N(i.price_breakdown.ex_plant)))}</td>
              ${discCols.map(([k]) => `<td class="num">${F(sum((i) => N(i.price_breakdown.discounts?.[k])))}</td>`).join('')}
              <td class="num">${F(sum(pbdOf))}</td>
              ${hasVat ? `<td class="num">${F(sum(vatOf))}</td>` : ''}
              <td class="num">${F(sum((i) => N(i.cost)))}</td>
              ${buildCols.map(([k]) => `<td class="num">${F(sum((i) => N(i.price_breakdown.dealer_build?.[k])))}</td>`).join('')}
              <td class="num">${F(sum((i) => N(i.price_breakdown.dealer_build?.net_dealer_price)))}</td>
              <td class="num">${F(sum((i) => N(i.sales_price)))}</td>
              <td class="num">${F(sum(incomeOf))}</td>
            </tr>
          </tbody>
        </table></div>`);
    };

    // ---- sales monitoring: volume sold, discounts given, promo free stock ----
    const range = window._matrixRange || { from: '', to: '' };
    const inRange = (sales || []).filter((s) =>
      !String(s.status).toLowerCase().includes('cancel')
      && (!range.from || String(s.date).slice(0, 10) >= range.from)
      && (!range.to || String(s.date).slice(0, 10) <= range.to));
    const catByName = Object.fromEntries(items.map((i) => [i.name, i.category]));
    const soldFeeds = {}, soldRobi = {}, discGiven = {};
    inRange.forEach((s) => (s.items || []).forEach((it) => {
      if (it.promo) return;                     // promo free goods tallied separately below
      const qty = Number(it.qty) || 0;
      const tgt = catByName[it.item] === 'Robichem' ? soldRobi : soldFeeds;
      tgt[it.item] = (tgt[it.item] || 0) + qty;
      const d = Number(it.discount) || 0;
      if (d > 0) {
        discGiven[it.item] ??= { qty: 0, amt: 0 };
        discGiven[it.item].qty += qty;
        discGiven[it.item].amt += d * qty;
      }
    }));
    const topOf = (m, n = 12) => Object.entries(m).map(([lab, val]) => ({ lab, val }))
      .sort((a, b) => b.val - a.val).slice(0, n);
    const discRows = Object.entries(discGiven).map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amt - a.amt);
    const invoiceDisc = inRange.reduce((a, s) => a + (Number(s.discount) || 0), 0);
    const feedUnits = Object.values(soldFeeds).reduce((a, v) => a + v, 0);
    const robiUnits = Object.values(soldRobi).reduce((a, v) => a + v, 0);

    // ---- RobiChem: deals are ITEMS (free goods), not price discounts ----
    const robi = items.filter((i) => i.category === 'Robichem'
      && (i.deal || i.price_breakdown?.dealer_deal));
    // promo free goods actually issued on sales in range (they moved inventory at 0.00)
    const promoGiven = {};
    inRange.forEach((s) => (s.items || []).forEach((it) => {
      if (it.promo) {
        promoGiven[it.item] ??= { qty: 0 };
        promoGiven[it.item].qty += Number(it.qty);
      }
    }));
    const costByName = Object.fromEntries(items.map((i) => [i.name, N(i.cost)]));
    const promoRows = Object.entries(promoGiven).map(([name, v]) =>
      ({ name, qty: v.qty, cost: (costByName[name] || 0) * v.qty }));
    const robiSection = !robi.length ? '' : clp('robi',
      'RobiChem — Deals (free goods, not price discounts)', `
      <p class="empty" style="margin:4px 0 10px">RobiChem promos are given as <b>extra items</b> —
        e.g. buy 10, get +1 — with the free units <b>paid by URC marketing</b>, not by the company.
        They are not deducted from the price; they leave the <b>inventory count</b> as 0.00 promo lines
        on the sale, tallied below for claiming from marketing.</p>
      <div class="tablewrap"><table>
        <thead><tr><th>Product</th><th>Packaging</th><th>Deal: URC → Distributor<br>(free stock we receive)</th>
          <th>Deal: Distributor → Dealer<br>(free stock we give, marketing-paid)</th>
          <th>Capital</th><th>Dealer acq.</th><th>SRP</th></tr></thead>
        <tbody>${robi.map((i) => `<tr>
          <td>${esc(i.name)}</td><td>${esc(i.packaging ?? '')}</td>
          <td>${i.deal ? `<span class="badge green">${esc(i.deal)}</span>` : '—'}</td>
          <td>${i.price_breakdown?.dealer_deal ? `<span class="badge green">${esc(i.price_breakdown.dealer_deal)}</span>` : '—'}</td>
          <td class="num">${F(N(i.cost))}</td>
          <td class="num">${F(N(i.dealers_acquisition))}</td>
          <td class="num">${F(N(i.sales_price))}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <h4 style="margin:12px 0 6px">Promo free goods issued (to claim from URC marketing)</h4>
      ${!promoRows.length ? '<p class="empty">No promo free goods issued on sales yet.</p>' : `
      <div class="tablewrap"><table>
        <thead><tr><th>Product</th><th class="num">Free units given</th>
          <th class="num">Cost covered by marketing</th></tr></thead>
        <tbody>${promoRows.map((r) => `<tr><td>${esc(r.name)}</td>
          <td class="num">${r.qty}</td><td class="num">${F(r.cost)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid var(--border)"><td>TALLY</td>
          <td class="num">${promoRows.reduce((a, r) => a + r.qty, 0)}</td>
          <td class="num">${F(promoRows.reduce((a, r) => a + r.cost, 0))}</td></tr></tbody>
      </table></div>`}`);

    const monitoring = clp('monitor',
      `Sales monitoring${range.from || range.to
        ? ` — ${range.from || 'start'} to ${range.to || 'today'}` : ' — all time'}`, `
      <div class="form" style="margin-bottom:10px">
        <label>From <input type="date" id="mxFrom" value="${range.from || ''}"></label>
        <label>To <input type="date" id="mxTo" value="${range.to || ''}"></label>
        <button type="button" class="mini add" id="mxApply">Apply</button>
        <button type="button" class="mini" id="mxClear">All time</button>
      </div>
      <div class="cards" style="margin-bottom:10px">
        <div class="card green"><span>Feed / pet bags sold</span><strong>${feedUnits}</strong></div>
        <div class="card"><span>RobiChem units sold</span><strong>${robiUnits}</strong></div>
        <div class="card amber"><span>Discounts given (invoices)</span><strong>${F(invoiceDisc)}</strong></div>
        <div class="card"><span>Promo free units (marketing-paid)</span>
          <strong>${promoRows.reduce((a, r) => a + r.qty, 0)}
            · ${F(promoRows.reduce((a, r) => a + r.cost, 0))}</strong></div>
      </div>
      <div class="twocol">
        <div><h4 style="margin:6px 0">Volume sold — feeds &amp; pet products (bags/packs)</h4>
          ${hbar(topOf(soldFeeds), { label: 'lab', value: 'val' })}</div>
        <div><h4 style="margin:6px 0">Volume sold — RobiChem products (units)</h4>
          ${hbar(topOf(soldRobi), { label: 'lab', value: 'val', color: 'var(--accent, #e3a71f)' })}</div>
      </div>
      <h4 style="margin:12px 0 6px">Discounted prices tallied (per product, from sale lines)</h4>
      ${!discRows.length ? '<p class="empty">No line discounts in this range.</p>' : `
      <div class="tablewrap"><table>
        <thead><tr><th>Product</th><th class="num">Units sold w/ discount</th>
          <th class="num">Avg discount / unit</th><th class="num">Total discount given</th></tr></thead>
        <tbody>${discRows.map((r) => `<tr><td>${esc(r.name)}</td>
          <td class="num">${r.qty}</td>
          <td class="num">${F(r.amt / r.qty)}</td>
          <td class="num">${F(r.amt)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid var(--border)"><td>TALLY</td>
          <td class="num">${discRows.reduce((a, r) => a + r.qty, 0)}</td><td></td>
          <td class="num">${F(discRows.reduce((a, r) => a + r.amt, 0))}</td></tr></tbody>
      </table></div>`}`, true);

    // ---- commission / income per sack SOLD (matrix components × bags sold; no RobiChem) ----
    const BUILD_INCOME = [
      ['distributor_income', 'Distributor Income'],
      ['fth', 'Freight & Handling — Plant → Whse.'],
      ['dist_to_dealer', 'Freight & Handling — Whse. → Dealer'],
      ['sales_fund', 'Sales Support Fund'],
      ['manpower_fund', 'Manpower Fund'],
      ['bus_devt', 'Business Devt Fund'],
      ['dealer_discount', 'Outright Dealers Discount'],
      ['cash_discount', 'COD Dealers Discount'],
      ['ktech', 'Ktech & Sales Incentives'],
    ];
    let incSkipped = 0;
    const incItems = Object.entries(soldFeeds).map(([name, qty]) => {
      const it = items.find((i) => i.name === name);
      const b = it?.price_breakdown?.dealer_build;
      if (!b) { incSkipped += qty; return null; }
      const comps = BUILD_INCOME.map(([k]) => (N(b[k]) || 0) * qty);
      const perSack = BUILD_INCOME.reduce((a, [k]) => a + (N(b[k]) || 0), 0);
      return { name, qty, comps, perSack, total: perSack * qty };
    }).filter(Boolean).sort((a, b) => b.total - a.total);
    const compTotals = BUILD_INCOME.map(([, lab], ix) =>
      ({ lab, val: incItems.reduce((a, r) => a + r.comps[ix], 0) }));
    const incGrand = incItems.reduce((a, r) => a + r.total, 0);
    const incBags = incItems.reduce((a, r) => a + r.qty, 0);
    // the same computation PER INVOICE — every sale shows what it earned
    const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
    const incBySale = inRange.map((s) => {
      const comps = BUILD_INCOME.map(() => 0);
      let bags = 0;
      (s.items || []).forEach((it) => {
        if (it.promo) return;                                  // free goods earn nothing
        const item = itemsById[it.item_id];
        const b = item?.price_breakdown?.dealer_build;
        if (!b || item.category === 'Robichem') return;
        const qty = Number(it.qty) || 0;
        bags += qty;
        BUILD_INCOME.forEach(([k], ix) => { comps[ix] += (N(b[k]) || 0) * qty; });
      });
      return { date: String(s.date).slice(0, 10), sales_no: s.sales_no, customer: s.customer,
               bags, comps, total: comps.reduce((a, v) => a + v, 0) };
    }).filter((r) => r.bags > 0)
      .sort((a, b) => b.date.localeCompare(a.date) || b.sales_no.localeCompare(a.sales_no));
    const fhTotal = compTotals[1].val + compTotals[2].val;
    const incomeSection = clp('income',
      `Commission / income per sack sold <small style="font-weight:400;color:var(--ink-2)">
        — ${incBags} bags · total ${fmt(incGrand)}</small>`, `
      <p class="empty" style="margin:4px 0 10px">Every bag sold earns the matrix components below
        (per-sack pesos from the URC price build-up × bags sold in the selected monitoring range).
        RobiChem is excluded — its income follows the deals structure, not the per-sack matrix.</p>
      <div class="cards" style="margin-bottom:10px">
        <div class="card green"><span>Distributor income</span><strong>${fmt(compTotals[0].val)}</strong></div>
        <div class="card"><span>Freight &amp; handling</span><strong>${fmt(fhTotal)}</strong></div>
        <div class="card"><span>Funds + incentives</span>
          <strong>${fmt(compTotals[3].val + compTotals[4].val + compTotals[5].val + compTotals[8].val)}</strong></div>
        <div class="card amber"><span>Dealers discounts (outright + COD)</span>
          <strong>${fmt(compTotals[6].val + compTotals[7].val)}</strong></div>
        <div class="card green"><span>TOTAL income (range)</span><strong>${fmt(incGrand)}</strong></div>
      </div>
      ${clp('income-cat', `By income category <small style="font-weight:400;color:var(--ink-2)">
          — total ${fmt(incGrand)}</small>`, `
      <div class="tablewrap"><table>
        <thead><tr><th>Income category</th><th class="num">Total (bags sold × per-sack)</th></tr></thead>
        <tbody>${compTotals.map((c) => `<tr><td>${c.lab}</td><td class="num">${F(c.val)}</td></tr>`).join('')}
          <tr style="font-weight:700;border-top:2px solid var(--border)">
            <td>TOTAL</td><td class="num">${F(incGrand)}</td></tr></tbody>
      </table></div>`)}
      ${clp('income-prod', `Per product <small style="font-weight:400;color:var(--ink-2)">
          — ${incItems.length} product${incItems.length === 1 ? '' : 's'} · ${incBags} bags</small>`,
      !incItems.length ? '<p class="empty">No feed/pet bags sold in this range.</p>' : `
      <div class="tablewrap"><table>
        <thead><tr><th>Product</th><th class="num">Bags sold</th>
          <th class="num">Dist. income</th><th class="num">FTH Plant-Whse.</th>
          <th class="num">Whse.-Dealer</th><th class="num">Sales</th><th class="num">Manpower</th>
          <th class="num">Bus. Devt</th><th class="num">Outright</th><th class="num">COD</th>
          <th class="num">Ktech</th><th class="num">Income/sack</th><th class="num">Total</th></tr></thead>
        <tbody>${incItems.map((r) => `<tr>
          <td>${esc(r.name)}</td><td class="num">${r.qty}</td>
          ${r.comps.map((v) => `<td class="num">${F(v)}</td>`).join('')}
          <td class="num">${F(r.perSack)}</td>
          <td class="num"><b>${F(r.total)}</b></td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid var(--border)"><td>TALLY</td>
          <td class="num">${incBags}</td>
          ${compTotals.map((c) => `<td class="num">${F(c.val)}</td>`).join('')}
          <td></td><td class="num">${F(incGrand)}</td></tr></tbody>
      </table></div>`)}
      ${clp('income-inv', `Per invoice — what each sale earned <small style="font-weight:400;color:var(--ink-2)">
          — ${incBySale.length} invoice${incBySale.length === 1 ? '' : 's'}</small>`,
      !incBySale.length ? '<p class="empty">No qualifying sales in this range.</p>' : `
      <div class="tablewrap"><table>
        <thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th class="num">Bags</th>
          <th class="num">Dist. income</th><th class="num">FTH Plant-Whse.</th>
          <th class="num">Whse.-Dealer</th><th class="num">Sales</th><th class="num">Manpower</th>
          <th class="num">Bus. Devt</th><th class="num">Outright</th><th class="num">COD</th>
          <th class="num">Ktech</th><th class="num">Income (invoice)</th></tr></thead>
        <tbody>${incBySale.map((r) => `<tr>
          <td>${r.date}</td><td>${esc(r.sales_no)}</td><td>${esc(r.customer)}</td>
          <td class="num">${r.bags}</td>
          ${r.comps.map((v) => `<td class="num">${F(v)}</td>`).join('')}
          <td class="num"><b>${F(r.total)}</b></td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid var(--border)">
          <td colspan="3">TALLY (${incBySale.length} invoice${incBySale.length === 1 ? '' : 's'})</td>
          <td class="num">${incBySale.reduce((a, r) => a + r.bags, 0)}</td>
          ${compTotals.map((c) => `<td class="num">${F(c.val)}</td>`).join('')}
          <td class="num">${F(incGrand)}</td></tr></tbody>
      </table></div>`)}
      ${incSkipped ? `<p class="empty" style="margin-top:8px">${incSkipped} unit(s) sold had no
        price-matrix breakdown on their item and are not counted here.</p>` : ''}`, true);

    // promo totals for one-click claim drafting (respects the date filter)
    window._matrixPromo = {
      qty: promoRows.reduce((a, r) => a + r.qty, 0),
      cost: Math.round(promoRows.reduce((a, r) => a + r.cost, 0) * 100) / 100,
      from: range.from || null, to: range.to || null,
    };
    const claimBadge = (s) => s === 'Credited' ? `<span class="badge green">${esc(s)}</span>`
      : s === 'Filed' ? `<span class="badge amber">${esc(s)}</span>`
      : s === 'Approved' ? `<span class="badge green">${esc(s)}</span>` : esc(s);
    const claimsHtml = crudBlock('claims', {
      title: 'Claims to URC (promos, damages, returns — money the principal owes back)',
      endpoint: '/api/claims', rows: claims,
      fields: [
        { name: 'claim_type', label: 'Type', type: 'select', options: [
          'Promo free goods', 'Damaged goods', 'Returns', 'Price adjustment', 'Other']
          .map((v) => ({ value: v, label: v })) },
        { name: 'period_from', label: 'Period from', type: 'date' },
        { name: 'period_to', label: 'Period to', type: 'date' },
        { name: 'qty', label: 'Qty (units)', type: 'number' },
        { name: 'amount', label: 'Amount to claim', type: 'number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          'Draft', 'Filed', 'Approved', 'Credited'].map((v) => ({ value: v, label: v })) },
        { name: 'filed_date', label: 'Filed date', type: 'date' },
        { name: 'credited_date', label: 'Credited date', type: 'date' },
        { name: 'notes', label: 'Notes' },
      ],
      columns: [
        { key: 'claim_type', label: 'Type' },
        { key: 'period_from', label: 'Period', render: (r) =>
            `${d10(r.period_from) || '…'} → ${d10(r.period_to) || '…'}` },
        { key: 'qty', label: 'Qty', num: 1 },
        { key: 'amount', label: 'Amount', num: 1, render: (r) => fmt(r.amount) },
        { key: 'status', label: 'Status', render: (r) => claimBadge(r.status) },
        { key: 'filed_date', label: 'Filed', render: (r) => d10(r.filed_date) },
        { key: 'credited_date', label: 'Credited', render: (r) => d10(r.credited_date) },
        { key: 'notes', label: 'Notes' },
      ],
    });
    const openClaims = claims.filter((c) => c.status !== 'Credited')
      .reduce((a, c) => a + Number(c.amount), 0);

    return `<h2>Matrix Report</h2>
      <p class="empty" style="margin:4px 0 12px">URC price flow per sack: <b>ex-plant price</b> less the
        purchase discounts = <b>net price / capital</b> (what the company pays), then the build-up
        components lead to the <b>published price</b> — the spread is the company's gross income per sack.
        Sales monitoring below tracks volumes sold, discounts given, and RobiChem promo free goods
        (marketing-paid). RobiChem deals are free-goods promos, not price discounts.</p>
      <div class="form" style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <b style="font-size:12.5px;color:var(--ink-2)">CUSTOMER-FACING PRICE LISTS:</b>
        <button type="button" class="mini" data-pricelist="srp">Retail (SRP)</button>
        <button type="button" class="mini" data-pricelist="outright">Outright dealer</button>
        <button type="button" class="mini" data-pricelist="cod">COD dealer</button>
      </div>
      ${monitoring}
      ${incomeSection}
      ${cats.map(section).join('')}
      ${robiSection}
      ${clp('claims', `Claims to URC <small style="font-weight:400;color:var(--ink-2)">
          — not yet credited: ${fmt(openClaims)}</small>`, `
      <div class="cards" style="margin:6px 0">
        <div class="card amber"><span>Claims not yet credited by URC</span><strong>${fmt(openClaims)}</strong></div>
        <div class="card"><span>Draft a claim from the promo tally</span>
          <button type="button" class="mini add" id="draftClaimBtn" style="margin-top:8px">
            Draft claim — ${window._matrixPromo.qty} units · ${fmt(window._matrixPromo.cost)}</button></div>
      </div>
      ${claimsHtml}`)}`;
  },

  async invdash() {
    const now = new Date();
    const st = window._invdash || (window._invdash = {
      year: now.getFullYear(), month: now.getMonth() + 1,
      ss: { from: '', to: '', item: '' }, pi: { from: '', to: '', item: '' }, pv: { from: '', to: '', vendor: '' },
    });
    const [stock, sales, purchases, perf, itemsFull] = await Promise.all([
      api.get('/api/reports/item_stock'), api.get('/api/sales'),
      api.get('/api/purchases'), api.get('/api/reports/vendor_performance'),
      api.get('/api/items'),
    ]);
    // merge full item records (price_breakdown, deal, tiers) with live stock
    const stockById = Object.fromEntries(stock.map((s) => [s.id, s]));
    window._invItems = itemsFull.map((i) => ({ ...i, ...{
      on_hand: stockById[i.id]?.on_hand ?? 0,
      status: stockById[i.id]?.status ?? '-',
      margin: stockById[i.id]?.margin ?? null,
    } }));
    const live = sales.filter((s) => !String(s.status).toLowerCase().includes('cancel'));
    const skuBy = Object.fromEntries(stock.map((s) => [s.name, s.sku || '-']));

    // ---- KPIs ----
    const materials = stock.filter((s) => s.type === 'Material');
    const qtyStock = stock.reduce((a, s) => a + Number(s.on_hand), 0);
    const qtySold = stock.reduce((a, s) => a + Number(s.qty_sold), 0);

    // ---- status counts ----
    const stat = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 };
    stock.forEach((s) => stat[s.status] = (stat[s.status] || 0) + 1);
    const outPct = stock.length ? (stat['Out of Stock'] / stock.length * 100).toFixed(2) : '0.00';

    // ---- bestsellers (all-time) ----
    const soldBy = {};
    live.forEach((s) => s.items.forEach((it) => soldBy[it.item] = (soldBy[it.item] || 0) + Number(it.qty)));
    const totalSoldQty = Object.values(soldBy).reduce((a, b) => a + b, 0) || 1;
    const top20 = Object.entries(soldBy).map(([item, qty]) => ({ item, qty, pct: (qty / totalSoldQty * 100).toFixed(1) + '%' }))
      .sort((a, b) => b.qty - a.qty).slice(0, 20);

    // ---- monthly & daily sales qty ----
    const mQty = Array(12).fill(0);
    live.filter((s) => String(s.date).startsWith(st.year))
      .forEach((s) => s.items.forEach((it) => mQty[new Date(s.date).getMonth()] += Number(it.qty)));
    const dim = new Date(st.year, st.month, 0).getDate();
    const dQty = Array(dim).fill(0);
    live.filter((s) => String(s.date).startsWith(`${st.year}-${String(st.month).padStart(2, '0')}`))
      .forEach((s) => s.items.forEach((it) => dQty[new Date(s.date).getDate() - 1] += Number(it.qty)));

    // ---- sales / purchases by status ----
    const sStat = {}; sales.forEach((s) => sStat[s.status] = (sStat[s.status] || 0) + 1);
    const pStat = {}; purchases.forEach((p) => pStat[p.status] = (pStat[p.status] || 0) + 1);

    // ---- sales search ----
    let ssRes = null;
    if (st.ss.item) {
      const inRange = (d) => (!st.ss.from || d >= st.ss.from) && (!st.ss.to || d <= st.ss.to);
      let qty = 0, orders = 0;
      live.filter((s) => inRange(String(s.date).slice(0, 10))).forEach((s) => {
        const lines = s.items.filter((it) => it.item === st.ss.item);
        if (lines.length) { orders++; lines.forEach((l) => qty += Number(l.qty)); }
      });
      ssRes = { sku: skuBy[st.ss.item] ?? '-', qty, orders };
    }

    // ---- purchases searches ----
    const itemById = Object.fromEntries(stock.map((s) => [s.id, s.name]));
    const vendorNames = [...new Set(perf.map((v) => v.name))];
    let piRes = null;
    if (st.pi.item) {
      const rows = purchases.filter((p) => itemById[p.item_id] === st.pi.item
        && (!st.pi.from || p.order_date >= st.pi.from) && (!st.pi.to || p.order_date <= st.pi.to)
        && !String(p.status).toLowerCase().includes('cancel'));
      piRes = { sku: skuBy[st.pi.item] ?? '-',
        qty: rows.reduce((a, p) => a + Number(p.purchase_qty), 0),
        val: rows.reduce((a, p) => a + p.purchase_qty * p.unit_cost, 0) };
    }
    let pvRes = null;
    if (st.pv.vendor) {
      const vperf = perf.find((v) => v.name === st.pv.vendor);
      const vid = vperf?.id;
      const rows = purchases.filter((p) => p.vendor_id === vid
        && (!st.pv.from || p.order_date >= st.pv.from) && (!st.pv.to || p.order_date <= st.pv.to)
        && !String(p.status).toLowerCase().includes('cancel'));
      pvRes = { qty: rows.reduce((a, p) => a + Number(p.purchase_qty), 0),
        val: rows.reduce((a, p) => a + p.purchase_qty * p.unit_cost, 0) };
    }

    // ---- monthly purchase qty ----
    const mPur = Array(12).fill(0);
    purchases.filter((p) => String(p.order_date).startsWith(st.year) && !String(p.status).toLowerCase().includes('cancel'))
      .forEach((p) => mPur[new Date(p.order_date).getMonth()] += Number(p.purchase_qty));

    // ---- vendors rankings ----
    const fastest = perf.filter((v) => v.avg_shipping_days != null)
      .sort((a, b) => a.avg_shipping_days - b.avg_shipping_days).slice(0, 20);
    const biggest = perf.filter((v) => Number(v.total_spent) > 0)
      .sort((a, b) => b.total_spent - a.total_spent).slice(0, 20);

    // ---- categories matrix ----
    const cats = {};
    stock.forEach((s) => {
      const c = cats[s.category || '(none)'] || (cats[s.category || '(none)'] = {
        category: s.category || '(none)', type: s.type, on_hand: 0, in: 0, low: 0, out: 0, total: 0 });
      c.on_hand += Number(s.on_hand); c.total++;
      if (s.status === 'In Stock') c.in++; else if (s.status === 'Low Stock') c.low++; else c.out++;
    });
    const catRows = Object.values(cats);
    const catTot = catRows.reduce((a, c) => ({ on_hand: a.on_hand + c.on_hand, in: a.in + c.in, low: a.low + c.low, out: a.out + c.out, total: a.total + c.total }),
      { on_hand: 0, in: 0, low: 0, out: 0, total: 0 });

    const itemNames = stock.map((s) => s.name).sort((a, b) => a.localeCompare(b));
    return `<h2>Inventory Dashboard</h2>
      <div class="cards">
        <div class="card"><span>Total items</span><strong>${stock.length - materials.length}</strong></div>
        <div class="card"><span>Total materials</span><strong>${materials.length}</strong></div>
        <div class="card"><span>Quantity in stock</span><strong>${qtyStock}</strong></div>
        <div class="card"><span>Quantity sold</span><strong>${qtySold}</strong></div>
        <div class="card ${stat['Out of Stock'] ? 'red' : 'green'}"><span>Items out of stock</span><strong>${outPct}%</strong></div>
      </div>

      <div class="twocol">
        <div>
          <h3>Items by status</h3>
          ${hbar([
            { label: 'In Stock', v: stat['In Stock'], _color: 'var(--good)' },
            { label: 'Low Stock', v: stat['Low Stock'], _color: 'var(--warn)' },
            { label: 'Out of Stock', v: stat['Out of Stock'], _color: 'var(--bad)' },
          ], { label: 'label', value: 'v' })}
          <h3>Sales by status</h3>
          ${hbar(Object.entries(sStat).map(([label, v]) => ({ label, v })), { label: 'label', value: 'v' })}
          <h3>Purchases by status</h3>
          ${hbar(Object.entries(pStat).map(([label, v]) => ({ label, v })), { label: 'label', value: 'v' })}
        </div>
        <div>
          <h3>Sales search</h3>
          <form id="ssForm" class="form">
            <div class="grid3">
              <label>Start period <input type="date" name="from" value="${st.ss.from}"></label>
              <label>End period <input type="date" name="to" value="${st.ss.to}"></label>
              <label>Item <select name="item"><option value="">—</option>
                ${itemNames.map((n) => `<option ${st.ss.item === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
            </div>
            <button type="submit" class="mini add">Search</button>
            ${ssRes ? `<div class="cards" style="margin-top:12px">
              <div class="card"><span>SKU</span><strong>${esc(ssRes.sku)}</strong></div>
              <div class="card"><span>Quantity sold</span><strong>${ssRes.qty}</strong></div>
              <div class="card"><span>Total orders</span><strong>${ssRes.orders}</strong></div>
            </div>` : ''}
          </form>
          <h3>Top 20 bestselling items of all time</h3>
          ${table(top20, [
            { key: 'item', label: 'Item' },
            { key: 'qty', label: 'Qty sold', num: 1 },
            { key: 'pct', label: '%', num: 1 },
          ])}
        </div>
      </div>

      <h3>Monthly sales quantity — <form id="yearForm" style="display:inline"><input type="number" name="year" value="${st.year}" style="width:90px"> <button class="mini add">Go</button></form></h3>
      ${vcols(mQty, MONTHS)}
      <h3>Daily sales quantity — <form id="monthForm" style="display:inline">
        <select name="month">${MONTHS.map((m, i) => `<option value="${i + 1}" ${st.month === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select>
        <button class="mini add">Go</button></form> ${st.year}</h3>
      ${vcols(dQty, dQty.map((_, i) => String(i + 1)))}

      <h3>Inventory categories <small style="font-weight:400;color:#77705f">(click a category for its price matrix)</small></h3>
      ${table(catRows, [
        { key: 'category', label: 'Category', render: (r) =>
            `<a href="#" class="catlink" data-cat="${esc(r.category)}">${esc(r.category)}</a>` },
        { key: 'type', label: 'Type' },
        { key: 'on_hand', label: 'On hand', num: 1 },
        { key: 'in', label: 'In stock', num: 1 },
        { key: 'low', label: 'Low stock', num: 1 },
        { key: 'out', label: 'Out of stock', num: 1 },
        { key: 'total', label: 'Total items', num: 1 },
      ])}
      <p class="empty"><b>Totals:</b> on hand ${catTot.on_hand} · in stock ${catTot.in} · low ${catTot.low} · out ${catTot.out} · items ${catTot.total}</p>
      <h3>Items by category</h3>
      ${hbar(catRows.map((c) => ({ label: c.category, v: c.total })), { label: 'label', value: 'v' })}

      <h2 style="margin-top:34px">Vendors</h2>
      <h3>Monthly purchase quantity (${st.year})</h3>
      ${vcols(mPur, MONTHS)}
      <div class="twocol">
        <div>
          <h3>Top 20 fastest vendors of all time</h3>
          ${table(fastest, [
            { key: 'name', label: 'Vendor' },
            { key: 'avg_shipping_days', label: 'Avg ship days', num: 1 },
          ])}
          <h3>Top 20 vendors by purchase amount</h3>
          ${table(biggest, [
            { key: 'name', label: 'Vendor' },
            { key: 'total_spent', label: 'Purchase amount', num: 1, render: (r) => fmt(r.total_spent) },
          ])}
        </div>
        <div>
          <h3>Purchases by item search</h3>
          <form id="piForm" class="form">
            <div class="grid3">
              <label>Start period <input type="date" name="from" value="${st.pi.from}"></label>
              <label>End period <input type="date" name="to" value="${st.pi.to}"></label>
              <label>Item <select name="item"><option value="">—</option>
                ${itemNames.map((n) => `<option ${st.pi.item === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
            </div>
            <button type="submit" class="mini add">Search</button>
            ${piRes ? `<div class="cards" style="margin-top:12px">
              <div class="card"><span>SKU</span><strong>${esc(piRes.sku)}</strong></div>
              <div class="card"><span>Quantity purchased</span><strong>${piRes.qty}</strong></div>
              <div class="card"><span>Purchase value</span><strong>${fmt(piRes.val)}</strong></div>
            </div>` : ''}
          </form>
          <h3>Purchases by vendor search</h3>
          <form id="pvForm" class="form">
            <div class="grid3">
              <label>Start period <input type="date" name="from" value="${st.pv.from}"></label>
              <label>End period <input type="date" name="to" value="${st.pv.to}"></label>
              <label>Vendor <select name="vendor"><option value="">—</option>
                ${vendorNames.map((n) => `<option ${st.pv.vendor === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
            </div>
            <button type="submit" class="mini add">Search</button>
            ${pvRes ? `<div class="cards" style="margin-top:12px">
              <div class="card"><span>Quantity</span><strong>${pvRes.qty}</strong></div>
              <div class="card"><span>Purchase value</span><strong>${fmt(pvRes.val)}</strong></div>
            </div>` : ''}
          </form>
        </div>
      </div>

      <div id="catModal" class="modal hidden">
        <div class="modal-box" style="width:min(1100px,100%)">
          <div class="modal-head">
            <h3 id="catModalTitle" style="margin:0; flex:1"></h3>
            <button type="button" class="mini" id="catModalClose">Close</button>
          </div>
          <div class="modal-body" id="catModalBody"></div>
        </div>
      </div>
      <div id="priceModal" class="modal hidden">
        <div class="modal-box" style="width:min(760px,100%)">
          <div class="modal-head">
            <h3 id="priceModalTitle" style="margin:0; flex:1"></h3>
            <button type="button" class="mini" id="priceModalClose">Close</button>
          </div>
          <div class="modal-body" id="priceModalBody"></div>
        </div>
      </div>`;
  },

  // ================= Reports =================
  async reports() {
    const [ar, tax, comms, itemSales, allSales, reps] = await Promise.all([
      api.get('/api/reports/ar_by_customer'), api.get('/api/reports/sales_tax'),
      api.get('/api/reports/rep_commissions'), api.get('/api/reports/monthly_item_sales'),
      api.get('/api/sales'), api.get('/api/sales_reps'),
    ]);
    window._salesForExport = allSales;
    // ---- daily sales summary: "how did today go" ----
    const day = window._dailyDate || (window._dailyDate = new Date().toLocaleDateString('en-CA'));
    const dayRows = allSales.filter((s) => String(s.date).slice(0, 10) === day
      && !String(s.status).toLowerCase().includes('cancel'));
    const repName = Object.fromEntries(reps.map((r) => [r.id, r.name]));
    const byRep = {};
    dayRows.forEach((s) => {
      const n = repName[s.sales_rep_id] || '(no rep tagged)';
      byRep[n] ??= { count: 0, total: 0, paid: 0 };
      byRep[n].count++; byRep[n].total += Number(s.total); byRep[n].paid += Number(s.amount_paid);
    });
    const dTotal = dayRows.reduce((a, s) => a + Number(s.total), 0);
    const dPaid = dayRows.reduce((a, s) => a + Number(s.amount_paid), 0);
    const dPending = dayRows.filter((s) => s.status === 'Pending approval').length;
    const daily = `
      <h3>Daily sales summary</h3>
      <div class="form" style="margin-bottom:10px">
        <label>Day <input type="date" id="dailyDate" value="${day}"></label>
        <button type="button" class="mini add" id="dailyApply">Apply</button>
        <button type="button" class="mini" id="dailyToday">Today</button>
      </div>
      <div class="cards" style="margin-bottom:10px">
        <div class="card"><span>Invoices</span><strong>${dayRows.length}</strong></div>
        <div class="card green"><span>Sales total</span><strong>${fmt(dTotal)}</strong></div>
        <div class="card green"><span>Collected (on those invoices)</span><strong>${fmt(dPaid)}</strong></div>
        <div class="card amber"><span>Balance / on credit</span><strong>${fmt(dTotal - dPaid)}</strong></div>
        ${dPending ? `<div class="card amber"><span>Awaiting approval</span><strong>${dPending}</strong></div>` : ''}
      </div>
      ${!dayRows.length ? '<p class="empty">No sales on this day.</p>' : `
      <div class="tablewrap" style="margin-bottom:6px"><table>
        <thead><tr><th>Sales rep</th><th class="num">Invoices</th>
          <th class="num">Total</th><th class="num">Collected</th><th class="num">Balance</th></tr></thead>
        <tbody>${Object.entries(byRep).map(([n, v]) => `<tr>
          <td>${esc(n)}</td><td class="num">${v.count}</td><td class="num">${fmt(v.total)}</td>
          <td class="num">${fmt(v.paid)}</td><td class="num">${fmt(v.total - v.paid)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid var(--border)"><td>TOTAL</td>
          <td class="num">${dayRows.length}</td><td class="num">${fmt(dTotal)}</td>
          <td class="num">${fmt(dPaid)}</td><td class="num">${fmt(dTotal - dPaid)}</td></tr></tbody>
      </table></div>`}
      <h3>Sales book export (CSV — for the accountant / BIR examination)</h3>
      <div class="form" style="margin-bottom:16px">
        <label>From <input type="date" id="sbFrom"></label>
        <label>To <input type="date" id="sbTo"></label>
        <button type="button" class="mini add" id="sbExport">Export CSV</button>
        <small style="color:var(--ink-2)">Date, invoice no., customer, VATable/exempt, tax, total,
          paid, status — blank dates export everything.</small>
      </div>`;
    return `<h2>Reports</h2>
      ${daily}
      <h3>Accounts receivable (by customer)</h3>${table(ar, [
        { key: 'customer', label: 'Customer' },
        { key: 'open_invoices', label: 'Open invoices', num: 1 },
        { key: 'balance', label: 'Balance', num: 1, render: (r) => fmt(r.balance) },
        { key: 'max_days_overdue', label: 'Days overdue', num: 1 },
      ])}
      <h3>Sales tax tracker —
        <form id="taxYearForm" style="display:inline">for calendar year
          <input type="number" name="year" value="${window._taxYear || new Date().getFullYear()}" style="width:90px">
          <button class="mini add">Go</button></form></h3>
      ${(() => {
        const yr = String(window._taxYear || new Date().getFullYear());
        const rows = tax.filter((r) => r.month.startsWith(yr));
        const byM = Object.fromEntries(rows.map((r) => [Number(r.month.slice(5, 7)), r]));
        const coll = MONTHS.map((_, i) => Number(byM[i + 1]?.tax_collected || 0));
        const paid = MONTHS.map((_, i) => Number(byM[i + 1]?.tax_paid || 0));
        const diff = MONTHS.map((_, i) => coll[i] - paid[i]);
        const tc = coll.reduce((a, b) => a + b, 0), tp = paid.reduce((a, b) => a + b, 0);
        return `
        <div class="cards" style="margin-bottom:12px">
          <div class="card"><span>Total tax collected</span><strong>${fmt(tc)}</strong></div>
          <div class="card"><span>Total tax paid</span><strong>${fmt(tp)}</strong></div>
          <div class="card ${tc - tp >= 0 ? 'amber' : 'green'}"><span>Difference</span><strong>${fmt(tc - tp)}</strong></div>
        </div>
        <h3>Monthly difference (collected − paid)</h3>
        ${hbar(MONTHS.map((m, i) => ({ label: m, v: Math.abs(diff[i]), _color: diff[i] >= 0 ? 'var(--warn)' : 'var(--good)' })).filter((r) => r.v > 0),
          { label: 'label', value: 'v', fmtV: (v) => fmt(v) })}
        <div class="tablewrap"><table>
          <thead><tr><th></th>${MONTHS.map((m) => `<th style="text-align:right">${m}</th>`).join('')}<th style="text-align:right">Total</th></tr></thead>
          <tbody>
            <tr><td><b>Tax collected</b></td>${coll.map((v) => `<td class="num">${v ? fmt(v) : '-'}</td>`).join('')}<td class="num"><b>${fmt(tc)}</b></td></tr>
            <tr><td><b>Tax paid</b></td>${paid.map((v) => `<td class="num">${v ? fmt(v) : '-'}</td>`).join('')}<td class="num"><b>${fmt(tp)}</b></td></tr>
            <tr><td><b>Difference</b></td>${diff.map((v) => `<td class="num">${v ? fmt(v) : '-'}</td>`).join('')}<td class="num"><b>${fmt(tc - tp)}</b></td></tr>
          </tbody>
        </table></div>`;
      })()}
      <h3>Item sales by month</h3>${table(itemSales, [
        { key: 'month', label: 'Month' },
        { key: 'name', label: 'Item' },
        { key: 'qty_sold', label: 'Qty', num: 1 },
        { key: 'revenue', label: 'Revenue', num: 1, render: (r) => fmt(r.revenue) },
      ])}
      <h3>Sales rep commissions</h3>${table(comms, [
        { key: 'name', label: 'Rep' },
        { key: 'commission_rate', label: 'Rate', num: 1, render: (r) => (r.commission_rate * 100).toFixed(2) + '%' },
        { key: 'total_sales', label: 'Total sales', num: 1, render: (r) => fmt(r.total_sales) },
        { key: 'commission', label: 'Commission', num: 1, render: (r) => fmt(r.commission) },
      ])}`;
  },

  // ================= Settings (+ profit goals CRUD) =================
  // ================= Monitoring (admins: attendance w/ geotag + action history) =================
  async monitoring() {
    const [att, audit, users, mSales, mReps, payRuns] = await Promise.all([
      api.get('/api/attendance'), api.get('/api/audit'), api.get('/api/users'),
      api.get('/api/sales'), api.get('/api/sales_reps'), api.get('/api/payroll_runs')]);
    window._payrollRuns = payRuns;
    const today = new Date().toLocaleDateString();
    const todayRows = att.filter((a) => new Date(a.ts).toLocaleDateString() === today);
    const inNow = {};
    users.forEach((u) => {
      const mine = todayRows.filter((a) => a.user_name === u.name);
      if (mine.length && mine[0].type === 'Time in') inNow[u.name] = mine[0];
    });
    const mapLink = (r) => r.lat != null
      ? `<a class="catlink" target="_blank"
           href="https://www.google.com/maps?q=${Number(r.lat)},${Number(r.lng)}"
           title="Open in Google Maps">${Number(r.lat).toFixed(5)}, ${Number(r.lng).toFixed(5)}</a>
         ${r.accuracy ? `<small>±${Math.round(r.accuracy)}m</small>` : ''}`
      : '<span class="badge amber">no location</span>';
    const describe = describeAudit;
    return `<h2>Monitoring</h2>
      <div class="cards" style="margin-bottom:14px">
        <div class="card green"><span>Currently timed in</span><strong>${Object.keys(inNow).length}</strong></div>
        <div class="card"><span>Attendance punches today</span><strong>${todayRows.length}</strong></div>
        <div class="card"><span>Actions logged (latest 500)</span><strong>${audit.length}</strong></div>
      </div>
      ${Object.keys(inNow).length ? `<div class="cards" style="margin-bottom:14px">
        ${Object.entries(inNow).map(([n, r]) => `<div class="card green">
          <span>${esc(n)}</span><strong style="font-size:15px">in since ${new Date(r.ts).toLocaleTimeString()}</strong>
        </div>`).join('')}</div>` : '<p class="empty">Nobody is timed in right now.</p>'}
      <h3>Attendance log — time in / out with geotag</h3>
      ${table(att, [
        { key: 'ts', label: 'Date / time', render: (r) => new Date(r.ts).toLocaleString() },
        { key: 'user_name', label: 'Staff' },
        { key: 'type', label: 'Punch', render: (r) =>
            `<span class="badge ${r.type === 'Time in' ? 'green' : 'amber'}">${esc(r.type)}</span>` },
        { key: '_photo', label: 'Photo', render: (r) => r.has_photo
            ? `<button type="button" class="mini" data-attphoto="${r.id}">View photo</button>`
            : '<span class="badge amber">no photo</span>' },
        { key: '_loc', label: 'Location (geotag)', render: mapLink },
      ])}
      ${(() => {
        // ---- DTR & salary (non-admin staff) — derived from the same punches ----
        const today2 = new Date();
        const monthStart = `${today2.getFullYear()}-${String(today2.getMonth() + 1).padStart(2, '0')}-01`;
        const dr = window._dtrRange || (window._dtrRange = {
          from: monthStart, to: today2.toLocaleDateString('en-CA') });
        const staff = users.filter((u) => !/\badmin\b/i.test(u.roles));
        const dstr = (ts) => new Date(ts).toLocaleDateString('en-CA');
        const tstr = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        window._dtrData = { from: dr.from, to: dr.to, staff: [] };
        const blocks = staff.map((u) => {
          const mine = att.filter((a) => a.user_name === u.name
            && dstr(a.ts) >= dr.from && dstr(a.ts) <= dr.to)
            .sort((a, b) => new Date(a.ts) - new Date(b.ts));
          const byDay = {};
          mine.forEach((a) => (byDay[dstr(a.ts)] ??= []).push(a));
          const days = Object.entries(byDay).map(([date, punches]) => {
            let hours = 0, open = null, firstIn = null, lastOut = null, incomplete = false;
            punches.forEach((p) => {
              if (p.type === 'Time in') { if (open) incomplete = true; open = p.ts; firstIn ??= p.ts; }
              else if (open) { hours += (new Date(p.ts) - new Date(open)) / 3600000; lastOut = p.ts; open = null; }
              else incomplete = true;
            });
            if (open) incomplete = true;
            return { date, in: firstIn ? tstr(firstIn) : '—', out: lastOut ? tstr(lastOut) : '—',
                     hours: Math.round(hours * 100) / 100, incomplete };
          }).sort((a, b) => a.date.localeCompare(b.date));
          const present = days.length;
          const hoursTot = Math.round(days.reduce((a, d2) => a + d2.hours, 0) * 100) / 100;
          const rate = Number(u.daily_rate) || 0;
          const salary = Math.round(present * rate * 100) / 100;
          // commission for the period: their tagged invoices × their Team-page rate
          const rep = mReps.find((r2) => r2.name.trim().toUpperCase() === u.name.trim().toUpperCase());
          const cRateRaw = rep ? Number(rep.commission_rate) || 0 : 0;
          const cFrac = cRateRaw > 1 ? cRateRaw / 100 : cRateRaw;
          const commission = !rep ? 0 : Math.round(mSales
            .filter((s2) => s2.sales_rep_id === rep.id
              && !String(s2.status).toLowerCase().includes('cancel')
              && String(s2.date).slice(0, 10) >= dr.from && String(s2.date).slice(0, 10) <= dr.to)
            .reduce((a, s2) => a + Number(s2.total) * cFrac, 0) * 100) / 100;
          window._dtrData.staff.push({ name: u.name, roles: u.roles, rate, days, present,
            hoursTot, salary, commission, id: u.id });
          return `<details class="collapse">
            <summary>${esc(u.name)} <small style="font-weight:400;color:var(--ink-2)">
              — ${esc(u.roles)} · ${present} day${present === 1 ? '' : 's'} · ${hoursTot} hrs ·
              rate ${fmt(rate)}/day · <b>salary ${fmt(salary)}</b></small></summary>
            <div class="clpbody">
              <div class="actions" style="margin:6px 0 8px;align-items:center;flex-wrap:wrap;display:flex;gap:8px">
                <button type="button" class="mini add" data-dtrprint="${esc(u.name)}">Print DTR / payslip</button>
                <label style="flex-direction:row;align-items:center;gap:6px;font-weight:600">Daily rate
                  <input type="number" step="any" min="0" value="${rate}" data-dtrrate="${u.id}"
                    style="width:110px;min-height:34px;padding:6px 8px"></label>
                <button type="button" class="mini" data-dtrsave="${u.id}">Save rate</button>
                <button type="button" class="mini add" data-payrun="${esc(u.name)}"
                  title="Compute pay for this period: DTR + commission − manual deductions">
                  Create payroll run${commission ? ` (comm. ${fmt(commission)})` : ''}</button>
                ${rate ? '' : '<span class="badge amber">no daily rate set</span>'}
              </div>
              ${!days.length ? '<p class="empty">No punches in this period.</p>' : `
              <div class="tablewrap"><table>
                <thead><tr><th>Date</th><th>Time in</th><th>Time out</th>
                  <th class="num">Hours</th><th>Remarks</th></tr></thead>
                <tbody>${days.map((d2) => `<tr>
                  <td>${d2.date}</td><td>${d2.in}</td><td>${d2.out}</td>
                  <td class="num">${d2.hours}</td>
                  <td>${d2.incomplete ? '<span class="badge amber">incomplete punches</span>' : ''}</td>
                </tr>`).join('')}
                <tr style="font-weight:700;border-top:2px solid var(--border)">
                  <td>TOTAL</td><td class="num">${present} day(s)</td><td></td>
                  <td class="num">${hoursTot}</td>
                  <td>${fmt(salary)}</td></tr></tbody>
              </table></div>`}
            </div>
          </details>`;
        }).join('');
        return `<h3>DTR &amp; salary — staff (non-admin)</h3>
          <div class="form" style="margin-bottom:10px">
            <label>From <input type="date" id="dtrFrom" value="${dr.from}"></label>
            <label>To <input type="date" id="dtrTo" value="${dr.to}"></label>
            <button type="button" class="mini add" id="dtrApply">Apply</button>
            <button type="button" class="mini" id="dtrMonth">This month</button>
          </div>
          <p class="empty" style="margin:4px 0 10px">Computed from the attendance punches above
            (proof photos and geotags stay in the attendance log). Salary = days present × the
            daily rate set in Settings → Users &amp; roles. Days with missing time-outs are flagged.</p>
          ${blocks || '<p class="empty">No non-admin staff.</p>'}
          <h3>Payroll history (saved runs)</h3>
          ${!payRuns.length ? '<p class="empty">No payroll runs yet — create one from an employee&#39;s DTR panel above.</p>'
          : table(payRuns.slice().sort((a, b) => b.id - a.id), [
            { key: 'created_at', label: 'Run date', render: (r) => new Date(r.created_at).toLocaleDateString() },
            { key: 'user_name', label: 'Employee' },
            { key: 'period_from', label: 'Period', render: (r) => `${d10(r.period_from)} → ${d10(r.period_to)}` },
            { key: 'days', label: 'Days', num: 1 },
            { key: 'gross_dtr', label: 'DTR pay', num: 1, render: (r) => fmt(r.gross_dtr) },
            { key: 'commission', label: 'Commission', num: 1, render: (r) => fmt(r.commission) },
            { key: '_ded', label: 'Deductions', num: 1, render: (r) =>
                fmt(Number(r.sss) + Number(r.philhealth) + Number(r.pagibig) + Number(r.other_ded)) },
            { key: 'net', label: 'NET PAY', num: 1, render: (r) => `<b>${fmt(r.net)}</b>` },
            { key: '_a', label: '', render: (r) => `<span class="actions">
                <button type="button" class="mini" data-payslip="${r.id}">Print payslip</button>
                <button type="button" class="mini danger" data-payrundel="${r.id}">Delete</button>
              </span>` },
          ])}`;
      })()}
      <h3>Action history — who did what in the system</h3>
      ${table(audit, [
        { key: 'ts', label: 'Date / time', render: (r) => new Date(r.ts).toLocaleString() },
        { key: 'user_name', label: 'User', render: (r) => esc(r.user_name || 'unknown') },
        { key: 'action', label: 'Action', render: (r) =>
            `<span title="${esc(r.action)}">${esc(describe(r.action))}</span>` },
        { key: 'detail', label: 'Details', render: (r) =>
            `<small style="color:var(--ink-2)">${esc((r.detail || '').slice(0, 150))}</small>` },
      ])}`;
  },

  async settings() {
    const [s, goals, users, audit] = await Promise.all([
      api.get('/api/settings'), api.get('/api/profit_goals'), api.get('/api/users'),
      api.get('/api/audit')]);
    return `<h2>Settings</h2>
      <form id="settingsForm" class="form grid3">
        <label>Currency symbol <input name="currency_symbol" value="${esc(s.currency_symbol || '₱')}"></label>
        <label>Fiscal year start month (1-12) <input type="number" name="fiscal_year_start_month" min="1" max="12" value="${esc(s.fiscal_year_start_month || '1')}"></label>
        <label>Term presets (comma-separated) <input name="term_presets" value="${esc(s.term_presets || 'Cash,7 days,15 days,30 days,End of month')}"></label>
        <label>DR letterhead — company <input name="dr_company" value="${esc(s.dr_company || '')}"></label>
        <label>DR letterhead — proprietor <input name="dr_proprietor" value="${esc(s.dr_proprietor || '')}"></label>
        <label>DR letterhead — TIN line <input name="dr_tin" value="${esc(s.dr_tin || '')}"></label>
        <label>DR letterhead — address <input name="dr_address" value="${esc(s.dr_address || '')}"></label>
        <label>API address <input id="apiBase" value="${esc(window.API_BASE)}"></label>
        <button type="submit" class="primary">Save</button>
      </form>
      ${crudBlock('users', {
        title: 'Users & roles (Purchases → Settings pages are Admin-only)', endpoint: '/api/users', rows: users,
        fields: [
          { name: 'name', label: 'Full name', required: true },
          { name: 'roles', label: 'Roles (pick one or more)', type: 'multicheck',
            options: ['Owner', 'Admin', 'Area Manager', 'Sales Representative', 'K-tech',
                      'Warehouse In-charge', 'Marketing'] },
          { name: 'pin', label: 'PIN (leave blank to keep current)', type: 'password' },
          { name: 'daily_rate', label: 'Daily rate (for DTR salary)', type: 'number' },
          { name: 'active', label: 'Active', type: 'checkbox' },
        ],
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'roles', label: 'Roles', render: (r) => /\badmin\b/i.test(r.roles)
              ? `<span class="badge green">${esc(r.roles)}</span>` : esc(r.roles) },
          { key: 'daily_rate', label: 'Daily rate', num: 1, render: (r) => fmt(r.daily_rate) },
          { key: 'active', label: 'Status', render: (r) => (r.active
              ? '<span class="badge green">Active</span>'
              : '<span class="badge red">Disabled</span>')
            + ` <button type="button" class="mini${r.active ? ' danger' : ' add'}"
                data-usertoggle="${r.id}" data-on="${r.active}">${r.active ? 'Disable' : 'Enable'}</button>` },
        ],
      })}
      ${crudBlock('profit_goals', {
        title: 'Annual profit goals', endpoint: '/api/profit_goals', rows: goals,
        fields: [
          { name: 'year', label: 'Year', type: 'number', required: true },
          { name: 'goal', label: 'Goal', required: true },
          { name: 'achieved', label: 'Achieved', type: 'checkbox' },
        ],
        columns: [
          { key: 'year', label: 'Year' },
          { key: 'goal', label: 'Goal' },
          { key: 'achieved', label: 'Achieved', render: (r) => r.achieved ? 'Yes' : 'No' },
        ],
      })}
      <h3>Activity log — every recorded transaction (database-persisted, latest 500)</h3>
      ${table(audit, [
        { key: 'ts', label: 'Date / time', render: (r) => new Date(r.ts).toLocaleString() },
        { key: 'user_name', label: 'User', render: (r) => esc(r.user_name || 'unknown') },
        { key: 'action', label: 'Action', render: (r) =>
            `<span title="${esc(r.action)}">${esc(describeAudit(r.action))}</span>` },
        { key: 'detail', label: 'Details', render: (r) =>
            `<small style="color:var(--ink-2)">${esc((r.detail || '').slice(0, 150))}</small>` },
      ])}`;
  },
};
