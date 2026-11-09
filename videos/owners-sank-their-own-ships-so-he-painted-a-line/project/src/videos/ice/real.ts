// v10.14 "real 3D" look (master prompt part 14 E2): every world material becomes a MeshStandardMaterial with a canvas
// texture, bump relief and roughness variation, lit by a real sun (DirectionalLight, PCF soft shadows) plus a
// hemisphere light, ACES filmic tone mapping, bloom on lamps / windows / sparks only, fog in the horizon colour and no
// ink pass on the world. Characters (2D cards on the NOINK layer) keep their own drawn outline.
// The old two-tone look stays reachable for A/B stills with inputProps { post: { legacy: true } }.
import * as THREE from "three";
import { ctex } from "./paint";
import { NOINK } from "./ink";
import { swayMaterial } from "./sway";

export { REAL, aces } from "./realflag";

/** soft grime / plaster mottling for materials that had no texture: light grey 0.80-1.0, tiles every metre or so */
export const grimeTex = () => ctex("realGrime", 512, 512, (g, r) => {
  g.fillStyle = "#f4f4f4"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, rad = 8 + r() * 46, a = 0.025 + r() * 0.05;
    for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      const c = r() < 0.5 ? "60,58,54" : "255,255,255";
      gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
  const im = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < im.data.length; i += 4) { const n = (r() - 0.5) * 14; im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n; }
  g.putImageData(im, 0, 0);
});
/** roughness variation (green channel is what three reads): 0.62-0.95, blotchy */
export const roughTex = () => {
  const t = ctex("realRough", 256, 256, (g, r) => {
    g.fillStyle = "rgb(214,214,214)"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 120; i++) {
      const x = r() * 256, y = r() * 256, rad = 6 + r() * 30, v = Math.round(150 + r() * 100);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${v},${v},${v},0.5)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });
  t.colorSpace = THREE.NoColorSpace;
  return t;
};

const cache = new Map<string, THREE.Material>();
const WHITE = new THREE.Color(1, 1, 1);
const isLit = (m: THREE.Material): m is THREE.MeshLambertMaterial | THREE.MeshPhongMaterial =>
  (m as THREE.MeshLambertMaterial).isMeshLambertMaterial === true || (m as THREE.MeshPhongMaterial).isMeshPhongMaterial === true;

/** one Lambert / Phong world material -> MeshStandardMaterial (cached per source material) */
export const realMat = (m: THREE.Material): THREE.Material => {
  if (!isLit(m)) return m;
  // a material with its own shader patch (water, chains...) keeps it; only the two-tone / sway patches are replaced
  if (Object.prototype.hasOwnProperty.call(m, "onBeforeCompile")) { const key = m.customProgramCacheKey(); if (!key.startsWith("twoTone")) return m; }
  const hit = cache.get(m.uuid);
  if (hit) return hit;
  const phong = (m as THREE.MeshPhongMaterial).isMeshPhongMaterial === true;
  const shin = phong ? (m as THREE.MeshPhongMaterial).shininess : 0;
  const s = new THREE.MeshStandardMaterial({
    color: m.color.clone(), map: m.map ?? grimeTex(), alphaMap: m.alphaMap, alphaTest: m.alphaTest, transparent: m.transparent,
    opacity: m.opacity, side: m.side, vertexColors: m.vertexColors, depthWrite: m.depthWrite, depthTest: m.depthTest, fog: m.fog,
    emissive: m.emissive.clone(), emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity,
    roughness: phong ? THREE.MathUtils.clamp(1 - Math.sqrt(shin / 120), 0.28, 0.8) : 0.86, metalness: 0,
    roughnessMap: roughTex(), polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits,
  });
  // relief from the painted texture itself: mortar, plank gaps and cobble joints catch the sun
  if (m.map) { s.bumpMap = m.map; s.bumpScale = 1.6; }
  s.name = m.name; s.userData = { ...m.userData, realFrom: m.uuid };
  s.toneMapped = m.toneMapped;
  if (m.userData.sway) { delete s.userData.sway; swayMaterial(s); }
  cache.set(m.uuid, s);
  return s;
};

