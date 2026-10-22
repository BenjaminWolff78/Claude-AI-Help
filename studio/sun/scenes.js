/* The Long Way Out — scenes. render(t) builds one frame description and draws it. */
'use strict';
const TS = TL.scenes;
const beatPulse = t => Math.exp(-(((t % .5) + .5) % .5) / .09);
const bell = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
const rotInv = (ry, rx = 0) => M.inv(M.trs([0, 0, 0], ry, rx));
const rotOf = (ry, rx = 0) => M.trs([0, 0, 0], ry, rx);
const xfd = (m, d) => { const r = M.xf(m, d); return [r[0], r[1], r[2]]; };
const xdir = (m, d) => [m[0] * d[0] + m[4] * d[1] + m[8] * d[2], m[1] * d[0] + m[5] * d[1] + m[9] * d[2], m[2] * d[0] + m[6] * d[1] + m[10] * d[2]];
function slerp(a, b, u) { const d = clamp(V.dot(a, b), -1, 1), th = Math.acos(d); if (th < 1e-4) return V.norm(V.lerp(a, b, u)); const s = Math.sin(th); return V.add(V.mul(a, Math.sin((1 - u) * th) / s), V.mul(b, Math.sin(u * th) / s)); }
const logLerp = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), u));
function basis(pos, x, y, z, s) { return [x[0] * s, x[1] * s, x[2] * s, 0, y[0] * s, y[1] * s, y[2] * s, 0, z[0] * s, z[1] * s, z[2] * s, 0, pos[0], pos[1], pos[2], 1]; }
function facing(pos, toward, up, s) { const z = V.norm(V.sub(toward, pos)), x = V.norm(V.cross(up, z)), y = V.cross(z, x); return basis(pos, x, y, z, s); }

/* ---------- instance buffers ---------- */
const BALLS = new Float32Array(8 * 6000), SPARKS = new Float32Array(8 * 14000), STREAKS = new Float32Array(8 * 4000);
function ball(F, p, r, col, em = 0) { const o = F.nb++ * 8; BALLS[o] = p[0]; BALLS[o + 1] = p[1]; BALLS[o + 2] = p[2]; BALLS[o + 3] = r; BALLS[o + 4] = col[0]; BALLS[o + 5] = col[1]; BALLS[o + 6] = col[2]; BALLS[o + 7] = em; }
function spark(F, p, s, col, a) { if (a <= .002) return; const o = F.ns++ * 8; SPARKS[o] = p[0]; SPARKS[o + 1] = p[1]; SPARKS[o + 2] = p[2]; SPARKS[o + 3] = s; SPARKS[o + 4] = col[0]; SPARKS[o + 5] = col[1]; SPARKS[o + 6] = col[2]; SPARKS[o + 7] = a; }
function streak(F, p, d, len, b) { if (b <= .002) return; const o = F.nst++ * 8; STREAKS[o] = p[0]; STREAKS[o + 1] = p[1]; STREAKS[o + 2] = p[2]; STREAKS[o + 3] = len; STREAKS[o + 4] = d[0]; STREAKS[o + 5] = d[1]; STREAKS[o + 6] = d[2]; STREAKS[o + 7] = b; }

function newFrame() {
  return {cam: {eye: [0, 0, 3], tgt: [0, 0, 0], up: [0, 1, 0], fov: 40, near: .01, far: 200},
    bg: {space: 1, plasma: 0, ink: 0, dots: 0, pOff: [0, 0, 0]}, glows: [], sun: null, earth: null,
    balls: BALLS, nb: 0, sparks: SPARKS, ns: 0, streaks: STREAKS, nst: 0, ribbons: [], types: [],
    post: {bloom: .85, thr: .9, exp: 1, flash: 0, flashCol: CV.cream, vig: .5, ca: .012, grain: .055}, labels: [], kickers: []};
}
function corona(F, c, r, k = 1) {
  F.glows.push({c, r, col: cmix(CV.amber, CV.coral, .3), k: .9 * k, fall: 7, wisp: 0});
  F.glows.push({c, r, col: CV.coral, k: .32 * k, fall: 1.5, wisp: 1.1});
}

/* ---------- extruded type ---------- */
const mc = document.createElement('canvas').getContext('2d');
const GL_LAY = {};
function glyphs(str, track = -0.03, weight = 900) {
  const key = str + track + weight; if (GL_LAY[key]) return GL_LAY[key];
  mc.font = `${weight} 100px ${DISPLAY}`; mc.letterSpacing = (track * 100) + 'px';
  const total = mc.measureText(str).width / 100, out = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === ' ') continue;
    const x0 = mc.measureText(str.slice(0, i)).width / 100, x1 = mc.measureText(str.slice(0, i + 1)).width / 100;
    const T = typeTex(str[i], 220, weight);
    out.push({ch: str[i], tex: T.t, aspect: T.aspect, cx: (x0 + x1) / 2 - total / 2, i: out.length});
  }
  return (GL_LAY[key] = {g: out, w: total});
}
// B: base matrix; anim(i, n) -> {dx, dy, dz, ry, rx, s, alpha, glow}
function type3d(F, str, B, o = {}) {
  const L = glyphs(str, o.track == null ? -0.03 : o.track), n = L.g.length;
  const letters = [];
  for (const g of L.g) {
    const a = o.anim ? o.anim(g.i, n) : {};
    if ((a.alpha == null ? 1 : a.alpha) <= 0) continue;
    const s = a.s == null ? 1 : a.s;
    const m = M.mul(B, M.trs([g.cx + (a.dx || 0), (a.dy || 0), (a.dz || 0)], a.ry || 0, a.rx || 0, s, a.rz || 0));
    letters.push({tex: g.tex, aspect: g.aspect, M: m, alpha: a.alpha == null ? 1 : a.alpha, glow: a.glow || 0});
  }
  F.types.push({letters, depth: o.depth || .2, face: o.face || CV.cream, face2: o.face2 || cmix(CV.cream, CV.amber, .45), side: o.side || CV.coral, slices: o.slices || 24});
}
function camAttached(F, local) { const K = camera(F.cam); return M.mul(K.invV, local); }

