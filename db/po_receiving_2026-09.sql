-- Paid URC sales orders, and what actually came.
--
-- Source: PO1.pdf-PO5.pdf (twelve paid sales orders) and the two pickup lists
-- delivered-po1.jpg (ACI) and delivered-po2.jpg (MMFI); hand-written figures on
-- those lists are the quantities that arrived. The same data wrote
-- "PO Delivery Status - Sep 2026.xlsx".
--
-- What it does, per sales-order line:
--   purchase_qty = what the SO says was ordered and paid for
--   received_qty = what arrived  -> this is what stock on hand counts
--   status       = Received (all came) / Partial (some) / Ordered (none yet)
-- A sales order never keyed in is added. One already on the books has its lines
-- brought to match -- that includes SO 1890267771 and SO 1890267773, which the
-- earlier backfill booked as fully received but which have not arrived.
--
-- Stock needs nothing more: on hand = initial + received_qty + adjustments - sold,
-- so correcting received_qty corrects the count, and nothing is counted twice.
--
-- Safe to run more than once, and on either database. Items are matched by name;
-- a line that does not match exactly one product aborts the whole file before
-- anything is written.

BEGIN;

DROP TABLE IF EXISTS rcv_line;
CREATE TEMP TABLE rcv_line (
  so_no text, so_date date, urc_code text, descr text, where_sql text,
  qty numeric, came numeric, gross_unit numeric, net_unit numeric, note text
) ON COMMIT DROP;

