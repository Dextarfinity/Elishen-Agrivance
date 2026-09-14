-- The URC delivery of 2026-09-12: record it on the POs and add it to stock.
--
-- Source: the two pickup lists delivered-po1.jpg (ACI, 388) and delivered-po2.jpg
-- (MMFI, 321); hand-written figures are the quantities that came. The paid sales
-- orders are PO1.pdf-PO5.pdf. The same data wrote "PO Delivery Status - Sep 2026.xlsx".
--
-- Only this delivery is recorded. Nothing dated before 2026-09-12 is changed.
--
--   Lines of the paid sales orders (19 lines, 584 units): the PO line is written,
--   or brought to match if already keyed in -- ordered as the SO says, received
--   as came, dated 2026-09-12, status Received / Partial.
--
--   Lines for other orders (6 lines, 125 units -- SO 1890279846, re-approved from
--   SO 1890274632; SO 1890274638; SO 1890271973): each is its own receipt row,
--   dated 2026-09-12. The rows those orders already have are left alone.
--
-- All 709 units come out received on 2026-09-12, and stock rises by exactly that:
-- on hand = initial + received_qty + adjustments - sold.
--
-- Safe to run more than once. Items are matched by name; a line that does not
-- match exactly one product aborts the whole file before anything is written.

BEGIN;

DROP TABLE IF EXISTS rcv_line;
CREATE TEMP TABLE rcv_line (
  so_no text, so_date date, urc_code text, descr text, where_sql text,
  qty numeric, came numeric, gross_unit numeric, net_unit numeric, note text,
  kind text                -- po: a paid PO line   receipt: a receipt for another order
) ON COMMIT DROP;