/* ================= HOOK 0-16 ================= */
const S0 = V.norm([.1, .75, .65]);
const SF = V.norm(V.cross([1, 0, 0], S0));
function hookCam(t) {
  const e0 = V.lerp([.3, .2, 3.1], [.24, .18, 2.72], E.inOutSine(clamp(t / 10)));
  const u = I(t, 10, 12.9, 0, 1, E.inOutQuint);
  const glide = Math.max(0, t - 12.9) * .022;
  const sP = V.norm(V.add(S0, V.mul(SF, glide)));
  const fP = V.norm(V.cross([1, 0, 0], sP));
  const eS = V.mul(sP, 1.075), tS = V.add(V.mul(sP, 1.0), V.mul(fP, .62));
  const dir = slerp(V.norm(e0), sP, u), dist = logLerp(V.len(e0), 1.075, u);
  const eye = V.mul(dir, dist);
  const tgt = V.lerp([0, .03, 0], tS, I(t, 10.2, 12.9, 0, 1, E.inOutQuint));
  return {eye, tgt, up: V.norm(V.lerp([0, 1, 0], sP, u)), fov: lerp(38, 52, u), near: .002, far: 60, sP, fP};
}
function sHook(F, t) {
  const c = hookCam(t);
  F.cam = c;
  const half = 1 - I(t, 9.4, 10.7, 0, 1, E.inOutCubic);
  F.sun = {c: [0, 0, 0], r: 1, rot: rotInv(.6 + t * .03, .12), gran: 34, half, heat: lerp(1.0, .86, half), alpha: 1, lane: lerp(.45, .8, I(t, 11.5, 13))};
  corona(F, [0, 0, 0], 1, 1 - half * .55);
  F.post.bloom = lerp(.95, .45, half);
  // 170,000 YEARS flies at the camera
  if (t >= 10 && t < 13) {
    const z = t < 12.5 ? lerp(9, 2.7, E.outExpo(I(t, 10, 11.1))) - (t - 11.1 > 0 ? (t - 11.1) * .18 : 0) : lerp(2.45, .35, E.inCubic(I(t, 12.5, 12.95)));
    const B = camAttached(F, M.trs([0, .12, -z], .08 * Math.sin(t * 1.3), 0, .33));
    type3d(F, '170,000', B, {depth: .28, anim: (i, n) => ({ry: (1 - spring(t - 10 - i * .045, 120, 14)) * 1.4, dy: (1 - spring(t - 10 - i * .045, 120, 14)) * -.4})});
    const B2 = camAttached(F, M.trs([0, -.36, -z], .08 * Math.sin(t * 1.3), 0, .12));
    type3d(F, 'YEARS', B2, {depth: .3, track: .25, face: CV.lime, face2: cmix(CV.lime, CV.amber, .3), side: cmul(CV.lime, .5),
      anim: (i) => ({alpha: t > 10.5 + i * .05 ? 1 : 0, dy: (1 - spring(t - 10.5 - i * .05, 160, 15)) * -.5})});
  }
  // title over the surface
  if (t >= 13) {
    const T = V.add(V.add(V.mul(c.sP, 1.0), V.mul(c.fP, .5)), V.mul(c.sP, .085));
    const s = .07;
    const lines = [['THE LONG', .055], ['WAY OUT', -.03]];
    lines.forEach(([str, yy], li) => {
      const B = M.mul(facing(V.add(T, V.mul(c.sP, yy)), c.eye, c.sP, 1), M.trs([0, 0, 0], 0, 0, s));
      type3d(F, str, B, {depth: .3, anim: (i) => {
        const k = spring(t - 13.05 - li * .25 - i * .05, 150, 15);
        return {dy: (1 - k) * -1.2, rx: (1 - k) * .9, alpha: k > .01 ? 1 : 0};
      }});
    });
  }
  F.post.flash = bell(t, 16.0, .1);
}

