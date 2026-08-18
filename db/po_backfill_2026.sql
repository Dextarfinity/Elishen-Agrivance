-- Purchase orders from Universal Robina that were never keyed in.
--
-- Source: the scanned sales orders in "Elishen PO/". Eight SOs are missing from
-- the purchases table; everything else in that folder is already on the books
-- and is left alone. Re-running this file is safe -- an SO already present is
-- skipped whole, so it can be applied to either database without minding which
-- has had it before.
--
-- unit_cost follows the convention already in the table: the SO's bottom-line
-- total (VAT included where the SO is VATable) spread across the lines pro-rata
-- by gross value, so the purchase rows add up to what was actually paid. The
-- formula was checked against SO 1890273013 and SO 1890273015 -- both keyed in
-- by hand earlier -- and reproduces their stored unit_cost to the centavo.
--
-- Free goods stay as their own line at 0.00, the way the SO prints them, so the
-- stock arrives without cost.
--
-- Items are matched by NAME, not id: the office and owner databases spell some
-- products differently. Every line must resolve to exactly one product or the
-- whole file aborts, so a mis-match cannot quietly book stock to the wrong bag.

BEGIN;

-- dropped first so the file survives being run twice in one session
DROP TABLE IF EXISTS po_line;
CREATE TEMP TABLE po_line (
  so_no       text    NOT NULL,
  so_date     date    NOT NULL,
  urc_code    text    NOT NULL,
  descr       text    NOT NULL,
  where_sql   text    NOT NULL,   -- how to find this product in this database
  qty         numeric NOT NULL,
  gross_unit  numeric NOT NULL,   -- as printed on the sales order
  net_unit    numeric NOT NULL    -- after the SO's discounts, pro-rata
) ON COMMIT DROP;

