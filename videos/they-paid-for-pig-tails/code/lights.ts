// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  discYaw?: number; discEl?: number;                                                                  // r12: degrees the visible sun disc sits off the light direction
  headCool?: number; headWarm?: number; /** r43: multiply on the head zone (scene light colour) */ headTint?: C3;                                                                 // r12: 0..1 how much of sideTint the head's far side takes
  bodyGain?: number;   // r52: costume (torso) brightness on the card, by grade if unset
  charGain?: number;                                                                 // r7: overall card brightness (night heads ~200, Rick 180-207)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export const BASE_LIGHTS: Record<"day" | "golden", LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.72,   /* r47: leaf and roof shadows read on the bodies */ charGrad: 0.14,   /* r76g: a visible key side on the heads */ bodyGrad: 0.3,   /* r76i (both reviewers): a readable shadow side on every body */ sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.74,   /* r47 */ charGrad: 0.19, bodyGrad: 0.34, sideTint: [0.85, 0.80, 0.95],
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
export type LightName = "banner" | "wildDusk" | "fireNight" | "smokeMorning" | "smokeDay" | "tavernBlue" | "fireDusk" | "dusk" | "tropic" | "sea" | "night" | "lab" | "spring" | "micro" | "beach" | "cabin" | "golden" | "summer" | "day" | "nightOut" | "microBlue" | "labNight"
  | "paris" | "fair" | "study" | "studioBlue" | "court" | "courtPayoff" | "mine" | "museum" | "hallNight" | "salon" | "salonNight" | "ministry" | "carlot" | "goldTower" | "train" | "police" | "ending"
  | "road" | "roadLate" | "orchard" | "stadium" | "finish" | "drugNight"
  | "desert" | "desertLate" | "london" | "mapRoom" | "payoff" | "officeNight"
  // ---- potato short ----
  | "morning" | "fieldDay" | "fieldNight" | "dawn" | "morningBright" | "evening" | "palace" | "corridor" | "banquet" | "hutNight"
  // ---- cow butt eyes short ----
  | "savMorning" | "savSunset" | "savDay" | "savNight" | "grassNight" | "kitchen" | "savPayoff" | "savGolden"
  // ---- grape bricks short ----
  | "dcOffice"
  // ---- Plimsoll short (v10.14 real look: sunCol / sunI / sky / ground / hemiI drive real lights) ----
  | "dockMorning" | "seaStorm" | "commons" | "dockGold" | "dockNight" | "dockBright" | "bannerReal"
  | "groveDusk" | "groveNight" | "groveMoon" | "grove3am" | "cellarLamp" | "groveSunrise" | "groveSunUp"
  // ---- "He Made Giant Bricks to Pay Half the Tax" ----
  | "yardMorning" | "streetNoon" | "yardGrey" | "siteSpring" | "gateSpring" | "officeCandle" | "shedLantern" | "innEvening" | "laneSunset"
  // ---- "They Scrapped Late Fees and Got a Truckload of Books Back" ----
  | "libMorning" | "libHall" | "libDusk" | "libGrey" | "libBright" | "libRoom" | "aptNight" | "libDay" | "libDawn" | "libRoomDawn"
  // ---- "They Gave Away Free Hens and the Garbage Vanished" ----
  | "htMorning" | "htNoon" | "htGarden" | "htSpring" | "htHall"
  // ---- "He Made Dental Visits Longer and Got Cake" ----
  | "dtMorning" | "dtSpring" | "dtLab" | "ptMarket" | "ptBoss" | "ptOffice" | "ptStudy"
  | "jvMorning" | "jvRiver" | "jvDay" | "jvNight" | "jvEarly" | "jvNoon" | "jvDawn"
  | "mxSmogDawn" | "mxSmogNoon" | "mxMorning" | "mxEvening" | "mxClear" | "mxNight" | "mxDusk" | "mxSunset" | "mxLamp" | "mbOut" | "mbPass" | "mbIn" | "shNight" | "shMorn" | "shGar" | "shIns" | "pgAft" | "pgWoods" | "pgDusk";
