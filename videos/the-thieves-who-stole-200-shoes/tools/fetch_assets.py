# Download the Poly Haven CC0 assets for "Why One Banker Mailed Himself an Entire Bank" (1k) into app/public/ph.
# Based on the world starter's fetch_ph.py (browser-like User-Agent; the API answers 403 to Python's default one).
import json, os, sys, urllib.request, concurrent.futures as cf
UA = {'User-Agent': 'Mozilla/5.0 (asset-fetch)'}
OUT = '/home/claude/p10/app/public/ph/'
API = 'https://api.polyhaven.com/files/'
def op(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120)
def get(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        data = op(url).read(); open(path + '.part', 'wb').write(data); os.rename(path + '.part', path)
def model(name, res='1k'):
    f = json.load(op(API + name))['gltf'][res]['gltf']
    base = OUT + f'models/{name}/'
    get(f['url'], base + name + '.gltf')
    for rel, inc in f['include'].items(): get(inc['url'], base + rel)
    return name
def texture(name, res='1k'):
    f = json.load(op(API + name)); got = []
    for key, alias in [('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough'), ('AO', 'ao')]:
        if key in f and res in f[key]:
            j = f[key][res].get('jpg') or f[key][res].get('png')
            get(j['url'], OUT + f'tex/{name}_{alias}.jpg'); got.append(alias)
    return name + ':' + ','.join(got)
def hdri(name, res='1k'):
    f = json.load(op(API + name))['hdri'][res]['hdr']
    get(f['url'], OUT + f'hdri/{name}_{res}.hdr'); return name
MODELS = """vintage_cabinet_01 painted_wooden_cabinet wooden_display_shelves_01 barrel_stove caged_hanging_light Lantern_01
vintage_oil_lamp vintage_grandfather_clock_01 wooden_stool_01 WoodenChair_01 WoodenTable_01 cardboard_box_01 wooden_crate_01
wooden_crate_02 wicker_basket_01 postcard_set_01 stationery_supplies office_notepads hand_truck standing_chalkboard_01
potted_plant_02 wooden_broom mantel_clock_01 Barrel_01 vintage_suitcase vintage_telephone_wall_clock drawer_cabinet
vintage_wooden_drawer_01 decorative_book_set_01 wooden_barrels_01 wine_barrel_01 painted_wooden_bench wooden_ladder
wooden_bucket_01 watering_can_metal_01 cement_bag trowel_01 wooden_hammer_01 sledgehammer_01 planter_box_02 shrub_01 shrub_02
shrub_03 shrub_04 tree_small_02 dead_tree_trunk tree_stump_01 grass_medium_01 grass_medium_02 fern_02 weed_plant_02 rock_07
rock_09 boulder_01 stone_01 mountainside rock_face_01 rock_face_02 namaqualand_cliff_01 namaqualand_boulder_02 pine_tree_01
fir_tree_01 fir_sapling pine_sapling_medium rock_moss_set_01 dead_tree_trunk_02 tree_stump_02 bark_debris_01
modular_wooden_pier wicker_basket_02 wooden_bucket_02 Lantern_01 brass_candleholders""".split()
TEX = """old_wooden_floor_01 wood_floor_worn weathered_plank_siding wood_plank_wall painted_plaster_wall worn_plaster_wall
red_brick_03 brick_wall_02 brown_mud_dry rocky_trail stony_dirt_path gravel_road rock_face rocky_terrain_02 rock_wall_08
roof_planks corrugated_iron red_slate_roof_tiles_01 weathered_planks worn_planks rusty_metal fabric_pattern_05 wood_table_worn
dark_wooden_planks sparse_grass forest_ground_04 wood_peeling_paint_weathered brown_planks_05 rough_wood""".split()
HDRI = ['cowboy_town_hall', 'kloofendal_38d_partly_cloudy']
MODELS2 = '''CashRegister_01 security_camera_01 street_lamp_01 street_lamp_02 modular_electricity_poles trashbag metal_trash_can
steel_frame_shelves_01 steel_frame_shelves_02 tool_cart metal_tool_chest old_tyre metal_jerrycan plastic_crate_01 lightbulb_01
pull_chain_light_socket hanging_industrial_lamp modern_ceiling_lamp_01 covered_car utility_box_01 potted_plant_01 potted_plant_04
plastic_monobloc_chair_01 metal_stool_01 cardboard_box_01 mounted_fluorescent_lights industrial_wall_lamp planter_pot_clay
bench_vice_01 portable_generator'''.split()
TEX2 = '''floor_tiles_06 large_floor_tiles_02 concrete_floor_worn_001 asphalt_02 concrete_pavement yellow_plaster blue_plaster_weathered
painted_metal_shutter rusty_corrugated_iron worn_corrugated_iron concrete_wall_008 white_plaster_rough_01 grey_plaster cracked_concrete'''.split()
if len(sys.argv) > 1 and sys.argv[1] == '2': MODELS, TEX, HDRI = MODELS2, TEX2, ['cowboy_town_hall']
if __name__ == '__main__':
    jobs = [(model, m) for m in dict.fromkeys(MODELS)] + [(texture, t) for t in TEX] + [(hdri, h) for h in HDRI]
    with cf.ThreadPoolExecutor(6) as ex:
        futs = {ex.submit(fn, a): a for fn, a in jobs}
        for fu in cf.as_completed(futs):
            try: print('ok', fu.result(), flush=True)
            except Exception as e: print('FAIL', futs[fu], e, flush=True)
