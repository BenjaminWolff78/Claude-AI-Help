// =====================================================================================================================
// "He Saved His Life by Proving His Masterpiece Was Fake" - 11 shots = 11 scenes. v10.10: the calm camera holds (part 9)
// stay and the subject performs inside every hold; quoted lines use per-syllable talk mouths (talk.json, 8 shapes,
// 40-50 % of the face) with head bobs + brow lifts on stressed syllables; listeners hold props; the title object (the
// painting) is big in the hook and the reveal and its baking process plays on screen (shot 8).
// Arms are screen-space offsets (x + = screen right) in head-width %; `mx(arm, d)` mirrors an arm for d = -1.
import TALKJ from "./talk.json";
import type { Pen } from "./toon";
const TJ = TALKJ as unknown as { talk: Record<string, string>; stress: number[] };
const mx = (a: A2, d: number): A2 => [[a[0][0] * d, a[0][1]], [a[1][0] * d, a[1][1]]];
const lip = (f: number) => TJ.talk[String(f)] as MouthK | undefined;
/** speech accent from the stressed syllables: 0..1 bump peaking 2 frames after each stress frame */
const stressK = (f: number) => { let k = 0; for (const s of TJ.stress) k = Math.max(k, bump((f - s + 1) / 9)); return k; };
/** a speaking pose on a quoted line: talk mouth, 1-3 deg head bob, brows up on the stressed syllables */
const speak = (f: number, a: number, b: number, o: P): P => {
  if (f < a || f >= b) return o;
  const k = stressK(f), F0 = faceOf((o.expr as Face) ?? "neutral");
  const sign = (TJ.stress.findIndex((s) => s > f) % 2) ? 1 : -1;
  return { ...o, mouth: lip(f) ?? "tClosed", headTilt: ((o.headTilt as number) ?? 0) + 2.6 * k * sign, brow: [F0.brow[0] - 3.5 * k, F0.brow[1] - 3.5 * k] as [number, number] };
};
const hold3 = (who: string, pos: V3, o: FigOpts, idx: number, scale?: number): CastPlace => C(who, pos, o, { idx, ...(scale ? { scale } : {}) });
const lens3 = (pts: [number, number, number?][]) => { for (const [f, c, d] of pts) lens(f, c, d ?? 1); };

// ================================================= SHOT 1 (0-96) HOOK, the court ===================================
// He finishes the PROOF painting in front of the court (brush strokes rock his body), steps back on "proving", presents
// it with a sweep of the arm on "fake!"; the guard behind him gapes, the judge leans over the bench. Push into the
// canvas from 58 (object dissolve into the mine at 96).
SHOT_CAMS[1] = (s) => {
  const pp = MK(s, "proofPainter"), cv = MK(s, "proof");
  const A = fit([body(pp, 0, 2.15, 0.36), [[cv[0], 0, cv[2]], 0.9, 1.88, 0.42]], 26, 5, 40, 0.84, 0.05, 0.05);
  const Z = fit([[[cv[0], 0, cv[2]], 0.94, 1.82, 0.37]], 31, 2, 38, 0.99);
  const S1 = F(() => A, 0, 0.0016, [[80, 0.006, 10]]), S2 = F(() => Z, 96, 0.001);
  return [K(0, S1), K(58, glideTo(S1, 58, S2, 96), 1)];
};
SHOT_ACTS[1] = (f, s) => {
  const pp = MK(s, "proofPainter"), cv = MK(s, "proof"), d = -1;   // he faces left to the canvas
  const stroke = Math.sin(f * 0.42), back = walkPath(1, s, [pp, add3(pp, 0.55, 0, 0.25)], f, 60, 76);
  return {
    ctl: { proofOn: 1, proof: 0.86 + 0.14 * sm(f, 0, 60), fans: 1 },
    cast: [
      C("forger", back.p, flow(f, [
        [0, { expr: "determined", facing: d, tilt: -3 + 3 * stroke, armR: mx([[30, -6], [58 + 6 * stroke, -26 - 10 * stroke]], d), armRFront: true, propR: "paintBrush", propRAng: 0.3 * stroke, armL: [[-24, 30], [-8, 44]] as A2, armLFront: true, propL: "paintPot" }],
        [44, { expr: "smug", facing: d, tilt: 4, armR: mx([[28, -10], [50, -40]], d), armRFront: true, propR: "paintBrush", headTilt: 4 }, 10],                 // last dab... the flourish
        [62, { expr: "smug", facing: 1, tilt: -3, armR: [[24, 4], [16, 26]] as A2, armRFront: true, propR: "paintBrush", armL: [[-34, -4], [-66, -20]] as A2, look: -0.6 }, 10],  // steps back, presents it
        [80, { expr: "sly", facing: 1, tilt: -5, armR: [[24, 4], [16, 26]] as A2, armRFront: true, propR: "paintBrush", armL: [[-36, -10], [-70, -34]] as A2, headTilt: 5, look: -0.8 }, 8], // "fake!"
      ]), { idx: 1 }),
      C("guardA", [cv[0] + 1.75, 0, cv[2] - 1.6], flow(f, [
        [0, { expr: "blank", facing: -1, armR: [[24, 30], [-6, 34]] as A2, armRFront: true, armL: [[-24, 30], [6, 36]] as A2, armLFront: true }],
        [70, { expr: "aghast", facing: -1, tilt: 4, armR: [[24, 30], [-6, 34]] as A2, armRFront: true, armL: [[-24, 30], [6, 36]] as A2, armLFront: true, look: -1 }, 8],
      ]), { idx: 2 }),
      C("judge", MK(s, "judge"), flow(f, [[0, { expr: "stern", facing: -1, look: -0.6 }], [60, { expr: "shock", facing: -1, tilt: -6, look: -1 }, 10]]), { idx: 3 }),
    ],
    fx: fxs(f >= 80 ? sparkle("hk1", [cv[0] + 0.25, cv[1] + 0.3, cv[2] + 0.1], f - 80, 0.3) : null, f >= 84 ? sparkle("hk2", [cv[0] - 0.22, cv[1] - 0.1, cv[2] + 0.1], f - 84, 0.22) : null),
    focus: f < 58 ? [pp[0], 1.75, pp[2]] : follow(f, [[58, [pp[0], 1.75, pp[2]]], [96, cv, 38]]),
    subj: "forger",
  };
};
lens3([[0, DOF_MS], [58, DOF_INSERT, 38]]);

