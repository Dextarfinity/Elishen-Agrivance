"""
Import the nine URC Sales Order PDFs (24 unique SOs, 05/07–07/30/2026) as purchases.
- Every line lands as a purchases row (status Received on the SO date), incl. FREE-GOODS
  lines at unit_cost 0 (deal quantities count into inventory).
- unit_cost = SO unit price x (grand_total / gross line sum) so each SO's spend matches
  the printed grand total (discounts allocated pro-rata; VAT included where charged).
- Cat litter SO lines are 10L x 3PC bundles; DB tracks 10L pieces -> qty x3, price /3.
- SOs dated before the 7/29/2026 stock take get NEGATIVE PRE-STOCKTAKE-OFFSET
  manual_inventory batches (the count already includes that stock). The three 07/30
  SOs genuinely add stock (+132 units expected).
- "June 13 PO.pdf" and "July 13.pdf" contain the SAME two SOs (1890269585/-582):
  imported once, keyed by SO number. Duplicate-guarded per (ref_id, item, qty).
Generates po.sql.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "po.sql")
STOCKTAKE = "2026-07-29"

# product code -> DB item name  (mult = SO-unit to DB-unit factor)
MAP = {
    "873340": "Supremo Infinity 1 - Chick Booster Crumble (50KG)",
    "873350": "Supremo Infinity 2 - Chick Grower Crumble (50KG)",
    "873353": "Supremo Infinity 2.1 - Developer - 3 Grains (50KG)",
    "873360": "Supremo Infinity 3 - Maintenance Pellets - 15% CP (50KG)",
    "873380": "Supremo Infinity 4 - Breeder Pellets (50KG)",
    "872530": "Supremo Infinity Ready Mix - Grains + Pellets (RED) (50kg)",
    "872300": "Supremo Infinity Ready Mix - Grains + Pellets (RED) (25x1kg)",
    "872302": "Supremo Infinity Ready Mix red (25x1kg)",
    "873761": "Supremo Infinity 1 Booster (25x1kg)",
    "871130": "Supremo Infinity 2 Grower (25x1kg)",
    "871140": "Supremo Infinity 2.1 Developer + (25x1kg)",
    "871150": "Supremo Infinity 4 Breeder (25x1kg)",
    "873580": "Supremo Infinity 23 Conditioning (25x1kg)",
    "872430": "Supremo Infinity 32 Pellets - 32% CP (25x1kg)",
    "873510": "Supremo Infinity Power Concentrate (25KG)",
    "873520": "Supremo Infinity Super Conditioner (25KG)",
    "878140": "Topbreed Dog Adult (20KG)",
    "878160": "Topbreed Dog Puppy (20KG)",
    "878590": "Topbreed Dog Adult (5KG)",
    "879010": "Topbreed Dog Adult Mini (20KG)",
    "879013": "Topbreed Dog Adult Mini (5KG)",
    "878960": "Topbreed Cat Adult (20KG)",
    "878970": "Topbreed Cat Adult (5KG)",
    "821788": "Top Care CAT LITTER Lavander (10L)",
    "821792": "Top Care CAT LITTER Coffee (10L)",
    "826040": "Coccibuster",
    "826060": "Levomax",
    "825770": "Spectrum (96/box)",
    "825780": "Spectrum Plus (96/box)",
    "821200": "Robistrep Vk 5Gm",
    "826100": "Wormbuster Single Dose 5Gm",
    "820190": "Robi L.A inj 100ml",
    "820220": "Robipenstrep P 10dose/Diluent",
    "820210": "Robipenstrep P Single dose bt",
    "825240": "Iron - D inj",
    "820180": "Robicomject inj 100ml",
    "821780": "Tripulac Pig Doser 2x1 set",
    "825340": "Wheatgerm 300Gm x 12/box",
    "821782": "Top B+ Vitamins 60ml",
    "821783": "Top B+ Vitamins 120ml",
    "826130": "Shampooch 300ml bt 12/box",
    "827040": "Shampooch Sachet",
    "874730": "UNO+ Booster (25x1kg)",
    "876840": "UNO+ Pre Starter (25KG)",
    "874710": "UNO+ Starter (50KG)",
    "874700": "UNO+ Grower (50KG)",
    "874690": "UNO+ Finisher (50KG)",
    "874720": "UNO+ Breeder (50KG)",
    "874860": "UNO+ Lactating (50KG)",
    "874770": "UNO+ Supreme Lactating (50KG)",
    "874620": "Stargain Breeder (50KG)",
    "874670": "Stargain Starter (50KG)",
    "874650": "Stargain Grower (50KG)",
    "874660": "Stargain Lactating (50KG)",
}
MULT = {"821788": 3, "821792": 3}   # 10L x 3PC bundle -> 3 pieces

# (so_no, date, grand_total, [(code, qty, unit_price), ...])  price 0 = free goods
SOS = [
    ("1890258188", "2026-05-07", 339525.24, [
        ("873340", 10, 2290), ("873350", 20, 2040), ("873353", 45, 2020),
        ("873360", 40, 1750), ("873380", 10, 2110), ("872530", 20, 1960),
        ("872300", 10, 1000), ("873761", 10, 1217), ("871130", 10, 1110),
        ("871140", 20, 1080), ("871150", 5, 1135), ("872302", 20, 1050),
        ("873580", 10, 1355), ("872430", 5, 1380), ("873510", 10, 1055),
        ("873520", 10, 1095)]),
    ("1890258194", "2026-05-07", 381178.31, [
        ("878160", 30, 1695), ("878140", 100, 1435), ("879010", 40, 1488),
        ("879013", 40, 381.50), ("878960", 50, 2049.51), ("878970", 40, 525.87),
        ("878590", 40, 371.50)]),
    ("1890258199", "2026-05-07", 256500.00, [
        ("874730", 10, 2315), ("876840", 10, 1455), ("874710", 20, 1960),
        ("874700", 40, 1800), ("874690", 20, 1770), ("874720", 20, 1755),
        ("874860", 20, 1885), ("874620", 20, 1695)]),
    ("1890258170", "2026-05-07", 81715.20, [
        ("821788", 100, 555), ("821792", 60, 555)]),
    ("1890258172", "2026-05-07", 17031.17, [
        ("826040", 600, 21), ("826040", 120, 0),
        ("826060", 600, 23), ("826060", 120, 0)]),
    ("1890258173", "2026-05-07", 213470.21, [
        ("825770", 1600, 22), ("825770", 320, 0),
        ("825780", 1600, 34), ("825780", 320, 0),
        ("821200", 1600, 22), ("821200", 320, 0),
        ("826100", 600, 12), ("826100", 120, 0),
        ("820190", 100, 436), ("820190", 20, 0),
        ("820220", 100, 122), ("820220", 20, 0),
        ("820210", 400, 44), ("820210", 80, 0),
        ("825240", 100, 473), ("825240", 20, 0),
        ("820180", 100, 397), ("820180", 20, 0),
        ("821780", 100, 385), ("821780", 20, 0)]),
    ("1890258174", "2026-05-07", 8433.62, [("825340", 10, 1050)]),
    ("1890258175", "2026-05-07", 84907.20, [
        ("821782", 20, 3305), ("821783", 20, 2475)]),
    ("1890258177", "2026-05-07", 48784.40, [
        ("826130", 10, 2160), ("827040", 10, 3985)]),
    ("1890260922", "2026-05-21", 821579.00, [
        ("874730", 6, 2340), ("876840", 10, 1480), ("874710", 60, 2010),
        ("874700", 200, 1850), ("874690", 30, 1820), ("874620", 150, 1745),
        ("874770", 50, 1975)]),
    ("1890260924", "2026-05-21", 32851.00, [
        ("873340", 2, 2340), ("873350", 4, 2090), ("873360", 8, 1800),
        ("873353", 3, 2070), ("872530", 3, 2010)]),
    ("1890260925", "2026-05-21", 38061.99, [
        ("878140", 15, 1455), ("878160", 5, 1705), ("878960", 5, 2069.51)]),
    ("1890261898", "2026-05-26", 473717.50, [
        ("876840", 40, 1480), ("874710", 30, 2010), ("874700", 70, 1850),
        ("874690", 10, 1820), ("874770", 20, 1975), ("874670", 30, 1905),
        ("874650", 50, 1735), ("874620", 50, 1745)]),
    ("1890261900", "2026-05-26", 67782.50, [
        ("873340", 5, 2340), ("873350", 5, 2090), ("873353", 20, 2070),
        ("873360", 10, 1800)]),
    ("1890267274", "2026-06-29", 324125.74, [
        ("873340", 50, 2340), ("873350", 50, 2090), ("873360", 15, 1800),
        ("872530", 10, 2010), ("872300", 20, 1025), ("873761", 5, 1242),
        ("871130", 5, 1135), ("873580", 30, 1380), ("872430", 30, 1405)]),
    ("1890267277", "2026-06-29", 90293.71, [
        ("878160", 20, 1705), ("878140", 20, 1455), ("879010", 20, 1508),
        ("878590", 5, 376.50), ("879013", 5, 386.50)]),
    ("1890267279", "2026-06-29", 456807.50, [
        ("874710", 80, 2010), ("874700", 80, 1850), ("874690", 10, 1820),
        ("874720", 10, 1805), ("874860", 80, 1935), ("874660", 10, 1880)]),
    ("1890267283", "2026-06-29", 40857.60, [
        ("821788", 40, 555), ("821788", 4, 0),
        ("821792", 40, 555), ("821792", 4, 0)]),
    ("1890269585", "2026-07-13", 137156.25, [
        ("873350", 45, 2090), ("873360", 40, 1800)]),
    ("1890269582", "2026-07-13", 165062.50, [
        ("874620", 50, 1745), ("874710", 50, 2010)]),
    ("1890271973", "2026-07-24", 59102.42, [
        ("878590", 130, 376.50), ("878970", 20, 530.87), ("879013", 10, 386.50)]),
    ("1890273013", "2026-07-30", 20931.35, [
        ("873761", 4, 1242), ("871140", 6, 1105), ("871150", 4, 1160),
        ("872302", 8, 1075)]),
    ("1890273015", "2026-07-30", 93387.49, [
        ("878140", 40, 1455), ("878960", 20, 2069.51)]),
    ("1890273017", "2026-07-30", 66975.00, [("876840", 50, 1480)]),
]

def esc(s): return s.replace("'", "''")

sql = ["BEGIN;",
       "INSERT INTO vendors (name, address, notes) SELECT 'Universal Robina Corporation', "
       "'Tera Tower Bridgetowne, E. Rodriguez Jr. Avenue (C5 Road), Ugong Norte, Quezon City', "
       "'URC / Robina Agri Partners — feeds, RobiChem, pet food supplier' "
       "WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'Universal Robina Corporation');"]

grand_all, offsets = 0.0, {}
for so, date, total, lines in SOS:
    gross = sum(q * p for _, q, p in lines)
    ratio = total / gross
    check = 0.0
    for code, qty, price in lines:
        item = MAP[code]
        mult = MULT.get(code, 1)
        dqty = qty * mult
        cost = round(price * ratio / mult, 2)
        check += cost * dqty
        free = " FREE GOODS (deal)" if price == 0 else ""
        conv = f" ({qty} x {mult}-pc bundle)" if mult > 1 else ""
        sql.append(
            "INSERT INTO purchases (order_date, received_date, ref_id, item_id, purchase_qty, "
            "received_qty, unit_cost, status, vendor_id, notes) "
            f"SELECT '{date}', '{date}', 'SO {so}', i.id, {dqty}, {dqty}, {cost}, 'Received', "
            f"(SELECT id FROM vendors WHERE name = 'Universal Robina Corporation'), "
            f"'URC Sales Order {so}{free}{conv}; SO gross {price}/unit, net cost after SO discounts' "
            f"FROM items i WHERE i.name = '{esc(item)}' "
            f"AND NOT EXISTS (SELECT 1 FROM purchases e WHERE e.ref_id = 'SO {so}' "
            f"AND e.item_id = i.id AND e.purchase_qty = {dqty});")
        if date < STOCKTAKE:
            offsets[(item, so)] = offsets.get((item, so), 0) + dqty
    grand_all += total
    drift = check - total
    # unit_cost is numeric(14,2): sachet-level costs round to centavos, so piece-heavy
    # SOs drift a few pesos vs the printed total. Abort only past 0.1% (a real misread).
    if abs(drift) > max(2, total * 0.001):
        raise SystemExit(f"SO {so}: allocated {check:,.2f} vs total {total:,.2f}")
    if abs(drift) > 0.02:
        print(f"  note: SO {so} rounding drift {drift:+.2f} vs printed total {total:,.2f}")

# negative offsets: the 7/29 physical count already contains pre-stocktake PO stock
for (item, so), q in sorted(offsets.items()):
    sql.append(
        "INSERT INTO manual_inventory (date, batch_no, item_id, qty, notes) "
        f"SELECT '{STOCKTAKE}', 'PRE-STOCKTAKE-OFFSET', i.id, {-q}, "
        f"'Offset for PO SO {so}: stock received before the 7/29 physical count' "
        f"FROM items i WHERE i.name = '{esc(item)}' "
        f"AND EXISTS (SELECT 1 FROM purchases WHERE ref_id = 'SO {so}') "
        f"AND NOT EXISTS (SELECT 1 FROM manual_inventory e WHERE e.item_id = i.id "
        f"AND e.notes LIKE 'Offset for PO SO {so}%');")

sql += ["COMMIT;",
        "SELECT 'PO rows: '||COUNT(*)||' | spend: '||TO_CHAR(SUM(received_qty*unit_cost),'FM999,999,999.00') FROM purchases WHERE ref_id LIKE 'SO 1890%';",
        "SELECT 'PO offsets: '||COUNT(*)||' | qty: '||SUM(qty) FROM manual_inventory WHERE notes LIKE 'Offset for PO SO%';"]

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(sql))
print(f"{len(SOS)} SOs, grand total {grand_all:,.2f} -> wrote {OUT}")
