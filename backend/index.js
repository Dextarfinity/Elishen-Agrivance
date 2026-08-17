// Bookkeeping API — the only layer that talks to PostgreSQL.
// Electron (desktop) and Capacitor (mobile) clients consume this over the LAN.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings, not timezone-shifted JS Dates
types.setTypeParser(1082, (v) => v);

const pool = new Pool({ client_encoding: 'UTF8' }); // reads PG* vars from .env

// ---------- PIN hashing (scrypt, no plaintext at rest) ----------
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(String(pin), salt, 32).toString('hex')}`;
}
function verifyPin(pin, stored) {
  if (typeof stored !== 'string' || stored === '') return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    return crypto.timingSafeEqual(
      crypto.scryptSync(String(pin), salt, 32), Buffer.from(hash, 'hex'));
  }
  // legacy plaintext row not yet migrated (startup migration in flight)
  return crypto.timingSafeEqual(
    Buffer.from(sha256(pin), 'hex'), Buffer.from(sha256(stored), 'hex'));
}

// ---------- login sessions: bearer tokens, 30-day sliding expiry ----------
// Only the SHA-256 of a token is stored — a leaked DB can't replay sessions.
const SESSION_DAYS = 30;
const bearerOf = (req) => (/^Bearer\s+([a-f0-9]{64})$/i.exec(req.get('authorization') || '') || [])[1];
async function bootstrapAuth() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY,
      user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_seen  timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
  // one-time migration: hash any PIN still stored as plaintext
  const { rows } = await pool.query(`SELECT id, pin FROM users WHERE pin NOT LIKE 'scrypt$%'`);
  for (const u of rows)
    await pool.query('UPDATE users SET pin = $2 WHERE id = $1', [u.id, hashPin(u.pin)]);
  if (rows.length) console.log(`Auth: hashed ${rows.length} plaintext PIN(s).`);
}
bootstrapAuth().catch((e) => { console.error('Auth bootstrap failed:', e); process.exit(1); });

// ---------- Customer Information Sheet: the paper form, field for field ----------
// One sheet per store or farm account. Columns mirror the printed template so a
// saved sheet reprints exactly, including the address broken into its parts.
async function bootstrapCis() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_info_sheets (
      id             serial PRIMARY KEY,
      customer_id    integer REFERENCES customers(id) ON DELETE SET NULL,
      sheet_type     text NOT NULL DEFAULT 'store',      -- 'store' | 'farm'
      account_name   text NOT NULL,
      established_on text,
      space_tenure   text,                               -- 'rented' | 'owned'
      addr_no text, addr_street text, addr_purok text, addr_barangay text,
      addr_town text, addr_city text, addr_province text,
      contact_no text,
      owner1_surname text, owner1_given text, owner1_middle text,
      owner2_surname text, owner2_given text, owner2_middle text,
      res_no text, res_street text, res_purok text, res_barangay text,
      res_town text, res_city text, res_province text,
      res_tenure     text,                               -- 'owned' | 'rented'
      -- corporation / cooperative block (store sheets only)
      mgr1_surname text, mgr1_given text, mgr1_middle text,
      mgr2_surname text, mgr2_given text, mgr2_middle text,
      mgr1_address text, mgr2_address text,
      terms text,
      terms_credit boolean NOT NULL DEFAULT false,
      terms_check  boolean NOT NULL DEFAULT false,
      bank_name text, branch text,
      specimens          jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{name, signature}] x6
      certified_name     text,
      certified_signature text,
      created_by text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      version    integer NOT NULL DEFAULT 1
    )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cis_customer ON customer_info_sheets(customer_id)');
}
bootstrapCis().catch((e) => console.error('CIS bootstrap failed:', e));

// ---------- product aliases: the short codes the warehouse actually says ----------
// Staff jot down "SI 2 (50KG)", not "Supremo Infinity 2 - Chick Grower Crumble".
// The alias is a second name for the same item — nothing else changes, and items
// without one (RobiChem and the rest) keep showing their full name everywhere.
const ALIAS_SEED = [
  ['Supremo Infinity Ready Mix - Grains + Pellets (RED) (25x1kg)', 'SI READY MIX (25KG)'],
  ['Supremo Infinity 1 - Chick Booster Crumble (50KG)', 'SI 1 (50KG)'],
  ['Supremo Infinity 2 - Chick Grower Crumble (50KG)', 'SI 2 (50KG)'],
  ['Supremo Infinity 3 - Maintenance Pellets - 15% CP (50KG)', 'SI 3 (50KG)'],
  ['Supremo Infinity 4 - Breeder Pellets (50KG)', 'SI 4 (50KG)'],
  ['Supremo Infinity 2.1 - Developer - 3 Grains (50KG)', 'SI 2.1 (50KG)'],
  ['Supremo Infinity Super Conditioner (25KG)', 'SI 1 12 KINDS (50KG)'],
  ['Supremo Infinity Power Concentrate (25KG)', 'SI 1 8 KINDS (50KG)'],
  ['Supremo Infinity Ready Mix - Grains + Pellets (RED) (50kg)', 'SI READY MIX (50KG)'],
  ['Supremo Infinity 1 Booster (25x1kg)', 'SI 1 (25X1KG)'],
  ['Supremo Infinity 2 Grower (25x1kg)', 'SI 2 (25X1KG)'],
  ['Supremo Infinity 4 Breeder (25x1kg)', 'SI 4 (25X1KG)'],
  ['Supremo Infinity 2.1 Developer + (25x1kg)', 'SI 2.1 (25X1KG)'],
  // this one is spelled with and without "Fortifier" on different machines —
  // whichever row exists takes the code, the unique-alias guard blocks a second
  ['Supremo Infinity Fortifier 32 Pellets - 32% CP (25x1kg)', 'SI 32 (25X1KG)'],
  ['Supremo Infinity 32 Pellets - 32% CP (25x1kg)', 'SI 32 (25X1KG)'],
  ['Supremo Infinity 23 Conditioning (25x1kg)', 'SI 23 (25X1KG)'],
  ['Supremo Infinity Ready Mix red (25x1kg)', 'SI READY MIX (25X1KG)'],
  ['Topbreed Dog Adult Mini (5KG)', 'TB DOGMEAL ADULT MINI (5KG)'],
  ['Topbreed Cat Adult (5KG)', 'TB CATMEAL ADULT (5KG)'],
  ['Topbreed Cat Adult (20KG)', 'TB CATMEAL ADULT (20KG)'],
  ['Topbreed Dog Adult Mini (20KG)', 'TB DOGMEAL ADULT MINI (20KG)'],
  ['Topbreed Dog Adult (20KG)', 'TB DOGMEAL ADULT (20KG)'],
  ['Topbreed Dog Adult (5KG)', 'TB DOGMEAL ADULT (5KG)'],
  ['Topbreed Dog Puppy (20KG)', 'TB PUPPY MEAL (20KG)'],
  ['Top Care CAT LITTER Coffee (10L)', 'CAT LITTER COFFEE'],
  ['Top Care CAT LITTER Lavander (10L)', 'CAT LITTER LAVENDER'],
  ['Stargain Starter (50KG)', 'SG STARTER'],
  ['Stargain Finisher (50KG)', 'SG FINISHER'],
  ['Stargain Grower (50KG)', 'SG GROWER'],
  ['Stargain Breeder (50KG)', 'SG BREEDER'],
  ['Stargain Lactating (50KG)', 'SG LACTATING'],
  ['Topbreed Creamy Treats (Tuna Flavor) .2g / 4 sticks/ ??', 'TB CREAMY TREATS TUNA 12G X 4 STICK'],
  ['Topbreed TopTreats (Beef) 70gx12x4', 'TB TOPTREATS BEEF 70GX12X4'],
];
async function bootstrapAliases() {
  await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS alias text');
  // one code, one product — a duplicate alias would send pickers to the wrong bag
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS items_alias_ux
    ON items (UPPER(TRIM(alias))) WHERE alias IS NOT NULL AND TRIM(alias) <> ''`);
  // NOTE: v_item_stock is deliberately left alone. The live view carries columns the
  // sale picker needs (deal, outright_rate, cod_rate, packaging, uom); the stock report
  // joins the alias on instead — see the /api/reports/item_stock route below.
  // seed the codes from the warehouse list, never overwriting one typed in the app
  let seeded = 0;
  for (const [name, alias] of ALIAS_SEED) {
    const { rowCount } = await pool.query(
      `UPDATE items SET alias = $2 WHERE name = $1 AND (alias IS NULL OR TRIM(alias) = '')
       AND NOT EXISTS (SELECT 1 FROM items x WHERE UPPER(TRIM(x.alias)) = UPPER(TRIM($2)))`,
      [name, alias]);
    seeded += rowCount;
  }
  if (seeded) console.log(`Aliases: set ${seeded} product alias(es).`);
}
bootstrapAliases().catch((e) => console.error('Alias bootstrap failed:', e));