/** walk a set: world meshes get real materials and cast + receive sun shadows (cards, sky, glows on NOINK are left) */
export const realify = (root: THREE.Object3D) => {
  root.traverse((o) => {
    const me = o as THREE.Mesh;
    if (!me.isMesh || me.layers.isEnabled(NOINK)) return;
    // painted signs, name boards and paper (unlit MeshBasic with a texture and a white colour) are lit like the rest
    if (!Array.isArray(me.material)) {
      const bm = me.material as THREE.MeshBasicMaterial;
      if (bm.isMeshBasicMaterial && bm.map && bm.color.equals(WHITE) && bm.blending === THREE.NormalBlending) {
        let r = cache.get(bm.uuid);
        if (!r) { r = new THREE.MeshStandardMaterial({ map: bm.map, transparent: bm.transparent, alphaTest: bm.alphaTest || (bm.transparent ? 0.02 : 0), opacity: bm.opacity, side: bm.side, roughness: 0.82, metalness: 0, depthWrite: bm.depthWrite }); cache.set(bm.uuid, r); }
        me.material = r; me.receiveShadow = true; return;
      }
    }
    const mats = Array.isArray(me.material) ? me.material : [me.material];
    if (!mats.some(isLit)) return;
    me.material = Array.isArray(me.material) ? me.material.map(realMat) : realMat(me.material);
    const opaque = !mats.some((x) => x.transparent);
    me.receiveShadow = true;
    if (opaque && !me.userData.noCast) me.castShadow = true;
  });
};


/** puffy fair-weather cumulus (part 14 E2 "a sky with clouds"): lit tops, shaded flat bases, soft edges */
export const cumulusTex = (seed: number, pal: { lit: string; mid: string; shade: string }) => ctex(`cumulus_${pal.lit}_${pal.shade}_${seed}`, 1024, 512, (g, r) => {
  const blobs: [number, number, number][] = [];
  const n = 9 + Math.floor(r() * 6), base = 400;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = 120 + u * 784 + (r() - 0.5) * 60;
    const hump = Math.sin(u * Math.PI) ** 0.8, rad = 70 + hump * (90 + r() * 70);
    blobs.push([x, base - rad * (0.55 + r() * 0.35), rad]);
  }
  for (let i = 0; i < 6; i++) { const x = 260 + r() * 500, rad = 60 + r() * 70; blobs.push([x, base - 150 - r() * 120, rad]); }
  const draw = (fill: (x: number, y: number, rad: number) => string | CanvasGradient, dy = 0, k = 1) => {
    for (const [x, y, rad] of blobs) { g.fillStyle = fill(x, y + dy, rad * k); g.beginPath(); g.arc(x, y + dy, rad * k, 0, Math.PI * 2); g.fill(); }
  };
  g.save(); g.beginPath(); g.rect(0, 0, 1024, base); g.clip();
  draw(() => pal.shade, 0, 1.0);                                                     // body in shade
  draw((x, y, rad) => { const gr = g.createLinearGradient(0, y - rad, 0, y + rad * 0.6); gr.addColorStop(0, pal.lit); gr.addColorStop(0.55, pal.mid); gr.addColorStop(1, pal.mid + "00"); return gr; }, -rad0(), 0.92);
  g.restore();
  // soften: fade the flat base and the silhouette edge
  const im = g.getImageData(0, 0, 1024, 512), d = im.data;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 1024; x++) {
    const i = (y * 1024 + x) * 4; if (!d[i + 3]) continue;
    const fb = Math.min(1, Math.max(0, (base - y) / 26));
    d[i + 3] = Math.round(d[i + 3] * fb * (0.9 + 0.1 * r()));
  }
  g.putImageData(im, 0, 0);
  g.globalCompositeOperation = "destination-in"; g.filter = "blur(3px)"; g.drawImage(g.canvas, 0, 0); g.filter = "none"; g.globalCompositeOperation = "source-over";
  function rad0() { return 18; }
});
