/* GLSL for The Long Way Out. Colours arrive as uniforms from the palette in scenes.js. */
'use strict';
const GLSL = {};

GLSL.head = `#version 300 es
precision highp float;
`;

// hashing, value noise, fbm, 3D cellular (F1, F2)
GLSL.noise = `
float h1(vec3 p){ p = fract(p * vec3(.1213, .1137, .1371)); p += dot(p, p.yzx + 31.17); return fract((p.x + p.y) * p.z); }
vec3 h3(vec3 p){ p = fract(p * vec3(.1213, .1137, .1371)); p += dot(p, p.yxz + 31.17); return fract((p.xxy + p.yxx) * p.zyx); }
float h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1213); q += dot(q, q.yzx + 31.17); return fract((q.x + q.y) * q.z); }
float vn(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h1(i), h1(i + vec3(1,0,0)), f.x), mix(h1(i + vec3(0,1,0)), h1(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h1(i + vec3(0,0,1)), h1(i + vec3(1,0,1)), f.x), mix(h1(i + vec3(0,1,1)), h1(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.07 + vec3(1.7, 9.2, 3.1); a *= .5; } return s / .9375; }
float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++){ s += a * vn(p); p = p * 2.07 + vec3(1.7, 9.2, 3.1); a *= .5; } return s / .875; }
vec2 cell(vec3 p, float t){
  // nearest-8 Worley: only the 2x2x2 block of cells around the sample's half-cell
  vec3 i = floor(p), f = fract(p), s = step(.5, f) - 1.;
  float d1 = 9., d2 = 9.;
  for (int z = 0; z < 2; z++) for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++){
    vec3 o = s + vec3(x, y, z), hh = h3(i + o);
    vec3 q = o + .5 + .32 * (abs(fract(t * .12 + hh) - .5) * 4. - 1.) - f; float d = dot(q, q);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(vec2(d1, d2));
}
float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
`;

GLSL.fsVS = `${GLSL.head}
layout(location=0) in vec2 a; out vec2 vUv;
void main(){ vUv = a * .5 + .5; gl_Position = vec4(a, 0., 1.); }`;

// common ray setup for full-screen passes
GLSL.ray = `
uniform mat4 uInvVP, uVP; uniform vec3 uEye;
vec3 rayDir(vec2 uv){ vec4 p = uInvVP * vec4(uv * 2. - 1., 1., 1.); return normalize(p.xyz / p.w - uEye); }
float depthOf(vec3 p){ vec4 c = uVP * vec4(p, 1.); return clamp(c.z / c.w * .5 + .5, 0., 1.); }
`;

/* ---------- background: space / plasma / ink, mixed by weights ---------- */
GLSL.bg = `${GLSL.head}${GLSL.noise}${GLSL.ray}
in vec2 vUv; out vec4 o;
uniform float uT, uSpace, uPlasma, uInk, uBeat, uDots;
uniform vec3 cInk, cInk2, cViolet, cCoral, cDeep, cAmber, cCream, uPOff;
void main(){
  vec3 rd = rayDir(vUv);
  vec3 col = vec3(0.);
  if (uSpace > 0.){
    vec3 s = mix(cInk, cInk2, .5 + .5 * rd.y) * .9;
    float neb = fbm3(rd * 2.6 + vec3(0., 0., uT * .006));
    float neb2 = vn(rd * 5.1 - vec3(uT * .004, 0., 0.));
    s += cViolet * .16 * smoothstep(.45, .85, neb) + cCoral * .05 * smoothstep(.55, .9, neb2);
    // stars on two shells; brighten slightly on the beat
    for (int k = 0; k < 2; k++){
      float sc = k == 0 ? 160. : 360.;
      vec3 q = rd * sc, ci = floor(q); vec3 hh = h3(ci);
      if (hh.x > (k == 0 ? .82 : .7)){
        float d = length(q - ci - .2 - .6 * hh);
        float tw = .6 + .4 * sin(uT * (1.5 + 3. * hh.y) + 40. * hh.z);
        float b = smoothstep(.09, 0., d) * (k == 0 ? 1.3 : .5) * tw * (1. + .35 * uBeat);
        s += mix(cCream, k == 0 ? cAmber : cViolet, hh.y * .6) * b;
      }
    }
    col += s * uSpace;
  }
  if (uPlasma > 0.){
    // layered glowing plasma, offset by uPOff so moving through it parallaxes
    vec3 acc = vec3(0.); float w = 0.;
    for (int i = 1; i <= 3; i++){
      float d = float(i) * 1.6;
      vec3 p = uPOff + rd * d;
      float n = fbm(p * .55 + vec3(0., uT * .05, uT * .03));
      float m = smoothstep(.35, .8, n);
      vec3 c = mix(cDeep, cCoral, m);
      c = mix(c, cAmber, smoothstep(.62, .9, n));
      acc += c / float(i); w += 1. / float(i);
    }
    vec3 pl = acc / w * (1. + .12 * uBeat);
    col += pl * uPlasma;
  }
  if (uInk > 0.){
    vec3 s = mix(cInk, cInk2, vUv.y * .6);
    vec2 g = gl_FragCoord.xy / 36. + vec2(uT * .18, uT * .05);
    float d = length(fract(g) - .5);
    s += cCream * .055 * smoothstep(.09, .04, d) * uDots;
    col += s * uInk;
  }
  o = vec4(col, 1.);
}`;

