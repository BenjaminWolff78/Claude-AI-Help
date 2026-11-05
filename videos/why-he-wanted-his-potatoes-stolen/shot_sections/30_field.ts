
// =====================================================================================================================
// SHOTS 3-5 (719-1160) = SCENE 4: home base A, the royal field from day through two nights to dawn.
// "He planted every row and told the guards, 'Guard them like gold.' The first night, nothing. The second night,
// nothing. The soldiers started taking bets on how dumb this was. Even they called him the Pig Doctor. The third night,
// they came back at sunrise, and the whole field was picked clean. That's the trick."
// 3 (day, in through the royal stamp's dust): he digs, the rows grow in behind him, the soldiers snap to attention, he
//   holds a potato up to the sergeant like a jewel, the sergeant salutes deadpan.
// 4 (night, a same-place crossfade from the same framing): torches, moon; a crow lands on the wall, looks, leaves; a
//   soldier yawns; three soldiers kneel round the drum throwing dice; one pushes his nose up into a snout and they all
//   laugh at once while the hero walks past with his lantern, unbothered; push into a torch flame.
// 5 (dawn, the dissolve hidden in the flame -> the low sun): the soldiers march back in through the gate yawning, the
//   camera swings to the field: all holes; jaws drop, a hat pops off; the hero by the hut winks ("That's the trick.").
import { vH } from "./sets/valley";
const FYf = 4, TAU = Math.PI * 2;
const MK = { hero: [-24.6, FYf, -21.6] as V3, serg: [-23.2, FYf, -20.6] as V3, gate: [-22.2, FYf, -18.3] as V3, drum: [-24.3, FYf, -25.9] as V3 };
const RING3: [string, V3][] = [["sol1", [-33.4, FYf, -26.3]], ["sol2", [-33.6, FYf, -21.0]], ["sol3", [-33.4, FYf, -15.6]], ["sol4", [-30.8, FYf, -26.6]], ["sol5", [-26.4, FYf, -26.7]], ["sol6", [-28.6, FYf, -15.3]]];
const ringAt = (who: string) => RING3.find((r) => r[0] === who)![1];
const DICE: Record<string, V3> = { sergeant: [-24.3, FYf, -24.8], sol5: [-23.2, FYf, -25.7], sol4: [-25.4, FYf, -26.05] };
const HERO_WALK: V3[] = [[-23.6, FYf, -19.4], [-23.4, FYf, -22.6], [-25.6, FYf, -27.0]];
const HERO_DAWN: V3 = [-31.8, FYf, -19.4];
const torchGlow = (key: string, pos: V3, size: number, a: number): FxSpec => glowBurst(key, pos, size, a, "255,190,110");
const shoulder = (o: P = {}): P => ({ armR: [[24, 26], [20, 40]] as A2, armRFront: true, propR: "musket", ...o });
const atEase = (o: P = {}): P => ({ armR: [[26, 34], [30, 56]] as A2, propR: "musket", propRAng: 0.3, ...o });