// ---------- per-bag customer discount (feeds & pet food) ----------
// Feeds are discounted in flat pesos per bag, not percentages, and the figure
// depends on how the customer pays: COD (term "Cash") gets more off than a
// credit Term. Stored per UNIT, which is exactly what a sale line's `discount`
// column already means — net price = unit_price - discount.
//
//   Hogs & Supremo Infinity   50kg          COD 100 / Term 80
//                             25kg, 1kgx25  COD  50 / Term 40
//   Topbreed                  20kg          COD 120 / Term 100
//                             5kg           COD  25 / Term  20
//
// Topbreed Dog Adult (20KG) is the one exception: it is held at P1,430 to match
// competitors' shelf price, so it carries no discount on either arrangement.
const TB_FIXED = 'Topbreed Dog Adult (20KG)';
async function bootstrapFeedDiscounts() {
  await pool.query(`ALTER TABLE items
    ADD COLUMN IF NOT EXISTS cod_discount  numeric(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS term_discount numeric(12,2) NOT NULL DEFAULT 0`);
  // supersedes the single flat figure this column briefly held
  await pool.query('ALTER TABLE items DROP COLUMN IF EXISTS bag_discount');

  // The two shop databases spell their catalogues differently — one has
  // "(25kg)" where the other has "(25x1kg)", one says "Fortifier 32 Pellets"
  // where the other does not — so this classifies on the BRAND in the product
  // name as well as the category, all case-insensitively. Keying on an exact
  // category string would quietly discount nothing at all on one of them.
  const CLASSIFY = `
    SELECT i.id,
      CASE
        WHEN i.category ILIKE '%treat%' OR i.category ILIKE '%suppl%' THEN NULL
        WHEN i.category ILIKE '%hog%'   OR i.category ILIKE '%game%fowl%'
          OR i.name ILIKE '%supremo infinity%' OR i.name ILIKE '%uno+%'
          OR i.name ILIKE '%stargain%'                                THEN 'hogfeed'
        WHEN i.name ILIKE 'topbreed%'                                 THEN 'topbreed'
      END AS kind,
      CASE
        WHEN i.name ILIKE '%50kg%'                            THEN 50
        WHEN i.name ILIKE '%25kg%' OR i.name ILIKE '%25x1kg%' THEN 25
        -- 2kgx10 is 20kg of feed, the same as a 20kg sack
        WHEN i.name ILIKE '%20kg%' OR i.name ILIKE '%2kgx10%' THEN 20
        WHEN i.name ILIKE '%5kg%'                             THEN 5
      END AS size
    FROM items i
    WHERE UPPER(TRIM(i.name)) <> UPPER(TRIM($1))`;

  // Seeded only where nothing has been set yet, so a figure typed into
  // Inventory is never overwritten on the next restart.
  const { rowCount } = await pool.query(`
    UPDATE items SET cod_discount = v.cod, term_discount = v.term
    FROM (${CLASSIFY}) c
    JOIN (VALUES ('hogfeed', 50, 100, 80), ('hogfeed', 25,  50, 40),
                 ('topbreed', 20, 120, 100), ('topbreed',  5,  25, 20))
      AS v(kind, size, cod, term) ON v.kind = c.kind AND v.size = c.size
    WHERE items.id = c.id
      AND items.cod_discount = 0 AND items.term_discount = 0`, [TB_FIXED]);

  // Say plainly what happened — a silent no-op here looks exactly like a broken
  // feature at the till, and that is expensive to diagnose from the far end.
  const { rows: [t] } = await pool.query(
    `SELECT count(*) FILTER (WHERE kind IS NOT NULL AND size IS NOT NULL) AS matched,
            count(*) FILTER (WHERE kind IS NOT NULL AND size IS NULL)     AS unsized
       FROM (${CLASSIFY}) c`, [TB_FIXED]);
  console.log(`Feed discounts: ${rowCount} item(s) rated now; `
    + `${t.matched} of the catalogue qualify for a COD/Term rate.`);
  if (Number(t.matched) === 0) {
    console.warn('Feed discounts: WARNING — no hog, Infinity or Topbreed items matched. '
      + 'Check the product names and categories in Inventory.');
  } else if (Number(t.unsized) > 0) {
    const { rows } = await pool.query(
      `SELECT i.name FROM (${CLASSIFY}) c JOIN items i ON i.id = c.id
        WHERE c.kind IS NOT NULL AND c.size IS NULL ORDER BY i.name`, [TB_FIXED]);
    console.warn(`Feed discounts: ${t.unsized} feed item(s) have no recognisable sack `
      + `size, so they carry no discount: ${rows.map((r) => r.name).join('; ')}`);
  }

  // One-off correction to the competitor-matched price. Guarded on the old value
  // so a deliberate repricing later is not undone on every restart.
  const fixed = await pool.query(
    `UPDATE items SET sales_price = 1430, cod_discount = 0, term_discount = 0
      WHERE UPPER(TRIM(name)) = UPPER(TRIM($1)) AND sales_price = 1580`, [TB_FIXED]);
  if (fixed.rowCount) console.log(`Feed discounts: ${TB_FIXED} set to its fixed P1,430 price.`);
}
bootstrapFeedDiscounts().catch((e) => console.error('Feed-discount bootstrap failed:', e));

// Behind Cloudflare Tunnel every req.ip is localhost — prefer the edge-provided
// client IP for rate limiting and audit trails (LAN hits fall back to req.ip).
const clientIp = (req) => req.get('cf-connecting-ip') || req.ip;
const app = express();
app.disable('x-powered-by');                       // no server fingerprinting
app.use(cors());
app.use(express.json({ limit: '2mb' }));   // affixed signatures ride in as data URLs

// ---------- security headers on every response ----------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self)');
  next();
});

// ---------- rate limiting (per client, fixed windows, dependency-free) ----------
const rlBuckets = new Map();
function rateLimit(windowMs, max, tag) {
  return (req, res, next) => {
    const now = Date.now();
    const win = Math.floor(now / windowMs);
    const key = `${tag}|${clientIp(req)}|${win}`;
    const n = (rlBuckets.get(key) || 0) + 1;
    rlBuckets.set(key, n);
    if (rlBuckets.size > 5000) {                       // prune stale windows
      for (const k of rlBuckets.keys()) if (!k.endsWith(`|${win}`)) rlBuckets.delete(k);
    }
    if (n > max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({ error: 'Too many requests — please wait a moment and try again.' });
    }
    next();
  };
}
app.use('/api/login', rateLimit(10 * 60000, 10, 'login'));   // brute-force guard: 10 tries / 10 min
app.use('/api', rateLimit(60000, 400, 'api'));               // general: 400 req / min / device
// ---------- session gate: no valid token, no API (identity comes from the
// session — the old x-user header is display-only history and never trusted) ----------
const PUBLIC_API = ['/login', '/login_users', '/health'];
app.use('/api', (req, res, next) => {
  if (PUBLIC_API.includes(req.path)) return next();
  (async () => {
    const token = bearerOf(req);
    if (token) {
      const th = sha256(token);
      const { rows } = await pool.query(`
        SELECT s.user_id, u.name FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`, [th]);
      if (rows.length) {
        req._auth = { user_id: rows[0].user_id, name: rows[0].name };
        // sliding renewal, at most once an hour per session
        pool.query(`UPDATE sessions SET last_seen = now(),
                      expires_at = now() + interval '${SESSION_DAYS} days'
                    WHERE token_hash = $1 AND last_seen < now() - interval '1 hour'`, [th])
          .catch(() => {});
        return next();
      }
    }
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      pool.query('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
        ['unknown', 'AUTH REFUSED', `${req.method} ${req.path} from ${clientIp(req)}`]).catch(() => {});
    }
    res.status(401).json({ error: 'Not signed in — please log in again.' });
  })().catch((e) => res.status(500).json({ error: e.message }));
});
// ---------- audit trail: every mutating action is recorded with who did it ----------
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)
      && !req.path.startsWith('/login') && !req.path.startsWith('/notifications')) {
    const user = req._auth?.name || 'unknown';
    let detail = '';
    if (req.body && typeof req.body === 'object') {
      // never log secrets or bulky blobs — keep the trail readable
      const { pin, signature, price_breakdown, items, ...rest } = req.body;
      if (Array.isArray(items)) rest.items = `${items.length} line(s)`;
      detail = JSON.stringify(rest).slice(0, 400);
    }
    pool.query('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
      [user, `${req.method} ${req.path}`, detail]).catch(() => {});
  }
  next();
});
// ---------- RBAC gate (after audit, so refused attempts are on record too) ----------
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method) || req.path.startsWith('/login')) return next();
  (async () => {
    const name = req._auth?.name || '';
    const roles = await rolesOf(name);
    req._isAdmin = roles.admin;
    // allow Owner-role users, or the special-case user Glomer Celestino
    const isGlomer = String(name || '').trim().toLowerCase() === 'glomer celestino';
    if (OWNER_ONLY_API.test(req.path) && !(roles.owner || isGlomer)) {
      return res.status(403).json({
        error: 'Owners only — this money operation is restricted to Owner accounts.' });
    }
    if (req._isAdmin) { maybeNotify(req, name || 'Admin'); return next(); }
    const ok = NON_ADMIN_ALLOWED.some(([m, p]) => m.test(req.method) && p.test(req.path));
    if (!ok) return res.status(403).json({
      error: 'This action needs an Admin. Your entry stays untouched — ask an admin to do or approve it.' });
    maybeNotify(req, name || 'Staff');
    next();
  })().catch((e) => res.status(500).json({ error: e.message }));
});
// APP-ONLY MODE: once staff have the APK and owners have the desktop app,
// set APP_ONLY=1 in backend\.env and restart — the server stops serving the
// web UI entirely (browsers get nothing; only the installed apps' bundled UI
// talks to the API). Until then the UI is served for the office browser.
if (process.env.APP_ONLY === '1') {
  app.get('/', (req, res) => res.status(404).send('Not found'));
} else {
  // no-cache: browsers must revalidate so UI updates reach everyone immediately
  app.use(express.static(require('path').join(__dirname, '..', 'app'), {
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
  }));
}