/* ---------- ray-traced Sun: surface, cutaway faces, halftone; and its corona (GLOW) ---------- */
GLSL.sun = `${GLSL.head}${GLSL.noise}${GLSL.ray}
in vec2 vUv; out vec4 o;
uniform float uT, uR, uOpen, uGran, uHalf, uHeat, uAlpha, uFace, uFog, uScrib, uLane, uLimb;
uniform vec3 uC; uniform mat4 uRot;  // world->local rotation
uniform vec4 uHi;                    // highlight per layer: core, radiative, convective, surface
uniform vec3 cInk, cCoral, cDeep, cAmber, cCream, cViolet, cLime, cRed;
vec3 ramp(float x){
  vec3 c = mix(cRed, cCoral, smoothstep(.0, .45, x));
  c = mix(c, cAmber, smoothstep(.45, .8, x));
  return mix(c, cCream, smoothstep(.8, 1.15, x)) * (.55 + .9 * x);
}
const float TAU = 6.2831853;
bool inWedge(vec3 p){ float a = atan(p.z, p.x); if (a < 0.) a += TAU; return a < uOpen; }
void main(){
  vec3 rdW = rayDir(vUv);
  vec3 ro = (uRot * vec4(uEye - uC, 0.)).xyz, rd = (uRot * vec4(rdW, 0.)).xyz;
  float b = dot(ro, rd), c = dot(ro, ro) - uR * uR, h = b * b - c;
  if (h < 0.) discard;
  h = sqrt(h);
  float tN = -b - h, tF = -b + h;
  bool inside = c < 0.;
  float tS = inside ? tF : tN;
  float best = 1e20; int kind = -1; vec3 pn = vec3(0.);
  vec3 pS = ro + rd * tS;
  if (tS > 0. && (uOpen <= 0. || !inWedge(pS))) { best = tS; kind = 0; }
  if (uOpen > 0.){
    // plane A: z = 0, x > 0
    if (abs(rd.z) > 1e-6){
      float t = -ro.z / rd.z; vec3 p = ro + rd * t;
      if (t > 0. && t < best && p.x > 0. && dot(p, p) < uR * uR){ best = t; kind = 1; pn = vec3(0., 0., 1.); }
    }
    vec3 nB = vec3(-sin(uOpen), 0., cos(uOpen)), dB = vec3(cos(uOpen), 0., sin(uOpen));
    float dn = dot(rd, nB);
    if (abs(dn) > 1e-6){
      float t = -dot(ro, nB) / dn; vec3 p = ro + rd * t;
      if (t > 0. && t < best && dot(p, dB) > 0. && dot(p, p) < uR * uR){ best = t; kind = 2; pn = nB; }
    }
  }
  if (kind < 0) discard;
  vec3 p = ro + rd * best;
  vec3 col; float edge = 1.; float hL = -1.;
  if (kind == 0){
    vec3 n = normalize(p);
    float mu = inside ? 1. : max(dot(n, -rd), 0.);
    vec2 ce = cell(n * uGran, uT * .55);
    float lanes = mix(1. - uLane, 1., smoothstep(.0, .16, ce.y - ce.x));
    float dome = 1. - ce.x * .85;
    float var = vn(n * uGran * 1.3 + vec3(uT * .08));
    float gr = dome * lanes * (.6 + .7 * var);
    float big = vn(n * 3.2 + vec3(uT * .015)) * .65 + vn(n * 7.1 - vec3(uT * .01)) * .35;
    float sp = 0., pen = 0.;
    vec3 s1 = normalize(vec3(.55, .28, .78)), s2 = normalize(vec3(.62, .18, .74));
    float c1 = dot(n, s1), c2 = dot(n, s2);
    sp = max(smoothstep(.9990, .9997, c1), smoothstep(.9996, .9999, c2));
    pen = max(smoothstep(.9962, .9988, c1), smoothstep(.9985, .9995, c2));
    float limb = mix(1., .25 + .75 * pow(mu, .6), uLimb);
    float I = mix(.3, .86, gr) * (.78 + .4 * big);
    I *= (1. - .5 * pen) * (1. - .75 * sp);
    col = ramp(I * limb) * uHeat;
    // halftone reads the broad light, not the cells
    hL = clamp((.45 + .55 * big) * pow(mu, .45) * (1. - .6 * pen) + .12 * gr, 0., 1.);
    col *= 1. + uHi.w * .22;
    // silhouette anti-aliasing
    float dc = length(cross(ro, rd));
    edge = inside ? 1. : clamp((uR - dc) / max(fwidth(dc) * 1.2, uR * 1e-7), 0., 1.);
  } else {
    float r = length(p) / uR;
    float sh = .82 + .18 * abs(dot(pn, rd));
    if (r < .25){
      float f = fbm3(p / uR * 9. + vec3(0., uT * .4, 0.));
      float f2 = fbm3(p / uR * 26. - vec3(uT * .3, 0., uT * .2));
      col = mix(cCoral * 1.15, mix(cAmber, cCream, smoothstep(.45, .85, f2)) * 1.1, smoothstep(.25, .75, f)) * (1. + .06 * sin(uT * 7.)) * (1. + .5 * uHi.x);
      col = mix(col, cCream * 1.1, smoothstep(.12, .0, r) * .5);
    } else if (r < .7){
      float k = (r - .25) / .45;
      col = mix(cAmber * .95, cCoral * .85, k);
      col *= .96 + .035 * sin(r * 220.);
      // the random-walk scribble motif
      float n = fbm(p / uR * 7. + vec3(uT * .05, 0., 0.));
      col += cAmber * uScrib * .3 * smoothstep(.012, .0, abs(n - .5));
      col *= 1. + uHi.y * .7;
    } else {
      float k = (r - .7) / .3;
      vec3 q = p / uR * 9.;
      vec2 ce = cell(q + vec3(0., -uT * .25, 0.), uT * .8);
      float plume = smoothstep(.0, .55, ce.y - ce.x) * (1. - ce.x);
      col = mix(cRed, cCoral, plume) * (1.05 - .25 * k);
      col = mix(col, cViolet * .6, (1. - plume) * .25);
      col *= 1. + uHi.z * .7;
    }
    // layer boundaries
    float ln = smoothstep(.006, .0, abs(r - .25)) + smoothstep(.006, .0, abs(r - .7));
    col += cCream * ln * .9;
    col += cCream * 1.4 * smoothstep(.985, 1., r);
    col *= sh * uFace;
  }
  // halftone (screen space dots, 30 degrees)
  if (uHalf > 0.){
    vec2 g = gl_FragCoord.xy; float cs = cos(.52), sn = sin(.52);
    g = mat2(cs, -sn, sn, cs) * g / 13.;
    vec2 l = fract(g) - .5;
    float L = hL >= 0. ? hL : clamp(lum(col) / max(uHeat, .2) * .8, 0., 1.);
    float rr = sqrt(L) * .5;
    float m = smoothstep(rr + .06, rr - .06, length(l));
    vec3 ht = mix(cInk * 1.2, mix(cCoral, cAmber, smoothstep(.55, 1., L)), m);
    col = mix(col, ht, uHalf);
  }
  if (inside){ float f = 1. - exp(-best / uR * uFog); col = mix(col, mix(cDeep, cCoral, .55), f); }
  vec3 pw = (inverse(uRot) * vec4(p, 0.)).xyz + uC;
  gl_FragDepth = depthOf(pw);
  o = vec4(col, uAlpha * edge);
}`;