// ---------------- 3: day ----------------
SHOT_CAMS[3] = () => [
  K(719, F(() => ({ pos: [-20.6, FYf + 3.3, -23.4] as V3, look: [-27.4, FYf + 0.6, -21.6] as V3, fov: 44 }), 719, 0.0016), 1),
  K(768, F(() => fit([body(MK.hero, 0, 2.3, 0.45), body(MK.serg, 0, 2.3, 0.45)], 96, 6, 42, 0.8), 768, 0.0016, [[788, 0.005, 10]]), 22),
];
SHOT_ACTS[3] = (f) => {
  const dig = (f - 719) / 14, dk = 0.5 + 0.5 * Math.sin(dig * TAU), dug = f < 772;
  const snap = sm(f, 754, 757);
  return {
    ctl: { planted: lerp(0.05, 1, sm(f, 721, 776)), holes: 0, torches: 0, moon: 0, trough: 0, gardens: 0, smoke: 1 },
    cast: [
      C("parm", MK.hero, dug ? pose(null, { expr: "determined", facing: -1, tilt: 12 * dk, armR: [[28, 18 + 10 * dk], [50, 30 - 22 * dk]] as A2, armL: [[-6, 30], [28, 42 - 10 * dk]] as A2, armRFront: true, armLFront: true, propR: "shovel", propRAng: -0.6 + 0.8 * dk, propK: 1 })
        : flow(f, [
          [772, { expr: "calm", facing: 1, armR: [[24, 30], [30, 52]] as A2 }],
          [781, { expr: "proud", facing: 1, armR: [[26, 6], [36, -18]] as A2, armL: [[-26, 6], [10, -18]] as A2, armRFront: true, armLFront: true, propR: "potato", propK: 1 }, 5], // holds it up like a jewel
          [787, { expr: "proud", facing: 1, mouth: talk(f, 787, 804), armR: [[26, 6], [36, -18]] as A2, armL: [[-26, 6], [10, -18]] as A2, armRFront: true, armLFront: true, propR: "potato", propK: 1, headTilt: 3 * Math.sin(f * 0.5) }, 1],
          [806, { expr: "smug", facing: 1, armR: [[24, 30], [30, 52]] as A2, propR: "lantern" }, 6],
        ]), { idx: 1 }),
      C("sergeant", MK.serg, flow(f, [
        [719, { expr: "bored", facing: -1, look: -0.5, ...atEase() }],
        [754, { expr: "stern", facing: -1, ...shoulder() }, 3],
        [792, { expr: "stern", facing: -1, armR: [[30, -10], [16, -46]] as A2, armRTop: true }, 3],                                 // salutes, deadpan
        [812, { expr: "stern", facing: -1, ...shoulder() }, 4],
      ]), { idx: 10 }),
      ...RING3.map(([who, p], i) => C(who, p, snap < 0.5 ? pose(null, { expr: "bored", facing: i < 3 ? 1 : -1, ...atEase() }) : pose(null, { expr: "stern", facing: i < 3 ? 1 : -1, ...shoulder() }), { idx: 11 + i })),
    ],
    fx: fxs(
      f < 736 ? dustCard("in1", [-22.4, FYf + 2.0, -26.2], 3.4, 1 - lin(f, 719, 736), 1) : null,
      f < 734 ? dustCard("in2", [-23.2, FYf + 1.4, -24.8], 2.6, 1 - lin(f, 719, 734), 3) : null,
      dug && dk > 0.85 ? dustCard("dig", [MK.hero[0] - 0.5, FYf + 0.35, MK.hero[2] + 0.2], 0.5, 0.8, 2) : null,
      f >= 788 && f < 804 ? sparkle("gold", [MK.hero[0] + 0.45, FYf + 1.95, MK.hero[2]], f - 788, 0.32) : null,
    ),
    focus: f < 760 ? [MK.hero[0], FYf + 1.2, MK.hero[2]] : [-23.9, FYf + 1.6, -21],
    subj: "parm",
  };
};
lens(719, 3, 1); lens(760, 6, 24);