// ---------- helpers ----------
const q = (text, params) => pool.query(text, params);

// ---------- RBAC: operational writes stay open, history/money rewrites are admin-only ----------
const roleCache = new Map();   // name -> { admin, owner, t }
async function rolesOf(name) {
  if (!name) return { admin: false, owner: false };
  const hit = roleCache.get(name);
  if (hit && Date.now() - hit.t < 60000) return hit;
  const { rows } = await pool.query(
    'SELECT roles FROM users WHERE UPPER(TRIM(name)) = UPPER(TRIM($1)) AND active', [name]);
  const r = {
    admin: rows.length ? /\badmin\b/i.test(rows[0].roles) : false,
    // owners are users with the owner role. Additionally, allow Glomer Celestino
    // as an owner override in case the DB hasn't been updated yet.
    owner: rows.length ? /\bowner\b/i.test(rows[0].roles) : false,
    t: Date.now(),
  };
  roleCache.set(name, r);
  return r;
}
async function isAdminUser(name) { return (await rolesOf(name)).admin; }
// the money core: only Owner-role users may write here (even other admins can't)
const OWNER_ONLY_API = /^\/(expenses|accounts|balance_entries|transfer|sales_reps|recurring_expenses)(\/|$)/;
// mutations a NON-admin may perform (their daily must-dos); everything else → 403
const NON_ADMIN_ALLOWED = [
  [/^POST$/,   /^\/sales$/],                      // encode a sale (forced to Pending approval)
  [/^POST$/,   /^\/sales\/\d+\/payments$/],       // receive money at the counter
  [/^POST$/,   /^\/sales\/\d+\/deliveries$/],     // issue a DR
  [/^PUT$/,    /^\/deliveries\/\d+$/],            // mark delivered, e-signature, DR details
  [/^POST$/,   /^\/attendance$/],                 // time in / out
  [/^POST$/,   /^\/change_pin$/],                 // own PIN change (old PIN required)
  [/^POST$/,   /^\/logout$/],                     // end own session
  [/^POST$/,   /^\/notifications\/seen$/],        // mark own notifications read
  [/^POST$/,   /^\/store_visits$/],               // field visit reports (reps' core duty)
  [/^POST$/,   /^\/cis$/],                        // customer information sheet — anyone may file one
  [/^PUT$/,    /^\/cis\/\d+$/],                   // ...and keep it up to date (deleting stays admin-only)
];

// friendly transaction notices for the bell — the casual events, not an audit log
const peso = (v) => (v == null || isNaN(Number(v))) ? ''
  : '₱' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function maybeNotify(req, user) {
  const t = req.body || {};
  const P = req.path, M = req.method;
  let kind = null, msg = null;
  if (M === 'POST' && /^\/sales$/.test(P)) {
    kind = 'sale';
    msg = `${user} encoded sale ${t.sales_no || ''} for ${t.customer || 'a customer'} — ${peso(t.total)}`
      + (req._isAdmin ? '' : ' (PENDING APPROVAL)');
  } else if (M === 'POST' && /^\/sales\/\d+\/payments$/.test(P)) {
    kind = 'payment';
    msg = `${user} received a payment of ${peso(t.amount)}${t.or_no ? ` (OR ${t.or_no})` : ''}`;
  } else if (M === 'POST' && /^\/sales\/\d+\/deliveries$/.test(P)) {
    kind = 'delivery';
    msg = `${user} issued Delivery Receipt${t.dr_no ? ` ${t.dr_no}` : ''}`;
  } else if (M === 'PUT' && /^\/deliveries\/\d+$/.test(P) && t.status === 'Delivered') {
    kind = 'delivered';
    msg = `${user} marked a delivery as received${t.received_by ? ` by ${t.received_by}` : ''}`;
  } else if (M === 'PUT' && /^\/sales\/\d+$/.test(P) && t.status === 'Completed') {
    kind = 'approval';
    msg = `${user} approved a sale`;
  } else if (M === 'PUT' && /^\/sales\/\d+$/.test(P) && /cancel/i.test(t.status || '')) {
    kind = 'void';
    msg = `${user} voided a sale`;
  } else if (M === 'PUT' && /^\/sales\/\d+\/full$/.test(P)) {
    kind = 'edit';
    msg = `${user} edited sale ${t.sales_no || ''}`;
  } else if (M === 'POST' && /^\/claims$/.test(P)) {
    kind = 'claim';
    msg = `${user} drafted a URC claim${t.amount ? ` — ${peso(t.amount)}` : ''}`;
  } else if (M === 'POST' && /^\/store_visits$/.test(P)) {
    kind = 'visit';
    msg = `${user} logged a store visit — ${t.store_name || 'a store'}`;
  } else if (M === 'POST' && /^\/transfer$/.test(P)) {
    kind = 'transfer';
    msg = `${user} transferred ${peso(t.amount)} between accounts`;
  }
  if (msg) pool.query(
    'INSERT INTO notifications (actor, kind, message) VALUES ($1,$2,$3)',
    [user, kind, msg]).catch(() => {});
}
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    console.error(e);
    if (e && e.status && Number.isInteger(e.status)) return res.status(e.status).json({ error: e.message });
    res.status(500).json({ error: e.message });
  });

// Whitelisted CRUD tables (never interpolate user input as identifiers)
const TABLES = {
  vendors:               ['name', 'contact_name', 'phone', 'email', 'address', 'country', 'notes'],
  accounts:              ['name', 'beginning_balance', 'last_checked'],
  sales_reps:            ['name', 'commission_rate'],
  items:                 ['name', 'alias', 'sku', 'category', 'type', 'initial_stock', 'minimum_stock',
                          'sales_price', 'cost', 'preferred_vendor_id', 'units_in_purchase',
                          'promotion', 'notes', 'deal', 'outright_rate', 'cod_rate',
                          'cod_discount', 'term_discount', 'packaging', 'uom', 'price_breakdown'],
  bom_lines:             ['finished_item_id', 'component_item_id', 'quantity'],
  purchases:             ['order_date', 'received_date', 'ref_id', 'item_id', 'purchase_qty',
                          'received_qty', 'unit_cost', 'account_id', 'status', 'vendor_id', 'notes',
                          'expiry_date'],
  claims:                ['claim_type', 'period_from', 'period_to', 'qty', 'amount', 'status',
                          'filed_date', 'credited_date', 'notes'],
  expenses:              ['date', 'ref_id', 'category', 'amount', 'tax', 'shipping', 'fees',
                          'account_id', 'description', 'remarks', 'receipt'],
  payroll_runs:          ['user_name', 'period_from', 'period_to', 'days', 'hours', 'daily_rate',
                          'gross_dtr', 'commission', 'sss', 'philhealth', 'pagibig', 'other_ded',
                          'net', 'notes'],
  balance_entries:       ['date', 'ref_id', 'account_id', 'amount', 'description', 'remarks'],
  manual_inventory:      ['date', 'batch_no', 'item_id', 'qty', 'notes'],
  financial_allocations: ['date', 'user_name', 'allocation', 'old_rate', 'new_rate', 'remarks'],
  profit_goals:          ['year', 'goal', 'achieved'],
  recurring_expenses:    ['name', 'category', 'amount', 'tax', 'shipping', 'fees',
                          'account_id', 'day_of_month', 'active'],
  customer_tiers:        ['customer', 'tier'],
  customer_advances:     ['customer', 'date', 'amount', 'account_id', 'notes'],
};

// Read-only reporting views (replace the spreadsheet dashboards)
const VIEWS = [
  'v_item_stock', 'v_account_balances', 'v_accounts_receivable', 'v_ar_by_customer',
  'v_monthly_summary', 'v_sales_tax', 'v_rep_commissions', 'v_monthly_item_sales',
  'v_vendor_performance',
];

