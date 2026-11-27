// Kit for "He Set the Ice Cream on Fire and It Didn't Melt" (2026-11-27): the baked Alaska (piped meringue dome with
// browning, black tips and a spooned-out wedge showing the frozen core), shader flames (view-facing, volumetric stacks),
// smoke and fire puffs, falling snow, the yellow mop bucket, the oven peel, steel bowl, chalkboard + newspaper textures.
import * as THREE from "three";
import { TAU, cl, sm, lerp, hsh, std, gloss, canvasTex, rbox } from "./harborkit";
import type { V3 } from "./types";

// ---------------------------------------------------------------- the baked Alaska -------------------------------------------
export type Alaska = { g: THREE.Group; set: (o: { bake?: number; char?: number; crack?: number; heap?: number; frost?: number }) => void; R: number; H: number };
/** a domed baked Alaska on its sponge base and plate. R = dome radius (m). The meringue is a hemisphere with piped peaks
 *  (spiky displacement along the normal); bake browns the peaks (vertex colours, darkest on the tips), char blackens the
 *  tips, crack swaps to a version with a spooned wedge removed and the layered core showing (frozen, frosty). */
export const alaska = (R = 0.13, plateCol = "#f4f2ec"): Alaska => {
  const g = new THREE.Group();
  const H = R * 1.05;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.28, R * 1.15, R * 0.08, 48), gloss(plateCol, 1, 0.18)); plate.position.y = R * 0.04; plate.castShadow = plate.receiveShadow = true; g.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 1.24, R * 0.02, 8, 64), gloss("#c8a030", 1, 0.25)); rim.rotation.x = Math.PI / 2; rim.position.y = R * 0.082; g.add(rim);
  const spongeM = std("#d8a45a", 0.85);
  const sponge = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.08, R * 1.1, R * 0.26, 48), spongeM); sponge.position.y = R * 0.08 + R * 0.13; sponge.castShadow = true; g.add(sponge);
  const base = R * 0.08 + R * 0.26;
  // ---- the meringue: a smooth dome (two versions: whole, and with a 70-degree wedge spooned out) covered in piped
  // "kisses" (teardrop peaks with a curled tip) on rings; the tips brown first and char black (shader on the kiss height)
  const WEDGE = 1.25;
  const bakeU = { uBake: { value: 0 }, uChar: { value: 0 } };
  const tipMat = (base: string) => {
    const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.55, envMapIntensity: 0.6 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uBake = bakeU.uBake; sh.uniforms.uChar = bakeU.uChar;
      sh.vertexShader = "attribute float tipK; varying float vTip;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vTip = tipK;");
      sh.fragmentShader = "uniform float uBake; uniform float uChar; varying float vTip;\n" + sh.fragmentShader.replace("#include <color_fragment>",
        `#include <color_fragment>
        float kb = clamp(uBake * (0.62 + 0.75 * vTip), 0.0, 1.0);
        // linear-space colours (sRGB #e0a85c gold, #8c4a1c toasted brown, #24150c char)
        vec3 gold = vec3(0.745, 0.392, 0.107), brown = vec3(0.262, 0.069, 0.012), blk = vec3(0.018, 0.008, 0.004);
        diffuseColor.rgb = mix(diffuseColor.rgb, gold, smoothstep(0.0, 0.6, kb)); diffuseColor.rgb = mix(diffuseColor.rgb, brown, smoothstep(0.55, 1.0, kb));
        diffuseColor.rgb = mix(diffuseColor.rgb, blk, uChar * smoothstep(0.7, 0.98, vTip));`);
    };
    return m;
  };
  const domeGeo = (phiLen: number) => { const g2 = new THREE.SphereGeometry(R * 0.98, 64, 32, 0, phiLen, 0, Math.PI / 2); const p = g2.attributes.position as THREE.BufferAttribute; const tk = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { p.setY(i, p.getY(i) * 1.02); tk[i] = 0.25 * cl(p.getY(i) / R); } g2.computeVertexNormals(); g2.setAttribute("tipK", new THREE.BufferAttribute(tk, 1)); return g2; };
  const kissGeo = (() => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(new THREE.Vector2(R * 0.215 * Math.pow(Math.sin(Math.PI * (1 - u) * 0.62 + 0.38 * Math.PI * (1 - u)), 1.2) * (1 - u * 0.9), R * 0.24 * u)); }
    const g2 = new THREE.LatheGeometry(pts, 10); const p = g2.attributes.position as THREE.BufferAttribute; const tk = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / (R * 0.24); tk[i] = y; p.setX(i, p.getX(i) + R * 0.07 * y * y); }   // the curled tip leans
    g2.computeVertexNormals(); g2.setAttribute("tipK", new THREE.BufferAttribute(tk, 1)); return g2; })();
  const merM = tipMat("#fbfaf6");
  const kissesFor = (phiLen: number) => {
    const list: THREE.Matrix4[] = []; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (let ring = 0; ring < 6; ring++) { const b = (ring / 6) * (Math.PI / 2) * 0.96 + 0.05, n = Math.max(1, Math.round(22 * Math.cos(b) + 1));
      for (let k = 0; k < n; k++) { const a = (k + (ring % 2) * 0.5) / n * TAU; if (a > phiLen - 0.12) continue;
        const nrm = new THREE.Vector3(Math.cos(b) * Math.cos(a), Math.sin(b), -Math.cos(b) * Math.sin(a));
        const pos = nrm.clone().multiplyScalar(R * 0.95); pos.y *= 1.02;
        Q.setFromUnitVectors(up, nrm); const tw = new THREE.Quaternion().setFromAxisAngle(nrm, a * 3 + ring); Q.premultiply(tw);
        const sc = 0.85 + 0.35 * hsh(ring * 31 + k); M.compose(pos, Q, new THREE.Vector3(sc, sc * (0.9 + 0.3 * hsh(k * 7 + ring)), sc)); list.push(M.clone()); } }
    const top = new THREE.Matrix4().compose(new THREE.Vector3(0, R * 0.99, 0), new THREE.Quaternion(), new THREE.Vector3(1.3, 1.5, 1.3)); if (phiLen > TAU - 0.01) list.push(top);
    const im = new THREE.InstancedMesh(kissGeo, merM, list.length); list.forEach((m2, i) => im.setMatrixAt(i, m2)); im.castShadow = true; im.receiveShadow = true; return im;
  };
  const domeW = new THREE.Group(), domeC = new THREE.Group();
  domeW.add(new THREE.Mesh(domeGeo(TAU), merM), kissesFor(TAU)); domeC.add(new THREE.Mesh(domeGeo(TAU - WEDGE), merM), kissesFor(TAU - WEDGE));
  for (const m of [domeW, domeC]) { m.position.y = base; m.traverse((x) => { if ((x as THREE.Mesh).isMesh) { x.castShadow = true; x.receiveShadow = true; } }); g.add(m); }
  domeC.rotation.y = 0.35;
  // the cut faces: two vertical half-discs at the wedge edges showing meringue band / ice cream core / a strawberry ribbon
  const coreT = canvasTex("alaskaCore", 512, 256, (c) => {
    c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, 512, 256);
    // meringue band with bubbles (outer 28%)
    for (let i = 0; i < 260; i++) { const x = hsh(i + 0.3) * 512, y = hsh(i + 9.1) * 250, r = 2 + 5 * hsh(i + 4.4); c.strokeStyle = "rgba(200,200,210,0.6)"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
    // the ice cream core: an ellipse, vanilla with a strawberry ribbon, frost glints
    c.save(); c.beginPath(); c.ellipse(256, 256, 190, 172, 0, Math.PI, TAU); c.closePath(); c.clip();
    const gr = c.createLinearGradient(0, 80, 0, 256); gr.addColorStop(0, "#f7efe0"); gr.addColorStop(1, "#efe2c6"); c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
    c.strokeStyle = "#e0708a"; c.lineWidth = 16; c.beginPath(); for (let x = 60; x < 460; x += 8) c.lineTo(x, 190 + 22 * Math.sin(x * 0.03)); c.stroke();
    c.strokeStyle = "#c84a66"; c.lineWidth = 5; c.beginPath(); for (let x = 60; x < 460; x += 8) c.lineTo(x, 186 + 22 * Math.sin(x * 0.03)); c.stroke();
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(220,240,255,${0.5 + 0.5 * hsh(i + 2.2)})`; const x = 70 + hsh(i + 5.5) * 370, y = 90 + hsh(i + 7.7) * 160; c.fillRect(x, y, 2 + 3 * hsh(i), 2); }
    c.restore();
    c.strokeStyle = "rgba(150,170,190,0.5)"; c.lineWidth = 3; c.beginPath(); c.ellipse(256, 256, 190, 172, 0, Math.PI, TAU); c.stroke();
  });
  const faceM = new THREE.MeshStandardMaterial({ map: coreT, roughness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.5 });
  const half = new THREE.CircleGeometry(R * 1.02, 48, 0, Math.PI); // in XY, upper half
  const faceA = new THREE.Mesh(half, faceM), faceB = new THREE.Mesh(half, faceM);
  const cutG = new THREE.Group(); cutG.position.y = base; cutG.rotation.y = 0.35; g.add(cutG);
  faceA.rotation.y = Math.PI; cutG.add(faceA);                          // the wedge edge at sphere phi = 0 (three's sphere: x = -cos phi, z = sin phi)
  faceB.rotation.y = Math.PI + (TAU - WEDGE); cutG.add(faceB);        // the edge at phi = TAU - WEDGE
  faceA.scale.set(1, 1.05, 1); faceB.scale.set(1, 1.05, 1);
  // frost glints + cold mist cards at the opening
  const frostM = new THREE.MeshBasicMaterial({ color: "#eaf6ff", transparent: true, opacity: 0, depthWrite: false });
  const frost: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(R * (0.18 + 0.12 * hsh(i + 3)), 10, 8), frostM.clone()); cutG.add(m); frost.push(m); }
  // the ice cream block that the meringue is heaped on (heap 0 shows the block)
  const block = new THREE.Mesh(rbox(R * 1.2, R * 0.8, R * 1.2, R * 0.12), std("#f6efe0", 0.5)); block.position.y = base + R * 0.4; block.castShadow = true; g.add(block);
  const set: Alaska["set"] = (o) => {
    const bake = o.bake ?? 0, char = o.char ?? 0, crack = o.crack ?? 0, heap = o.heap ?? 1, fr = o.frost ?? 0;
    bakeU.uBake.value = bake; bakeU.uChar.value = char;
    const cracked = crack > 0.5;
    domeW.visible = !cracked && heap > 0.02; domeC.visible = cracked; cutG.visible = cracked;
    const hs = cl(heap); domeW.scale.set(lerp(0.55, 1, hs), lerp(0.4, 1, sm(hs)), lerp(0.55, 1, hs));
    block.visible = heap > -0.5 && heap < 0.99 && !cracked; sponge.visible = heap > -0.5; block.scale.setScalar(1 - 0.12 * hs);
    frost.forEach((m, i) => { const a = (i / 5) * WEDGE + 0.1, rr = R * (0.35 + 0.45 * hsh(i + 1)); m.position.set(-Math.cos(TAU - a) * rr * 0.6, R * (0.25 + 0.35 * hsh(i + 7)), Math.sin(TAU - a) * rr * 0.6); m.scale.setScalar(0.6 + 0.6 * fr); (m.material as THREE.MeshBasicMaterial).opacity = 0.22 * fr; m.visible = fr > 0.01; });
  };
  set({});
  return { g, set, R, H: base + R * 1.25 };
};

// ---------------------------------------------------------------- shader flames ----------------------------------------------
/** view-facing flame tongues (instanced quads expanded in view space). Each tongue rises, flickers and fades; colour runs
 *  blue at the root -> orange -> pale yellow at the tips. add(): a cluster at a point; k scales size and brightness. */
export type Flames = { mesh: THREE.Mesh; set: (t: number, k: number, centre?: V3, spread?: number, height?: number) => void };
export const flames = (n = 48, seed = 1, blueBase = 0.35): Flames => {
  const quad = new THREE.PlaneGeometry(1, 1, 1, 4); quad.translate(0, 0.5, 0);
  const geo = new THREE.InstancedBufferGeometry(); geo.index = quad.index; geo.attributes.position = quad.attributes.position; geo.attributes.uv = quad.attributes.uv;
  const off = new Float32Array(n * 3), prm = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const a = hsh(i * 3.1 + seed) * TAU, r = Math.sqrt(hsh(i * 7.3 + seed)); off.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3); prm.set([hsh(i + seed * 9.1), 0.5 + 0.8 * hsh(i * 2.7 + seed), 0.6 + 0.8 * hsh(i * 5.3 + seed), hsh(i * 1.9 + seed)], i * 4); }
  geo.setAttribute("iOff", new THREE.InstancedBufferAttribute(off, 3)); geo.setAttribute("iPrm", new THREE.InstancedBufferAttribute(prm, 4)); geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uK: { value: 0 }, uC: { value: new THREE.Vector3() }, uS: { value: 0.1 }, uH: { value: 0.2 }, uBlue: { value: blueBase } },
    vertexShader: `attribute vec3 iOff; attribute vec4 iPrm; uniform float uT, uK, uS, uH; uniform vec3 uC; varying vec2 vUv; varying float vA, vY;
      void main(){ float ph = fract(uT * (0.9 + iPrm.y) + iPrm.x); float life = sin(ph * 3.14159);
        vec3 c = uC + iOff * uS + vec3(0.0, ph * uH * 0.55, 0.0);
        vec4 mv = modelViewMatrix * vec4(c, 1.0);
        float w = uS * (0.55 + 0.6 * iPrm.z) * (0.4 + 0.6 * life) * uK, h = uH * (0.6 + 0.7 * iPrm.z) * (0.3 + 0.7 * life) * uK;
        float sway = sin(uT * 9.0 + iPrm.w * 20.0 + position.y * 4.0) * 0.18 * w * position.y;
        mv.xy += vec2(position.x * w + sway, position.y * h);
        vUv = uv; vA = life; vY = position.y; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT, uBlue; varying vec2 vUv; varying float vA, vY;
      void main(){ float x = (vUv.x - 0.5) * 2.0; float y = vUv.y;
        float wob = sin(y * 9.0 - uT * 14.0 + vA * 6.0) * 0.12 * y;
        float body = 1.0 - smoothstep(0.0, 1.0, abs(x + wob) / max(0.05, (1.0 - y) * 0.95 + 0.05));
        float a = body * smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.55, 1.0, y)) * vA;
        vec3 blue = vec3(0.25, 0.45, 1.0), org = vec3(1.0, 0.45, 0.08), yel = vec3(1.0, 0.86, 0.45);
        vec3 col = mix(blue, org, smoothstep(0.0, uBlue, y)); col = mix(col, yel, smoothstep(0.5, 0.95, y) * 0.5 + (1.0 - abs(x)) * 0.15);
        gl_FragColor = vec4(col * 0.9 * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  const set: Flames["set"] = (t, k, centre, spread, height) => {
    mat.uniforms.uT.value = t; mat.uniforms.uK.value = k; mesh.visible = k > 0.005;
    if (centre) mat.uniforms.uC.value.set(centre[0], centre[1], centre[2]);
    if (spread !== undefined) mat.uniforms.uS.value = spread; if (height !== undefined) mat.uniforms.uH.value = height;
  };
  return { mesh, set };
};

// ---------------------------------------------------------------- puffs (smoke / fire) --------------------------------------
/** lit 3D puffs that rise and grow from a source (smoke: grey; fire: emissive orange, additive). age in seconds. */
export type Puffs = { g: THREE.Group; set: (age: number, src: V3, k?: number, dir?: V3) => void };
export const puffs = (n: number, kind: "smoke" | "fire", seed = 1): Puffs => {
  const g = new THREE.Group(); const list: { m: THREE.Mesh; d: V3; s: number; dl: number }[] = [];
  for (let i = 0; i < n; i++) {
    const mt = kind === "smoke" ? new THREE.MeshStandardMaterial({ color: i % 3 ? "#8a8a8e" : "#a8a8ac", roughness: 1, transparent: true, opacity: 0, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? "#ffc060" : i % 2 ? "#ff6a14" : "#ff9a2a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mt); m.visible = false; g.add(m);
    const a = hsh(i * 2.3 + seed) * TAU, r = hsh(i * 5.1 + seed);
    list.push({ m, d: [Math.cos(a) * r, 0.6 + 0.9 * hsh(i * 7.7 + seed), Math.sin(a) * r], s: 0.5 + 0.8 * hsh(i * 3.3 + seed), dl: hsh(i * 1.7 + seed) * 0.6 });
  }
  const set: Puffs["set"] = (age, src, k = 1, dir = [0, 1, 0]) => {
    for (const p of list) {
      const tt = age - p.dl; const on = tt > 0 && k > 0.01; p.m.visible = on; if (!on) continue;
      const life = kind === "smoke" ? 2.6 : 0.9, u = cl(tt / life);
      const sp = kind === "smoke" ? 0.55 : 0.9;
      p.m.position.set(src[0] + (p.d[0] * 0.35 + dir[0]) * tt * sp * k, src[1] + (p.d[1] * dir[1] + 0.2) * tt * sp * k, src[2] + (p.d[2] * 0.35 + dir[2]) * tt * sp * k);
      const sc = (kind === "smoke" ? 0.08 + 0.34 * u : 0.05 + 0.22 * Math.sin(u * Math.PI)) * p.s * k; p.m.scale.set(sc, sc * 0.9, sc);
      (p.m.material as THREE.MeshBasicMaterial).opacity = (kind === "smoke" ? 0.55 * (1 - u) * sm(tt, 0, 0.25) : 0.22 * (1 - u)) ;
    }
  };
  return { g, set };
};

// ---------------------------------------------------------------- falling snow ----------------------------------------------
export type Snow = { mesh: THREE.InstancedMesh; set: (t: number, k: number) => void };
export const snow = (n: number, box: [V3, V3], seed = 1): Snow => {
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#f4f8ff", roughness: 0.7, emissive: "#9fb4d8", emissiveIntensity: 0.25 }), n);
  mesh.frustumCulled = false; mesh.castShadow = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
  const [a, b] = box, H = b[1] - a[1];
  const set: Snow["set"] = (t, k) => {
    mesh.visible = k > 0.01; if (!mesh.visible) return;
    for (let i = 0; i < n; i++) {
      const x0 = a[0] + hsh(i * 1.3 + seed) * (b[0] - a[0]), z0 = a[2] + hsh(i * 2.9 + seed) * (b[2] - a[2]), sp = 0.55 + 0.5 * hsh(i * 4.1 + seed);
      const y = b[1] - ((t * sp + hsh(i * 6.7 + seed) * H) % H);
      P.set(x0 + 0.25 * Math.sin(t * 0.9 + i) + 0.4 * Math.sin(t * 0.31 + i * 0.7), y, z0 + 0.2 * Math.cos(t * 0.7 + i * 1.3));
      const s = (0.006 + 0.008 * hsh(i * 8.3 + seed)) * k; S.set(s, s * 0.7, s); Q.setFromAxisAngle(P.clone().normalize(), t + i);
      M.compose(P, Q, S); mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return { mesh, set };
};

// ---------------------------------------------------------------- props --------------------------------------------------------
/** the yellow mop bucket on casters with its wringer and a mop standing in it */
export const mopBucket = () => {
  const g = new THREE.Group(); const yel = gloss("#f2c21a", 0.6, 0.35), grey = std("#3a3a3e", 0.6, 0.2), steel = std("#b8bcc2", 0.35, 0.8);
  const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.36, 32, 1, true), yel); tub.position.y = 0.26; g.add(tub);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), yel); bot.rotation.x = -Math.PI / 2; bot.position.y = 0.08; g.add(bot);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.018, 8, 40), yel); lip.rotation.x = Math.PI / 2; lip.position.y = 0.44; g.add(lip);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.19, 32), new THREE.MeshStandardMaterial({ color: "#7a8a8a", roughness: 0.15, transparent: true, opacity: 0.8 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.3; g.add(water);
  const wr = new THREE.Mesh(rbox(0.22, 0.16, 0.16, 0.02), grey); wr.position.set(0.1, 0.5, 0); g.add(wr);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8), steel); lever.position.set(0.18, 0.74, 0); lever.rotation.z = -0.35; g.add(lever);
  for (const [x, z] of [[0.15, 0.12], [-0.15, 0.12], [0.15, -0.12], [-0.15, -0.12]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), grey); c.position.set(x, 0.03, z); g.add(c); }
  const sign = canvasTex("mopSign", 256, 64, (c) => { c.fillStyle = "#f2c21a"; c.fillRect(0, 0, 256, 64); c.fillStyle = "#1a1a1a"; c.font = "bold 34px sans-serif"; c.textAlign = "center"; c.fillText("WET  FLOOR", 128, 44); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.055), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.5 })); lab.position.set(0, 0.24, 0.192); g.add(lab);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.3, 8), std("#c8b080", 0.6)); stick.position.set(-0.05, 0.85, -0.02); stick.rotation.z = 0.12; g.add(stick);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.12, 14), std("#e8e2d0", 0.95)); head.position.set(-0.03, 0.27, -0.02); g.add(head);
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
};
/** a wooden pizza / oven peel: a thin blade and a long round handle along +x from the origin (the blade centre at x=0) */
export const peel = (wood: THREE.Material) => {
  const g = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(-0.2, -0.17); shape.lineTo(0.12, -0.17); shape.quadraticCurveTo(0.24, -0.1, 0.25, 0); shape.quadraticCurveTo(0.24, 0.1, 0.12, 0.17); shape.lineTo(-0.2, 0.17); shape.quadraticCurveTo(-0.27, 0.0, -0.2, -0.17);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), wood);
  blade.rotation.x = -Math.PI / 2; blade.rotation.z = Math.PI; g.add(blade);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.95, 12), wood); handle.rotation.z = Math.PI / 2; handle.position.set(0.7, 0.008, 0); g.add(handle);
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
};
/** a steel mixing bowl full of glossy whipped egg whites, with a whisk in it */
export const meringueBowl = () => {
  const g = new THREE.Group(); const steel = new THREE.MeshStandardMaterial({ color: "#d4d8de", roughness: 0.22, metalness: 1 });
  const pts = Array.from({ length: 16 }, (_, i) => { const u = i / 15; return new THREE.Vector2(0.03 + 0.17 * Math.sin(u * Math.PI / 2), 0.13 * (1 - Math.cos(u * Math.PI / 2))); });
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), steel); bowl.material.side = THREE.DoubleSide; g.add(bowl);
  const foam = new THREE.Mesh(new THREE.SphereGeometry(0.175, 40, 20, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#fbfaf6", roughness: 0.5 }));
  { const p = foam.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * 0.35 + 0.08 * Math.pow(Math.max(0, Math.sin(p.getX(i) * 40) * Math.sin(p.getZ(i) * 37)), 4) * (y > 0.02 ? 1 : 0)); } foam.geometry.computeVertexNormals(); }
  foam.position.y = 0.1; g.add(foam);
  const wh = new THREE.Group(); for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.003, 6, 24, Math.PI), steel); w.rotation.set(Math.PI / 2, i * Math.PI / 6, 0); w.scale.set(1, 1, 2.2); wh.add(w); }
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.2, 10), std("#2a2a2a", 0.5)); hd.position.y = 0.1; wh.add(hd); wh.position.set(0.05, 0.14, 0); wh.rotation.z = -0.6; g.add(wh);
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
};
/** a small copper pan with a long handle (for the hot rum) */
export const copperPan = () => {
  const g = new THREE.Group(); const cu = new THREE.MeshStandardMaterial({ color: "#c8743a", roughness: 0.3, metalness: 1 });
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.05, 28, 1, true), cu); cu.side = THREE.DoubleSide; pan.position.y = 0.025; g.add(pan);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(0.065, 28), cu); bot.rotation.x = -Math.PI / 2; g.add(bot);
  const rum = new THREE.Mesh(new THREE.CircleGeometry(0.068, 28), new THREE.MeshStandardMaterial({ color: "#8a3a10", roughness: 0.1, emissive: "#3a1004", emissiveIntensity: 0.4 })); rum.rotation.x = -Math.PI / 2; rum.position.y = 0.03; g.add(rum);
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.22, 8), std("#3a2a1a", 0.6)); h.rotation.z = Math.PI / 2; h.position.set(0.18, 0.04, 0); g.add(h);
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
  return g;
};