INSERT INTO po_line (so_no, so_date, urc_code, descr, where_sql, qty, gross_unit, net_unit) VALUES
  -- SO 1890267682   2026-06-30   132 units   gross 66600.00 - discounts = 61286.40   (VATable; 6 free per 60)
  ('SO 1890267682', DATE '2026-06-30', '821788', 'Topcare Cat Litter Lavender 10L X 3 PC', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Lav%''', 60, 555.00, 510.72),   -- Top Care CAT LITTER Lavander (10L)
  ('SO 1890267682', DATE '2026-06-30', '821788', 'Topcare Cat Litter Lavender 10L X 3 PC - free goods', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Lav%''', 6, 0.00, 0.00),   -- Top Care CAT LITTER Lavander (10L)
  ('SO 1890267682', DATE '2026-06-30', '821792', 'TopCare Cat Litter Coffee 10L x 3 PC', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Coffee%''', 60, 555.00, 510.72),   -- Top Care CAT LITTER Coffee (10L)
  ('SO 1890267682', DATE '2026-06-30', '821792', 'TopCare Cat Litter Coffee 10L x 3 PC - free goods', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Coffee%''', 6, 0.00, 0.00),   -- Top Care CAT LITTER Coffee (10L)
  -- SO 1890267771   2026-07-01   30 units   gross 56850.00 - discounts = 50017.50   (VAT-exempt)
  --    rounding the unit costs to centavos leaves the line total P0.10 over the SO
  ('SO 1890267771', DATE '2026-07-01', '874770', 'Uno+ Supreme Lactating Pellet 50Kg/B', 'name ILIKE ''%Supreme Lactating%''', 10, 1975.00, 1737.64),   -- UNO+ Supreme Lactating (50KG)
  ('SO 1890267771', DATE '2026-07-01', '874720', 'Uno+ Premium Breeder Pellet 50kg/B', 'name ILIKE ''%UNO+ Breeder%''', 10, 1805.00, 1588.07),   -- UNO+ Breeder (50KG)
  ('SO 1890267771', DATE '2026-07-01', '874670', 'Star Gain Starter Pellet 50Kg/B', 'name ILIKE ''%Stargain Starter%''', 10, 1905.00, 1676.05),   -- Stargain Starter (50KG)
  -- SO 1890267773   2026-07-01   10 units   gross 10250.00 - discounts = 8526.25   (VAT-exempt)
  --    rounding the unit costs to centavos leaves the line total P0.05 over the SO
  ('SO 1890267773', DATE '2026-07-01', '872300', 'Supremo Infinity Ready Mix Pel Red 25kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%Pellets%'' AND name ILIKE ''%25%''', 10, 1025.00, 852.63),   -- Supremo Infinity Ready Mix - Grains + Pellets (RED) (25x1kg)
  -- SO 1890274632   2026-08-07   260 units   gross 380340.00 - discounts = 316506.75   (VAT-exempt)
  --    rounding the unit costs to centavos leaves the line total P0.05 under the SO
  ('SO 1890274632', DATE '2026-08-07', '873360', 'Supremo Infinity 3 (Mp) 50Kg/B', 'name ILIKE ''%Infinity 3%'' AND name ILIKE ''%50KG%'' AND name NOT ILIKE ''%Grain%''', 60, 1800.00, 1497.90),   -- Supremo Infinity 3 - Maintenance Pellets - 15% CP (50KG)
  ('SO 1890274632', DATE '2026-08-07', '872530', 'Supremo Infinity Ready Mix Pel Red 50kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%50KG%''', 50, 2010.00, 1672.66),   -- Supremo Infinity Ready Mix - Grains + Pellets (RED) (50kg)
  ('SO 1890274632', DATE '2026-08-07', '872300', 'Supremo Infinity Ready Mix Pel Red 25kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%Pellets%'' AND name ILIKE ''%25%''', 40, 1025.00, 852.97),   -- Supremo Infinity Ready Mix - Grains + Pellets (RED) (25x1kg)
  ('SO 1890274632', DATE '2026-08-07', '873761', 'Supremo Infinity 1 25x1Kg', 'name ILIKE ''%Infinity 1%'' AND name ILIKE ''%25%''', 20, 1242.00, 1033.55),   -- Supremo Infinity 1 Booster (25x1kg)
  ('SO 1890274632', DATE '2026-08-07', '871130', 'Supremo Infinity 2 (CGC) 25x1kg', 'name ILIKE ''%Infinity 2 %'' AND name ILIKE ''%25%''', 20, 1135.00, 944.51),   -- Supremo Infinity 2 Grower (25x1kg)
  ('SO 1890274632', DATE '2026-08-07', '871150', 'Supremo Infinity 4 (BP) 25x1kg', 'name ILIKE ''%Infinity 4%'' AND name ILIKE ''%25%''', 10, 1160.00, 965.31),   -- Supremo Infinity 4 Breeder (25x1kg)
  ('SO 1890274632', DATE '2026-08-07', '872302', 'Supremo Infinity Ready Mix 25X1Kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%25%'' AND name NOT ILIKE ''%Pellets%''', 20, 1075.00, 894.58),   -- Supremo Infinity Ready Mix red (25x1kg)
  ('SO 1890274632', DATE '2026-08-07', '872430', 'Supremo Infinity Fortifier 32 HPP 25x1kg', 'name ILIKE ''%Infinity%'' AND name ILIKE ''%32%'' AND name ILIKE ''%25%''', 20, 1405.00, 1169.20),   -- Supremo Infinity 32 Pellets - 32% CP (25x1kg)
  ('SO 1890274632', DATE '2026-08-07', '871140', 'Supremo Infinity 2.1 (MP) 25x1kg', 'name ILIKE ''%Infinity 2.1%'' AND name ILIKE ''%25%''', 20, 1105.00, 919.55),   -- Supremo Infinity 2.1 Developer + (25x1kg)
  -- SO 1890274638   2026-08-07   175 units   gross 227677.90 - discounts = 215000.24   (VATable)
  --    rounding the unit costs to centavos leaves the line total P0.24 under the SO
  ('SO 1890274638', DATE '2026-08-07', '878160', 'Topbreed Puppy Meal 20Kg/B', 'name ILIKE ''%Puppy%'' AND name ILIKE ''%20KG%''', 15, 1705.00, 1610.06),   -- Topbreed Dog Puppy (20KG)
  ('SO 1890274638', DATE '2026-08-07', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 50, 1455.00, 1373.98),   -- Topbreed Dog Adult (20KG)
  ('SO 1890274638', DATE '2026-08-07', '878960', 'TopBreed Cat Meal 20kg', 'name ILIKE ''%Cat Adult%'' AND name ILIKE ''%20KG%''', 50, 2069.51, 1954.27),   -- Topbreed Cat Adult (20KG)
  ('SO 1890274638', DATE '2026-08-07', '878590', 'Topbreed 5Kg Adult Dog Meal', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%5KG%'' AND name NOT ILIKE ''%Mini%''', 20, 376.50, 355.54),   -- Topbreed Dog Adult (5KG)
  ('SO 1890274638', DATE '2026-08-07', '879013', 'TopBreed Mini Adult 5kg/B', 'name ILIKE ''%Mini%'' AND name ILIKE ''%5KG%''', 20, 386.50, 364.98),   -- Topbreed Dog Adult Mini (5KG)
  ('SO 1890274638', DATE '2026-08-07', '878970', 'TopBreed Cat Meal 5kg', 'name ILIKE ''%Cat Adult%'' AND name ILIKE ''%5KG%''', 20, 530.87, 501.31),   -- Topbreed Cat Adult (5KG)
  -- SO 1890274640   2026-08-07   140 units   gross 261800.00 - discounts = 230090.00   (VAT-exempt)
  --    rounding the unit costs to centavos leaves the line total P0.20 under the SO
  ('SO 1890274640', DATE '2026-08-07', '874700', 'Uno+ Premium Grower Pellet 50Kg/B', 'name ILIKE ''%UNO+ Grower%''', 100, 1850.00, 1625.92),   -- UNO+ Grower (50KG)
  ('SO 1890274640', DATE '2026-08-07', '874860', 'Uno+ Premium Lactating Pellet 50kg/B', 'name ILIKE ''%UNO+ Lactating%''', 20, 1935.00, 1700.63),   -- UNO+ Lactating (50KG)
  ('SO 1890274640', DATE '2026-08-07', '874670', 'Star Gain Starter Pellet 50Kg/B', 'name ILIKE ''%Stargain Starter%''', 20, 1905.00, 1674.26),   -- Stargain Starter (50KG)
  -- SO 1890274641   2026-08-07   40 units   gross 66665.00 - discounts = 58674.28   (VATable; both Gravy Chunks flavours share one item)
  --    rounding the unit costs to centavos leaves the line total P0.12 over the SO
  ('SO 1890274641', DATE '2026-08-07', '879024', 'TopBreed Gravy Chunks RBL 130g (BOX)', 'name ILIKE ''%Gravy Chunks%''', 15, 1285.00, 1130.98),   -- Gravy Chunks (Roasted Chicken&Liver/Chicken&Liver Steak) 130gx12x4
  ('SO 1890274641', DATE '2026-08-07', '879025', 'TopBreed Gravy Chunks CLS 130g (BOX)', 'name ILIKE ''%Gravy Chunks%''', 15, 1285.00, 1130.98),   -- Gravy Chunks (Roasted Chicken&Liver/Chicken&Liver Steak) 130gx12x4
  ('SO 1890274641', DATE '2026-08-07', '879032', 'TopBreed TopTreats Beef 70gx12x4 (CS)', 'name ILIKE ''%TopTreats%''', 5, 2385.00, 2099.12),   -- Topbreed TopTreats (Beef) 70gx12x4
  ('SO 1890274641', DATE '2026-08-07', '878433', 'TopBreed Creamy Treats Tuna 12g x 4Stick (CAR)', 'name ILIKE ''%Creamy Treats%''', 5, 3238.00, 2849.88),   -- Topbreed Creamy Treats (Tuna Flavor) .2g / 4 sticks/ ??
  -- SO 1890274645   2026-08-07   360 units   gross 36600.00 - discounts = 23611.39   (VATable; 60 free on 300 (the 10+2 deal))
  --    rounding the unit costs to centavos leaves the line total P1.39 under the SO
  ('SO 1890274645', DATE '2026-08-07', '820220', 'Robipenstrep P 10Dose W/Diluent (PC)', 'name ILIKE ''%Robipenstrep%'' AND name ILIKE ''%10%''', 300, 122.00, 78.70),   -- Robipenstrep P 10dose/Diluent
  ('SO 1890274645', DATE '2026-08-07', '820220', 'Robipenstrep P 10Dose W/Diluent - free goods', 'name ILIKE ''%Robipenstrep%'' AND name ILIKE ''%10%''', 60, 0.00, 0.00);  -- Robipenstrep P 10dose/Diluent