INSERT INTO rcv_line (so_no, so_date, urc_code, descr, where_sql, qty, came, gross_unit, net_unit, note, kind) VALUES
  ('SO 1890279961', DATE '2026-09-07', '874710', 'Uno+ Premium Starter Pellet 50Kg/B', 'name ILIKE ''UNO+ Starter%''', 30, 34, 2010.00, 1772.17, 'Pickup 2026-09-12: 34 of 30 came (MMFI)', 'po'),
  ('SO 1890279961', DATE '2026-09-07', '874730', 'Uno+ Supreme Boost 25X1Kg', 'name ILIKE ''UNO+ Boost%''', 4, 4, 2340.00, 2063.12, 'Pickup 2026-09-12: 4 of 4 came (MMFI)', 'po'),
  ('SO 1890279961', DATE '2026-09-07', '874720', 'Uno+ Premium Breeder Pellet 50kg/B', 'name ILIKE ''%UNO+ Breeder%''', 15, 15, 1805.00, 1591.42, 'Pickup 2026-09-12: 15 of 15 came (MMFI)', 'po'),
  ('SO 1890279961', DATE '2026-09-07', '874700', 'Uno+ Premium Grower Pellet 50Kg/B', 'name ILIKE ''%UNO+ Grower%''', 30, 28, 1850.00, 1631.10, 'Pickup 2026-09-12: 28 of 30 came (MMFI)', 'po'),
  ('SO 1890279961', DATE '2026-09-07', '874860', 'Uno+ Premium Lactating Pellet 50kg/B', 'name ILIKE ''%UNO+ Lactating%''', 20, 19, 1935.00, 1706.04, 'Pickup 2026-09-12: 19 of 20 came (MMFI)', 'po'),
  ('SO 1890279961', DATE '2026-09-07', '874650', 'Star Gain Grower Pellet 50Kg/B', 'name ILIKE ''Stargain Grower%''', 10, 10, 1735.00, 1529.71, 'Pickup 2026-09-12: 10 of 10 came (MMFI)', 'po'),
  ('SO 1890279962', DATE '2026-09-07', '873510', 'Sup Infinity Power Concentrate 25kg (8)', 'name ILIKE ''%Power Concentrate%''', 6, 6, 1080.00, 907.08, 'Pickup 2026-09-12: 6 of 6 came (MMFI)', 'po'),
  ('SO 1890279962', DATE '2026-09-07', '873520', 'Sup Infinity Super Conditioner 25kg (12)', 'name ILIKE ''%Super Conditioner%''', 6, 6, 1120.00, 940.67, 'Pickup 2026-09-12: 6 of 6 came (MMFI)', 'po'),
  ('SO 1890279963', DATE '2026-09-07', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 30, 30, 1455.00, 1338.51, 'Pickup 2026-09-12: 30 of 30 came (ACI)', 'po'),
  ('SO 1890279971', DATE '2026-09-07', '821788', 'Topcare Cat Litter Lavender 10L X 3 PC', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Lav%''', 50, 50, 555.00, 510.72, 'Pickup 2026-09-12: 50 of 50 came (ACI)', 'po'),
  ('SO 1890279971', DATE '2026-09-07', '821792', 'TopCare Cat Litter Coffee 10L x 3 PC', 'name ILIKE ''%LITTER%'' AND name ILIKE ''%Coffee%''', 20, 20, 555.00, 510.72, 'Pickup 2026-09-12: 20 of 20 came (ACI)', 'po'),
  ('SO 1890279972', DATE '2026-09-07', '878433', 'TopBreed Creamy Treats Tuna 12g x 4Stick (CAR)', 'name ILIKE ''%Creamy Treats%''', 3, 3, 3238.00, 3138.80, 'Pickup 2026-09-12: 3 of 3 came (ACI)', 'po'),
  ('SO 1890276777', DATE '2026-08-19', '873353', 'Supremo Infinity 2.1 Pel & Grains 50Kg', 'name ILIKE ''%Infinity 2.1%'' AND name ILIKE ''%50KG%''', 150, 150, 2070.00, 1720.48, 'Pickup 2026-09-12: 150 of 150 came (MMFI), picked up as re-approved SO 1890279848', 'po'),
  ('SO 1890276777', DATE '2026-08-19', '872300', 'Supremo Infinity Ready Mix Pel Red 25kg', 'name ILIKE ''%Ready Mix%'' AND name ILIKE ''%Pellets%'' AND name ILIKE ''%25%''', 50, 50, 1025.00, 851.93, 'Pickup 2026-09-12: 50 of 50 came (MMFI)', 'po'),
  ('SO 1890276777', DATE '2026-08-19', '871140', 'Supremo Infinity 2.1 (MP) 25x1kg', 'name ILIKE ''%Infinity 2.1%'' AND name ILIKE ''%25%''', 80, 79, 1105.00, 918.42, 'Pickup 2026-09-12: 79 of 80 came (ACI), picked up as re-approved SO 1890279848', 'po'),
  ('SO 1890276779', DATE '2026-08-19', '878160', 'Topbreed Puppy Meal 20Kg/B', 'name ILIKE ''%Puppy%'' AND name ILIKE ''%20KG%''', 10, 10, 1705.00, 1605.78, 'Pickup 2026-09-12: 10 of 10 came (ACI), picked up as re-approved SO 1890279849', 'po'),
  ('SO 1890276779', DATE '2026-08-19', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 20, 20, 1455.00, 1370.33, 'Pickup 2026-09-12: 20 of 20 came (ACI), picked up as re-approved SO 1890279849', 'po'),
  ('SO 1890280005', DATE '2026-09-07', '878140', 'Topbreed Adult Meal 20Kg/B', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%20KG%'' AND name NOT ILIKE ''%Mini%''', 30, 30, 1455.00, 1338.51, 'Pickup 2026-09-12: 30 of 30 came (ACI)', 'po'),
  ('SO 1890279850', DATE '2026-09-07', '878433', 'TopBreed Creamy Treats Tuna 12g x 4Stick (CAR)', 'name ILIKE ''%Creamy Treats%''', 20, 20, 3238.00, 3138.80, 'Pickup 2026-09-12: 20 of 20 came (ACI)', 'po'),
  ('SO 1890279846', DATE '2026-09-07', '871130', 'Supremo Infinity 2 (CGC) 25x1kg', 'name ILIKE ''%Infinity 2 %'' AND name ILIKE ''%25%''', 20, 20, 1135.00, 944.51, 'Pickup 2026-09-12: 20 came (ACI), SO re-approved from SO 1890274632', 'receipt'),
  ('SO 1890279846', DATE '2026-09-07', '871140', 'Supremo Infinity 2.1 (MP) 25x1kg', 'name ILIKE ''%Infinity 2.1%'' AND name ILIKE ''%25%''', 20, 20, 1105.00, 919.55, 'Pickup 2026-09-12: 20 came (ACI), SO re-approved from SO 1890274632', 'receipt'),
  ('SO 1890279846', DATE '2026-09-07', '871150', 'Supremo Infinity 4 (BP) 25x1kg', 'name ILIKE ''%Infinity 4%'' AND name ILIKE ''%25%''', 10, 10, 1160.00, 965.31, 'Pickup 2026-09-12: 10 came (ACI), SO re-approved from SO 1890274632', 'receipt'),
  ('SO 1890279846', DATE '2026-09-07', '872430', 'Supremo Infinity Fortifier 32 HPP 25x1kg', 'name ILIKE ''%Infinity%'' AND name ILIKE ''%32%'' AND name ILIKE ''%25%''', 20, 20, 1405.00, 1169.20, 'Pickup 2026-09-12: 20 came (ACI), SO re-approved from SO 1890274632', 'receipt'),
  ('SO 1890274638', DATE '2026-08-07', '878590', 'Topbreed 5Kg Adult Dog Meal', 'name ILIKE ''%Dog Adult%'' AND name ILIKE ''%5KG%'' AND name NOT ILIKE ''%Mini%''', 20, 20, 376.50, 355.54, 'Pickup 2026-09-12: 20 came (ACI)', 'receipt'),
  ('SO 1890271973', DATE '2026-07-24', '878590', 'Topbreed 5Kg Adult Dog Meal', 'name = ''Topbreed Dog Adult (5KG)''', 35, 35, 376.50, 350.83, 'Pickup 2026-09-12: 35 came (ACI)', 'receipt');

