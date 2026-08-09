-- Sample-data audit: run anytime to verify the database holds only real data.
--   psql -U postgres -d bookkeeping -f db/audit_sample_data.sql
-- Any row showing SUSPICIOUS > 0 deserves a look.
SELECT rpad(t.tbl, 24) AS table_name, t.cnt AS rows,
  CASE WHEN t.suspicious > 0 THEN 'SUSPICIOUS: '||t.suspicious ELSE 'clean' END AS status
FROM (
  SELECT 'items' AS tbl, count(*) AS cnt,
    count(*) FILTER (WHERE name ~* '^(item|product|material)\s*\d+$' OR name ILIKE '%placeholder%') AS suspicious FROM items
  UNION ALL SELECT 'sales', count(*), count(*) FILTER (WHERE customer ~* '^name' OR customer ~* '^customer' OR store_farm ~* '^farm \d' OR contact_no = 'CONTACT NO.') FROM sales
  UNION ALL SELECT 'sale_items', count(*), 0 FROM sale_items
  UNION ALL SELECT 'payments', count(*), 0 FROM payments
  UNION ALL SELECT 'sales_reps', count(*), count(*) FILTER (WHERE name ~* '^user') FROM sales_reps
  UNION ALL SELECT 'vendors', count(*), count(*) FILTER (WHERE name ~* '^vendor') FROM vendors
  UNION ALL SELECT 'accounts', count(*), count(*) FILTER (WHERE name ~* '^account') FROM accounts
  UNION ALL SELECT 'expenses', count(*), count(*) FILTER (WHERE category ~* '^expense\s*\d+$' OR description ~* '^expense\s*\d+$') FROM expenses
  UNION ALL SELECT 'recurring_expenses', count(*), 0 FROM recurring_expenses
  UNION ALL SELECT 'purchases', count(*), 0 FROM purchases
  UNION ALL SELECT 'manual_inventory', count(*), count(*) FILTER (WHERE batch_no ~* '^test') FROM manual_inventory
  UNION ALL SELECT 'balance_entries', count(*), 0 FROM balance_entries
  UNION ALL SELECT 'bom_lines', count(*), 0 FROM bom_lines
  UNION ALL SELECT 'financial_allocations', count(*), count(*) FILTER (WHERE user_name ~* '^user') FROM financial_allocations
  UNION ALL SELECT 'profit_goals', count(*), 0 FROM profit_goals
  UNION ALL SELECT 'settings', count(*), 0 FROM settings
  UNION ALL SELECT 'deliveries', count(*),
    count(*) FILTER (WHERE dr_no ~* '^(test|sample|demo)') FROM deliveries
) t;