/* ================= LEG 16-40: Earth back to the Sun ================= */
const EP = V.mul(V.norm([.35, .12, 1]), 22), EN = V.norm(EP), RE = .035;
const SIDE = V.norm(V.cross([0, 1, 0], EN));
const BEAM = (() => { const p = [], a = V.mul(EN, 1.0), b = V.sub(EP, V.mul(EN, RE)); for (let i = 0; i < 96; i++) { const u = i / 95; p.push(V.lerp(a, b, u * u * .0 + u)); } return ribbonData(p); })();
const DUST = (() => { const R = rng(7), d = []; for (let i = 0; i < 700; i++) { const D = logLerp(2.2, 23, R()), a = R() * 6.283, r = (.04 + R() * .9) * D / 9; d.push({D, a, r, b: .3 + R() * .7}); } return d; })();
const MARK = [['50 MILLION KM', 15], ['100 MILLION KM', 8], ['150 MILLION KM', 3.7]];
const AZ0 = Math.atan2(EN[2], EN[0]), EL0 = Math.asin(EN[1]);
function orbitEye(t) {
  const az = AZ0 + (t - 33.6) * .018, d = lerp(2.75, 3.5, I(t, 33.6, 41, 0, 1, E.inOutCubic)), el = I(t, 33.6, 41, EL0, .36, E.inOutCubic);
  return [d * Math.cos(el) * Math.cos(az), d * Math.sin(el), d * Math.cos(el) * Math.sin(az)];
}
function flightDist(t) { return logLerp(22.16, 2.75, E.inOutCubic(I(t, 21.6, 33.6))); }
function sLeg(F, t) {
  F.earth = {c: EP, r: RE, L: V.mul(EN, -1), rot: rotInv(1.2 + t * .02), hit: I(t, 18.6, 20.4), hitN: V.mul(EN, -1)};
  F.glows.push({c: EP, r: RE, col: CV.cyan, k: .45, fall: 22});
  F.sun = {c: [0, 0, 0], r: 1, rot: rotInv(.6 + t * .03, .12), gran: 34, heat: 1.05, alpha: 1};
  corona(F, [0, 0, 0], 1, 1);
  // camera
  const side = V.add(V.add(V.add(EP, V.mul(SIDE, .12)), [0, .028, 0]), V.mul(EN, .03));
  const rotA = (t - 16) * .03;
  const sideR = V.add(EP, xfd(rotOf(rotA), V.sub(side, EP)));
  const behind = V.add(V.add(EP, V.mul(EN, .17)), V.add(V.mul(SIDE, .05), [0, .035, 0]));
  let eye, tgt;
  if (t < 21.6) {
    const u = I(t, 20.4, 21.6, 0, 1, E.inOutCubic);
    eye = V.lerp(sideR, behind, u);
    tgt = V.lerp(EP, V.sub(EP, V.mul(EN, 2)), u);
  } else if (t < 33.6) {
    const D = flightDist(t), lat = .05 * clamp((D - 11) / 9);
    eye = V.add(V.add(V.mul(EN, D), V.mul(SIDE, lat)), [0, .035 * clamp((D - 8) / 12), 0]);
    eye = V.add(eye, V.mul(EN, .17 * clamp((D - 18) / 4)));
    tgt = V.lerp(V.sub(EP, V.mul(EN, 2)), [0, 0, 0], I(t, 21.6, 24, 0, 1, E.inOutCubic));
  } else { eye = orbitEye(t); tgt = [0, 0, 0]; }
  F.cam = {eye, tgt, up: [0, 1, 0], fov: 40, near: .002, far: 80};
  // the sunbeam
  const head = I(t, 17.0, 18.6, 0, 95, E.inCubic);
  F.ribbons.push({data: BEAM, head, w: 3.2, fade: t < 18.8 ? 14 : 0, k: t < 18.8 ? 1.6 : lerp(1.2, .5, I(t, 18.8, 20)), col: CV.lime, col2: cmul(CV.lime, .5)});
  if (t > 17 && t < 18.65) { const p = V.lerp(V.mul(EN, 1), V.sub(EP, V.mul(EN, RE)), head / 95); spark(F, p, .02 * V.len(V.sub(p, eye)), CV.lime, 1.4); }
  if (t > 18.6) spark(F, V.sub(EP, V.mul(EN, RE * 1.02)), .014, CV.lime, 2.2 * Math.exp(-(t - 18.6) * 2.5));
  // speed dust: streaks along the beam
  if (t > 21 && t < 34.5) {
    const speed = Math.abs(flightDist(t) - flightDist(t - 1 / 60)) * 60;
    for (const d of DUST) {
      const p = V.add(V.add(V.mul(EN, d.D), V.mul(SIDE, Math.cos(d.a) * d.r)), [0, Math.sin(d.a) * d.r, 0]);
      streak(F, p, EN, .02 + speed * .045, d.b * .55 * I(t, 21, 22.5) * (1 - I(t, 33, 34.5)));
    }
    F.streakCol = cmix(CV.cream, CV.amber, .3); F.streakW = 1.6;
  }
  // distance markers
  MARK.forEach(([str, D], k) => {
    const sc = D / 9;
    const pos = V.add(V.add(V.mul(EN, D), V.mul(SIDE, -.55 * sc)), [0, .17 * sc, 0]);
    const camD = V.len(V.sub(eye, pos));
    if (camD > 9 * sc || t < 21.6) return;
    const B = facing(pos, V.add(eye, V.mul(EN, 0)), [0, 1, 0], .12 * sc);
    const a = clamp((9 * sc - camD) / (2 * sc));
    type3d(F, str, B, {depth: .25, face: CV.cream, side: CV.violet, anim: (i) => ({alpha: a, dy: (1 - a) * -.8, ry: (1 - a) * .5})});
  });
  F.post.flash = bell(t, 16.0, .12) * .9;
}

/* ================= INSIDE 40-62: the cutaway ================= */
const OPEN = 1.75;
const AZW = AZ0 + (46 - 33.6) * .018;
const THETA = OPEN / 2 - AZW; // local angle a maps to world angle a - theta
const SUNROT = rotOf(THETA), SUNROTI = rotInv(THETA);
function labelAnchor(i) {
  const dB = [Math.cos(OPEN), 0, Math.sin(OPEN)];
  if (i === 0) return xfd(SUNROT, [.1 * Math.cos(.5), .1 * Math.sin(.5), 0]);
  if (i === 1) return xfd(SUNROT, V.add(V.mul(dB, .47 * Math.cos(.45)), [0, .47 * Math.sin(.45), 0]));
  if (i === 2) return xfd(SUNROT, [.85 * Math.cos(-.4), .85 * Math.sin(-.4), 0]);
  return xfd(SUNROT, V.norm(V.add(V.mul(dB, .55), [0, -.6, 0])));
}
function sInside(F, t) {
  const S = TS.inside;
  const open = I(t, S.open, S.open + 3, 0, OPEN, E.inOutCubic);
  const hi = [0, 0, 0, 0];
  TL.labels.forEach((lb, i) => { hi[i] = I(t, lb.t0, lb.t0 + .3) * (1 - I(t, lb.t0 + .6, lb.t0 + 1.8)) * .8; });
  F.sun = {c: [0, 0, 0], r: 1, rot: SUNROTI, open, gran: 34, heat: 1.05, alpha: 1, hi};
  corona(F, [0, 0, 0], 1, 1);
  let eye = orbitEye(t), tgt = [0, 0, 0], near = .01;
  if (t > S.push) {
    const u = I(t, S.push + .6, 62.05, 0, 1, E.inOutQuint);
    const bis = [Math.cos(OPEN / 2), 0, Math.sin(OPEN / 2)];
    const endE = xfd(SUNROT, V.mul(bis, .34)), endT = xfd(SUNROT, V.mul(bis, -.6));
    const d = logLerp(V.len(orbitEye(S.push)), .34, u);
    eye = V.mul(slerp(V.norm(orbitEye(S.push)), V.norm(endE), u), d);
    tgt = V.lerp([0, 0, 0], endT, u);
    near = .001;
  }
  F.cam = {eye, tgt, up: [0, 1, 0], fov: 40, near, far: 40};
  F.labels = TL.labels.map((lb, i) => ({lb, p: labelAnchor(i)}));
  const inn = I(t, 59.5, 61.6);
  F.post.bloom = lerp(.85, .35, inn); F.post.exp = lerp(1, .8, inn);
  F.post.flash = bell(t, 62.0, .22);
}