INSERT INTO rcv_line (so_no, so_date, urc_code, descr, where_sql, qty, came, gross_unit, net_unit, note) VALUES
  ('SO 1890279961', DATE '2026-09-07', '874710', 'Uno+ Premium Starter Pellet 50Kg/B', 'name ILIKE ''UNO+ Starter%''', 30, 34, 2010.00, 1772.17, 'Pickup 2026-09-12: 34 of 30 came (MMFI)'),
  ('SO 1890279961', DATE '2026-09-07', '874730', 'Uno+ Supreme Boost 25X1Kg', 'name ILIKE ''UNO+ Boost%''', 4, 4, 2340.00, 2063.12, 'Pickup 2026-09-12: 4 of 4 came (MMFI)'),
  ('SO 1890279961', DATE '2026-09-07', '874720', 'Uno+ Premium Breeder Pellet 50kg/B', 'name ILIKE ''%UNO+ Breeder%''', 15, 15, 1805.00, 1591.42, 'Pickup 2026-09-12: 15 of 15 came (MMFI)'),
  ('SO 1890279961', DATE '2026-09-07', '874700', 'Uno+ Premium Grower Pellet 50Kg/B', 'name ILIKE ''%UNO+ Grower%''', 30, 28, 1850.00, 1631.10, 'Pickup 2026-09-12: 28 of 30 came (MMFI)'),
  ('SO 1890279961', DATE '2026-09-07', '874860', 'Uno+ Premium Lactating Pellet 50kg/B', 'name ILIKE ''%UNO+ Lactating%''', 20, 19, 1935.00, 1706.04, 'Pickup 2026-09-12: 19 of 20 came (MMFI)'),
  ('SO 1890279961', DATE '2026-09-07', '874650', 'Star Gain Grower Pellet 50Kg/B', 'name ILIKE ''Stargain Grower%''', 10, 10, 1735.00, 1529.71, 'Pickup 2026-09-12: 10 of 10 came (MMFI)'),
  ('SO 1890279962', DATE '2026-09-07', '873510', 'Sup Infinity Power Concentrate 25kg (8)', 'name ILIKE ''%Power Concentrate%''', 6, 6, 1080.00, 907.08, 'Pickup 2026-09-12: 6 of 6 came (MMFI)'),
  ('SO 1890279962', DATE '2026-09-07', '873520', 'Sup Infinity Super Conditioner 25kg (12)', 'name ILIKE ''%Super Conditioner%''', 6, 6, 1120.00, 940.67, 'Pickup 2026-09-12: 6 of 6 came (MMFI)'),
  ('SO 1890279963', DATE '2026-09-07', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 30, 30, 1455.00, 1338.51, 'Pickup 2026-09-12: 30 of 30 came (ACI)'),
  ('SO 1890279971', DATE '2026-09-07', '821788', 'Topcare Cat Litter Lavender 10L X 3 PC', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Lav%''', 50, 50, 555.00, 510.72, 'Pickup 2026-09-12: 50 of 50 came (ACI)'),
  ('SO 1890279971', DATE '2026-09-07', '821792', 'TopCare Cat Litter Coffee 10L x 3 PC', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Coffee%''', 20, 20, 555.00, 510.72, 'Pickup 2026-09-12: 20 of 20 came (ACI)'),
  ('SO 1890279972', DATE '2026-09-07', '878433', 'TopBreed Creamy Treats Tuna 12g x 4Stick (CAR)', 'name ILIKE ''%Creamy Treats%''', 3, 3, 3238.00, 3138.80, 'Pickup 2026-09-12: 3 of 3 came (ACI)'),
  ('SO 1890276777', DATE '2026-08-19', '873353', 'Supremo Infinity 2.1 Pel & Grains 50Kg', 'name ILIKE ''%Infinity 2.1%'' AND name ILIKE ''%50KG%''', 150, 150, 2070.00, 1720.48, 'Pickup 2026-09-12: 150 of 150 came (MMFI), picked up as re-approved SO 1890279848'),
  ('SO 1890276777', DATE '2026-08-19', '873360', 'Supremo Infinity 3 (Mp) 50Kg/B', 'name ILIKE ''%Infinity 3%'' AND name ILIKE ''%50KG%'' AND name NOT ILIKE ''%Grain%''', 50, 0, 1800.00, 1496.07, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890276777', DATE '2026-08-19', '872300', 'Supremo Infinity Ready Mix Pel Red 25kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%Pellets%'' AND name ILIKE ''%25%''', 50, 50, 1025.00, 851.93, 'Pickup 2026-09-12: 50 of 50 came (MMFI)'),
  ('SO 1890276777', DATE '2026-08-19', '871140', 'Supremo Infinity 2.1 (MP) 25x1kg', 'name ILIKE ''%Infinity 2.1%'' AND name ILIKE ''%25%''', 80, 79, 1105.00, 918.42, 'Pickup 2026-09-12: 79 of 80 came (ACI), picked up as re-approved SO 1890279848'),
  ('SO 1890276779', DATE '2026-08-19', '878160', 'Topbreed Puppy Meal 20Kg/B', 'name ILIKE ''%Puppy%'' AND name ILIKE ''%20KG%''', 10, 10, 1705.00, 1605.78, 'Pickup 2026-09-12: 10 of 10 came (ACI), picked up as re-approved SO 1890279849'),
  ('SO 1890276779', DATE '2026-08-19', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 20, 20, 1455.00, 1370.33, 'Pickup 2026-09-12: 20 of 20 came (ACI), picked up as re-approved SO 1890279849'),
  ('SO 1890276779', DATE '2026-08-19', '878960', 'TopBreed Cat Meal 20kg', 'name ILIKE ''%Cat Adult%'' AND name ILIKE ''%20KG%''', 15, 0, 2069.51, 1949.08, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890276783', DATE '2026-08-19', '879024', 'TopBreed Gravy Chunks RBL 130g (BOX)', 'name ILIKE ''%Gravy Chunks%''', 10, 0, 1285.00, 1060.81, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890276783', DATE '2026-08-19', '879025', 'TopBreed Gravy Chunks CLS 130g (BOX)', 'name ILIKE ''%Gravy Chunks%''', 10, 0, 1285.00, 1060.81, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890280005', DATE '2026-09-07', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 30, 30, 1455.00, 1338.51, 'Pickup 2026-09-12: 30 of 30 came (ACI)'),
  ('SO 1890279850', DATE '2026-09-07', '878433', 'TopBreed Creamy Treats Tuna 12g x 4Stick (CAR)', 'name ILIKE ''%Creamy Treats%''', 20, 20, 3238.00, 3138.80, 'Pickup 2026-09-12: 20 of 20 came (ACI)'),
  ('SO 1890267771', DATE '2026-07-01', '874770', 'Uno+ Supreme Lactating Pellet 50Kg/B', 'name ILIKE ''%Supreme Lactating%''', 10, 0, 1975.00, 1737.64, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890267771', DATE '2026-07-01', '874720', 'Uno+ Premium Breeder Pellet 50kg/B', 'name ILIKE ''%UNO+ Breeder%''', 10, 0, 1805.00, 1588.07, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890267771', DATE '2026-07-01', '874670', 'Star Gain Starter Pellet 50Kg/B', 'name ILIKE ''%Stargain Starter%''', 10, 0, 1905.00, 1676.05, 'Pickup 2026-09-12: not delivered yet'),
  ('SO 1890267773', DATE '2026-07-01', '872300', 'Supremo Infinity Ready Mix Pel Red 25kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%Pellets%'' AND name ILIKE ''%25%''', 10, 0, 1025.00, 852.63, 'Pickup 2026-09-12: not delivered yet');

-- ---- resolve every line to exactly one product ----
DROP TABLE IF EXISTS rcv;
CREATE TEMP TABLE rcv (LIKE rcv_line, item_id int, status text, received_date date) ON COMMIT DROP;
DO $resolve$
DECLARE r record; ids int[]; troubles text := '';
BEGIN
  FOR r IN SELECT * FROM rcv_line LOOP
    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM items WHERE %s', r.where_sql) INTO ids;
    IF ids IS NULL OR array_length(ids, 1) <> 1 THEN
      troubles := troubles || format(E'\n  SO %s  %s  %s  ->  %s match(es)',
        r.so_no, r.urc_code, r.descr, COALESCE(array_length(ids, 1), 0));
    ELSE
      INSERT INTO rcv (so_no, so_date, urc_code, descr, where_sql, qty, came, gross_unit, net_unit, note,
                       item_id, status, received_date)
      VALUES (r.so_no, r.so_date, r.urc_code, r.descr, r.where_sql, r.qty, r.came, r.gross_unit, r.net_unit, r.note,
        ids[1],
        CASE WHEN r.came = 0 THEN 'Ordered' WHEN r.came < r.qty THEN 'Partial' ELSE 'Received' END,
        CASE WHEN r.came > 0 THEN DATE '2026-09-12' END);
    END IF;
  END LOOP;
  IF troubles <> '' THEN
    RAISE EXCEPTION 'These sales-order lines do not match exactly one product:%', troubles;
  END IF;
END
$resolve$;

-- what each product had received before, so the run can report the change
DROP TABLE IF EXISTS rcv_before;
CREATE TEMP TABLE rcv_before ON COMMIT DROP AS
  SELECT p.item_id, SUM(p.received_qty) AS received
    FROM purchases p
   WHERE p.item_id IN (SELECT item_id FROM rcv) AND p.status NOT ILIKE '%cancel%'
   GROUP BY p.item_id;

-- ---- sales orders never keyed in: add every line ----
DROP TABLE IF EXISTS rcv_new_so;
CREATE TEMP TABLE rcv_new_so ON COMMIT DROP AS
  SELECT DISTINCT so_no FROM rcv r
   WHERE NOT EXISTS (SELECT 1 FROM purchases p WHERE p.ref_id = r.so_no);

INSERT INTO purchases (order_date, received_date, ref_id, item_id, purchase_qty, received_qty,
                       unit_cost, status, vendor_id, notes)
SELECT r.so_date, r.received_date, r.so_no, r.item_id, r.qty, r.came, r.net_unit, r.status,
       (SELECT id FROM vendors WHERE name ILIKE '%Universal Robina%' ORDER BY id LIMIT 1),
       format('URC Sales Order %s; SO gross %s/unit, net cost after SO discounts. %s',
              replace(r.so_no, 'SO ', ''),
              trim(trailing '.' from trim(trailing '0' from r.gross_unit::text)), r.note)
  FROM rcv r
 WHERE r.so_no IN (SELECT so_no FROM rcv_new_so);

-- ---- sales orders already on the books: bring each line to match ----
-- Lines are paired by product. Where one SO carries the same product on more
-- than one line (both Gravy Chunks flavours share one item) the lines must be
-- identical and as many as the rows on file; otherwise nothing is guessed.
DO $existing$
DECLARE g record; n_rows int; troubles text := '';
BEGIN
  FOR g IN
    SELECT so_no, item_id, count(*) AS n_lines,
           min(qty) AS qty, max(qty) AS qty_max, min(came) AS came, max(came) AS came_max,
           min(net_unit) AS net_unit, max(net_unit) AS net_max,
           min(status) AS status, min(received_date) AS received_date, min(note) AS note,
           min(so_date) AS so_date, string_agg(urc_code, '/') AS codes
      FROM rcv WHERE so_no NOT IN (SELECT so_no FROM rcv_new_so)
     GROUP BY so_no, item_id
  LOOP
    SELECT count(*) INTO n_rows FROM purchases
     WHERE ref_id = g.so_no AND item_id = g.item_id AND status NOT ILIKE '%cancel%';
    IF n_rows = 0 THEN
      INSERT INTO purchases (order_date, received_date, ref_id, item_id, purchase_qty, received_qty,
                             unit_cost, status, vendor_id, notes)
      SELECT r.so_date, r.received_date, r.so_no, r.item_id, r.qty, r.came, r.net_unit, r.status,
             (SELECT id FROM vendors WHERE name ILIKE '%Universal Robina%' ORDER BY id LIMIT 1),
             format('URC Sales Order %s. %s', replace(r.so_no, 'SO ', ''), r.note)
        FROM rcv r WHERE r.so_no = g.so_no AND r.item_id = g.item_id;
    ELSIF n_rows = g.n_lines AND g.qty = g.qty_max AND g.came = g.came_max AND g.net_unit = g.net_max THEN
      UPDATE purchases SET
        purchase_qty = g.qty, received_qty = g.came, unit_cost = g.net_unit,
        status = g.status, received_date = g.received_date,
        notes = CASE WHEN COALESCE(notes, '') LIKE '%Pickup 2026-09-12%' THEN notes
                     ELSE concat_ws(' ', notes, g.note) END
      WHERE ref_id = g.so_no AND item_id = g.item_id AND status NOT ILIKE '%cancel%';
    ELSE
      troubles := troubles || format(E'\n  %s  (%s): %s line(s) on the SO, %s row(s) on the books',
                                     g.so_no, g.codes, g.n_lines, n_rows);
    END IF;
  END LOOP;
  IF troubles <> '' THEN
    RAISE EXCEPTION 'These sales orders are on the books in a shape this file will not guess at:%', troubles;
  END IF;
END
$existing$;

-- ---- report ----
DO $report$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT ref_id, count(*) AS lines, sum(purchase_qty) AS ordered, sum(received_qty) AS came,
           string_agg(DISTINCT status, '/') AS status
      FROM purchases WHERE ref_id IN (SELECT DISTINCT so_no FROM rcv)
     GROUP BY ref_id ORDER BY min(order_date), ref_id
  LOOP
    RAISE NOTICE '%  % line(s)  ordered %  came %  (%)', r.ref_id, r.lines, r.ordered, r.came, r.status;
  END LOOP;
  FOR r IN
    SELECT i.name, COALESCE(b.received, 0) AS before, a.received AS after
      FROM (SELECT item_id, SUM(received_qty) AS received FROM purchases
             WHERE item_id IN (SELECT item_id FROM rcv) AND status NOT ILIKE '%cancel%'
             GROUP BY item_id) a
      JOIN items i ON i.id = a.item_id
      LEFT JOIN rcv_before b ON b.item_id = a.item_id
     WHERE a.received IS DISTINCT FROM COALESCE(b.received, 0)
     ORDER BY i.name
  LOOP
    RAISE NOTICE 'stock  %: received % -> % (on hand %)', r.name, r.before, r.after,
      CASE WHEN r.after > r.before THEN '+' ELSE '' END || (r.after - r.before);
  END LOOP;
END
$report$;

COMMIT;