// expenses list stays light: receipt photos load one at a time on demand
// (registered BEFORE the generic loop so this route wins)
app.get('/api/expenses', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT id, date, ref_id, category, amount, tax, shipping, fees, account_id,
           description, remarks, version, (receipt IS NOT NULL) AS has_receipt
    FROM expenses ORDER BY id`);
  res.json(rows);
}));
app.get('/api/expenses/:id/receipt', wrap(async (req, res) => {
  const { rows } = await q('SELECT receipt FROM expenses WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json({ receipt: rows[0].receipt });
}));

// ---------- generic CRUD ----------
for (const [table, cols] of Object.entries(TABLES)) {
  app.get(`/api/${table}`, wrap(async (req, res) => {
    const { rows } = await q(`SELECT * FROM ${table} ORDER BY id`);
    res.json(rows);
  }));

  app.post(`/api/${table}`, wrap(async (req, res) => {
    const use = cols.filter((c) => c in req.body);
    const vals = use.map((c) => req.body[c]);
    const ph = use.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await q(
      `INSERT INTO ${table} (${use.join(',')}) VALUES (${ph}) RETURNING *`, vals);
    res.status(201).json(rows[0]);
  }));

  app.put(`/api/${table}/:id`, wrap(async (req, res) => {
    const use = cols.filter((c) => c in req.body);
    const sets = use.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const vals = use.map((c) => req.body[c]);
    // optimistic locking: when the client sends the version it loaded, a stale
    // save gets a 409 instead of silently overwriting someone else's change
    if (req.body.version != null) {
      const { rows } = await q(
        `UPDATE ${table} SET ${sets}, version = version + 1
         WHERE id = $${use.length + 1} AND version = $${use.length + 2} RETURNING *`,
        [...vals, req.params.id, req.body.version]);
      if (rows.length) return res.json(rows[0]);
      const { rows: ex } = await q(`SELECT 1 FROM ${table} WHERE id = $1`, [req.params.id]);
      return res.status(ex.length ? 409 : 404).json({ error: ex.length
        ? 'This record was changed by someone else while you were editing. Reopen it to see the latest version.'
        : 'not found' });
    }
    const { rows } = await q(
      `UPDATE ${table} SET ${sets} WHERE id = $${use.length + 1} RETURNING *`,
      [...vals, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  }));

  app.delete(`/api/${table}/:id`, wrap(async (req, res) => {
    const { rowCount } = await q(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    res.json({ deleted: rowCount });
  }));
}

// stock list carries the warehouse alias alongside the view's own columns
// (registered BEFORE the generic loop so this route wins)
app.get('/api/reports/item_stock', wrap(async (req, res) => {
  const { rows } = await q(
    `SELECT v.*, i.alias, i.cod_discount, i.term_discount
       FROM v_item_stock v JOIN items i ON i.id = v.id`);
  res.json(rows);
}));

// ---------- reporting views ----------
for (const view of VIEWS) {
  app.get(`/api/reports/${view.replace(/^v_/, '')}`, wrap(async (req, res) => {
    const { rows } = await q(`SELECT * FROM ${view}`);
    res.json(rows);
  }));
}

// ---------- sales (invoice + line items, transactional) ----------
app.get('/api/sales', wrap(async (req, res) => {
  const { from, to, customer } = req.query;
  const where = [];
  const params = [];
  if (from)     { params.push(from);     where.push(`s.date >= $${params.length}`); }
  if (to)       { params.push(to);       where.push(`s.date <= $${params.length}`); }
  if (customer) { params.push(`%${customer}%`); where.push(`s.customer ILIKE $${params.length}`); }
  const { rows } = await q(`
    SELECT s.*, dr.dr_no, dr.status AS delivery_status,
           COALESCE(json_agg(json_build_object(
             'id', si.id, 'item_id', si.item_id, 'item', i.name, 'alias', i.alias,
             'qty', si.qty, 'unit_price', si.unit_price, 'discount', si.discount,
             'total_price', si.total_price, 'promo', si.promo,
             'uom', i.uom, 'packaging', i.packaging
           ) ORDER BY si.id) FILTER (WHERE si.id IS NOT NULL), '[]') AS items
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN items i ON i.id = si.item_id
    LEFT JOIN LATERAL (SELECT dr_no, status FROM deliveries d
                       WHERE d.sale_id = s.id ORDER BY d.id DESC LIMIT 1) dr ON true
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY s.id, dr.dr_no, dr.status ORDER BY s.date DESC, s.id DESC`, params);
  res.json(rows);
}));

app.post('/api/sales', wrap(async (req, res) => {
  const { items = [], ...sale } = req.body;
  // non-admin entries wait for an admin's approval before counting as final
  if (!req._isAdmin) sale.status = 'Pending approval';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cols = ['sales_no', 'date', 'customer', 'store_farm', 'term', 'due_date',
      'contact_no', 'payment_mode', 'account_id', 'sales_rep_id', 'subtotal',
      'tax_pct', 'tax_amount', 'discount_pct', 'discount', 'total', 'amount_paid', 'status']
      .filter((c) => c in sale);
    const ph = cols.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await client.query(
      `INSERT INTO sales (${cols.join(',')}) VALUES (${ph}) RETURNING *`,
      cols.map((c) => sale[c]));
    const s = rows[0];
    // link (or create) the customer record so tiers/details survive renames
    if (s.customer && String(s.customer).trim()) {
      const { rows: cr } = await client.query(`
        INSERT INTO customers (name, address, contact_no, term)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT ((UPPER(TRIM(name)))) DO UPDATE SET
          address = COALESCE(EXCLUDED.address, customers.address),
          contact_no = COALESCE(EXCLUDED.contact_no, customers.contact_no),
          term = COALESCE(EXCLUDED.term, customers.term)
        RETURNING id`,
        [String(s.customer).trim(), s.store_farm ?? null, s.contact_no ?? null, s.term ?? null]);
      await client.query('UPDATE sales SET customer_id = $1 WHERE id = $2', [cr[0].id, s.id]);
    }
    const warnings = [];
    for (const it of items) {
      // check availability from the reporting view
      const { rows: st } = await client.query('SELECT on_hand, minimum_stock, name FROM v_item_stock WHERE id = $1', [it.item_id]);
      const on_hand = st.length ? Number(st[0].on_hand) : 0;
      const name = st.length ? st[0].name : `#${it.item_id}`;
      if (on_hand <= 0) {
        throw { status: 400, message: `Cannot sell "${name}" — item is out of stock.` };
      }
      if (Number(it.qty) > on_hand) {
        throw { status: 400, message: `Cannot sell ${Number(it.qty)} of "${name}" — only ${on_hand} available.` };
      }
      // unit_price = list/unit cost; discount = per-unit; amount follows the NET price
      // promo lines are FREE GOODS paid by URC marketing: 0.00 but they still move stock
      const disc = Number(it.discount) || 0;
      await client.query(
        `INSERT INTO sale_items (sale_id, item_id, qty, unit_price, discount, total_price, promo)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, it.item_id, it.qty, it.unit_price, disc,
         it.qty * (it.unit_price - disc), !!it.promo]);
      // warn when remaining stock is low
      if (st.length) {
        const remaining = on_hand - Number(it.qty);
        if (remaining <= 0) warnings.push(`"${name}" will be out of stock after this sale.`);
        else if (remaining <= 10) warnings.push(`Low stock: "${name}" — ${remaining} unit(s) remaining.`);
      }
    }
    // initial payment goes straight into the ledger
    if (Number(s.amount_paid) > 0) {
      await client.query(
        `INSERT INTO payments (sale_id, date, amount, account_id, or_no, notes)
         VALUES ($1,$2,$3,$4,$5,'Paid at sale')`,
        [s.id, s.date, s.amount_paid, s.account_id, req.body.or_no || null]);
    }
    await client.query('COMMIT');
    res.status(201).json({ sale: s, warnings });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505' && String(e.constraint).includes('sales_no')) {
      return res.status(409).json({ error: `Invoice # "${sale.sales_no}" is already used — invoice numbers must be unique` });
    }
    if (e.code === '23505' && String(e.constraint).includes('or_no')) {
      return res.status(409).json({ error: `OR No. "${req.body.or_no}" is already used` });
    }
    throw e;
  } finally {
    client.release();
  }
}));

