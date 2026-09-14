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

// ---------- pack size: how many sellable pieces are in a full box ----------
// RobiChem is bought by the box but sold by the piece -- a customer wants six
// bottles out of a twelve, not the box. Stock and price are per piece; pack_size
// records the box so staff can still order and receive in boxes.
async function bootstrapPackSize() {
  await pool.query(
    'ALTER TABLE items ADD COLUMN IF NOT EXISTS pack_size numeric(12,3)');
}
bootstrapPackSize().catch((e) => console.error('Pack-size bootstrap failed:', e));

// ---------- term acceptance: who is allowed to buy on credit ----------
// Selling on term is a credit decision, so it is the admins' to make: a customer
// may buy on term only once an admin has accepted them, and until then they pay
// cash. The decision lives on the customer -- a sale looks it up, and not every
// customer has an information sheet -- while the CIS page and Settings are where
// admins actually make it. Three states: NULL is "not yet reviewed", which is
// treated as cash-only, exactly like a refusal, but reads differently on screen.
// A term is credit unless it is blank or starts with Cash/COD.
const CREDIT_TERM = (t) => `(${t} IS NOT NULL AND btrim(${t}) <> '' AND ${t} !~* '^(cash|cod)')`;
async function bootstrapTermApproval() {
  const { rows: had } = await pool.query(`SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'term_approved'`);
  await pool.query(`ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS term_approved    boolean,
    ADD COLUMN IF NOT EXISTS term_approved_by text,
    ADD COLUMN IF NOT EXISTS term_approved_at timestamptz,
    ADD COLUMN IF NOT EXISTS term_note        text`);
  if (had.length) return;                      // already reviewed on this database
  // First run only: everyone already trading on credit keeps trading on credit.
  // Switching the rule on must not freeze a live account the owners never asked
  // to freeze -- only customers who have solely paid cash start out pending.
  const { rowCount } = await pool.query(`
    UPDATE customers c
       SET term_approved = true,
           term_approved_by = 'carried over — already buying on term',
           term_approved_at = now()
     WHERE ${CREDIT_TERM('c.term')}
        OR EXISTS (SELECT 1 FROM sales s
                    WHERE UPPER(TRIM(s.customer)) = UPPER(TRIM(c.name))
                      AND (${CREDIT_TERM('s.term')}
                           OR COALESCE(s.amount_paid, 0) < COALESCE(s.total, 0)))`);
  console.log(`[term acceptance] ${rowCount} customer(s) already on term were carried over as `
    + 'accepted; the rest start as not yet reviewed (cash only).');
}
bootstrapTermApproval().catch((e) => console.error('Term-acceptance bootstrap failed:', e));

// ---------- e-signatures on the other lines of a document ----------
// The customer's signature on a DR has always lived on the delivery itself. Every
// other signing line -- who issued, checked and drove a DR; a payslip's employee
// and approver; the Prepared / Checked / Approved under a printed report; a
// statement's acknowledgement; a DTR's employee and approver -- is one row here,
// keyed by the document it belongs to (DOC_SIGN says what the key is).
async function bootstrapDocSignatures() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doc_signatures (
      id         serial PRIMARY KEY,
      doc_type   text    NOT NULL,              -- DR | PAYSLIP | SOA | REPORT | DTR
      doc_key    text    NOT NULL,              -- the record's id, or the snapshot's name
      role       text    NOT NULL,              -- which line on the document
      name       text,                          -- the printed name under the ink
      signature  text    NOT NULL,              -- transparent PNG, as a data URL
      signed_by  text,                          -- the account that captured it
      signed_at  timestamptz NOT NULL DEFAULT now(),
      UNIQUE (doc_type, doc_key, role)
    )`);
}
bootstrapDocSignatures().catch((e) => console.error('Doc-signature bootstrap failed:', e));

// ---------- the names a signer can be picked from ----------
// Customers are on the books by store or farm, not by the person who signs for
// one. Names added by hand from the signature pad are kept here, against the
// customer they sign for, so every device offers them next time.
async function bootstrapSignerNames() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signer_names (
      id         serial PRIMARY KEY,
      kind       text NOT NULL CHECK (kind IN ('staff', 'customer')),
      name       text NOT NULL,
      customer   text,                          -- the store/farm they sign for
      created_by text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS signer_names_ux ON signer_names
    (kind, UPPER(TRIM(name)), UPPER(TRIM(COALESCE(customer, ''))))`);
}
bootstrapSignerNames().catch((e) => console.error('Signer-name bootstrap failed:', e));

// ---------- price history: an item's whole price structure, dated ----------
// URC re-prices every month or so -- the SRP and capital, the dealer rates and
// per-bag discounts, the ex-plant price and every purchase discount, and the
// whole build-up (distributor income, both freight legs, the funds, the
// incentives). Like a stock take, but for prices: each change is one dated entry
// holding all of it, in force from its start date until the next one. `items`
// stays the price in force today, which every page reads; an entry set ahead
// takes over on its start date; any edit made to an item, from any page, is kept
// as an entry starting today. Sales, orders and the fund reports then work each
// line out on the prices in force on its own date, so a new price never rewrites
// what the old one earned.
const PRICE_FIELDS = ['sales_price', 'cost', 'deal', 'promotion', 'outright_rate', 'cod_rate',
  'cod_discount', 'term_discount', 'price_breakdown'];