/* ================= CORE 62-88: fusion ================= */
const coreEye = t => [.12 * Math.sin(.21 * t), .06 * Math.sin(.17 * t), -.06 * (t - 62)];
const FC = V.add(coreEye(68.5), [0, 0, -1.4]);
const NUC = (() => { const R = rng(11), a = []; while (a.length < 340) { const dd = V.norm([R() - .5, R() - .5, R() - .5]), p = V.add(V.add(FC, [0, 0, 1.2]), V.mul(dd, .3 + Math.pow(R(), .5) * 4.5)); if (V.len(V.sub(p, FC)) < .75) continue; if (Math.hypot(p[0], p[1]) < .22 && p[2] < .3) continue; a.push({p, ph: [R() * 6.3, R() * 6.3, R() * 6.3], w: .6 + R() * .9, r: .045 + R() * .025, v: R() < .22}); } return a; })();
const TET = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(v => V.norm(v));
const FUS0 = TET.map((d, k) => V.add(FC, V.mul(xfd(rotOf(.7, .4), d), .46)));
const FIELD = (() => { const R = rng(23), a = []; while (a.length < 3200) { const d = V.norm([R() - .5, R() - .5, R() - .5]), r = 1.4 + Math.pow(R(), .6) * 34; a.push({p: V.add(FC, V.mul(d, r)), ph: R() * 6.3, w: .4 + R() * 1.4, c: R()}); } return a; })();
const RING = (() => { const p = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.2832; p.push([Math.cos(a), Math.sin(a), 0]); } return p; })();
const PHOT_DIR = V.norm([-.6, .25, .75]);
const DIVE = V.add(FC, [3.2, 1.1, -2.5]);
function fusionPos(k, t) {
  const S = TS.core;
  const jit = [.03 * Math.sin(t * 1.7 + k), .03 * Math.cos(t * 1.3 + k * 2), .03 * Math.sin(t * 1.1 + k * 3)];
  const start = V.add(FUS0[k], jit);
  const pairC = k < 2 ? V.add(FC, [-.17, .02, 0]) : V.add(FC, [.17, -.02, 0]);
  const pairP = V.add(pairC, [(k % 2 ? 1 : -1) * .058, 0, 0]);
  const u1 = I(t, S.converge, S.pair, 0, 1, E.inOutCubic);
  let p = V.lerp(start, pairP, u1);
  const u2 = I(t, S.pair + .2, S.merge, 0, 1, E.inCubic);
  const spin = Math.max(0, t - S.merge) * 1.4;
  const cl = V.add(FC, V.mul(xfd(rotOf(spin + .3, .5), TET[k]), .058));
  p = V.lerp(p, cl, u2);
  if (t > S.merge) p = cl;
  return p;
}
function sCore(F, t) {
  const S = TS.core;
  F.bg = {space: 0, plasma: 1, ink: 0, pOff: V.mul(coreEye(t), .4)};
  let eye = coreEye(t), tgt = V.add(eye, [.15 * Math.sin(.1 * t), .02, -1]);
  const back = V.norm([.12, .16, 1]);
  const pull = I(t, 74, 75.5, 0, 1, E.inOutCubic);
  if (pull > 0) {
    let dist = logLerp(1.4, 24, E.inOutCubic(I(t, 75, 82.5)));
    let e2 = V.add(FC, V.mul(back, dist)), t2 = FC;
    if (t > 85.4) { const k = E.inOutCubic(I(t, 85.4, 88.05)); e2 = V.lerp(e2, V.add(DIVE, V.mul(back, .2)), k); t2 = V.lerp(FC, DIVE, Math.min(1, k * 1.6)); }
    eye = V.lerp(eye, e2, pull); tgt = V.lerp(tgt, t2, pull);
  }
  F.cam = {eye, tgt, up: [0, 1, 0], fov: 46, near: .01, far: 120};
  const flashM = bell(t, S.merge, .12), flashP = bell(t, S.flash, .1);
  const glowNear = flashM * 1.6 + flashP * 1.2 + bell(t, S.pair, .1) * .5;
  const fogCol = cmix(CV.deep, CV.coral, .5);
  F.ballFog = {k: .16, col: fogCol}; F.ballL = [.4, .7, .6]; F.ballAmb = .35;
  for (const n of NUC) {
    const p = [n.p[0] + .05 * Math.sin(t * n.w + n.ph[0]), n.p[1] + .05 * Math.sin(t * n.w * 1.1 + n.ph[1]), n.p[2] + .05 * Math.sin(t * n.w * .9 + n.ph[2])];
    const d2 = V.dot(V.sub(p, FC), V.sub(p, FC));
    ball(F, p, n.r, n.v ? CV.violet : CV.coral, .12 + glowNear * Math.exp(-d2 / .6));
  }
  for (let k = 0; k < 4; k++) {
    const neut = (k === 1 || k === 3) ? I(t, S.pair, S.pair + .5) : 0;
    ball(F, fusionPos(k, t), .062, cmix(CV.coral, CV.violet, neut), .28 + glowNear * 1.2 + .25 * I(t, 66.6, 67.2) * (1 - I(t, 74, 75)));
  }
  // flashes
  if (t > S.pair - .3 && t < S.pair + .8) { const a = bell(t, S.pair + .05, .12) * 2; spark(F, V.add(FC, [-.17, .02, 0]), .18, CV.cream, a); spark(F, V.add(FC, [.17, -.02, 0]), .18, CV.cream, a); }
  spark(F, FC, .42, CV.cream, flashM * 2.2);
  spark(F, FC, .5, CV.lime, flashP * 2.6);
  F.post.bloom = .85 + flashM * .8 + flashP * .5;
  if (t > S.merge && t < S.merge + 1.6) {
    const u = (t - S.merge) / 1.6, r = .1 + E.outCubic(u) * 1.8;
    const pts = RING.map(q => V.add(FC, V.mul(xdir(camera(F.cam).invV, [q[0], q[1], 0]), r)));
    F.ribbons.push({data: ribbonData(pts), head: 1e9, w: 5 * (1 - u) + 1, k: 1.4 * (1 - u), col: CV.amber, col2: CV.amber});
  }
  // the photon leaves
  if (t > S.flash) {
    const d = (t - S.flash) * 1.1, p = V.add(FC, V.mul(PHOT_DIR, d));
    spark(F, p, .07, CV.lime, 2.2); spark(F, p, .025, CV.cream, 2);
    F.ribbons.push({data: ribbonData([FC, V.add(FC, V.mul(PHOT_DIR, 4))].flatMap((q, i, a) => i ? [V.lerp(a[0], q, .25), V.lerp(a[0], q, .5), V.lerp(a[0], q, .75), q] : [q])), head: d / 4 * 4, w: 3, fade: .9, k: 1.4, col: CV.lime, col2: cmul(CV.lime, .2)});
  }
  if (t > 85.6) { const g = I(t, 85.6, 86.4, 0, 1, E.outCubic); spark(F, DIVE, .3, CV.lime, 2.4 * g); spark(F, DIVE, .1, CV.cream, 2 * g); }
  // fusion everywhere
  const rate = 1 + I(t, 80.5, 84) * .9;
  for (const f of FIELD) {
    const s = Math.sin(t * f.w * 1.3 + f.ph), b = Math.pow(Math.max(0, s), 24) * 2.4 * rate;
    const col = f.c < .1 ? CV.lime : f.c < .55 ? CV.cream : CV.amber;
    spark(F, f.p, .1 + .08 * f.c, col, b + .1);
    if (f.c > .5) spark(F, V.add(f.p, [.3, .2, -.2]), .05, f.c > .8 ? CV.violet : CV.coral, .35);
  }
  F.beat = beatPulse(t) * I(t, 80.5, 82);
  F.post.exp = 1 + beatPulse(t) * .08 * I(t, 80.5, 82);
  F.post.flash = Math.max(bell(t, 62.0, .16), bell(t, 88.0, .1) * .85);
  F.post.flashCol = t > 80 ? CV.lime : CV.cream;
}

