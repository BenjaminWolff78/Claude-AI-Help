// Colour grade for the bridge short (post agent): references/grade/GradeEffect.ts (reports/grade.md) verbatim,
// plus GRADES / GRADE_STRENGTH / gradeFor() so the lead can re-fit the presets after the lighting merge.
// The presets were fitted to the OLD unlit stills: after the WORLD lighting lands they will over-correct; re-fit
// (grade.md 5.C) or lower GRADE_STRENGTH. Each Inner (crossfade layer) grades with its own shot's light, so the DOM
// crossfade at XFADE frames (shots 10->11, 13->14) cross-fades the presets as well.
// GradeEffect: the fitted reference-style colour grade as a postprocessing 6.37 Effect.
// Put it LAST in the EffectComposer, after ToneMappingEffect. It works on display-referred values: the input (linear,
// already tone-mapped to 0..1) is encoded to sRGB, graded exactly like scripts/grade.py (validated on our stills), and
// decoded back to linear for the composer's output encoding.
//   1. RGB tone curve: monotone cubic Hermite through 7 knots at x = 0, .1, .25, .5, .75, .9, 1
//   2. saturation around luma Y' (Rec.709 weights on the encoded values), separately for shadows / mids / highlights
//   3. 3-way tint (split tone): zero-luma RGB offsets in shadows, mids, highlights
//   4. vignette: x (1 - k * smoothstep(r0, 1, r)), r = elliptical radius, corners = 1
// `amount` blends the whole grade (0 = bypass) so it can be dialled back once lighting/albedo work brightens the render.
import { Effect, BlendFunction } from "postprocessing";
import { Uniform, Vector3, Vector2 } from "three";

const frag = /* glsl */ `
uniform float gradeKy[7];
uniform float gradeKm[7];
uniform vec3 gradeSat;      // x = shadows, y = mids, z = highlights
uniform vec3 gradeTintS;    // zero-luma RGB offsets (sRGB-encoded units)
uniform vec3 gradeTintM;
uniform vec3 gradeTintH;
uniform vec2 gradeVig;      // x = strength k, y = start radius r0
uniform float gradeAmount;

vec3 gradeEncode(vec3 c) {   // linear -> sRGB
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
vec3 gradeDecode(vec3 c) {   // sRGB -> linear
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
float gradeHermite(float v, float x0, float x1, float y0, float y1, float m0, float m1) {
  float h = x1 - x0, t = (v - x0) / h, t2 = t * t, t3 = t2 * t;
  return (2.0 * t3 - 3.0 * t2 + 1.0) * y0 + (t3 - 2.0 * t2 + t) * h * m0 + (-2.0 * t3 + 3.0 * t2) * y1 + (t3 - t2) * h * m1;
}
float gradeCurve(float v) {
  v = clamp(v, 0.0, 1.0);
  if (v < 0.1)  return gradeHermite(v, 0.0, 0.1, gradeKy[0], gradeKy[1], gradeKm[0], gradeKm[1]);
  if (v < 0.25) return gradeHermite(v, 0.1, 0.25, gradeKy[1], gradeKy[2], gradeKm[1], gradeKm[2]);
  if (v < 0.5)  return gradeHermite(v, 0.25, 0.5, gradeKy[2], gradeKy[3], gradeKm[2], gradeKm[3]);
  if (v < 0.75) return gradeHermite(v, 0.5, 0.75, gradeKy[3], gradeKy[4], gradeKm[3], gradeKm[4]);
  if (v < 0.9)  return gradeHermite(v, 0.75, 0.9, gradeKy[4], gradeKy[5], gradeKm[4], gradeKm[5]);
  return gradeHermite(v, 0.9, 1.0, gradeKy[5], gradeKy[6], gradeKm[5], gradeKm[6]);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 src = gradeEncode(inputColor.rgb);
  vec3 c = vec3(gradeCurve(src.r), gradeCurve(src.g), gradeCurve(src.b));
  const vec3 W = vec3(0.2126, 0.7152, 0.0722);
  float y = dot(c, W);
  // r13: near-black (the plum ink) keeps its colour: no cool tint below y ~0.1
  float wS = (1.0 - smoothstep(0.04, 0.68, y)) * smoothstep(0.12, 0.26, y);   // r23: the plum ink (luma ~0.1) takes no shadow tint   // r12: the cool shadow tint reaches the mid-dark shadows (ground, walls)
  float wH = smoothstep(0.55, 1.0, y);
  float wM = 1.0 - wS - wH;
  float s = gradeSat.y + (gradeSat.x - gradeSat.y) * wS + (gradeSat.z - gradeSat.y) * wH;
  s = mix(1.0, s, smoothstep(0.08, 0.2, y));   // r23: nor the saturation boost (it pushed #241726 toward indigo)
  c = vec3(y) + s * (c - vec3(y));
  c += wS * gradeTintS + wM * gradeTintM + wH * gradeTintH;
  vec2 p = uv * 2.0 - 1.0;
  float r = length(p) * 0.70710678;
  c *= 1.0 - gradeVig.x * smoothstep(gradeVig.y, 1.0, r);
  c = clamp(c, 0.0, 1.0);
  outputColor = vec4(gradeDecode(mix(src, c, gradeAmount)), inputColor.a);
}`;