// glow around a sphere (sun corona or an atmosphere), additive, behind the body
GLSL.glow = `${GLSL.head}${GLSL.noise}${GLSL.ray}
in vec2 vUv; out vec4 o;
uniform vec3 uC, uCol; uniform float uR, uK, uFall, uT, uWisp;
void main(){
  vec3 rd = rayDir(vUv);
  vec3 oc = uC - uEye; float tc = max(dot(oc, rd), 0.);
  float d = length(oc - rd * tc) / uR;
  float g = exp(-(max(d, 1.) - 1.) * uFall);
  if (uWisp > 0.){
    vec3 q = normalize(rd * tc - oc);
    float w = vn(q * 5. + vec3(0., 0., uT * .03)) * .7 + vn(q * 11. - vec3(uT * .02)) * .3;
    g *= 1. + uWisp * (w - .4) * 2.;
  }
  g *= smoothstep(.97, 1.0, d) * .7 + .3;
  g *= mix(.12, 1., smoothstep(1.02, 1.9, length(oc) / uR));
  o = vec4(uCol * g * uK, 1.);
}`;

/* ---------- ray-traced Earth ---------- */
GLSL.earth = `${GLSL.head}${GLSL.noise}${GLSL.ray}
in vec2 vUv; out vec4 o;
uniform float uT, uR, uHit; uniform vec3 uC, uL, uHitN; uniform mat4 uRot;
uniform vec3 cOcean, cOcean2, cLand, cLand2, cCream, cCyan, cInk, cAmber, cLime;
void main(){
  vec3 rd = rayDir(vUv);
  vec3 oc = uEye - uC; float b = dot(oc, rd), c = dot(oc, oc) - uR * uR, h = b * b - c;
  if (h < 0.) discard;
  float t = -b - sqrt(h); if (t < 0.) discard;
  vec3 p = uEye + rd * t, n = normalize(p - uC);
  vec3 nl = (uRot * vec4(n, 0.)).xyz;
  float land = fbm(nl * 1.9) * .7 + fbm(nl * 4.3 + 3.) * .3;
  float isL = smoothstep(.565, .58, land);
  float ice = smoothstep(.8, .86, abs(nl.y) + .05 * fbm3(nl * 6.));
  vec3 sea = mix(cOcean, cOcean2, smoothstep(.35, .54, land));
  vec3 gnd = mix(cLand, cLand2, smoothstep(.55, .7, fbm3(nl * 9.)));
  vec3 base = mix(sea, gnd, isL); base = mix(base, cCream, ice);
  float cl = smoothstep(.62, .8, fbm(nl * 3.4 + vec3(uT * .01, 0., uT * .006)));
  base = mix(base, cCream * .82, cl * .8);
  float ndl = dot(n, uL);
  float day = smoothstep(-.12, .28, ndl);
  float mu = max(dot(n, -rd), 0.);
  vec3 col = base * (.06 + .88 * day);
  vec3 rf = reflect(-uL, n);
  col += cCream * pow(max(dot(rf, -rd), 0.), 140.) * (1. - isL) * (1. - cl) * day * .4;
  // city lights on the night side
  vec3 g = nl * 140.; vec3 ci = floor(g); float hh = h1(ci);
  float city = step(.93, hh) * smoothstep(.35, .05, length(g - ci - .5)) * isL * (1. - ice);
  col += cAmber * city * (1. - day) * 1.4;
  // atmosphere rim
  col += cCyan * pow(1. - mu, 3.) * (.25 + 1.2 * smoothstep(-.3, .4, ndl));
  // a sunbeam landing: ring on the surface
  if (uHit > 0.){
    float a = acos(clamp(dot(n, uHitN), -1., 1.));
    float ring = smoothstep(.03, .0, abs(a - uHit * .5)) * (1. - uHit);
    col += cLime * (ring * 2. + smoothstep(.1, 0., a) * (1. - uHit) * 1.5);
  }
  float dc = length(cross(oc, rd));
  float edge = clamp((uR - dc) / max(fwidth(dc) * 1.2, uR * 1e-7), 0., 1.);
  gl_FragDepth = depthOf(p);
  o = vec4(col, edge);
}`;