/* ================= WALK 88-130: the random walk ================= */
const WALK = (() => {
  const R = rng(5), N = 8000, P = [[0, 0, 0]], T = [];
  const first = V.norm([.92, .12, -.38]);
  P.push(first.slice());
  for (let i = 2; i <= N; i++) {
    const z = R() * 2 - 1, a = R() * 6.2832, s = Math.sqrt(1 - z * z);
    const d = [s * Math.cos(a), z, s * Math.sin(a)];
    const L = clamp(-Math.log(1 - R() * .95) * .8, .35, 2.2);
    P.push(V.add(P[i - 1], V.mul(d, i < 6 ? clamp(L, .8, 1.3) : L)));
  }
  const fixed = [89.0, 94.6, 96.1, 97.4, 98.5];
  for (let i = 0; i <= N; i++) {
    if (i < 5) T.push(fixed[i]);
    else if (i < 15) T.push(99 + (i - 5) * .5);
    else T.push(104 + Math.log(1 + (i - 15) * .62 / 2) / .62);
  }
  const pre = [[0, 0, 0]]; for (let i = 0; i <= N; i++) pre.push(V.add(pre[i], P[i]));
  const us = P.map((_, i) => i);
  return {P, T, N, pre, data: ribbonData(P, us)};
})();
function walkIndex(t) { const T = WALK.T; if (t <= T[0]) return 0; let lo = 0, hi = WALK.N; if (t >= T[hi]) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; } return lo + (t - T[lo]) / (T[lo + 1] - T[lo]); }
function walkPos(u) { const i = Math.min(Math.floor(u), WALK.N - 1), f = u - i; return V.lerp(WALK.P[i], WALK.P[i + 1], Math.min(1, f)); }
const centroid = n => V.mul(WALK.pre[n + 1], 1 / (n + 1));
const CG = centroid(WALK.N);
const RS = 900;
const SUNC = V.sub(CG, [.45 * RS, .1 * RS, 70]);
const BIS = V.norm([Math.cos(OPEN / 2), .45, Math.sin(OPEN / 2)]);
const SCAT = (() => { const a = []; for (let i = 1; i < 60; i++) { const din = V.norm(V.sub(WALK.P[i], WALK.P[i - 1])); a.push({i, c: V.add(WALK.P[i], V.mul(din, .1)), din}); } return a; })();
const PLASMA = (() => { const R = rng(31), a = []; while (a.length < 420) { const p = [(R() - .5) * 12, (R() - .5) * 8, (R() - .5) * 12]; let ok = true; for (let i = 0; i < 40 && ok; i++) if (V.len(V.sub(p, WALK.P[i])) < .35) ok = false; if (ok) a.push({p, ph: R() * 6.3, w: .5 + R(), r: .05 + R() * .05, v: R() < .3}); } return a; })();
function walkTarget(t) {
  let s = [0, 0, 0];
  for (let k = 0; k < 6; k++) s = V.add(s, walkPos(walkIndex(t - k * .14)));
  return V.mul(s, 1 / 6);
}
function sWalk(F, t) {
  const S = TS.walk;
  const u = walkIndex(t), head = walkPos(u), n = Math.floor(u);
  // camera
  let eye, tgt, near = .01, far = 200;
  const a = .3 + .05 * (t - 88);
  const off0 = V.norm([Math.sin(a), .35, Math.cos(a)]);
  if (t < S.pull) {
    const D = lerp(2.3, 3.5, I(t, 88, 99, 0, 1, E.inOutSine));
    tgt = walkTarget(t); eye = V.add(tgt, V.mul(off0, D));
    if (t < 88.6) { const k = I(t, 88, 88.6, 0, 1, E.outCubic); eye = V.lerp(V.add(tgt, V.mul(off0, .4)), eye, k); }
  } else {
    const k = I(t, S.pull, 120, 0, 1, E.inOutSine);
    const D = logLerp(3.5, 3000, k);
    let base = V.lerp(walkTarget(t), centroid(Math.min(n, WALK.N)), I(t, S.pull, 109, 0, 1, E.inOutCubic));
    tgt = V.lerp(base, SUNC, I(t, 112, 120, 0, 1, E.inOutCubic));
    const offA = V.norm([Math.sin(.3 + .05 * 16), .35, Math.cos(.3 + .05 * 16)]);
    const dir = slerp(offA, BIS, I(t, 106, 120, 0, 1, E.inOutSine));
    if (t > 120) {
      const az = (t - 120) * .012;
      const d2 = xfd(rotOf(-az), BIS);
      const push = I(t, 128.6, 130.1, 0, 1, E.inCubic);
      const goal = V.add(SUNC, [.83 * RS * Math.cos(.05), .12 * RS, 4]);
      eye = V.lerp(V.add(SUNC, V.mul(d2, 3000)), goal, push);
      tgt = V.lerp(SUNC, V.add(goal, [-.1 * RS, 0, -40]), push);
    } else eye = V.add(tgt, V.mul(dir, D));
    near = Math.max(.01, D * .002); far = D * 4 + RS * 4;
  }
  F.cam = {eye, tgt, up: [0, 1, 0], fov: 44, near, far};
  const sunA = I(t, 112.5, 116);
  F.bg = {space: sunA, plasma: 1 - sunA, ink: 0, pOff: V.mul(eye, .08)};
  if (sunA > 0) { F.sun = {c: SUNC, r: RS, rot: M.ident(), open: OPEN, gran: 34, heat: 1.05, alpha: sunA, scrib: I(t, 115.5, 118), face: 1}; corona(F, SUNC, RS, sunA); }
  // plasma particles and scatterers (near phase only)
  if (t < 112) {
    F.ballFog = {k: .14, col: cmix(CV.deep, CV.coral, .5)}; F.ballAmb = .35;
    for (const q of PLASMA) ball(F, [q.p[0] + .06 * Math.sin(t * q.w + q.ph), q.p[1] + .06 * Math.cos(t * q.w * 1.2 + q.ph), q.p[2] + .05 * Math.sin(t * q.w * .8 + q.ph * 2)], q.r, q.v ? CV.violet : CV.coral, .1);
    for (const s of SCAT) {
      const T = WALK.T[s.i], dt = t - T;
      const rec = dt > 0 ? .07 * Math.exp(-dt * 3) * Math.sin(Math.min(dt * 8, 3.14)) : 0;
      ball(F, V.add(s.c, V.mul(s.din, rec)), .1, CV.coral, .15 + (dt > 0 ? 1.4 * Math.exp(-dt * 4) : 0));
    }
  }
  // the path
  const camD = V.len(V.sub(eye, head));
  F.ribbons.push({data: WALK.data, head: u, w: t < S.pull ? 3.4 : lerp(3.4, 4, I(t, S.pull, 116)), fade: Math.max(5, u * .3), k: t < S.pull ? 1.25 : lerp(1.25, 1.8, I(t, 110, 116)), col: CV.lime, col2: cmul(CV.violet, .7)});
  spark(F, head, .045 * camD, CV.lime, 2.2 * (1 - I(t, 114, 117)));
  spark(F, head, .016 * camD, CV.cream, 2 * (1 - I(t, 114, 117)));
  // bounce bursts
  for (let i = 1; i < 40; i++) {
    const dt = t - WALK.T[i]; if (dt < 0 || dt > .6) continue;
    const p = WALK.P[i], e = Math.exp(-dt * 7);
    spark(F, p, .35, CV.cream, 2.4 * e);
    for (let k = 0; k < 8; k++) { const R = rng(i * 13 + k), d = V.norm([R() - .5, R() - .5, R() - .5]); spark(F, V.add(p, V.mul(d, dt * 1.2)), .03, CV.amber, 1.6 * e); }
  }
  F.post.flash = Math.max(bell(t, 88.0, .1) * .85, bell(t, 130.0, .13) * .9);
  F.post.flashCol = t > 120 ? CV.amber : CV.lime;
  if (t > 110) F.post.bloom = lerp(.85, .55, I(t, 110, 115));
  F.post.bloom = .85 + (t > 99 && t < 104 ? beatPulse(t) * .4 : 0);
  // year counter
  if (t > 114.2 && t < 122.2) {
    const v = Math.round(170000 * E.outExpo(I(t, 114.6, 119.6)) / 1000) * 1000;
    const str = v.toLocaleString('en-US');
    const ex = I(t, 121.6, 122.1, 0, 1, E.inCubic);
    const B = camAttached(F, M.trs([0, .62 + ex * .5, -3.2], 0, .1, .36));
    type3d(F, str, B, {depth: .24, anim: (i, nn) => ({dy: (1 - spring(t - 114.3 - i * .04, 150, 15)) * -.6, alpha: 1 - ex})});
    const B2 = camAttached(F, M.trs([0, .3 + ex * .5, -3.2], 0, .1, .13));
    type3d(F, 'YEARS', B2, {depth: .3, track: .25, side: CV.violet, anim: () => ({alpha: (t > 114.8 ? 1 : 0) * (1 - ex)})});
  }
}