// BT.709 zero-luma chroma basis (sRGB-encoded units): unit Cb and unit Cr as RGB offsets with Y' unchanged
const E_CB: [number, number, number] = [0.0, -0.18733, 1.8556];
const E_CR: [number, number, number] = [1.5748, -0.46813, 0.0];
export const tintRGB = (cb: number, cr: number) =>
  new Vector3(cb * E_CB[0] + cr * E_CR[0], cb * E_CB[1] + cr * E_CR[1], cb * E_CB[2] + cr * E_CR[2]);

/** Fritsch-Carlson monotone tangents for the 7 fixed knots (same as scripts/grade.py `tangents`) */
export const KX = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
export function monoTangents(ky: number[]): number[] {
  const n = KX.length, h: number[] = [], d: number[] = [], m = new Array(n).fill(0);
  for (let k = 0; k < n - 1; k++) { h.push(KX[k + 1] - KX[k]); d.push((ky[k + 1] - ky[k]) / h[k]); }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    if (d[k - 1] * d[k] <= 0) { m[k] = 0; continue; }
    const w1 = 2 * h[k] + h[k - 1], w2 = h[k] + 2 * h[k - 1];
    m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
  }
  return m;
}

export type GradeParams = {
  ky: number[];                                  // 7 curve values at KX
  sat: [number, number, number];                 // shadows, mids, highlights
  tintS: [number, number]; tintM: [number, number]; tintH: [number, number];   // (Cb, Cr) per zone
  vig: [number, number];                         // strength, start radius
};

// __GRADES__ (fitted by scripts/fit2.py, written by scripts/emit_ts.py)
export const GRADE_DAY: GradeParams = {
  ky: [0.0345, 0.1828, 0.3812, 0.6605, 0.8814, 0.9631, 1],   // tangents: [1.4831, 1.4038, 1.2198, 0.9867, 0.6608, 0.4346, 0.3693]
  sat: [0.9831, 1.2727, 1.4573],
  tintS: [-0.0291, 0.0411], tintM: [0.0376, -0.0104], tintH: [0.0144, -0.0047],
  vig: [0.1, 0.45],
};
//   shadows tint: hue 20 deg, RGB offset (+16.5, -3.5, -13.8)/255
//   mids tint: hue 230 deg, RGB offset (-4.2, -0.6, +17.8)/255
//   highlights tint: hue 228 deg, RGB offset (-1.9, -0.1, +6.8)/255
export const GRADE_GOLDEN: GradeParams = {
  ky: [0.0311, 0.1877, 0.4017, 0.6754, 0.875, 0.9582, 1],   // tangents: [1.5667, 1.498, 1.2526, 0.9235, 0.6445, 0.4724, 0.4183]
  sat: [0.8316, 0.8799, 1.7061],
  tintS: [0.0528, 0.0004], tintM: [0.0583, -0.0003], tintH: [0, 0],
  vig: [0.16, 0.4],
};
//   shadows tint: hue 246 deg, RGB offset (+0.2, -2.6, +25.0)/255
//   mids tint: hue 245 deg, RGB offset (-0.1, -2.7, +27.6)/255
//   highlights tint: hue 0 deg, RGB offset (+0.0, -0.0, +0.0)/255