/* ---------- impostor spheres (nuclei, plasma) ---------- */
GLSL.ballVS = `${GLSL.head}
layout(location=0) in vec2 a; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform mat4 uV, uP; out vec3 vPos, vC; out float vR; out vec4 vCol;
void main(){
  vec4 c = uV * vec4(iA.xyz, 1.);
  vec4 p = c + vec4(a * iA.w * 1.6, 0., 0.);
  vPos = p.xyz; vC = c.xyz; vR = iA.w; vCol = iB;
  gl_Position = uP * p;
}`;
GLSL.ballFS = `${GLSL.head}
in vec3 vPos, vC; in float vR; in vec4 vCol; out vec4 o;
uniform mat4 uP; uniform vec3 uL; uniform float uFog; uniform vec3 uFogCol; uniform float uAmb;
void main(){
  vec3 rd = normalize(vPos);
  float b = dot(rd, vC), c = dot(vC, vC) - vR * vR, h = b * b - c;
  if (h < 0.) discard;
  float t = b - sqrt(h); vec3 p = rd * t, n = (p - vC) / vR;
  float df = max(dot(n, uL), 0.);
  float rim = pow(1. - max(dot(n, -rd), 0.), 2.4);
  float sp = pow(max(dot(reflect(-uL, n), -rd), 0.), 24.);
  vec3 col = vCol.rgb * (uAmb + .95 * df) + vCol.rgb * rim * .7 + vec3(1.) * sp * .35;
  col += vCol.rgb * vCol.w;
  float f = 1. - exp(-t * uFog); col = mix(col, uFogCol, f);
  vec4 cp = uP * vec4(p, 1.); gl_FragDepth = cp.z / cp.w * .5 + .5;
  o = vec4(col, 1.);
}`;