const PRICE_NUMERIC = ['sales_price', 'cost', 'outright_rate', 'cod_rate', 'cod_discount', 'term_discount'];
const snapSql = (a) => `jsonb_build_object(${PRICE_FIELDS.map((f) => `'${f}', ${a}.${f}`).join(', ')})`;
const TODAY_SQL = `(now() AT TIME ZONE 'Asia/Manila')::date`;
const todayPH = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
async function bootstrapPriceMonths() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_price_months (
      id        serial PRIMARY KEY,
      item_id   integer NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      starts_on date    NOT NULL,                 -- in force from this day until the next entry
      snap      jsonb   NOT NULL,                 -- every price field, as it stands from then
      source    text    NOT NULL DEFAULT 'list',  -- list (set on purpose) | edit | baseline
      set_by    text,
      set_at    timestamptz NOT NULL DEFAULT now(),
      UNIQUE (item_id, starts_on)
    )`);
  // Any change to an item's prices is kept as an entry starting today -- except
  // while the switch-over itself is writing them.
  await pool.query(`
    CREATE OR REPLACE FUNCTION record_item_price_month() RETURNS trigger AS $$
    BEGIN
      IF current_setting('app.price_sync', true) = 'on' THEN RETURN NEW; END IF;
      IF TG_OP = 'UPDATE' AND ${snapSql('OLD')} IS NOT DISTINCT FROM ${snapSql('NEW')} THEN
        RETURN NEW;
      END IF;
      INSERT INTO item_price_months (item_id, starts_on, snap, source)
      VALUES (NEW.id, ${TODAY_SQL}, ${snapSql('NEW')},
              CASE WHEN TG_OP = 'INSERT' THEN 'baseline' ELSE 'edit' END)
      ON CONFLICT (item_id, starts_on) DO UPDATE
        SET snap = EXCLUDED.snap, source = EXCLUDED.source, set_at = now();
      RETURN NEW;
    END $$ LANGUAGE plpgsql`);
  await pool.query('DROP TRIGGER IF EXISTS items_price_month ON items');
  await pool.query(`CREATE TRIGGER items_price_month AFTER INSERT OR UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION record_item_price_month()`);
  // the record opens with the prices in force today, so every item has an entry
  const { rowCount } = await pool.query(`
    INSERT INTO item_price_months (item_id, starts_on, snap, source)
    SELECT i.id, ${TODAY_SQL}, ${snapSql('i')}, 'baseline' FROM items i
     WHERE NOT EXISTS (SELECT 1 FROM item_price_months p WHERE p.item_id = i.id)
    ON CONFLICT DO NOTHING`);
  if (rowCount) console.log(`[price history] recorded the prices in force for ${rowCount} item(s)`);
}
// Put every item on its latest entry that has started. Runs inside the caller's
// transaction, with the trigger standing aside so a switch-over is not taken
// for an edit.
async function syncCurrentPrices(db) {
  await db.query(`SELECT set_config('app.price_sync', 'on', true)`);
  const { rowCount } = await db.query(`
    WITH latest AS (
      SELECT DISTINCT ON (item_id) item_id, snap FROM item_price_months
       WHERE starts_on <= ${TODAY_SQL} ORDER BY item_id, starts_on DESC),
    r AS (SELECT l.item_id, p.* FROM latest l, jsonb_populate_record(NULL::items, l.snap) p)
    UPDATE items i SET sales_price = r.sales_price, cost = r.cost, deal = r.deal,
           promotion = r.promotion, outright_rate = r.outright_rate, cod_rate = r.cod_rate,
           cod_discount = COALESCE(r.cod_discount, 0), term_discount = COALESCE(r.term_discount, 0),
           price_breakdown = r.price_breakdown
      FROM r WHERE r.item_id = i.id AND ${snapSql('i')} IS DISTINCT FROM ${snapSql('r')}`);
  await db.query(`SELECT set_config('app.price_sync', 'off', true)`);
  return rowCount;
}
async function runPriceSync() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const n = await syncCurrentPrices(client);
    await client.query('COMMIT');
    if (n) console.log(`[price history] ${n} item(s) moved onto prices starting today`);
    return n;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
}
bootstrapPriceMonths().then(runPriceSync)
  .catch((e) => console.error('Price-history bootstrap failed:', e));
setInterval(() => runPriceSync().catch((e) => console.error('Price switch-over:', e.message)),
  60 * 60 * 1000);

// ---------- sales billed by URC marketing ----------
// Goods URC's marketing arm pays for: the stock leaves the shelf and must be
// deducted, but the money is never Elishen's, so the invoice has to stay out of
// income, receivables, sales tax and commissions. Stock is untouched here on
// purpose — v_item_stock counts the sale lines either way, which is the point.
async function bootstrapMarketingBilled() {
  await pool.query(`ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS billed_by_marketing boolean NOT NULL DEFAULT false`);

  await pool.query(`
    CREATE OR REPLACE VIEW v_monthly_summary AS
    SELECT to_char(mo.month::timestamptz, 'YYYY-MM') AS month,
           COALESCE(inc.total, 0) AS total_income,
           COALESCE(exp.total, 0) AS total_expenses,
           COALESCE(inc.total, 0) - COALESCE(exp.total, 0) AS profit_loss
      FROM (SELECT DISTINCT date_trunc('month', t.d::timestamptz)::date AS month
              FROM (SELECT date AS d FROM sales UNION ALL SELECT date FROM expenses) t) mo
      LEFT JOIN (SELECT date_trunc('month', date::timestamptz)::date AS month, sum(total) AS total
                   FROM sales WHERE status NOT ILIKE '%cancel%' AND NOT billed_by_marketing
                  GROUP BY 1) inc ON inc.month = mo.month
      LEFT JOIN (SELECT date_trunc('month', date::timestamptz)::date AS month,
                        sum(amount - tax + shipping + fees) AS total
                   FROM expenses GROUP BY 1) exp ON exp.month = mo.month
     ORDER BY mo.month`);

  // nothing is owed by the customer on a marketing-billed invoice
  await pool.query(`
    CREATE OR REPLACE VIEW v_accounts_receivable AS
    SELECT id, sales_no, date, customer, store_farm, term, due_date, total, amount_paid,
           total - amount_paid AS balance,
           GREATEST(0, CURRENT_DATE - COALESCE(due_date, date)) AS days_overdue
      FROM sales s
     WHERE status NOT ILIKE '%cancel%' AND NOT billed_by_marketing
       AND (total - amount_paid) > 0`);

  // no commission on goods the rep did not sell for Elishen's account
  await pool.query(`
    CREATE OR REPLACE VIEW v_rep_commissions AS
    SELECT r.id, r.name, r.commission_rate,
           count(DISTINCT s.id) AS sales_count,
           COALESCE(sum(s.total), 0) AS total_sales,
           round(COALESCE(sum(s.total), 0) * r.commission_rate, 2) AS commission
      FROM sales_reps r
      LEFT JOIN sales s ON s.sales_rep_id = r.id
             AND s.status NOT ILIKE '%cancel%' AND NOT s.billed_by_marketing
     GROUP BY r.id, r.name, r.commission_rate`);
}
bootstrapMarketingBilled().catch((e) => console.error('Marketing-billed bootstrap failed:', e));

// A cheque is a promise, not money. It only counts once it clears, so a payment
// carries the state of its cheque and CLEARED is what every total is summed over.
// Cash and transfers leave cheque_status null and are always cleared; a cheque on
// hold or bounced is money that never arrived, so the invoice stays collectible.
const CLEARED = `(p.cheque_status IS NULL OR p.cheque_status = 'Good')`;

async function bootstrapChequeStatus() {
  await pool.query(`ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS cheque_status text`);
  await pool.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_cheque_status_ck`);
  await pool.query(`ALTER TABLE payments ADD CONSTRAINT payments_cheque_status_ck
    CHECK (cheque_status IS NULL OR cheque_status IN ('Good', 'On hold', 'Bounced'))`);

  // every invoice's paid-to-date re-derived under the new rule
  await pool.query(`UPDATE sales s SET amount_paid = COALESCE(
    (SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = s.id AND ${CLEARED}), 0)`);
}
bootstrapChequeStatus().catch((e) => console.error('Cheque-status bootstrap failed:', e));

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
  if (!req._auth) return next();
  rolesOf(req._auth.name).then((roles) => {
    req._isAdmin = roles.admin;
    req._isOwner = roles.owner
      || String(req._auth.name || '').trim().toLowerCase() === 'glomer celestino';
    next();
  }).catch((e) => res.status(500).json({ error: e.message }));
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
  const mutating = ['POST', 'PUT', 'DELETE'].includes(req.method);
  const userAdminResource = /^\/users(?:\/|$)/.test(req.path);
  if ((!mutating && !userAdminResource) || req.path.startsWith('/login')) return next();
  (async () => {
    const name = req._auth?.name || '';
    const roles = await rolesOf(name);
    req._isAdmin = roles.admin;
    if (userAdminResource && !req._isAdmin) {
      return res.status(403).json({ error: 'Only Admin accounts can manage users and roles.' });
    }
    // allow Owner-role users, or the special-case user Glomer Celestino
    const isGlomer = String(name || '').trim().toLowerCase() === 'glomer celestino';
    if (OWNER_ONLY_API.test(req.path) && !(roles.admin || roles.owner || isGlomer)) {
      return res.status(403).json({
        error: 'This money operation needs an Admin or Owner account.' });
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
  [/^POST$/,   /^\/customers\/payment$/],          // receive money against the account
  [/^POST$/,   /^\/sales\/\d+\/deliveries$/],     // issue a DR
  [/^PUT$/,    /^\/deliveries\/\d+$/],            // mark delivered, e-signature, DR details
  [/^POST$/,   /^\/attendance$/],                 // time in / out
  [/^POST$/,   /^\/change_pin$/],                 // own PIN change (old PIN required)
  [/^POST$/,   /^\/logout$/],                     // end own session
  [/^POST$/,   /^\/notifications\/seen$/],        // mark own notifications read
  [/^POST$/,   /^\/store_visits$/],               // field visit reports (reps' core duty)
  [/^POST$/,   /^\/cis$/],                        // customer information sheet — anyone may file one
  [/^PUT$/,    /^\/cis\/\d+$/],                   // ...and keep it up to date (deleting stays admin-only)
  [/^PUT$/,    /^\/doc_signatures$/],             // sign a line (the handler keeps payslips/DTRs admin-only)
  [/^POST$/,   /^\/signer_names$/],               // add who signed for a customer, from the pad
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
                          'cod_discount', 'term_discount', 'pack_size', 'packaging', 'uom', 'price_breakdown'],
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

// ---------- price history: reading and setting prices from a date ----------
// The switch-over also runs when items are read, at most every five minutes, so
// the first sale on a new price's start date is priced on it before the hourly run.
let priceSyncAt = 0;
app.use('/api/items', (req, res, next) => {
  if (req.method !== 'GET' || Date.now() - priceSyncAt < 5 * 60 * 1000) return next();
  priceSyncAt = Date.now();
  runPriceSync().catch((e) => console.error('Price switch-over:', e.message))
    .finally(() => next());
});
const priceDateOf = (d) => {
  const s = String(d || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = new Date(`${s}T00:00:00Z`);
  return !isNaN(t) && t.toISOString().slice(0, 10) === s ? s : null;     // a real calendar day
};
function pricePatch(body) {
  const patch = {};
  for (const f of PRICE_FIELDS) {
    if (!(f in body)) continue;
    let v = body[f];
    if (PRICE_NUMERIC.includes(f)) {
      if (v === '' || v == null) v = null;
      else if (!Number.isFinite(Number(v))) {
        throw { status: 400, message: `${f.replace(/_/g, ' ')} must be a number.` };
      } else v = Number(v);
      if (v == null && (f === 'cod_discount' || f === 'term_discount')) v = 0;
    } else if (f === 'price_breakdown') {
      if (v != null && (typeof v !== 'object' || Array.isArray(v))) {
        throw { status: 400, message: 'The price breakdown must be an object.' };
      }
    } else v = v == null || v === '' ? null : String(v);
    patch[f] = v;
  }
  return patch;
}
// Every item's prices as they stand on a date: the entry starting that day, or
// the latest one before it.
app.get('/api/item_price_months', wrap(async (req, res) => {
  const start = priceDateOf(req.query.date);
  if (!start) return res.status(400).json({ error: 'Give a date as YYYY-MM-DD.' });
  const { rows } = await q(`
    SELECT DISTINCT ON (item_id) item_id, to_char(starts_on, 'YYYY-MM-DD') AS starts_on,
           snap, source, set_by, set_at
      FROM item_price_months WHERE starts_on <= $1 ORDER BY item_id, starts_on DESC`, [start]);
  res.json(rows);
}));
// The whole record, oldest first: what the sale form and the reports price by.
app.get('/api/item_price_months/history', wrap(async (req, res) => {
  const { rows } = await q(`SELECT item_id, to_char(starts_on, 'YYYY-MM-DD') AS starts_on, snap
    FROM item_price_months ORDER BY item_id, starts_on`);
  res.json(rows);
}));
// The price log, like a stock take for prices: every entry, when it started and
// ended, what it replaced, who set it, and the sales and orders priced on it.
app.get('/api/item_price_months/log', wrap(async (req, res) => {
  const { rows } = await q(`
    WITH p AS (
      SELECT m.*, LAG(m.snap) OVER w AS prev_snap, LEAD(m.starts_on) OVER w AS next_starts
        FROM item_price_months m
      WINDOW w AS (PARTITION BY m.item_id ORDER BY m.starts_on))
    SELECT p.id, p.item_id, i.name, i.alias, i.category,
           to_char(p.starts_on, 'YYYY-MM-DD') AS starts_on,
           to_char(p.next_starts, 'YYYY-MM-DD') AS ends_before,
           p.snap, p.prev_snap, p.source, p.set_by, p.set_at,
           u.lines AS sale_lines, u.qty AS sold_qty,
           to_char(u.first_day, 'YYYY-MM-DD') AS first_sold, to_char(u.last_day, 'YYYY-MM-DD') AS last_sold,
           o.lines AS order_lines, o.qty AS ordered_qty
      FROM p JOIN items i ON i.id = p.item_id
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS lines, COALESCE(sum(si.qty), 0) AS qty,
               min(s.date) AS first_day, max(s.date) AS last_day
          FROM sale_items si JOIN sales s ON s.id = si.sale_id
         WHERE si.item_id = p.item_id AND s.date >= p.starts_on
           AND (p.next_starts IS NULL OR s.date < p.next_starts)
           AND s.status NOT ILIKE '%cancel%') u ON true
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS lines, COALESCE(sum(pu.purchase_qty), 0) AS qty
          FROM purchases pu
         WHERE pu.item_id = p.item_id AND pu.order_date >= p.starts_on
           AND (p.next_starts IS NULL OR pu.order_date < p.next_starts)
           AND COALESCE(pu.status, '') NOT ILIKE '%cancel%') o ON true
     ORDER BY p.starts_on DESC, i.name`);
  res.json({ today: todayPH(), rows });
}));
// Set an item's prices from a date. It starts from the entry in force that day,
// so changing one figure keeps all the others. A date that has come takes
// effect at once; a later one waits for its day.
app.put('/api/item_price_months/:month/:item_id', wrap(async (req, res) => {
  const month = req.params.month;
  const start = priceDateOf(month);
  if (!start) return res.status(400).json({ error: 'Give a date as YYYY-MM-DD.' });
  const itemId = Number(req.params.item_id);
  const patch = pricePatch(req.body || {});
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'No prices to save.' });
  const who = req._auth?.name || 'unknown';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: it } = await client.query(
      `SELECT name, ${snapSql('items')} AS snap FROM items WHERE id = $1`, [itemId]);
    if (!it.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'No such item.' }); }
    const { rows: base } = await client.query(`SELECT snap FROM item_price_months
      WHERE item_id = $1 AND starts_on <= $2 ORDER BY starts_on DESC LIMIT 1`, [itemId, start]);
    const snap = { ...(base[0]?.snap || it[0].snap), ...patch };
    await client.query(`
      INSERT INTO item_price_months (item_id, starts_on, snap, source, set_by) VALUES ($1, $2, $3, 'list', $4)
      ON CONFLICT (item_id, starts_on) DO UPDATE
        SET snap = EXCLUDED.snap, source = 'list', set_by = EXCLUDED.set_by, set_at = now()`,
      [itemId, start, snap, who]);
    const moved = start <= todayPH() ? await syncCurrentPrices(client) : 0;
    await client.query('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
      [who, 'SET prices', `from ${start} · "${it[0].name}" · ${Object.keys(patch).join(', ')}`]);
    await client.query('COMMIT');
    res.json({ starts_on: start, item_id: itemId, snap, applied_now: moved > 0,
      takes_effect: start > todayPH() ? start : 'now' });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
}));
// Take back an entry -- a change set ahead that should not happen, or a history
// entry made in error; its days then fall back on the entry before. The prices
// in force today are changed by editing them, never by removing them.
app.delete('/api/item_price_months/:month/:item_id', wrap(async (req, res) => {
  const start = priceDateOf(req.params.month);
  if (!start) return res.status(400).json({ error: 'Give a date as YYYY-MM-DD.' });
  const itemId = Number(req.params.item_id);
  const { rows: inForce } = await q(`SELECT to_char(starts_on, 'YYYY-MM-DD') AS d FROM item_price_months
    WHERE item_id = $1 AND starts_on <= ${TODAY_SQL} ORDER BY starts_on DESC LIMIT 1`, [itemId]);
  if (inForce[0]?.d === start) {
    return res.status(400).json({ error: 'These are the prices in force now — edit them instead of removing them.' });
  }
  const { rowCount } = await q('DELETE FROM item_price_months WHERE item_id = $1 AND starts_on = $2',
    [itemId, start]);
  if (rowCount) {
    await q('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
      [req._auth?.name || 'unknown', 'REMOVE prices', `from ${start} · item #${itemId}`]);
  }
  res.json({ removed: rowCount });
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
    `SELECT v.*, i.alias, i.cod_discount, i.term_discount, i.pack_size
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

// A sale is on credit if it carries a credit term OR leaves any balance behind --
// checking the term alone would let a blank term walk an unpaid invoice past the
// decision. Refused and not-yet-reviewed customers must settle in full.
function saleIsOnCredit(sale) {
  const term = String(sale.term ?? '').trim();
  if (term && !/^(cash|cod)\b/i.test(term)) return true;
  return (Number(sale.total) || 0) - (Number(sale.amount_paid) || 0) > 0.005;
}
async function assertTermAllowed(client, sale) {
  if (!saleIsOnCredit(sale)) return;
  const name = String(sale.customer ?? '').trim();
  if (!name) return;
  const { rows } = await client.query(
    'SELECT term_approved FROM customers WHERE UPPER(TRIM(name)) = UPPER(TRIM($1))', [name]);
  if (!rows.length) {                       // brand-new customer, created by this sale
    throw { status: 403, message: `"${name}" is a new customer and has not been accepted for `
      + 'term sales yet. This sale has to be Cash (paid in full), or an admin can accept them '
      + 'for term on the Customer Information Sheets page first.' };
  }
  if (rows[0].term_approved === true) return;
  throw { status: 403, message: rows[0].term_approved === false
    ? `"${name}" is not accepted for term sales — this account is cash only. Record the sale as `
      + 'Cash paid in full, or ask an admin to accept them for term.'
    : `"${name}" has not been reviewed for term sales yet, so the account is cash only until an `
      + 'admin accepts them. Record the sale as Cash paid in full, or ask an admin to review them.' };
}

app.post('/api/sales', wrap(async (req, res) => {
  const { items = [], ...sale } = req.body;
  // non-admin entries wait for an admin's approval before counting as final
  if (!req._isAdmin) sale.status = 'Pending approval';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await assertTermAllowed(client, sale);
    const cols = ['sales_no', 'date', 'customer', 'store_farm', 'term', 'due_date',
      'contact_no', 'payment_mode', 'account_id', 'sales_rep_id', 'subtotal',
      'tax_pct', 'tax_amount', 'discount_pct', 'discount', 'total', 'amount_paid', 'status',
    'billed_by_marketing']
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
    // money already sitting on the customer's account settles this invoice now
    const fromCredit = await spendCreditOnSale(client, s.id);
    if (fromCredit.length) {
      const t = fromCredit.reduce((a, c) => a + c.amount, 0);
      warnings.push(`${fmtMoney(t)} of credit held on ${s.customer}'s account was applied to this invoice.`);
      const { rows: fresh } = await client.query('SELECT amount_paid FROM sales WHERE id = $1', [s.id]);
      s.amount_paid = fresh[0].amount_paid;
    }
    await client.query('COMMIT');
    res.status(201).json({ sale: s, warnings, credit_applied: fromCredit });
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
    'tax_pct', 'tax_amount', 'discount_pct', 'discount', 'total', 'amount_paid', 'status',
    'billed_by_marketing']
    .filter((c) => c in req.body);
  const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  // a partial edit can turn a cash sale into a term one, so judge the sale as it
  // will read after the change, not as the body alone describes it
  const { rows: cur } = await q('SELECT * FROM sales WHERE id = $1', [req.params.id]);
  if (!cur.length) return res.status(404).json({ error: 'not found' });
  await assertTermAllowed({ query: q }, { ...cur[0], ...req.body });
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
    await assertTermAllowed(client, sale);
    const cols = ['sales_no', 'date', 'customer', 'store_farm', 'term', 'due_date',
      'contact_no', 'payment_mode', 'account_id', 'sales_rep_id', 'subtotal',
      'tax_pct', 'tax_amount', 'discount_pct', 'discount', 'total', 'status',
      'billed_by_marketing']
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
         (SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = $1 AND ${CLEARED}), 0)
       WHERE id = $1`, [s.id]);
    // money already sitting on the customer's account settles this invoice now
    const fromCredit = await spendCreditOnSale(client, s.id);
    if (fromCredit.length) {
      const t = fromCredit.reduce((a, c) => a + c.amount, 0);
      warnings.push(`${fmtMoney(t)} of credit held on ${s.customer}'s account was applied to this invoice.`);
      const { rows: fresh } = await client.query('SELECT amount_paid FROM sales WHERE id = $1', [s.id]);
      s.amount_paid = fresh[0].amount_paid;
    }
    await client.query('COMMIT');
    res.json({ sale: s, warnings, credit_applied: fromCredit });
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
// Credit held on a customer's account is money already received, so an invoice
// they owe is settled from it straight away rather than waiting to be applied by
// hand. Oldest credit first, never more than the invoice's balance.
async function spendCreditOnSale(client, saleId) {
  const { rows: sale } = await client.query(
    `SELECT id, customer, total - amount_paid AS balance FROM sales
      WHERE id = $1 AND status NOT ILIKE '%cancel%' AND NOT billed_by_marketing`, [saleId]);
  if (!sale.length || Number(sale[0].balance) <= 0.005) return [];
  const { rows: credits } = await client.query(
    `SELECT id, amount - applied AS remaining, account_id FROM customer_advances
      WHERE UPPER(TRIM(customer)) = UPPER(TRIM($1)) AND amount - applied > 0
      ORDER BY date, id FOR UPDATE`, [sale[0].customer]);
  let owed = Number(sale[0].balance);
  const used = [];
  for (const c of credits) {
    if (owed <= 0.005) break;
    const take = Math.min(Number(c.remaining), owed);
    owed = +(owed - take).toFixed(2);
    await client.query(
      `INSERT INTO payments (sale_id, date, amount, account_id, notes)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)`,
      [saleId, take, c.account_id,
       `Settled from credit held on the account (advance #${c.id})`]);
    await client.query(
      'UPDATE customer_advances SET applied = applied + $2, version = version + 1 WHERE id = $1',
      [c.id, take]);
    used.push({ advance_id: c.id, amount: take });
  }
  if (used.length) await client.query(
    `UPDATE sales SET amount_paid = COALESCE(
       (SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = $1 AND ${CLEARED}), 0)
     WHERE id = $1`, [saleId]);
  return used;
}