export class GradeEffect extends Effect {
  constructor(p: GradeParams, amount = 1) {
    super("GradeEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["gradeKy", new Uniform(p.ky.slice())],
        ["gradeKm", new Uniform(monoTangents(p.ky))],
        ["gradeSat", new Uniform(new Vector3(...p.sat))],
        ["gradeTintS", new Uniform(tintRGB(...p.tintS))],
        ["gradeTintM", new Uniform(tintRGB(...p.tintM))],
        ["gradeTintH", new Uniform(tintRGB(...p.tintH))],
        ["gradeVig", new Uniform(new Vector2(...p.vig))],
        ["gradeAmount", new Uniform(amount)],
      ]),
    });
  }
  /** switch preset per shot (day <-> golden) or blend two presets during a crossfade/time-of-day change */
  set(p: GradeParams, q?: GradeParams, t = 0) {
    const L = (a: number, b: number) => a + (b - a) * t;
    const r: GradeParams = q ? {
      ky: p.ky.map((v, i) => L(v, q.ky[i])),
      sat: [L(p.sat[0], q.sat[0]), L(p.sat[1], q.sat[1]), L(p.sat[2], q.sat[2])],
      tintS: [L(p.tintS[0], q.tintS[0]), L(p.tintS[1], q.tintS[1])], tintM: [L(p.tintM[0], q.tintM[0]), L(p.tintM[1], q.tintM[1])],
      tintH: [L(p.tintH[0], q.tintH[0]), L(p.tintH[1], q.tintH[1])], vig: [L(p.vig[0], q.vig[0]), L(p.vig[1], q.vig[1])],
    } : p;
    const u = this.uniforms;
    u.get("gradeKy")!.value = r.ky.slice();
    u.get("gradeKm")!.value = monoTangents(r.ky);
    (u.get("gradeSat")!.value as Vector3).set(...r.sat);
    u.get("gradeTintS")!.value = tintRGB(...r.tintS);
    u.get("gradeTintM")!.value = tintRGB(...r.tintM);
    u.get("gradeTintH")!.value = tintRGB(...r.tintH);
    (u.get("gradeVig")!.value as Vector2).set(...r.vig);
  }
  get amount() { return this.uniforms.get("gradeAmount")!.value as number; }
  set amount(v: number) { this.uniforms.get("gradeAmount")!.value = v; }
}

/** Presets per light (plain objects: edit / re-fit freely). */
// Round-2 re-fit on the relit world (WORLD agent, 2026-10-31). The fitted presets above brighten (they were fitted to
// the old dark stills) and washed the new lighting out; these are gentle S-curves at full strength instead.
//   day: mid knot .60 for median Y' ~.57, darks pressed (.1 -> .085), neutral shadows (v10.14).
//   golden: stronger S (darks .1 -> .09, mids .5 -> .54), neutral shadows (v10.14), orange highlight tint, heavier vignette.
export const GRADE_DAY2: GradeParams = {
  ky: [0.04, 0.25, 0.55, 0.84, 0.952, 0.97, 0.975],   // skull video: brighter (kit 82 vs Rick 107-132); was [0.0279, 0.219, 0.505, 0.815, 0.948, 0.97, 0.975]   // r60: deeper darks (reviewer: daylight frames hazy and washed out)   // r46: brighter mids (frames averaged ~110 against the boards' 137-173)   // r44: highlights roll off below white (skies and windows clipped)   // r36: +0.3 stop in the mids
  sat: [0.95, 1.2, 1.05],   // skull video: was [1.25, 1.9, 1.6] (kit: saturation 0.65 vs Rick 0.44-0.50)
  tintS: [0.052, -0.03], tintM: [0.008, -0.008], tintH: [0.004, 0.006],   // r60: bluer shadows, a touch of warm sun   // r12: blue-grey shadows; brick video r5: saturated day (~0.46), cyan-blue shadows (no purple)
  vig: [0.1, 0.45],
};
export const GRADE_GOLDEN2: GradeParams = {
  ky: [0.0315, 0.1518, 0.35, 0.62, 0.87, 0.967, 1.0],
  sat: [1.24, 1.4, 1.3],
  tintS: [0.028, -0.034], tintM: [0.006, -0.006], tintH: [-0.012, 0.006],   // r12: cooler; brick video r5: cool cyan-blue shadows under warm highlights
  vig: [0.16, 0.42],
};
/** Ice video (v13 6.3: night is deep blue, never black; near-black under 2 %, darkest 2 % around 15-25): a lifted black
 *  point and opened shadows for the night scenes, and a lifted golden curve for dusk, the cellar and sunrise. */
