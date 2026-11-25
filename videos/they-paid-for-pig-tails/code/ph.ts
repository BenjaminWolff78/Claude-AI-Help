// v26 (2026-11-23): REAL CC0 ASSETS from Poly Haven (master prompt v26 section 6.4): glTF models, 1k PBR photo
// textures and HDRIs, served from public/ph (fetched by tools/fetch_assets.py). Everything is loaded once before the
// first frame (loadKit waits for PH_READY); sets then clone models with phModel() and build materials with phMat().
// Gotchas from the world starter README: many models hold two versions side by side (filter root nodes by name and
// recentre), clone per copy, the HDRI is for light and reflections only (scene.environment ~0.5), not the sky.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { staticFile } from "remotion";

export const PH_MODELS = [
  "vintage_cabinet_01", "painted_wooden_cabinet", "wooden_display_shelves_01", "barrel_stove", "caged_hanging_light", "Lantern_01",
  "vintage_oil_lamp", "vintage_grandfather_clock_01", "wooden_stool_01", "WoodenChair_01", "WoodenTable_01", "wooden_crate_01",
  "wooden_crate_02", "wicker_basket_01", "postcard_set_01", "stationery_supplies", "hand_truck", "standing_chalkboard_01",
  "potted_plant_02", "wooden_broom", "mantel_clock_01", "Barrel_01", "vintage_suitcase", "vintage_telephone_wall_clock",
  "drawer_cabinet", "vintage_wooden_drawer_01", "wooden_barrels_01", "wine_barrel_01", "painted_wooden_bench", "wooden_ladder",
  "wooden_bucket_01", "wooden_bucket_02", "watering_can_metal_01", "cement_bag", "trowel_01", "wooden_hammer_01", "sledgehammer_01",
  "planter_box_02", "shrub_02", "shrub_03", "shrub_04", "dead_tree_trunk", "tree_stump_01", "grass_medium_01", "grass_medium_02",
  "fern_02", "weed_plant_02", "rock_07", "rock_09", "boulder_01", "stone_01", "mountainside", "rock_face_01", "rock_face_02",
  "namaqualand_cliff_01", "namaqualand_boulder_02", "rock_moss_set_01", "dead_tree_trunk_02", "tree_stump_02", "wicker_basket_02",
  "brass_candleholders", "office_notepads",
  // the shoe shop + the garage (2026-11-23)
  "CashRegister_01", "security_camera_01", "street_lamp_01", "street_lamp_02", "modular_electricity_poles", "trashbag", "metal_trash_can",
  "steel_frame_shelves_01", "steel_frame_shelves_02", "tool_cart", "metal_tool_chest", "old_tyre", "metal_jerrycan", "plastic_crate_01",
  "lightbulb_01", "pull_chain_light_socket", "hanging_industrial_lamp", "modern_ceiling_lamp_01", "covered_car", "utility_box_01",
  "potted_plant_04", "plastic_monobloc_chair_01", "metal_stool_01", "cardboard_box_01", "mounted_fluorescent_lights", "industrial_wall_lamp",
  "planter_pot_clay", "bench_vice_01", "portable_generator",
  // the bounty shed + the woods (2026-11-25): trees thinned by tools/decimate_tree.py (twig / leaf clusters kept 1.5-20%)
  "pine_bare", "oak_lite", "island_lite", "dandelion_01", "nettle_plant", "grass_bermuda_01", "rubber_boots",
  "wooden_picnic_table", "rusted_spade_01", "gate_latch_01", "modified_thermos", "compost_bags", "root_cluster_01", "periwinkle_plant",
  "wooden_lantern_01", "flower_gazania",
] as const;
export type PhModel = (typeof PH_MODELS)[number];
export const PH_TEX = [
  "old_wooden_floor_01", "wood_floor_worn", "weathered_plank_siding", "wood_plank_wall", "painted_plaster_wall", "worn_plaster_wall",
  "red_brick_03", "brick_wall_02", "brown_mud_dry", "rocky_trail", "stony_dirt_path", "gravel_road", "rock_face", "rocky_terrain_02",
  "rock_wall_08", "roof_planks", "corrugated_iron", "red_slate_roof_tiles_01", "weathered_planks", "worn_planks", "rusty_metal",
  "fabric_pattern_05", "wood_table_worn", "dark_wooden_planks", "sparse_grass", "forest_ground_04", "wood_peeling_paint_weathered",
  "brown_planks_05", "rough_wood",
  "floor_tiles_06", "large_floor_tiles_02", "concrete_floor_worn_001", "asphalt_02", "concrete_pavement", "yellow_plaster", "blue_plaster_weathered",
  "painted_metal_shutter", "rusty_corrugated_iron", "worn_corrugated_iron", "concrete_wall_008", "white_plaster_rough_01", "grey_plaster", "cracked_concrete",
  "farm_soil", "leafy_grass", "grass_path_2", "forest_leaves_02", "muddy_tracks", "wooden_gate", "weathered_brown_planks", "raked_dirt",
  "withered_grass", "pine_bark",
] as const;
export type PhTex = (typeof PH_TEX)[number];
export const PH_HDRI = ["cowboy_town_hall", "kloofendal_38d_partly_cloudy", "farm_field", "qwantani_dusk_2", "forest_grove"] as const;
export type PhHdri = (typeof PH_HDRI)[number];

