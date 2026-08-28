-- RobiChem stock count of August 2026, and per-piece selling.
--
-- Two things, because they only make sense together.
--
-- 1. Pack size. RobiChem is bought by the box but sold by the piece: a customer
--    wants six bottles out of a twelve, not the box. Each counted item records
--    how many pieces a full box holds, so staff can still order and receive in
--    boxes while stock and price stay per piece.
--
-- 2. The count itself. Eleven of these products were already stocked per piece.
--    Five -- both Top B+, both Shampooch, and Wheatgerm -- were stocked AND
--    priced per box, which is why an opened box could not be recorded at all.
--    Those five are converted: the count is booked in pieces and the price is
--    divided by the pack, so the money per box is unchanged while a single
--    bottle can now be sold. Past sales keep the price they were made at --
--    sale lines carry their own unit_price, so history is untouched.
--
-- The count is booked as a stock-take adjustment (counted less what the system
-- believed), which is how manual_inventory already works. Re-running the file
-- is safe: the adjustment is recomputed from the live figure each time, and the
-- price conversion only fires while the price is still the box price.
--
-- Every line must resolve to exactly one product or nothing is written.

BEGIN;

-- self-contained: the column is created here too, so the file can be run before
-- the API has been restarted with the code that also adds it
ALTER TABLE items ADD COLUMN IF NOT EXISTS pack_size numeric(12,3);

DROP TABLE IF EXISTS pg_temp.rc_count;
CREATE TEMP TABLE rc_count (
  where_sql text NOT NULL,   -- how to find the product in this database
  descr     text NOT NULL,
  pack      numeric NOT NULL,   -- pieces in a full box
  counted   numeric NOT NULL,   -- pieces counted on the shelf
  per_box   boolean NOT NULL,   -- was priced/stocked by the box, so convert it
  source    text NOT NULL       -- the line as it was written down
) ON COMMIT DROP;

INSERT INTO rc_count (where_sql, descr, pack, counted, per_box, source) VALUES
  ('name ILIKE ''%Levomax%''', 'Levomax', 36, 576, false, 'levomax 36x5 - 16'),
  ('name ILIKE ''%Spectrum (96/box)%''', 'Spectrum (96/box)', 96, 1632, false, 'spectrum 96x5 - 17'),
  ('name ILIKE ''%Iron - D inj%''', 'Iron - D inj', 12, 80, false, 'iron dextran 12x100ml - 6 +1(8 left)'),
  ('name ILIKE ''%Robicomject%''', 'Robicomject inj 100ml', 12, 95, false, 'robicomject 12x100ml - 7 +1(11 left)'),
  ('name ILIKE ''%Spectrum Plus (96/box)%''', 'Spectrum Plus (96/box)', 96, 1728, false, 'spectrum plus 96x5g - 18'),
  ('name ILIKE ''%Tripulac%''', 'Tripulac Pig Doser 2x1 set', 24, 148, false, 'cotrimazine tripulac 24x100ml - 6 +1(4 left) -- counted as 24x100ml; the catalogue calls it a "2x1 set" -- packaging worth confirming'),
  ('name ILIKE ''%Wormbuster Single Dose%''', 'Wormbuster Single Dose 5Gm', 36, 684, false, 'wormbuster 36pcs x 5g - 19'),
  ('name ILIKE ''%Top B+ Vitamins 60ml%''', 'Top B+ Vitamins 60ml', 36, 643, true, 'top b+ 36x60ml - 17 +1(31 left)'),
  ('name ILIKE ''%Wheatgerm 300Gm x 12/box%''', 'Wheatgerm 300Gm x 12/box', 12, 81, true, 'wheat germ 12x300g - 6 +1(9 left)'),
  ('name ILIKE ''%Coccibuster%''', 'Coccibuster', 36, 576, false, 'coccibuster 36pcsx5 - 16'),
  ('name ILIKE ''%Robi L.A inj 100ml%''', 'Robi L.A inj 100ml', 12, 101, false, 'robi la 12x100ml - 8 +1(5 left) -- listed twice; the later line with the opened box is the one taken'),
  ('name ILIKE ''%Robipenstrep P Single dose%''', 'Robipenstrep P Single dose bt', 48, 48, false, 'robipenstrep 48x1dose - 1'),
  ('name ILIKE ''%Robistrep Vk 5Gm%''', 'Robistrep Vk 5Gm', 96, 1344, false, 'robipenstrep 96x5g - 14 -- Robipenstrep is sold by dose; the 5g sachet is Robistrep VK'),
  ('name ILIKE ''%Top B+ Vitamins 120ml%''', 'Top B+ Vitamins 120ml', 18, 360, true, 'top b+ 18x120ml - 20'),
  ('name ILIKE ''%Shampooch 300ml bt 12/box%''', 'Shampooch 300ml bt 12/box', 12, 96, true, 'shampooch 12botx300ml - 8'),
  ('name ILIKE ''%Shampooch Sachet%''', 'Shampooch Sachet', 16, 126, true, 'shampooch 16boxes x (15mlx25sachets) - 7 +1(14 left) -- the piece here is one 25-sachet box; a carton holds 16 of them');

