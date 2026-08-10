-- ============================================================
-- Bookkeeping & Inventory System — PostgreSQL schema
-- Reverse-engineered from the Google Sheets system
-- (19 tabs → 14 tables + reporting views)
-- ============================================================

-- ---------- Settings (Setup tab) ----------
CREATE TABLE IF NOT EXISTS settings (
    key         text PRIMARY KEY,
    value       text NOT NULL
);
-- expected keys: currency_symbol, start_date, fiscal_year_start_month,
--                company_name, cancelled_status_label

-- Annual profit goals (Setup tab, "ANNUAL PROFIT GOALS" panel w/ checkboxes)
CREATE TABLE IF NOT EXISTS profit_goals (
    id          serial PRIMARY KEY,
    year        int  NOT NULL,
    goal        text NOT NULL,
    achieved    boolean NOT NULL DEFAULT false
);

-- ---------- Master data ----------
CREATE TABLE IF NOT EXISTS sales_reps (
    id          serial PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    commission_rate numeric(6,4) NOT NULL DEFAULT 0   -- Financial Allocation rate
);

CREATE TABLE IF NOT EXISTS vendors (
    id           serial PRIMARY KEY,
    name         text NOT NULL UNIQUE,
    contact_name text,
    phone        text,
    email        text,
    address      text,
    country      text,
    notes        text
);

CREATE TABLE IF NOT EXISTS accounts (                    -- Accounts tab (cash/bank/e-wallet)
    id                serial PRIMARY KEY,
    name              text NOT NULL UNIQUE,
    beginning_balance numeric(14,2) NOT NULL DEFAULT 0,
    last_checked      date
);

CREATE TABLE IF NOT EXISTS items (                       -- Inventory tab
    id                 serial PRIMARY KEY,
    name               text NOT NULL UNIQUE,
    sku                text UNIQUE,
    category           text,
    type               text NOT NULL DEFAULT 'Feed',   -- Feed/Supply/Treat/Product/Material
    initial_stock      numeric(14,3) NOT NULL DEFAULT 0,
    minimum_stock      numeric(14,3) NOT NULL DEFAULT 0,
    sales_price        numeric(14,2),
    cost               numeric(14,2),
    preferred_vendor_id int REFERENCES vendors(id),
    units_in_purchase  numeric(14,3),
    promotion          text,
    notes              text
);
-- profit  = sales_price - cost          (Inventory!L)
-- margin  = (sales_price - cost)/cost   (Inventory!M)  → computed in views

-- Bill of Materials (hidden BOM tab: finished product → components)
CREATE TABLE IF NOT EXISTS bom_lines (
    id               serial PRIMARY KEY,
    finished_item_id int NOT NULL REFERENCES items(id),
    component_item_id int NOT NULL REFERENCES items(id),
    quantity         numeric(14,4) NOT NULL,
    UNIQUE (finished_item_id, component_item_id)
);

-- ---------- Transactions ----------
CREATE TABLE IF NOT EXISTS sales (                       -- Sales Database tab (one row per invoice)
    id            serial PRIMARY KEY,
    sales_no      text NOT NULL UNIQUE,    -- "SALES #"
    date          date NOT NULL,
    customer      text NOT NULL,
    store_farm    text,
    term          text,                    -- e.g. Cash / N days credit
    due_date      date,                    -- derived from term; used for AR aging
    contact_no    text,
    payment_mode  text,                    -- matches accounts.name for deposits
    account_id    int REFERENCES accounts(id),
    sales_rep_id  int REFERENCES sales_reps(id),
    subtotal      numeric(14,2) NOT NULL DEFAULT 0,
    tax_pct       numeric(6,3)  NOT NULL DEFAULT 0,
    tax_amount    numeric(14,2) NOT NULL DEFAULT 0,
    discount_pct  numeric(6,3)  NOT NULL DEFAULT 0,
    discount      numeric(14,2) NOT NULL DEFAULT 0,
    total         numeric(14,2) NOT NULL DEFAULT 0,
    amount_paid   numeric(14,2) NOT NULL DEFAULT 0,   -- for AR balance
    status        text NOT NULL DEFAULT 'Completed'   -- 'Cancelled' rows excluded from stock/dashboards
);