// Update invoice header fields (incl. status → 'Cancelled' excludes it everywhere)
app.put('/api/sales/:id', wrap(async (req, res) => {
  const cols = ['sales_no', 'date', 'customer', 'store_farm', 'term', 'due_date',
    'contact_no', 'payment_mode', 'account_id', 'sales_rep_id', 'subtotal',
    'tax_pct', 'tax_amount', 'discount_pct', 'discount', 'total', 'amount_paid', 'status']
    .filter((c) => c in req.body);
  const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await q(
    `UPDATE sales SET ${sets} WHERE id = $${cols.length + 1} RETURNING *`,
    [...cols.map((c) => req.body[c]), req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
}));

// Full invoice edit: header + line items, with optimistic locking.
// The client sends the `version` it loaded; if someone else saved meanwhile,
// versions no longer match and we refuse with 409 instead of silently overwriting.
app.put('/api/sales/:id/full', wrap(async (req, res) => {
  const { items = [], version, ...sale } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: cur } = await client.query(
      'SELECT version FROM sales WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!cur.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'not found' }); }
    if (version != null && Number(cur[0].version) !== Number(version)) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'This invoice was changed by someone else while you were editing. Reopen it to see the latest version.' });
    }
    const cols = ['sales_no', 'date', 'customer', 'store_farm', 'term', 'due_date',
      'contact_no', 'payment_mode', 'account_id', 'sales_rep_id', 'subtotal',
      'tax_pct', 'tax_amount', 'discount_pct', 'discount', 'total', 'status']
      .filter((c) => c in sale);
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const { rows } = await client.query(
      `UPDATE sales SET ${sets}, version = version + 1 WHERE id = $${cols.length + 1} RETURNING *`,
      [...cols.map((c) => sale[c]), req.params.id]);
    const s = rows[0];
    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [s.id]);
    const warnings = [];
    for (const it of items) {
      // validate stock on full-edit as well
      const { rows: st } = await client.query('SELECT on_hand, minimum_stock, name FROM v_item_stock WHERE id = $1', [it.item_id]);
      const on_hand = st.length ? Number(st[0].on_hand) : 0;
      const name = st.length ? st[0].name : `#${it.item_id}`;
      if (on_hand <= 0) throw { status: 400, message: `Cannot sell "${name}" — item is out of stock.` };
      if (Number(it.qty) > on_hand) throw { status: 400, message: `Cannot sell ${Number(it.qty)} of "${name}" — only ${on_hand} available.` };
      const disc = Number(it.discount) || 0;
      await client.query(
        `INSERT INTO sale_items (sale_id, item_id, qty, unit_price, discount, total_price, promo)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, it.item_id, it.qty, it.unit_price, disc,
         it.qty * (it.unit_price - disc), !!it.promo]);
      // optionally warn when low
      const remaining = on_hand - Number(it.qty);
      if (remaining <= 0) warnings.push(`"${name}" will be out of stock after this sale.`);
      else if (remaining <= 10) warnings.push(`Low stock: "${name}" — ${remaining} unit(s) remaining.`);
    }
    // paid-to-date always re-derives from the payments ledger
    await client.query(
      `UPDATE sales SET amount_paid = COALESCE(
         (SELECT SUM(amount) FROM payments WHERE sale_id = $1), 0) WHERE id = $1`, [s.id]);
    await client.query('COMMIT');
    res.json({ sale: s, warnings });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// Delete invoice (line items cascade)
app.delete('/api/sales/:id', wrap(async (req, res) => {
  const { rowCount } = await q('DELETE FROM sales WHERE id = $1', [req.params.id]);
  res.json({ deleted: rowCount });
}));

// ---------- payments ledger ----------
const recomputePaid = (saleId) => q(
  `UPDATE sales SET amount_paid = COALESCE(
     (SELECT SUM(amount) FROM payments WHERE sale_id = $1), 0)
   WHERE id = $1 RETURNING *`, [saleId]);

app.get('/api/payments', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT p.*, s.sales_no, s.customer, s.total AS invoice_total, s.amount_paid,
           a.name AS account
    FROM payments p
    JOIN sales s ON s.id = p.sale_id
    LEFT JOIN accounts a ON a.id = p.account_id
    ORDER BY p.date DESC, p.id DESC`);
  res.json(rows);
}));