type Over = { base: "day" | "golden"; grade?: "day" | "golden" | "night" | "dawn" | "grey" | "inn" | "sunset" | "morning" | "office"; L?: Partial<LightPreset>; K?: Partial<WorldLook> };
const sky5 = (c: string[], e = [0, 4, 10, 20, 40]) => ({ c, e });
const OVER: Record<LightName, Over> = {
  // ---- "He Made Dental Visits Longer and Got Cake" (2026-11-17): warm small-town morning, spring, the lab. v20/v21 grade:
  //      darker than the hens video (Rick brightness 117 vs our 146), less pure white, sunlit interiors (shells cast no shadow)
  // ---- "The Skull That Was Worth More in Pieces" (Java 1937, 2026-11-20): v24 shadows (darkest 2% ~15-25, real dark shadow),
  //      warm tropical light, no blue interiors, purple only in a dawn sky.
  // ---- "They Banned Cars One Day a Week and Got More Cars" (Mexico City 1989, 2026-11-21): v25 6.1-6.3: five kinds of light,
  //      real dark shadow (shade ~0.2), brown smog as fog, one clear blue morning for the fake-out.
  mxSmogDawn: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.88, 0.72], headWarm: 1.3, headCool: 0.5, actorShadow: true, az: 18, el: 9, sunCol: "#ffb878", sunI: 1.7, sky: "#b09a88", ground: "#5a5048", hemiI: 0.58, charTint: [1.0, 0.89, 0.76], sideTint: [0.9, 0.86, 0.9], bodyGrad: 0.2, blob: [0.5, 0.47, 0.46], charGain: 0.84,
    lit: [1.36, 1.04, 0.74], shade: [0.2, 0.18, 0.22], lift: [0.05, 0.05, 0.07], top: "#8a7a78", hor: "#f0a868", fog: "#d49a64", fogNear: 14, fogFar: 150, sunDisc: "#ffd49a" },
    K: { sky: sky5(["#f4a864", "#e0a070", "#b89480", "#94868a", "#7c7684"], [0, 3, 8, 20, 50]), sat: 0.74, cloud: { lit: "#f0c090", mid: "#c89c80", shade: "#8a7c80" } } },
  mxSmogNoon: { base: "day", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.05, headCool: 0.5, blob: [0.52, 0.5, 0.5], az: 120, el: 40, actorShadow: true, sunCol: "#ffe6c0", sunI: 1.45, sky: "#b8a890", ground: "#665a4a", hemiI: 0.62, charTint: [0.96, 0.92, 0.86], charGain: 0.8,
    lit: [1.32, 1.14, 0.9], shade: [0.22, 0.2, 0.22], lift: [0.05, 0.05, 0.06], top: "#9a927e", hor: "#d8b888", fog: "#c8a878", fogNear: 16, fogFar: 170, sunDisc: "#fff0d0" },
    K: { sky: sky5(["#d8b484", "#c8ac86", "#b0a084", "#a09880", "#928c7a"]), sat: 0.72, cloud: { lit: "#e8d2b0", mid: "#c8b494", shade: "#948a7c" } } },
  mxMorning: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.2, headCool: 0.5, actorShadow: true, az: 120, el: 24, sunCol: "#ffe0b8", sunI: 1.65, sky: "#a4b2cc", ground: "#5c564c", hemiI: 0.56, charTint: [0.96, 0.89, 0.8], sideTint: [0.88, 0.9, 0.98], bodyGrad: 0.2, blob: [0.5, 0.48, 0.46], charGain: 0.82,
    lit: [1.3, 1.1, 0.86], shade: [0.2, 0.19, 0.25], lift: [0.05, 0.05, 0.07], top: "#5a86c8", hor: "#f2cc9c", fog: "#dcc4a0", fogNear: 30, fogFar: 240, sunDisc: "#000000" },
    K: { sky: sky5(["#f0c08c", "#dcc4a4", "#acbcd4", "#86a6d8", "#5c84c4"], [0, 3, 8, 20, 50]), sat: 0.73, cloud: { lit: "#fff0dc", mid: "#f0d4b8", shade: "#9ca2be" } } },
  // v26 "mailed bank" (2026-11-23): ONE low gold sun from the west for every place (world-fixed via the set's sunW)
  mbOut: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.25, headCool: 0.55, actorShadow: true, az: 70, el: 27, sunCol: "#ffd4a0", sunI: 2.2, sky: "#9cb0d4", ground: "#6a5a48", hemiI: 0.5, charTint: [1.0, 0.9, 0.79], sideTint: [0.86, 0.88, 1.0], bodyGrad: 0.2, blob: [0.5, 0.47, 0.45], charGain: 0.84,
    lit: [1.4, 1.12, 0.84], shade: [0.2, 0.19, 0.25], lift: [0.05, 0.05, 0.08], top: "#4a7ac4", hor: "#f4d0a4", fog: "#d8d0cc", fogNear: 160, fogFar: 1700, sunDisc: "#000000" },
    K: { sky: sky5(["#f6cfa0", "#e4d0b4", "#aec4dc", "#7ea4d8", "#4e7ac4"], [0, 3, 9, 22, 55]), sat: 0.76, cloud: { lit: "#fff2e0", mid: "#f2d8bc", shade: "#9aa4c4" } } },
  mbPass: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.25, headCool: 0.55, actorShadow: true, az: 70, el: 27, sunCol: "#ffd4a0", sunI: 2.2, sky: "#9cb0d4", ground: "#6a5a48", hemiI: 0.5, charTint: [1.0, 0.9, 0.79], sideTint: [0.86, 0.88, 1.0], bodyGrad: 0.2, blob: [0.5, 0.47, 0.45], charGain: 0.84,
    lit: [1.4, 1.12, 0.84], shade: [0.2, 0.19, 0.25], lift: [0.05, 0.05, 0.08], top: "#4a7ac4", hor: "#f4d0a4", fog: "#d0ccc8", fogNear: 160, fogFar: 1700, sunDisc: "#000000" },
    K: { sky: sky5(["#f6cfa0", "#e4d0b4", "#aec4dc", "#7ea4d8", "#4e7ac4"], [0, 3, 9, 22, 55]), sat: 0.76, cloud: { lit: "#fff2e0", mid: "#f2d8bc", shade: "#9aa4c4" } } },
  mbIn: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.3, headCool: 0.6, actorShadow: true, az: 70, el: 27, sunCol: "#ffcc90", sunI: 2.6, sky: "#c8b498", ground: "#5a4434", hemiI: 0.38, charTint: [1.0, 0.89, 0.76], sideTint: [0.84, 0.84, 0.98], bodyGrad: 0.22, blob: [0.48, 0.44, 0.42], charGain: 0.86, charShade: 0.86,
    lit: [1.32, 1.06, 0.8], shade: [0.2, 0.17, 0.18], lift: [0.05, 0.045, 0.05], top: "#4a7ac4", hor: "#f4d0a4", fog: "#b8a48c", fogNear: 40, fogFar: 320, sunDisc: "#000000" },
    K: { sky: sky5(["#f6cfa0", "#e4d0b4", "#aec4dc", "#7ea4d8", "#4e7ac4"], [0, 3, 9, 22, 55]), sat: 0.76, cloud: { lit: "#fff2e0", mid: "#f2d8bc", shade: "#9aa4c4" } } },
  // v27 "right shoes" (2026-11-23): an Andean town. NIGHT = deep blue moonlight + the orange street lamp + warm shop
  // spots; MORNING = a low warm sun raking in through the open shutter; the GARAGE = a bare bulb + dusty window daylight.
  // ---- "They Paid for Pig Tails and Got a Pig Farm" (2026-11-25): Georgia late afternoon (warm, long shadows), the woods road
  //      (golden backlight through the pines), dusk at the back gate (low orange sun behind the hill, the bulb on)
  pgAft: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.25, headCool: 0.55, actorShadow: true, az: 70, el: 34, sunCol: "#ffd8a8", sunI: 4.2, sky: "#a8bcd8", ground: "#6a604a", hemiI: 0.22, charTint: [1.0, 0.92, 0.82], sideTint: [0.82, 0.86, 1.02], bodyGrad: 0.32, charGrad: 0.26, blob: [0.5, 0.47, 0.45], charGain: 0.86, charShade: 0.86,
    lit: [1.34, 1.12, 0.86], shade: [0.2, 0.2, 0.24], lift: [0.05, 0.05, 0.07], top: "#4a7ac4", hor: "#f0d8b4", fog: "#d8d0c0", fogNear: 70, fogFar: 520, sunDisc: "#000000" },
    K: { sky: sky5(["#f2d6ae", "#e2d6c2", "#b4c8de", "#86aada", "#527cc4"], [0, 3, 9, 22, 55]), sat: 0.86, cloud: { lit: "#fff4e4", mid: "#f2dcc4", shade: "#9ca8c4" } } },
  pgWoods: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.35, headCool: 0.6, actorShadow: true, az: 70, el: 25, sunCol: "#ffcc90", sunI: 4.0, sky: "#b8b498", ground: "#4e4634", hemiI: 0.24, charTint: [1.0, 0.9, 0.78], sideTint: [0.82, 0.86, 1.0], bodyGrad: 0.32, charGrad: 0.26, blob: [0.48, 0.45, 0.42], charGain: 0.86, charShade: 0.85,
    lit: [1.36, 1.08, 0.78], shade: [0.19, 0.19, 0.2], lift: [0.045, 0.045, 0.05], top: "#5a82c0", hor: "#f4cc98", fog: "#c8b490", fogNear: 30, fogFar: 240, sunDisc: "#000000" },
    K: { sky: sky5(["#f8c88a", "#ecc8a4", "#c0c4cc", "#8aa8d4", "#5a80c0"], [0, 3, 9, 22, 55]), sat: 0.84, cloud: { lit: "#ffe8c8", mid: "#f0d0a8", shade: "#a0a0b8" } } },
  pgDusk: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.86, 0.7], headWarm: 1.35, headCool: 0.55, actorShadow: true, az: 8, el: 7, sunCol: "#ff9a58", sunI: 2.0, sky: "#8a80a0", ground: "#4a4048", hemiI: 0.5, charTint: [1.0, 0.86, 0.74], sideTint: [0.9, 0.84, 0.92], bodyGrad: 0.22, blob: [0.48, 0.44, 0.45], charGain: 0.84,
    lit: [1.38, 1.0, 0.72], shade: [0.18, 0.16, 0.24], lift: [0.05, 0.045, 0.08], top: "#4a5a9c", hor: "#ff9e64", fog: "#c08a78", fogNear: 30, fogFar: 260, sunDisc: "#ffc890" },
    K: { sky: sky5(["#ff9a5a", "#f0a07c", "#b898ac", "#7a84b8", "#4c5a9c"], [0, 3, 8, 20, 50]), sat: 0.8, cloud: { lit: "#ffc89c", mid: "#e0a094", shade: "#8a84a8" } } },
  shNight: { base: "golden", grade: "office", L: { headTint: [0.9, 0.93, 1.06], blob: [0.42, 0.42, 0.48], actorShadow: true, az: 120, el: 40, sunCol: "#8aa0d8", sunI: 0.42, sky: "#2a3a60", ground: "#24222e", hemiI: 0.32, charTint: [0.9, 0.92, 1.04], charGain: 0.88, charShade: 0.82, sideTint: [1.1, 0.96, 0.8], charGrad: 0.26, bodyGrad: 0.32, headCool: 1.0, headWarm: 1.35,
    lit: [0.82, 0.88, 1.14], shade: [0.15, 0.16, 0.26], lift: [0.045, 0.05, 0.09], top: "#121a36", hor: "#2a3458", fog: "#1a2240", fogNear: 30, fogFar: 260, sunDisc: "#000000" },
    K: { sky: sky5(["#2e3a5e", "#26324e", "#1c2642", "#161e38", "#10162c"]), sat: 0.86 } },
  shMorn: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.25, headCool: 0.55, actorShadow: true, az: 70, el: 35, sunCol: "#ffd2a0", sunI: 4.4, sky: "#a8bcd8", ground: "#6a5a4a", hemiI: 0.2, charTint: [1.0, 0.92, 0.82], sideTint: [0.82, 0.86, 1.02], bodyGrad: 0.32, charGrad: 0.26, blob: [0.5, 0.47, 0.45], charGain: 0.86, charShade: 0.86,
    lit: [1.36, 1.12, 0.86], shade: [0.2, 0.19, 0.24], lift: [0.05, 0.05, 0.07], top: "#4a7ac4", hor: "#f2d4ac", fog: "#d8ccc0", fogNear: 80, fogFar: 900, sunDisc: "#000000" },
    K: { sky: sky5(["#f4d0a4", "#e2d2bc", "#b0c6de", "#82a8da", "#4e7ac4"], [0, 3, 9, 22, 55]), sat: 0.86, cloud: { lit: "#fff2e0", mid: "#f2d8bc", shade: "#9aa4c4" } } },
  shGar: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.35, headCool: 0.6, actorShadow: true, az: 70, el: 30, sunCol: "#ffd8a8", sunI: 2.6, sky: "#b8a890", ground: "#4a3e34", hemiI: 0.26, charTint: [1.0, 0.89, 0.76], sideTint: [0.82, 0.84, 1.0], bodyGrad: 0.32, charGrad: 0.26, blob: [0.48, 0.44, 0.42], charGain: 0.86, charShade: 0.84,
    lit: [1.3, 1.06, 0.8], shade: [0.19, 0.17, 0.18], lift: [0.045, 0.04, 0.05], top: "#4a7ac4", hor: "#f4d0a4", fog: "#a89884", fogNear: 40, fogFar: 300, sunDisc: "#000000" },
    K: { sky: sky5(["#f6cfa0", "#e4d0b4", "#aec4dc", "#7ea4d8", "#4e7ac4"], [0, 3, 9, 22, 55]), sat: 0.76, cloud: { lit: "#fff2e0", mid: "#f2d8bc", shade: "#9aa4c4" } } },
  shIns: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.94, 0.86], headWarm: 1.1, headCool: 0.5, actorShadow: true, az: 60, el: 35, sunCol: "#fff0dc", sunI: 2.0, sky: "#b0c4dc", ground: "#5a5048", hemiI: 0.6, charTint: [1.0, 0.94, 0.86], sideTint: [0.88, 0.9, 1.0], bodyGrad: 0.2, blob: [0.5, 0.48, 0.48], charGain: 0.86,
    lit: [1.3, 1.16, 0.96], shade: [0.2, 0.2, 0.25], lift: [0.05, 0.05, 0.07], top: "#4a7ac4", hor: "#e8dccc", fog: "#d0ccc8", fogNear: 40, fogFar: 300, sunDisc: "#000000" },
    K: { sky: sky5(["#f0d8b8", "#e0d4c4", "#b4c8dc", "#86a8d8", "#5a84c8"], [0, 3, 9, 22, 55]), sat: 0.76 } },
  mxEvening: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.87, 0.72], headWarm: 1.35, headCool: 0.55, actorShadow: true, az: 60, el: 11, sunCol: "#ffc088", sunI: 1.85, sky: "#a09cc0", ground: "#585048", hemiI: 0.56, charTint: [1.0, 0.89, 0.78], sideTint: [0.84, 0.86, 1.02], bodyGrad: 0.2, blob: [0.5, 0.46, 0.46], charGain: 0.85,
    lit: [1.42, 1.06, 0.74], shade: [0.2, 0.18, 0.25], lift: [0.05, 0.05, 0.08], top: "#6a78b8", hor: "#ffb878", fog: "#e4b890", fogNear: 26, fogFar: 220, sunDisc: "#ffd8a0" },
    K: { sky: sky5(["#ffac70", "#f0b490", "#c4acc0", "#8e9ccc", "#6474b8"], [0, 3, 8, 20, 50]), sat: 0.75, cloud: { lit: "#ffd0a8", mid: "#eab0a0", shade: "#9494b4" } } },
  mxClear: { base: "day", L: { headTint: [1.0, 0.94, 0.84], headWarm: 1.0, headCool: 0.5, blob: [0.52, 0.5, 0.5], az: 110, el: 34, actorShadow: true, sunCol: "#fff2dc", sunI: 1.7, sky: "#a8bcd8", ground: "#645a4a", hemiI: 0.6, charTint: [0.95, 0.93, 0.9], charGain: 0.8,
    lit: [1.42, 1.26, 1.04], shade: [0.21, 0.21, 0.27], lift: [0.05, 0.05, 0.07], top: "#3a7ed8", hor: "#cfe0f4", fog: "#d4dcec", fogNear: 40, fogFar: 340, sunDisc: "#000000" },
    K: { sky: sky5(["#b8d6f4", "#9cc6f0", "#7aaeea", "#5a98e2", "#3a7cd6"]), sat: 0.75, cloud: { lit: "#fafaf6", mid: "#eaeaf0", shade: "#b2bacb" } } },
  mxNight: { base: "golden", grade: "office", L: { headTint: [0.86, 0.9, 1.08], blob: [0.42, 0.42, 0.46], az: 130, el: 40, sunCol: "#7e94cc", sunI: 0.7, sky: "#34486e", ground: "#2e2c3a", hemiI: 0.7, charTint: [0.86, 0.9, 1.04], charGain: 0.86, charShade: 0.8, sideTint: [1.1, 0.96, 0.78], headCool: 1.0, headWarm: 1.3,
    lit: [0.86, 0.9, 1.14], shade: [0.17, 0.18, 0.27], lift: [0.05, 0.055, 0.09], top: "#161e3c", hor: "#2a3458", fog: "#1c243e", fogNear: 14, fogFar: 100, sunDisc: "#000000" },
    K: { sky: sky5(["#2e3a5e", "#26324e", "#1c2642", "#161e38", "#10162c"]), sat: 0.76 } },
  mxDusk: { base: "golden", grade: "office", L: { headTint: [0.94, 0.92, 1.02], blob: [0.46, 0.44, 0.48], az: 30, el: 14, sunCol: "#b8a4d0", sunI: 0.95, sky: "#5a6a9c", ground: "#3e3a48", hemiI: 0.8, charTint: [0.94, 0.92, 1.0], charGain: 0.9, charShade: 0.82, sideTint: [1.12, 0.98, 0.8], headCool: 0.9, headWarm: 1.25,
    lit: [1.0, 0.98, 1.16], shade: [0.2, 0.2, 0.29], lift: [0.06, 0.06, 0.1], top: "#2a3a70", hor: "#e89a78", fog: "#5a5878", fogNear: 20, fogFar: 160, sunDisc: "#000000" },
    K: { sky: sky5(["#f0a078", "#b88898", "#6a70a8", "#3e4c88", "#263468"], [0, 3, 8, 20, 50]), sat: 0.76, cloud: { lit: "#f0b090", mid: "#a888a0", shade: "#5a5a84" } } },
  mxSunset: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.86, 0.68], headWarm: 1.35, headCool: 0.5, actorShadow: true, az: 8, el: 7, sunCol: "#ff9c5a", sunI: 1.8, sky: "#a48878", ground: "#544a44", hemiI: 0.56, charTint: [1.0, 0.86, 0.72], sideTint: [0.9, 0.84, 0.9], bodyGrad: 0.2, blob: [0.48, 0.44, 0.44], charGain: 0.84,
    lit: [1.4, 0.98, 0.66], shade: [0.19, 0.16, 0.2], lift: [0.05, 0.045, 0.06], top: "#7c6a70", hor: "#f08a48", fog: "#cc8450", fogNear: 14, fogFar: 150, sunDisc: "#ffc880" },
    K: { sky: sky5(["#f48a44", "#dc8a58", "#b08068", "#8c7472", "#746874"], [0, 3, 8, 20, 50]), sat: 0.76, cloud: { lit: "#f0a870", mid: "#c08868", shade: "#806c70" } } },
  mxLamp: { base: "golden", grade: "office", L: { headTint: [1.0, 0.88, 0.7], blob: [0.46, 0.42, 0.42], az: 150, el: 50, sunCol: "#ffc890", sunI: 0.9, sky: "#6a5a4c", ground: "#3a3028", hemiI: 0.7, charTint: [1.0, 0.9, 0.76], charGain: 0.9, charShade: 0.8, sideTint: [0.8, 0.82, 1.0], headCool: 0.6, headWarm: 1.4,
    lit: [1.18, 1.0, 0.78], shade: [0.2, 0.17, 0.17], lift: [0.06, 0.05, 0.05], top: "#2a3458", hor: "#584a58", fog: "#3a3040", fogNear: 20, fogFar: 120, sunDisc: "#000000" },
    K: { sky: sky5(["#584a58", "#3e3a54", "#2a2e4c", "#1e2440", "#141a32"]), sat: 0.76 } },
  jvMorning: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.2, headCool: 0.5, actorShadow: true, az: 125, el: 26, sunCol: "#ffe0b8", sunI: 1.6, sky: "#a4b2cc", ground: "#6a6458", hemiI: 0.60, charTint: [0.96, 0.89, 0.8], sideTint: [0.9, 0.9, 0.96], bodyGrad: 0.18, blob: [0.58, 0.55, 0.52], charGain: 0.82,
    lit: [1.28, 1.1, 0.88], shade: [0.28, 0.25, 0.30], lift: [0.07, 0.07, 0.09], top: "#4a84d4", hor: "#ffd6a4", fog: "#e6d2b4", fogNear: 40, fogFar: 300, sunDisc: "#000000" },
    K: { sky: sky5(["#f2c08c", "#e2ccb0", "#a6c2e2", "#78a8e4", "#4a80ce"], [0, 3, 8, 20, 50]), sat: 0.71, cloud: { lit: "#fff0dc", mid: "#f6d8bc", shade: "#9ca2be" } } },
  jvRiver: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.8], headWarm: 1.2, headCool: 0.6, actorShadow: true, az: 140, el: 15, sunCol: "#ffdcb8", sunI: 1.7, sky: "#9aa8cc", ground: "#5e5a54", hemiI: 0.68, charTint: [1.0, 0.9, 0.82], sideTint: [0.86, 0.9, 1.02], bodyGrad: 0.18, blob: [0.56, 0.54, 0.54], charGain: 0.84,
    lit: [1.3, 1.1, 0.9], shade: [0.26, 0.25, 0.33], lift: [0.08, 0.08, 0.11], top: "#5a7ac8", hor: "#ffc89a", fog: "#d8c4b8", fogNear: 12, fogFar: 120, sunDisc: "#ffe2b0" },
    K: { sky: sky5(["#ffb88a", "#f0b8a4", "#c4b0c8", "#8aa0d4", "#5a7ac8"], [0, 3, 8, 20, 50]), sat: 0.72, cloud: { lit: "#ffd8b8", mid: "#e8b8b0", shade: "#9a98b8" } } },
  jvDay: { base: "day", L: { headTint: [1.0, 0.93, 0.82], headWarm: 1.05, headCool: 0.5, blob: [0.58, 0.56, 0.56], az: 115, el: 36, actorShadow: true, sunCol: "#fff0d4", sunI: 1.6, sky: "#a8b8d4", ground: "#6a5c48", hemiI: 0.64, charTint: [0.95, 0.92, 0.88], charGain: 0.8,
    lit: [1.4, 1.22, 0.98], shade: [0.28, 0.27, 0.32], lift: [0.07, 0.07, 0.09], top: "#3a80dc", hor: "#cfe0f4", fog: "#d4dcec", fogNear: 40, fogFar: 320, sunDisc: "#000000" },
    K: { sky: sky5(["#b4d4f2", "#9cc4ee", "#78acea", "#5896e0", "#3478d4"]), sat: 0.74, cloud: { lit: "#f8f6f2", mid: "#e8e8f0", shade: "#aeb6c8" } } },
  jvNight: { base: "golden", grade: "office", L: { headTint: [1.0, 0.86, 0.68], blob: [0.5, 0.46, 0.46], az: 120, el: 34, sunCol: "#8ea4d8", sunI: 0.9, sky: "#3a5078", ground: "#3a3644", hemiI: 0.85, charTint: [1.0, 0.9, 0.78], charGain: 0.92, charShade: 0.86, sideTint: [0.72, 0.8, 1.12], headCool: 1.0, headWarm: 1.45,
    lit: [1.02, 1.02, 1.22], shade: [0.26, 0.26, 0.34], lift: [0.09, 0.09, 0.13], top: "#1c2848", hor: "#2e3a5e", fog: "#1e2640", fogNear: 14, fogFar: 90, sunDisc: "#000000" },
    K: { sky: sky5(["#2e3a5e", "#26324e", "#1c2642", "#161e38", "#10162c"]), sat: 0.75 } },
  jvEarly: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.1, headCool: 0.6, actorShadow: true, az: 70, el: 16, sunCol: "#ffe2bc", sunI: 1.55, sky: "#9cb0d4", ground: "#5e5a54", hemiI: 0.66, charTint: [0.96, 0.9, 0.84], sideTint: [0.86, 0.9, 1.02], bodyGrad: 0.18, blob: [0.56, 0.54, 0.54], charGain: 0.82,
    lit: [1.28, 1.12, 0.92], shade: [0.26, 0.26, 0.34], lift: [0.07, 0.07, 0.10], top: "#4a80d0", hor: "#f2d4b0", fog: "#d8d0c4", fogNear: 30, fogFar: 220, sunDisc: "#000000" },
    K: { sky: sky5(["#f2c89c", "#dcd0c0", "#a8c2e2", "#7aa8e2", "#4c82cc"], [0, 3, 8, 20, 50]), sat: 0.72, cloud: { lit: "#fff2e2", mid: "#f0dcc8", shade: "#a0a8c2" } } },
  jvNoon: { base: "day", L: { headTint: [1.0, 0.94, 0.84], headWarm: 1.0, headCool: 0.5, blob: [0.58, 0.56, 0.56], az: 135, el: 42, actorShadow: true, sunCol: "#fff4e0", sunI: 1.65, sky: "#a8bcd8", ground: "#6c5e4a", hemiI: 0.64, charTint: [0.95, 0.93, 0.9], charGain: 0.8,
    lit: [1.42, 1.28, 1.06], shade: [0.29, 0.28, 0.33], lift: [0.07, 0.07, 0.09], top: "#3a7ed8", hor: "#d0e2f6", fog: "#d8e0ee", fogNear: 40, fogFar: 320, sunDisc: "#000000" },
    K: { sky: sky5(["#b8d6f4", "#9cc6f0", "#7aaeea", "#5a98e2", "#3a7cd6"]), sat: 0.74, cloud: { lit: "#fafaf6", mid: "#eaeaf0", shade: "#b2bacb" } } },
  jvDawn: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.89, 0.76], headWarm: 1.3, headCool: 0.55, actorShadow: true, az: 40, el: 10, sunCol: "#ffcc98", sunI: 1.8, sky: "#a0a8cc", ground: "#5c5650", hemiI: 0.64, charTint: [1.0, 0.9, 0.8], sideTint: [0.86, 0.88, 1.02], bodyGrad: 0.18, blob: [0.55, 0.52, 0.52], charGain: 0.85,
    lit: [1.38, 1.08, 0.8], shade: [0.26, 0.24, 0.31], lift: [0.07, 0.07, 0.10], top: "#5a78c4", hor: "#ffc488", fog: "#e8c8a8", fogNear: 30, fogFar: 240, sunDisc: "#ffe0a8" },
    K: { sky: sky5(["#ffb478", "#f4c098", "#c8b8cc", "#8ea8d8", "#5a7cc6"], [0, 3, 8, 20, 50]), sat: 0.74, cloud: { lit: "#ffd6b0", mid: "#f0bca8", shade: "#9a9cbc" } } },
  ptMarket: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.91, 0.78], headWarm: 1.15, headCool: 0.55, actorShadow: true, az: 145, el: 34, sunCol: "#ffcf94", sunI: 1.5, sky: "#a8b6d0", ground: "#7a6a58", hemiI: 0.52, charTint: [0.96, 0.9, 0.82], sideTint: [0.92, 0.92, 0.98], bodyGrad: 0.16, blob: [0.66, 0.64, 0.62], charGain: 0.82,
    lit: [1.25, 0.88, 0.55], top: "#4a84d4", hor: "#ffd6a4", fog: "#e2ccb0", fogNear: 36, fogFar: 240, sunDisc: "#000000" },
    K: { sky: sky5(["#f0c08c", "#dcc8b2", "#a4c0e2", "#78a8e4", "#4a80ce"], [0, 3, 8, 20, 50]), sat: 0.78, cloud: { lit: "#fff0dc", mid: "#f6d8bc", shade: "#9ca2be" } } },
  ptBoss: { base: "golden", grade: "inn", L: { headTint: [1.0, 0.82, 0.74], headWarm: 1.3, headCool: 0.4, actorShadow: true, az: 150, el: 45, sunCol: "#ff8a6a", sunI: 0.9, sky: "#6a3a3a", ground: "#2a1a1a", hemiI: 0.6, charTint: [1.0, 0.86, 0.8], sideTint: [0.9, 0.8, 0.8], bodyGrad: 0.2, blob: [0.5, 0.44, 0.44], charGain: 0.86,
    lit: [1.3, 0.7, 0.55], top: "#2a1414", hor: "#5a2a24", fog: "#3a1a18", fogNear: 14, fogFar: 60, sunDisc: "#000000" }, K: { sat: 0.72 } },
  ptOffice: { base: "day", grade: "office", L: { headTint: [0.98, 0.98, 1.0], blob: [0.64, 0.64, 0.68], az: 150, el: 50, actorShadow: true, sunCol: "#eef2f4", sunI: 1.05, sky: "#c8d0d4", ground: "#6a6a62", hemiI: 0.55, charTint: [0.94, 0.95, 0.96], charGain: 0.8, lit: [1, 1.0, 1.0], sunDisc: "#000000" }, K: { sat: 0.82 } },
  ptStudy: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.1, actorShadow: true, az: 145, el: 40, sunCol: "#ffd8a0", sunI: 1.15, sky: "#a8a898", ground: "#5a4a3a", hemiI: 0.55, charTint: [0.96, 0.9, 0.84], blob: [0.62, 0.6, 0.58], charGain: 0.82, lit: [1.2, 0.92, 0.65], sunDisc: "#000000" }, K: { sat: 0.78 } },
  dtMorning: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.9, 0.76], headWarm: 1.2, headCool: 0.55, actorShadow: true, az: 140, el: 30, sunCol: "#ffc684", sunI: 1.55, sky: "#a4b2cc", ground: "#7a6a58", hemiI: 0.5, charTint: [0.96, 0.89, 0.81], sideTint: [0.92, 0.92, 0.98], bodyGrad: 0.16, blob: [0.66, 0.64, 0.62], charGain: 0.82,
    lit: [1.3, 0.86, 0.5], top: "#4a84d4", hor: "#ffd6a4", fog: "#e2ccb0", fogNear: 34, fogFar: 240, sunDisc: "#000000" },
    K: { sky: sky5(["#f0b884", "#d8c2ae", "#a0bce0", "#74a4e2", "#447ccc"], [0, 3, 8, 20, 50]), sat: 1.1, cloud: { lit: "#fff0dc", mid: "#f6d8bc", shade: "#9ca2be" } } },
  dtSpring: { base: "day", L: { headTint: [1.0, 0.93, 0.84], headWarm: 1.05, headCool: 0.5, blob: [0.68, 0.66, 0.68], az: 145, el: 40, actorShadow: true, sunCol: "#fff2e0", sunI: 1.5, sky: "#a8b8d4", ground: "#7a6c5c", hemiI: 0.55, charTint: [0.95, 0.92, 0.9], charGain: 0.8,
    lit: [1.36, 1.28, 1.14], top: "#3a80dc", hor: "#c4dcf6", fog: "#c8daec", fogNear: 36, fogFar: 260, sunDisc: "#000000" },
    K: { sky: sky5(["#acd0f2", "#94c0ee", "#76aaea", "#5896e0", "#3478d4"]), sat: 1.04, cloud: { lit: "#f4f4f8", mid: "#e6e8f0", shade: "#b0bacc" } } },
  dtLab: { base: "day", grade: "office", L: { headTint: [0.98, 0.98, 1.0], blob: [0.64, 0.64, 0.68], az: 150, el: 50, actorShadow: true, sunCol: "#eef2f4", sunI: 1.05, sky: "#c8d0d4", ground: "#6a6a62", hemiI: 0.55, charTint: [0.94, 0.95, 0.96], charGain: 0.8,
    lit: [1.0, 1.03, 1.04], shade: [0.32, 0.34, 0.42], top: "#7a96b8", hor: "#c8d4dc", fog: "#c0ccd4", fogNear: 20, fogFar: 120, sunDisc: "#000000" },
    K: { sky: sky5(["#c8d4dc", "#b8c8d4", "#a4b8cc", "#90a8c4", "#7a96b8"]), sat: 0.98, cloud: { lit: "#eef0f2", mid: "#dde2e8", shade: "#aab4c0" } } },
  // ---- "They Gave Away Free Hens and the Garbage Vanished" (2026-11-17): sunny village, warm morning to bright spring ----
  htMorning: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.9, 0.74], headWarm: 1.2, headCool: 0.55, actorShadow: true, az: 45, el: 28, sunCol: "#ffc684", sunI: 4.0, sky: "#8eaaec", ground: "#7a7a6a", hemiI: 1.55, charTint: [1.0, 0.93, 0.85], sideTint: [0.95, 0.95, 1.0], bodyGrad: 0.12, blob: [0.72, 0.7, 0.68],
    top: "#4a84d4", hor: "#ffd6a4", fog: "#f2dcc0", fogNear: 34, fogFar: 240, sunDisc: "#000000" },
    K: { sky: sky5(["#f6c08e", "#e2ccb8", "#aac4e6", "#7cacea", "#4a84d4"], [0, 3, 8, 20, 50]), sat: 1.12, cloud: { lit: "#fff4e4", mid: "#ffe0c4", shade: "#a4aac6" } } },
  htNoon: { base: "day", L: { headTint: [1.0, 0.94, 0.84], headWarm: 1.0, headCool: 0.5, blob: [0.72, 0.7, 0.72], az: -40, el: 42, actorShadow: true, sunCol: "#fff4e0", sunI: 3.6, sky: "#8ab4f0", ground: "#7c7a70", hemiI: 1.75, charTint: [1.0, 0.97, 0.94], charGain: 0.86,
    top: "#2a74d8", hor: "#b4d8f6", fog: "#c4def4", fogNear: 36, fogFar: 260, sunDisc: "#000000" },
    K: { sky: sky5(["#a8d0f4", "#90c0f2", "#72acec", "#5498e4", "#2e7ad8"]), sat: 1.12, cloud: { lit: "#ffffff", mid: "#eef2f8", shade: "#b4c0d2" } } },
  htGarden: { base: "day", L: { headTint: [1.0, 0.93, 0.82], headWarm: 1.05, headCool: 0.5, blob: [0.7, 0.7, 0.66], az: 60, el: 36, actorShadow: true, sunCol: "#fff0d4", sunI: 3.5, sky: "#90b6ee", ground: "#7a8a64", hemiI: 1.8, charTint: [1.0, 0.97, 0.92], charGain: 0.86,
    top: "#2e78d8", hor: "#b8daf4", fog: "#c8e0f0", fogNear: 30, fogFar: 220, sunDisc: "#000000" },
    K: { sky: sky5(["#acd2f4", "#94c2f2", "#76aeec", "#589ae4", "#327cd8"]), sat: 1.02, cloud: { lit: "#ffffff", mid: "#eef2f8", shade: "#b4c0d2" } } },
  htSpring: { base: "day", L: { headTint: [1.0, 0.94, 0.86], headWarm: 1.05, headCool: 0.5, blob: [0.72, 0.7, 0.72], az: 30, el: 40, actorShadow: true, sunCol: "#fff2e0", sunI: 3.7, sky: "#92b8f2", ground: "#7c7a70", hemiI: 1.8, charTint: [1.0, 0.97, 0.95], charGain: 0.86,
    top: "#3a80dc", hor: "#c4dcf6", fog: "#d0e2f4", fogNear: 36, fogFar: 260, sunDisc: "#000000" },
    K: { sky: sky5(["#b4d6f6", "#9cc6f2", "#7eb2ee", "#609ee6", "#3a80dc"]), sat: 1.04, cloud: { lit: "#ffffff", mid: "#f2f2f8", shade: "#b8c2d4" } } },
  htHall: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.92, 0.78], headWarm: 1.15, headCool: 0.5, actorShadow: true, az: -35, el: 30, sunCol: "#ffd8a0", sunI: 3.8, sky: "#8eb0ee", ground: "#7a7a6a", hemiI: 1.65, charTint: [1.0, 0.95, 0.88], blob: [0.72, 0.7, 0.68],
    top: "#3e80d6", hor: "#f2dcc0", fog: "#ecdcc8", fogNear: 34, fogFar: 240, sunDisc: "#000000" },
    K: { sky: sky5(["#f2d0a8", "#d8ccc4", "#a8c4e6", "#7cacea", "#3e80d6"], [0, 3, 8, 20, 50]), sat: 1.12, cloud: { lit: "#fff6ea", mid: "#ffe6cc", shade: "#a8aec8" } } },
  // ---- "They Scrapped Late Fees and Got a Truckload of Books Back" (2026-11-16) ----
  libMorning: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.88, 0.7], headWarm: 1.3, actorShadow: true, az: 40, el: 24, sunCol: "#ffb46e", sunI: 4.3, sky: "#8eaaec", ground: "#7a7670", hemiI: 1.45, charTint: [1.0, 0.91, 0.82], headCool: 0.6, sideTint: [0.95, 0.94, 1.0], bodyGrad: 0.12,
    top: "#4f80cc", hor: "#ffc890", fog: "#f2d4b4", fogNear: 30, fogFar: 230, sunDisc: "#fff0c8" },
    K: { sky: sky5(["#f2a878", "#dcc0b0", "#a6bee2", "#78a6e6", "#4f80cc"], [0, 3, 8, 20, 50]), sat: 1.12, cloud: { lit: "#fff0dc", mid: "#ffd8b8", shade: "#9aa0c0" } } },
  libHall: { base: "golden", grade: "inn", L: { headTint: [1.0, 0.9, 0.78], blob: [0.7, 0.66, 0.62], az: 100, el: 40, sunCol: "#000000", sunI: 0.0, sky: "#d8ccb8", ground: "#6a5440", hemiI: 1.25, charTint: [1.0, 0.93, 0.84], charGain: 0.96, charShade: 0.86, sideTint: [0.82, 0.86, 1.08], headCool: 0.7, headWarm: 1.3,
    top: "#5a8ad0", hor: "#cfe0f2", fog: "#b8a890", fogNear: 16, fogFar: 80, sunDisc: "#000000", actorShadow: false } },
  libDusk: { base: "golden", grade: "dawn", L: { az: 30, el: 6, sunCol: "#ff9a6a", sunI: 1.4, sky: "#6a80c8", ground: "#4a4448", hemiI: 1.9, charTint: [1.0, 0.9, 0.82], charShade: 0.9, sideTint: [0.8, 0.86, 1.08], headTint: [0.98, 0.9, 0.86],
    top: "#16245e", hor: "#ff9a68", fog: "#6a6488", fogNear: 28, fogFar: 220, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#ff9a64", "#d87c74", "#6a6aa4", "#2c4688", "#142458"], [0, 3, 8, 16, 34]), sat: 1.08, cloud: { lit: "#ffae8a", mid: "#8a749c", shade: "#343e72" } } },
  libGrey: { base: "day", grade: "grey", L: { headTint: [0.97, 0.98, 1.0], blob: [0.58, 0.58, 0.64], az: 70, el: 50, sunCol: "#dfe6f2", sunI: 0.15, sky: "#b4bec8", ground: "#5e6a6c", hemiI: 2.6, charTint: [0.98, 0.98, 1.0], charGain: 0.96, lit: [1.18, 1.2, 1.22], shade: [0.46, 0.48, 0.6],
    top: "#6c7686", hor: "#959ea8", fog: "#929ca6", fogNear: 14, fogFar: 110, sunDisc: "#000000" },
    K: { sky: sky5(["#9aa2aa", "#8f97a1", "#858d99", "#7b8391", "#6f7787"]), sat: 0.62, cloud: { lit: "#d6dce6", mid: "#bcc4d2", shade: "#949eb2" } } },
  libBright: { base: "day", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.0, headCool: 0.5, blob: [0.72, 0.7, 0.72], az: 55, el: 36, actorShadow: true, sunCol: "#fff0d8", sunI: 3.7, sky: "#86aef0", ground: "#7c7a70", hemiI: 1.7, charTint: [1.0, 0.97, 0.94], charGain: 0.86,
    top: "#2a74d8", hor: "#acd2f6", fog: "#bad8f4", fogNear: 36, fogFar: 260, sunDisc: "#000000" },
    K: { sky: sky5(["#a4ccf4", "#8ebef2", "#70aaec", "#5296e4", "#2e7ad8"]), sat: 1.12, cloud: { lit: "#ffffff", mid: "#eef2f8", shade: "#b4c0d2" } } },
  libDay: { base: "day", L: { headTint: [1.0, 0.93, 0.82], headWarm: 1.0, headCool: 0.55, blob: [0.72, 0.7, 0.72], az: -50, el: 34, actorShadow: true, sunCol: "#fff2dc", sunI: 3.6, sky: "#8ab0ee", ground: "#7c7a70", hemiI: 1.7, charTint: [1.0, 0.97, 0.94], charGain: 0.86,
    top: "#2a74d8", hor: "#acd2f6", fog: "#bad8f4", fogNear: 36, fogFar: 260, sunDisc: "#000000" },
    K: { sky: sky5(["#a4ccf4", "#8ebef2", "#70aaec", "#5296e4", "#2e7ad8"]), sat: 1.1, cloud: { lit: "#ffffff", mid: "#eef2f8", shade: "#b4c0d2" } } },
  libRoom: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.9, 0.76], blob: [0.7, 0.64, 0.6], az: 120, el: 40, sunCol: "#000000", sunI: 0.0, sky: "#e8d8bc", ground: "#6a5440", hemiI: 1.4, charTint: [1.0, 0.93, 0.82], charGain: 0.96, charShade: 0.86, sideTint: [0.84, 0.86, 1.06], headCool: 0.6, headWarm: 1.4,
    top: "#5a8ad0", hor: "#cfe0f2", fog: "#c8b48e", fogNear: 14, fogFar: 70, sunDisc: "#000000", actorShadow: false } },
  aptNight: { base: "golden", grade: "office", L: { headTint: [0.96, 0.84, 0.7], blob: [0.66, 0.6, 0.58], az: 120, el: 30, sunCol: "#000000", sunI: 0.0, sky: "#4a64a4", ground: "#202030", hemiI: 0.7, charTint: [1.0, 0.92, 0.84], charGain: 0.9, charShade: 0.88, sideTint: [0.7, 0.8, 1.18], headCool: 1.1, headWarm: 1.4,
    top: "#101a4e", hor: "#2e4a9a", fog: "#202a44", fogNear: 20, fogFar: 120, sunDisc: "#000000", actorShadow: false } },
  libDawn: { base: "golden", grade: "dawn", L: { az: 35, el: 8, sunCol: "#ffb08a", sunI: 2.6, sky: "#9aa8d8", ground: "#5a5050", hemiI: 1.9, charTint: [1.0, 0.9, 0.84], charShade: 0.9, sideTint: [0.82, 0.86, 1.06], headTint: [1.0, 0.9, 0.84],
    top: "#3a5aa8", hor: "#ffb488", fog: "#c8a4a8", fogNear: 30, fogFar: 260, sunDisc: "#fff0c0" },
    K: { sky: sky5(["#ffac7c", "#f4b4a0", "#c4b4cc", "#7e9ad0", "#3a5aa8"]), sat: 1.1, cloud: { lit: "#ffd0b0", mid: "#e0b0b8", shade: "#7a84aa" } } },
  libRoomDawn: { base: "golden", grade: "dawn", L: { headTint: [1.0, 0.9, 0.82], blob: [0.7, 0.64, 0.62], az: 120, el: 40, sunCol: "#000000", sunI: 0.0, sky: "#d8c8c8", ground: "#5a4a40", hemiI: 1.2, charTint: [1.0, 0.92, 0.86], charGain: 0.95, charShade: 0.86, sideTint: [0.82, 0.86, 1.08], headCool: 0.7, headWarm: 1.3,
    top: "#3a5aa8", hor: "#ffb488", fog: "#a89a98", fogNear: 14, fogFar: 70, sunDisc: "#000000", actorShadow: false } },

  // channel art: a sunset over the rooftops (navy top -> rose -> peach horizon), warm light on Lou's face from the front left
  banner: { base: "golden", L: { az: 18, el: 30, lit: [1.5, 1.14, 0.86], shade: [0.46, 0.36, 0.58], lift: [0.09, 0.07, 0.15], term: 0.12, charTint: [1.0, 0.92, 0.82], fogNear: 80, fogFar: 600 },
    K: { sky: sky5(["#ffd59a", "#f7a77c", "#d9808a", "#8a6496", "#3a4684"], [0, 5, 12, 24, 42]), sat: 1.1 } },
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
  // the forger's studio for the explanation: deep night blue key, cool moon light, warm practicals stay warm
  studioBlue: { base: "golden", L: { az: 95, el: 40, lit: [0.78, 0.86, 1.38], shade: [0.1, 0.11, 0.32], lift: [0.03, 0.04, 0.15], term: 0.16,
      charTint: [0.82, 0.86, 1.08], charShade: 0.9, sideTint: [0.7, 0.78, 1.12], actorShadow: false, blob: [0.5, 0.52, 0.75],
      top: "#0c1238", hor: "#1f2c70", fog: "#1e2550", fogNear: 10, fogFar: 60, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#2c3c80", "#22306e", "#182458", "#121c48", "#0a1036"]), sat: 1.04, cloud: { lit: "#7f8bc0", mid: "#4e5a98", shade: "#2c3670" } } },
  // the courtroom by day: warm low sun through the tall left windows, sage + oak, cool bounce
  court: { base: "golden", L: { az: -128, el: 62, lit: [1.62, 1.26, 0.9], shade: [0.3, 0.29, 0.44], lift: [0.06, 0.06, 0.1], term: 0.18,
      charTint: [1.0, 0.9, 0.8], charShade: 0.9, sideTint: [0.84, 0.88, 1.04], actorShadow: false, blob: [0.6, 0.58, 0.7],
      top: "#8fc0f0", hor: "#f2f6ff", fog: "#d6c8aa", fogNear: 25, fogFar: 140, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#f4f8ff", "#dbeafb", "#b6d4f5", "#90bdee", "#6aa4e4"]), sat: 1.07, bounce: [0.03, 0.02, 0.0] } },
  // the courtroom payoff: brightest of the film, sunlit, a touch warmer
  courtPayoff: { base: "golden", L: { az: -125, el: 62, lit: [1.9, 1.52, 1.06], shade: [0.36, 0.34, 0.48], lift: [0.08, 0.08, 0.12], term: 0.18,
      charTint: [1.04, 0.95, 0.84], charShade: 0.92, sideTint: [0.9, 0.92, 1.06], actorShadow: false, blob: [0.62, 0.6, 0.72],
      top: "#9fd0ff", hor: "#fff8ec", fog: "#e8d6b6", fogNear: 25, fogFar: 140, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#fffaf0", "#e8f2ff", "#c6e0fb", "#a0cbf2", "#7ab4ea"]), sat: 1.12, bounce: [0.05, 0.03, 0.0] } },
  // the salt mine: warm caged bulbs, pink salt, violet shade, the tunnel fading to dark plum
  mine: { base: "golden", L: { az: -140, el: 50, lit: [1.45, 1.08, 0.72], shade: [0.2, 0.15, 0.3], lift: [0.04, 0.03, 0.1], term: 0.18,
      charTint: [1.02, 0.86, 0.72], charShade: 0.9, sideTint: [0.78, 0.76, 1.02], actorShadow: false, blob: [0.55, 0.5, 0.66],
      top: "#2a1830", hor: "#4a2a3a", fog: "#3a2232", fogNear: 6, fogFar: 30, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#3a2232", "#32202e", "#2a1a28", "#221622", "#1a101a"]), sat: 1.06, cloud: { lit: "#8f7b8c", mid: "#5e4a5c", shade: "#3c2a3a" } } },
  // the museum gallery: bright cool skylight, wine-red walls, warm picture lamps
  museum: { base: "golden", L: { az: -150, el: 60, lit: [1.5, 1.38, 1.18], shade: [0.32, 0.3, 0.44], lift: [0.06, 0.06, 0.1], term: 0.18,
      charTint: [1.0, 0.95, 0.9], charShade: 0.92, sideTint: [0.86, 0.9, 1.06], actorShadow: false, blob: [0.6, 0.58, 0.7],
      top: "#bfe0ff", hor: "#f4f8ff", fog: "#e2d4c4", fogNear: 25, fogFar: 140, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#f8fbff", "#e2eefc", "#c4dcf7", "#a2c8f0", "#80b2e8"]), sat: 1.06, bounce: [0.03, 0.02, 0.0] } },
  // the top Nazi's hall at night: fire + candle chandelier against dark plum shadows
  hallNight: { base: "golden", L: { az: 120, el: 30, lit: [1.35, 0.92, 0.6], shade: [0.14, 0.11, 0.24], lift: [0.03, 0.03, 0.1], term: 0.16,
      charTint: [1.02, 0.84, 0.7], charShade: 0.9, sideTint: [0.7, 0.72, 1.0], actorShadow: false, blob: [0.5, 0.46, 0.62],
      top: "#141c46", hor: "#2f3f86", fog: "#2a1e30", fogNear: 10, fogFar: 50, sunDisc: "#000000", sunCol: "#000000" },
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
  // ---------------- "Why He Painted Eyes on Cows' Butts": savanna keys (warm set-up, deep blue at night, bright payoff) ----------------
  savMorning: { base: "golden", L: { az: 55, el: 20, lit: [1.86, 1.36, 0.86], shade: [0.3, 0.25, 0.46], lift: [0.05, 0.04, 0.08], term: 0.12, charTint: [1.0, 0.9, 0.78],
      top: "#3f7fd6", hor: "#ffd9a8", fog: "#f6d2b0", fogNear: 70, fogFar: 520, sunDisc: "#fff0c8" },
    K: { sky: sky5(["#ffd6a0", "#f6c79a", "#b8c8e6", "#6a9ee0", "#3f7fd6"]), sat: 1.12, cloud: { lit: "#fff0d8", mid: "#f2c8a8", shade: "#a8a8d0" } } },
  savSunset: { base: "golden", L: { az: 20, el: 7, lit: [1.9, 1.02, 0.6], shade: [0.26, 0.18, 0.42], lift: [0.06, 0.04, 0.1], term: 0.1, charTint: [1.0, 0.82, 0.68],
      top: "#4a3c8e", hor: "#ff9c5a", fog: "#f08a6a", fogNear: 60, fogFar: 460, sunDisc: "#ffe0a0" },
    K: { sky: sky5(["#ffb46a", "#ff8a5c", "#e0628a", "#8a4c9c", "#3c3482"]), sat: 1.14, cloud: { lit: "#ffc88a", mid: "#e88090", shade: "#7a5aa0" } } },
  savDay: { base: "day", L: { az: 65, el: 46, lit: [1.84, 1.66, 1.3], shade: [0.34, 0.31, 0.5], charTint: [1.0, 0.95, 0.88], top: "#1c6ed8", hor: "#cfe6f6", fog: "#d8e6f0", fogNear: 90, fogFar: 600 }, K: { sat: 1.14 } },
  savNight: { base: "golden", L: { az: -55, el: 38, lit: [0.5, 0.6, 1.08], shade: [0.11, 0.12, 0.32], lift: [0.03, 0.04, 0.14], term: 0.16,
      charTint: [1.0, 0.88, 0.76], charShade: 0.9, sideTint: [0.72, 0.8, 1.12], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0d1646", hor: "#38509a", fog: "#28386e", fogNear: 40, fogFar: 320, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a60aa", "#344a92", "#26387c", "#1a2864", "#0e1846"]), sat: 1.08, bounce: [0.02, 0.02, 0.05], cloud: { lit: "#8f9bd0", mid: "#5e6aa8", shade: "#3c4680" } } },
  grassNight: { base: "golden", L: { az: -40, el: 30, lit: [0.46, 0.58, 1.12], shade: [0.1, 0.12, 0.34], lift: [0.03, 0.05, 0.16], term: 0.16,
      charTint: [0.96, 0.9, 0.84], charShade: 0.9, sideTint: [0.7, 0.82, 1.16], actorShadow: false, blob: [0.5, 0.56, 0.84],
      top: "#0a1440", hor: "#2e4a92", fog: "#22346a", fogNear: 20, fogFar: 160, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#3c5aa6", "#2c448c", "#203476", "#16265e", "#0a1440"]), sat: 1.1, bounce: [0.02, 0.02, 0.06], cloud: { lit: "#7a8ac8", mid: "#4e5ca0", shade: "#323e7a" } } },
  kitchen: { base: "golden", L: { az: 100, el: 40, lit: [1.5, 1.08, 0.66], shade: [0.18, 0.15, 0.32], lift: [0.04, 0.03, 0.1], term: 0.16, charTint: [1.0, 0.9, 0.8],
      top: "#2a3670", hor: "#5a6aa8", fog: "#3a3a5a", fogNear: 30, fogFar: 120 }, K: { sat: 1.12 } },
  // Washington office, bright late morning through the window (cool sky fill, warm lamp)
  dcOffice: { base: "day", L: { az: -20, el: 38, lit: [1.62, 1.5, 1.24], shade: [0.26, 0.25, 0.48], lift: [0.05, 0.05, 0.1], charTint: [1.0, 0.96, 0.9],
      top: "#3f8fe0", hor: "#bfe0f6", fog: "#d8e4ee", fogNear: 30, fogFar: 140 }, K: { sat: 1.1 } },
  savPayoff: { base: "day", L: { az: 120, el: 40, lit: [2.0, 1.8, 1.36], shade: [0.36, 0.33, 0.56], charTint: [1.0, 0.96, 0.88], top: "#1462de", hor: "#d6ecf8", fog: "#e0e6f0", fogNear: 160, fogFar: 1400 }, K: { sat: 1.18 } },
  savGolden: { base: "golden", L: { az: 35, el: 16, lit: [1.9, 1.28, 0.76], shade: [0.3, 0.24, 0.46], lift: [0.05, 0.04, 0.08], term: 0.12, charTint: [1.0, 0.9, 0.76],
      top: "#3c6ad0", hor: "#ffc890", fog: "#f2c4a0", fogNear: 70, fogFar: 520, sunDisc: "#fff0c8" },
    K: { sky: sky5(["#ffc890", "#f6b48c", "#c0a8d0", "#7a90d8", "#3c6ad0"]), sat: 1.12, cloud: { lit: "#ffe4c8", mid: "#f0b8a0", shade: "#a09ac8" } } },
  // ---- "They Blew Up Houses to Stop a Fire" (London 1666) ----
  fireNight: { base: "golden", L: { az: -55, el: 38, lit: [0.48, 0.55, 0.96], shade: [0.11, 0.11, 0.3], lift: [0.03, 0.035, 0.12], term: 0.16,
      charTint: [1.0, 0.9, 0.8], charShade: 0.9, sideTint: [0.74, 0.8, 1.1], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0c1240", hor: "#3a3a72", fog: "#262a5a", fogNear: 30, fogFar: 230, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#4a4680", "#363c7a", "#283068", "#1a2256", "#0c1240"]), sat: 1.08, bounce: [0.03, 0.015, 0.0], cloud: { lit: "#8a88c0", mid: "#5a5a96", shade: "#36386e" } } },
  smokeMorning: { base: "golden", L: { az: 62, el: 20, lit: [1.82, 1.18, 0.72], shade: [0.3, 0.22, 0.42], lift: [0.06, 0.04, 0.08], term: 0.12, charTint: [1.0, 0.88, 0.74],
      top: "#5a3e62", hor: "#ffb070", fog: "#e8a274", fogNear: 40, fogFar: 300, sunDisc: "#ffd8a0" },
    K: { sky: sky5(["#ffb878", "#f29c6c", "#cc7c72", "#8e5a74", "#5a4068"]), sat: 1.12, cloud: { lit: "#ffc890", mid: "#d88a80", shade: "#7a5a80" } } },
  smokeDay: { base: "day", L: { az: 70, el: 40, lit: [1.74, 1.46, 1.08], shade: [0.32, 0.27, 0.46], charTint: [1.0, 0.93, 0.82],
      top: "#7a6a86", hor: "#f2c894", fog: "#e8c09a", fogNear: 50, fogFar: 340 },
    K: { sky: sky5(["#f4ca96", "#e8b48c", "#c89c8e", "#9c8090", "#6c6084"]), sat: 1.12, cloud: { lit: "#fff0d8", mid: "#e8b8a0", shade: "#a890b0" } } },
  tavernBlue: { base: "golden", L: { az: -60, el: 38, lit: [0.5, 0.58, 1.02], shade: [0.12, 0.13, 0.32], lift: [0.03, 0.04, 0.13], term: 0.16,
      charTint: [1.0, 0.9, 0.8], charShade: 0.9, sideTint: [0.72, 0.8, 1.12], actorShadow: false, blob: [0.55, 0.56, 0.8],
      top: "#0e1846", hor: "#6a4a72", fog: "#2c3262", fogNear: 30, fogFar: 260, sunDisc: "#000000", sunCol: "#000000" },
    K: { sky: sky5(["#b0607a", "#6a4a7e", "#3a3a78", "#22285e", "#0e1846"]), sat: 1.08, bounce: [0.02, 0.02, 0.05], cloud: { lit: "#9a88c0", mid: "#5e5a9a", shade: "#363870" } } },
  fireDusk: { base: "golden", L: { az: 96, el: 9, lit: [1.95, 1.02, 0.56], shade: [0.27, 0.17, 0.4], lift: [0.06, 0.04, 0.1], term: 0.1, charTint: [1.0, 0.84, 0.7],
      top: "#3a2a5a", hor: "#ff8a4a", fog: "#e8805c", fogNear: 50, fogFar: 330, sunDisc: "#ffd890" },
    K: { sky: sky5(["#ffa060", "#f2765c", "#bc5478", "#6c3c78", "#2e2a5a"]), sat: 1.14, cloud: { lit: "#ffb880", mid: "#e07888", shade: "#6a4a8a" } } },
  wildDusk: { base: "golden", L: { az: 20, el: 22, lit: [1.9, 1.3, 0.82], shade: [0.42, 0.32, 0.52], lift: [0.08, 0.06, 0.1], term: 0.12, charTint: [1.0, 0.86, 0.72],
      top: "#3c3478", hor: "#ff9c5a", fog: "#f08a6a", fogNear: 60, fogFar: 420, sunDisc: "#ffe0a0" },
    K: { sky: sky5(["#ffb46a", "#ff8a5c", "#e0628a", "#8a4c9c", "#3c3482"]), sat: 1.14, cloud: { lit: "#ffc88a", mid: "#e88090", shade: "#7a5aa0" } } },
  golden: { base: "golden" },
  summer: { base: "day", L: { az: 70, el: 40, lit: [1.66, 1.52, 1.3], charTint: [1.0, 0.95, 0.9] }, K: { sat: 1.1 } },
  // ---- Plimsoll short: a real time of day per scene (part 14 E1); neutral shadows by day, deep blue at night ----
  dockMorning: { base: "day", L: { az: 62, el: 34, sunCol: "#fff3e0", sunI: 2.5, sky: "#bfd8ff", ground: "#9a8a72", hemiI: 0.95, charTint: [1.0, 0.97, 0.93],
      top: "#3a80d8", hor: "#d2e4f6", fog: "#d2e4f6", fogNear: 45, fogFar: 460, sunDisc: "#fff4d8" },
    K: { sky: sky5(["#d8e8f8", "#b8d4f2", "#86b6ea", "#5a98e0", "#3277d0"]), sat: 1.06, cloud: { lit: "#ffffff", mid: "#eef1f6", shade: "#b4bfcf" },
      water: { near: "#2a6f86", mid: "#22607e", far: "#5f8fb4", crest: "#d8eef4", trough: "#123f58", glint: "#ffffff", shade: [0.55, 0.6, 0.68] } } },
  seaStorm: { base: "day", L: { az: 155, el: 32, sunCol: "#b4c8f0", sunI: 1.5, sky: "#7690c2", ground: "#26304a", hemiI: 1.05, charTint: [0.8, 0.88, 1.0], charShade: 0.92, sideTint: [0.78, 0.84, 1.0],
      top: "#0a1430", hor: "#2c4068", fog: "#1f3156", fogNear: 12, fogFar: 140, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#33497a", "#2a3d68", "#1d2c52", "#142240", "#0a1430"]), sat: 1.0, cloud: { lit: "#6a7ca0", mid: "#45557a", shade: "#232d48" },
      water: { near: "#16304f", mid: "#122a48", far: "#2a4068", crest: "#c8d8ec", trough: "#08182c", glint: "#d8e6ff", shade: [0.5, 0.56, 0.7] } } },
  commons: { base: "day", L: { az: 40, el: 30, sunCol: "#fff0d6", sunI: 3.1, sky: "#f6ecda", ground: "#8a7056", hemiI: 1.9, charTint: [1.04, 1.03, 1.0], charShade: 1.0,
      top: "#3a80d8", hor: "#d2e4f6", fog: "#c8b89c", fogNear: 40, fogFar: 300, sunDisc: "#000000" } },
  // channel art v2 (real look): golden hour, warm key from the front left, blue-to-peach sky, neutral shade
  bannerReal: { base: "golden", L: { az: 22, el: 24, sunCol: "#ffcf96", sunI: 2.7, sky: "#9cbce6", ground: "#7a6450", hemiI: 1.05, charTint: [1.0, 0.94, 0.86],
      top: "#2f66bc", hor: "#ffc98e", fog: "#f2d2a8", fogNear: 260, fogFar: 1800, sunDisc: "#000000" },
    K: { sky: sky5(["#ffbe78", "#ffcb92", "#f4d6ae", "#86b0e2", "#2f66bc"], [0, 3, 7, 13, 22]), sat: 1.12, cloud: { lit: "#fff6e8", mid: "#ffe0c0", shade: "#8e96ac" } } },
  dockGold: { base: "golden", L: { az: 35, el: 10, sunCol: "#ffae62", sunI: 3.0, sky: "#a8bede", ground: "#6a5242", hemiI: 1.05, charTint: [1.0, 0.86, 0.7],
      top: "#3c6eac", hor: "#ffcb8c", fog: "#f2c08c", fogNear: 50, fogFar: 420, sunDisc: "#ffd29a" },
    K: { sky: sky5(["#ffc684", "#ffd6a2", "#e9dcc8", "#9cbadc", "#4f7fbe"]), sat: 1.1, cloud: { lit: "#ffd6a6", mid: "#f4bc92", shade: "#8e94aa" },
      water: { near: "#2c5878", mid: "#3e6a8a", far: "#e8b88a", crest: "#ffe2b8", trough: "#173a56", glint: "#fff0c8", shade: [0.5, 0.52, 0.62] } } },
  dockNight: { base: "golden", L: { az: 160, el: 24, sunCol: "#7a92cc", sunI: 0.45, sky: "#4c66a6", ground: "#181c2a", hemiI: 0.5, charTint: [1.0, 0.88, 0.74], charShade: 0.92, sideTint: [0.8, 0.86, 1.04],
      top: "#0d1a40", hor: "#365490", fog: "#26396a", fogNear: 16, fogFar: 170, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#3e5a94", "#2f4a84", "#203a70", "#16295a", "#0d1a40"]), sat: 1.02, cloud: { lit: "#5c72a4", mid: "#3e5282", shade: "#1e2a4c" },
      water: { near: "#162c52", mid: "#1c3864", far: "#36508a", crest: "#9fb6e0", trough: "#0a1834", glint: "#ffd9a0", shade: [0.5, 0.54, 0.72] } } },
  dockBright: { base: "day", L: { az: 62, el: 40, sunCol: "#ffffff", sunI: 2.8, sky: "#c6defc", ground: "#9a8c74", hemiI: 1.0, charTint: [1.0, 0.98, 0.95],
      top: "#2a74d8", hor: "#d6eafa", fog: "#d6eafa", fogNear: 50, fogFar: 480, sunDisc: "#ffffff" },
    K: { sky: sky5(["#dcecfa", "#bcdaf6", "#88bcf0", "#5aa0e8", "#2e7ad8"]), sat: 1.08, cloud: { lit: "#ffffff", mid: "#f0f3f8", shade: "#b8c3d2" },
      water: { near: "#1f7a90", mid: "#1a6a88", far: "#5a9cc4", crest: "#e2f6fa", trough: "#0e4660", glint: "#ffffff", shade: [0.55, 0.6, 0.68] } } },
  // ---- "He Covered His Oranges in Ice": one freeze night, six looks (dusk -> 9 pm -> moonlit midnight -> 3 a.m. ->
  // warm cellar -> golden sunrise). Night is deep blue with warm fire / lantern pools, never black; purple only in the sky.
  groveDusk: { base: "golden", grade: "dawn", L: { az: 38, el: 7, sunCol: "#ff9a5a", sunI: 2.3, sky: "#7a90d0", ground: "#5a4a44", hemiI: 2.0, charTint: [1.0, 0.88, 0.76], charShade: 0.9, sideTint: [0.82, 0.86, 1.04],
      top: "#1c2e6a", hor: "#ffa060", fog: "#7a6a8a", fogNear: 30, fogFar: 260, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#ffa864", "#f08c6c", "#7c74a4", "#34508e", "#182c64"], [0, 3, 8, 16, 34]), sat: 1.1, cloud: { lit: "#ffb88a", mid: "#9a7c9c", shade: "#3c4678" } } },
  groveNight: { base: "golden", grade: "night", L: { blob: [0.38, 0.4, 0.58], az: 150, el: 26, sunCol: "#7c96d4", sunI: 1.25, sky: "#6a88d0", ground: "#2a3452", hemiI: 1.7, charTint: [1.0, 0.9, 0.78], charShade: 0.92, sideTint: [0.8, 0.86, 1.06],
      top: "#0e1c5c", hor: "#3a5cc0", fog: "#24409a", fogNear: 18, fogFar: 170, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#4468c8", "#3352b4", "#24409c", "#18307e", "#0e1c5c"]), sat: 1.12, cloud: { lit: "#5c74a8", mid: "#3e5486", shade: "#1e2c50" } } },
  groveMoon: { base: "golden", grade: "night", L: { blob: [0.38, 0.4, 0.58], az: -55, el: 38, sunCol: "#a8c0ff", sunI: 1.6, sky: "#7090d8", ground: "#2c3654", hemiI: 1.7, charTint: [0.96, 0.97, 1.04], charShade: 0.92, sideTint: [0.8, 0.86, 1.08],
      top: "#0c185a", hor: "#3254b6", fog: "#203c96", fogNear: 20, fogFar: 190, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#3c5ec4", "#2e4cae", "#223e98", "#172e78", "#0c185a"]), sat: 1.12, cloud: { lit: "#6a80b4", mid: "#46598c", shade: "#202c50" } } },
  grove3am: { base: "golden", grade: "night", L: { blob: [0.38, 0.4, 0.58], az: 160, el: 22, sunCol: "#6a84c4", sunI: 0.95, sky: "#5c7ac4", ground: "#242c46", hemiI: 1.5, charTint: [1.0, 0.88, 0.74], charShade: 0.92, sideTint: [0.78, 0.84, 1.06],
      top: "#0b1652", hor: "#2e50b0", fog: "#1e3888", fogNear: 14, fogFar: 140, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#3a58bc", "#2c48a6", "#203a8e", "#162a70", "#0b1652"]), sat: 1.1, cloud: { lit: "#4e6696", mid: "#334674", shade: "#18223e" } } },
  cellarLamp: { base: "golden", grade: "dawn", L: { blob: [0.42, 0.36, 0.34], az: 100, el: 40, sunCol: "#000000", sunI: 0.0, sky: "#e8c49a", ground: "#5a4232", hemiI: 0.55, charTint: [1.0, 0.86, 0.7], charShade: 0.9, sideTint: [0.8, 0.84, 1.04],
      top: "#141c46", hor: "#2f3f86", fog: "#3a2e2a", fogNear: 12, fogFar: 60, sunDisc: "#000000", actorShadow: false } },
  groveSunUp: { base: "golden", grade: "dawn", L: { az: 12, el: 8, sunCol: "#ffae62", sunI: 3.4, sky: "#b0c4e2", ground: "#7a6048", hemiI: 1.85, charTint: [1.0, 0.88, 0.74],
      top: "#3a6cc0", hor: "#ffb466", fog: "#f0b47c", fogNear: 70, fogFar: 700, sunDisc: "#fff0c0" },
    K: { sky: sky5(["#ffa04e", "#ffbc76", "#f8c8a6", "#8eb2e4", "#3f70c4"]), sat: 1.18, cloud: { lit: "#ffd6a6", mid: "#f4bc92", shade: "#8e94aa" } } },
  groveSunrise: { base: "golden", grade: "dawn", L: { az: 125, el: 12, sunCol: "#ffb46a", sunI: 3.6, sky: "#a8c0e0", ground: "#6a5642", hemiI: 1.75, charTint: [1.0, 0.88, 0.74],
      top: "#3a6cc0", hor: "#ffbc78", fog: "#f0bc8a", fogNear: 70, fogFar: 700, sunDisc: "#fff0c0" },
    K: { sky: sky5(["#ffac5c", "#ffc684", "#f6d0b0", "#92b6e4", "#3f72c4"]), sat: 1.16, cloud: { lit: "#ffd8ac", mid: "#f4c09a", shade: "#8e98ae" } } },
  // ---- "He Made Giant Bricks to Pay Half the Tax": golden morning yard -> bright noon street -> overcast drizzle week
  // -> fresh spring site + gate -> blue summer night with candle -> lantern night in the shed -> warm inn -> lane sunset.
  // Shadows stay blue-violet; the grey day is a soft cool blue-grey, still saturated (never brown or dead grey).
  yardMorning: { base: "golden", grade: "morning", L: { headTint: [1.0, 0.86, 0.66], headWarm: 1.4, actorShadow: true, az: 48, el: 22,   /* r76i (reviewer: f_40 flat front light): a more raking morning key */ sunCol: "#ffb067", sunI: 5.6, sky: "#8eaaec", ground: "#6e7470", hemiI: 1.85, charTint: [1.0, 0.9, 0.8], headCool: 0.6, sideTint: [0.95, 0.94, 1.0], bodyGrad: 0.1,   /* r37: a softer far side (the brick in his shaded hand read maroon beside the loaf) */
      top: "#4f80cc", hor: "#ffc890", fog: "#f4d2ae", fogNear: 30, fogFar: 230, sunDisc: "#fff0c8" },   /* r53: the haze pushed back (the houses behind the hook read as pastel mist) */
    K: { sky: sky5(["#f2a878", "#dcc0b0", "#a6bee2", "#78a6e6", "#4f80cc"], [0, 3, 8, 20, 50]),   /* r59: blue from 8 deg (the sky over the hook bench still read blown cream) */   /* r53: blue sooner above the warm horizon (the hook sky read blown cream) */ sat: 1.14, cloud: { lit: "#fff0dc", mid: "#ffd8b8", shade: "#9aa0c0" } } },
  streetNoon: { base: "day", L: { headTint: [1.0, 0.92, 0.8], headWarm: 1.0, headCool: 0.5, blob: [0.72, 0.7, 0.72], az: 55, el: 80,   /* r53: a noon sun (el 26 cast long evening shadows) */ actorShadow: true, sunCol: "#fff2dc", sunI: 4.7, sky: "#86aef0", ground: "#7c7a66", hemiI: 2.3, charTint: [1.0, 0.97, 0.94], charGain: 0.84,   /* r64 (AX row 8): cards were blown out under the noon sun */
      top: "#2a74d8", hor: "#acd2f6", fog: "#bad8f4", fogNear: 36, fogFar: 260, sunDisc: "#000000" },   /* r53: a blue low sky */
    K: { sky: sky5(["#a4ccf4", "#8ebef2", "#70aaec", "#5296e4", "#2e7ad8"]), sat: 1.12, cloud: { lit: "#ffffff", mid: "#eef2f8", shade: "#b4c0d2" } } },
  yardGrey: { base: "day", grade: "grey", L: { headTint: [0.97, 0.98, 1.0]   /* r76: white heads (they measured ~205 grey) */, blob: [0.58, 0.58, 0.64], az: 70, el: 50, sunCol: "#dfe6f2", sunI: 0.15, sky: "#b4bec8", ground: "#5e6a6c", hemiI: 2.6, charTint: [0.98, 0.98, 1.0], charGain: 0.96, lit: [1.18, 1.2, 1.22], shade: [0.46, 0.48, 0.6],
      top: "#6c7686", hor: "#959ea8", fog: "#929ca6", fogNear: 10, fogFar: 95, sunDisc: "#000000" },   /* r60: a heavier overcast (the drizzle sky read bright, the greens lush) */
    K: { sky: sky5(["#9aa2aa", "#8f97a1", "#858d99", "#7b8391", "#6f7787"]), sat: 0.6,   /* r73: a duller overcast (reviewers: the drizzle read saturated and sunny) */ cloud: { lit: "#d6dce6", mid: "#bcc4d2", shade: "#949eb2" } } },
  siteSpring: { base: "day", L: { headTint: [1.0, 0.91, 0.76], headWarm: 1.2, headCool: 0.55, blob: [0.72, 0.7, 0.72], az: 135, el: 30, actorShadow: true, sunCol: "#fff0d4", sunI: 5.4, sky: "#86aef0", ground: "#7a8466", hemiI: 1.9, charTint: [1.0, 0.96, 0.9],
      top: "#2f78d8", hor: "#a6cef4", fog: "#c0d6ee", fogNear: 10, fogFar: 120, sunDisc: "#000000" },   /* r53: a blue low sky */   /* r68: spring haze on the far houses and trees (reviewers: far things as crisp as near) */
    K: { sky: sky5(["#9ec8f2", "#88baf0", "#6ca8ea", "#5094e2", "#2f74d6"]), sat: 1.2, cloud: { lit: "#ffffff", mid: "#f2f4f8", shade: "#b8c4d6" } } },
  gateSpring: { base: "day", L: { headTint: [1.0, 0.9, 0.74], headWarm: 1.3, headCool: 0.55   /* r76b (AX row 8): the warm sun on the heads (they measured cool against a warm yard) */, blob: [0.72, 0.7, 0.72], az: -60, el: 27, actorShadow: true, sunCol: "#fff0d4", sunI: 6.21, sky: "#a8b8d4", ground: "#8a8468", hemiI: 2.30, charTint: [1.0, 0.96, 0.9],
      top: "#2f78d8", hor: "#a6cef4", fog: "#b4d4f2", fogNear: 30, fogFar: 220, sunDisc: "#000000" },   /* r53: a blue low sky (reviewers: blown cream/white skies) */
    K: { sky: sky5(["#9ec8f2", "#88baf0", "#6ca8ea", "#5094e2", "#2f74d6"]), sat: 1.18, cloud: { lit: "#ffffff", mid: "#f2f4f8", shade: "#b8c4d6" } } },
  officeCandle: { base: "golden", grade: "office", L: { headTint: [0.96, 0.8, 0.62], blob: [0.66, 0.6, 0.58], az: 120, el: 30, sunCol: "#000000", sunI: 0.0, sky: "#4a64a4", ground: "#202030", hemiI: 0.55,   /* r73: deeper night ambient - the desk candle carries the room (reviewer: lit like day) */   /* r55: a blue night ambient on the walls (it read as a warm afternoon room) */   /* r53: night, not day (the office measured 137 with an evenly lit cream wall) */ charTint: [1.0, 0.92, 0.84], charGain: 0.88, charShade: 0.88, sideTint: [0.7, 0.8, 1.18], headCool: 1.15, headWarm: 1.5,   /* r60: cool moonlight on the far side */
      top: "#101a4e", hor: "#2e4a9a", fog: "#26303e", fogNear: 12, fogFar: 60, sunDisc: "#000000", actorShadow: false } },
  shedLantern: { base: "golden", grade: "night", L: { headTint: [0.86, 0.86, 0.94], lit: [0.9, 0.86, 0.82], shade: [0.17, 0.165, 0.165], lift: [0.06, 0.058, 0.058],   /* r68: a bluer night ambient against the lantern (reviewer: the shed read warm brown) */ blob: [0.62, 0.62, 0.68], az: 150, el: 30, sunCol: "#8aa0d0", sunI: 1.4, sky: "#7a7670", ground: "#3a3634", hemiI: 2.1,   /* r76: a neutral night fill (the back walls went blue-purple) */   /* r57: less global fill, the lantern carries the shed */   /* r40: a clean blue night ambient (no purple) against the warm lantern pool, brighter (it read brown murk) */   /* r37: brighter cool ambient (the shed measured 78) */   /* r35: neutral moonlight (the shed walls went purple-blue) */ charTint: [1.0, 0.86, 0.7], charGain: 0.84, charShade: 0.92, sideTint: [0.74, 0.82, 1.1], headCool: 0.8, headWarm: 0.95,
      top: "#0e1c5c", hor: "#2c56b8", fog: "#1a3e7a", fogNear: 10, fogFar: 90, sunDisc: "#000000", actorShadow: false },
    K: { sky: sky5(["#3a66c4", "#2c56b2", "#20469c", "#163682", "#0c2462"]), sat: 1.02, cloud: { lit: "#5a78b0", mid: "#3c5690", shade: "#1c2c52" } } },
  innEvening: { base: "golden", grade: "inn", L: { headTint: [0.98, 0.78, 0.58],   /* r60: the lamp warms the faces (reviewer: no lantern tint on Amos or Bess) */ blob: [0.68, 0.62, 0.58], az: 100, el: 40, sunCol: "#000000", sunI: 0.0, sky: "#a49a8e"   /* r76: warm-grey fill (floor and bar read mauve) */, ground: "#5a4632", hemiI: 0.55,   /* r76i: less flat room light - the lamp pool keys */ charTint: [1.0, 0.85, 0.68], charGain: 0.92, charShade: 0.86, sideTint: [0.76, 0.82, 1.12], headCool: 0.8, headWarm: 1.6,
      top: "#141c46", hor: "#2f3f86", fog: "#3a3028", fogNear: 14, fogFar: 70, sunDisc: "#000000", actorShadow: false } },
  laneSunset: { base: "golden", grade: "sunset", L: { headTint: [1.0, 0.79, 0.6],   /* r71: warmer faces in the low sun (reviewers: heads measured near-neutral against the blazing wall) */   /* r60: a warmer sunset wash on the faces */ az: -72,   /* r76: the sun a little more onto the fronts, so eave and sill shadows read as shadows (they read as pale ghost bands) */ el: 8,   /* r74: the low sun rakes along the house front from the west (reviewers: no raking light or long shadows) */ discYaw: 47.4, discEl: 15, sunCol: "#ffb070", sunI: 4.6,   /* r76i (reviewer: the lit facade washed out to pale tan, then deep orange two seconds later): no clipping on the sunlit front */ sky: "#8e96c0", ground: "#686c70", hemiI: 1.45,   /* r76i (both reviewers): less flat fill under the low sun, so key, rim and long shadows read */ charTint: [1.0, 0.87, 0.72], charGain: 0.96, headCool: 0.95, headWarm: 2.5,   /* r76: a gentler costume tint (Amos's blue coat turned green) */   /* r53: the warm rim at full strength (b .7 gave half) */ sideTint: [0.7, 0.78, 1.14]   /* r73: a cooler shadow side against the warm sun side */, actorShadow: true,
      top: "#4a5aa8", hor: "#ff9a50", fog: "#c98468", fogNear: 18, fogFar: 170,   /* r76e: less milky haze down the lane (it lifted the blacks across the left of the frame) */ sunDisc: "#ffd9a0" },
    K: { sky: sky5(["#e8582a", "#ee7438", "#d8686a", "#946a9e", "#4a58a0"], [0, 5, 12, 24, 44])   /* r76i (both reviewers): a deeper sunset sky (it read pink-white haze) */   /* r76f: a deeper sunset sky (it read blank off-white) */   /* r73: warmer high sky (a flat lilac with no glow) */   /* r68: orange at the horizon to mauve and blue overhead (reviewers: a flat pale yellow sky) */   /* r66: a glowing orange sky high up (reviewers: the lane read as afternoon) */   /* r47: an orange sunset sky up to 30 deg (it read pale white) */, sat: 1.15, cloud: { lit: "#ff9a5a", mid: "#e07a70", shade: "#6a6a98" } } },   // r12: peach to blue (less pink-purple sky)
};
/* r60: day presets - more sun against less sky fill (reviewer: daylight flat and hazy) */
export const LIGHTS = {} as Record<LightName, LightPreset & { grade: "day" | "golden" | "night" | "dawn" | "grey" | "inn" | "sunset" | "morning" | "office" }>;
export const LOOK = {} as Record<LightName, WorldLook>;
for (const [k, o] of Object.entries(OVER) as [LightName, Over][]) {
  LIGHTS[k] = { ...BASE_LIGHTS[o.base], ...(o.L ?? {}), grade: o.grade ?? o.base };
  LOOK[k] = { ...BASE_LOOK[o.base], ...(o.K ?? {}) };
}