DROP TABLE IF EXISTS pg_temp.rc_resolved;
CREATE TEMP TABLE rc_resolved (
  item_id int, descr text, pack numeric, counted numeric, per_box boolean, source text
) ON COMMIT DROP;

DO $resolve$
DECLARE r record; ids int[]; troubles text := '';
BEGIN
  FOR r IN SELECT * FROM rc_count LOOP
    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM items WHERE %s', r.where_sql) INTO ids;
    IF ids IS NULL OR array_length(ids, 1) <> 1 THEN
      troubles := troubles || format(E'\n  %s  ->  %s match(es)', r.descr,
        COALESCE(array_length(ids, 1), 0));
    ELSE
      INSERT INTO rc_resolved VALUES (ids[1], r.descr, r.pack, r.counted, r.per_box, r.source);
    END IF;
  END LOOP;
  IF troubles <> '' THEN
    RAISE EXCEPTION 'These counted products do not match exactly one item:%', troubles;
  END IF;
END
$resolve$;

-- 1. record the box size
UPDATE items i SET pack_size = r.pack FROM rc_resolved r WHERE i.id = r.item_id;

-- 2. convert the five that were priced by the box, once
UPDATE items i
   SET sales_price = ROUND(i.sales_price / r.pack, 2),
       cost        = ROUND(i.cost / r.pack, 2),
       uom         = CASE WHEN i.uom IN ('box', 'carton') THEN 'piece' ELSE i.uom END,
       notes       = COALESCE(i.notes || ' ', '')
                     || format('Priced per piece from %s; a box holds %s.',
                               to_char(CURRENT_DATE, 'FMMonth YYYY'), r.pack)
  FROM rc_resolved r
 WHERE i.id = r.item_id AND r.per_box
   AND i.uom IN ('box', 'carton');          -- only while it is still box-priced

-- 3. book the count as a stock-take adjustment against what the system believed
INSERT INTO manual_inventory (date, batch_no, item_id, qty, notes)
SELECT CURRENT_DATE, 'RC-COUNT-2026-08', r.item_id,
       r.counted - v.on_hand,
       format('Counted %s piece(s) on the shelf; system had %s. Source: %s',
              r.counted, v.on_hand, r.source)
  FROM rc_resolved r
  JOIN v_item_stock v ON v.id = r.item_id
 WHERE r.counted - v.on_hand <> 0
   AND NOT EXISTS (SELECT 1 FROM manual_inventory m
                    WHERE m.item_id = r.item_id AND m.batch_no = 'RC-COUNT-2026-08');

-- what it did
DO $report$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT i.name, i.pack_size, i.sales_price, v.on_hand
      FROM rc_resolved c JOIN items i ON i.id = c.item_id
      JOIN v_item_stock v ON v.id = i.id ORDER BY i.name
  LOOP
    RAISE NOTICE '% -- box of %, now % on hand at P% each',
      r.name, r.pack_size, r.on_hand, r.sales_price;
  END LOOP;
END
$report$;

COMMIT;