// Record a payment against an invoice (ledger row + refresh cached amount_paid)
app.post('/api/sales/:id/payments', wrap(async (req, res) => {
  const { amount, account_id, date, or_no, notes, payer_name, signature } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount required' });
  try {
    await q(
      `INSERT INTO payments (sale_id, date, amount, account_id, or_no, notes, payer_name, signature)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [req.params.id, date || new Date().toISOString().slice(0, 10),
       amount, account_id ?? null, or_no || null, notes ?? null, payer_name ?? null, signature ?? null]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: `OR No. "${or_no}" is already used` });
    throw e;
  }
  const { rows } = await recomputePaid(req.params.id);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
}));

// Edit a payment (OR No. added later from the booklet, date/amount/account fixes)
app.put('/api/payments/:id', wrap(async (req, res) => {
  const { amount, account_id, date, or_no, notes, payer_name, signature, version } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount required' });
  let rows;
  try {
    ({ rows } = await q(
      `UPDATE payments SET date = $2, amount = $3, account_id = $4, or_no = $5, notes = $6,
              payer_name = $7, signature = $8, version = version + 1
       WHERE id = $1 AND ($9::int IS NULL OR version = $9::int) RETURNING sale_id`,
      [req.params.id, date || new Date().toISOString().slice(0, 10),
       amount, account_id ?? null, or_no || null, notes ?? null, payer_name ?? null, signature ?? null, version ?? null]));
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: `OR No. "${or_no}" is already used` });
    throw e;
  }
  if (!rows.length) {
    const { rows: ex } = await q('SELECT 1 FROM payments WHERE id = $1', [req.params.id]);
    return res.status(ex.length ? 409 : 404).json({ error: ex.length
      ? 'This payment was changed by someone else while you were editing. Reopen it to see the latest version.'
      : 'not found' });
  }
  const { rows: sale } = await recomputePaid(rows[0].sale_id);
  res.json(sale[0]);
}));

app.delete('/api/payments/:id', wrap(async (req, res) => {
  const { rows } = await q('DELETE FROM payments WHERE id = $1 RETURNING sale_id', [req.params.id]);
  if (rows.length) await recomputePaid(rows[0].sale_id);
  res.json({ deleted: rows.length });
}));

// ---------- uniqueness checks (invoice # and OR No. stay hand-typed) ----------
app.get('/api/check/invoice', wrap(async (req, res) => {
  const { rows } = await q(
    'SELECT 1 FROM sales WHERE sales_no = $1 AND ($2::int IS NULL OR id <> $2::int)',
    [req.query.no ?? '', req.query.not || null]);
  res.json({ exists: rows.length > 0 });
}));
app.get('/api/check/or', wrap(async (req, res) => {
  const { rows } = await q(
    'SELECT 1 FROM payments WHERE or_no = $1 AND ($2::int IS NULL OR id <> $2::int)',
    [req.query.no ?? '', req.query.not || null]);
  res.json({ exists: rows.length > 0 });
}));
app.get('/api/check/dr', wrap(async (req, res) => {
  const { rows } = await q('SELECT 1 FROM deliveries WHERE dr_no = $1', [req.query.no ?? '']);
  res.json({ exists: rows.length > 0 });
}));

// ---------- delivery receipts ----------
app.get('/api/deliveries', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT d.*, s.sales_no, s.customer, s.store_farm, s.term, s.total, s.discount,
           s.subtotal, s.tax_amount, s.date AS sale_date
    FROM deliveries d JOIN sales s ON s.id = d.sale_id
    ORDER BY d.date DESC, d.id DESC`);
  res.json(rows);
}));

app.post('/api/sales/:id/deliveries', wrap(async (req, res) => {
  const { dr_no, date, delivered_by, vehicle, notes } = req.body;
  if (!dr_no) return res.status(400).json({ error: 'DR No. is required' });
  try {
    const { rows } = await q(
      `INSERT INTO deliveries (sale_id, dr_no, date, delivered_by, vehicle, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, dr_no, date || new Date().toISOString().slice(0, 10),
       delivered_by ?? null, vehicle ?? null, notes ?? null]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: `DR No. "${dr_no}" is already used` });
    throw e;
  }
}));

app.put('/api/deliveries/:id', wrap(async (req, res) => {
  const cols = ['dr_no', 'date', 'delivered_by', 'vehicle', 'status', 'received_by',
    'delivered_date', 'notes', 'signature'].filter((c) => c in req.body);
  const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  if (req.body.version != null) {
    const { rows } = await q(
      `UPDATE deliveries SET ${sets}, version = version + 1
       WHERE id = $${cols.length + 1} AND version = $${cols.length + 2} RETURNING *`,
      [...cols.map((c) => req.body[c]), req.params.id, req.body.version]);
    if (rows.length) return res.json(rows[0]);
    const { rows: ex } = await q('SELECT 1 FROM deliveries WHERE id = $1', [req.params.id]);
    return res.status(ex.length ? 409 : 404).json({ error: ex.length
      ? 'This DR was changed by someone else while you were editing. Reopen it to see the latest version.'
      : 'not found' });
  }
  const { rows } = await q(
    `UPDATE deliveries SET ${sets} WHERE id = $${cols.length + 1} RETURNING *`,
    [...cols.map((c) => req.body[c]), req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
}));

app.delete('/api/deliveries/:id', wrap(async (req, res) => {
  const { rowCount } = await q('DELETE FROM deliveries WHERE id = $1', [req.params.id]);
  res.json({ deleted: rowCount });
}));

// ---------- customer directory (distinct names from past transactions) ----------
// customers are a real table (id-keyed: renames keep tiers and history links)
app.get('/api/customers', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT id, name, name AS customer, address, address AS store_farm,
           contact_no, term, tier, notes
    FROM customers ORDER BY UPPER(name)`);
  res.json(rows);
}));
app.post('/api/customers', wrap(async (req, res) => {
  const { name, address, contact_no, term, tier, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await q(`
    INSERT INTO customers (name, address, contact_no, term, tier, notes)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name.trim(), address ?? null, contact_no ?? null, term ?? null, tier || 'srp', notes ?? null]);
  res.status(201).json(rows[0]);
}));
app.put('/api/customers/:id', wrap(async (req, res) => {
  const { name, address, contact_no, term, tier, notes, version } = req.body;
  const { rows } = await q(`
    UPDATE customers SET name = COALESCE($2, name), address = $3, contact_no = $4,
      term = $5, tier = COALESCE($6, tier), notes = $7, version = version + 1
    WHERE id = $1 AND ($8::int IS NULL OR version = $8::int) RETURNING *`,
    [req.params.id, name ?? null, address ?? null, contact_no ?? null,
     term ?? null, tier ?? null, notes ?? null, version ?? null]);
  if (!rows.length) {
    const { rows: ex } = await q('SELECT 1 FROM customers WHERE id = $1', [req.params.id]);
    return res.status(ex.length ? 409 : 404).json({ error: ex.length
      ? 'This customer was changed by someone else while you were editing. Reopen it to see the latest version.'
      : 'not found' });
  }
  res.json(rows[0]);
}));
app.delete('/api/customers/:id', wrap(async (req, res) => {
  const { rowCount } = await q('DELETE FROM customers WHERE id = $1', [req.params.id]);
  res.json({ deleted: rowCount });
}));

// ---------- Customer Information Sheets (open to every signed-in user) ----------
// The list stays light: signature images live only on the single-sheet fetch.
const CIS_COLS = [
  'customer_id', 'sheet_type', 'account_name', 'established_on', 'space_tenure',
  'addr_no', 'addr_street', 'addr_purok', 'addr_barangay', 'addr_town', 'addr_city', 'addr_province',
  'contact_no',
  'owner1_surname', 'owner1_given', 'owner1_middle',
  'owner2_surname', 'owner2_given', 'owner2_middle',
  'res_no', 'res_street', 'res_purok', 'res_barangay', 'res_town', 'res_city', 'res_province',
  'res_tenure',
  'mgr1_surname', 'mgr1_given', 'mgr1_middle',
  'mgr2_surname', 'mgr2_given', 'mgr2_middle', 'mgr1_address', 'mgr2_address',
  'terms', 'terms_credit', 'terms_check', 'bank_name', 'branch',
  'specimens', 'certified_name', 'certified_signature',
];
const cisValues = (b) => CIS_COLS.map((c) => {
  const v = b[c];
  if (c === 'specimens') return JSON.stringify(Array.isArray(v) ? v.slice(0, 6) : []);
  if (c === 'terms_credit' || c === 'terms_check') return v === true;
  if (c === 'customer_id') return v == null || v === '' ? null : Number(v);
  return v == null || v === '' ? null : String(v);
});

app.get('/api/cis', wrap(async (req, res) => {
  const { customer_id } = req.query;
  const { rows } = await q(`
    SELECT s.id, s.customer_id, s.sheet_type, s.account_name, s.established_on,
           s.contact_no, s.terms, s.bank_name, s.branch, s.created_by, s.updated_at, s.version,
           c.name AS customer_name,
           CONCAT_WS(', ', NULLIF(s.addr_no,''), NULLIF(s.addr_street,''), NULLIF(s.addr_purok,''),
                     NULLIF(s.addr_barangay,''), NULLIF(s.addr_town,''), NULLIF(s.addr_city,''),
                     NULLIF(s.addr_province,'')) AS address,
           TRIM(CONCAT_WS(' ', NULLIF(s.owner1_given,''), NULLIF(s.owner1_middle,''),
                          NULLIF(s.owner1_surname,''))) AS owner_name
    FROM customer_info_sheets s
    LEFT JOIN customers c ON c.id = s.customer_id
    ${customer_id ? 'WHERE s.customer_id = $1' : ''}
    ORDER BY UPPER(s.account_name)`, customer_id ? [customer_id] : []);
  res.json(rows);
}));
app.get('/api/cis/:id', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT s.*, c.name AS customer_name FROM customer_info_sheets s
    LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
}));
// How a sheet ties to a customer record, driven by the form's picker:
//   a numeric id  → link to that existing customer
//   'new'         → create the customer from the Account Name and link it, so a
//                   store first met in the field reaches the sale picker,
//                   Receivables and the reports instead of living only in the sheet
//   blank         → deliberately left unlinked
async function cisCustomerId(b) {
  const pick = b.customer_id == null ? '' : String(b.customer_id).trim();
  if (pick && pick !== 'new') return Number(pick);
  if (pick !== 'new') return null;
  const name = String(b.account_name || '').trim();
  if (!name) return null;
  const address = ['addr_no', 'addr_street', 'addr_purok', 'addr_barangay',
                   'addr_town', 'addr_city', 'addr_province']
    .map((k) => String(b[k] ?? '').trim()).filter(Boolean).join(', ') || null;
  const { rows } = await q(`
    INSERT INTO customers (name, address, contact_no, term)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT ((UPPER(TRIM(name)))) DO UPDATE SET
      address    = COALESCE(customers.address, EXCLUDED.address),
      contact_no = COALESCE(customers.contact_no, EXCLUDED.contact_no),
      term       = COALESCE(customers.term, EXCLUDED.term)
    RETURNING id`,
    [name, address, b.contact_no || null, b.terms || null]);
  return rows[0].id;
}

app.post('/api/cis', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.account_name) return res.status(400).json({ error: 'Account name is required.' });
  if (!['store', 'farm'].includes(b.sheet_type)) b.sheet_type = 'store';
  b.customer_id = await cisCustomerId(b);
  const cols = [...CIS_COLS, 'created_by'];
  const vals = [...cisValues(b), req._auth?.name || null];
  const { rows } = await q(
    `INSERT INTO customer_info_sheets (${cols.join(',')})
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, vals);
  res.status(201).json(rows[0]);
}));
app.put('/api/cis/:id', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.account_name) return res.status(400).json({ error: 'Account name is required.' });
  if (!['store', 'farm'].includes(b.sheet_type)) b.sheet_type = 'store';
  b.customer_id = await cisCustomerId(b);      // renaming the account keeps it on the books
  const sets = CIS_COLS.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const { rows } = await q(
    `UPDATE customer_info_sheets SET ${sets}, updated_at = now(), version = version + 1
     WHERE id = $1 AND ($${CIS_COLS.length + 2}::int IS NULL OR version = $${CIS_COLS.length + 2}::int)
     RETURNING *`,
    [req.params.id, ...cisValues(b), b.version == null ? null : Number(b.version)]);
  if (!rows.length) {
    const { rows: ex } = await q('SELECT 1 FROM customer_info_sheets WHERE id = $1', [req.params.id]);
    return res.status(ex.length ? 409 : 404).json({ error: ex.length
      ? 'This sheet was changed by someone else while you were editing. Reopen it to see the latest version.'
      : 'not found' });
  }
  res.json(rows[0]);
}));
app.delete('/api/cis/:id', wrap(async (req, res) => {
  const { rowCount } = await q('DELETE FROM customer_info_sheets WHERE id = $1', [req.params.id]);
  res.json({ deleted: rowCount });
}));