// ================================================= SHOT 2 (96-340) THE SALT MINE ====================================
// Opens on the painting held up out of the crate (match), pulls back: two soldiers hold it up, the officer raises his
// lantern, crates down the tunnel ("a top Nazi's stash"). They flip it on "Guess who sold it?": the SOLD BY slip with
// his photo; the officer jabs at it on "treason"; push in onto the photo (photo -> face dissolve at 340).
SHOT_CAMS[2] = (s) => {
  const P = MK(s, "painting"), of = OFF2(s);
  const A = fit([[[P[0], 0, P[2] + 0.2], 1.0, 2.1, 0.58]], 0, 2, 38, 0.97);
  const B = fit([body(S2A(s)), body(S2B(s)), body(of), [[P[0], 0, P[2] + 0.2], 1.0, 2.1, 0.55]], 2, 6, 50, 0.84, 0, 0.15);
  const Cc = fit([[[P[0], 0, P[2] + 0.25], 1.15, 2.0, 0.45], body(of, 1.3, 2.2, 0.3)], 12, 2, 38, 0.9, 0.1);
  // push right in until the seller's photo face fills the frame, centred (it becomes his real face at 340)
  const Z = fit([[[P[0] + 0.005, 0, P[2] + 0.25], 1.627 - 0.07, 1.627 + 0.07, 0.075]], 0, 0, 36, 0.98);
  const S1 = F(() => A, 96, 0.0008), S2 = F(() => B, 158, 0.0016), S3 = F(() => Cc, 280, 0.0018, [[300, 0.006, 10]]), S4 = F(() => Z, 340, 0.001);
  return [K(96, S1), K(126, glideTo(S1, 126, S2, 158), 1), K(254, glideTo(S2, 254, S3, 280), 1), K(316, glideTo(S3, 316, S4, 340), 1)];
};
const OFF2 = (s: SetDef): V3 => add3(MK(s, "crate"), 1.05, -0.62, 1.0);
const S2A = (s: SetDef): V3 => add3(MK(s, "crate"), -0.62, -0.62, 0.3), S2B = (s: SetDef): V3 => add3(MK(s, "crate"), 0.7, -0.62, 0.25);
SHOT_ACTS[2] = (f, s) => {
  const s1 = S2A(s), s2 = S2B(s), of = OFF2(s);
  const hold = (d: number): P => ({ armR: mx([[30, -8], [52, -30]], d), armRFront: true, armL: mx([[18, 6], [44, -10]], d), armLFront: true });
  return {
    ctl: { lid: 1, lift: 1, flip: sm(f, 238, 256), bulbs: 1 },
    cast: [
      // on the photo he recoils and backs off a step (out of the slip framing, so nobody is cut by the frame edge)
      C("soldierA", f >= 266 ? walkPath(2, s, [s1, add3(s1, -0.7, 0, 0.25)], f, 266, 284).p : s1, f > 266 && f < 284 ? pose(null, { expr: "shock", mode: "walk", phase: -walkPath(2, s, [s1, add3(s1, -0.7, 0, 0.25)], f, 266, 284).phase, facing: 1, look: 0.8 }) : flow(f, [
        [96, { expr: "eureka", facing: 1, tilt: -3, ...hold(1) }],
        [150, { expr: "grin", facing: 1, tilt: -4, ...hold(1), headTilt: 4 }, 10],
        [236, { expr: "strain", facing: 1, tilt: 4, ...hold(1) }, 8],                    // turns it round
        [258, { expr: "shock", facing: 1, tilt: -2, ...hold(1), look: 0.6 }, 6],         // the photo!
        [284, { expr: "aghast", facing: 1, tilt: 3, armR: [[26, 24], [8, 36]] as A2, armRFront: true, armL: [[-26, 24], [-8, 36]] as A2, armLFront: true, look: 1 }, 8],
      ]), { idx: 1 }),
      C("soldierB", s2, flow(f, [
        [96, { expr: "joy", facing: -1, tilt: 3, ...hold(-1) }],
        [170, { expr: "grin", facing: -1, tilt: 4, ...hold(-1), headTilt: -4 }, 10],
        [236, { expr: "strain", facing: -1, tilt: -4, ...hold(-1) }, 8],
        [262, { expr: "gulp", facing: -1, ...hold(-1), look: -0.6 }, 8],
      ]), { idx: 2 }),
      C("officer", of, flow(f, [
        [96, { expr: "stern", facing: -1, armR: [[30, -24], [40, -56]] as A2, propR: "lantern", look: -0.5 }],
        [160, { expr: "eureka", facing: -1, tilt: -3, armR: [[30, -30], [44, -62]] as A2, propR: "lantern", look: -0.8 }, 10],     // "masterpiece"
        [228, { expr: "determined", facing: -1, armR: [[30, -10], [40, -36]] as A2, propR: "lantern", armL: [[-30, 6], [-58, -4]] as A2, armLFront: true }, 10],  // "turn it round"
        [262, { expr: "angry", facing: -1, tilt: 6, armR: [[30, -10], [40, -36]] as A2, propR: "lantern", armL: [[-34, -6], [-66, -16]] as A2, armLFront: true }, 6], // jabs at the slip
        [296, { expr: "angry", facing: -1, tilt: 8, armR: [[30, -10], [40, -36]] as A2, propR: "lantern", armL: [[-34, 2], [-62, 8]] as A2, armLFront: true, headTilt: -4 }, 8], // "treason"
      ]), { idx: 3 }),
    ],
    fx: fxs(f >= 266 && f < 280 ? bang([of[0], 2.45, of[2]], f - 266) : null),
    focus: f < 126 ? MK(s, "painting") : f < 254 ? follow(f, [[126, MK(s, "painting")], [158, [s1[0] + 0.6, 1.7, s1[2]], 32]]) : follow(f, [[254, [s1[0] + 0.6, 1.7, s1[2]]], [280, add3(MK(s, "slip"), 0, 0, 0.1), 26]]),
    subj: null,
  };
};
lens3([[96, DOF_INSERT], [126, DOF_FS, 32], [254, DOF_MS, 26], [316, DOF_INSERT, 24]]);

