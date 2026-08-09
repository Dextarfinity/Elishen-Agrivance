# Bookkeeping & Inventory App — System Blueprint

Reverse-engineered from the company Google Sheets system
(`chuakatherinemayroluna@gmail.com.xlsx`, 19 tabs, ~38,000 formulas).

**Goal:** replace sheet-hopping with a single app — Electron (desktop) +
Capacitor (mobile) + JavaScript + PostgreSQL — so employees navigate less and
reports generate themselves.

---

## 1. Architecture

Because PostgreSQL is a server database and mobile (Capacitor) clients can't
connect to it directly across devices safely, the app has three layers:

```
┌─────────────────┐     ┌─────────────────┐
│  Electron app    │     │  Capacitor app   │
│  (office desktop)│     │  (phones/tablets)│
└────────┬─────────┘     └────────┬─────────┘
         │       REST/JSON        │
         └──────────┬─────────────┘
             ┌──────▼──────┐
             │  Node.js API │  (Express — runs on one office PC or a small server)
             └──────┬──────┘
             ┌──────▼──────┐
             │  PostgreSQL  │
             └─────────────┘
```

- **Shared UI core** in plain JS — same screens packaged by Electron and Capacitor.
- **The API is the only thing that touches Postgres.** Both clients talk to it
  over the office network (e.g. `http://192.168.x.x:3001`).
- All the spreadsheet's computed columns and dashboards live as **SQL views**
  (see `db/schema.sql`) — the numbers can't drift out of sync the way sheet
  formulas can.

## 2. Sheet → App mapping

| Sheet tab | Becomes | Notes |
|---|---|---|
| Setup | `settings`, `profit_goals` tables + Settings screen | currency, start date, fiscal year, yearly goal checkboxes |
| Sales Generator | **POS / New Sale screen** | item picker w/ live price + stock lookup, qty, promo price override, subtotal→tax→discount→total |
| Sales Database | `sales` + `sale_items` tables | one row per invoice; line items normalized |
| Accounts Receivable | `v_accounts_receivable`, `v_ar_by_customer` views | auto — no more broken FILTER formulas |
| Financial Allocation | `financial_allocations` table | rate-change audit log |
| Sales Rep Comms | `v_rep_commissions` view | rate × rep's non-cancelled sales |
| Vendors | `vendors` table | plain CRUD |
| Inventory | `items` table + `v_item_stock` view | on-hand & status computed live |
| Sold Items *(actually purchase orders!)* | `purchases` table | ordered vs received qty, shipping days |
| Expenses | `expenses` table | net = amount − tax + shipping + fees |
| Manual Inventory | `manual_inventory` table | batch stock additions |
| Bill of Materials (hidden) | `bom_lines` table | finished product → component materials |
| Balance | `balance_entries` table | manual deposits/withdrawals |
| Accounts | `v_account_balances` view | beginning + deposits + adjustments − withdrawals |
| Inventory Dashboard | Dashboard screen ← `v_item_stock`, `v_monthly_item_sales`, `v_vendor_performance` | |
| Custom Bookkeeping Dashboard | Dashboard screen ← `v_monthly_summary` | income vs expense vs P/L, date-range filter |
| Sales Tax | Report screen ← `v_sales_tax` | collected vs paid per month, fiscal-year aware |
| Data (Hidden), Instructions | *not needed* | scratch/pipework the app replaces |

## 3. Recovered business rules (from the formulas)

These were extracted from the sheet formulas, including 246 Google-only
formulas (`FILTER`/`SORT`/`UNIQUE`/`LET`) that the Excel export had wrapped in
`__xludf.DUMMYFUNCTION(...)` — that's what looked "encrypted."

1. **Stock on hand** = initial stock + received purchases (non-cancelled)
   + manual inventory batches − sold qty (non-cancelled sales).
   *(Inventory!G9)*
2. **Stock status**: `0 → Out of Stock`, `≤ minimum → Low Stock`, else `In Stock`.
   *(Inventory!I9)*
3. **Profit / margin** per item: `price − cost`, `(price − cost)/cost`.
4. **Expense net** = amount − tax + shipping + fees. *(Expenses!I7)*
5. **Purchase order**: difference = ordered − received; total cost = qty × unit
   cost; shipping days = received − order date. *(Sold Items!I,K,O)*
6. **Account balance** = beginning + sales deposits into that account
   + manual balance entries − (expense net + purchase costs) charged to it.
   *(Accounts!D15 = SUM(F,H,L) − J)*
7. **Accounts receivable**: invoices matched per customer
   case-insensitively; days overdue = `max(0, today − due date)`.
   *(AR!Y8 LET/FILTER formula, AR!Z8)*
8. **Commission** = rep's rate × total of that rep's non-cancelled sales.
   *(Sales Rep Comms FILTER by rep + rate from Financial Allocation)*
9. **Sales tax report** = tax collected on sales vs tax paid on expenses,
   monthly, honoring a fiscal-year start month from Setup. *(Sales Tax!T4)*
10. **Cancelled exclusions**: everywhere, rows whose status contains the
    cancelled label (from Setup) are excluded from stock and money totals
    (`"<>*Cancelled*"` in the SUMIFS).
11. **BOM**: making a finished product consumes component materials at the
    per-unit quantities in the BOM table (the sheet negates component stock).

## 4. App screens (v1)

1. **Dashboard** — income / expenses / P&L cards, monthly chart, low-stock alerts
2. **New Sale (POS)** — replaces Sales Generator
3. **Sales** — invoice list + detail, record payments (feeds AR)
4. **Inventory** — items, stock status, manual batches, BOM
5. **Purchases** — POs, receiving, vendor performance
6. **Expenses** — entry + category report
7. **Accounts** — balances, deposits/withdrawals
8. **Reports** — AR aging, sales tax, rep commissions, export to PDF/XLSX
9. **Settings** — currency, fiscal year, reps, goals

## 5. Repo layout

```
bookkeeping-app/
├── db/schema.sql          # PostgreSQL schema + views  ✅
├── docs/BLUEPRINT.md      # this file                  ✅
├── backend/               # Node/Express API — `cd backend && npm start`
├── app/                   # shared JS UI core          (next)
├── electron/              # desktop shell              (next)
├── capacitor/             # mobile shell               (next)
└── importer/              # xlsx → Postgres data load  (next)
```

## 6. Migration plan

1. Create DB: `createdb bookkeeping && psql bookkeeping < db/schema.sql`
2. Run importer against the downloaded xlsx to load existing vendors, items,
   accounts, sales, expenses.
3. Verify: app dashboard totals vs the live Google Sheet dashboards.
4. Pilot with one employee alongside the sheet, then switch over.

> **Note:** the source sheet appears to be a purchased template ("Note from
> creator" in Setup). Rebuilding its *functionality* internally for company use
> is fine; don't redistribute/resell the template's design or files.
