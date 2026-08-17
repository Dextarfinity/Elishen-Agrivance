-- ============================================================
-- Elishen Agrivance — per-bag discount check
--
-- The rates the shop agreed on:
--   Hogs & Supremo Infinity   50kg           COD 100 / Term  80
--                             25kg, 25x1kg   COD  50 / Term  40
--   Topbreed                  20kg           COD 120 / Term 100
--                             5kg            COD  25 / Term  20
--   Topbreed Dog Adult (20KG) is the exception: no discount either way,
--   held at P1,430 to match competitors' shelf price.
--
-- The backend seeds these on startup, but only onto items still sitting at
-- zero — so a figure typed into Inventory is never overwritten, and equally
-- a WRONG figure is never corrected. Run this after catalogue changes:
--   psql -U postgres -d bookkeeping -f db\check_discounts.sql
-- It prints a per-rule tally, then every row that disagrees with the rules
-- (no rows in the second table means everything is correct).
-- ============================================================
-- A temporary view so both reports below can share one classification. It lives
-- only for this psql session and touches nothing in the database itself.
CREATE TEMP VIEW _disc_check AS
WITH classed AS (
  SELECT i.id, i.name, i.category, i.sales_price, i.cod_discount, i.term_discount,
    UPPER(TRIM(i.name)) = 'TOPBREED DOG ADULT (20KG)' AS is_exception,
    CASE
      WHEN i.category ILIKE '%treat%' OR i.category ILIKE '%suppl%' THEN NULL
      WHEN i.category ILIKE '%hog%' OR i.category ILIKE '%game%fowl%'
        OR i.name ILIKE '%supremo infinity%' OR i.name ILIKE '%uno+%'
        OR i.name ILIKE '%stargain%' THEN 'hogfeed'
      WHEN i.name ILIKE 'topbreed%' THEN 'topbreed'
    END AS kind,
    CASE
      WHEN i.name ILIKE '%50kg%' THEN 50
      WHEN i.name ILIKE '%25kg%' OR i.name ILIKE '%25x1kg%' THEN 25
      -- 2kgx10 is 20kg of feed, the same as a 20kg sack
      WHEN i.name ILIKE '%20kg%' OR i.name ILIKE '%2kgx10%' THEN 20
      WHEN i.name ILIKE '%5kg%' THEN 5
    END AS size
  FROM items i
),
expected AS (
  SELECT c.*,
    CASE WHEN c.is_exception THEN 0
         WHEN c.kind = 'hogfeed'  AND c.size = 50 THEN 100
         WHEN c.kind = 'hogfeed'  AND c.size = 25 THEN 50
         WHEN c.kind = 'topbreed' AND c.size = 20 THEN 120
         WHEN c.kind = 'topbreed' AND c.size = 5  THEN 25
    END AS exp_cod,
    CASE WHEN c.is_exception THEN 0
         WHEN c.kind = 'hogfeed'  AND c.size = 50 THEN 80
         WHEN c.kind = 'hogfeed'  AND c.size = 25 THEN 40
         WHEN c.kind = 'topbreed' AND c.size = 20 THEN 100
         WHEN c.kind = 'topbreed' AND c.size = 5  THEN 20
    END AS exp_term
  FROM classed c
)
SELECT * FROM expected;

\echo '=== what is rated now (should match the rates above) ==='
SELECT CASE WHEN kind = 'topbreed' THEN 'Topbreed' ELSE 'Hogs / Infinity' END AS brand,
       CASE size WHEN 50 THEN '50kg' WHEN 25 THEN '25kg / 25x1kg'
                 WHEN 20 THEN '20kg' WHEN 5 THEN '5kg' END AS pack,
       cod_discount AS cod, term_discount AS term, count(*) AS items
FROM _disc_check
WHERE cod_discount > 0 OR term_discount > 0
GROUP BY 1, 2, 3, 4 ORDER BY 1, 3 DESC;

\echo '=== rows that DISAGREE with the rules (no rows = all correct) ==='
SELECT
  CASE
    WHEN is_exception THEN 'EXCEPTION-WRONG'   -- TB Dog Adult 20KG must be 1430 with no discount
    WHEN exp_cod IS NOT NULL THEN 'WRONG-RATE' -- a feed carrying the wrong figure
    WHEN kind IS NOT NULL AND size IS NULL THEN 'FEED-NO-SIZE'  -- sack size unreadable from the name
    ELSE 'UNEXPECTED-RATE'                     -- something discounted that should not be
  END AS problem,
  name, category, sales_price, cod_discount AS cod, term_discount AS term,
  exp_cod AS should_be_cod, exp_term AS should_be_term
FROM _disc_check
WHERE (is_exception AND (cod_discount <> 0 OR term_discount <> 0 OR sales_price <> 1430))
   OR (NOT is_exception AND exp_cod IS NOT NULL
       AND (cod_discount <> exp_cod OR term_discount <> exp_term))
   OR (exp_cod IS NULL AND NOT is_exception AND (cod_discount <> 0 OR term_discount <> 0))
   OR (kind IS NOT NULL AND size IS NULL)
ORDER BY problem, name;