const MODELS: Partial<Record<PhModel, THREE.Group>> = {};
const TEX: Record<string, THREE.Texture> = {};
const HDR: Partial<Record<PhHdri, THREE.DataTexture>> = {};
const ENV: Partial<Record<PhHdri, THREE.Texture>> = {};
let readyP: Promise<void> | null = null;

const ALIASES = ["diff", "nor", "rough", "ao"] as const;
export const phLoad = () => {
  if (readyP) return readyP;
  const gl = new GLTFLoader(), tl = new THREE.TextureLoader(), rl = new RGBELoader();
  const jobs: Promise<unknown>[] = [];
  for (const n of PH_MODELS) jobs.push(gl.loadAsync(staticFile(`ph/models/${n}/${n}.gltf`)).then((g) => { MODELS[n] = g.scene; }).catch((e) => console.log("PH model fail", n, String(e))));
  for (const n of PH_TEX) for (const a of ALIASES) jobs.push(tl.loadAsync(staticFile(`ph/tex/${n}_${a}.jpg`)).then((t) => { TEX[`${n}_${a}`] = t; }).catch(() => undefined));
  for (const n of PH_HDRI) jobs.push(rl.loadAsync(staticFile(`ph/hdri/${n}_1k.hdr`)).then((t) => { t.mapping = THREE.EquirectangularReflectionMapping; HDR[n] = t; }).catch((e) => console.log("PH hdri fail", n, String(e))));
  readyP = Promise.all(jobs).then(() => undefined);
  return readyP;
};

/** the PMREM'd HDRI for scene.environment (built lazily with the live renderer) */
// 2026-11-24: one PMREM cache PER RENDERER. A dissolve mounts a second canvas (its own WebGL context); a PMREM texture
// built there is a render target with no data in the first context, so after the dissolve the shot lit with a black
// environment (shot 10 rendered at half brightness until the next chunk started fresh).
const ENV_BY = new WeakMap<THREE.WebGLRenderer, Partial<Record<PhHdri, THREE.Texture>>>();
export const phEnv = (name: PhHdri, renderer: THREE.WebGLRenderer) => {
  let E = ENV_BY.get(renderer); if (!E) { E = {}; ENV_BY.set(renderer, E); }
  if (!E[name] && HDR[name]) { const pm = new THREE.PMREMGenerator(renderer); E[name] = pm.fromEquirectangular(HDR[name]!).texture; pm.dispose(); }
  return E[name] ?? null;
};

const matCache = new Map<string, THREE.MeshStandardMaterial>();
/** a PBR material from one Poly Haven texture set. rx/ry = repeats across the surface's UV 0..1 (with boxM / planeM
 *  geometry UVs are already in metres, so pass 1 / tile size in metres). tint multiplies the photo (palette pull). */
