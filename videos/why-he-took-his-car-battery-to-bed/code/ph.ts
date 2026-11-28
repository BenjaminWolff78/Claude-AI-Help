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
  "Barrel_01", "barrel_stove", "Lantern_01", "metal_jerrycan", "old_tyre", "portable_generator", "rubber_boots", "wooden_ladder", "sledgehammer_01", "tree_stump_01", "modified_thermos", "alarm_clock_01", "metal_tool_chest", "rusted_spade_01", "hanging_industrial_lamp", "wooden_crate_01", "caged_hanging_light", "wall_clock", "pot_enamel_01", "metal_jug", "steel_frame_shelves_01", "wooden_bucket_01", "dining_chair_02", "WoodenTable_01", "wooden_broom", "standing_chalkboard_01", "street_lamp_01", "dead_tree_trunk", "tree_stump_02", "cardboard_box_01", "painted_wooden_bench", "wooden_stool_01", "oak_lite", "Shelf_01", "russian_food_cans_01", "oil_tin", "jug_01", "wooden_bowl_01", "pine_bare", "hand_truck",
] as const;
export type PhModel = (typeof PH_MODELS)[number];
export const PH_TEX = [
  "snow_02", "snow_03", "asphalt_snow", "gravel_road", "rough_wood", "pine_bark", "wood_plank_wall", "weathered_plank_siding", "roof_planks", "old_wooden_floor_01", "plank_flooring_04", "corrugated_iron", "rusty_corrugated_iron", "dark_wooden_planks", "wood_table_worn", "painted_plaster_wall", "weathered_planks", "old_planks_02", "muddy_tracks", "concrete_floor_worn_001", "beige_wall_001", "rusty_metal", "brown_mud_dry", "weathered_brown_planks", "worn_planks", "plywood",
] as const;
export type PhTex = (typeof PH_TEX)[number];
export const PH_HDRI = ["warm_restaurant", "rogland_moonlit_night", "snowy_field", "winter_evening", "rural_winter_roadside"] as const;
export type PhHdri = (typeof PH_HDRI)[number];

const MODELS: Partial<Record<PhModel, THREE.Group>> = {};
const TEX: Record<string, THREE.Texture> = {};
export const EXTRA_TEX: Record<string, THREE.Texture> = {};
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
  // 2026-11-26: the water normal map is preloaded here too. Loaded later inside the set, it arrived after the first draw of
  // a chunk (the canvas draws once per frame), so every chunk's first frame had flat dark or pale white water.
  void 0; if (false) jobs.push(tl.loadAsync(staticFile("tex/waternormals.jpg")).then((t) => { EXTRA_TEX.waternormals = t; }).catch((e) => console.log("water normals fail", String(e))));
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