export const GRADE_NIGHT: GradeParams = {
  ky: [0.0315, 0.3128, 0.635, 0.85, 0.945, 0.97, 0.98],   // r76i: a real black point
   // r76i: +~0.2 EV (the shed measured 109-118)
   // r76: +~0.25 EV (night frames measured 95 against the boards' 137-173)   // r47: brighter again (the shed inserts measured 92-97 against 108-138)   // r46: +~0.3 EV (the shed measured 85-89)   // r36: lifted (the shed insert measured 74)
  sat: [1.0, 1.0, 0.95],   // skull video: was [1.3, 1.32, 1.18]   // r48: richer (the office and shed inserts measured saturation 83-100)
  tintS: [0.04, -0.035], tintM: [0.018, -0.02], tintH: [-0.03, 0.03],   // r76i: teal-blue night shadows (blue + red wood read mauve; teal keeps it brown-blue)   // r76h: shadows neutral-teal, no blue (the shed walls still read mauve)
   // r76: a gentler blue (both reviewers: the shed walls read mauve-purple)   // r60: a stronger blue night against warmer lamp pools (both reviewers: the night rooms read amber/grey)
    // r47: less red in the shadows and mids (the shed walls measured 105/91/100, mauve)   // r43: bluer night shadows and mids, the lamp pools warm in the highlights (the night rooms read warm brown)   // r26: bluer night mids around the warm pools   // r12; brick video r5: deep cyan-blue night (no plum), warm pools stay warm
  vig: [0.26, 0.36],   // r60: darker corners (no falloff into the room's corners)
};
export const GRADE_DAWN: GradeParams = {
  ky: [0.045, 0.27, 0.56, 0.84, 0.95, 0.963, 0.97],   // skull video: brighter; was [0.0383, 0.2346, 0.5, 0.8, 0.94, 0.962, 0.97]   // r46: brighter mids   // r44: highlight roll-off (the hook window clipped)   // r36: +0.3 stop (dawn and sunset)
  sat: [1.25, 1.45, 1.25],   // 11-26 boat video kit: saturation 0.36 vs Rick 0.44-0.50   // skull video: was [1.4, 1.7, 1.46]
  tintS: [0.036, -0.044], tintM: [0.008, -0.01], tintH: [-0.012, 0.006],   // r12: blue-grey shadows under warm light; brick video r5: cool cyan shadows, warm highlights
  vig: [0.12, 0.42],
};
/** r12: the drizzle week - cool blue-grey through the mids (no mauve ground), still saturated */
export const GRADE_GREY: GradeParams = {
  ky: [0.027, 0.2668, 0.57, 0.83, 0.94, 0.965, 0.975],   // r76i: a duller drizzle (it read as bright as noon)
   // r76i: a real black point (lifted blacks read milky)
   // r76i: +~0.3 EV (the drizzle measured 97 against 137-173)
   // r76: brighter (the drizzle measured 91)   // r53: a touch brighter (the drizzle measured 105)   // r46: brighter   // r43: a touch darker mids (the drizzle paving read bright and dry)   // r36: lifted
  sat: [0.82, 0.86, 0.86],   /* r76i (reviewer: the drizzle read saturated and sunny): an overcast grey grade */   // r76i (reviewer): the drizzle read as grey mush   // r60: less (reviewer: lush greens under a drizzle sky)   // r48: richer   // r46: more colour (the drizzle measured saturation 84, near grey)   // r36: a touch more colour (the drizzle read flat grey)   // r26: a real grey-green drizzle (the saturated version read as a sunny day)
  tintS: [-0.03, 0.04], tintM: [-0.02, 0.03], tintH: [0.016, -0.014],   // r43: cooler overcast
  vig: [0.12, 0.45],
};
/** r20: the inn at night - warm ochre, more contrast than dawn (the dawn grade washed the plaster out) */
export const GRADE_INN: GradeParams = {
  ky: [0.02, 0.255, 0.58, 0.84, 0.94, 0.958, 0.968],   // r76i: a real black point (the inn read pink-milky)
   // r76i: +~0.25 EV (the inn measured 104)
   // r76: +~0.2 EV (the inn measured 97)   // r53: +~0.2 EV in the mids (the inn measured 96 against the boards' 137-173)   // r47: highlights rolled off (the back wall blew out cream)   // r46: brighter mids   // r44: the lamp-lit plaster no longer clips   // r36: lifted (the inn measured 95)
  sat: [1.02, 1.06, 1.0],   // r76i (both reviewers): the maroon coat went scarlet in the inn   // r26: less saturated (a third of the inn frame was over 0.7 saturation)
  tintS: [0.04, -0.035], tintM: [0.015, -0.018], tintH: [-0.03, 0.026],   // r76i: teal-blue night shadows under the warm lamps   // r76h: neutral shadows (floor and bar still read mauve)
   // r76: less blue in the shadows (floor and bar read mauve)   // r60: cool corners, warm lamp light   // r55: blue night shadows and mids under the warm lamps (it read as a warm afternoon room)
  vig: [0.26, 0.36],
};
/** r21: the sunset lane - the dawn curve with teal-grey shadows (the road went mauve under the dawn tint) */
export const GRADE_SUNSET: GradeParams = { ...GRADE_DAWN, sat: [GRADE_DAWN.sat[0] * 0.82, GRADE_DAWN.sat[1] * 0.8, GRADE_DAWN.sat[2] * 0.83]   /* r76h: ~10 % less again (the lane still read saturated orange) */, tintS: [0.045, -0.03], tintM: [0.008, -0.012] };   /* r76i (reviewer): blue-grey shadows under the sunset (one orange block) */   // r76: ~18 % less saturation (the sunset bricks clipped orange, R-B +145)
/** r53: the hook morning - the dawn curve with real darks and a lower highlight shoulder (reviewers: lifted grey darks, blown sky, the weakest frame) */
export const GRADE_MORNING: GradeParams = { ...GRADE_DAWN, ky: [0.045, 0.29, 0.61, 0.875, 0.952, 0.962, 0.97],   /* skull video: brighter mids (kit 82 vs Rick 107-132) */ tintS: [0.05, -0.03] };   /* r76i: +~0.25 EV (the hook measured 116) */   /* r60: less milky haze, bluer shadows */
/** Dripping tap (2026-11-26): the office/dawn curves lifted 0.25 -> 0.56-0.66 and washed the snowy night out (kit: luma 160-190,
 *  saturation 0.12-0.25 against Rick's 107-132 / 0.44-0.50). Drip presets: a plain S-curve with real darks, blue moonlit
 *  snow at night, and more colour in the mids (fitted offline on the stills with tools/gradesim.py). */