-- ---- resolve every line to exactly one product ----
DROP TABLE IF EXISTS rcv;
CREATE TEMP TABLE rcv (LIKE rcv_line, item_id int, status text) ON COMMIT DROP;
DO $resolve$
DECLARE r record; ids int[]; troubles text := '';
BEGIN
  FOR r IN SELECT * FROM rcv_line LOOP
    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM items WHERE %s', r.where_sql) INTO ids;
    IF ids IS NULL OR array_length(ids, 1) <> 1 THEN
      troubles := troubles || format(E'\n  %s  %s  %s  ->  %s match(es)',
        r.so_no, r.urc_code, r.descr, COALESCE(array_length(ids, 1), 0));
    ELSE
      INSERT INTO rcv (so_no, so_date, urc_code, descr, where_sql, qty, came, gross_unit, net_unit, note, kind,
                       item_id, status)
      VALUES (r.so_no, r.so_date, r.urc_code, r.descr, r.where_sql, r.qty, r.came, r.gross_unit, r.net_unit,
              r.note, r.kind, ids[1], CASE WHEN r.came < r.qty THEN 'Partial' ELSE 'Received' END);
    END IF;
  END LOOP;
  IF troubles <> '' THEN
    RAISE EXCEPTION 'These delivery lines do not match exactly one product:%', troubles;
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

-- ---- paid PO lines: write the line, or bring the one keyed in to match ----
DO $po$
DECLARE r record; n int; troubles text := '';
BEGIN
  FOR r IN SELECT * FROM rcv WHERE kind = 'po' LOOP
    SELECT count(*) INTO n FROM purchases
     WHERE ref_id = r.so_no AND item_id = r.item_id AND status NOT ILIKE '%cancel%';
    IF n = 0 THEN
      INSERT INTO purchases (order_date, received_date, ref_id, item_id, purchase_qty, received_qty,
                             unit_cost, status, vendor_id, notes)
      VALUES (r.so_date, DATE '2026-09-12', r.so_no, r.item_id, r.qty, r.came, r.net_unit, r.status,
              (SELECT id FROM vendors WHERE name ILIKE '%Universal Robina%' ORDER BY id LIMIT 1),
              format('URC Sales Order %s; SO gross %s/unit, net cost after SO discounts. %s',
                     replace(r.so_no, 'SO ', ''),
                     trim(trailing '.' from trim(trailing '0' from r.gross_unit::text)), r.note));
    ELSIF n = 1 THEN
      UPDATE purchases SET
        purchase_qty = r.qty, received_qty = r.came, unit_cost = r.net_unit,
        status = r.status, received_date = DATE '2026-09-12',
        notes = CASE WHEN COALESCE(notes, '') LIKE '%Pickup 2026-09-12%' THEN notes
                     ELSE concat_ws(' ', notes, r.note) END
      WHERE ref_id = r.so_no AND item_id = r.item_id AND status NOT ILIKE '%cancel%';
    ELSE
      troubles := troubles || format(E'\n  %s  %s %s: on the books %s times',
                                     r.so_no, r.urc_code, r.descr, n);
    END IF;
  END LOOP;
  IF troubles <> '' THEN
    RAISE EXCEPTION 'These PO lines are on the books more than once; this file will not guess which to use:%',
      troubles;
  END IF;
END
$po$;

-- ---- other orders: one receipt row each, dated 2026-09-12 ----
INSERT INTO purchases (order_date, received_date, ref_id, item_id, purchase_qty, received_qty,
                       unit_cost, status, vendor_id, notes)
SELECT r.so_date, DATE '2026-09-12', r.so_no, r.item_id, r.came, r.came, r.net_unit, 'Received',
       (SELECT id FROM vendors WHERE name ILIKE '%Universal Robina%' ORDER BY id LIMIT 1),
       format('URC Sales Order %s. %s', replace(r.so_no, 'SO ', ''), r.note)
  FROM rcv r
 WHERE r.kind = 'receipt'
   AND NOT EXISTS (SELECT 1 FROM purchases p
                    WHERE p.ref_id = r.so_no AND p.item_id = r.item_id
                      AND p.received_date = DATE '2026-09-12' AND p.notes LIKE '%Pickup 2026-09-12%');

-- ---- report ----
DO $report$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT ref_id, count(*) AS lines, sum(received_qty) AS came
      FROM purchases WHERE received_date = DATE '2026-09-12' AND notes LIKE '%Pickup 2026-09-12%'
     GROUP BY ref_id ORDER BY ref_id
  LOOP
    RAISE NOTICE '%  % line(s)  received % on 2026-09-12', r.ref_id, r.lines, r.came;
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
    RAISE NOTICE 'stock  %: %', r.name,
      CASE WHEN r.after > r.before THEN '+' ELSE '' END || (r.after - r.before);
  END LOOP;
END
$report$;

COMMIT;
