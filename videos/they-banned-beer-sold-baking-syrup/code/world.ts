import { getInputProps } from "remotion";
const QA_ON = !!(getInputProps() as { qa?: boolean }).qa;
// One three.js world holding every set of the film (each in its own local space, offset along x so lights, shadows
// and fog never mix). update(id, f, camera) shows the shot's set, sets the light key, poses set + cast, and returns the
// lens focus point. Light rig, sky, fog and clouds follow the skill's measured template (lighting.md, depth.md).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Kit, V } from "./build";
import { ctex, cloudHD } from "./paint";
import { CARD_K } from "./cardshade";
import { GRADES } from "./grade";
import { SWAY_T } from "./sway";
import { LIGHTS, LOOK, LightName } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { REAL, realify, cumulusTex } from "./real";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, tier, CASTER_LAYER } from "./cast";
/** r76i: actors throw real sun shadows through sun-facing casters (false = the old ground-laid silhouettes) */
const CASTER_ON = true;
import { Pen, fxContact, fxShadow } from "./toon";
import { figure, FigOpts, Look } from "./fig";
import { CAST } from "./casts";
import { FPS, SHOTS, PREVIEW, V3, ShotDef, dofAt , STORY_BY_ID, SUN_REF } from "./story";
import { SET_BUILDERS } from "./sets";
import type { SetDef } from "./sets/types";
import { WATER_U } from "./setkit";
import { camFor, actFor, CastPlace, FxSpec } from "./cams";
import { phLoad, phEnv, type PhHdri } from "./ph";

const KENNEY: string[] = [];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit)
      .then((k) => phLoad().then(() => k));   // v26: the Poly Haven models, textures and HDRIs load before frame 1
  }
  return kitP;
};

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const SET_GAP = 2000;
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 60) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
/** v10.8: a 3- or 4-frame blink (half / shut / [shut] / half) every 0.5-1.5 s at irregular times, per character */
const LID4 = [0.5, 1, 1, 0.5], LID3 = [0.5, 1, 0.5];
export const lidAt = (f: number, i: number) => {
  let s = Math.round(-45 * hh(i, 9));
  for (let n = 0; s <= f && n < 900; n++) {
    const L = hh(i * 17 + n, 5) < 0.5 ? LID3 : LID4, k = f - s;
    if (k >= 0 && k < L.length) return L[k];
    s += Math.round(15 + 30 * hh(i * 31 + n, 13));
  }
  return 0;
};