const fmtMoney = (n) => 'P' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const recomputePaid = (saleId) => q(
  `UPDATE sales SET amount_paid = COALESCE(
     (SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = $1 AND ${CLEARED}), 0)
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
  const { amount, account_id, date, or_no, notes, payer_name, signature, cheque_status } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount required' });
  try {
    await q(
      `INSERT INTO payments (sale_id, date, amount, account_id, or_no, notes, payer_name, signature,
                             cheque_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [req.params.id, date || new Date().toISOString().slice(0, 10),
       amount, account_id ?? null, or_no || null, notes ?? null, payer_name ?? null, signature ?? null,
       cheque_status || null]);
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
  const { amount, account_id, date, or_no, notes, payer_name, signature, version,
          cheque_status } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount required' });
  let rows;
  try {
    ({ rows } = await q(
      `UPDATE payments SET date = $2, amount = $3, account_id = $4, or_no = $5, notes = $6,
              payer_name = $7, signature = $8, cheque_status = $10, version = version + 1
       WHERE id = $1 AND ($9::int IS NULL OR version = $9::int) RETURNING sale_id`,
      [req.params.id, date || new Date().toISOString().slice(0, 10),
       amount, account_id ?? null, or_no || null, notes ?? null, payer_name ?? null, signature ?? null,
       version ?? null, cheque_status || null]));
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

// ---------- payment on account ----------
// A customer often just hands over an amount rather than settling a named
// invoice. The money is applied to their open invoices oldest first, and
// whatever is left over is held as credit on the account instead of being
// forced onto an invoice that does not owe it.
app.post('/api/customers/payment', wrap(async (req, res) => {
  const { customer, date, amount, account_id, or_no, notes, cheque_status } = req.body;
  const amt = Number(amount);
  const who = String(customer || '').trim();
  if (!who) return res.status(400).json({ error: 'customer required' });
  if (!(amt > 0)) return res.status(400).json({ error: 'a positive amount is required' });

  const when = date || new Date().toISOString().slice(0, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // oldest first, and never against an invoice the customer does not owe
    const { rows: open } = await client.query(
      `SELECT id, sales_no, date, total, amount_paid, total - amount_paid AS balance
         FROM sales
        WHERE UPPER(TRIM(customer)) = UPPER(TRIM($1))
          AND status NOT ILIKE '%cancel%' AND NOT billed_by_marketing
          AND total - amount_paid > 0
        ORDER BY date, id
          FOR UPDATE`, [who]);

    let left = amt;
    const applied = [];
    for (const s of open) {
      if (left <= 0.005) break;
      const take = Math.min(Number(s.balance), left);
      left = +(left - take).toFixed(2);
      await client.query(
        `INSERT INTO payments (sale_id, date, amount, account_id, or_no, notes, cheque_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, when, take, account_id ?? null,
         // an OR number is unique, so it rides on the first slice only
         applied.length ? null : (or_no || null),
         `${notes ? notes + ' - ' : ''}Payment on account ${fmtMoney(amt)} of ${when}`,
         cheque_status || null]);
      await client.query(
        `UPDATE sales SET amount_paid = COALESCE(
           (SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = $1 AND ${CLEARED}), 0)
         WHERE id = $1`, [s.id]);
      applied.push({ sale_id: s.id, sales_no: s.sales_no, amount: take,
                     still_open: +(Number(s.balance) - take).toFixed(2) });
    }

    let advance = null;
    if (left > 0.005) {
      const { rows } = await client.query(
        `INSERT INTO customer_advances (customer, date, amount, applied, account_id, notes)
         VALUES ($1,$2,$3,0,$4,$5) RETURNING id`,
        [who, when, left, account_id ?? null,
         `${notes ? notes + ' - ' : ''}Left over from ${fmtMoney(amt)} received ${when}; `
         + `no open invoice to apply it to`]);
      advance = { id: rows[0].id, amount: left };
    }
    await client.query('COMMIT');
    res.json({ ok: true, customer: who, received: amt, applied,
               settled: applied.filter((a) => a.still_open <= 0.005).length,
               credited: +(amt - left).toFixed(2), held_as_credit: left, advance });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: `OR No. "${or_no}" is already used` });
    throw e;
  } finally { client.release(); }
}));

// what a customer owes and holds, for the payment-on-account screen
app.get('/api/customers/balances', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT c.name AS customer,
           COALESCE(o.open, 0) AS balance,
           COALESCE(o.invoices, 0) AS open_invoices,
           COALESCE(a.credit, 0) AS credit
      FROM customers c
      LEFT JOIN (SELECT UPPER(TRIM(customer)) k, SUM(total - amount_paid) open, COUNT(*) invoices
                   FROM sales
                  WHERE status NOT ILIKE '%cancel%' AND NOT billed_by_marketing
                    AND total - amount_paid > 0
                  GROUP BY 1) o ON o.k = UPPER(TRIM(c.name))
      LEFT JOIN (SELECT UPPER(TRIM(customer)) k, SUM(amount - applied) credit
                   FROM customer_advances GROUP BY 1) a ON a.k = UPPER(TRIM(c.name))
     WHERE COALESCE(o.open,0) <> 0 OR COALESCE(a.credit,0) <> 0
     ORDER BY COALESCE(o.open,0) DESC`);
  res.json(rows);
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

// ---------- the next invoice / DR number, issued in series ----------
// Numbering is read back off the books rather than kept in a counter, so it
// survives a restore and cannot drift from what was actually issued: take the
// digits out of every number on file, use the highest, add one. The format
// follows the last number issued (prefix and width), so ML-098 -> ML-099 and
// DR 00305 -> DR 00306 without anything to configure. Still editable in the
// form — this fills the field in, it does not lock it.
async function nextSerial(kind) {
  const [table, col] = kind === 'dr' ? ['deliveries', 'dr_no'] : ['sales', 'sales_no'];
  const { rows } = await q(`
    SELECT COALESCE(MAX(NULLIF(regexp_replace(${col}, '\\D', '', 'g'), '')::bigint), 0) AS n
      FROM ${table}`);
  const next = Number(rows[0].n) + 1;
  // copy the shape of the most recently issued number
  const { rows: last } = await q(`
    SELECT ${col} AS v FROM ${table}
     WHERE ${col} ~ '[0-9]'
     ORDER BY NULLIF(regexp_replace(${col}, '\\D', '', 'g'), '')::bigint DESC NULLS LAST
     LIMIT 1`);
  const sample = last.length ? String(last[0].v) : (kind === 'dr' ? 'DR 00000' : 'ML-000');
  const digits = (sample.match(/\d+/) || ['000'])[0];
  const prefix = sample.slice(0, sample.indexOf(digits));
  return { next: prefix + String(next).padStart(digits.length, '0'), number: next };
}
app.get('/api/next_no', wrap(async (req, res) => {
  const kind = req.query.kind === 'dr' ? 'dr' : 'invoice';
  res.json(await nextSerial(kind));
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
  await q(`DELETE FROM doc_signatures WHERE doc_type = 'DR' AND doc_key = $1`, [String(req.params.id)]);
  res.json({ deleted: rowCount });
}));

// The signing lines each document carries (beyond the DR customer's own).
//   table    -- a stored record: the key is its id, and the record must exist.
//   no table -- a document rebuilt from live data each time it prints. The key
//               names that document on its day or period (a statement's customer
//               and as-of date; a report's page, title and date; a DTR's employee
//               and period), so a reprint of the same document shows who signed
//               and when, and tomorrow's statement starts blank.
//   staff    -- may a non-admin sign it? Drivers and warehouse staff sign DRs on
//               the phone; payslips and DTRs are the admins' paperwork.
const DOC_SIGN = {
  DR:      { table: 'deliveries',   roles: ['issued', 'checked', 'delivered'], staff: true },
  PAYSLIP: { table: 'payroll_runs', roles: ['employee', 'approver'],          staff: false },
  SOA:     { roles: ['received'],                                              staff: true },
  REPORT:  { roles: ['prepared', 'checked', 'approved'],                       staff: true },
  DTR:     { roles: ['employee', 'approver'],                                  staff: false },
};
const docKeyOf = (spec, raw) => {
  const k = String(raw ?? '').trim();
  if (spec.table) return /^\d+$/.test(k) && Number(k) > 0 ? k : null;
  return k && k.length <= 300 ? k : null;
};
app.get('/api/doc_signatures', wrap(async (req, res) => {
  const spec = DOC_SIGN[req.query.doc_type];
  if (!spec) return res.status(400).json({ error: 'Unknown document type.' });
  if (!spec.staff && !req._isAdmin) return res.status(403).json({ error: 'Admins only.' });
  const key = docKeyOf(spec, req.query.doc_key ?? req.query.doc_id);
  if (!key) return res.json([]);
  const { rows } = await q(`
    SELECT role, name, signature, signed_by, signed_at FROM doc_signatures
     WHERE doc_type = $1 AND doc_key = $2`, [req.query.doc_type, key]);
  res.json(rows);
}));
// Sign one line, re-sign it, or (no signature) take it off.
app.put('/api/doc_signatures', wrap(async (req, res) => {
  const { doc_type, role, name, signature } = req.body;
  const spec = DOC_SIGN[doc_type];
  if (!spec || !spec.roles.includes(role)) {
    return res.status(400).json({ error: 'Unknown document or signing line.' });
  }
  if (!spec.staff && !req._isAdmin) {
    return res.status(403).json({ error: 'Only an admin can sign this document.' });
  }
  const key = docKeyOf(spec, req.body.doc_key ?? req.body.doc_id);
  if (!key) return res.status(400).json({ error: 'Bad document reference.' });
  if (signature && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signature)) {
    return res.status(400).json({ error: 'A signature must be a PNG image from the signature pad.' });
  }
  if (spec.table) {
    const { rowCount: exists } = await q(`SELECT 1 FROM ${spec.table} WHERE id = $1`, [Number(key)]);
    if (!exists) return res.status(404).json({ error: 'That document no longer exists.' });
  }
  const who = req._auth?.name || 'unknown';
  const printed = String(name ?? '').trim() || null;
  if (!signature) {
    await q('DELETE FROM doc_signatures WHERE doc_type = $1 AND doc_key = $2 AND role = $3',
      [doc_type, key, role]);
    await q('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
      [who, 'REMOVE signature', `${doc_type} ${key} · ${role}`]);
    return res.json({ removed: true });
  }
  const { rows } = await q(`
    INSERT INTO doc_signatures (doc_type, doc_key, role, name, signature, signed_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (doc_type, doc_key, role) DO UPDATE
      SET name = EXCLUDED.name, signature = EXCLUDED.signature,
          signed_by = EXCLUDED.signed_by, signed_at = now()
    RETURNING role, name, signed_by, signed_at`,
    [doc_type, key, role, printed, signature, who]);
  await q('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
    [who, 'SIGN document', `${doc_type} ${key} · ${role}${printed ? ` · "${printed}"` : ''}`]);
  res.json(rows[0]);
}));

// Who can be picked on the signature pad. Staff: active accounts, sales reps and
// names added by hand. Customer people, each against the store they sign for:
// the owners and managers on its information sheet, its signature specimens and
// certifier, whoever signed for its deliveries and payments before, and names
// added by hand. A "person" who is really a store name, or one of our own staff,
// is left out -- those belong in the other lists.
app.get('/api/signer_names', wrap(async (req, res) => {
  const person = (g, m, s) => `NULLIF(TRIM(CONCAT_WS(' ', NULLIF(TRIM(${g}), ''),
    NULLIF(TRIM(${m}), ''), NULLIF(TRIM(${s}), ''))), '')`;
  const [staff, people, stores] = await Promise.all([
    q(`SELECT name FROM users WHERE active
       UNION SELECT name FROM sales_reps
       UNION SELECT name FROM signer_names WHERE kind = 'staff'`),
    q(`WITH sheet AS (
         SELECT s.*, COALESCE(c.name, s.account_name) AS store
           FROM customer_info_sheets s LEFT JOIN customers c ON c.id = s.customer_id),
       p AS (
         SELECT store, ${person('owner1_given', 'owner1_middle', 'owner1_surname')} AS name FROM sheet
         UNION ALL SELECT store, ${person('owner2_given', 'owner2_middle', 'owner2_surname')} FROM sheet
         UNION ALL SELECT store, ${person('mgr1_given', 'mgr1_middle', 'mgr1_surname')} FROM sheet
         UNION ALL SELECT store, ${person('mgr2_given', 'mgr2_middle', 'mgr2_surname')} FROM sheet
         UNION ALL SELECT store, NULLIF(TRIM(certified_name), '') FROM sheet
         UNION ALL SELECT sh.store, NULLIF(TRIM(sp->>'name'), '')
           FROM sheet sh, jsonb_array_elements(CASE WHEN jsonb_typeof(sh.specimens) = 'array'
                                                    THEN sh.specimens ELSE '[]'::jsonb END) sp
         UNION ALL SELECT customer, name FROM signer_names WHERE kind = 'customer'
         UNION ALL SELECT sa.customer, NULLIF(TRIM(d.received_by), '')
           FROM deliveries d JOIN sales sa ON sa.id = d.sale_id
         UNION ALL SELECT sa.customer, NULLIF(TRIM(py.payer_name), '')
           FROM payments py JOIN sales sa ON sa.id = py.sale_id)
       SELECT DISTINCT ON (UPPER(name), UPPER(COALESCE(store, ''))) name, store
         FROM p WHERE name IS NOT NULL
        ORDER BY UPPER(name), UPPER(COALESCE(store, ''))`),
    q('SELECT name FROM customers ORDER BY UPPER(name)'),
  ]);
  const up = (v) => String(v || '').trim().toUpperCase();
  const staffNames = [...new Map(staff.rows.filter((r) => up(r.name))
    .map((r) => [up(r.name), r.name.trim()])).values()].sort((a, b) => a.localeCompare(b));
  const notPeople = new Set([...stores.rows.map((r) => up(r.name)), ...staffNames.map(up)]);
  res.json({
    staff: staffNames,
    customer: people.rows.filter((r) => !notPeople.has(up(r.name)))
      .map((r) => ({ name: r.name, store: r.store || null })),
    stores: stores.rows.map((r) => r.name),
  });
}));
// Add a name by hand from the signature pad: someone who signs for a customer
// (against that store) or a staff member without an account.
app.post('/api/signer_names', wrap(async (req, res) => {
  const kind = ['staff', 'customer'].includes(req.body.kind) ? req.body.kind : null;
  const name = String(req.body.name ?? '').replace(/\s+/g, ' ').trim();
  const customer = kind === 'customer' ? (String(req.body.customer ?? '').trim() || null) : null;
  if (!kind) return res.status(400).json({ error: 'Say whether this is an employee or a customer.' });
  if (!name || name.length > 120) return res.status(400).json({ error: 'A name is 1 to 120 characters.' });
  const who = req._auth?.name || 'unknown';
  const { rows } = await q(`
    INSERT INTO signer_names (kind, name, customer, created_by) VALUES ($1,$2,$3,$4)
    ON CONFLICT DO NOTHING RETURNING id, kind, name, customer`, [kind, name, customer, who]);
  if (!rows.length) return res.json({ kind, name, customer, existing: true });
  await q('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
    [who, 'ADD signer name', `${kind}: "${name}"${customer ? ` for "${customer}"` : ''}`]);
  res.status(201).json(rows[0]);
}));

// ---------- customer directory (distinct names from past transactions) ----------
// customers are a real table (id-keyed: renames keep tiers and history links)
app.get('/api/customers', wrap(async (req, res) => {
  const { rows } = await q(`
    SELECT id, name, name AS customer, address, address AS store_farm,
           contact_no, term, tier, notes,
           term_approved, term_approved_by, term_approved_at, term_note
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
// Accept or refuse a customer for term sales. Admin-only by omission from
// NON_ADMIN_ALLOWED, so a rep can never grant credit to their own account.
// approved: true = may buy on term, false = refused, null = back to not reviewed.
app.post('/api/customers/:id/term_approval', wrap(async (req, res) => {
  const { approved, note } = req.body;
  const state = approved === null || approved === undefined || approved === ''
    ? null : (approved === true || approved === 'true');
  const who = (req._auth && req._auth.name) || 'Admin';
  const { rows } = await q(`
    UPDATE customers
       SET term_approved = $2,
           term_approved_by = CASE WHEN $2::boolean IS NULL THEN NULL ELSE $3 END,
           term_approved_at = CASE WHEN $2::boolean IS NULL THEN NULL ELSE now() END,
           term_note = $4
     WHERE id = $1 RETURNING *`, [req.params.id, state, who, note ?? null]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  const word = state === true ? 'ACCEPT term' : state === false
    ? 'REFUSE term' : 'RESET term review';
  await q('INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
    [who, `${word} customer`, `"${rows[0].name}"${note ? ` — ${note}` : ''}`]);
  res.json(rows[0]);
}));

// A customer's name is carried as TEXT on their sales, advances, pricing tier and
// information sheet -- those tables were built to read without a join. Renaming
// only the customers row therefore orphans the whole history: the invoices keep
// the old spelling and the receivables split into two customers, one of which no
// longer exists. So a rename carries the new name across every table that holds
// it, in one transaction, and reports what it touched.
const NAME_REFS = [
  ['sales', 'customer', 'invoices'],
  ['customer_advances', 'customer', 'advances'],
  ['customer_tiers', 'customer', 'pricing tiers'],
  ['customer_info_sheets', 'account_name', 'information sheets'],
  ['signer_names', 'customer', 'signing names'],
];
app.put('/api/customers/:id', wrap(async (req, res) => {
  const { name, address, contact_no, term, tier, notes, version } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: before } = await client.query(
      'SELECT * FROM customers WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!before.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not found' });
    }
    if (version != null && Number(before[0].version) !== Number(version)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error:
        'This customer was changed by someone else while you were editing. Reopen it to see the latest version.' });
    }
    const oldName = before[0].name;
    const newName = (name == null || String(name).trim() === '') ? oldName : String(name).trim();
    const renamed = newName.trim().toUpperCase() !== String(oldName).trim().toUpperCase()
      || newName !== oldName;

    if (renamed) {
      const { rows: clash } = await client.query(
        `SELECT id FROM customers WHERE id <> $1 AND UPPER(TRIM(name)) = UPPER(TRIM($2))`,
        [req.params.id, newName]);
      if (clash.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error:
          `Another customer is already called "${newName}". Merge them by hand rather than giving two records the same name.` });
      }
    }

    const { rows } = await client.query(`
      UPDATE customers SET name = $2, address = $3, contact_no = $4,
        term = $5, tier = COALESCE($6, tier), notes = $7, version = version + 1
      WHERE id = $1 RETURNING *`,
      [req.params.id, newName, address ?? null, contact_no ?? null,
       term ?? null, tier ?? null, notes ?? null]);

    const carried = {};
    if (renamed) {
      for (const [table, col] of NAME_REFS) {
        const { rowCount } = await client.query(
          `UPDATE ${table} SET ${col} = $1 WHERE UPPER(TRIM(${col})) = UPPER(TRIM($2))`,
          [newName, oldName]);
        if (rowCount) carried[table] = rowCount;
      }
      await client.query(
        'INSERT INTO audit_log (user_name, action, detail) VALUES ($1,$2,$3)',
        [req._auth?.name || 'unknown', 'RENAME customer',
         `"${oldName}" -> "${newName}"; carried to ${JSON.stringify(carried)}`]);
    }
    await client.query('COMMIT');
    res.json({ ...rows[0], renamed_from: renamed ? oldName : null, carried });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
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
           c.term_approved, c.term_approved_by, c.term_approved_at, c.term_note,
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
         (SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = $1 AND ${CLEARED}), 0)
       WHERE id = $1`, [sale_id]);
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
  if (!name || !roles || !pin) return res.status(400).json({ error: 'name, roles, and PIN are required' });
  if (String(pin).length < 4) return res.status(400).json({ error: 'PIN must be at least 4 digits.' });
  const { rows } = await q(
    `INSERT INTO users (name, roles, pin, active, daily_rate) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, roles, active, daily_rate`,
    [name, roles, hashPin(pin), active ?? true, daily_rate ?? 0]);
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