CREATE TABLE IF NOT EXISTS sale_items (                  -- Sales Database ITEMS/QTY/TOTAL PRICE columns
    id        serial PRIMARY KEY,
    sale_id   int NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id   int NOT NULL REFERENCES items(id),
    qty       numeric(14,3) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    total_price numeric(14,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (                   -- "Sold Items" tab = purchase orders from vendors
    id            serial PRIMARY KEY,
    order_date    date NOT NULL,
    received_date date,
    ref_id        text,                    -- "ID" column
    item_id       int NOT NULL REFERENCES items(id),
    purchase_qty  numeric(14,3) NOT NULL,
    received_qty  numeric(14,3) NOT NULL DEFAULT 0,
    unit_cost     numeric(14,2) NOT NULL,
    account_id    int REFERENCES accounts(id),
    status        text NOT NULL DEFAULT 'Ordered',   -- 'Cancelled' excluded from stock
    vendor_id     int REFERENCES vendors(id),
    notes         text
);
-- difference    = purchase_qty - received_qty        (Sold Items!I)
-- total_cost    = purchase_qty * unit_cost           (Sold Items!K)
-- shipping_days = received_date - order_date         (Sold Items!O)

CREATE TABLE IF NOT EXISTS expenses (                    -- Expenses tab
    id          serial PRIMARY KEY,
    date        date NOT NULL,
    ref_id      text,
    category    text NOT NULL,
    amount      numeric(14,2) NOT NULL,
    tax         numeric(14,2) NOT NULL DEFAULT 0,
    shipping    numeric(14,2) NOT NULL DEFAULT 0,
    fees        numeric(14,2) NOT NULL DEFAULT 0,
    account_id  int REFERENCES accounts(id),
    description text,
    remarks     text
);
-- net_amount = amount - tax + shipping + fees        (Expenses!I) → in views

CREATE TABLE IF NOT EXISTS balance_entries (             -- Balance tab (manual deposits/withdrawals)
    id          serial PRIMARY KEY,
    date        date NOT NULL,
    ref_id      text,
    account_id  int NOT NULL REFERENCES accounts(id),
    amount      numeric(14,2) NOT NULL,    -- positive = deposit, negative = withdrawal
    description text,
    remarks     text
);

CREATE TABLE IF NOT EXISTS manual_inventory (            -- Manual Inventory tab (batch stock additions)
    id        serial PRIMARY KEY,
    date      date NOT NULL,
    batch_no  text,
    item_id   int NOT NULL REFERENCES items(id),
    qty       numeric(14,3) NOT NULL,      -- positive add / negative adjust
    notes     text
);

CREATE TABLE IF NOT EXISTS financial_allocations (       -- Financial Allocation tab
    id         serial PRIMARY KEY,
    date       date NOT NULL,
    user_name  text NOT NULL,
    allocation text NOT NULL,
    old_rate   numeric(8,4),
    new_rate   numeric(8,4),
    remarks    text
);

-- ============================================================
-- Reporting views (replaces dashboards / derived tabs)
-- ============================================================

-- ----- Inventory tab computed columns + Inventory Dashboard -----
CREATE OR REPLACE VIEW v_item_stock AS
SELECT
    i.id, i.name, i.sku, i.category, i.type,
    i.sales_price, i.cost,
    (i.sales_price - i.cost)                                    AS profit,
    CASE WHEN i.cost <> 0
         THEN ROUND((i.sales_price - i.cost) / i.cost, 4) END   AS margin,
    i.initial_stock
      + COALESCE(pr.received, 0)
      + COALESCE(mi.qty, 0)
      - COALESCE(sq.sold, 0)                                    AS on_hand,
    i.minimum_stock,
    COALESCE(sq.sold, 0)                                        AS qty_sold,
    CASE
      WHEN i.initial_stock + COALESCE(pr.received,0) + COALESCE(mi.qty,0) - COALESCE(sq.sold,0) <= 0
        THEN 'Out of Stock'
      WHEN i.initial_stock + COALESCE(pr.received,0) + COALESCE(mi.qty,0) - COALESCE(sq.sold,0) <= i.minimum_stock
        THEN 'Low Stock'
      ELSE 'In Stock'
    END                                                         AS status
FROM items i
LEFT JOIN (SELECT item_id, SUM(received_qty) AS received
           FROM purchases WHERE status NOT ILIKE '%cancel%'
           GROUP BY item_id) pr ON pr.item_id = i.id
LEFT JOIN (SELECT item_id, SUM(qty) AS qty
           FROM manual_inventory GROUP BY item_id) mi ON mi.item_id = i.id
LEFT JOIN (SELECT si.item_id, SUM(si.qty) AS sold
           FROM sale_items si JOIN sales s ON s.id = si.sale_id
           -- only count sold quantities from finalized/completed sales
           WHERE s.status ILIKE 'Completed'
           GROUP BY si.item_id) sq ON sq.item_id = i.id;

-- ----- Accounts tab -----
CREATE OR REPLACE VIEW v_account_balances AS
SELECT
    a.id, a.name,
    a.beginning_balance,
    COALESCE(dep.total, 0)                          AS total_deposits,     -- sales received into this account
    COALESCE(wd.expenses, 0) + COALESCE(wd2.purchases, 0) AS total_withdrawals,
    COALESCE(be.total, 0)                           AS balance_adjustments,
    a.beginning_balance + COALESCE(dep.total,0) + COALESCE(be.total,0)
      - (COALESCE(wd.expenses,0) + COALESCE(wd2.purchases,0)) AS current_balance
FROM accounts a
LEFT JOIN (SELECT account_id, SUM(amount_paid) AS total
           FROM sales WHERE status NOT ILIKE '%cancel%'
           GROUP BY account_id) dep ON dep.account_id = a.id
LEFT JOIN (SELECT account_id, SUM(amount - tax + shipping + fees) AS expenses
           FROM expenses GROUP BY account_id) wd ON wd.account_id = a.id
LEFT JOIN (SELECT account_id, SUM(purchase_qty * unit_cost) AS purchases
           FROM purchases WHERE status NOT ILIKE '%cancel%'
           GROUP BY account_id) wd2 ON wd2.account_id = a.id
LEFT JOIN (SELECT account_id, SUM(amount) AS total
           FROM balance_entries GROUP BY account_id) be ON be.account_id = a.id;

-- ----- Accounts Receivable tab -----
CREATE OR REPLACE VIEW v_accounts_receivable AS
SELECT
    s.id, s.sales_no, s.date, s.customer, s.store_farm, s.term,
    s.due_date, s.total, s.amount_paid,
    s.total - s.amount_paid                          AS balance,
    GREATEST(0, CURRENT_DATE - COALESCE(s.due_date, s.date)) AS days_overdue
FROM sales s
WHERE s.status NOT ILIKE '%cancel%'
  AND s.total - s.amount_paid > 0;

CREATE OR REPLACE VIEW v_ar_by_customer AS
SELECT
    UPPER(TRIM(customer))            AS customer_key,
    MIN(customer)                    AS customer,
    COUNT(*)                         AS open_invoices,
    SUM(total - amount_paid)         AS balance,
    MAX(GREATEST(0, CURRENT_DATE - COALESCE(due_date, date))) AS max_days_overdue
FROM sales
WHERE status NOT ILIKE '%cancel%' AND total - amount_paid > 0
GROUP BY UPPER(TRIM(customer));

-- ----- Custom Bookkeeping Dashboard (income vs expenses by month) -----
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
    to_char(mo.month, 'YYYY-MM') AS month,
    COALESCE(inc.total, 0)  AS total_income,
    COALESCE(exp.total, 0)  AS total_expenses,
    COALESCE(inc.total, 0) - COALESCE(exp.total, 0) AS profit_loss
FROM (SELECT DISTINCT date_trunc('month', d)::date AS month
      FROM (SELECT date AS d FROM sales
            UNION ALL SELECT date FROM expenses) t) mo
LEFT JOIN (SELECT date_trunc('month', date)::date AS month, SUM(total) AS total
           FROM sales WHERE status NOT ILIKE '%cancel%'
           GROUP BY 1) inc ON inc.month = mo.month
LEFT JOIN (SELECT date_trunc('month', date)::date AS month,
                  SUM(amount - tax + shipping + fees) AS total
           FROM expenses GROUP BY 1) exp ON exp.month = mo.month
ORDER BY mo.month;

-- ----- Sales Tax tab -----
CREATE OR REPLACE VIEW v_sales_tax AS
SELECT
    to_char(m.month, 'YYYY-MM') AS month,
    COALESCE(c.collected, 0) AS tax_collected,
    COALESCE(p.paid, 0)      AS tax_paid,
    COALESCE(c.collected, 0) - COALESCE(p.paid, 0) AS difference
FROM (SELECT DISTINCT date_trunc('month', d)::date AS month
      FROM (SELECT date AS d FROM sales
            UNION ALL SELECT date FROM expenses) t) m
LEFT JOIN (SELECT date_trunc('month', date)::date AS month, SUM(tax_amount) AS collected
           FROM sales WHERE status NOT ILIKE '%cancel%' GROUP BY 1) c ON c.month = m.month
LEFT JOIN (SELECT date_trunc('month', date)::date AS month, SUM(tax) AS paid
           FROM expenses GROUP BY 1) p ON p.month = m.month
ORDER BY 1;

-- ----- Sales Rep Comms tab -----
CREATE OR REPLACE VIEW v_rep_commissions AS
SELECT
    r.id, r.name, r.commission_rate,
    COUNT(DISTINCT s.id)          AS sales_count,
    COALESCE(SUM(s.total), 0)     AS total_sales,
    ROUND(COALESCE(SUM(s.total), 0) * r.commission_rate, 2) AS commission
FROM sales_reps r
LEFT JOIN sales s ON s.sales_rep_id = r.id AND s.status NOT ILIKE '%cancel%'
GROUP BY r.id, r.name, r.commission_rate;

-- ----- Inventory Dashboard: monthly units sold per item -----
CREATE OR REPLACE VIEW v_monthly_item_sales AS
SELECT
    si.item_id, i.name,
    to_char(date_trunc('month', s.date), 'YYYY-MM') AS month,
    SUM(si.qty)         AS qty_sold,
    SUM(si.total_price) AS revenue
FROM sale_items si
JOIN sales s ON s.id = si.sale_id AND s.status NOT ILIKE '%cancel%'
JOIN items i ON i.id = si.item_id
GROUP BY si.item_id, i.name, 3;

-- ----- Purchases dashboard: vendor performance -----
CREATE OR REPLACE VIEW v_vendor_performance AS
SELECT
    v.id, v.name,
    COUNT(p.id)                                   AS orders,
    SUM(p.purchase_qty * p.unit_cost)             AS total_spent,
    ROUND(AVG(p.received_date - p.order_date), 1) AS avg_shipping_days
FROM vendors v
LEFT JOIN purchases p ON p.vendor_id = v.id AND p.status NOT ILIKE '%cancel%'
GROUP BY v.id, v.name;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sales_date       ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_customer   ON sales(UPPER(TRIM(customer)));
CREATE INDEX IF NOT EXISTS idx_sale_items_item  ON sale_items(item_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_purchases_item   ON purchases(item_id);

-- Add e-signature support for payments: payer name and signature image (data URL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'payments'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'payments'
              AND column_name = 'payer_name'
        ) THEN
            EXECUTE 'ALTER TABLE payments ADD COLUMN payer_name text';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'payments'
              AND column_name = 'signature'
        ) THEN
            EXECUTE 'ALTER TABLE payments ADD COLUMN signature text';
        END IF;
    END IF;
END $$;
-- end of schema