export const GRADE_DRNIGHT: GradeParams = { ky: [0.02, 0.15, 0.38, 0.66, 0.85, 0.93, 0.96], sat: [1.3, 1.45, 1.3], tintS: [0.06, -0.04], tintM: [0.05, -0.03], tintH: [0.025, -0.012], vig: [0.22, 0.38] };
export const GRADE_DRDAY: GradeParams = { ky: [0.03, 0.17, 0.42, 0.72, 0.89, 0.955, 0.975], sat: [1.25, 1.62, 1.4], tintS: [0.04, -0.03], tintM: [0, 0], tintH: [-0.01, 0.01], vig: [0.12, 0.42] };
export type GradeName = "day" | "golden" | "night" | "dawn" | "grey" | "inn" | "sunset" | "morning" | "office" | "drnight" | "drday" | "warmint" | "bsKitG" | "bsDinG" | "brewG" | "grocG" | "stDayG" | "stNightG" | "cellarG";
/** v34 R&D (2026-11-27): a WARM INTERIOR that is already lit bright (kitchens, shops, dining rooms). Contrast, a real black
 *  point and a top end that reaches 1.0 (heads white), instead of the inn/office lift that milked bright sets out. */
export const GRADE_WARMINT: GradeParams = { ky: [0.025, 0.14, 0.35, 0.65, 0.9, 0.985, 1.0], sat: [1.2, 1.32, 1.1], tintS: [0.02, -0.03], tintM: [0.006, -0.004], tintH: [-0.004, 0.0], vig: [0.18, 0.4] };
/** r76i (reviewer): the night office graded deep blue round the candle pool - it breaks the amber run from the spring yard to the sunset lane */
export const GRADE_OFFICE: GradeParams = { ...GRADE_NIGHT, ky: [0.04, 0.31, 0.66, 0.875, 0.95, 0.968, 0.975],   /* skull video: the night measured 77-82 with 17-26% near-black */   /* r76i (reviewer: a milky veil lifted the blacks) */ tintS: [0.09, -0.05], tintM: [0.06, -0.04], tintH: [-0.02, 0.02], sat: [1.0, 0.9, 1.05] };   /* r76i: a real blue night (the office still read amber) */
/** fitted with kit/grade_fit.py on the raw (grade off) stills of each bistro light (v34 R&D) */
export const GRADE_BSKIT: GradeParams = { ...GRADE_WARMINT, ky: [0.025, 0.112, 0.252, 0.496, 0.746, 0.975, 1.0], sat: [1.0, 1.0, 1.0] };
export const GRADE_BSDIN: GradeParams = { ...GRADE_WARMINT, ky: [0.045, 0.192, 0.375, 0.663, 0.867, 0.975, 1.0], sat: [1.0, 1.0, 1.0] };
// p14 "malt syrup" sets, fitted by kit/grade_fit.py on grade-off stills (Nov 27); stDayG hand-set (the fit crushed the shade side)
export const GRADE_BREW: GradeParams = { ...GRADE_WARMINT, ky: [0.035, 0.292, 0.482, 0.708, 0.871, 0.975, 1.0], sat: [1.0, 1.0, 1.0] };
export const GRADE_GROC: GradeParams = { ...GRADE_WARMINT, ky: [0.035, 0.307, 0.485, 0.694, 0.859, 0.975, 1.0], sat: [1.0, 1.0, 1.0] };
export const GRADE_STDAY: GradeParams = { ...GRADE_DRDAY, ky: [0.035, 0.13, 0.28, 0.54, 0.785, 0.96, 1.0], sat: [1.0, 1.05, 1.0] };
export const GRADE_STNIGHT: GradeParams = { ...GRADE_DRNIGHT, ky: [0.045, 0.255, 0.478, 0.753, 0.909, 0.975, 1.0], sat: [1.25, 1.6, 1.4] };
export const GRADE_CELLAR: GradeParams = { ...GRADE_WARMINT, ky: [0.045, 0.299, 0.487, 0.711, 0.872, 0.975, 1.0], sat: [1.0, 1.0, 1.0] };
export const GRADES: Record<GradeName, GradeParams> = { brewG: GRADE_BREW, grocG: GRADE_GROC, stDayG: GRADE_STDAY, stNightG: GRADE_STNIGHT, cellarG: GRADE_CELLAR, bsKitG: GRADE_BSKIT, bsDinG: GRADE_BSDIN, warmint: GRADE_WARMINT, drnight: GRADE_DRNIGHT, drday: GRADE_DRDAY, office: GRADE_OFFICE, day: GRADE_DAY2, golden: GRADE_GOLDEN2, night: GRADE_NIGHT, dawn: GRADE_DAWN, grey: GRADE_GREY, inn: GRADE_INN, sunset: GRADE_SUNSET, morning: GRADE_MORNING };
/** One strength (0..1, the effect's `amount`) per preset, set against the NEW world (bridge_world, 2026-10-31): full-strength
 *  presets overshot (day median Y' .59-.67 vs target .571, golden .58 vs .52); day 0.65 / golden 0.45 land at
 *  .54-.62 / ~.52. Re-fit the presets (grade.md 5.C) after the merge and raise these again. */
/* r76i (both reviewers): every lifted black point cut to 45% and the shadows deepened 8% (interiors read milky with lifted blacks) */
export const GRADE_STRENGTH: Record<GradeName, number> = { brewG: 1, grocG: 1, stDayG: 1, stNightG: 1, cellarG: 1, bsKitG: 1, bsDinG: 1, warmint: 1, drnight: 1, drday: 1, day: 1, golden: 1, night: 1, dawn: 1, grey: 1, inn: 1, sunset: 1, morning: 1, office: 1 };
/** Apply the preset of a light to the effect (only touches uniforms when the light changes). */
export function gradeFor(fx: GradeEffect, light: GradeName) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(GRADES[light]); tag._light = light; }
  fx.amount = GRADE_STRENGTH[light];
}
