// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export const BASE_LIGHTS: Record<"day" | "golden", LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const BASE_LOOK: Record<"day" | "golden", WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
};

// ---------------- our scene keys (Why Boston Shipped Ice to India) ----------------
// Each key = a base preset (day/golden, which also picks the grade) + overrides. Shadows stay blue-violet (never brown/grey).
export type LightName = "dusk" | "tropic" | "sea" | "night" | "lab" | "spring" | "micro" | "beach" | "cabin" | "golden" | "summer" | "day";
type Over = { base: "day" | "golden"; L?: Partial<LightPreset>; K?: Partial<WorldLook> };
const sky5 = (c: string[], e = [0, 4, 10, 20, 40]) => ({ c, e });
const OVER: Record<LightName, Over> = {
  day: { base: "day" },
  // snowy Boston at dusk: cool blue-violet sky light, warm lamp pools (point lights), warm card tint + cool far side, rim on
  dusk: { base: "golden", L: { az: 140, el: 14, lit: [0.62, 0.66, 1.05], shade: [0.16, 0.16, 0.34], lift: [0.03, 0.04, 0.13], term: 0.15,
      charTint: [1.0, 0.86, 0.74], charShade: 0.9, sideTint: [0.74, 0.8, 1.06], actorShadow: false, blob: [0.62, 0.62, 0.8],
      top: "#232a66", hor: "#e9a2a6", fog: "#8f7fb0", fogNear: 18, fogFar: 160, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#f0aaa4", "#c98aa8", "#7d6aa8", "#3f4488", "#222a62"]), cloud: { lit: "#f6c2c4", mid: "#b49ac4", shade: "#6e6aa4" }, sat: 1.05,
      water: { near: "#1f3a72", mid: "#2b4f8e", far: "#7d6aa8", crest: "#9fb0e0", trough: "#14244f", glint: "#ffd9a0", shade: [0.42, 0.46, 0.72] } } },
  // sunny tropical port at noon: hot, saturated, turquoise sea
  tropic: { base: "day", L: { az: 70, el: 55, lit: [1.72, 1.56, 1.24], shade: [0.32, 0.3, 0.44], charTint: [1.0, 0.95, 0.88], top: "#1d78dc", hor: "#bfe4fb", fog: "#bfe4fb", fogNear: 40, fogFar: 340 },
    K: { sky: sky5(["#c4e8fb", "#9fd2f6", "#5fafee", "#3592e4", "#1c6fd2"]), sat: 1.15,
      water: { near: "#1fc9c2", mid: "#12a6c8", far: "#1580c2", crest: "#b8fff4", trough: "#0b6f9a", glint: "#ffffff", shade: [0.5, 0.6, 0.75] } } },
  sea: { base: "day", L: { az: 30, el: 38, lit: [1.85, 1.62, 1.22], shade: [0.3, 0.3, 0.46], charTint: [1.0, 0.94, 0.86], top: "#1b6fd6", hor: "#d8ecfa", fog: "#d8ecfa", fogNear: 60, fogFar: 420, sunDisc: "#fff1c8" },
    K: { sky: sky5(["#e2f1fb", "#bcdcf6", "#7cb6ee", "#4592e2", "#1f6cd0"]), sat: 1.1,
      water: { near: "#1688c8", mid: "#0f68b4", far: "#2a7ac4", crest: "#d6f4ff", trough: "#0a4688", glint: "#ffffff", shade: [0.5, 0.56, 0.74] } } },
  // debtors' prison at night: moon-blue key through the window, candle pool, warm card tint (candle) with cool far side
  night: { base: "day", L: { az: -60, el: 35, lit: [0.5, 0.58, 0.98], shade: [0.11, 0.11, 0.24], lift: [0.02, 0.03, 0.1], term: 0.15,
      charTint: [1.0, 0.84, 0.68], charShade: 0.9, sideTint: [0.7, 0.76, 1.05], blob: [0.55, 0.55, 0.78],
      top: "#141a42", hor: "#33407e", fog: "#2a3266", fogNear: 12, fogFar: 90, sunCol: "#000000" },
    K: { sky: sky5(["#3a4888", "#2c3a78", "#222e66", "#1a2456", "#121a44"]), sat: 1.05, cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  // dim ice house: warm lantern key, violet shade, cold daylight spilling from the barn door (point light)
  lab: { base: "golden", L: { az: 110, el: 30, lit: [1.35, 0.98, 0.62], shade: [0.2, 0.18, 0.34], lift: [0.03, 0.03, 0.1], term: 0.18,
      charTint: [1.0, 0.88, 0.74], charShade: 0.9, sideTint: [0.8, 0.84, 1.05], actorShadow: false, blob: [0.6, 0.58, 0.72],
      top: "#9fc6f2", hor: "#e8f3ff", fog: "#c9b39a", fogNear: 25, fogFar: 140, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#eef6ff", "#d6e8fb", "#b3d3f5", "#8fbdee", "#6aa4e4"]), sat: 1.05, bounce: [0.03, 0.02, 0.0] } },
  spring: { base: "day", L: { az: 65, el: 45, lit: [1.62, 1.55, 1.3], charTint: [1.0, 0.95, 0.9] },
    K: { sky: sky5(["#c6e2f7", "#a6cdf2", "#6fa8e6", "#4b8ede", "#2d72cf"]), sat: 1.12,
      water: { near: "#2fb3b0", mid: "#1f8fae", far: "#2c6fa8", crest: "#c8fff2", trough: "#11607e", glint: "#ffffff", shade: [0.5, 0.58, 0.74] } } },
  // inside a pinch of sawdust: amber/gold glow, red-orange heat
  micro: { base: "golden", L: { az: 40, el: 30, lit: [1.6, 1.12, 0.6], shade: [0.34, 0.2, 0.3], lift: [0.06, 0.04, 0.08], charTint: [1.0, 0.86, 0.66],
      top: "#9a4a20", hor: "#ffcf7e", fog: "#e8a85a", fogNear: 6, fogFar: 60, sunDisc: "#000000", sunCol: "#000000", actorShadow: false },
    K: { sky: sky5(["#ffd88a", "#f6b45e", "#d98a3e", "#b0642a", "#7e4220"]), sat: 1.1 } },
  beach: { base: "day", L: { az: 80, el: 58, lit: [1.82, 1.66, 1.36], shade: [0.34, 0.32, 0.48], top: "#1e86ea", hor: "#c6ecff", fog: "#c6ecff", fogNear: 40, fogFar: 360 },
    K: { sky: sky5(["#cdeeff", "#a6dcfb", "#62b8f2", "#3a98e8", "#1d78dc"]), sat: 1.18,
      water: { near: "#3fd7cf", mid: "#1fb5d2", far: "#1a8cd0", crest: "#e4fffb", trough: "#0f7aa6", glint: "#ffffff", shade: [0.5, 0.6, 0.75] } } },
  // captain's cabin at night: brass-lamp orange key, moon-blue porthole, violet shade
  cabin: { base: "golden", L: { az: 100, el: 40, lit: [1.45, 0.98, 0.56], shade: [0.15, 0.13, 0.3], lift: [0.03, 0.03, 0.12], term: 0.16,
      charTint: [1.0, 0.84, 0.66], charShade: 0.9, sideTint: [0.76, 0.8, 1.06], actorShadow: false, blob: [0.58, 0.55, 0.72],
      top: "#141c46", hor: "#2f3f86", fog: "#3a2e4a", fogNear: 10, fogFar: 60, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#3c4c90", "#2e3d7e", "#222f68", "#192452", "#101840"]), sat: 1.06,
      water: { near: "#1a2c62", mid: "#22397a", far: "#3c4c90", crest: "#8a9cd6", trough: "#0f1a42", glint: "#e6eeff", shade: [0.42, 0.46, 0.72] } } },
  golden: { base: "golden" },
  summer: { base: "day", L: { az: 70, el: 40, lit: [1.66, 1.52, 1.3], charTint: [1.0, 0.95, 0.9] }, K: { sat: 1.1 } },
};
export const LIGHTS = {} as Record<LightName, LightPreset & { grade: "day" | "golden" }>;
export const LOOK = {} as Record<LightName, WorldLook>;
for (const [k, o] of Object.entries(OVER) as [LightName, Over][]) {
  LIGHTS[k] = { ...BASE_LIGHTS[o.base], ...(o.L ?? {}), grade: o.base };
  LOOK[k] = { ...BASE_LOOK[o.base], ...(o.K ?? {}) };
}
