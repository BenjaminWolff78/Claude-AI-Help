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
export type LightName = "dusk" | "tropic" | "sea" | "night" | "lab" | "spring" | "micro" | "beach" | "cabin" | "golden" | "summer" | "day" | "nightOut" | "microBlue" | "labNight"
  | "paris" | "fair" | "study" | "salon" | "salonNight" | "ministry" | "carlot" | "goldTower" | "train" | "police" | "ending"
  | "road" | "roadLate" | "orchard" | "stadium" | "finish" | "drugNight"
  | "desert" | "desertLate" | "london" | "mapRoom" | "payoff" | "officeNight"
  // ---- potato short ----
  | "morning" | "fieldDay" | "fieldNight" | "dawn" | "morningBright" | "evening" | "palace" | "corridor" | "banquet" | "hutNight";
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
  // the explanation beat (v10.4 light arc): deep night blue outdoors, warm lamp pools, cool far side
  nightOut: { base: "day", L: { az: -55, el: 38, lit: [0.6, 0.7, 1.16], shade: [0.12, 0.13, 0.3], lift: [0.03, 0.04, 0.13], term: 0.15,
      charTint: [1.0, 0.86, 0.72], charShade: 0.9, sideTint: [0.72, 0.8, 1.1], blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#2c3a78", fogNear: 22, fogFar: 150, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.08, cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" },
      water: { near: "#16285e", mid: "#1d3474", far: "#3a4c96", crest: "#8fa4e0", trough: "#0c163e", glint: "#ffe2a8", shade: [0.4, 0.46, 0.72] } } },
  microBlue: { base: "golden", L: { az: 40, el: 30, lit: [0.86, 0.92, 1.4], shade: [0.16, 0.16, 0.36], lift: [0.04, 0.05, 0.14], charTint: [1.0, 0.9, 0.8],
      top: "#0e1846", hor: "#3c5cb0", fog: "#22346e", fogNear: 6, fogFar: 60, sunDisc: "#000000", sunCol: "#000000", actorShadow: false },
    K: { sky: sky5(["#4e6cc0", "#3a56a6", "#2a428c", "#1c2e6e", "#111c4c"]), sat: 1.1 } },
  labNight: { base: "golden", L: { az: 110, el: 30, lit: [1.2, 0.95, 0.72], shade: [0.15, 0.15, 0.34], lift: [0.03, 0.03, 0.12], term: 0.18,
      charTint: [1.0, 0.88, 0.74], charShade: 0.9, sideTint: [0.74, 0.8, 1.08], actorShadow: false, blob: [0.58, 0.56, 0.74],
      top: "#121a46", hor: "#33458e", fog: "#2a2e5a", fogNear: 22, fogFar: 120, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#40549e", "#30428a", "#223274", "#18245c", "#0f1844"]), sat: 1.05, bounce: [0.02, 0.02, 0.03] } },
  // ---------------- The Man Who Sold the Eiffel Tower (1925) ----------------
  // Paris spring day: clean blue sky, warm cream stone, soft violet shade
  paris: { base: "day", L: { az: 62, el: 42, lit: [1.64, 1.52, 1.3], shade: [0.3, 0.29, 0.42], charTint: [1.0, 0.95, 0.9], top: "#2f7fd8", hor: "#cfe2f4", fog: "#cfe2f4", fogNear: 90, fogFar: 1100 },
    K: { sky: sky5(["#d6e8f6", "#b2d2f2", "#78aee8", "#4e8fdc", "#2e70cc"]), sat: 1.1 } },
  // 1889 World's Fair: hot bright festival day, saturated sky
  fair: { base: "day", L: { az: 75, el: 50, lit: [1.76, 1.6, 1.3], shade: [0.32, 0.3, 0.46], charTint: [1.0, 0.95, 0.86], top: "#1f74da", hor: "#c8e6fb", fog: "#c8e6fb", fogNear: 90, fogFar: 1100 },
    K: { sky: sky5(["#d2ecfb", "#a8d6f6", "#68b2ee", "#3c94e4", "#1e72d4"]), sat: 1.16 } },
  // Lustig's attic at night: warm desk-lamp key, moon-blue window, violet shade
  study: { base: "golden", L: { az: 95, el: 40, lit: [1.5, 1.02, 0.58], shade: [0.15, 0.13, 0.3], lift: [0.03, 0.03, 0.12], term: 0.16,
      charTint: [1.0, 0.85, 0.68], charShade: 0.9, sideTint: [0.76, 0.8, 1.06], actorShadow: false, blob: [0.58, 0.55, 0.72],
      top: "#141c46", hor: "#2f3f86", fog: "#3a2e4a", fogNear: 10, fogFar: 60, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#3c4c90", "#2e3d7e", "#222f68", "#192452", "#101840"]), sat: 1.06, cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  // grand hotel salon by day: warm chandelier + bright window light, cream and gold
  salon: { base: "golden", L: { az: 70, el: 35, lit: [1.62, 1.22, 0.82], shade: [0.24, 0.2, 0.36], lift: [0.04, 0.04, 0.1], term: 0.18,
      charTint: [1.0, 0.9, 0.78], charShade: 0.9, sideTint: [0.84, 0.86, 1.04], actorShadow: false, blob: [0.62, 0.58, 0.72],
      top: "#8fc0f0", hor: "#f2f6ff", fog: "#d8c2a2", fogNear: 25, fogFar: 140, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#f4f8ff", "#dbeafb", "#b6d4f5", "#90bdee", "#6aa4e4"]), sat: 1.06, bounce: [0.03, 0.02, 0.0] } },
  // the same salon at night: deep night blue through the windows, one warm lamp pool (the explanation begins)
  salonNight: { base: "golden", L: { az: 110, el: 30, lit: [1.1, 0.9, 0.74], shade: [0.13, 0.14, 0.34], lift: [0.03, 0.03, 0.13], term: 0.18,
      charTint: [1.0, 0.88, 0.74], charShade: 0.9, sideTint: [0.72, 0.8, 1.1], actorShadow: false, blob: [0.56, 0.56, 0.76],
      top: "#101848", hor: "#33458e", fog: "#26305e", fogNear: 20, fogFar: 110, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#40549e", "#30428a", "#223274", "#18245c", "#0f1844"]), sat: 1.05, bounce: [0.02, 0.02, 0.03], cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  // government office at night: blue window light, green-shaded desk lamps
  ministry: { base: "golden", L: { az: -70, el: 34, lit: [0.86, 0.9, 1.22], shade: [0.12, 0.13, 0.32], lift: [0.03, 0.04, 0.13], term: 0.16,
      charTint: [1.0, 0.9, 0.78], charShade: 0.9, sideTint: [0.7, 0.8, 1.1], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#24305e", fogNear: 16, fogFar: 90, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.06, cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  // modern used-car lot at night: night blue + warm string bulbs
  carlot: { base: "day", L: { az: -50, el: 36, lit: [0.62, 0.72, 1.18], shade: [0.12, 0.13, 0.3], lift: [0.03, 0.04, 0.13], term: 0.15,
      charTint: [1.0, 0.88, 0.74], charShade: 0.9, sideTint: [0.72, 0.8, 1.1], blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#2c3a78", fogNear: 22, fogFar: 150, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.08, cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  // the payoff at the tower: low gold sun, bright and warm again
  goldTower: { base: "golden", L: { az: 25, el: 14, lit: [1.75, 1.05, 0.45], shade: [0.2, 0.18, 0.36], term: 0.1, charTint: [1.0, 0.86, 0.64], fogNear: 90, fogFar: 1000 },
    K: { sky: sky5(["#ffd08a", "#ffb878", "#f39a78", "#d48890", "#9a7898"]), sat: 1.14 } },
  // train compartment at golden dusk
  train: { base: "golden", L: { az: 30, el: 10, lit: [1.62, 1.0, 0.52], shade: [0.3, 0.21, 0.27], lift: [0.06, 0.04, 0.05], charTint: [1.0, 0.86, 0.68], actorShadow: false },
    K: { sky: sky5(["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"]), sat: 1.1 } },
  // police station street at dusk: lavender sky, warm lamp over the door
  police: { base: "golden", L: { az: 135, el: 12, lit: [0.86, 0.78, 1.0], shade: [0.16, 0.16, 0.34], lift: [0.03, 0.04, 0.13], term: 0.15,
      charTint: [1.0, 0.86, 0.74], charShade: 0.9, sideTint: [0.76, 0.8, 1.06], actorShadow: false, blob: [0.6, 0.6, 0.8],
      top: "#2a3070", hor: "#e8a8a8", fog: "#8f80b0", fogNear: 18, fogFar: 160, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#f0b0a6", "#c98fa8", "#806ca8", "#444a8c", "#262e66"]), sat: 1.05, cloud: { lit: "#f6c2c4", mid: "#b49ac4", shade: "#6e6aa4" } } },
  // ending: a month later, bright summer morning at the tower
  ending: { base: "day", L: { az: 70, el: 40, lit: [1.68, 1.54, 1.3], charTint: [1.0, 0.95, 0.9], fogNear: 90, fogFar: 1100 }, K: { sat: 1.12 } },
  // ===== THE RAT POISON GOLD MEDAL (St. Louis, 1904) =====
  // hot August afternoon on the dusty course: high sun, deep blue sky, ochre dust, violet shadows
  road: { base: "day", L: { az: 60, el: 52, lit: [1.66, 1.52, 1.22], shade: [0.32, 0.29, 0.5], charTint: [1.0, 0.95, 0.86], top: "#1f6fd8", hor: "#d6e6f2", fog: "#cddff0", fogNear: 150, fogFar: 1150 },
    K: { sky: sky5(["#d2e6f6", "#a8cef2", "#68a6ea", "#3884de", "#1a60cc"]), sat: 1.06 } },
  // later on the course (Hicks + the coach's car): lower, oranger sun, hazy warm horizon
  roadLate: { base: "golden", L: { az: 40, el: 24, lit: [1.8, 1.28, 0.78], shade: [0.3, 0.24, 0.42], lift: [0.05, 0.04, 0.07], charTint: [1.0, 0.9, 0.76], fogNear: 120, fogFar: 950 },
    K: { sky: sky5(["#ffd9a0", "#ffc890", "#f0b496", "#a8a6c8", "#5c78c0"]), sat: 1.1 } },
  // the orchard by the road: same day, greener bounce under the trees
  orchard: { base: "day", L: { az: 70, el: 48, lit: [1.6, 1.52, 1.2], shade: [0.28, 0.32, 0.48], charTint: [0.98, 1.0, 0.9], top: "#2276d8", hor: "#d8ecee", fog: "#cfe2e6", fogNear: 120, fogFar: 950 },
    K: { sky: sky5(["#d4e8f2", "#aad0f0", "#6aa8ea", "#3a86de", "#1c62cc"]), sat: 1.06 } },
  // the stadium at the start: bright midday, flags and bunting
  stadium: { base: "day", L: { az: 150, el: 44, lit: [1.8, 1.62, 1.3], shade: [0.32, 0.3, 0.46], charTint: [1.0, 0.95, 0.88], top: "#1c6ed6", hor: "#cfe4f6", fog: "#cfe4f6", fogNear: 80, fogFar: 700 },
    K: { sat: 1.12 } },
  // the finish (payoff): bright, warm, saturated, low-ish sun behind the stands
  finish: { base: "golden", L: { az: 145, el: 26, lit: [1.96, 1.44, 0.84], shade: [0.28, 0.24, 0.44], lift: [0.05, 0.04, 0.08], charTint: [1.0, 0.92, 0.78], fogNear: 80, fogFar: 640 },
    K: { sky: sky5(["#ffe2a8", "#ffd294", "#f6bc90", "#9cb2dc", "#4a7cd0"]), sat: 1.2 } },
  // the drugstore at night (the explanation): deep night blue outside, warm gas lamps inside
  // ---- Why He Put a Bridge in the Desert (first drafts; the set builders tune their own) ----
  // the desert town at midday: hot, bleached, deep blue sky, short violet shadows
  desert: { base: "day", L: { az: 70, el: 58, lit: [1.76, 1.6, 1.34], shade: [0.36, 0.3, 0.54], charTint: [1.0, 0.95, 0.86], top: "#1b64d0", hor: "#f2dcc0", fog: "#e8d4d4", fogNear: 220, fogFar: 2300 },
    K: { sky: sky5(["#f4dcc6", "#c4d6ee", "#76aceb", "#3a82dc", "#1a58c4"], [0, 3, 9, 20, 45]), sat: 1.04,
      water: { near: "#2cc6c2", mid: "#1a9cc8", far: "#2a6fb4", crest: "#bff8f2", trough: "#0f6e98", glint: "#ffffff", shade: [0.5, 0.6, 0.76] } } },
  // the desert late afternoon (highway + dinosaur): warmer, longer shadows
  desertLate: { base: "golden", L: { az: 50, el: 30, lit: [1.84, 1.42, 0.98], shade: [0.32, 0.26, 0.5], lift: [0.05, 0.04, 0.08], charTint: [1.0, 0.9, 0.78], fog: "#f0c8b0", fogNear: 200, fogFar: 2100 },
    K: { sky: sky5(["#ffd9a8", "#ffc79a", "#e8b0a6", "#8ea4d4", "#4a72c8"]), sat: 1.16,
      water: { near: "#2aa8b4", mid: "#2a84b4", far: "#c89a94", crest: "#ffe0c0", trough: "#14507e", glint: "#fff0d0", shade: [0.46, 0.5, 0.72] } } },
  // London in the evening fog (the explanation): deep night blue, warm lamps
  london: { base: "golden", L: { az: -40, el: 30, lit: [0.66, 0.72, 1.12], shade: [0.15, 0.16, 0.36], lift: [0.035, 0.045, 0.14], term: 0.16, charTint: [1.0, 0.92, 0.84], charShade: 0.9,
      sideTint: [0.74, 0.82, 1.1], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#14204e", hor: "#5a6aa4", fog: "#45558c", fogNear: 28, fogFar: 240, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#6070ae", "#4a5a96", "#364684", "#24316a", "#141e4c"]), sat: 1.06, bounce: [0.02, 0.02, 0.04],
      cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" },
      water: { near: "#1a275a", mid: "#22357a", far: "#4a5a96", crest: "#7a90d0", trough: "#0f1844", glint: "#ffd890", shade: [0.42, 0.46, 0.74] } } },
  // the giant map room: warm lamp pools on the painted floor, cool fill
  mapRoom: { base: "golden", L: { az: 140, el: 34, lit: [1.42, 1.2, 0.92], shade: [0.3, 0.26, 0.42], lift: [0.05, 0.04, 0.08], term: 0.12, charTint: [1.0, 0.93, 0.84], fogNear: 40, fogFar: 200 }, K: { sat: 1.08, bounce: [0.03, 0.02, 0.0] } },
  // the payoff: the brightest light of the video, sparkling water
  officeNight: { base: "golden", L: { az: -55, el: 36, lit: [0.5, 0.58, 1.0], shade: [0.12, 0.13, 0.32], lift: [0.03, 0.04, 0.13], term: 0.16,
      charTint: [1.0, 0.9, 0.8], charShade: 0.9, sideTint: [0.72, 0.8, 1.1], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#24305e", fogNear: 30, fogFar: 160, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.08, bounce: [0.02, 0.02, 0.04], cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  payoff: { base: "day", L: { az: 120, el: 40, lit: [2.0, 1.78, 1.36], shade: [0.36, 0.33, 0.56], charTint: [1.0, 0.96, 0.88], top: "#1a6ae0", hor: "#d8eef8", fog: "#e0e4f0", fogNear: 240, fogFar: 2300 },
    K: { sky: sky5(["#e4f2fa", "#b4daf6", "#6cb2f0", "#3a8ce4", "#1a64d4"], [0, 3, 9, 20, 45]), sat: 1.22,
      water: { near: "#36d8cc", mid: "#1cb4d0", far: "#1f84c8", crest: "#e4fffb", trough: "#0c7aa0", glint: "#ffffff", shade: [0.52, 0.62, 0.78] } } },
  drugNight: { base: "golden", L: { az: -60, el: 38, lit: [0.5, 0.58, 1.0], shade: [0.12, 0.13, 0.32], lift: [0.03, 0.04, 0.13], term: 0.16,
      charTint: [1.0, 0.9, 0.8], charShade: 0.9, sideTint: [0.72, 0.8, 1.1], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#24305e", fogNear: 18, fogFar: 110, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.08, bounce: [0.02, 0.02, 0.04], cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  // ---------------- potato short: VALLEY lights (main thread) ----------------
  morning: { base: "day", L: { az: 70, el: 34, lit: [1.68, 1.5, 1.22], shade: [0.3, 0.29, 0.42], charTint: [1.0, 0.94, 0.86], top: "#3a86dc", hor: "#cfe6f4", fog: "#cfe6f4", fogNear: 60, fogFar: 420 }, K: { sat: 1.1 } },
  fieldDay: { base: "day", L: { az: 80, el: 46, lit: [1.7, 1.56, 1.28], shade: [0.3, 0.29, 0.44], top: "#2f7fd8", hor: "#c8e2f4", fog: "#c8e2f4", fogNear: 60, fogFar: 420 }, K: { sat: 1.1 } },
  fieldNight: { base: "golden", L: { az: -55, el: 36, lit: [0.52, 0.6, 1.04], shade: [0.12, 0.13, 0.32], lift: [0.03, 0.04, 0.13], term: 0.16,
      charTint: [1.0, 0.9, 0.8], charShade: 0.9, sideTint: [0.72, 0.8, 1.1], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#2a3a72", fogNear: 40, fogFar: 300, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.08, bounce: [0.02, 0.02, 0.04], cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  dawn: { base: "golden", L: { az: 20, el: 8, lit: [1.5, 0.86, 0.6], shade: [0.2, 0.17, 0.38], lift: [0.05, 0.05, 0.14], term: 0.1, charTint: [1.0, 0.84, 0.74],
      top: "#5a5a9c", hor: "#ffc0a0", fog: "#f0b0a4", fogNear: 50, fogFar: 380, sunDisc: "#ffd8b0" },
    K: { sky: sky5(["#ffc8a0", "#f4a8a0", "#d890a8", "#9a84b4", "#5a5a9c"]), sat: 1.1, cloud: { lit: "#ffd8c0", mid: "#f0a8a8", shade: "#a890c4" } } },
  morningBright: { base: "day", L: { az: 60, el: 44, lit: [1.82, 1.66, 1.34], shade: [0.33, 0.31, 0.48], charTint: [1.0, 0.95, 0.88], top: "#1f78e0", hor: "#d4ecf8", fog: "#d4ecf8", fogNear: 80, fogFar: 460 }, K: { sat: 1.16 } },
  evening: { base: "golden", L: { az: 30, el: 12 }, K: { sat: 1.08 } },
  // ---------------- potato short: PALACE + HUT lights (set-builder fork edits only these four) ----------------
  palace: { base: "golden", L: { az: 70, el: 38, lit: [1.62, 1.36, 1.06], shade: [0.26, 0.25, 0.42], lift: [0.05, 0.05, 0.12], term: 0.18,
      charTint: [1.0, 0.93, 0.84], charShade: 0.9, sideTint: [0.84, 0.88, 1.06], actorShadow: false, blob: [0.6, 0.58, 0.72],
      top: "#7fb4ee", hor: "#eef4ff", fog: "#d6d4e6", fogNear: 30, fogFar: 160, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#f2f6ff", "#d6e6fa", "#acd0f4", "#86b8ec", "#5e9ee2"]), sat: 1.08, bounce: [0.03, 0.025, 0.01] } },
  corridor: { base: "golden", L: { az: 110, el: 34, lit: [1.08, 0.98, 1.16], shade: [0.22, 0.18, 0.4], lift: [0.05, 0.04, 0.12], term: 0.18,
      charTint: [1.0, 0.92, 0.9], charShade: 0.9, sideTint: [0.86, 0.84, 1.08], actorShadow: false, blob: [0.58, 0.54, 0.74],
      top: "#7fb4ee", hor: "#eef4ff", fog: "#c8bce0", fogNear: 20, fogFar: 90, sunDisc: "#000000", sunCol: "#000000" },
    K: { sat: 1.08, bounce: [0.03, 0.02, 0.03] } },
  banquet: { base: "golden", L: { az: 60, el: 40, lit: [1.56, 1.27, 0.9], shade: [0.29, 0.24, 0.44], lift: [0.07, 0.06, 0.12], term: 0.16,
      charTint: [1.0, 0.95, 0.84], charShade: 0.9, sideTint: [0.9, 0.88, 1.04], actorShadow: false, blob: [0.66, 0.6, 0.72],
      top: "#7fb4ee", hor: "#fff4e0", fog: "#e8c8a0", fogNear: 60, fogFar: 260, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#fff6e8", "#e4eefa", "#b8d6f6", "#8cbcee", "#64a2e4"]), sat: 1.22, bounce: [0.05, 0.035, 0.0] } },
  hutNight: { base: "golden", L: { az: -55, el: 36, lit: [0.42, 0.5, 0.92], shade: [0.11, 0.11, 0.3], lift: [0.025, 0.035, 0.12], term: 0.16,
      charTint: [1.0, 0.88, 0.76], charShade: 0.9, sideTint: [0.72, 0.8, 1.12], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0f1848", hor: "#3a4c96", fog: "#26346e", fogNear: 14, fogFar: 120, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a5ca6", "#34468e", "#26367a", "#1a2862", "#101a48"]), sat: 1.08, bounce: [0.02, 0.02, 0.05], cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  golden: { base: "golden" },
  summer: { base: "day", L: { az: 70, el: 40, lit: [1.66, 1.52, 1.3], charTint: [1.0, 0.95, 0.9] }, K: { sat: 1.1 } },
};
export const LIGHTS = {} as Record<LightName, LightPreset & { grade: "day" | "golden" }>;
export const LOOK = {} as Record<LightName, WorldLook>;
for (const [k, o] of Object.entries(OVER) as [LightName, Over][]) {
  LIGHTS[k] = { ...BASE_LIGHTS[o.base], ...(o.L ?? {}), grade: o.base };
  LOOK[k] = { ...BASE_LOOK[o.base], ...(o.K ?? {}) };
}