// ---------- attendance: time in / time out with geotag + live selfie ----------
// the list stays light (no photo blobs); photos load one at a time on demand
app.get('/api/attendance', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT id, user_name, type, ts, lat, lng, accuracy, (photo IS NOT NULL) AS has_photo
    FROM attendance ORDER BY ts DESC LIMIT 500`);
  res.json(rows);
}));
app.get('/api/attendance/:id/photo', wrap(async (req, res) => {
  const { rows } = await q('SELECT photo FROM attendance WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json({ photo: rows[0].photo });
}));
app.post('/api/attendance', wrap(async (req, res) => {
  const { user_name, type, lat, lng, accuracy, photo } = req.body;
  if (!user_name || !['Time in', 'Time out'].includes(type))
    return res.status(400).json({ error: 'user_name and type (Time in|Time out) required' });
  // photos come only from the in-app camera capture (data URL); no uploads exist
  if (photo != null && !/^data:image\/jpeg;base64,/.test(photo))
    return res.status(400).json({ error: 'invalid photo' });
  const { rows } = await q(
    `INSERT INTO attendance (user_name, type, lat, lng, accuracy, photo)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, user_name, type, ts`,
    [user_name, type, lat ?? null, lng ?? null, accuracy ?? null, photo ?? null]);
  res.status(201).json(rows[0]);
}));

// ---------- notifications (bell): latest notices + per-user unread count ----------
app.get('/api/notifications', wrap(async (req, res) => {
  const name = req._auth?.name || '';
  const [{ rows: items }, { rows: seen }] = await Promise.all([
    q('SELECT * FROM notifications ORDER BY id DESC LIMIT 30'),
    q('SELECT last_id FROM notification_reads WHERE user_name = $1', [name]),
  ]);
  const lastSeen = seen.length ? seen[0].last_id : 0;
  const unread = items.filter((n) => n.id > lastSeen && n.actor !== name).length;
  res.json({ items, unread, last_seen: lastSeen });
}));
app.post('/api/notifications/seen', wrap(async (req, res) => {
  const name = req._auth?.name || '';
  if (!name) return res.status(400).json({ error: 'no user' });
  const { rows } = await q('SELECT COALESCE(MAX(id),0) AS m FROM notifications');
  await q(`INSERT INTO notification_reads (user_name, last_id) VALUES ($1,$2)
           ON CONFLICT (user_name) DO UPDATE SET last_id = EXCLUDED.last_id`, [name, rows[0].m]);
  res.json({ ok: true });
}));

// ---------- customer advances: apply held money onto an invoice ----------
app.post('/api/advances/:id/apply', wrap(async (req, res) => {
  const { sale_id, amount } = req.body;
  const amt = Number(amount);
  if (!sale_id || !(amt > 0)) return res.status(400).json({ error: 'sale and positive amount required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: adv } = await client.query(
      'SELECT * FROM customer_advances WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!adv.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'advance not found' }); }
    const remaining = Number(adv[0].amount) - Number(adv[0].applied);
    if (amt > remaining + 0.005) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only ${remaining.toFixed(2)} remains on this advance.` });
    }
    await client.query(
      `INSERT INTO payments (sale_id, date, amount, account_id, notes)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)`,
      [sale_id, amt, adv[0].account_id,
       `Applied from advance #${adv[0].id} (${adv[0].notes || adv[0].customer})`]);
    await client.query(
      'UPDATE customer_advances SET applied = applied + $2, version = version + 1 WHERE id = $1',
      [req.params.id, amt]);
    await client.query(
      `UPDATE sales SET amount_paid = COALESCE(
         (SELECT SUM(amount) FROM payments WHERE sale_id = $1), 0) WHERE id = $1`, [sale_id]);
    await client.query('COMMIT');
    res.json({ ok: true, remaining: remaining - amt });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// ---------- account-to-account transfer: one atomic pair of signed entries ----------