-- Resolve every line to exactly one product. Each line carries its own WHERE
-- clause, so this runs as a loop; anything ambiguous or unknown aborts the file
-- before a single row is written.
DROP TABLE IF EXISTS po_resolved;
CREATE TEMP TABLE po_resolved (
  so_no text, so_date date, urc_code text, descr text,
  qty numeric, gross_unit numeric, net_unit numeric, item_id int
) ON COMMIT DROP;

DO $resolve$
DECLARE
  r        record;
  ids      int[];
  troubles text := '';
BEGIN
  FOR r IN SELECT * FROM po_line LOOP
    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM items WHERE %s', r.where_sql) INTO ids;
    IF ids IS NULL OR array_length(ids, 1) <> 1 THEN
      troubles := troubles || format(E'\n  %s  %s  ->  %s match(es)',
        r.urc_code, r.descr, COALESCE(array_length(ids, 1), 0));
    ELSE
      INSERT INTO po_resolved
        VALUES (r.so_no, r.so_date, r.urc_code, r.descr, r.qty, r.gross_unit, r.net_unit, ids[1]);
    END IF;
  END LOOP;
  IF troubles <> '' THEN
    RAISE EXCEPTION 'These purchase-order lines do not match exactly one product:%', troubles;
  END IF;
END
$resolve$;