// ---------------- 4: nights one and two ----------------
const crowAt = (f: number): { p: V3; fly: boolean } => {
  const A: V3 = [-31.0, FYf + 5.5, -33], B: V3 = [-28.2, FYf + 0.86, -28.25], E: V3 = [-24.5, FYf + 6.5, -33.5];
  if (f < 834) { const u = sm(f, 822, 834); return { p: lerp3(A, B, u), fly: true }; }
  if (f < 848) return { p: B, fly: false };
  return { p: lerp3(B, E, sm(f, 848, 862)), fly: true };
};
SHOT_CAMS[4] = () => [
  K(819, F(() => fit([body(MK.hero, 0, 2.3, 0.45), body(MK.serg, 0, 2.3, 0.45)], 96, 6, 42, 0.8), 819, 0.0016)),
  K(824, F(() => ({ pos: [-21.0, FYf + 3.6, -15.2] as V3, look: [-28.0, FYf + 0.9, -24.0] as V3, fov: 46 }), 824, 0.0014), 30),         // the whole field at night
  K(876, F(() => fit([body(MK.drum, 0, 0.7, 0.5), body(DICE.sergeant, 0, 1.6, 0.4), body(DICE.sol5, 0, 1.6, 0.4), body(DICE.sol4, 0, 1.6, 0.4)], 52, 12, 40, 0.82), 876, 0.0018, [[920, 0.005, 10]]), 30),
  K(958, F(() => fit([body(DICE.sergeant, 0, 2.0, 0.4), body(DICE.sol5, 0, 2.0, 0.4), body(DICE.sol4, 0, 2.0, 0.4), body([-23.5, FYf, -23.0], 0, 2.1, 0.4)], 62, 8, 40, 0.86), 958, 0.0018, [[982, 0.006, 8]]), 18),
  K(1004, (f) => { const k = sm(f, 1004, 1021); return { pos: lerp3([-19.2, FYf + 2.2, -25.5], [-21.4, FYf + 2.45, -27.3], k), look: [-22.6, FYf + 2.5, -28.2] as V3, fov: 40 }; }, 6),   // into the corner torch's flame
];
SHOT_ACTS[4] = (f, s) => {
  const crow = crowAt(f), ph12 = (f / 12) % 1;
  const go = (who: string, a: number, b: number) => walkPath(4, s, [who === "sergeant" ? MK.serg : ringAt(who), DICE[who]], f, a, b);
  const dicers = ["sergeant", "sol5", "sol4"];
  const hw = walkPath(4, s, HERO_WALK, f, 958, 1012);
  const cast: CastPlace[] = [
    C("parm", hw.p, hw.moving ? pose(null, { mode: "walk", phase: hw.phase, facing: hw.facing, expr: "smug", armR: [[26, 20], [30, 36]] as A2, propR: "lantern" })
      : f < 958 ? pose(null, { expr: "smug", facing: 1, armR: [[24, 30], [30, 52]] as A2, propR: "lantern" }) : pose(null, { expr: "smug", facing: -1, look: -0.4, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }), { idx: 1 }),
    ...RING3.filter(([w]) => !dicers.includes(w)).map(([who, p], i) => C(who, p, flow(f, [
      [819, { expr: "stern", facing: i < 3 ? 1 : -1, ...shoulder() }],
      [852 + i * 4, { expr: "bored", facing: i < 3 ? 1 : -1, ...atEase() }, 8],
    ]), { idx: 11 + i })),
  ];
  for (const [j, who] of dicers.entries()) {
    const w = go(who, 858 + j * 4, 900 + j * 2), at = DICE[who];
    cast.push(C(who, w.p, w.moving ? pose(null, { mode: "walk", phase: w.phase, facing: w.facing, expr: "grin", ...atEase() }) : f < 858 ? flow(f, [
      [819, { expr: "stern", facing: -1, ...shoulder() }],
      [853, { expr: who === "sol5" ? "laugh" : "bored", facing: -1, mouth: who === "sol5" && f < 872 ? "O" : undefined, ...(who === "sol5" ? { armR: [[30, -30], [36, -80]] as A2, armL: [[-30, -30], [-36, -80]] as A2 } : atEase()) }, 5], // the yawn
    ]) : flow(f, [
      [900, { expr: "grin", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[26, 24], [40, 30]] as A2, armRFront: true }],
      [914 + j * 6, { expr: "eureka", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[30, -6], [44, -24]] as A2, armRFront: true, propR: j === 0 ? "dice" : undefined }, 6],   // wind-up
      [922 + j * 6, { expr: j === 1 ? "smug" : "grin", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[34, 18], [60, 26]] as A2, armRFront: true }, 2],                        // throw
      ...(who === "sol5" ? [[968, { expr: "grin", mode: "kneel", facing: faceTo(4, s, f, at, MK.drum), armR: [[24, 4], [8, -30]] as A2, armRTop: true }, 5]] as Beat[] : []),            // pushes his nose up: snout
      [982, { expr: "guffaw", mode: "kneel", shake: 1, phase: ph12 + j * 0.3, facing: faceTo(4, s, f, at, MK.drum), armR: [[26, 44], [6, 70]] as A2, armRFront: true, ...(who === "sol4" ? { armR: [[40, 18], [88, 8]] as A2 } : {}) }, 2],
    ]), { idx: 20 + j }));
  }
  if (f >= 819 && f < 864) cast.push(C("crow", crow.p, pose(null, { mode: crow.fly ? "air" : "stand", phase: (f / 6) % 1, expr: "neutral", facing: crow.fly ? 1 : f < 841 ? 1 : -1, tilt: !crow.fly && f > 838 && f < 844 ? 30 : 0 }), { idx: 30, scale: 0.45, air: crow.fly }));
  return {
    ctl: { planted: 1, holes: 0, torches: 1, moon: 1, trough: 0, gardens: 0, smoke: 0 },
    cast,
    fx: fxs(
      f >= 922 && f < 990 ? [0, 1, 2].map((i) => ({ kind: "card", key: "coin" + i, pos: [MK.drum[0] + 0.12 * (i - 1), FYf + 0.66, MK.drum[2] + 0.08 * i] as V3, w: 0.1, h: 0.07, cw: 64, ch: 44,
        draw: (p) => { const g = p.g; g.fillStyle = INKC; g.beginPath(); g.ellipse(32, 22, 30, 20, 0, 0, 7); g.fill(); g.fillStyle = "#f2c24a"; g.beginPath(); g.ellipse(32, 22, 25, 15, 0, 0, 7); g.fill(); } } as FxSpec)) : null,
      f >= 924 && f < 936 ? sparkle("dice", [MK.drum[0], FYf + 0.8, MK.drum[2]], f - 924, 0.24) : null,
      f >= 1004 ? torchGlow("into" + Math.round(sm(f, 1004, 1021) * 8), [-22.6, FYf + 2.55, -28.2], 0.6 + 2.4 * sm(f, 1006, 1021), 0.4 + 0.6 * sm(f, 1006, 1021)) : null,
    ),
    focus: f < 876 ? [-28, FYf + 1.4, -24] : f < 1004 ? [MK.drum[0], FYf + 1.0, MK.drum[2]] : [-22.6, FYf + 2.5, -28.2],
    subj: f < 864 ? "crow" : f < 1004 ? "sol5" : null,
  };
};
lens(819, 6, 1); lens(824, 2, 24); lens(876, 6, 24); lens(1004, 4, 10);