// ---------------------------------------------------------------- printed textures --------------------------------------------
export const SERIF = "Georgia, 'Times New Roman', serif";
/** the framed review on the kitchen wall: "TOO WET." over a photo of a soup bowl, one star of five */
export const tooWetTex = () => canvasTex("tooWet", 512, 640, (c) => {
  c.fillStyle = "#efe8d4"; c.fillRect(0, 0, 512, 640);
  c.fillStyle = "#1a1a1a"; c.font = `bold 44px ${SERIF}`; c.textAlign = "center"; c.fillText("THE DAILY FORK", 256, 62);
  c.fillRect(30, 76, 452, 4); c.fillRect(30, 84, 452, 1.5);
  c.font = `bold 96px ${SERIF}`; c.fillText("“TOO WET.”", 256, 186);
  // photo: a bowl of soup
  c.fillStyle = "#c8c0ac"; c.fillRect(70, 210, 372, 230); c.fillStyle = "#5a4e3e"; c.fillRect(70, 210, 372, 230);
  c.fillStyle = "#e8e4dc"; c.beginPath(); c.ellipse(256, 345, 150, 62, 0, 0, TAU); c.fill(); c.fillStyle = "#c8782a"; c.beginPath(); c.ellipse(256, 335, 122, 44, 0, 0, TAU); c.fill();
  c.fillStyle = "#e8a050"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(196 + i * 14, 330 + 8 * Math.sin(i), 6, 0, TAU); c.fill(); }
  c.fillStyle = "#1a1a1a"; c.font = `64px ${SERIF}`; c.fillText("★☆☆☆☆", 256, 520);
  c.font = `22px ${SERIF}`; c.fillStyle = "#3a3a3a"; for (let i = 0; i < 3; i++) c.fillRect(60, 556 + i * 22, 392, 8);
});
/** the review taped to the boarded-up restaurant next door: one star, "AVOID." */
export const avoidTex = () => canvasTex("avoidRev", 512, 680, (c) => {
  c.fillStyle = "#efe8d4"; c.fillRect(0, 0, 512, 680); c.fillStyle = "#1a1a1a"; c.font = `bold 42px ${SERIF}`; c.textAlign = "center"; c.fillText("THE DAILY FORK", 256, 60); c.fillRect(30, 74, 452, 4);
  c.font = `bold 110px ${SERIF}`; c.fillText("AVOID.", 256, 200); c.font = `76px ${SERIF}`; c.fillText("★☆☆☆☆", 256, 300);
  c.fillStyle = "#4a4a4a"; for (let i = 0; i < 12; i++) c.fillRect(50, 340 + i * 26, 412 - (i % 3) * 40, 9);
  c.fillStyle = "rgba(240,230,200,0.75)"; c.fillRect(200, -6, 112, 40); c.fillRect(200, 646, 112, 40);
});
/** the specials chalkboard: n letters of BAKED ALASKA chalked under the old line */
export const chalkTex = (n: number) => canvasTex(`chalk${n}`, 512, 768, (c) => {
  c.fillStyle = "#1e2a24"; c.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(255,255,255,${0.02 + 0.03 * hsh(i)})`; c.fillRect(hsh(i + 1.1) * 512, hsh(i + 2.2) * 768, 20 + 40 * hsh(i + 3.3), 2); }
  c.fillStyle = "#f4f0e6"; c.textAlign = "center"; c.font = "bold 64px 'Comic Sans MS', 'Chalkboard', cursive"; c.fillText("TONIGHT", 256, 100);
  c.font = "44px 'Comic Sans MS', cursive"; c.fillText("Soup of the day", 256, 190); c.fillText("Roast chicken", 256, 260);
  c.strokeStyle = "#f4f0e6"; c.lineWidth = 3; c.beginPath(); c.moveTo(90, 300); c.lineTo(422, 300); c.stroke();
  c.fillStyle = "#ffd890"; c.font = "bold 66px 'Comic Sans MS', cursive"; const t = "BAKED", u = "ALASKA";
  const s1 = t.slice(0, Math.min(n, 5)), s2 = u.slice(0, Math.max(0, n - 5)); c.textAlign = "left";
  c.fillText(s1, 256 - c.measureText(t).width / 2, 420); c.fillText(s2, 256 - c.measureText(u).width / 2, 510);
  if (n >= 11) { c.fillStyle = "#f4f0e6"; c.font = "44px 'Comic Sans MS', cursive"; c.textAlign = "center"; c.fillText("★★★★★", 256, 600); }
});
/** the dining menu stand on the critic's table */
export const menuTex = () => canvasTex("bsMenu", 256, 360, (c) => {
  c.fillStyle = "#f4ecd8"; c.fillRect(0, 0, 256, 360); c.strokeStyle = "#8a6a2a"; c.lineWidth = 6; c.strokeRect(10, 10, 236, 340);
  c.fillStyle = "#3a2a1a"; c.textAlign = "center"; c.font = `bold 30px ${SERIF}`; c.fillText("MENU", 128, 56);
  c.font = `20px ${SERIF}`; ["Soup", "Fish", "Chicken"].forEach((s, i) => c.fillText(s, 128, 104 + i * 38));
  c.fillStyle = "#a8282a"; c.font = `bold 40px ${SERIF}`; c.fillText("DESSERT", 128, 270);
});
/** the oven thermometer dial: 0-600 with the needle drawn separately */
export const dialTex = () => canvasTex("ovenDial", 256, 256, (c) => {
  c.fillStyle = "#f2eee2"; c.beginPath(); c.arc(128, 128, 120, 0, TAU); c.fill(); c.strokeStyle = "#2a2a2a"; c.lineWidth = 8; c.stroke();
  c.fillStyle = "#1a1a1a"; c.textAlign = "center"; c.font = "bold 30px sans-serif";
  for (let v = 0; v <= 600; v += 100) { const a = Math.PI * 0.75 + (v / 600) * Math.PI * 1.5; c.fillText(String(v), 128 + Math.cos(a) * 84, 140 + Math.sin(a) * 84); c.fillRect(128 + Math.cos(a) * 104 - 3, 128 + Math.sin(a) * 104 - 3, 6, 6); }
  c.fillStyle = "#c8342a"; c.beginPath(); const a5 = Math.PI * 0.75 + (500 / 600) * Math.PI * 1.5; c.arc(128 + Math.cos(a5) * 104, 128 + Math.sin(a5) * 104, 9, 0, TAU); c.fill();
  c.fillStyle = "#c8342a"; c.font = "bold 22px sans-serif"; c.fillText("°F", 128, 196);
});
/** the gold-leaf restaurant name on the window glass (transparent background) */
export const windowNameTex = () => canvasTex("bsWinName", 1024, 256, (c) => {
  c.clearRect(0, 0, 1024, 256); c.textAlign = "center"; c.fillStyle = "#e8c060"; c.strokeStyle = "#6a4a10"; c.lineWidth = 6;
  c.font = `bold 110px ${SERIF}`; c.strokeText("The Copper Spoon", 512, 140); c.fillText("The Copper Spoon", 512, 140);
  c.font = `italic 44px ${SERIF}`; c.fillText("fine dining", 512, 210);
});