/* ---------- soft additive sparks ---------- */
GLSL.sparkVS = `${GLSL.head}
layout(location=0) in vec2 a; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform mat4 uV, uP; out vec2 vA; out vec4 vCol;
void main(){ vec4 c = uV * vec4(iA.xyz, 1.); c.xy += a * iA.w; vA = a; vCol = iB; gl_Position = uP * c; }`;
GLSL.sparkFS = `${GLSL.head}
in vec2 vA; in vec4 vCol; out vec4 o;
void main(){ float r = dot(vA, vA); if (r > 1.) discard; float g = exp(-r * 5.) + .5 * exp(-r * 30.); o = vec4(vCol.rgb * vCol.a * g, 1.); }`;

/* ---------- streaks: straight line segments (neutrinos, speed dust) ---------- */
GLSL.streakVS = `${GLSL.head}
layout(location=0) in vec2 a; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform mat4 uVP; uniform float uW; uniform vec3 uCol; out vec2 vA; out float vB, vH;
void main(){
  vec3 p0 = iA.xyz, p1 = iA.xyz + iB.xyz * iA.w;
  vec4 c0 = uVP * vec4(p0, 1.), c1 = uVP * vec4(p1, 1.);
  vec2 s0 = c0.xy / max(c0.w, 1e-3), s1 = c1.xy / max(c1.w, 1e-3);
  vec2 res = vec2(1920., 1080.);
  vec2 d = normalize((s1 - s0) * res + 1e-5), nrm = vec2(-d.y, d.x);
  vec4 c = a.x < 0. ? c0 : c1;
  c.xy += nrm * a.y * uW / res * 2. * c.w;
  float hk = floor(iB.w / 10.); vH = hk / 8.; vB = iB.w - hk * 10.; vA = a; gl_Position = c;
}`;
GLSL.streakFS = `${GLSL.head}
in vec2 vA; in float vB, vH; out vec4 o; uniform vec3 uCol, uCol2;
void main(){ float g = (1. - vA.y * vA.y) * smoothstep(-1., 1., vA.x); o = vec4(mix(uCol, uCol2, vH) * g * vB, 1.); }`;

/* ---------- ribbons: a 3D path with a screen-space width ---------- */
GLSL.ribVS = `${GLSL.head}
layout(location=0) in vec3 aP; layout(location=1) in vec3 aA; layout(location=2) in vec3 aB;
layout(location=3) in float aS; layout(location=4) in float aU;
uniform mat4 uVP; uniform float uW, uHead, uTaper; out float vS, vU;
void main(){
  vec4 c = uVP * vec4(aP, 1.), ca = uVP * vec4(aA, 1.), cb = uVP * vec4(aB, 1.);
  vec2 res = vec2(1920., 1080.);
  vec2 sa = ca.xy / max(ca.w, 1e-3), sb = cb.xy / max(cb.w, 1e-3);
  vec2 d = normalize((sb - sa) * res + 1e-5), nrm = vec2(-d.y, d.x);
  float w = uW * mix(1., clamp(1. - (uHead - aU) / max(uTaper, 1e-3), .25, 1.), step(0., uTaper) * step(.001, uTaper));
  c.xy += nrm * aS * w / res * 2. * c.w;
  vS = aS; vU = aU; gl_Position = c;
}`;
GLSL.ribFS = `${GLSL.head}
in float vS, vU; out vec4 o;
uniform float uHead, uFade, uK; uniform vec3 uCol, uCol2;
void main(){
  if (vU > uHead) discard;
  float age = uHead - vU;
  float core = pow(1. - abs(vS), 1.6);
  float f = uFade > 0. ? exp(-age / uFade) : 1.;
  vec3 col = mix(uCol2, uCol, f) * (core * 1.2 + core * core * 1.4);
  o = vec4(col * uK * (.25 + .75 * f), 1.);
}`;

