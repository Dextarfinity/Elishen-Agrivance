# Elishen Agrivance — Sales & Inventory Management System
## Getting Started Guide (spreadsheet → system map)

This guide explains what each sheet of the old Google Sheets workbook did, where
that function lives in the system now, and the order to start using it.

---

## The 19 sheets and where they went

### Configuration
| Old sheet | Purpose | In the system |
|---|---|---|
| Setup | Currency, fiscal year, master lists (accounts, users, categories), profit goals | **Settings** (currency, fiscal year, term presets, goals); lists became real tables |
| Instructions (hidden) | Manual for the spreadsheet's mechanics | Not ported — replaced by this guide |
| Data (Hidden) | Formula scratchpad feeding dashboards | Replaced by database views; nothing to touch |

### Selling cycle
| Old sheet | Purpose | In the system |
|---|---|---|
| Sales Generator | POS: pick items, prices, promos, totals | **New Sale** — item picker modal, price override, customer autocomplete, term presets with auto due dates, OR No. |
| Sales Database | Invoice ledger (one row per item line per SALES #) | **Sales** — invoices with line items; edit / void / delete / pay |
| Accounts Receivable | Per-customer unpaid balances | **Receivables** — customer picker, aging buckets, overdue badges |
| (extra columns) | PAYMENT RECEIVED / DATE RECEIVED | **Payments** — true ledger: date, unique OR No., amount, account |

### Stock cycle
| Old sheet | Purpose | In the system |
|---|---|---|
| Inventory | Item master + computed on-hand/status | **Inventory** — items CRUD, live stock, margins |
| Sold Items (mislabeled) | Purchase orders from vendors | **Purchases** — PO CRUD, one-click **Receive**, **Reorder Suggestions** by vendor |
| Manual Inventory | Batch stock corrections | **Inventory** batches + **Stock Take** screen (counts + minimum stocks) |
| Bill of Materials (hidden) | Product recipes consuming materials | **Inventory** — BOM + Production form |
| Vendors | Supplier directory | **Purchases** — vendors CRUD + performance |

### Money cycle
| Old sheet | Purpose | In the system |
|---|---|---|
| Expenses | Expense ledger (net = amount − tax + shipping + fees) | **Expenses** + auto-posting recurring templates |
| Balance | Manual deposits/withdrawals | **Accounts** — balance entries |
| Accounts | Per-account balances | **Accounts** — computed live per payment method |
| Financial Allocation (FAT) | Budget split by percentages w/ rate trail | **Team** — FAT section |
| Sales Rep Comms (SRC) | Per-rep period sales for commissions | **Team** — SRC + auto commissions |

### Reporting
| Old sheet | Purpose | In the system |
|---|---|---|
| Custom Bookkeeping Dashboard | Period income/expenses/P&L | **Dashboard** with date-range filter |
| Inventory Dashboard | KPIs, charts, top-20s, category matrix | **Inventory Dashboard** (fully working) |
| Sales Tax | Monthly collected vs paid matrix | **Reports** — tax tracker |

Every data page has a **Print report** button → letterhead report with
signature lines, straight to print preview.

---

## Startup checklist

### Phase 1 — one-time setup (about an hour)
1. **Settings**: confirm currency (₱), fiscal year start month, term presets.
2. **Accounts**: enter real beginning balances for Cash / GCash / Bank.
3. **Team**: replace "USER 1" with real sales reps and commission rates.
4. **Purchases → Vendors**: add suppliers; then set preferred vendor + cost on items.
5. **Inventory**: add sales prices to the 19 new items (Robichem line, cat litter
   variants, Top B+ vitamins, Shampooch) before selling them.
6. **Stock Take**: counts from 7/29/26 are loaded; fill the **Minimum stock**
   column so Low-Stock alerts and Reorder Suggestions activate.

### Phase 2 — daily operation
- Counter sale → **New Sale** (Cash term auto-marks paid; credit goes to Receivables).
- Credit payment received → **Payments** (OR No. + account).
- Stock arrives → **Purchases → Receive**.
- Bills → **Expenses**; put rent/utilities/salaries in **Recurring** once.

### Phase 3 — weekly/monthly
- **Receivables → Print report** = collections list.
- **Dashboard** (date range) = monthly closing; **Reports** = sales tax filing.

### Cleanup when convenient
- Merge/retire legacy placeholder items `Item 1 / 2 / 4 / 5` (from the sheet's demo invoices).
- Confirm the "Supremo Fortifier 32" → "Supremo Infinity 32 Pellets" mapping.

---

## Running the system
- Server PC: `cd backend && npm start` → app at `http://localhost:3001`
  (other devices: `http://<server-PC-IP>:3001`).
- Desktop app: `cd electron && npm install && npm start`.
- Mobile: see `capacitor/README.md`.
- Database: PostgreSQL `bookkeeping` (UTF-8). Credentials in `backend/.env`.