/* ================= CONVECTION 130-152 ================= */
const ROLLS = (() => { const R = rng(41), a = [], K = 9, w = .024; for (let k = 0; k < K; k++) for (let j = 0; j < 210; j++) a.push({x: (k - (K - 1) / 2) * w, dir: k % 2 ? 1 : -1, th: R() * 6.283, rho: .3 + .7 * Math.sqrt(R()), z: .06 - R() * .5, wob: R() * 6.28, s: .6 + R() * .8}); return a; })();
function convEye(t) {
  const S = TS.conv;
  const y = I(t, S.rise, 144.6, .952, 1.0072, E.inOutCubic);
  if (t < 144.6) return [.004 + .01 * Math.sin(t * .2), y, .12 - (t - 130) * .002];
  const ez = .1 - (t - 145) * .0062;
  return V.mul(V.norm([.003, 1, ez]), 1.0072);
}
function sConv(F, t) {
  const S = TS.conv;
  const eye = convEye(t);
  let tgt, up = [0, 1, 0];
  if (t < 144.6) {
    const pitch = I(t, S.rise, 144.6, .06, .1, E.inOutCubic);
    tgt = V.add(eye, [-.05 * Math.sin(.4), pitch, -1]);
  } else {
    up = V.norm(eye);
    tgt = V.mul(V.norm([.0, 1, eye[2] - .11]), 1.0);
  }
  // blend into the skim from the rise
  const u = I(t, 144.2, 145.4, 0, 1, E.inOutCubic);
  if (u > 0 && u < 1) {
    const a = V.add(eye, [-.05 * Math.sin(.4), .1, -1]), b = V.mul(V.norm([0, 1, eye[2] - .11]), 1.0);
    tgt = V.lerp(a, b, u); up = V.norm(V.lerp([0, 1, 0], V.norm(eye), u));
  }
  F.cam = {eye, tgt, up, fov: 50, near: .0004, far: 20};
  const above = V.len(eye) > 1;
  const skim = t > 144.45;
  F.sun = {c: [0, 0, 0], r: 1, rot: rotInv(0), gran: skim ? 260 : 42, heat: 1.05, alpha: 1, fog: 8, limb: skim ? .3 : 1, lane: skim ? .65 : .75};
  if (above) { corona(F, [0, 0, 0], 1, .35); F.glows.push({c: [0, 0, 0], r: 1, col: CV.pink, k: .8, fall: 260}); }
  F.bg = {space: 1, plasma: 0, ink: 0};
  if (t < 144.6) {
    const vis = I(t, 130, 130.8) * (1 - I(t, 143.6, 144.4));
    for (const p of ROLLS) {
      const w = 1.05 * p.s, th = p.th + p.dir * t * w;
      const x = p.x + .0115 * p.rho * Math.cos(th), y = .955 + .028 * p.rho * Math.sin(th);
      const z = p.z + .004 * Math.sin(t * .7 + p.wob);
      const v = [-.0115 * p.rho * Math.sin(th) * p.dir * w, .028 * p.rho * Math.cos(th) * p.dir * w, 0];
      const sp = V.len(v), hot = clamp(v[1] / (.028 * w) * .5 + .5);
      const d = V.len(V.sub([x, y, z], eye)), b = (.7 + 1.3 * hot) * Math.exp(-d * 3.2) * vis;
      const len = sp * .28;
      streak(F, V.sub([x, y, z], V.mul(v, .28)), V.mul(v, 1 / (sp + 1e-9)), len, Math.min(b, 9.9) + Math.round(hot * 8) * 10);
      if (p.wob < .5) spark(F, [x, y, z], .0012, cmix(CV.coral, CV.amber, hot), b * .8);
    }
    F.streakCol = CV.violet; F.streakCol2 = CV.amber; F.streakW = 2.2;
  }
  F.post.flash = Math.max(bell(t, 130.0, .13) * .9, bell(t, 144.45, .12) * .7);
  F.post.flashCol = CV.amber;
}

