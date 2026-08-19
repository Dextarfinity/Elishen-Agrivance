-- ============================================================
-- Corrections to db/po_backfill_2026.sql
--
-- Run this AFTER that file, on any database it was applied to. Safe to re-run:
-- both fixes test for the state they are correcting before touching anything.
-- ============================================================
BEGIN;

-- 1. Cat litter booked as 3-PACKS instead of pieces.
--    SO 1890267682 books "Topcare Cat Litter Lavender 10L X 3 PC" as 60 units at
--    P510.72. Every other purchase of that item -- SO 1890258170 and
--    SO 1890267283 -- books it at P170.24 a single 10L piece, which is also what
--    its P190 selling price assumes. The money was right; the count was a third
--    of the truth. x3 the quantity, /3 the cost, so line value is unchanged.
UPDATE purchases p SET
  purchase_qty = p.purchase_qty * 3,
  received_qty = p.received_qty * 3,
  unit_cost    = ROUND(p.unit_cost / 3, 2),
  notes        = p.notes || '; booked as 3-packs on the SO, converted to pieces'
FROM items i
WHERE i.id = p.item_id
  AND p.ref_id = 'SO 1890267682'
  AND i.name ILIKE '%LITTER%'
  AND p.unit_cost > 500;            -- only the un-converted 3-pack lines

-- 2. Treats priced per piece when they are stocked per case.
--    SO 1890274641 books Gravy Chunks at P1,130.98 a BOX, Creamy Treats at
--    P2,849.88 a CARTON and TopTreats at P2,099.12 a CASE -- so the catalogue's
--    case-level selling prices are the correct ones, and the pricelist's
--    "Dealers Acq." column is what a DEALER pays (Elishen's selling price),
--    not Elishen's cost. Pricing them per piece left a P1,131 box sellable
--    for P27. Restore the case prices and fill in the real cost, which sat
--    at 0.00 and so counted these as pure profit.
UPDATE items SET sales_price = 3648, cost = 2849.88, uom = 'carton'
  WHERE name ILIKE '%Creamy Treats%' AND sales_price <> 3648;
UPDATE items SET sales_price = 2856, cost = 2099.12, uom = 'case'
  WHERE name ILIKE '%TopTreats%'     AND sales_price <> 2856;
UPDATE items SET sales_price = 1275, cost = 1130.98, uom = 'box'
  WHERE name ILIKE '%Gravy Chunks%'  AND sales_price <> 1275;

COMMIT;
