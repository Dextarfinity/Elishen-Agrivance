"""
URC net Capital.xlsx -> pricing migration.
Maps each product's NET PRICE / Capital (true landed cost), SRP where missing,
bonus deals and sell-side discount tiers, plus the full discount breakdown JSON.
Generates pricing_update.sql; apply with psql.
"""
import json, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pricing_update.sql")

def bd(**kw):
    return json.dumps(kw).replace("'", "''")

# (db_item_name, capital, srp_or_None, deal, outright, cod, breakdown)
ROWS = [
    # ---- GameFowl 50KG: ex-plant -200 -30 -10 -15, then -5% PBD ----
    ("Supremo Infinity 1 - Chick Booster Crumble (50KG)", 1980.75, None, None, 0, 0,
     bd(ex_plant=2340, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    ("Supremo Infinity 2 - Chick Grower Crumble (50KG)", 1743.25, None, None, 0, 0,
     bd(ex_plant=2090, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    ("Supremo Infinity 2.1 - Developer - 3 Grains (50KG)", 1724.25, None, None, 0, 0,
     bd(ex_plant=2070, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    ("Supremo Infinity 3 - Maintenance Pellets - 15% CP (50KG)", 1467.75, None, None, 0, 0,
     bd(ex_plant=1800, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    ("Supremo Infinity 3 - Maintenance Pellets - 15% CP w/ Grain (50KG)", 1885.75, None, None, 0, 0,
     bd(ex_plant=2240, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    ("Supremo Infinity 4 - Breeder Pellets (50KG)", 1809.75, None, None, 0, 0,
     bd(ex_plant=2160, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    ("Supremo Infinity Ready Mix - Grains + Pellets (RED) (50kg)", 1667.25, None, None, 0, 0,
     bd(ex_plant=2010, discounts={"distributor":200,"pickup":30,"bdf":10,"manpower":15}, pbd_rate=0.05, vat="none", distributor_income=80, fth=70)),
    # ---- GameFowl 25x1kg / 25KG: -100 -15 -5 -7.5, then -5% PBD ----
    ("Supremo Infinity Ready Mix - Grains + Pellets (RED) (25x1kg)", 852.625, None, None, 0, 0,
     bd(ex_plant=1025, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity 1 Booster (25x1kg)", 1058.775, None, None, 0, 0,
     bd(ex_plant=1242, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity 2 Grower (25x1kg)", 957.125, None, None, 0, 0,
     bd(ex_plant=1135, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity 2.1 Developer + (25x1kg)", 928.625, None, None, 0, 0,
     bd(ex_plant=1105, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity 4 Breeder (25x1kg)", 980.875, None, None, 0, 0,
     bd(ex_plant=1160, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity Ready Mix red (25x1kg)", 900.125, None, None, 0, 0,
     bd(ex_plant=1075, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity 23 Conditioning (25x1kg)", 1189.875, None, None, 0, 0,
     bd(ex_plant=1380, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity 32 Pellets - 32% CP (25x1kg)", 1213.625, None, None, 0, 0,
     bd(ex_plant=1405, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35, note="Fortifier 32 in matrix")),
    ("Supremo Infinity Power Concentrate (25KG)", 904.875, None, None, 0, 0,
     bd(ex_plant=1080, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    ("Supremo Infinity Super Conditioner (25KG)", 942.875, None, None, 0, 0,
     bd(ex_plant=1120, discounts={"distributor":100,"pickup":15,"bdf":5,"manpower":7.5}, pbd_rate=0.05, vat="none", fth=35)),
    # ---- Hogs: Supreme lines ----
    ("UNO+ Booster (25x1kg)", 2156.50, None, None, 0, 0,
     bd(ex_plant=2340, discounts={"distributor":40,"pickup":15,"bdf":5,"manpower":10}, pbd_rate=0.05, vat="none", distributor_income=50)),
    ("UNO+ Supreme Pre Starter Crumble (25KG)", 1415.50, None, None, 0, 0,
     bd(ex_plant=1630, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=50)),
    ("UNO+ Supreme Starter Pellet (50KG)", 1876.25, None, None, 0, 0,
     bd(ex_plant=2115, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Supreme Grower (50KG)", 1828.75, None, None, 0, 0,
     bd(ex_plant=2065, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Supreme Finisher (50KG)", 1729.00, None, None, 0, 0,
     bd(ex_plant=1960, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Supreme Breeder (50KG)", 1619.75, None, None, 0, 0,
     bd(ex_plant=1845, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Supreme Lactating (50KG)", 1743.25, None, None, 0, 0,
     bd(ex_plant=1975, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    # ---- Hogs: Premium lines ----
    ("UNO+ Pre Starter (25KG)", 1339.50, None, None, 0, 0,
     bd(ex_plant=1480, discounts={"distributor":40,"pickup":15,"bdf":5,"manpower":10}, pbd_rate=0.05, vat="none", distributor_income=40)),
    ("UNO+ Starter (50KG)", 1776.50, None, None, 0, 0,
     bd(ex_plant=2010, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Grower (50KG)", 1624.50, None, None, 0, 0,
     bd(ex_plant=1850, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Finisher (50KG)", 1596.00, None, None, 0, 0,
     bd(ex_plant=1820, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Breeder (50KG)", 1581.75, None, None, 0, 0,
     bd(ex_plant=1805, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("UNO+ Lactating (50KG)", 1705.25, None, None, 0, 0,
     bd(ex_plant=1935, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    # ---- Hogs: Stargain (corrected rows) ----
    ("Stargain Starter (50KG)", 1676.75, None, None, 0, 0,
     bd(ex_plant=1905, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("Stargain Grower (50KG)", 1515.25, None, None, 0, 0,
     bd(ex_plant=1735, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("Stargain Finisher (50KG)", 1472.50, None, None, 0, 0,
     bd(ex_plant=1690, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("Stargain Breeder (50KG)", 1524.75, None, None, 0, 0,
     bd(ex_plant=1745, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    ("Stargain Lactating (50KG)", 1653.00, None, None, 0, 0,
     bd(ex_plant=1880, discounts={"distributor":80,"pickup":30,"bdf":10,"manpower":20}, pbd_rate=0.05, vat="none", distributor_income=80)),
    # ---- Pets (Topbreed): capital is VAT-inclusive (H - PBD + 12% VAT) ----
    ("Topbreed Dog Puppy (20KG)", 1615.15, None, None, 0, 0,
     bd(ex_plant=1715, discounts={"od":80,"pickup":25,"bdf":4,"manpower":8,"special":80}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Dog Adult (20KG)", 1338.51, None, None, 0, 0,
     bd(ex_plant=1455, discounts={"od":80,"pickup":25,"bdf":4,"manpower":8,"special":80}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Dog Adult Mini (20KG)", 1394.90, None, None, 0, 0,
     bd(ex_plant=1508, discounts={"od":80,"pickup":25,"bdf":4,"manpower":8,"special":80}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Cat Adult (20KG)", 1992.35, None, None, 0, 0,
     bd(ex_plant=2069.51, discounts={"od":80,"pickup":25,"bdf":4,"manpower":8,"special":80}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Dog Adult (5KG)", 348.19, None, None, 0, 0,
     bd(ex_plant=376.5, discounts={"od":20,"pickup":6.25,"bdf":1,"manpower":2,"special":20}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Dog Adult Mini (5KG)", 358.83, None, None, 0, 0,
     bd(ex_plant=386.5, discounts={"od":20,"pickup":6.25,"bdf":1,"manpower":2,"special":20}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Cat Adult (5KG)", 512.44, None, None, 0, 0,
     bd(ex_plant=530.87, discounts={"od":20,"pickup":6.25,"bdf":1,"manpower":2,"special":20}, pbd_rate=0.05, vat="add_12")),
    ("Topbreed Dog Puppy 2kgx10", 1806.67, None, None, 0, 0,
     bd(ex_plant=1895, discounts={"od":80,"pickup":25,"bdf":4,"manpower":8,"special":80}, pbd_rate=0.05, vat="add_12")),
    # ---- Cat litter: matrix capital 510.72 per 3-pack; singles = /3 (assumption) ----
    ("Top Care CAT LITTER (10Lx3)", 510.72, None, None, 0, 0,
     bd(source="price matrix Cat Litter row", vat="included")),
    ("Top Care CAT LITTER per PIECE (10L)", 170.24, None, None, 0, 0,
     bd(derived="510.72 / 3", vat="included")),
    ("Top Care CAT LITTER Lavander (10L)", 170.24, None, None, 0, 0,
     bd(derived="510.72 / 3", vat="included")),
    ("Top Care CAT LITTER Coffee (10L)", 170.24, None, None, 0, 0,
     bd(derived="510.72 / 3", vat="included")),
    # ---- RobiChem: invoice x0.8 x0.9 x0.8, +12% VAT = capital; SRP = capital x1.4;
    #      sell tiers: Outright -15% of SRP, COD -5% after outright; bonus deals ----
    ("Coccibuster", 13.55, 18.97, "10 + 2", 0.15, 0.05,
     bd(invoice=21, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Levomax", 14.84, 20.77, "10 + 2", 0.15, 0.05,
     bd(invoice=23, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Spectrum (96/box)", 14.19, 19.87, "10 + 2", 0.15, 0.05,
     bd(invoice=22, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4, note="5g sachet pricing (verify box vs sachet)")),
    ("Spectrum Plus (96/box)", 21.93, 30.71, "10 + 2", 0.15, 0.05,
     bd(invoice=34, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4, note="5g sachet pricing (verify box vs sachet)")),
    ("Robistrep Vk 5Gm", 14.19, 19.87, "10 + 2", 0.15, 0.05,
     bd(invoice=22, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Wormbuster Single Dose 5Gm", 7.74, 10.84, "10 + 2", 0.15, 0.05,
     bd(invoice=12, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Robi L.A inj 100ml", 281.27, 393.78, "10 + 2", 0.15, 0.05,
     bd(invoice=436, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Robipenstrep P 10dose/Diluent", 78.70, 110.19, "10 + 2", 0.15, 0.05,
     bd(invoice=122, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Robipenstrep P Single dose bt", 28.39, 39.74, "10 + 2", 0.15, 0.05,
     bd(invoice=44, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Iron - D inj", 305.14, 427.20, "10 + 2", 0.15, 0.05,
     bd(invoice=473, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Robicomject inj 100ml", 256.11, 358.56, "10 + 2", 0.15, 0.05,
     bd(invoice=397, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Tripulac Pig Doser 2x1 set", 248.37, 347.72, "10 + 2", 0.15, 0.05,
     bd(invoice=385, less=[0.2,0.1,0.2], vat="add_12", srp_markup=1.4)),
    ("Wheatgerm 300Gm x 12/box", 710.20, 994.28, None, 0.15, 0.05,
     bd(invoice=1050, less=["10%","5%","20%","pickup 10"], vat="none", srp_markup=1.4)),
]

sql = ["BEGIN;",
"""ALTER TABLE items
  ADD COLUMN IF NOT EXISTS deal text,
  ADD COLUMN IF NOT EXISTS outright_rate numeric(6,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_rate numeric(6,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_breakdown jsonb;"""]

matched_check = []
for name, capital, srp, deal, outright, cod, breakdown in ROWS:
    n = name.replace("'", "''")
    set_srp = f", sales_price = {srp}" if srp is not None else ""
    set_deal = f", deal = '{deal}'" if deal else ""
    sql.append(
        f"UPDATE items SET cost = {capital}{set_srp}{set_deal}, "
        f"outright_rate = {outright}, cod_rate = {cod}, "
        f"price_breakdown = '{breakdown}'::jsonb WHERE name = '{n}';")
    matched_check.append(n)

# report any names that did not match an item
names_list = ",".join(f"('{n}')" for n in matched_check)
sql.append(f"""SELECT v.name AS unmatched FROM (VALUES {names_list}) v(name)
LEFT JOIN items i ON i.name = v.name WHERE i.id IS NULL;""")
sql.append("COMMIT;")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(sql))
print(f"wrote {OUT} with {len(ROWS)} item updates")