-- Book them, skipping any sales order already on the books.
INSERT INTO purchases
  (order_date, received_date, ref_id, item_id, purchase_qty, received_qty,
   unit_cost, status, vendor_id, notes)
SELECT r.so_date, r.so_date, r.so_no, r.item_id, r.qty, r.qty, r.net_unit, 'Received',
       (SELECT id FROM vendors WHERE name ILIKE '%Universal Robina%' ORDER BY id LIMIT 1),
       format('URC Sales Order %s; SO gross %s/unit, net cost after SO discounts',
              replace(r.so_no, 'SO ', ''),
              trim(trailing '.' from trim(trailing '0' from r.gross_unit::text)))
FROM po_resolved r
WHERE NOT EXISTS (SELECT 1 FROM purchases p WHERE p.ref_id = r.so_no);

-- Say what landed, so the run is auditable from the console.
DO $report$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT ref_id, min(order_date) AS d, count(*) AS lines,
           sum(purchase_qty) AS qty, round(sum(purchase_qty * unit_cost), 2) AS cost
      FROM purchases
     WHERE ref_id IN (SELECT DISTINCT so_no FROM po_resolved)
     GROUP BY ref_id ORDER BY 2, 1
  LOOP
    RAISE NOTICE '% (%)  % line(s)  % units  P%', r.ref_id, r.d, r.lines, r.qty, r.cost;
  END LOOP;
END
$report$;

COMMIT;