/* ---------- extruded type: stacked slices of a glyph texture ---------- */
GLSL.typeVS = `${GLSL.head}
layout(location=0) in vec2 a; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform mat4 uMVP; uniform vec2 uSize; uniform float uDepth, uN; out vec2 vUv; out float vK;
void main(){
  float k = iA.x;
  vec3 p = vec3(a * uSize, -k / uN * uDepth);
  vUv = a * .5 + .5; vK = k / uN;
  gl_Position = uMVP * vec4(p, 1.);
}`;
GLSL.typeFS = `${GLSL.head}
in vec2 vUv; in float vK; out vec4 o;
uniform sampler2D uTex; uniform vec3 uFace, uSide, uFace2; uniform float uGlow, uAlpha;
void main(){
  float a = texture(uTex, vUv).a;
  if (a < .5) discard;
  vec3 col = vK < .001 ? mix(uFace2, uFace, vUv.y) * (1. + uGlow) : uSide * mix(1., .28, vK);
  o = vec4(col, uAlpha);
}`;

/* ---------- post ---------- */
GLSL.bright = `${GLSL.head}
in vec2 vUv; out vec4 o; uniform sampler2D uS; uniform float uThr;
void main(){
  vec2 px = 1. / vec2(1920., 1080.);
  vec3 c = (texture(uS, vUv + px * vec2(-1,-1)).rgb + texture(uS, vUv + px * vec2(1,-1)).rgb + texture(uS, vUv + px * vec2(-1,1)).rgb + texture(uS, vUv + px * vec2(1,1)).rgb) * .25;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * max(l - uThr, 0.) / max(l, 1e-4), 1.);
}`;
GLSL.down = `${GLSL.head}
in vec2 vUv; out vec4 o; uniform sampler2D uS; uniform vec2 uPx;
void main(){
  vec3 c = texture(uS, vUv).rgb * .4;
  c += (texture(uS, vUv + uPx * vec2(-1,-1)).rgb + texture(uS, vUv + uPx * vec2(1,-1)).rgb + texture(uS, vUv + uPx * vec2(-1,1)).rgb + texture(uS, vUv + uPx * vec2(1,1)).rgb) * .15;
  o = vec4(c, 1.);
}`;
GLSL.up = `${GLSL.head}
in vec2 vUv; out vec4 o; uniform sampler2D uS, uB; uniform vec2 uPx;
void main(){
  vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){ float w = (x == 0 ? 2. : 1.) * (y == 0 ? 2. : 1.); c += texture(uS, vUv + uPx * vec2(x, y)).rgb * w; }
  o = vec4(c / 16. + texture(uB, vUv).rgb, 1.);
}`;
GLSL.comp = `${GLSL.head}${GLSL.noise}
in vec2 vUv; out vec4 o;
uniform sampler2D uS, uBl, uOv; uniform float uBloom, uExp, uFlash, uVig, uCA, uGrain, uSeed;
uniform vec3 uFlashCol, cInk;
vec3 shoulder(vec3 c){
  vec3 k = .78 + .22 * (1. - exp(-(c - .78) / .22));
  return mix(c, k, step(.78, c));
}
void main(){
  vec2 d = vUv - .5;
  float ca = uCA * dot(d, d);
  vec3 c;
  c.r = texture(uS, vUv - d * ca).r; c.g = texture(uS, vUv).g; c.b = texture(uS, vUv + d * ca).b;
  c += texture(uBl, vUv).rgb * uBloom;
  c *= uExp;
  float hot = max(lum(c) - .9, 0.); c += hot * .35;
  c = shoulder(max(c, 0.));
  c = mix(c, uFlashCol, uFlash);
  c *= 1. - uVig * smoothstep(.35, 1.05, length(d * vec2(1.25, 1.)) * 1.25);
  c += (h2(gl_FragCoord.xy + uSeed * 37.1) - .5) * uGrain;
  o = vec4(clamp(c, 0., 1.), 1.);
}`;