const LP = new THREE.Vector3();
export { phEnv };
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  heads: THREE.Vector3[] = [];
  /** v26: the HDRI the current shot wants as scene.environment (applied by Bridge with the live renderer) */
  envWant: { hdri: PhHdri; i: number } | null = null;
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<string, THREE.Texture[]> = {};
  sets: Record<string, { def: SetDef; off: THREE.Vector3 }> = {};
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
    // the three.js sun only drives shadows + direction: its colour is black, the two-tone uniforms carry the light, so
    // point lights (lamps, candles, windows) are the only thing in directDiffuse and add their pools on top (shade.ts)
    this.sun = new THREE.DirectionalLight("#000000", 1);
    this.sun.shadow.camera.layers.enable(NOINK);   // r43: the actor cards live on the NOINK layer: let the shadow pass see them
    this.sun.castShadow = !((getInputProps() as { post?: { noShadow?: boolean } }).post?.noShadow); { const sm = ((getInputProps() as { post?: { shadow?: number } }).post?.shadow) ?? 4096; this.sun.shadow.mapSize.set(sm, sm); }
    R.add(this.hemi, this.sun, this.sun.target);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.94, 0.95, 0.98), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30; m.userData = { a, d, y: 70 + (i % 4) * 30 }; m.scale.set(REAL ? w * 1.0 : w * 2.4, REAL ? w * 0.52 : w / 4.6, 1); m.layers.set(NOINK); // long thin stratus streaks, never cotton balls   /* r60: smaller (one flat cream card spanned the yard sky) */
      this.clouds.push(m); R.add(m);
    }
    // r5b: a second, higher layer (25-45 deg up) so a 9:16 frame looking along a street still shows lit clouds in its sky
    for (let i = 0; i < 16; i++) {   /* r49: denser and puffier (the day skies read empty: no clouds in frame) */
      const a = (i / 16) * Math.PI * 2 + 0.75, d = 520 + (i % 3) * 50;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.94, 0.95, 0.98), transparent: true, depthWrite: false, fog: false }));
      const w = 160 + (i % 4) * 40; m.userData = { a, d, y: 150 + (i % 5) * 32 }; m.scale.set(REAL ? w * 1.15 : w * 2.4, REAL ? w * 0.48 : w / 4.6, 1); m.layers.set(NOINK);   /* r59: smaller puffs (one cloud card covered the top quarter of the yard shot) */
      this.clouds.push(m); R.add(m);
    }
    /* r76i (reviewers: "a flat cyan sky with one cream cloud"): a third, high layer of smaller puffs so every 9:16 sky band holds several clouds at different sizes */
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.4 + (i % 2) * 0.12, d = 480 + (i % 4) * 40;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.94, 0.95, 0.98), transparent: true, depthWrite: false, fog: false }));
      const w = 80 + (i % 5) * 22; m.userData = { a, d, y: 230 + (i % 6) * 36 }; m.scale.set(REAL ? w * 1.15 : w * 2.2, REAL ? w * 0.5 : w / 4.2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    const names = Object.keys(SET_BUILDERS);
    const wanted = new Set(SHOTS.map((s) => s.set));
    names.forEach((n, i) => {
      if (!wanted.has(n)) return;
      const def = SET_BUILDERS[n](kit), off = V(i * SET_GAP, 0, 0);
      def.root.position.copy(off); def.root.visible = false; R.add(def.root);
      if (REAL) realify(def.root);
      this.sets[n] = { def, off };
    });
  }

  private cloudsFor(light: LightName) {
    if (!this.cloudMaps[light]) this.cloudMaps[light] = [0, 1, 2, 3].map((k) => (REAL ? cumulusTex(k, LOOK[light].cloud) : cloudHD(k, LOOK[light].cloud)));
    return this.cloudMaps[light];
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s: ShotDef = STORY_BY_ID(id), L = LIGHTS[s.light], K = LOOK[s.light];
    SWAY_T.value = t;
    const set = this.sets[s.set];
    for (const k in this.sets) this.sets[k].def.root.visible = k === s.set;
    if (!set) return V(0, 0, 0);
    const off = set.off;
    // ---- camera (set-local -> world) ----
    const c = camFor(id, f, set.def);
    cam.position.set(c.pos[0] + off.x, c.pos[1] + off.y, c.pos[2] + off.z); cam.up.set(0, 1, 0);
    cam.lookAt(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.08; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const look = V(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z), dist = cam.position.distanceTo(look);
    cam.layers.enable(NOINK);
    // ---- light rig: camera-relative sun frozen per shot ----
    const cR = camFor(id, SUN_REF[id] ?? s.a, set.def);   // r12: the sun is fixed in the world for the whole scene (no swing during pans)
    const fw = V(cR.look[0] - cR.pos[0], 0, cR.look[2] - cR.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
    const az = THREE.MathUtils.degToRad(set.def.sun?.az ?? L.az), el = THREE.MathUtils.degToRad(set.def.sun?.el ?? L.el);
    const sunW = set.def.sunW?.[s.light];
    const sunDir = sunW ? V(sunW[0], sunW[1], sunW[2]).normalize() : fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
    this.envWant = (set.def.env?.[s.light] as { hdri: PhHdri; i: number } | undefined) ?? null;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI * 0.6;
    if (REAL) { this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.intensity = L.hemiI; this.sun.shadow.radius = 3; }
    this.sunK = Math.min(1, Math.max(0, (L.sunI - 1.5) / 3));   // r43: ground-shadow strength for the actor silhouettes (none at night, overcast or indoors)
    { const want = !((getInputProps() as { post?: { noShadow?: boolean } }).post?.noShadow) && L.sunI > 0.01; if (this.sun.castShadow !== want) this.sun.castShadow = want; }   // no shadow pass under a black sun (cellar)
    const Rr = THREE.MathUtils.clamp(dist * 1.2 + 8, 12, 60);
    this.sun.position.copy(look).addScaledVector(sunDir, 200); this.sun.target.position.copy(look);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 420; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CARD_K.uCardSat.value = THREE.MathUtils.clamp(1.25 / GRADES[L.grade].sat[1], 0.55, 1.0) * (({ sunset: 0.82, morning: 0.88, inn: 0.78, night: 0.85, office: 0.85 } as Record<string, number>)[L.grade] ?? 1)   /* r76i (reviewers): costumes went neon under the inn lamps */;   /* r59: Amos's teal still read cyan at sunset and in the hook */   /* r52 (AX2 row 9): costumes keep their colour through the grade */ CARD_K.uBodyGain.value = L.bodyGain ?? ({ day: 0.5, dawn: 0.52, morning: 0.52, golden: 0.66, inn: 0.66, sunset: 0.52, grey: 0.74, night: 0.82 } as Record<string, number>)   /* r58: grey / night / sunset lower too (the taxman's navy read royal blue, Amos's teal cyan) */   /* r53: lower again (sunlit aprons still measured 1.5-1.6x their own colour and read orange) */[L.grade] ?? 1.0;   /* r52: sunlit costumes measured 1.45-1.5x their own colour (brown read orange) */ CARD_K.uGain.value = L.charGain ?? 1.03; CARD_K.uHeadCool.value = L.headCool ?? 0.15; CARD_K.uHeadWarm.value = L.headWarm ?? 0; CARD_K.uHeadTint.value.setRGB(...(L.headTint ?? [1, 1, 1]) as [number, number, number]);   // r7: night / interior heads dim with the scene
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds, water colours ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    const showSun = L.sunDisc !== "#000000";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      const dy = THREE.MathUtils.degToRad(L.discYaw ?? 0), de = THREE.MathUtils.degToRad(L.discEl ?? (L.el as number)), discDir = L.discYaw ? fw.clone().multiplyScalar(Math.cos(az + dy)).addScaledVector(rt, Math.sin(az + dy)).multiplyScalar(Math.cos(de)).setY(Math.sin(de)).normalize() : sunDir;   // r12: the visible disc may sit a little off the light (art direction)
      this.sunDisc.position.copy(cam.position).addScaledVector(discDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.8)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    const cm = this.cloudsFor(s.light);
    this.clouds.forEach((m, i) => {
      const u = m.userData, a = u.a + t * 0.004;
      m.position.set(cam.position.x + Math.cos(a) * u.d, u.y, cam.position.z + Math.sin(a) * u.d); m.lookAt(cam.position.x, m.position.y, cam.position.z);
      (m.material as THREE.MeshBasicMaterial).map = cm[i % 4]; m.visible = !["night", "lab", "cabin", "micro", "microBlue", "labNight", "groveNight", "groveMoon", "grove3am", "cellarLamp", "yardGrey", "officeCandle", "innEvening", "shNight", "shGar"].includes(s.light);
    });
    const wc = K.water;
    untone(wc.near, WATER_U.wNearC.value); untone(wc.mid, WATER_U.wMidC.value); untone(wc.far, WATER_U.wFarC.value);
    untone(wc.crest, WATER_U.wCrest.value); untone(wc.trough, WATER_U.wTrough.value); untone(wc.glint, WATER_U.wGlint.value);
    WATER_U.wShade.value.set(...wc.shade); WATER_U.wTime.value = t;
    // ---- set pose + cast ----
    const act = actFor(id, f, set.def);
    set.def.pose(t, act.ctl ?? {}, s.light);
    // render speed (software GL): a light at zero intensity still costs a BRDF per pixel; take dark lights out of the
    // shader (they re-enter, with one recompile, when they turn on). Also drop lights farther than their range + 25 m.
    { const ud = set.def.root.userData as { _lights?: THREE.Light[] };
      if (!ud._lights) { ud._lights = []; set.def.root.traverse((o) => { const l = o as THREE.Light; if (l.isLight && !(l as THREE.DirectionalLight).isDirectionalLight && !(l as THREE.HemisphereLight).isHemisphereLight) ud._lights!.push(l); }); }
      for (const l of ud._lights) { const pl = l as THREE.PointLight; let on = l.intensity > 1e-3 && l.parent?.visible !== false;
        if (on && pl.distance > 0) { l.getWorldPosition(LP); on = LP.distanceTo(cam.position) < pl.distance + 25; }
        l.visible = on; } }
    this.placeCast(act.cast, act.fx ?? [], cam, off, f, sunDir);
    // gate check 10 (2026-11-08): the cast's head centres this frame, so the lens can keep every face sharp
    this.heads = act.cast.map((x) => { const sc = x.scale ?? 1, sit = x.o?.mode === "sit" || x.o?.mode === "kneel"; return V(x.pos[0] + off.x, x.pos[1] + (sit ? 0.85 : 1.3) * sc + off.y, x.pos[2] + off.z); });
    if (QA_ON) this.qa(id, f, cam, off, act, set.def.root, c, set.def.title);
    // ---- focus: DOF table point (set-local) or the look point ----
    const d = dofAt(f);
    if (d.focus) { const p = d.focus(f); return V(p[0] + off.x, p[1] + off.y, p[2] + off.z); }
    if (act.focus) return V(act.focus[0] + off.x, act.focus[1] + off.y, act.focus[2] + off.z);
    return look;
  }


  /** QA mode (inputProps.qa): per-frame camera collision / occlusion / framing / overlap report, logged as "QA|{json}" */
  private qa(id: number, f: number, cam: THREE.PerspectiveCamera, off: THREE.Vector3, act: { cast: CastPlace[]; focus?: V3; subj?: string | null }, root: THREE.Object3D, c: { pos: V3; look: V3 }, tobs?: THREE.Object3D[]) {
    root.updateMatrixWorld(true);   // the set was just posed this frame: raycast against this frame's matrices, not last frame's
    const ray = new THREE.Raycaster(), ndc = (p: THREE.Vector3) => p.clone().project(cam);
    const subj = act.subj === null ? undefined : act.subj ? act.cast.find((x) => x.who === act.subj) : act.cast.find((x) => x.who === "boss") ?? act.cast[0];
    const head = subj ? V(subj.pos[0] + off.x, subj.pos[1] + 1.3 * (subj.scale ?? 1) + off.y, subj.pos[2] + off.z) : V(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z);
    const meshes: THREE.Object3D[] = [];
    root.traverseVisible((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK) && !(m as unknown as THREE.Sprite).isSprite) meshes.push(m); });
    // occluders between the subject's head and the camera (also catches a camera sitting inside a block or crate)
    const dir = cam.position.clone().sub(head), D = dir.length(); dir.normalize();
    ray.set(head.clone().addScaledVector(dir, 0.02), dir); ray.far = D;
    const occ = ray.intersectObjects(meshes, false).filter((h) => h.distance < D - 0.05).slice(0, 3).map((h) => {
      const m = (h.object as THREE.Mesh).material as THREE.Material; return `${h.object.name || h.object.parent?.name || "mesh"}${m && (m as THREE.Material).transparent ? "(T)" : ""}@${(D - h.distance).toFixed(2)}`; });
    // something right in front of the lens (near-plane clip): short rays in a cone around the view axis
    const fwd = V(0, 0, -1).applyQuaternion(cam.quaternion); let near = 0;
    for (const [dx, dy] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.4], [0, -0.4]]) { const d = fwd.clone().add(V(dx, dy, 0).applyQuaternion(cam.quaternion)).normalize(); ray.set(cam.position, d); ray.far = 0.35; if (ray.intersectObjects(meshes, false).length) near++; }
    const hp = ndc(head), inFrame = subj ? Math.abs(hp.x) < 0.9 && hp.y > -0.55 && hp.y < 0.92 && hp.z < 1 : true;
    // still-frame gate (2026-11-08): every cast member's screen height (feet -> hat top, visible part and full) and the
    // focus error (camera distance to the subject's head vs to the DOF focus point, metres)
    const sizes = act.cast.map((x) => { const sc = x.scale ?? 1, sit = x.o?.mode === "sit" || x.o?.mode === "kneel";
      const ft = ndc(V(x.pos[0] + off.x, x.pos[1] + off.y, x.pos[2] + off.z)), tp = ndc(V(x.pos[0] + off.x, x.pos[1] + (sit ? 1.25 : 1.68) * sc + off.y, x.pos[2] + off.z));
      if (ft.z > 1 || tp.z > 1 || Math.abs(ft.x) > 1.05) return [x.who, 0, 0];
      return [x.who, +((Math.min(tp.y, 1) - Math.max(ft.y, -1)) / 2).toFixed(3), +((tp.y - ft.y) / 2).toFixed(3)]; });
    const fp = act.focus ? V(act.focus[0] + off.x, act.focus[1] + off.y, act.focus[2] + off.z) : V(c.look[0] + off.x, c.look[1] + off.y, c.look[2] + off.z);
    const focusErr = subj ? +Math.abs(cam.position.distanceTo(head) - cam.position.distanceTo(fp)).toFixed(2) : 0;
    // gate 1/10: heads sliced by a side or the top edge; blur (CoC px at 1080x1920) of every head in frame
    const fwd0 = V(0, 0, -1).applyQuaternion(cam.quaternion), rgt0 = V(1, 0, 0).applyQuaternion(cam.quaternion), up0 = V(0, 1, 0).applyQuaternion(cam.quaternion);
    const fDepth = Math.max(0.3, fp.clone().sub(cam.position).dot(fwd0));
    let cInf = dofAt(f).cInf;   // the same per-frame cap Bridge applies (every head under 2.5 px)
    for (const x of act.cast) { const sc = x.scale ?? 1, sit = x.o?.mode === "sit" || x.o?.mode === "kneel"; const h = V(x.pos[0] + off.x, x.pos[1] + (sit ? 0.85 : 1.3) * sc + off.y, x.pos[2] + off.z);
      const dep = h.clone().sub(cam.position).dot(fwd0); if (dep < 0.2) continue; const q = ndc(h); if (Math.abs(q.x) > 1.15 || Math.abs(q.y) > 1.15) continue;
      const k = Math.abs(1 - fDepth / dep) * (dep < fDepth ? 1.2 : 1); if (k > 1e-3) cInf = Math.min(cInf, 2.5 / k); }
    const heads = act.cast.map((x) => { const sc = x.scale ?? 1, sit = x.o?.mode === "sit" || x.o?.mode === "kneel";
      const hc = V(x.pos[0] + off.x, x.pos[1] + (sit ? 0.85 : 1.3) * sc + off.y, x.pos[2] + off.z), dep = hc.clone().sub(cam.position).dot(fwd0);
      if (dep < 0.05) return [x.who, 0, 0];
      const c0 = ndc(hc), r = Math.abs(ndc(hc.clone().addScaledVector(rgt0, 0.3 * sc)).x - c0.x), ry = Math.abs(ndc(hc.clone().addScaledVector(up0, 0.42 * sc)).y - c0.y);
      const inside = c0.x + r > -1 && c0.x - r < 1 && c0.y + ry > -1 && c0.y - ry < 1;
      if (!inside) return [x.who, 0, 0];
      const sliced = c0.x - r < -1 || c0.x + r > 1 || c0.y + ry > 1 ? 1 : 0;
      let coc = cInf * (1 - fDepth / dep); if (coc < 0) coc *= 1.2;
      return [x.who, sliced, +Math.min(24, Math.abs(coc)).toFixed(1), +r.toFixed(3)]; });   // [3] v10.16 B: head width / frame width
    // gate 5: the title object's share of the frame (projected bounding boxes, clipped, union by sampling)
    let titleShare = 0; const titleParts: (string | number)[][] = [];
    if (tobs && tobs.length) {
      const rects: number[][] = [];
      for (const o of tobs) { if (!o.visible) continue; const bb = new THREE.Box3().setFromObject(o); if (bb.isEmpty()) continue;
        let x0 = 9, x1 = -9, y0 = 9, y1 = -9, okk = false;
        for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) { const q = ndc(V(cx, cy, cz)); if (q.z > 1) continue; okk = true; x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
        if (okk) { rects.push([Math.max(-1, x0), Math.min(1, x1), Math.max(-1, y0), Math.min(1, y1)]); titleParts.push([o.name || 'obj', +((Math.min(1, x1) - Math.max(-1, x0)) / 2).toFixed(2), +((Math.min(1, y1) - Math.max(-1, y0)) / 2).toFixed(2)]); } }
      let hit = 0; const N = 24;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const px = -1 + (2 * i + 1) / N, py = -1 + (2 * j + 1) / N; if (rects.some(([a, b, c2, d2]) => px >= a && px <= b && py >= c2 && py <= d2)) hit++; }
      titleShare = +(hit / (N * N)).toFixed(2);
    }
    // overlapping bodies: screen boxes of cards at similar depth
    const rgt = V(1, 0, 0).applyQuaternion(cam.quaternion);
    const boxes = act.cast.map((x) => { const sc = x.scale ?? 1, mid = V(x.pos[0] + off.x, x.pos[1] + 0.8 * sc + off.y, x.pos[2] + off.z); const p0 = ndc(mid), p1 = ndc(mid.clone().addScaledVector(rgt, 0.26 * sc)); return { x: p0.x, w: Math.abs(p1.x - p0.x), d: cam.position.distanceTo(mid), z: p0.z, who: x.who }; });
    const over: string[] = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const A = boxes[i], B = boxes[j]; if (A.z > 1 || B.z > 1 || Math.abs(A.x) > 1.1 || Math.abs(B.x) > 1.1) continue; const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x - A.w, B.x - B.w); if (ox > 0.7 * 2 * Math.min(A.w, B.w) && Math.abs(A.d - B.d) < 1.2) over.push(A.who + "+" + B.who); }
    const cut: string[] = [];
    for (const x of act.cast) { const sc = x.scale ?? 1, h = V(x.pos[0] + off.x, x.pos[1] + 1.3 * sc + off.y, x.pos[2] + off.z), p0 = ndc(h); if (p0.z > 1) continue; const r = Math.abs(ndc(h.clone().addScaledVector(rgt, 0.27 * sc)).x - p0.x), ry = r * cam.aspect;
      if ((Math.abs(p0.x) < 1 + r && Math.abs(p0.x) > 1 - r && Math.abs(p0.y) < 1) || (p0.y > 1 - ry && p0.y < 1 + ry && Math.abs(p0.x) < 1)) cut.push(x.who); }
    // NOTHING PASSES THROUGH ANYTHING (user rule 2026-11-07): rays out of each standing body at shin / waist / chest height
    // (0.2 m, 8 directions) must not hit a solid; a sitting body's head top must stay under the roof; feet >= 0.45 m apart
    const pierce: string[] = [];
    const solid = (o: THREE.Object3D) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; return !(m && m.transparent); };
    for (const x of act.cast) {
      if (x.air) continue;
      const sc = x.scale ?? 1, sit = x.o?.mode === "sit", b0 = V(x.pos[0] + off.x, x.pos[1] + off.y, x.pos[2] + off.z);
      if (!sit) {
        for (const h of [0.3, 0.8, 1.15]) { let hit = 0; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ray.set(b0.clone().add(V(0, h * sc, 0)), V(Math.cos(a), 0, Math.sin(a))); ray.far = 0.2 * sc; const hs = ray.intersectObjects(meshes, false).filter((q) => solid(q.object)); if (hs.length) hit++; } if (hit >= 2) { pierce.push(`${x.who}@${h}`); break; } }
      } else {
        ray.set(b0.clone().add(V(0, 0.15, 0)), V(0, 1, 0)); ray.far = 1.15 * sc - 0.05; const hs = ray.intersectObjects(meshes, false).filter((q) => solid(q.object)); if (hs.length) pierce.push(`${x.who}:roof@${hs[0].distance.toFixed(2)}`);
      }
    }
    for (let i = 0; i < act.cast.length; i++) for (let j = i + 1; j < act.cast.length; j++) { const A = act.cast[i], B = act.cast[j]; if (A.air || B.air) continue; const d = Math.hypot(A.pos[0] - B.pos[0], A.pos[2] - B.pos[2]); if (d < 0.45 && Math.abs(A.pos[1] - B.pos[1]) < 0.5) pierce.push(`${A.who}+${B.who}@${d.toFixed(2)}`); }
    const hero = act.cast.find((x) => x.who === "boss");
    const frontal = !!hero && !(hero.o?.facing) && !hero.o?.back && Math.abs(ndc(V(hero.pos[0] + off.x, hero.pos[1] + 1.3 + off.y, hero.pos[2] + off.z)).x) < 0.22;
    // v14 scene-graph checks: every cast member's head / feet on screen, the centre ray (whip check), 9 rays to the subject (lens check)
    const cast2 = act.cast.map((x) => { const sc = x.scale ?? 1, sit = x.o?.mode === "sit" || x.o?.mode === "kneel"; const hc = V(x.pos[0] + off.x, x.pos[1] + (sit ? 0.85 : 1.3) * sc + off.y, x.pos[2] + off.z);
      const q = ndc(hc), ft = ndc(V(x.pos[0] + off.x, x.pos[1] + off.y, x.pos[2] + off.z)), r = Math.abs(ndc(hc.clone().addScaledVector(rgt0, 0.27 * sc)).x - q.x), dep = hc.clone().sub(cam.position).dot(fwd0);
      return [x.who, +q.x.toFixed(3), +q.y.toFixed(3), +ft.y.toFixed(3), +r.toFixed(3), +dep.toFixed(2)]; });
    ray.set(cam.position, fwd0); ray.far = 60; const ch = ray.intersectObjects(meshes, false)[0];
    const cray = ch ? [+ch.distance.toFixed(2), ch.object.name || ch.object.parent?.name || "mesh"] : [99, ""];
    const occ9: string[] = [];
    if (subj) { const sc = subj.scale ?? 1, b0 = V(subj.pos[0] + off.x, subj.pos[1] + off.y, subj.pos[2] + off.z);
      for (const [dx, hy] of [[0, 1.3], [-0.22, 1.3], [0.22, 1.3], [0, 1.62], [0, 0.85], [-0.18, 0.85], [0.18, 0.85], [0, 0.45], [0, 0.12]]) {
        const pt = b0.clone().add(V(0, hy * sc, 0)).addScaledVector(rgt0, dx * sc), q = ndc(pt); if (Math.abs(q.x) > 0.6 || Math.abs(q.y) > 0.6 || q.z > 1) continue;
        const d2 = pt.clone().sub(cam.position), L2 = d2.length(); ray.set(cam.position, d2.normalize()); ray.far = L2 - 0.12;
        const hh = ray.intersectObjects(meshes, false).filter((h) => solid(h.object))[0]; if (hh) occ9.push(`${hy}:${hh.object.name || hh.object.parent?.name || "mesh"}@${hh.distance.toFixed(2)}`); } }
    console.log("QA|" + JSON.stringify({ f, id, subj: subj?.who ?? null, fov: +cam.fov.toFixed(1), cast2, cray, occ9, sizes, focusErr, heads, titleShare, titleParts, cam: c.pos.map((v) => +v.toFixed(3)), look: c.look.map((v) => +v.toFixed(3)), occ, near, inFrame: inFrame ? 1 : 0, hx: +hp.x.toFixed(2), hy: +hp.y.toFixed(2), over, cut, pierce, frontal: frontal ? 1 : 0,
      faces: act.cast.map((p) => { const o = p.o ?? {}, lk = CAST[p.who] ?? CAST.lustig;
        const lid = o.blink ?? Math.max(lidAt(f, lk.seed + (p.idx ?? 0) * 7), o.swapLid ?? 0);
        return [p.who + "#" + (p.idx ?? 0), o.expr ?? "neutral", o.mouth ?? o.mouthX ?? "", o.brow ?? null, +lid.toFixed(2), o.back ? 1 : 0, +(o.facing ?? 0).toFixed(2), o.mode ?? "stand"]; }),
      // v20 check 12 (animation): rig state per cast member - who#idx, world pos, mode, walk phase, arms (design units, null =
      // hanging), tilt, headTilt, headBack, props, prop angles, facing, air flag, screen x/y of the head, head width, scale
      rig: act.cast.map((p) => { const o = (p.o ?? {}) as Record<string, unknown>, r2 = (v: unknown) => (Array.isArray(v) ? (v as number[][]).map((q) => q.map((n) => +n.toFixed(1))) : null);
        const sc = p.scale ?? 1, sit = o.mode === "sit" || o.mode === "kneel", hc = V(p.pos[0] + off.x, p.pos[1] + (sit ? 0.85 : 1.3) * sc + off.y, p.pos[2] + off.z), q = ndc(hc), rr = Math.abs(ndc(hc.clone().addScaledVector(rgt0, 0.27 * sc)).x - q.x);
        return [p.who + "#" + (p.idx ?? 0), p.pos.map((v) => +v.toFixed(3)), o.mode ?? "stand", +((o.phase as number) ?? 0).toFixed(3), r2(o.armR), r2(o.armL), +((o.tilt as number) ?? 0).toFixed(2), +((o.headTilt as number) ?? 0).toFixed(2), +((o.headBack as number) ?? 0).toFixed(2),
          o.propR ?? null, o.propL ?? null, +((o.propRAng as number) ?? 0).toFixed(2), +((o.propK as number) ?? 0).toFixed(2), +((o.facing as number) ?? 0).toFixed(2), p.air ? 1 : 0, +q.x.toFixed(3), +q.y.toFixed(3), +rr.toFixed(3), sc, q.z < 1 ? 1 : 0]; }) }));
  }

  sunK = 0;
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  private placeCast(cast: CastPlace[], fxs: FxSpec[], cam: THREE.PerspectiveCamera, off: THREE.Vector3, f: number, sunDir: THREE.Vector3) {
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    // canvas angle the light comes FROM on a card facing the camera (45 deg steps: small texture cache)
    const lightAng = (mirror: boolean) => { const sx = sunDir.dot(right) * (mirror ? -1 : 1), sy = -sunDir.y; return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4); };
    const blobs: FxSpec[] = []; const casts: { x: number; y: number; z: number; w: number; h: number; rz: number; key: string; draw: (pen: Pen) => void }[] = [];
    let ai = 0; const used: Actor[] = []; let anyCaster = false;
    for (const p of cast) {
      const x = p.pos[0] + off.x, y = p.pos[1] + off.y, z = p.pos[2] + off.z, sc = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y + 1.0 * sc, z), 2.5 * sc))) continue;
      const a = this.actor(ai++);
      const look: Look = CAST[p.who] ?? CAST.lustig;
      const dcam = cam.position.distanceTo(this.v.set(x, y + 1.2 * sc, z)) / sc;
      const [w, h, k] = tier(dcam);
      const o: FigOpts = { light: lightAng(!!p.mirror), blink: lidAt(f, look.seed + (p.idx ?? 0) * 7), ...p.o };
      if (p.o && p.o.blink === undefined && p.o.swapLid) { o.blink = Math.max(o.blink ?? 0, p.o.swapLid); delete o.swapLid; }
      const key = `F|${p.who}|${fkey(o)}`;
      a.r = this.pool.req(key, w, h, k, (pen: Pen) => figure(pen, look, o));
      a.mesh.visible = true; a.mesh.position.set(x, y, z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - x, cam.position.z - z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc : sc, sc, sc);
      a.mesh.castShadow = false;   // r43: the silhouette comes from the sun-facing shadow card instead (reviewers: "characters cast no shadows")
      a.shadow.visible = false;
      /* r43: the actor's cast shadow on the ground: its silhouette, grey on white, laid flat away from the sun and multiplied
       *  into the ground like the contact blobs (blended actor-layer passes never showed; the sun's map missed the cards) */
      { const on = CASTER_ON && (p.shadow ?? !p.air) && this.sunK > 0.05 && this.sun.castShadow; a.caster.visible = on;
        if (on) { anyCaster = true; a.caster.position.copy(a.mesh.position); a.caster.scale.copy(a.mesh.scale); a.caster.rotation.set(0, Math.atan2(this.sun.position.x - this.sun.target.position.x, this.sun.position.z - this.sun.target.position.z), 0); } }
      if (!CASTER_ON && (p.shadow ?? !p.air) && this.sunK > 0.05 && p.pos[1] < 0.05 && !(p.o && p.o.mode === "sit")) {
        const sx = this.sun.position.x - this.sun.target.position.x, sy = this.sun.position.y - this.sun.target.position.y, sz = this.sun.position.z - this.sun.target.position.z, hz = Math.hypot(sx, sz) || 1;
        const len = Math.min(2.2, Math.max(0.24,   /* r76: longer still under the sunset (reviewers: no long shadow from the taxman) */ hz / Math.max(1e-3, sy))),   /* r73: longer under a low sun (reviewers: no long sunset shadows) */   /* r65: short at noon (the 0.5 floor gave long low-sun shadows under a high sun) */ H = 2.16 * sc * len   /* r49: shorter (long stick-leg shadows read as cables running out of frame) */, dx = -sx / hz, dz = -sz / hz, c = H * 0.475;
        casts.push({ x: x + dx * c, y, z: z + dz * c, w: 1.3 * sc * (p.mirror ? -1 : 1), h: H, rz: Math.atan2(sx, sz), key: `blob|cast|${p.who}|${fkey(o)}`, draw: (pen: Pen) => { figure(pen, look, o); const g = pen.g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#8e8c98"; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.globalCompositeOperation = "destination-over"; g.fillStyle = "#ffffff"; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore(); } });
      }
      used.push(a);
      if (p.blob !== false && !p.air) blobs.push({ kind: "blob", pos: [p.pos[0], p.pos[1], p.pos[2]], w: 0.5 * sc, h: 0.36 * sc });
    }
    for (let i = ai; i < this.actors.length; i++) { this.actors[i].mesh.visible = false; this.actors[i].shadow.visible = false; this.actors[i].caster.visible = false; }
    CARD_K.uLift.value = anyCaster ? 0.6 : 0; CARD_K.uSunW.value.copy(this.sun.position).sub(this.sun.target.position).normalize();
    let fi = 0; const fused: Fx[] = [];
    for (const cs of casts) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(cs.x, cs.y, cs.z), Math.max(Math.abs(cs.w), cs.h)))) continue;
      const e = this.fx(fi++); e.r = this.pool.req(cs.key, 240, 400, 0.4, cs.draw);
      e.mesh.position.set(cs.x, cs.y + 0.021, cs.z); e.mesh.rotation.set(-Math.PI / 2, 0, cs.rz); e.mesh.scale.set(cs.w, cs.h, 1); e.mesh.visible = true; fused.push(e);
    }
    for (const sp of [...blobs, ...fxs]) {
      const x = sp.pos[0] + off.x, y = sp.pos[1] + off.y, z = sp.pos[2] + off.z;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), Math.max(sp.w, sp.h)))) continue;
      const e = this.fx(fi++);
      if (sp.kind === "blob") {
        e.r = this.pool.req("blob|contact|#7c7f86", 128, 128, 1, (pen) => fxContact(pen, "#7c7f86"));   // r9: soft contact shadows (core ~60% of the ground)
        e.mesh.position.set(x, y + 0.02, z); e.mesh.rotation.set(-Math.PI / 2, 0, 0); e.mesh.scale.set(sp.w, sp.h, 1);
      } else {
        e.r = this.pool.req(sp.key!, sp.cw ?? 256, sp.ch ?? 256, 1, sp.draw!);
        // r17: soft cards fade by material opacity (an alpha baked into the texture key changed the texture every frame and flickered)
        e.use(!!sp.soft); e.soft.opacity = sp.op ?? 1; e.mesh.position.set(x, y, z);
        if (sp.flat) e.mesh.rotation.set(-Math.PI / 2, 0, sp.rot ?? 0); else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(sp.rot ?? 0); }
        e.mesh.scale.set(sp.w, sp.h, 1);
      }
      e.mesh.visible = true; fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
  }
}
// re-export for sets that need shadows of a specific shape
export { fxShadow };