/* ================= ESCAPE 152-172 ================= */
const PB = V.norm([0, 1, -.025]), DU = PB, EQ = V.mul(DU, 22);
const LAT = V.norm(V.cross(DU, [1, 0, 0]));
const NEU = (() => { const R = rng(53), a = []; for (let i = 0; i < 1100; i++) { const r = Math.sqrt(R()) * .16, an = R() * 6.283; a.push({o: V.add(V.mul(LAT, Math.cos(an) * r), V.mul(V.norm(V.cross(DU, LAT)), Math.sin(an) * r)), z: R(), b: .4 + R() * .6}); } return a; })();
function photonD(t) {
  if (t < 152.4) return 0;
  if (t < 156) return logLerp(.0006, .8, E.outCubic(I(t, 152.4, 155.8)));
  return logLerp(.8, 22 - 1 - RE, E.inOutCubic(I(t, 156, 160)));
}
function sEscape(F, t) {
  const S = TS.escape;
  const near = I(t, 153, 155.5);
  F.sun = {c: [0, 0, 0], r: 1, rot: rotInv(0), gran: 260, heat: lerp(.85, 1.05, near), alpha: 1, limb: lerp(.3, 1, near), lane: .65};
  corona(F, [0, 0, 0], 1, lerp(.35, 1, near));
  F.earth = {c: EQ, r: RE, L: V.mul(DU, -1), rot: rotInv(2.2 + t * .02, 1.35), hit: I(t, S.land, S.land + 1.6), hitN: V.mul(DU, -1)};
  F.glows.push({c: EQ, r: RE, col: CV.cyan, k: .45, fall: 22});
  const pd = photonD(t), ph = V.add(PB, V.mul(DU, pd));
  let eye, tgt, up = [0, 1, 0];
  const skim = convEye(152); // where the camera was
  const sideV = V.norm(V.cross(DU, LAT));
  const ahead = V.add(V.add(ph, V.mul(DU, .1 + pd * .35)), V.mul(sideV, .05 + pd * .2));
  const behind = V.add(V.sub(ph, V.mul(DU, .13)), V.add(V.mul(sideV, .02), V.mul(LAT, .012)));
  if (t < 155.6) {
    const k = I(t, 152.4, 153.6, 0, 1, E.inOutCubic);
    eye = V.lerp(convEye(t), ahead, k);
    tgt = V.lerp(V.mul(V.norm([0, 1, convEye(t)[2] - .11]), 1), ph, I(t, 152.4, 153.2, 0, 1, E.inOutCubic));
    up = V.norm(V.lerp(V.norm(skim), LAT, k));
  } else if (t < S.land) {
    const k = I(t, 155.6, 156.5, 0, 1, E.inOutCubic);
    eye = V.lerp(ahead, behind, k);
    tgt = V.lerp(ph, V.add(ph, V.mul(DU, 3)), k);
    up = LAT;
  } else {
    const k = I(t, S.land, S.land + 1.2, 0, 1, E.outCubic);
    const a = (t - S.land) * .025;
    const base = V.add(V.sub(EQ, V.mul(DU, .145)), V.add(V.mul(sideV, .02), V.mul(LAT, .012)));
    const orb = V.add(EQ, xfd(M.trs([0, 0, 0], 0, 0, 1, 0), V.sub(base, EQ)));
    const rotd = V.add(V.mul(sideV, Math.sin(a) * .05), V.mul(DU, 0));
    eye = V.add(orb, rotd);
    const shake = bell(t, S.land + .05, .12) * .004;
    eye = V.add(eye, [shake * Math.sin(t * 90), shake * Math.cos(t * 77), 0]);
    eye = V.lerp(behind, eye, k);
    tgt = V.lerp(V.add(ph, V.mul(DU, 3)), V.add(EQ, V.mul(sideV, .024 * I(t, S.land + .2, S.land + 1.4, 0, 1, E.inOutCubic))), k);
    up = LAT;
  }
  F.cam = {eye, tgt, up, fov: 44, near: .0005, far: 80};
  // photon + trail
  if (t >= S.breach && t < S.land + .05) {
    const cd = V.len(V.sub(ph, eye));
    spark(F, ph, .05 * cd, CV.lime, 2.4); spark(F, ph, .016 * cd, CV.cream, 2.2);
    const tail = []; for (let i = 0; i < 24; i++) tail.push(V.add(PB, V.mul(DU, pd * i / 23)));
    F.ribbons.push({data: ribbonData(tail), head: 23, w: 3, fade: 6, k: 1.3, col: CV.lime, col2: cmul(CV.lime, .15)});
  }
  if (t > S.breach && t < S.breach + .8) spark(F, PB, .03, CV.amber, 3 * Math.exp(-(t - S.breach) * 5));
  // speed streaks on the long flight
  if (t > 156 && t < 160.2) {
    const sp = Math.abs(photonD(t) - photonD(t - 1 / 60)) * 60;
    for (const d of DUST) {
      const p = V.add(V.add(V.mul(DU, d.D), V.mul(LAT, Math.cos(d.a) * d.r)), V.mul(sideV, Math.sin(d.a) * d.r));
      streak(F, p, DU, .02 + sp * .045, d.b * .5 * I(t, 156, 156.6) * (1 - I(t, 159.6, 160.2)));
    }
    F.streakCol = cmix(CV.cream, CV.amber, .3); F.streakW = 1.6;
  }
  // YOU
  if (t > S.land + .3) {
    const pos = V.sub(EQ, V.mul(DU, .07));
    const B = M.mul(facing(V.add(pos, V.mul(sideV, .043)), eye, LAT, 1), M.trs([0, 0, 0], 0, 0, .017));
    const glow = .35 * Math.exp(-(t - S.land - .3) * 1.5) + .12;
    type3d(F, 'YOU', B, {depth: .32, face: CV.cream, side: cmul(CV.lime, .55), face2: cmix(CV.cream, CV.lime, .5), anim: (i) => { const k = spring(t - S.land - .3 - i * .08, 150, 14); return {dy: (1 - k) * -1, rx: (1 - k) * 1.1, alpha: k > .01 ? 1 : 0, glow}; }});
  }
  // neutrinos: straight through everything
  if (t > S.ghost) {
    const fade = I(t, S.ghost, S.ghost + 1.2) * (1 - I(t, 171, 171.8));
    for (const n of NEU) {
      const z = ((n.z + (t - S.ghost) * .9) % 1) * .55 - .35;
      const p = V.add(V.add(EQ, n.o), V.mul(DU, z));
      streak(F, p, DU, .03, n.b * fade * .9);
    }
    F.streakCol = CV.cyan; F.streakW = 1.8; F.streakNoDepth = true;
  }
  F.post.flash = Math.max(bell(t, S.breach + .05, .12) * .6, bell(t, S.land + .04, .1) * .7);
  F.post.flashCol = CV.lime;
  F.post.exp = 1 - I(t, 171.4, 172, 0, 1, E.inCubic);
}