// ================================================= SHOT 3 (340-654) THE DOCK =========================================
// CU of his face (matching the photo) gulps on "death" while the judge's gavel lands; pull back to a medium: "Relax.
// It's not old. I painted it." (talk mouths, palms-up shrug, head shake, thumb to his chest). The guards burst out
// laughing (coffee slops), the judge laughs and bangs the bench (same frame, behind him); glide right to the press
// benches: reporters hold up DUMBEST EXCUSE OF THE WAR, a flashbulb pops; push into the paper (shape match at 654).
const GA3: V3 = [-1.1, 0, -0.3], GB3: V3 = [0.8, 0, 1.0], RP1: V3 = [1.75, 0, 2.35], RP2: V3 = [2.45, 0, 1.55], RP3: V3 = [3.1, 0, 0.6];
SHOT_CAMS[3] = (s) => {
  const D = MK(s, "dock"), r1 = RP1, r2 = RP2;
  // his face fills the frame, centred, the same spot and size as the photo face it dissolves from (subject-position match)
  const A = fit([[[D[0], 0, D[2]], 1.2, 1.85, 0.3]], 16, 2, 34, 0.9);
  const B = fit([body(D, 0.95, 2.35, 0.42)], 14, 3, 36, 0.86, 0, 0.02);
  const W3 = fit([body(D, 0, 2.35, 0.42), body(GA3), body(GB3)], 20, 6, 46, 0.88, 0, 0.1);
  const rt15: V3 = [0.966, 0, -0.259], pc: V3 = [r1[0] + rt15[0] * 0.42, 0, r1[2] + rt15[2] * 0.42];
  const R = fit([body(r1, 0.4, 2.45, 0.42), [pc, 1.0, 2.0, 0.3]], 15, 3, 40, 0.88, 0, 0.05);
  const Z = fit([[pc, 1.05, 1.95, 0.26]], 15, 1, 36, 0.98);
  const SA = F(() => A, 340, 0.0012), SB = F(() => B, 396, 0.0014, [[428, 0.005, 10]]), SW = F(() => W3, 470, 0.0012), SR = F(() => R, 548, 0.0014), SZ = F(() => Z, 654, 0.001);
  return [K(340, SA), K(372, glideTo(SA, 372, SB, 396), 1), K(452, glideTo(SB, 452, SW, 476), 1), K(520, glideTo(SW, 520, SR, 552), 1), K(612, glideTo(SR, 612, SZ, 654), 1)];
};
SHOT_ACTS[3] = (f, s) => {
  const D = MK(s, "dock"), J = MK(s, "judge"), r1 = RP1, r2 = RP2, r3 = RP3;
  const sip = st(f, 2);
  const forger = flow(f, [
    [340, { expr: "gulp", facing: 0, sweat: 1, armR: [[24, 30], [10, 46]] as A2, armL: [[-24, 30], [-10, 46]] as A2 }],
    [372, { expr: "calm", facing: 0, armR: [[24, 30], [10, 46]] as A2, armL: [[-24, 30], [-10, 46]] as A2 }, 10],
    [395, { expr: "smug", facing: 0, armR: [[34, 18], [54, -6]] as A2, armL: [[-34, 18], [-54, -6]] as A2, headTilt: 3 }, 10],      // "Relax." palms up
    [410, { expr: "sly", facing: 0, armR: [[32, 22], [40, 30]] as A2, armL: [[-34, 14], [-50, -8]] as A2, headTilt: -4 }, 8],      // "it's not old" one hand wags
    [426, { expr: "smug", facing: 0, armR: [[26, 6], [4, -2]] as A2, armRFront: true, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 5 }, 8], // "I painted it" thumb to his chest
    [452, { expr: "smug", facing: 0, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true }, 10],
    [500, { expr: "sheepish", facing: 0, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true, look: -0.4 }, 10],
    [585, { expr: "sly", facing: 0, armR: [[28, 16], [-6, 22]] as A2, armRFront: true, armL: [[-28, 16], [6, 24]] as A2, armLFront: true, headTilt: 4 }, 10],   // arms crossed, unbothered
  ]);
  return {
    ctl: { fans: 1 },
    cast: [
      C("forger", D, pose(null, speak(f, 392, 450, forger as P)), { idx: 1 }),
      C("guardA", GA3, flow(f, [
        [340, { expr: "stern", facing: 1, armR: [[24, 30], [10, 44]] as A2, propR: "keys", look: 0.6 }],
        [456, { ...laughP(f, 456, 0), facing: 1, armR: [[24, 40], [6, 66]] as A2, armRFront: true, armL: [[-24, 40], [-6, 66]] as A2, armLFront: true }, 4],
        [560, { expr: "grin", facing: 1, armR: [[24, 30], [10, 44]] as A2, propR: "keys" }, 10],
      ]), { idx: 2 }),
      C("guardB", GB3, flow(f, [
        [340, { expr: "blank", facing: -1, armR: [[24, 20], [26, -4 + 6 * Math.max(0, Math.sin(sip * 0.08))]] as A2, armRFront: true, propR: "coffeeCup", look: -0.6 }],
        [458, { ...laughP(f, 458, 1), facing: -1, armR: [[26, 10], [40, -10]] as A2, propR: "coffeeCup", propRAng: 0.5 }, 4],
        [560, { expr: "grin", facing: -1, armR: [[24, 20], [26, -4]] as A2, armRFront: true, propR: "coffeeCup" }, 10],
      ]), { idx: 3 }),
      C("judge", J, flow(f, [
        [340, { expr: "angry", facing: 0, armR: [[22, -14], [30, -44]] as A2, propR: "gavel", propRAng: -0.4 }],
        [356, { expr: "angry", facing: 0, armR: [[24, 4], [40, 10]] as A2, propR: "gavel", propRAng: 1.0 }, 3],   // BANG on "death"
        [380, { expr: "stern", facing: 0, armR: [[24, 30], [10, 44]] as A2, propR: "gavel" }, 10],
        [484, { ...laughP(f, 484, 0), facing: 0, armR: [[24, -14 + 14 * Math.max(0, Math.sin(st(f) * 0.5))], [36, -30 + 30 * Math.max(0, Math.sin(st(f) * 0.5))]] as A2, propR: "gavel" }, 4],  // laughs, raps the gavel
        [580, { expr: "grin", facing: 0, armR: [[24, 30], [10, 44]] as A2, propR: "gavel" }, 10],
      ]), { idx: 4 }),
      C("rep1", r1, flow(f, [
        [340, { expr: "smug", facing: -1, armR: [[24, 20], [30, 4]] as A2, armRFront: true, propR: "notebook" }],
        [512, { expr: "grin", facing: -1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 0, headTilt: -4 }, 8],   // "the newspapers"
      ]), { idx: 5 }),
      C("rep2", r2, flow(f, [
        [340, { expr: "neutral", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera" }],
        [530, { expr: "laugh", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera", shake: 0.6, phase: f / 12 }, 8],
      ]), { idx: 6 }),
      C("rep3", r3, flow(f, [[340, { expr: "smile", facing: -1, armR: [[24, 20], [30, 4]] as A2, armRFront: true, propR: "notebook" }], [520, { expr: "laugh", facing: -1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 0 }, 8]]), { idx: 7 }),
    ],
    fx: fxs(
      f >= 357 && f < 368 ? dustCard("gavel", [J[0] + 0.5, 1.62, J[2] + 0.3], 0.5, 0.7 * (1 - (f - 357) / 11), 2) : null,
      f >= 357 ? sparkle("gv", [J[0] + 0.55, 1.75, J[2] + 0.35], f - 357, 0.3) : null,
      f >= 540 && f < 552 ? glowBurst("flash3", [r2[0] - 0.25, 2.25, r2[2] + 0.1], 1.2, 1 - (f - 540) / 12, "255,255,240") : null,
      f >= 462 && f < 476 ? squiggles("cof", [GB3[0] + 0.45, 1.95, GB3[2]], f, "#c8a070", 0.22) : null,
    ),
    focus: f < 452 ? [D[0], 1.95, D[2]] : f < 520 ? follow(f, [[452, [D[0], 1.95, D[2]]], [476, [D[0], 1.9, D[2] - 0.6], 24]]) : follow(f, [[520, [D[0], 1.9, D[2] - 0.6]], [552, [r1[0], 1.8, r1[2]], 32], [654, [r1[0] + 0.4, 1.5, r1[2] - 0.1], 42]]),
    subj: f < 520 ? "forger" : "rep1",
  };
};
KICKS.push([356 / 30, 0.8]);
lens3([[340, DOF_CU], [372, DOF_MS, 24], [452, DOF_FS, 24], [520, DOF_MS, 32], [612, DOF_INSERT, 42]]);

// ================================================= SHOT 4 (654-875) YEARS EARLIER, the studio =========================
// Opens on the review in his hands (shape match from the court paper), pulls back: he scowls, crumples it, lobs it into
// the bin (arc) on "originality"; on "So he stopped being original" he turns to the easel with a sly grin and pulls the
// cloth off a scraped old canvas; "He paints a lost old masterpiece": brush strokes, the picture builds stroke by
// stroke; push into the finished canvas (object dissolve into the museum at 875).
SHOT_CAMS[4] = (s) => {
  const R = MK(s, "read"), P = MK(s, "paint"), cv = MK(s, "canvas");
  const Z0 = fit([body(add3(R, 0.1, 0, 0.12), 0.95, 1.7, 0.26)], 8, 0, 36, 0.98);
  const A = fit([body(R, 0, 2.1, 0.45), [MK(s, "bin"), 0, 0.5, 0.25]], 10, 5, 40, 0.84, 0, 0.08);
  const B = fit([body(P, 0, 2.15, 0.35), [[cv[0], 0, cv[2]], 0.9, 1.9, 0.4]], 18, 4, 40, 0.84, 0, 0.05);
  const Z = fit([[[cv[0], 0, cv[2] + 0.05], 0.94, 1.82, 0.37]], 0, 1, 38, 0.99);
  const S0 = F(() => Z0, 654, 0.0008), SA = F(() => A, 712, 0.0014), SB = F(() => B, 806, 0.0016), SZ = F(() => Z, 875, 0.001);
  return [K(654, S0), K(680, glideTo(S0, 680, SA, 712), 1), K(782, glideTo(SA, 782, SB, 808), 1), K(846, glideTo(SB, 846, SZ, 875), 1)];
};
SHOT_ACTS[4] = (f, s) => {
  const R = MK(s, "read"), P = MK(s, "paint"), cv = MK(s, "canvas"), bin = MK(s, "bin");
  const walk = walkPath(4, s, [R, P], f, 790, 812);
  // last stroke at 850, then he steps back out of frame right to admire it, so the push + dissolve carry no people
  const OUT4: V3 = [1.1, 0, -0.55], back = walkPath(4, s, [P, OUT4], f, 852, 870);
  const stroke = Math.sin(f * 0.5);
  const at = f >= 852 ? back.p : walk.moving || f >= 812 ? walk.p : R;
  return {
    ctl: { paint: sm(f, 816, 850), blank: 1 - sm(f, 800, 816), wet: f > 816 ? 1 : 0, review: 0, cv: 0, clock: 23 + f / 1800 },
    cast: [
      C("forger", at, back.moving ? pose(null, { expr: "smug", mode: "walk", phase: back.phase, facing: back.facing, armR: [[24, 30], [10, 44]] as A2, propR: "paintBrush" }) : walk.moving ? pose(null, { expr: "sly", mode: "walk", phase: walk.phase, facing: walk.facing }) : flow(f, [
        [654, { expr: "neutral", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 1 }],
        [700, { expr: "dismay", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 1, headTilt: -3 }, 10],     // reads it
        [728, { expr: "angry", facing: 0, armR: [[26, 40], [14, 62]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 1, tilt: 4 }, 8],
        [748, { expr: "angry", facing: -1, tilt: 6, armR: [[20, 20], [6, 30]] as A2, armRFront: true, propR: "handful", armL: [[-20, 20], [-6, 30]] as A2, armLFront: true }, 8], // crumples it
        [764, { expr: "angry", facing: -1, tilt: -4, armR: [[-14, -16], [-40, -34]] as A2, armRFront: true }, 4],                                    // lob!
        [780, { expr: "sly", facing: -1, armR: [[24, 30], [10, 44]] as A2 }, 8],
        [812, { expr: "sly", facing: -1, tilt: 3, armL: [[-30, -10], [-56, -24]] as A2, armLFront: true, armR: [[24, 30], [10, 44]] as A2 }, 6],    // whips the cloth off
        [822, { expr: "determined", facing: -1, tilt: -3 + 3 * stroke, armR: mx([[30, -6], [58 + 6 * stroke, -26 - 10 * stroke]], -1), armRFront: true, propR: "paintBrush", propRAng: 0.3 * stroke, armL: [[-24, 30], [-8, 44]] as A2, armLFront: true }, 8],
      ]), { idx: 1 }),
    ],
    fx: fxs(
      ...(f >= 764 && f < 784 ? (() => { const k = (f - 764) / 20, a = add3(R, -0.25, 1.75, 0.1), b = add3(bin, 0, 0.42, 0); const p: V3 = [lerp(a[0], b[0], k), lerp(a[1], b[1], k) + 0.7 * Math.sin(Math.PI * k), lerp(a[2], b[2], k)];
        return [{ kind: "card", key: "ball", pos: p, w: 0.16, h: 0.16, rot: f * 0.5, cw: 64, ch: 64, draw: (q: Pen) => { const g = q.g; g.fillStyle = "#efe6cc"; g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 9; i++) { const aa = (i / 9) * 6.28, rr = 22 + (i % 2) * 6; g.lineTo(32 + Math.cos(aa) * rr, 32 + Math.sin(aa) * rr); } g.closePath(); g.fill(); g.stroke(); } } as FxSpec]; })() : []),
      f >= 784 && f < 796 ? dustCard("binP", add3(bin, 0, 0.5, 0), 0.4, 0.6 * (1 - (f - 784) / 12), 3) : null,
      f >= 812 && f < 824 ? dustCard("cloth", [cv[0], 1.4, cv[2] + 0.2], 0.7, 0.5 * (1 - (f - 812) / 12), 1) : null,
    ),
    focus: f < 680 ? add3(R, 0.1, 1.35, 0.15) : f < 782 ? follow(f, [[680, add3(R, 0.1, 1.35, 0.15)], [712, [R[0], 1.8, R[2]], 32]]) : follow(f, [[782, [R[0], 1.8, R[2]]], [808, [P[0], 1.8, P[2]], 26], [875, cv, 29]]),
    subj: f < 852 ? "forger" : null,
  };
};
lens3([[654, DOF_INSERT], [680, DOF_MS, 32], [846, DOF_INSERT, 29]]);

// ================================================= SHOT 5 (875-1040) THE MUSEUM ======================================
// Opens on the masterpiece on the gallery wall (match), pulls back: the top expert peers through his magnifier, gasps,
// throws his arms up on "masterpiece of the century" (sparkles); the director hands our painter a fat money bag on "pays
// a fortune"; porters carry in two more fakes and hang them either side on "another... and another" (he winks).
SHOT_CAMS[5] = (s) => {
  const P = MK(s, "painting"), ex = MK(s, "expert"), di = MK(s, "director"), pm = MK(s, "painterM");
  const Z = fit([[[P[0], 0, P[2] + 0.1], P[1] - 0.92, P[1] + 0.92, 0.75]], 0, 1, 38, 0.99);
  const A = fit([body(ex), [[P[0], 0, P[2] + 0.1], P[1] - 0.9, P[1] + 0.9, 0.75]], 12, 4, 40, 0.86, 0, 0.05);
  const B = fit([body(ex), body(di), body(pm), [MK(s, "hang2"), -0.6, 0.6, 0.5], [MK(s, "hang3"), -0.6, 0.6, 0.5]], 0, 5, 46, 0.88, 0, 0.1);
  const SZ = F(() => Z, 875, 0.0008), SA = F(() => A, 925, 0.0016, [[930, 0.006, 10]]), SB = F(() => B, 985, 0.0012);
  return [K(875, SZ), K(895, glideTo(SZ, 895, SA, 925), 1), K(958, glideTo(SA, 958, SB, 985), 1)];
};
SHOT_ACTS[5] = (f, s) => {
  const ex = MK(s, "expert"), di = MK(s, "director"), pm = MK(s, "painterM"), P = MK(s, "painting");
  const pa = (k: number, i: number): CastPlace => { const h = i ? MK(s, "hang3") : MK(s, "hang2"), door = MK(s, "door"), a: V3 = [door[0] - 0.4, 0, door[2] - 0.2], m: V3 = [h[0] + (i ? -0.3 : 0.3) + (i ? 0.6 : -0.6), 0, h[2] + 0.95];
    const u1 = sm(k, 0, 0.75), p = lerp3(a, m, u1), moving = k > 0 && k < 0.75;
    return C(i ? "porterB" : "porterA", p, moving ? pose(null, { expr: "strain", mode: "walk", phase: ph(f, 12), facing: faceTo(5, s, f, a, m), armR: [[30, -10], [40, -36]] as A2, armL: [[-30, -10], [-40, -36]] as A2 })
      : pose(null, { expr: k >= 0.75 ? "grin" : "strain", facing: i ? 1 : -1, armR: [[30, -14], [40, -44]] as A2, armL: [[-30, -14], [-40, -44]] as A2 }), { idx: 10 + i }); };
  const h2 = sm(f, 990, 1024), h3 = sm(f, 1004, 1038);
  return {
    ctl: { hang2: h2, hang3: h3 },
    cast: [
      C("expert", ex, flow(f, [
        [875, { expr: "stare", facing: -1, tilt: 10, armR: [[24, -10], [34, -40]] as A2, armRFront: true, propR: "magnifier", look: -0.8 }],
        [905, { expr: "stare", facing: -1, tilt: 13, armR: [[24, -14], [30, -48]] as A2, armRFront: true, propR: "magnifier", look: -1, headTilt: -3 }, 10],
        [922, { expr: "eureka", facing: -1, tilt: -6, armR: [[30, -30], [36, -80]] as A2, armL: [[-30, -30], [-36, -80]] as A2, propR: "magnifier", headBack: 0.4 }, 6],    // masterpiece of the century!
        [970, { expr: "joy", facing: 1, armR: [[26, 30], [8, 40]] as A2, armRFront: true, propR: "magnifier", armL: [[-30, 10], [-50, -8]] as A2 }, 10],
      ]), { idx: 1 }),
      C("director", di, flow(f, [
        [875, { expr: "smug", facing: -1, armR: [[24, 30], [12, 44]] as A2, propR: "moneybag" }],
        [930, { expr: "eureka", facing: -1, tilt: -4, armR: [[24, 30], [12, 44]] as A2, propR: "moneybag", look: -1 }, 8],
        [956, { expr: "beam", facing: 1, armR: [[30, 10], [60, 4]] as A2, armRFront: true, propR: "moneybag" }, 10],      // pays a fortune
        [980, { expr: "proud", facing: 1, armR: [[24, 30], [12, 44]] as A2 }, 10],
      ]), { idx: 2 }),
      C("forger", pm, flow(f, [
        [875, { expr: "smug", facing: -1, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true }],
        [958, { expr: "sly", facing: -1, armL: [[-30, 10], [-56, 2]] as A2, armLFront: true }, 8],
        [972, { expr: "smug", facing: -1, armL: [[-26, 30], [-12, 44]] as A2, propL: "moneybag", headTilt: 4 }, 8],     // takes it
        [1010, { expr: "sly", facing: 1, armL: [[-26, 30], [-12, 44]] as A2, propL: "moneybag", armR: [[26, -10], [12, -34]] as A2, armRFront: true, headTilt: -5 }, 8],  // wink at the camera
      ]), { idx: 3 }),
      ...(f >= 985 ? [pa((f - 985) / 40, 0), pa((f - 999) / 40, 1)] : []),
    ],
    fx: fxs(f >= 924 ? sparkle("mc1", [P[0] - 0.4, P[1] + 0.5, P[2] + 0.2], f - 924, 0.4) : null, f >= 930 ? sparkle("mc2", [P[0] + 0.5, P[1] - 0.2, P[2] + 0.2], f - 930, 0.3) : null, f >= 960 ? sparkle("mb", [lerp(di[0], pm[0], 0.5), 1.4, di[2] + 0.3], f - 960, 0.3, "#ffe28a") : null),
    focus: f < 895 ? P : f < 958 ? follow(f, [[895, P], [925, [ex[0], 1.75, ex[2]], 30]]) : follow(f, [[958, [ex[0], 1.75, ex[2]]], [985, [di[0], 1.75, di[2]], 27]]),
    subj: f < 895 ? null : f < 958 ? "expert" : "director",
  };
};
lens3([[875, DOF_INSERT], [895, DOF_MS, 30], [958, DOF_WS, 27]]);

// ================================================= SHOT 6 (1040-1140) THE TOP NAZI (hard cut 1) =======================
// He beams at the fake on its easel, rubs his hands, pats the frame; behind, a worker shoves the cart piled with 137 real
// paintings out toward the door (tag 137). One hold with a slow push.
SHOT_CAMS[6] = (s) => {
  const o = MK(s, "official"), P = MK(s, "painting"), cp = MK(s, "cart");
  // hold A on him + the fake (camera swung left so the cart by the door stays out of frame), then on "137" a sideways
  // glide round to an end-on view of the cart: the 137 tag faces the lens and the cart rolls away out the door
  const A = fit([body(o, 0, 2.15, 0.5), [[P[0], 0, P[2]], 0.95, 2.15, 0.55]], -15, 7, 44, 0.86, 0.05, 0.05);
  const B = fit([[cp, 0.2, 2.7, 0.6], body([cp[0] - 1.0, 0, cp[2] - 0.85], 0, 2.05, 0.35)], -75, 8, 44, 0.85, 0, 0);
  const SA = F(() => A, 1040, 0.0018, [[1056, 0.005, 10]]), SB = F(() => B, 1090, 0.0012);
  return [K(1040, SA), K(1066, glideTo(SA, 1066, SB, 1090), 1)];
};
const CART6 = (f: number): V3 => { const k0 = sm(f, 1082, 1136), k = k0 * k0 * (3 - 2 * k0); return [lerp(3.3, 6.4, k), 0, lerp(1.9, 1.75, k)]; };
SHOT_ACTS[6] = (f, s) => {
  const o = MK(s, "official"), cart = sm(f, 1082, 1136), cp = CART6(f), pp: V3 = [cp[0] - 1.0, 0, cp[2] - 0.85];
  const rolling = f >= 1084 && f < 1134;
  return {
    ctl: { cart },
    cast: [
      C("nazi", o, flow(f, [
        [1040, { expr: "beam", facing: 1, armR: [[22, 10], [4, 4]] as A2, armRFront: true, armL: [[-22, 10], [-4, 6]] as A2, armLFront: true, tilt: 3 * Math.sin(f * 0.6) }],   // rubs his hands
        [1054, { expr: "smug", facing: 1, armR: [[30, -6], [58, -14]] as A2, armRFront: true, headTilt: 5 }, 8],      // pats the frame on "trades"
        [1068, { expr: "beam", facing: 1, armR: [[30, -30], [60, -46]] as A2, armL: [[-26, 2], [-40, -14]] as A2, look: 0.6, tilt: 4 }, 7],   // flicks the cart off toward the door
      ]), { idx: 1 }),
      C("porterB", pp, rolling ? pose(null, { expr: "strain", mode: "push", phase: ph(f, 11), facing: 1, tilt: 8, armR: [[30, -6], [60, -4]] as A2, armL: [[24, -2], [54, 2]] as A2, armLFront: true })
        : flow(f, [
          [1040, { expr: "neutral", facing: 1, armR: [[30, 0], [50, 10]] as A2, armL: [[-26, 6], [-30, 30]] as A2 }],
          [1066, { expr: "strain", facing: 1, tilt: -6, armR: [[30, -6], [56, -6]] as A2, armL: [[24, -2], [50, 0]] as A2, armLFront: true }, 6],   // wind-up: braces, leans back
          [1078, { expr: "strain", facing: 1, tilt: 9, armR: [[30, -6], [60, -4]] as A2, armL: [[24, -2], [54, 2]] as A2, armLFront: true }, 3],   // heave on "137"
          [1134, { expr: "grin", facing: 1, tilt: 4, armR: [[30, 0], [50, 10]] as A2, armL: [[24, 4], [40, 24]] as A2 }, 6],
        ]), { idx: 2 }),
    ],
    fx: fxs(rolling && (f % 12) < 2 ? dustCard("cartD" + Math.floor(f / 12), [cp[0] - 1.1, 0.2, cp[2]], 0.5, 0.5, 2) : null),
    focus: f < 1072 ? [o[0], 1.75, o[2]] : [cp[0] - 1.3, 1.0, cp[2]],
    subj: f < 1072 ? "nazi" : "porterB",
  };
};
lens3([[1040, DOF_FS], [1066, DOF_MS, 24]]);

// ================================================= SHOT 7 (1140-1238) THE REQUEST (hard cut 2) ========================
// Back in the dock: "Fine. Give me paint, a canvas... and an oven." - a grudging eye-roll on "Fine", then he counts on
// his fingers (one, two, three), the guard's eyebrows climb; a slow push with a punch on "oven"; a wink on "That's the
// trick" and the oven's glow floods the frame (light dissolve into the studio at 1238).
SHOT_CAMS[7] = (s) => {
  const D = MK(s, "dock");
  const A = fit([body(D, 0.9, 2.35, 0.42), body(GB3, 1.0, 2.2, 0.3)], 18, 3, 38, 0.86, 0.12, 0.02);
  return [K(1140, F(() => A, 1140, 0.0016, [[1204, 0.007, 12], [1222, 0.005, 10]]), 1, true)];
};
SHOT_ACTS[7] = (f, s) => {
  const D = MK(s, "dock");
  const f7 = flow(f, [
    [1140, { expr: "bored", facing: 0, armR: [[28, 16], [-6, 22]] as A2, armRFront: true, armL: [[-28, 16], [6, 24]] as A2, armLFront: true, look: 0.4 }],
    [1158, { expr: "bored", facing: 0, armR: [[34, 18], [52, -6]] as A2, armL: [[-34, 18], [-52, -6]] as A2, headTilt: -4 }, 8],                 // "Fine." shrug
    [1172, { expr: "smug", facing: 0, armR: [[30, -4], [44, -34]] as A2, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 2 }, 6],                  // one finger: paint
    [1187, { expr: "smug", facing: 0, armR: [[30, -6], [46, -38]] as A2, armL: [[-26, 30], [-10, 44]] as A2, headTilt: -2 }, 6],                 // two: a canvas
    [1204, { expr: "sly", facing: 0, armR: [[32, -10], [50, -44]] as A2, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 5, tilt: -3 }, 6],         // three: an oven
    [1222, { expr: "smug", facing: 0, armR: [[26, -10], [8, -34]] as A2, armRFront: true, armL: [[-26, 30], [-10, 44]] as A2, headTilt: 6, swapLid: 0 }, 6],  // "That's the trick" wink
  ]);
  const wink = f >= 1224 && f < 1236 ? 1 : 0;
  return {
    ctl: { fans: 1 },
    cast: [
      C("forger", D, pose(null, { ...speak(f, 1157, 1218, f7 as P), ...(wink ? { expr: "sly" as Face } : {}) }), { idx: 1 }),
      C("guardB", GB3, flow(f, [
        [1140, { expr: "smile", facing: -1, armR: [[24, 20], [26, -4]] as A2, armRFront: true, propR: "coffeeCup" }],
        [1200, { expr: "shock", facing: -1, tilt: -4, armR: [[24, 20], [26, -4]] as A2, armRFront: true, propR: "coffeeCup", look: -0.8 }, 8],     // an oven?!
      ]), { idx: 2 }),
    ],
    fx: fxs(f >= 1226 ? glowBurst("ovenFlash", camPt(7, s, f, 1.2, 0, -0.1), 2.2, sm(f, 1226, 1242), "255,170,90") : null,
      f >= 1206 ? sparkle("fing", [D[0] + 0.45, 2.2, D[2] + 0.1], f - 1206, 0.22) : null),
    focus: [D[0], 1.95, D[2]],
    subj: "forger",
  };
};
lens3([[1140, DOF_MS]]);

// ================================================= SHOT 8 (1238-1497) THE TRICK, studio night blue ====================
// "Old paint is rock hard": he pokes the fresh canvas, it's wet - finger sticks, shakes it. "mixes plastic into his": the
// RESIN bottle pours into his paint pot. "bakes the canvas like cookies": door down, the canvas slides in beside the
// cookie tray, door up, the glow, the clock hands spin. "rolls it over a pipe": out, up onto the pipe, tipped over it -
// the cracks run across the picture. "rubs ink in the cracks": back on the easel, the rag wipes black ink in. "300
// years in one afternoon": the varnish yellows, clock spins to five, he bites a cookie; push into the aged canvas.
SHOT_CAMS[8] = (s) => {
  const P = MK(s, "paint"), cv = MK(s, "canvas"), oven = MK(s, "oven"), roll = MK(s, "roll"), pipe = MK(s, "pipe");
  const A = fit([body(P, 0, 2.15, 0.35), [[cv[0], 0, cv[2]], 0.9, 1.9, 0.4]], 14, 4, 40, 0.84, 0, 0.05);
  const B = fit([body(oven, 0, 2.15, 0.35), [MK(s, "ovenDoor"), -0.45, 0.6, 0.6], [[pipe[0], 0, pipe[2]], 0.5, 1.6, 0.5], body(roll, 0, 2.15, 0.3)], 8, 6, 50, 0.88, 0, 0.1);
  const Cc = fit([body(P, 0.4, 2.15, 0.35), [[cv[0], 0, cv[2]], 0.9, 1.9, 0.4]], 10, 3, 38, 0.86);
  const Z = fit([[[cv[0], 0, cv[2] + 0.05], 0.94, 1.82, 0.37]], 0, 1, 38, 0.99);
  const SA = F(() => A, 1238, 0.0014), SB = F(() => B, 1328, 0.0012, [[1380, 0.005, 10]]), SC = F(() => Cc, 1424, 0.0016), SZ = F(() => Z, 1497, 0.001);
  return [K(1238, SA), K(1300, glideTo(SA, 1300, SB, 1330), 1), K(1402, glideTo(SB, 1402, SC, 1426), 1), K(1476, glideTo(SC, 1476, SZ, 1497), 1)];
};
SHOT_ACTS[8] = (f, s) => {
  const P = MK(s, "paint"), oven = MK(s, "oven"), roll = MK(s, "roll");
  // where he stands: easel -> oven door -> roller -> easel
  // ...then, cookie in hand, he strolls out of frame right (an acted exit) so the push into the canvas and the dissolve
  // into the courtroom carry no people
  const EXIT8: V3 = [1.25, 0, -0.3];
  const legs: [number, number, V3[]][] = [[1300, 1318, [P, oven]], [1360, 1374, [oven, roll]], [1400, 1416, [roll, P]], [1452, 1476, [P, [0.6, 0, -0.55], EXIT8]]];
  let at: V3 = P, walking: { facing: number; phase: number } | null = null;
  for (const [a, b, path] of legs) { if (f >= b) at = path[path.length - 1]; else if (f >= a) { const w = walkPath(8, s, path, f, a, b); at = w.p; walking = { facing: w.facing, phase: w.phase }; } }
  const cv = f < 1318 ? 0 : f < 1340 ? lerp(0, 2, sm(f, 1318, 1340)) : f < 1360 ? 2 : f < 1376 ? lerp(2, 3, sm(f, 1360, 1376)) : f < 1400 ? lerp(3, 4, sm(f, 1376, 1400)) : f < 1414 ? lerp(4, 5, sm(f, 1400, 1414)) : 5;
  const scrub = Math.sin(f * 0.9);
  return {
    ctl: {
      paint: 1, wet: f < 1340 ? 1 : 1 - sm(f, 1340, 1356), cv, door: sm(f, 1312, 1322) * (1 - sm(f, 1338, 1348)) + sm(f, 1356, 1364) * (1 - sm(f, 1376, 1386)),
      heat: sm(f, 1336, 1350) * (1 - sm(f, 1376, 1420)), crack: sm(f, 1380, 1402), ink: sm(f, 1414, 1438), age: sm(f, 1444, 1478),
      clock: 13 + 2 * sm(f, 1340, 1366) + 2 * sm(f, 1446, 1476), shine: 0.6 * bump((f - 1340) / 24), review: 0, lamp: 0.85,
    },
    cast: [
      C("forger", at, walking ? pose(null, f >= 1452 ? { expr: "smug", mode: "walk", phase: walking.phase, facing: walking.facing, armR: [[24, -6], [10, -30]] as A2, armRFront: true, propR: "cookie", propK: 1 } : { expr: "determined", mode: "walk", phase: walking.phase, facing: walking.facing }) : flow(f, [
        [1238, { expr: "smug", facing: -1, armR: [[26, 30], [8, 40]] as A2 }],
        [1248, { expr: "smug", facing: -1, tilt: 4, armL: [[-30, -6], [-58, -12]] as A2, armLFront: true }, 6],              // pokes the canvas
        [1262, { expr: "dismay", facing: -1, tilt: -2, armL: [[-30, -10], [-44, -34 + 8 * Math.sin(f * 1.6)]] as A2, armLFront: true }, 6],   // sticky! shakes the finger
        [1284, { expr: "sly", facing: -1, armR: [[28, -6], [46, -34]] as A2, armRFront: true, propR: "resinBottle", propRAng: -0.4, armL: [[-24, 20], [-30, 34]] as A2, armLFront: true, propL: "paintPot" }, 8],
        [1292, { expr: "sly", facing: -1, armR: [[28, -10], [38, -38]] as A2, armRFront: true, propR: "resinBottle", propRAng: -2.2, propK: 1, armL: [[-24, 20], [-30, 34]] as A2, armLFront: true, propL: "paintPot", headTilt: 4 }, 6], // pours
        [1318, { expr: "determined", facing: 1, tilt: -4, armR: [[34, 4], [62, -4]] as A2, armL: [[24, 6], [56, 0]] as A2, armRFront: true, armLFront: true }, 6],   // slides it into the oven
        [1342, { expr: "smug", facing: 1, armR: [[24, 30], [10, 44]] as A2, armL: [[-30, 10], [-50, -10]] as A2, headTilt: 3 }, 8],      // "like cookies"
        [1374, { expr: "strain", facing: -1, tilt: 6, armR: [[-24, -4], [-50, -24]] as A2, armL: [[-30, 0], [-56, -14]] as A2, armRFront: true, armLFront: true }, 6],   // pulls it over the pipe
        [1392, { expr: "strain", facing: -1, tilt: 10, armR: [[-24, 10], [-52, 18]] as A2, armL: [[-30, 14], [-56, 24]] as A2, armRFront: true, armLFront: true }, 8],
        [1416, { expr: "determined", facing: -1, tilt: 3 + 3 * scrub, armR: mx([[30, -4], [54 + 6 * scrub, -20 - 8 * scrub]], -1), armRFront: true, propR: "rag" }, 6],   // rubs the ink in
        [1440, { expr: "proud", facing: 0, armR: [[24, -10], [8, -36]] as A2, armRFront: true, propR: "cookie", headTilt: 4 }, 10],   // 300 years... a cookie
        [1446, { expr: "calm", facing: 0, armR: [[22, -14], [4, -40]] as A2, armRFront: true, propR: "cookie", propK: 1, headTilt: -3 }, 5],   // bite
      ]), { idx: 1 }),
    ],
    fx: fxs(
      f >= 1340 && f < 1380 ? squiggles("heat", [oven[0] + 0.55, 1.5, oven[2] - 0.2], f, "#ffb070", 0.32) : null,
      ...(f >= 1380 && f < 1404 ? [sparkle("cr1", add3(MK(s, "pipe"), -0.2, 0.55, 0.3), f - 1380, 0.22, "#ffffff"), sparkle("cr2", add3(MK(s, "pipe"), 0.25, 0.3, 0.4), f - 1386, 0.18, "#ffffff")] : []),
      f >= 1470 && f < 1490 ? sparkle("age", add3(MK(s, "canvas"), 0.2, 0.3, 0.1), f - 1470, 0.3, "#ffe28a") : null,
    ),
    focus: f < 1300 ? [P[0], 1.8, P[2]] : f < 1402 ? follow(f, [[1300, [P[0], 1.8, P[2]]], [1330, MK(s, "ovenDoor"), 30], [1376, MK(s, "pipe"), 16]]) : follow(f, [[1402, MK(s, "pipe")], [1426, [P[0], 1.7, P[2]], 24], [1497, MK(s, "canvas"), 29]]),
    subj: f < 1462 ? "forger" : null,
  };
};
lens3([[1238, DOF_MS], [1300, DOF_FS, 30], [1402, DOF_MS, 24], [1476, DOF_INSERT, 21]]);

// ================================================= SHOT 9 (1497-1645) THE TEST, court ================================
// Opens on the old fake (the evidence painting, match), pulls back to the experts' table: the scientist scrapes a flake,
// heats it over the spirit burner, a puff of smoke - PLASTIC (he jolts); the second one slams open the book: PLASTIC,
// INVENTED 1907 (readable); in the dock our painter buffs his nails, smug. Flashbulb dissolve at 1645.
SHOT_CAMS[9] = (s) => {
  const EV = MK(s, "painting"), A1 = MK(s, "sciA"), B1 = MK(s, "sciB"), L = MK(s, "lab");
  const Z = fit([[[EV[0], 0, EV[2]], EV[1] - 0.65, EV[1] + 0.65, 0.58]], 31, 1, 38, 0.98);
  const A = fit([body(A1), body(B1), [[L[0], 0, L[2]], 0.85, 1.2, 0.7]], 50, 6, 44, 0.88, 0, 0.1);
  const Bk = fit([body(B1, 0.9, 2.25, 0.5)], 18, 2, 36, 0.9);
  const SZ = F(() => Z, 1497, 0.0008), SA = F(() => A, 1540, 0.0016, [[1566, 0.006, 10]]), SB = F(() => Bk, 1622, 0.0012);
  return [K(1497, SZ), K(1510, glideTo(SZ, 1510, SA, 1540), 1), K(1596, glideTo(SA, 1596, SB, 1622), 1)];
};
SHOT_ACTS[9] = (f, s) => {
  const A1 = MK(s, "sciA"), B1 = MK(s, "sciB"), L = MK(s, "lab"), D = MK(s, "dock");
  return {
    ctl: { labOn: 1, fans: 1 },
    cast: [
      C("sciA", A1, flow(f, [
        [1497, { expr: "determined", facing: -1, tilt: 8, armR: mx([[30, -4], [56, -22]], -1), armRFront: true, propR: "scraper" }],                 // scrapes a flake
        [1534, { expr: "determined", facing: -1, tilt: 6, armR: [[-20, 10], [-40, 6]] as A2, armRFront: true, propR: "testTube", propK: 0 }, 8],          // over the burner
        [1556, { expr: "shock", facing: 0, tilt: -6, armR: [[24, -14], [34, -48]] as A2, propR: "testTube", propK: sm(f, 1556, 1580), headBack: 0.3 }, 5],  // PLASTIC!
        [1600, { expr: "aghast", facing: 1, armR: [[24, -14], [34, -48]] as A2, propR: "testTube", propK: 1, look: 1 }, 10],
      ]), { idx: 1 }),
      C("sciB", B1, flow(f, [
        [1497, { expr: "stare", facing: 1, armR: [[24, 30], [10, 44]] as A2, armL: [[-22, 20], [-10, 34]] as A2, armLFront: true, propL: "notebook" }],
        [1560, { expr: "shock", facing: 1, tilt: -4, armR: [[24, 30], [10, 44]] as A2, look: 1 }, 6],
        [1596, { expr: "eureka", facing: 0, armR: [[26, 6], [10, -16]] as A2, armRFront: true, propR: "plasticBook", headTilt: 3 }, 8],         // slams the book open: 1907
      ]), { idx: 2 }),
      C("forger", D, flow(f, [
        [1497, { expr: "smug", facing: -1, armR: [[24, 10], [6, -6]] as A2, armRFront: true, look: -0.5 }],
        [1570, { expr: "sly", facing: -1, armR: [[24, 10], [10, -10]] as A2, armRFront: true, headTilt: 4, look: -0.8 }, 8],   // buffs his nails on his smock
      ]), { idx: 3 }),
      C("guardA", [-0.6, 0, -0.38], flow(f, [[1497, { expr: "stern", facing: -1, look: -0.8, armR: [[24, 30], [10, 44]] as A2, propR: "keys" }], [1570, { expr: "aghast", facing: -1, look: -1, armR: [[24, 30], [10, 44]] as A2, propR: "keys" }, 8]]), { idx: 4 }),
    ],
    fx: fxs(
      f >= 1556 && f < 1590 ? glowBurst("puff", [A1[0] + 0.25, 2.35, A1[2] + 0.1], 0.6, 1 - (f - 1556) / 34, "240,240,250") : null,
      f >= 1558 ? bang([A1[0] - 0.1, 2.6, A1[2]], f - 1558) : null,
      f >= 1634 ? glowBurst("flash9", camPt(9, s, f, 1.4, 0.2, 0.3), 2.4, sm(f, 1634, 1648), "255,255,240") : null,
    ),
    focus: f < 1510 ? MK(s, "painting") : f < 1596 ? follow(f, [[1510, MK(s, "painting")], [1540, [A1[0], 1.75, A1[2]], 30]]) : follow(f, [[1596, [A1[0], 1.75, A1[2]]], [1622, [B1[0], 1.6, B1[2] + 0.1], 26]]),
    subj: f < 1596 ? "sciA" : "sciB",
  };
};
lens3([[1497, DOF_INSERT], [1510, DOF_MS, 30]]);

// ================================================= SHOT 10 (1645-1824) THE PAYOFF, court ============================
// The flash clears on a cheering court: streamers rain down, the public jumps and waves, flashbulbs pop; he stands on the
// dock's rail beside the old fake (which fills the left of the frame), arms up. "the country ranks him its second
// favourite man": a reporter thrusts the poll page at the camera (2. THE PAINTER). "So, con man or war hero?": he
// shrugs, palms up, with a grin; a slow push in.
SHOT_CAMS[10] = (s) => {
  const EV = MK(s, "painting"), pf = PF10(s), r2 = R10(s);
  // the reporter now stands at his side (not in front of him), so the wide shows painting + painter + reporter; the
  // poll beat frames the reporter and the WHOLE page (the painter cleanly out of frame left)
  const A = fit([[[EV[0], 0, EV[2]], EV[1] - 0.66, EV[1] + 0.66, 0.6], body(pf, 0, 2.3, 0.45), body(r2, 0, 2.45, 0.42)], 30, 6, 44, 0.9, 0.1, 0.05);
  const rt = [Math.cos(24 * Math.PI / 180), 0, -Math.sin(24 * Math.PI / 180)], pp: V3 = [r2[0] + rt[0] * 0.55, 0, r2[2] + rt[2] * 0.55];
  const R = fit([body(r2, 0.9, 2.45, 0.42), [pp, 1.2, 2.1, 0.38]], 24, 3, 38, 0.9, 0);
  const Cc = fit([body(pf, 1.05, 2.35, 0.42)], 22, 2, 34, 0.88);
  const SA = F(() => A, 1645, 0.0014, [[1660, 0.005, 10]]), SR = F(() => R, 1736, 0.0012), SC = F(() => Cc, 1784, 0.0016, [[1800, 0.006, 10]]);
  return [K(1645, SA), K(1712, glideTo(SA, 1712, SR, 1738), 1), K(1764, glideTo(SR, 1764, SC, 1786), 1)];
};
const PF10 = (s: SetDef): V3 => add3(MK(s, "painting"), 1.25, -MK(s, "painting")[1], 0.75);
const R10 = (s: SetDef): V3 => add3(PF10(s), 0.95, 0, -0.25);
SHOT_ACTS[10] = (f, s) => {
  const pf = PF10(s), r2 = R10(s);
  const pubs = ["pubA", "pubB", "pubC", "pubD", "pubE", "pubF"].map((w, i) => {
    const p = MK(s, "pub" + (i + 1)), j = Math.max(0, Math.sin((f - 1645) * 0.35 + i * 1.3));
    return C(w, p, pose(null, { expr: i % 2 ? "joy" : "laugh", facing: p[0] > pf[0] ? -1 : 1, tilt: 3 * Math.sin(st(f) * 0.4 + i), armR: [[30, -30 - 6 * j], [36, -80 - 10 * j]] as A2, armL: i % 3 ? [[-30, -30], [-36, -80 + 8 * j]] as A2 : [[-24, 30], [-10, 44]] as A2, headTilt: 4 * Math.sin(f * 0.3 + i) }), { idx: 20 + i });
  });
  return {
    ctl: { payoff: 1, fans: 1.6, labOn: 0 },
    cast: [
      C("forger", pf, flow(f, [
        [1645, { expr: "joy", facing: 1, armR: [[30, -30], [36, -80]] as A2, armL: [[-30, -30], [-36, -80]] as A2, headBack: 0.3 }],                     // cheers
        [1690, { expr: "beam", facing: -1, armL: [[-34, -10], [-66, -26]] as A2, armR: [[30, -30], [36, -80]] as A2, headTilt: -4 }, 8],                  // points at the fake
        [1740, { expr: "proud", facing: 1, armR: [[26, 30], [6, 40]] as A2, armRFront: true, armL: [[-26, 30], [-6, 40]] as A2, armLFront: true, look: 0.8 }, 10],
        [1782, { expr: "sly", facing: 0, armR: [[34, 18], [54, -6]] as A2, armL: [[-34, 18], [-54, -6]] as A2, headTilt: 5 }, 8],                        // con man or war hero? shrug
        [1806, { expr: "smug", facing: 0, armR: [[34, 18], [54, -6]] as A2, armL: [[-34, 18], [-54, -6]] as A2, headTilt: -4 }, 8],
      ]), { idx: 1 }),
      C("rep2", r2, flow(f, [
        [1645, { expr: "laugh", facing: -1, armR: [[30, 0], [10, -56]] as A2, armRFront: true, propR: "camera" }],
        [1720, { expr: "grin", facing: -1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 2, headTilt: 4 }, 8],              // the poll
        [1744, { expr: "laugh", facing: 1, armR: [[30, 0], [58, 26]] as A2, armRFront: true, armRTop: true, propR: "paperHead", propK: 2, headTilt: -4, armL: [[-30, -10], [-50, -30]] as A2 }, 6],   // jabs the page: "second favourite"
        [1768, { expr: "grin", facing: -1, armR: [[26, 30], [12, 44]] as A2, propR: "paperHead", propK: 2, armL: [[-30, -30], [-36, -80]] as A2 }, 8],       // lowers it, cheers
      ]), { idx: 2 }),
      ...pubs,
      C("guardB", [1.6, 0, -1.2], pose(null, { expr: "laugh", facing: -1, armR: [[30, -30], [36, -80]] as A2, propR: "coffeeCup", shake: 0.5, phase: f / 12 }), { idx: 3 }),   // off to the right, out of every payoff frame
    ],
    fx: fxs(
      ...[0, 1, 2].map((i) => { const t0 = 1650 + i * 37; return f >= t0 && f < t0 + 10 ? glowBurst("pf" + i, [pf[0] + 1.6 - i * 1.1, 2.4 + 0.3 * i, pf[2] + 1.2 - i * 0.4], 1.0, 1 - (f - t0) / 10, "255,255,240") : null; }),
      f >= 1648 ? sparkle("po1", add3(MK(s, "painting"), 0.3, 0.45, 0.15), (f - 1648) % 30, 0.32, "#ffe28a") : null,
      f >= 1812 ? glowBurst("flash10", camPt(10, s, f, 1.3, 0, 0.2), 2.4, sm(f, 1812, 1826), "255,255,240") : null,
    ),
    focus: f < 1712 ? [pf[0], 1.95, pf[2]] : f < 1764 ? follow(f, [[1712, [pf[0], 1.95, pf[2]]], [1738, [r2[0], 1.7, r2[2]], 26]]) : follow(f, [[1764, [r2[0], 1.7, r2[2]]], [1786, [pf[0], 2.0, pf[2]], 22]]),
    subj: "forger",
  };
};
lens3([[1645, DOF_FS], [1712, DOF_MS, 26], [1764, DOF_CU, 22]]);

// ================================================= SHOT 11 (1824-1920) ENDING, the studio ==========================
// Calm close shot: the review pinned on his corkboard; he steps into frame, taps it with his brush on "originality",
// a content smile (changed face), then turns back to his easel - looping into the hook.
const PF11: V3 = [-0.82, 0, -2.15];
SHOT_CAMS[11] = (s) => {
  const rv = MK(s, "review");
  // near straight on and a little high, him just right of the review: the canvas stays out of frame right (it hid
  // him at az 18), the wardrobe door stays left of the review, and the desk lamp sits below it (visible light source)
  const A = fit([body(PF11, 1.0, 2.2, 0.33), [[rv[0], 0, rv[2]], rv[1] - 0.32, rv[1] + 0.32, 0.26]], -8, 8, 36, 0.88);
  return [K(1824, F(() => A, 1824, 0.0016, [[1876, 0.004, 12]]))];
};
SHOT_ACTS[11] = (f, s) => {
  const rv = MK(s, "review");
  return {
    ctl: { paint: 1, age: 1, crack: 1, ink: 1, cv: 0, review: 1, clock: 17, wardR: 0.15 },
    cast: [C("forger", PF11, flow(f, [
      [1824, { expr: "smug", facing: -1, armR: [[24, 30], [10, 44]] as A2, propR: "paintBrush" }],
      [1834, { expr: "smug", facing: -1, armR: [[-24, -10], [-50, -24]] as A2, armRFront: true, propR: "paintBrush", tilt: 4 }, 8],         // taps the review
      [1862, { expr: "calm", facing: -1, armR: [[24, 30], [10, 44]] as A2, propR: "paintBrush", headTilt: 3, look: -0.6 }, 10],              // a content smile
      [1890, { expr: "calm", facing: 1, armR: [[24, 20], [30, 0]] as A2, propR: "paintBrush", look: 0.8 }, 10],                               // back to the easel
    ]), { idx: 1 })],
    fx: fxs(f >= 1842 ? sparkle("rv", [rv[0] + 0.15, rv[1] + 0.2, rv[2] + 0.05], f - 1842, 0.22, "#ffe28a") : null),
    focus: f < 1860 ? rv : [PF11[0], 1.95, PF11[2]],
    subj: "forger",
  };
};
lens3([[1824, DOF_MS]]);