export const phMat = (name: PhTex, rx = 1, ry = rx, o: { tint?: string; rough?: number; metal?: number; env?: number; nor?: number; key?: string; side?: THREE.Side; ao?: number } = {}) => {
  const key = [name, rx.toFixed(3), ry.toFixed(3), o.tint ?? "", o.rough ?? "", o.metal ?? "", o.env ?? "", o.nor ?? "", o.side ?? "", o.key ?? ""].join("|");
  const hit = matCache.get(key); if (hit) return hit;
  const tex = (a: string, srgb = false) => {
    const t0 = TEX[`${name}_${a}`]; if (!t0) return null;
    const t = t0.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true; return t;
  };
  const m = new THREE.MeshStandardMaterial({ color: o.tint ?? "#ffffff", roughness: o.rough ?? 1, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide });
  const d = tex("diff", true); if (d) m.map = d;
  const n = tex("nor"); if (n) { m.normalMap = n; m.normalScale.set(o.nor ?? 1, o.nor ?? 1); }
  const r = tex("rough"); if (r) m.roughnessMap = r;
  const a = tex("ao"); if (a) { m.aoMap = a; m.aoMapIntensity = o.ao ?? 1; }
  m.envMapIntensity = o.env ?? 1;
  m.userData.noMacro = true;
  matCache.set(key, m);
  return m;
};

/** box geometry whose UVs are in metres on every face (so phMat(name, 1/tile) tiles at real size) */
export const boxM = (w: number, h: number, d: number) => {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 verts each)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]); }
  uv.needsUpdate = true; g.setAttribute("uv1", uv.clone());
  return g;
};
/** a plane (XY) with metre UVs */
export const planeM = (w: number, h: number, sx = 1, sy = 1) => {
  const g = new THREE.PlaneGeometry(w, h, sx, sy);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  uv.needsUpdate = true; return g;
};

/** clone a Poly Haven model. filt: keep only root nodes whose name matches (then recentre on x/z and drop to y = 0);
 *  h: scale so the model is h metres tall (else s = uniform scale). Meshes cast and receive the sun's shadow. */
export const phModel = (name: PhModel, o: { filt?: string; h?: number; s?: number; center?: boolean; noCast?: boolean; env?: number } = {}) => {
  const src = MODELS[name];
  const grp = new THREE.Group(); grp.name = "ph:" + name;
  if (!src) return grp;
  const kids = o.filt ? src.children.filter((c) => new RegExp(o.filt!).test(c.name)) : src.children;
  const inner = new THREE.Group();
  for (const c of kids) inner.add(c.clone(true));
  const bb = new THREE.Box3().setFromObject(inner);
  if (o.filt || o.center) { const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; inner.position.set(-cx, -bb.min.y, -cz); }
  const H = bb.max.y - bb.min.y, s = o.h ? o.h / Math.max(H, 1e-3) : o.s ?? 1;
  inner.scale.setScalar(s); if (o.filt || o.center) inner.position.multiplyScalar(s);
  inner.traverse((m) => {
    const me = m as THREE.Mesh;
    if (!me.isMesh) return;
    me.castShadow = !o.noCast; me.receiveShadow = true;
    const mats = Array.isArray(me.material) ? me.material : [me.material];
    for (const x of mats) { const pm = x as THREE.MeshPhysicalMaterial; if (pm.isMeshPhysicalMaterial && (pm.transmission ?? 0) > 0) { pm.transmission = 0; pm.transparent = true; pm.opacity = 0.35; pm.depthWrite = false; me.castShadow = false; } /* 2026-11-25: transmission made three re-render the whole scene every frame (+9 s/frame) */ const sm = x as THREE.MeshStandardMaterial; if (sm.isMeshStandardMaterial) { sm.envMapIntensity = o.env ?? 1; sm.userData.noMacro = true; if (sm.transparent && sm.alphaTest === 0 && sm.map) { sm.alphaTest = 0.5; sm.transparent = false; sm.depthWrite = true; } } }
  });
  grp.add(inner);
  return grp;
};
/** the height and footprint of a model (for placing it on marks) */
export const phSize = (name: PhModel, filt?: string) => { const g = phModel(name, { filt, center: true }); const b = new THREE.Box3().setFromObject(g); return b.getSize(new THREE.Vector3()); };
export const phHas = (name: PhModel) => !!MODELS[name];
/** one raw texture of a set (cloned, repeat-wrapped) */
export const phTexture = (name: PhTex, alias: "diff" | "nor" | "rough" | "ao", srgb = alias === "diff") => {
  const t0 = TEX[`${name}_${alias}`]; if (!t0) return null;
  const t = t0.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
};