/* ================= OUTRO 172-186 ================= */
function sOutro(F, t) {
  const S = TS.outro;
  F.bg = {space: 0, plasma: 0, ink: 1, dots: 1};
  const k = I(t, 172, 186, 0, 1, E.inOutSine);
  const card = I(t, S.card - .4, S.card + 1.2, 0, 1, E.inOutCubic);
  F.cam = {eye: V.lerp([.2, .26, 3.5], [.15, .2, 3.05], k), tgt: [0, lerp(0, -.35, card), 0], up: [0, 1, 0], fov: 40, near: .01, far: 40};
  F.sun = {c: [0, 0, 0], r: 1, rot: rotInv(t * .04, .12), gran: 34, half: 1, heat: .82 - card * .12, alpha: 1};
  corona(F, [0, 0, 0], 1, .35);
  F.post.bloom = .4;
  F.post.exp = I(t, 172, 172.7, 0, 1, E.outCubic);
  if (t > S.card) {
    [['THE LONG', .26], ['WAY OUT', -.06]].forEach(([str, y], li) => {
      const B = camAttached(F, M.trs([0, y * .62, -1.5], 0, 0, .168));
      type3d(F, str, B, {depth: .3, anim: (i, n) => { const s = spring(t - S.card - li * .2 - i * .055, 120, 15); return {dz: (1 - s) * -5, ry: (1 - s) * 2.2, dy: (1 - s) * .8, alpha: s > .02 ? 1 : 0}; }});
    });
  }
}

/* ================= dispatch ================= */
const SCENES = [['hook', sHook], ['leg', sLeg], ['inside', sInside], ['core', sCore], ['walk', sWalk], ['conv', sConv], ['escape', sEscape], ['outro', sOutro]];
function render(t) {
  const F = newFrame();
  F.beat = beatPulse(t) * .5;
  for (const [k, fn] of SCENES) if (t < TS[k].t1 || k === 'outro') { fn(F, t); break; }
  // overlay
  ox.clearRect(0, 0, W, H);
  const K = camera(F.cam);
  for (const L of F.labels) { const s = project(K, L.p); if (s) drawLabel(L.lb, t, s); }
  drawCaptions(t);
  drawFrame(F, t);
  return F;
}
window.renderFrame = f => { render(f / FPS); };
window.ready = document.fonts.ready.then(() => { render(0); return true; });