app.post('/api/transfer', wrap(async (req, res) => {
  const { from_account_id, to_account_id, amount, date, description } = req.body;
  const amt = Number(amount);
  if (!from_account_id || !to_account_id || !(amt > 0))
    return res.status(400).json({ error: 'from, to and a positive amount are required' });
  if (Number(from_account_id) === Number(to_account_id))
    return res.status(400).json({ error: 'Choose two different accounts.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: accs } = await client.query(
      'SELECT id, name FROM accounts WHERE id = ANY($1::int[])',
      [[Number(from_account_id), Number(to_account_id)]]);
    if (accs.length !== 2) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'account not found' }); }
    const nameOf = (id) => accs.find((a) => a.id === Number(id)).name;
    const d = date || new Date().toISOString().slice(0, 10);
    const ref = `XFER-${d}-${Math.floor(1000 + 8999 * ((Date.now() % 9000) / 9000))}`;
    await client.query(
      `INSERT INTO balance_entries (date, ref_id, account_id, amount, description, remarks) VALUES
       ($1,$2,$3,$4,$5,$6), ($1,$2,$7,$8,$9,$6)`,
      [d, ref,
       Number(from_account_id), -amt, `Transfer OUT → ${nameOf(to_account_id)}`, description ?? null,
       Number(to_account_id), amt, `Transfer IN ← ${nameOf(from_account_id)}`]);
    await client.query('COMMIT');
    res.status(201).json({ ok: true, ref,
      from: nameOf(from_account_id), to: nameOf(to_account_id), amount: amt });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// ---------- store visits: rep field reports with photo + geotag verification ----------
app.get('/api/store_visits', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT id, user_name, store_name, ts, lat, lng, accuracy,
           q_order, q_products, q_remarks, (photo IS NOT NULL) AS has_photo
    FROM store_visits ORDER BY ts DESC LIMIT 500`);
  res.json(rows);
}));
app.get('/api/store_visits/:id/photo', wrap(async (req, res) => {
  const { rows } = await q('SELECT photo FROM store_visits WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json({ photo: rows[0].photo });
}));
app.post('/api/store_visits', wrap(async (req, res) => {
  const { user_name, store_name, lat, lng, accuracy, photo,
          q_order, q_products, q_remarks } = req.body;
  if (!user_name || !store_name) return res.status(400).json({ error: 'store name required' });
  if (photo != null && !/^data:image\/jpeg;base64,/.test(photo))
    return res.status(400).json({ error: 'invalid photo' });   // live camera only
  const { rows } = await q(
    `INSERT INTO store_visits (user_name, store_name, lat, lng, accuracy, photo,
       q_order, q_products, q_remarks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, user_name, store_name, ts`,
    [user_name, store_name, lat ?? null, lng ?? null, accuracy ?? null, photo ?? null,
     q_order ?? null, q_products ?? null, q_remarks ?? null]);
  res.status(201).json(rows[0]);
}));
app.delete('/api/store_visits/:id', wrap(async (req, res) => {
  const { rowCount } = await q('DELETE FROM store_visits WHERE id = $1', [req.params.id]);
  res.json({ deleted: rowCount });
}));

// ---------- audit log (admins read it on the Monitoring page) ----------
app.get('/api/audit', wrap(async (req, res) => {
  const { rows } = await q('SELECT * FROM audit_log ORDER BY ts DESC LIMIT 500');
  res.json(rows);
}));

// own PIN change: requires the current PIN, and only ever touches the
// logged-in account (the session decides whose PIN changes, not the body)
app.post('/api/change_pin', wrap(async (req, res) => {
  const { old_pin, new_pin } = req.body;
  const user_id = req._auth.user_id;
  if (!old_pin || !new_pin) return res.status(400).json({ error: 'all fields required' });
  if (String(new_pin).length < 4) return res.status(400).json({ error: 'New PIN must be at least 4 digits.' });
  const { rows } = await q('SELECT name, pin FROM users WHERE id = $1 AND active', [user_id]);
  if (!rows.length || !verifyPin(old_pin, rows[0].pin))
    return res.status(401).json({ error: 'Current PIN is incorrect.' });
  await q('UPDATE users SET pin = $2 WHERE id = $1', [user_id, hashPin(new_pin)]);
  // sign out every other device that knew the old PIN; this session stays
  await q('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2',
    [user_id, sha256(bearerOf(req))]);
  roleCache.delete(rows[0].name);
  res.json({ ok: true });
}));

// ---------- users & role-based access ----------
app.get('/api/users', wrap(async (req, res) => {
  const { rows } = await q('SELECT id, name, roles, active, daily_rate FROM users ORDER BY name');
  res.json(rows);          // PINs never leave the server on the list endpoint
}));
// minimal roster for the login screen's name picker — no PINs, no pay data
app.get('/api/login_users', wrap(async (req, res) => {
  const { rows } = await q('SELECT id, name, roles, active FROM users WHERE active ORDER BY name');
  res.json(rows);
}));
app.post('/api/login', wrap(async (req, res) => {
  const { user_id, pin } = req.body;
  const { rows } = await q(
    'SELECT id, name, roles, pin FROM users WHERE id = $1 AND active', [user_id]);
  if (!rows.length || !verifyPin(pin ?? '', rows[0].pin)) {
    // failed attempts land in the audit trail (who was targeted, from where)
    const { rows: who } = await q('SELECT name FROM users WHERE id = $1', [user_id]);
    q('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
      [who[0]?.name || `user #${user_id}`, 'LOGIN FAILED', `wrong PIN from ${clientIp(req)}`]).catch(() => {});
    return res.status(401).json({ error: 'Wrong PIN, or the account is inactive.' });
  }
  // issue the session token — the client presents it as `Authorization: Bearer …`
  const token = crypto.randomBytes(32).toString('hex');
  await q(`INSERT INTO sessions (token_hash, user_id, expires_at)
           VALUES ($1, $2, now() + interval '${SESSION_DAYS} days')`, [sha256(token), rows[0].id]);
  q('DELETE FROM sessions WHERE expires_at < now()').catch(() => {});   // opportunistic sweep
  const { pin: _pin, ...user } = rows[0];
  res.json({ ...user, token });
}));
app.post('/api/logout', wrap(async (req, res) => {
  await q('DELETE FROM sessions WHERE token_hash = $1', [sha256(bearerOf(req))]);
  res.json({ ok: true });
}));
app.post('/api/users', wrap(async (req, res) => {
  const { name, roles, pin, active, daily_rate } = req.body;
  if (!name || !roles) return res.status(400).json({ error: 'name and roles required' });
  const { rows } = await q(
    `INSERT INTO users (name, roles, pin, active, daily_rate) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, roles, active, daily_rate`,
    [name, roles, hashPin(pin || '1234'), active ?? true, daily_rate ?? 0]);
  // every employee can earn commissions — keep the commission roster in step
  await q(`INSERT INTO sales_reps (name, commission_rate)
           SELECT $1, 0 WHERE NOT EXISTS
             (SELECT 1 FROM sales_reps WHERE UPPER(TRIM(name)) = UPPER(TRIM($1)))`, [name]);
  res.status(201).json(rows[0]);
}));
app.put('/api/users/:id', wrap(async (req, res) => {
  const { name, roles, pin, active, daily_rate } = req.body;
  const newPin = (pin != null && String(pin) !== '') ? hashPin(pin) : null;
  const { rows } = await q(
    `UPDATE users SET name = COALESCE($2, name), roles = COALESCE($3, roles),
       pin = COALESCE($4, pin), active = COALESCE($5, active),
       daily_rate = COALESCE($6, daily_rate)
     WHERE id = $1 RETURNING id, name, roles, active, daily_rate`,
    [req.params.id, name ?? null, roles ?? null, newPin, active ?? null, daily_rate ?? null]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  // an admin PIN reset or deactivation kicks that user's devices out immediately
  if (newPin || active === false)
    await q('DELETE FROM sessions WHERE user_id = $1', [req.params.id]);
  roleCache.delete(rows[0].name);
  res.json(rows[0]);
}));
app.delete('/api/users/:id', wrap(async (req, res) => {
  const { rowCount } = await q('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ deleted: rowCount });
}));

// remember which URC price tier a customer gets (srp / outright / cod)
app.put('/api/customer_tier', wrap(async (req, res) => {
  const { customer, tier } = req.body;
  if (!customer || !['srp', 'outright', 'cod'].includes(tier))
    return res.status(400).json({ error: 'customer and tier (srp|outright|cod) required' });
  const { rows } = await q(`
    INSERT INTO customers (name, tier) VALUES ($1, $2)
    ON CONFLICT ((UPPER(TRIM(name)))) DO UPDATE SET tier = EXCLUDED.tier
    RETURNING id, name, tier`, [customer.trim(), tier]);
  res.json(rows[0]);
}));

// ---------- production (BOM assembly): make finished goods, consume materials ----------
app.post('/api/produce', wrap(async (req, res) => {
  const { finished_item_id, qty, date, batch_no } = req.body;
  if (!finished_item_id || !qty) return res.status(400).json({ error: 'finished_item_id and qty required' });
  const { rows: bom } = await q(
    'SELECT component_item_id, quantity FROM bom_lines WHERE finished_item_id = $1', [finished_item_id]);
  if (!bom.length) return res.status(400).json({ error: 'No BOM defined for this item' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = date || new Date().toISOString().slice(0, 10);
    const b = batch_no || `PROD-${d}`;
    // + finished goods
    await client.query(
      `INSERT INTO manual_inventory (date, batch_no, item_id, qty, notes)
       VALUES ($1,$2,$3,$4,'Production output')`, [d, b, finished_item_id, qty]);
    // − consumed components
    for (const line of bom) {
      await client.query(
        `INSERT INTO manual_inventory (date, batch_no, item_id, qty, notes)
         VALUES ($1,$2,$3,$4,'Consumed in production')`,
        [d, b, line.component_item_id, -qty * Number(line.quantity)]);
    }
    await client.query('COMMIT');
    res.status(201).json({ produced: qty, components_consumed: bom.length, batch_no: b });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// ---------- custom date-range summary (Custom Bookkeeping Dashboard START/END PERIOD) ----------
app.get('/api/reports/range_summary', wrap(async (req, res) => {
  const from = req.query.from || '1900-01-01';
  const to = req.query.to || '2999-12-31';
  const [inc, exp, byCat, byItem, incCat] = await Promise.all([
    q(`SELECT COALESCE(SUM(total),0) AS v FROM sales
       WHERE status NOT ILIKE '%cancel%' AND date BETWEEN $1 AND $2`, [from, to]),
    q(`SELECT COALESCE(SUM(amount - tax + shipping + fees),0) AS v FROM expenses
       WHERE date BETWEEN $1 AND $2`, [from, to]),
    q(`SELECT category,
              SUM(amount - tax + shipping + fees) AS net,
              SUM(tax) AS tax,
              SUM(amount + shipping + fees) AS total
       FROM expenses WHERE date BETWEEN $1 AND $2
       GROUP BY category ORDER BY total DESC`, [from, to]),
    q(`SELECT i.name, SUM(si.qty) AS qty, SUM(si.total_price) AS revenue,
              SUM(si.total_price - si.qty * COALESCE(i.cost, 0)) AS gross_profit
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id AND s.status NOT ILIKE '%cancel%'
       JOIN items i ON i.id = si.item_id
       WHERE s.date BETWEEN $1 AND $2
       GROUP BY i.name ORDER BY revenue DESC`, [from, to]),
    q(`SELECT COALESCE(i.category,'(uncategorized)') AS category,
              COUNT(DISTINCT s.id) AS sales,
              SUM(si.total_price) AS total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id AND s.status NOT ILIKE '%cancel%'
       JOIN items i ON i.id = si.item_id
       WHERE s.date BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY total DESC`, [from, to]),
  ]);
  const income = Number(inc.rows[0].v), expenses = Number(exp.rows[0].v);
  const grossProfit = byItem.rows.reduce((a, r) => a + Number(r.gross_profit || 0), 0);
  res.json({ from, to, income, expenses, profit_loss: income - expenses,
             profit_margin: income ? (income - expenses) / income : 0,
             gross_profit: grossProfit,
             expenses_by_category: byCat.rows, income_by_item: byItem.rows,
             income_by_category: incCat.rows });
}));

// ---------- settings ----------
app.get('/api/settings', wrap(async (req, res) => {
  const { rows } = await q('SELECT key, value FROM settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));
app.put('/api/settings', wrap(async (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    await q(`INSERT INTO settings (key, value) VALUES ($1,$2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [key, String(value)]);
  }
  res.json({ ok: true });
}));

// ---------- reorder suggestions (items at/below minimum, grouped by vendor) ----------
app.get('/api/reports/reorder', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT v.id, v.name, v.sku, v.on_hand, v.minimum_stock, v.cost,
           i.units_in_purchase, i.preferred_vendor_id,
           ven.name AS vendor,
           GREATEST(CEIL(v.minimum_stock * 2 - v.on_hand), 1) AS suggested_qty
    FROM v_item_stock v
    JOIN items i ON i.id = v.id
    LEFT JOIN vendors ven ON ven.id = i.preferred_vendor_id
    WHERE v.minimum_stock > 0 AND v.on_hand <= v.minimum_stock
    ORDER BY ven.name NULLS LAST, v.name`);
  res.json(rows);
}));

// ---------- recurring expenses: auto-post monthly ----------
async function runRecurring() {
  const { rows: templates } = await q(
    'SELECT * FROM recurring_expenses WHERE active = true');
  const today = new Date();
  let posted = 0;
  for (const t of templates) {
    // walk months from the one after last_posted (or this month) up to now
    let y, m; // first candidate month
    if (t.last_posted) {
      // first candidate is the month after last_posted (m stays 0-based; loop pre-increments)
      const lp = new Date(t.last_posted + 'T00:00:00Z');
      y = lp.getUTCFullYear(); m = lp.getUTCMonth();
    } else {
      // never posted: first candidate month is the current one
      y = today.getFullYear(); m = today.getMonth() - 1;
      if (m < 0) { m = 11; y--; }
    }
    for (;;) {
      m++; if (m > 11) { m = 0; y++; }
      if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())) break;
      // only post once the day-of-month has arrived in the current month
      if (y === today.getFullYear() && m === today.getMonth() && today.getDate() < t.day_of_month) break;
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(t.day_of_month).padStart(2, '0')}`;
      await q(
        `INSERT INTO expenses (date, category, amount, tax, shipping, fees, account_id, description, remarks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Auto-posted (recurring)')`,
        [date, t.category, t.amount, t.tax, t.shipping, t.fees, t.account_id,
         `${t.name} (recurring)`]);
      await q('UPDATE recurring_expenses SET last_posted = $1 WHERE id = $2', [date, t.id]);
      posted++;
    }
  }
  return posted;
}
app.post('/api/recurring/run', wrap(async (req, res) => {
  res.json({ posted: await runRecurring() });
}));
// run at startup and every 6 hours so rent/salaries post even if no one opens the app
runRecurring().then((n) => n && console.log(`Recurring expenses auto-posted: ${n}`)).catch(console.error);
setInterval(() => runRecurring().catch(console.error), 6 * 60 * 60 * 1000);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = process.env.API_PORT || 3001;
app.listen(port, '0.0.0.0', () =>
  console.log(`Bookkeeping API listening on http://0.0.0.0:${port}`));