// ---------------- 5: dawn ----------------
const IN_PATH = (i: number): V3[] => { const sx = -18.2 - 0.9 * i, z = -18.3 + 0.45 * (i % 2 ? 1 : -1); return [[sx, vH(sx, z), z], [-22.2, FYf, z], [-24.2 - 0.85 * i, FYf, -18.6 - 0.7 * i]]; };
const MARCH = ["sergeant", "sol1", "sol2", "sol3", "sol4", "sol5", "sol6"];
SHOT_CAMS[5] = () => [
  K(1021, F(() => ({ pos: [-29.4, FYf + 1.3, -19.0] as V3, look: [-20.0, FYf + 1.5, -18.4] as V3, fov: 44 }), 1021, 0.0014)),          // toward the low sun: they march in
  K(1080, F(() => fit([body([-24.5, FYf, -19.4], 0, 2.1, 0.5), body([-28.4, FYf, -22.6], 0, 2.1, 0.5), body(HERO_DAWN, 0, 2.2, 0.4), [[-28.5, FYf, -21], 0, 0.2, 2.4]], 112, 14, 44, 0.9), 1080, 0.0016, [[1102, 0.006, 10]]), 24), // the holes
  K(1128, F(() => fit([body(HERO_DAWN, 0.9, 2.3, 0.36)], 70, 4, 38, 0.62, -0.06), 1128, 0.002, [[1136, 0.006, 8]]), 1, true),                   // "That's the trick." (cut on the punch)
  K(1148, (f) => { const k = sm(f, 1148, 1160); const L: V3 = [HERO_DAWN[0] + 0.45, FYf + 1.35, HERO_DAWN[2] + 0.1]; return { pos: lerp3([L[0] + 2.0 * Math.sin(1.22), L[1] + 0.3, L[2] + 2.0 * Math.cos(1.22)], [L[0] + 0.7 * Math.sin(1.22), L[1] + 0.1, L[2] + 0.7 * Math.cos(1.22)], k), look: L, fov: 38 }; }, 8),
];
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = MARCH.map((who, i) => {
    const w = walkPath(5, s, IN_PATH(i), f, 1026 + i * 4, 1074 + i * 3), drop = who === "sol6" ? sm(f, 1106, 1112) : 0;
    return C(who, w.p, w.moving ? pose(null, { mode: "walk", phase: w.phase, facing: w.facing, expr: i % 2 ? "bored" : "sleep", ...atEase() }) : flow(f, [
      [1070, { expr: "bored", facing: -1, mouth: i % 3 === 0 && f < 1090 ? "O" : undefined, ...atEase() }],
      [1100 + (i % 3), { expr: "shock", facing: -1, tilt: -6, hatLift: who === "sol6" ? 0.9 * drop : 0, ...atEase({ armL: [[-30, -20], [-44, -50]] as A2 }) }, 2],   // jaws drop; a hat pops off
      [1118, { expr: "aghast", facing: -1, look: -0.8, hatLift: who === "sol6" ? 0.9 : 0, ...atEase() }, 6],
    ]), { idx: 10 + i });
  });
  cast.push(C("parm", HERO_DAWN, flow(f, [
    [1021, { expr: "calm", facing: 1, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }],
    [1100, { expr: "smug", facing: 1, look: 0.6, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }, 1],
    [1134, { expr: "sly", facing: 1, blink: f >= 1138 && f < 1146 ? 1 : 0, headTilt: 6, armR: [[26, 20], [30, 36]] as A2, propR: "lantern" }, 1],   // the wink
    [1146, { expr: "smug", facing: 1, armR: [[26, 6], [40, -10]] as A2, armRFront: true, propR: "lantern" }, 4],                                     // lifts the lantern
  ]), { idx: 1 }));
  return {
    ctl: { planted: 1, holes: 1, torches: 0, moon: 0, trough: 0, gardens: 0, smoke: 1 },
    cast,
    fx: fxs(
      f < 1034 ? torchGlow("out" + Math.round(lin(f, 1021, 1034) * 8), [-19.5, FYf + 1.8, -18.4], 3.2 - 2.4 * lin(f, 1021, 1034), 1 - 0.8 * lin(f, 1021, 1034)) : null,
      f >= 1106 && f < 1118 ? sparkle("hat", [-29.3, FYf + 2.4, -23.8], f - 1106, 0.3) : null,
      f >= 1148 ? torchGlow("lant" + Math.round(sm(f, 1148, 1160) * 8), [HERO_DAWN[0] + 0.45, FYf + 1.35, HERO_DAWN[2] + 0.1], 0.3 + 1.2 * sm(f, 1150, 1160), 0.5 + 0.5 * sm(f, 1150, 1160)) : null,
    ),
    focus: f < 1080 ? [-24, FYf + 1.6, -18.6] : [HERO_DAWN[0], FYf + 1.7, HERO_DAWN[2]],
    subj: f < 1080 ? "sergeant" : "parm",
  };
};
lens(1021, 2, 1); lens(1080, 3, 24); lens(1128, 7, 1); lens(1148, 8, 8);
