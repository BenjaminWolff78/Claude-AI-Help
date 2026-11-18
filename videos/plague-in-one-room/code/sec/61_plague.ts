// =====================================================================================================================
// "They Put a Plague in One Room and It Took a Whole City" (2026-11-18), master prompt v21. Plan: /home/claude/p7/checkpoints/CP1_CP2_plague.md
// Six story shots, five hard cuts (427 office, 500 capital, 1372 office, 1642 study, 1833 square). Inside each place one
// moving camera (push-ins on holds, a few glides). Every narration line is one physical object (the orb, the hopping sigil,
// the rune border + "10", the pet stone, the code printout, the health bars, the map, the bread, the staff, the TURN BACK
// sign, the quarantine ring, the RESTART lever, the rewind dial, the journal, the sneeze).
// Acting: beats <= 1.5 s, deliberate moves 10-20 f with overshoot + settle (flow), reactions 2-4 f, hand-offs reach /
// grip / carry / release, falls rotate about the feet over 10-14 f with a bounce, the life layer breathes every frame.
const X1 = PT.BOSS[0];
// ---------------- game UI objects (cards) ----------------
/** a floating health bar over a head; k 0..1 full, col fill; inf = shows the infinity sign (shopkeepers) */
const hpBar = (key: string, pos: V3, k: number, sick = false, inf = false, w = 0.62): FxSpec => ({ kind: "card", key: "hp" + key + Math.round(k * 24) + (sick ? "s" : "") + (inf ? "i" : ""), pos, w, h: w * 0.2, cw: 256, ch: 52,
  draw: (p) => { const g = p.g; g.fillStyle = "#1a1416"; g.fillRect(4, 8, 248, 36); g.fillStyle = sick ? "#5a2a2a" : "#2a3a2a"; g.fillRect(10, 14, 236, 24);
    g.fillStyle = k > 0.5 ? (sick ? "#c8a020" : "#4ad04a") : k > 0.22 ? "#e8a020" : "#e83a2a"; g.fillRect(10, 14, 236 * Math.max(0, Math.min(1, k)), 24);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(10, 14, 236 * Math.max(0, Math.min(1, k)), 7); g.strokeStyle = "#f2e6c8"; g.lineWidth = 4; g.strokeRect(4, 8, 248, 36);
    if (inf) { g.fillStyle = "#f2e6c8"; g.font = "900 34px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 6; g.strokeStyle = "#1a1416"; g.strokeText("∞", 128, 27); g.fillText("∞", 128, 27); } } });
/** the red curse sigil (a spinning rune circle) */
const sigil = (key: string, pos: V3, f: number, size = 0.3, op = 1): FxSpec => ({ kind: "card", key: "sg" + key + (Math.floor(f / 2) % 8) + Math.round(op * 5), pos, w: size, h: size, rot: f * 0.12, cw: 96, ch: 96, op,
  draw: (p) => { const g = p.g; g.save(); g.shadowColor = "#ff2a1a"; g.shadowBlur = 10; g.strokeStyle = "#ff4a3a"; g.lineWidth = 7; g.beginPath(); g.arc(48, 48, 34, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 3; i++) { const a = (i * Math.PI * 2) / 3; g.moveTo(48, 48); g.lineTo(48 + Math.cos(a) * 30, 48 + Math.sin(a) * 30); } g.stroke();
    g.fillStyle = "#ff8a6a"; g.beginPath(); g.arc(48, 48, 9, 0, Math.PI * 2); g.fill(); g.restore(); } });
/** a sigil hopping from a to b over [f0, f1]: an arc through every in-between frame plus a smear streak */
const hop = (key: string, a: V3, b: V3, f: number, f0: number, f1: number, size = 0.3): FxSpec[] => {
  if (f < f0 || f > f1) return [];
  const u = sm(f, f0, f1), p = lerp3(a, b, u); p[1] += 0.6 * Math.sin(Math.PI * u);
  const q = lerp3(a, b, sm(f - 2, f0, f1)); q[1] += 0.6 * Math.sin(Math.PI * sm(f - 2, f0, f1));
  return [sigil(key, p, f, size), smear(key + "h", q, p, 0.55)];
};
const bubble = (key: string, txt: string, pos: V3, col = "#f4f0e2", w = 0.42, ink = "#1a1416"): FxSpec => ({ kind: "card", key: "bb" + key + txt, pos, w, h: w, cw: 128, ch: 128,
  draw: (p) => { const g = p.g; g.fillStyle = col; g.strokeStyle = "#1a1416"; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = ink; g.font = `900 ${txt.length > 2 ? 40 : 62}px Arial Black, Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 68); } });
const tag = (key: string, txt: string, pos: V3, bg = "#2f3a5a", fg = "#f2c94c", w = 0.5): FxSpec => ({ kind: "card", key: "tg" + key + txt, pos, w, h: w * 0.36, cw: 192, ch: 70,
  draw: (p) => { const g = p.g; g.fillStyle = bg; g.strokeStyle = "#1a1416"; g.lineWidth = 6; g.beginPath(); g.roundRect(4, 4, 184, 62, 14); g.fill(); g.stroke(); g.fillStyle = fg; g.font = "900 38px Arial Black, Arial"; const tw = g.measureText(txt).width; const fs = Math.min(38, Math.floor(38 * 164 / Math.max(1, tw))); g.font = `900 ${fs}px Arial Black, Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 96, 37); } });
/** a big pop-in title card whose text always fits its card */
const titleCard = (key: string, txt: string, pos: V3, age: number, life: number, col: string, w = 0.9): FxSpec[] => {
  if (age < 0 || age > life) return [];
  const k = Math.min(1, age / 3) * (1 - Math.max(0, (age - life + 4) / 4));
  return [{ kind: "card", key: "tc" + key + Math.round(k * 6), pos, w: w * (0.8 + 0.2 * Math.min(1, age / 3)), h: w * 0.22, cw: 512, ch: 112, op: Math.max(0, k),
    draw: (p) => { const g = p.g; g.font = "900 78px Arial Black, Arial"; const tw = g.measureText(txt).width; const fs = Math.min(78, Math.floor(78 * 470 / Math.max(1, tw))); g.font = `900 ${fs}px Arial Black, Arial`;
      g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 14; g.strokeStyle = "#1a1416"; g.lineJoin = "round"; g.strokeText(txt, 256, 58); g.fillStyle = col; g.fillText(txt, 256, 58); } }];
};
const flash = (key: string, pos: V3, age: number, size = 0.9): FxSpec[] => (age < 0 || age > 10 ? [] : [{ kind: "card", key: "fl" + key + Math.floor(age), pos, w: size * (0.5 + age * 0.08), h: size * (0.5 + age * 0.08), soft: true, cw: 96, ch: 96, op: 1 - age / 10,
  draw: (p) => { const g = p.g, gr = g.createRadialGradient(48, 48, 2, 48, 48, 46); gr.addColorStop(0, "rgba(255,255,230,1)"); gr.addColorStop(0.5, "rgba(140,255,240,0.6)"); gr.addColorStop(1, "rgba(140,255,240,0)"); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); } }]);
const beam = (key: string, a: V3, b: V3, f: number, op = 0.8): FxSpec => ({ kind: "card", key: "bm" + key + (Math.floor(f) % 4), pos: lerp3(a, b, 0.5), w: Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), h: 0.16, rot: -Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2]) * Math.sign(b[0] - a[0] || 1)), soft: true, cw: 256, ch: 32, op,
  draw: (p) => { const g = p.g, gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, "rgba(255,200,60,0)"); gr.addColorStop(0.35, "rgba(255,210,90,0.7)"); gr.addColorStop(0.5, "rgba(255,248,200,1)"); gr.addColorStop(0.65, "rgba(255,210,90,0.7)"); gr.addColorStop(1, "rgba(255,200,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 32);
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(((i * 47 + f * 9) % 256), 16, 3, 0, Math.PI * 2); g.fill(); } } });
/** a fall about the feet: roll 0 -> dir*1.42 over [f0, f0+12] with a small bounce */
const fallRoll = (f: number, f0: number, dir = 1) => { if (f < f0) return 0; const u = (f - f0) / 12; if (u < 1) return dir * 1.42 * u * u; const v = f - f0 - 12; return dir * (1.42 - 0.08 * Math.exp(-v / 4) * Math.abs(Math.sin(v * 0.7))); };
const GROUND_HP = 1.72;   // health bar height above the feet (adults)

// ================================================= STORY SHOT 1 (0-427) THE BOSS CHAMBER
const PRIEST: V3 = [X1 - 1.0, 0, -4.1], KN1: V3 = [X1 - 0.8, 0, -1.3], KN2: V3 = [X1 + 1.2, 0, -1.0], GARY1: V3 = [X1 + 2.2, 0, 1.0], WOLF1: V3 = [X1 + 0.15, 0, -3.1];
const STONE1 = (): V3 => [GARY1[0] - 0.22, 1.22, GARY1[2] + 0.08];
const c1a = F((f) => { const k = sm(f, 66, 104); return { pos: [lerp(79.75, 80.35, k), lerp(1.6, 1.5, k), lerp(-0.6, 3.4, k)] as V3, look: [lerp(79.55, 80.1, k), lerp(1.45, 1.05, k), lerp(-5.0, -3.0, k)] as V3, fov: lerp(58, 60, k) }; }, 0, 0.0002, [[0, 0.004, 30], [150, 0.005, 12], [261, 0.004, 10]]);
const GARY_SH = { pos: [83.6, 1.5, 3.4] as V3, look: [80.9, 1.05, -1.4] as V3, fov: 62 };
const c1b = F(() => GARY_SH, 322, 0.0005, [[375, 0.003, 10]]);
SHOT_CAMS[1] = () => [K(0, c1a, 1, true), K(292, glideTo(c1a, 292, c1b, 322, 0.1, [0.6, 0, 0]), 1)];
KEY_PUNCH.push(152, 261);
SHOT_ACTS[1] = (f, s) => {
  const cast: CastPlace[] = [], fx: (FxSpec | null)[] = [];
  const ctl: Ctl = { mist: lin(f, 70, 112), runeF: sm(f, 234, 248) * (1 - sm(f, 300, 320)), rune: 1, mapRed: 0, qMap: 0, lever: 0, blink: 0, rewind: 0, curve: 0, qRing: 0 };
  // the Blood Priest: arms up over the orb (0-60), points the staffless claw at the knights (140), casts again (300)
  cast.push(C("priest", PRIEST, flow(f, [
    [0, { expr: "scheme", facing: 0.5, armR: [[22, -20], [30, -52]] as A2, armL: [[-22, -20], [-30, -52]] as A2, armRFront: true, armLFront: true }],
    [40, { expr: "mock", facing: 0.6, tilt: -4, armR: [[24, -26], [36, -60]] as A2, armL: [[-24, -26], [-36, -60]] as A2, armRFront: true, armLFront: true }, 14],
    [136, { expr: "rage", facing: 0.8, tilt: 6, armR: [[30, -6], [60, -14]] as A2, armL: [[-20, 14], [-28, 30]] as A2, armRFront: true }, 12],
    [176, { expr: "mock", facing: 0.8, tilt: 2, armR: [[26, 8], [40, 0]] as A2, armL: [[-20, 14], [-28, 30]] as A2, armRFront: true }, 12],
    [330, { expr: "rage", facing: 0.6, tilt: 8, armR: [[28, -4], [58, -18]] as A2, armL: [[-26, -4], [-50, -20]] as A2, armRFront: true, armLFront: true }, 6],
    [372, { expr: "dismay", facing: 0.6, tilt: -4, armR: [[22, 14], [30, 30]] as A2, armL: [[-22, 14], [-30, 30]] as A2 }, 12],
  ]), { idx: 1, scale: 1.25 }));
  // knights: guard stance, flinch when the sigil lands, knight 2 walks to the door and bumps the rune border, counts down
  const k2walk = walkPath(1, s, [KN2, [X1 + 0.95, 0, -0.2]], f, 226, 246);
  cast.push(C("knight1", KN1, flow(f, [
    [0, { expr: "determined", facing: 0.6, propR: "sword", armR: [[22, -10], [30, -34]] as A2, armRFront: true }],
    [170, { expr: "yikes", facing: 0.6, tilt: -8, propR: "sword", armR: [[22, -14], [32, -40]] as A2, armRFront: true, shake: 1, phase: f / 5 }, 3],
    [184, { expr: "pained", facing: 0.7, tilt: -3, propR: "sword", armR: [[22, -8], [30, -30]] as A2, armRFront: true }, 10],
  ]), { idx: 2 }));
  cast.push(C("knight2", k2walk.p, f >= 226 && k2walk.moving ? pose(null, { expr: "worry", mode: "walk", phase: k2walk.phase, facing: k2walk.facing, propR: "sword", armR: [[22, 4], [30, -18]] as A2, armRFront: true }) : flow(f, [
    [0, { expr: "determined", facing: -0.6, propR: "sword", armR: [[22, -10], [30, -34]] as A2, armRFront: true }],
    [200, { expr: "yikes", facing: -0.6, tilt: 8, propR: "sword", armR: [[22, -14], [32, -40]] as A2, armRFront: true }, 3],
    [212, { expr: "pained", facing: -0.6, tilt: 3, propR: "sword", armR: [[22, -8], [30, -30]] as A2, armRFront: true }, 10],
    [252, { expr: "shock", facing: 0.3, tilt: -6, propR: "sword", armR: [[22, -8], [30, -30]] as A2, armRFront: true }, 3],
    [262, { expr: "nervous", facing: 0.3, headBack: 0.3, look: 0.6, propR: "sword", armR: [[22, -8], [30, -30]] as A2, armRFront: true }, 10],
    [290, { expr: "relief", facing: 0.3, tilt: -2, propR: "sword", armR: [[22, 6], [28, 20]] as A2, armRFront: true }, 10],
  ]), { idx: 3 }));
  // Gary the hunter: bow drawn (296), the wolf lunges at the priest; sigil on the wolf (347); Gary lifts the pet stone
  // on its cord (361-375), the wolf shrinks into it (375-395); he pats it, smug (400-427)
  const garyArmL = armSeq(f, [[0, fixA([[-24, 0], [-44, -8]])], [361, (g) => armTo(1, s, g, GARY1, STONE1(), -1, -0.6), 12], [404, fixA([[-20, 4], [-12, -10]]), 12]]);
  const gary = C("garyH", GARY1, flow(f, [
    [0, { expr: "determined", facing: -0.7, propR: "bow", armR: [[24, 2], [40, -4]] as A2, armRFront: true }],
    [300, { expr: "grin", facing: -0.8, tilt: -4, propR: "bow", armR: [[26, -2], [46, -8]] as A2, armRFront: true }, 10],
    [349, { expr: "yikes", facing: -0.8, tilt: 6, propR: "bow", armR: [[22, 8], [32, 2]] as A2, armRFront: true }, 3],
    [361, { expr: "scheme", facing: -0.5, tilt: 0, propR: "bow", armR: [[22, 10], [30, 24]] as A2 }, 12],
    [398, { expr: "smug", facing: -0.4, tilt: -3, headTilt: 5, propR: "bow", armR: [[22, 10], [30, 24]] as A2 }, 12],
  ]), { idx: 4 });
  gary.o = { ...gary.o, armL: garyArmL, armLFront: true, propL: f >= 361 ? "petStone" : undefined, propK: f >= 375 && f < 400 ? 1 - lin(f, 380, 400) * 0.6 : 0.3 } as FigOpts;
  cast.push(gary);
  // the wolf: snarls at the priest, lunges (318-332), backs off cursed (349), then shrinks into the stone (375-395)
  const wIn = sm(f, 375, 395), wolfP: V3 = lerp3(f < 318 ? WOLF1 : lerp3(WOLF1, [X1 - 0.75, 0, -3.1], Math.sin(Math.PI * sm(f, 318, 346))), STONE1(), wIn);
  wolfP[1] = lerp(0, STONE1()[1] - 0.2, wIn);
  if (wIn < 0.98) cast.push(C("wolf", wolfP, { ...flow(f, [[0, { expr: "angry", facing: -0.8 }], [318, { expr: "angry", facing: -0.9, tilt: -10 }, 6], [349, { expr: "yikes", facing: 0.8, tilt: 8 }, 3], [362, { expr: "worry", facing: 0.8 }, 8]]), ...(f >= 316 && f < 348 ? { mode: "run", phase: (f - 316) / 8 } : {}) } as FigOpts, { idx: 5, scale: 1.25 * (1 - 0.92 * wIn) }));
  // the hook: the orb glows (0-66); "and it escaped": the red mist streams to the door (70-112)
  // "jumps from player to player": priest -> knight 1 (152-170) -> knight 2 (182-200) -> stays on knight 2
  fx.push(...hop("p1", head(PRIEST, 1.7), head(KN1, 1.75), f, 150, 170));
  fx.push(...hop("p2", head(KN1, 1.75), head(KN2, 1.75), f, 182, 200));
  if (f >= 170 && f < 186) fx.push(sigil("k1", head(KN1, 1.75), f, 0.28, 1 - lin(f, 180, 186)));
  const k2Head = (): V3 => head(k2walk.p, 1.75);
  if (f >= 200 && f < 292) fx.push(sigil("k2", k2Head(), f, 0.3, 1 - lin(f, 280, 292)));
  // "fade in ten seconds": a 10 bubble counting down fast over knight 2 (261-290)
  if (f >= 258 && f < 296) { const n = Math.max(0, 10 - Math.floor((f - 261) / 3)); fx.push(bubble("ten", String(f < 261 ? 10 : n), [k2Head()[0] - 0.5, k2Head()[1] - 0.05, k2Head()[2]], "#f4f0e2", 0.34)); }
  // health bars (the game reads in half a second)
  if (f >= 107 && f < 300) { fx.push(hpBar("k1", head(KN1, 1.98), f < 170 ? 1 : 1 - 0.3 * lin(f, 170, 200), f >= 170 && f < 186)); fx.push(hpBar("k2", [k2Head()[0], k2Head()[1] + 0.23, k2Head()[2]], f < 200 ? 1 : 1 - 0.3 * lin(f, 200, 260) + 0.3 * lin(f, 284, 296), f >= 200 && f < 290)); }
  // the wolf's curse: priest -> wolf (339-349), sigil rides the wolf into the stone
  fx.push(...hop("pw", head(PRIEST, 1.7), [wolfP[0], 0.9, wolfP[2]], f, 333, 349, 0.26));
  if (f >= 349 && wIn < 0.98) fx.push(sigil("wolf", [wolfP[0], wolfP[1] + 0.95 * (1 - 0.9 * wIn), wolfP[2]], f, 0.26 * (1 - 0.7 * wIn)));
  if (f >= 395) fx.push(sigil("stone", [STONE1()[0] + 0.02, STONE1()[1] - 0.06, STONE1()[2] + 0.06], f, 0.07));
  fx.push(...flash("stone", STONE1(), f - 392, 0.7));
  if (f >= 300 && wIn < 0.9) fx.push(hpBar("wolf", [wolfP[0], 1.05, wolfP[2]], f < 349 ? 1 : 1 - 0.45 * lin(f, 349, 375), f >= 349, false, 0.42));
  if (f >= 296) fx.push(tag("lvG", "HUNTER", head(GARY1, 1.98), "#3a5a2a", "#f2e6c8", 0.46));
  const focus = follow(f, [[0, PT.ORB], [70, [X1, 0.4, 2.0], 20], [104, head(KN1, 1.2), 30], [196, head(KN2, 1.2), 14], [300, head(GARY1, 1.1), 20], [360, STONE1(), 14]]);
  return { ctl, cast, fx: fx.filter(Boolean) as FxSpec[], focus, subj: f < 104 ? null : f < 196 ? "knight1" : f < 296 ? "knight2" : "garyH" };
};
lens3([[0, B_CU], [70, B_WS, 20], [300, B_MS, 16]]);

// ================================================= STORY SHOT 2 (427-500) THE OFFICE: the line nobody wrote
const DEV1A: V3 = [PT.OFFICE[0] - 1.9, 0, -1.75];
const c2 = F(() => ({ pos: [PT.OFFICE[0] - 1.7, 1.5, 0.3] as V3, look: [PT.OFFICE[0] - 1.5, 1.3, -2.4] as V3, fov: 56 }), 427, 0.0012, [[447, 0.006, 14]]);
SHOT_CAMS[2] = () => [K(427, c2, 1, true)];
SHOT_ACTS[2] = (f) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { mapRed: 0, qMap: 0, lever: 0, blink: 0, rewind: 0 };
  cast.push(C("dev1", DEV1A, flow(f, [
    [427, { expr: "neutral", facing: 0.3, propR: "scrollCode", armR: [[22, -2], [26, -26]] as A2, armRFront: true, armL: [[-20, 8], [-26, -4]] as A2 }],
    [445, { expr: "stare", facing: 0.3, tilt: 4, propR: "scrollCode", armR: [[22, -6], [24, -32]] as A2, armRFront: true, armL: [[-22, 0], [-10, -20]] as A2, armLFront: true }, 10],   // points at the blank line
    [468, { expr: "gulp", facing: 0.2, tilt: -2, headTilt: 6, propR: "scrollCode", armR: [[22, -2], [26, -26]] as A2, armRFront: true, armL: [[-20, -6], [-12, -30]] as A2, armLFront: true }, 10],   // scratches his head
  ]), { idx: 1 }));
  cast.push(C("dev2", [PT.OFFICE[0] + 1.6, 0, -1.9], flow(f, [[427, { expr: "bored", mode: "sit", facing: -0.4 }], [470, { expr: "sly", mode: "sit", facing: -0.6, headTilt: 4 }, 12]]), { idx: 2 }));
  return { ctl, cast, fx, focus: [DEV1A[0] + 0.25, 1.35, DEV1A[2] + 0.2], subj: "dev1" };
};
lens3([[427, B_MS]]);

// ================================================= STORY SHOT 3 (500-1372) THE CAPITAL
const GARY_M: V3 = [-2.7, 0, -3.5], ROLF: V3 = [-1.35, 0, -3.8], WOLF_M: V3 = [-2.0, 0, -3.25], STONE_M = (): V3 => [GARY_M[0] - 0.22, 1.22, GARY_M[2] + 0.08];
const CHAMP0: V3 = [3.3, 0, -3.5], CHAMP1: V3 = [0.55, 0, -4.7];
const CROWD: V3[] = [[2.0, 0, -5.4], [2.9, 0, -5.9], [3.8, 0, -5.5], [4.7, 0, -6.0], [5.6, 0, -5.6]];
const BOARD_P: V3 = [-10.5, 0, -8.3], CUST: V3 = [-4.15, 0, -6.75], HEALER0: V3 = [0.2, 0, -2.4], HEALER1: V3 = [-2.6, 0, -5.0], SICK: V3 = [-3.55, 0, -5.75], NEAR1: V3 = [-1.45, 0, -6.2], NEAR2: V3 = [-2.65, 0, -6.95];
const BRAM_P: V3 = [-4.85, 0, -7.45];
const NEWB1: V3 = [-25.4, 0, -0.75], NEWB2: V3 = [-25.4, 0, 0.6], PRANK0: V3 = [-20.7, 0, 1.3], TRAV0: V3 = [-35, 0, 0.2];
const CR_M = { pos: [-1.0, 6.2, 6.4] as V3, look: [-1.8, 1.2, -3.0] as V3, fov: 56 };
const GSH = { pos: [-2.15, 1.6, 0.5] as V3, look: [-1.95, 1.05, -3.8] as V3, fov: 64 };
const c3b = FS(() => GSH, 534, 0.0007, 0.002, [[690, 0.006, 12]]);
const CHSH = { pos: [2.1, 1.5, -1.1] as V3, look: [1.2, 1.15, -5.0] as V3, fov: 56 };
const c3c = FS(() => CHSH, 738, 0.0012, -0.0032, [[785, 0.006, 10]]);
const CR_M2 = { pos: [2.0, 6.4, 3.4] as V3, look: [1.2, 0.0, -4.4] as V3, fov: 58 };
const BSH = { pos: [-9.6, 1.6, -6.0] as V3, look: [-11.3, 1.55, -9.4] as V3, fov: 52 };
const c3e = FS(() => BSH, 892, 0.0012, 0.0032, [[901, 0.005, 10]]);
const BRSH = { pos: [-4.4, 1.65, -3.7] as V3, look: [-4.75, 1.15, -7.3] as V3, fov: 60 };
const c3f = FS(() => BRSH, 976, 0.0012, 0.0032, [[1021, 0.006, 8]]);
const HSH = { pos: [-1.6, 1.45, -1.7] as V3, look: [-3.3, 1.0, -5.6] as V3, fov: 58 };
const c3g = FS(() => HSH, 1116, 0.0012, -0.0032);
const GTSH = { pos: [-19.6, 1.55, 0.5] as V3, look: [-27.0, 1.2, 0.0] as V3, fov: 58 };
const c3h = FS(() => GTSH, 1222, 0.0012, 0.0032, [[1300, 0.004, 14]]);
SHOT_CAMS[3] = () => [K(500, F(() => CR_M, 500, 0.0006), 1, true),
  K(504, glideTo(F(() => CR_M, 500, 0.0006), 504, c3b, 534, 0, [0, 0, 0], 0.4), 1),     // crane down into the square to Gary
  K(706, glideTo(c3b, 706, c3c, 738, 0.1, [0.4, 0, 0]), 1),                              // slide to the champion
  K(800, glideTo(c3c, 800, () => CR_M2, 834, 0, [0, 0, 0], 0.5), 1),                    // crane up: the whole market drops
  K(866, glideTo(() => CR_M2, 866, c3e, 892, 0, [0, 0, 0], 0.4), 1),                    // down to the notice board map
  K(944, glideTo(c3e, 944, c3f, 976, 0.05), 1),                                          // to Bram's bread stall
  K(1086, glideTo(c3f, 1086, c3g, 1116, 0.05), 1),                                       // the healer rushes in
  K(1188, glideTo(c3g, 1188, c3h, 1220, 0.3, [0, 0, 1.0], 0, 0.75), 1)];                          // out along the gate street
KEY_PUNCH.push(548, 1161);
SHOT_ACTS[3] = (f, s) => {
  const cast: CastPlace[] = [], fx: (FxSpec | null)[] = [];
  const ctl: Ctl = { mapRed: sm(f, 878, 936), qMap: 0, lever: 0, blink: 0, rewind: 0, qRing: 0 };
  // ---------------- 500-860: Gary, the wolf, Rolf, the champion, the crowd ----------------
  if (f < 880) {
    const pop = sm(f, 552, 564);
    const garyArmL = armSeq(f, [[500, fixA([[-20, 10], [-28, 24]])], [528, (g) => armTo(3, s, g, GARY_M, [STONE_M()[0], STONE_M()[1] + 0.18, STONE_M()[2]], -1, 0.5), 12], [566, fixA([[-22, 4], [-38, -10]]), 10], [610, fixA([[-20, 10], [-28, 24]]), 14]]);
    const gary = C("garyH", GARY_M, flow(f, [
      [500, { expr: "smile", facing: 0.6, propR: "bow", armR: [[20, 10], [26, 26]] as A2 }],
      [530, { expr: "whistle", facing: 0.5, tilt: -3, propR: "bow", armR: [[20, 10], [26, 26]] as A2 }, 6],
      [552, { expr: "beam", facing: -0.3, tilt: 2, propR: "bow", armR: [[20, 10], [26, 26]] as A2 }, 8],
      [600, { expr: "smile", facing: 0.7, propR: "bow", armR: [[20, 10], [26, 26]] as A2 }, 12],
      [690, { expr: "shock", facing: 0.8, tilt: -8, propR: "bow", armR: [[22, -4], [30, -20]] as A2 }, 3],
      [702, { expr: "aghast", facing: 0.8, tilt: -4, propR: "bow", armR: [[22, -4], [30, -20]] as A2 }, 10],
    ]), { idx: 1 });
    gary.o = { ...gary.o, armL: garyArmL, armLFront: true, propL: f < 566 ? "petStone" : undefined, propK: f >= 540 && f < 556 ? 1 : 0.3 } as FigOpts;
    cast.push(gary);
    fx.push(...flash("crack", STONE_M(), f - 552, 1.0));
    // the wolf pops out of the stone (552-566), lands, wags, the sigil still on its head
    const wP: V3 = lerp3([STONE_M()[0], 0.9, STONE_M()[2]], WOLF_M, sm(f, 552, 568)); wP[1] = lerp(0.9, 0, sm(f, 552, 568)) + 0.25 * Math.sin(Math.PI * sm(f, 552, 568));
    if (f >= 552) cast.push(C("wolf", wP, flow(f, [[552, { expr: "joy", facing: 0.8 }], [580, { expr: "grin", facing: 0.6, tilt: 3 * Math.sin(f * 0.6) }, 6]]), { idx: 2, scale: 1.05 * (0.2 + 0.8 * pop) }));
    if (f >= 556) fx.push(sigil("wolfM", [wP[0], wP[1] + 0.95, wP[2]], f, 0.26, f < 640 ? 1 : 1 - lin(f, 650, 656) * 0));
    // Rolf: laughs (590-608), waves it off "Relax..." (608-652), the sigil hops wolf -> Rolf (640-656), bar drains (672-698), falls (694)
    const rolfRoll = fallRoll(f, 694, 1);
    cast.push(C("rolf", ROLF, flow(f, [
      [500, { expr: "smile", facing: -0.6, propR: "axe", armR: [[20, 6], [28, -14]] as A2, armRFront: true }],
      [586, { expr: "guffaw", facing: -0.7, tilt: -6, headBack: 0.4, propR: "axe", armR: [[20, 6], [28, -14]] as A2, armRFront: true, armL: [[-20, 10], [-10, 18]] as A2 }, 6],
      [608, { expr: "talk", facing: -0.7, tilt: 2, propR: "axe", armR: [[20, 6], [28, -14]] as A2, armRFront: true, armL: [[-24, -2], [-44, -16]] as A2, armLFront: true }, 10],
      [630, { expr: "smug", facing: -0.7, tilt: 3, propR: "axe", armR: [[20, 6], [28, -14]] as A2, armRFront: true, armL: [[-24, 2], [-42, -6]] as A2, armLFront: true }, 10],
      [658, { expr: "green", facing: -0.4, tilt: 4, propR: "axe", armR: [[20, 10], [26, 4]] as A2, armRFront: true, armL: [[-20, 8], [-6, -8]] as A2, armLFront: true }, 6],
      [690, { expr: "dead", facing: -0.2, tilt: 0, propR: "axe", armR: [[22, -10], [36, -24]] as A2, armRFront: true, armL: [[-22, -10], [-36, -24]] as A2 }, 4],
    ]), { idx: 3, roll: rolfRoll }));
    fx.push(...hop("wr", [wP[0], wP[1] + 0.95, wP[2]], head(ROLF, 1.75), f, 640, 656));
    if (f >= 656 && f < 694) fx.push(sigil("rolf", head(ROLF, 1.75), f, 0.3));
    if (f >= 580 && f < 712) fx.push(hpBar("rolf", head(ROLF, GROUND_HP + 0.1), f < 672 ? (f < 656 ? 1 : 0.92) : 0.92 * (1 - lin(f, 672, 698)), f >= 656));
    if (f >= 712 && f < 790) fx.push(...wordCard("ko", "K.O.", [ROLF[0] - 0.75, 0.55, ROLF[2] + 0.1], f - 712, 70, "#f2e6c8", 0.4));
    // the champion strides in (719-745) with a LV 60 tag; the sigil hops to him from Rolf (745-757); bar drains next to a
    // 30 s sand timer (757-785); he staggers (775) and topples (785)
    const ch = walkPath(3, s, [CHAMP0, CHAMP1], f, 704, 740);
    const champ = C("champ", ch.p, f < 740 && ch.moving ? pose(null, { expr: "proud", mode: "walk", phase: ch.phase, facing: ch.facing, propR: "sword", armR: [[22, -12], [30, -40]] as A2, armRFront: true }) : flow(f, [
      [740, { expr: "proud", facing: -0.6, headBack: 0.3, propR: "sword", armR: [[24, -20], [30, -56]] as A2, armRFront: true }],
      [758, { expr: "shock", facing: -0.6, tilt: -6, propR: "sword", armR: [[24, -20], [30, -56]] as A2, armRFront: true }, 3],
      [768, { expr: "green", facing: -0.4, tilt: 3, propR: "sword", armR: [[22, 0], [30, -20]] as A2, armRFront: true }, 10],
      [776, { expr: "dizzy", mode: "stagger", facing: -0.3, tilt: 6, propR: "sword", armR: [[22, 10], [30, 26]] as A2 }, 6],
      [786, { expr: "dead", facing: -0.2, armR: [[22, -10], [36, -24]] as A2, armL: [[-22, -10], [-36, -24]] as A2 }, 4],
    ]), { idx: 4, roll: fallRoll(f, 786, 1) });
    if (f >= 700) cast.push(champ);
    if (f >= 719 && f < 800) { fx.push(tag("lv60", "LV 60", head(ch.p, 2.12), "#5a3a1a", "#f2c94c", 0.5)); fx.push(hpBar("champ", head(ch.p, 1.94), f < 757 ? 1 : 1 - lin(f, 757, 788), f >= 757)); }
    fx.push(...hop("rc", head(ROLF, 0.5), head(CHAMP1, 1.8), f, 742, 757));
    if (f >= 757 && f < 788) { fx.push(sigil("champ", head(CHAMP1, 1.8), f, 0.3)); const n = Math.max(0, 30 - Math.floor((f - 757) / 0.95)); fx.push(bubble("thirty", String(n) + "s", [CHAMP1[0] + 0.62, 1.55, CHAMP1[2]], "#f4f0e2", 0.4)); }
    // the crowd at the fruit stall: domino drop (803-830), then the whole market from above
    CROWD.forEach((p, i) => { const who = ["ptown1", "ptown2", "ptown3", "ptown4", "fruitwife"][i], t0 = 806 + i * 5;
      cast.push(C(who, p, flow(f, [[500, { expr: "neutral", facing: i % 2 ? 0.5 : -0.5, tilt: 2 * Math.sin(f * 0.05 + i) }], [700, { expr: "worry", facing: -0.6 }, 10], [t0 - 4, { expr: "green", facing: -0.4, tilt: 5 }, 3], [t0 + 2, { expr: "dead", facing: -0.2 }, 3]]), { idx: 10 + i, roll: fallRoll(f, t0, i % 2 ? -1 : 1) }));
      if (f >= 796 && f < 870) fx.push(sigil("cr" + i, head(p, f >= t0 + 12 ? 0.35 : 1.75), f, 0.24, f < t0 - 4 ? lin(f, 796 + i * 3, 802 + i * 3) : 1)); });
    // more fallen folk around the square for the crane shot (all with sigils)
    if (f >= 830) for (const [i, p] of ([[-5.0, 0, 3.0], [4.2, 0, 4.4], [-1.0, 0, 5.6], [6.0, 0, -1.5], [-6.5, 0, -2.0], [1.6, 0, -2.2]] as V3[]).entries()) { cast.push(C(["town1", "town2", "town3", "town4", "ptown1", "ptown3"][i], p, pose(null, { expr: "dead", facing: 0.3 }), { idx: 20 + i, roll: 1.42 * (i % 2 ? 1 : -1) })); fx.push(sigil("fl" + i, [p[0], 0.4, p[2]], f, 0.3)); }
  }
  // ---------------- 862-944: the notice board map turns red ----------------
  if (f >= 862 && f < 950) cast.push(C("potioner", BOARD_P, flow(f, [[862, { expr: "worry", facing: -0.4, look: -0.5 }], [900, { expr: "aghast", facing: -0.3, tilt: -4, headBack: 0.3, armR: [[22, -10], [42, -28]] as A2, armRFront: true }, 10], [928, { expr: "shock", facing: 0.6, tilt: -8, armR: [[22, -10], [16, -40]] as A2, armRFront: true, armL: [[-22, -10], [-16, -40]] as A2, armLFront: true }, 4]]), { idx: 30 }));
  if (f >= 880 && f < 945) fx.push(bubble("tenB", "10", [PT.BOARD[0] + 1.45, PT.BOARD[1] + 0.75, PT.BOARD[2] + 0.2], "#f4f0e2", 0.42));
  // ---------------- 944-1090: Bram, sick, can't die, sells bread ----------------
  if (f >= 930 && f < 1200) {
    const sneeze = f >= 1014 && f < 1030;
    const giveT: V3 = [-4.5, 1.12, -7.1];
    const bramArm = armSeq(f, [[930, fixA([[22, 8], [36, 2]])], [1056, (g) => armTo(3, s, g, BRAM_P, lerp3([-4.7, 1.15, -7.2], giveT, sm(g, 1056, 1070)), -1, 0.4), 12], [1082, fixA([[22, 14], [30, 30]]), 12]]);
    const bram = C("bram", BRAM_P, flow(f, [
      [930, { expr: "green", facing: 0.2, tilt: 2 }],
      [1010, { expr: "pained", facing: 0.2, tilt: -10, headBack: 0.5 }, 6],
      [1020, { expr: "pained", facing: 0.2, tilt: 12, headBack: 0, shake: 1, phase: f / 3 }, 3],
      [1030, { expr: "green", facing: 0.3, tilt: 2 }, 8],
      [1060, { expr: "fakegrin", facing: 0.4, tilt: 4 }, 10],
    ]), { idx: 31 });
    bram.o = { ...bram.o, armL: bramArm, armLFront: true, propL: f < 1074 ? "bread" : undefined } as FigOpts;
    cast.push(bram);
    if (sneeze) fx.push(...titleCard("achoo", "ACHOO!", [BRAM_P[0] - 0.6, 1.85, BRAM_P[2] + 0.3], f - 1014, 16, "#9ad870", 0.75));
    fx.push(sigil("bram", head(BRAM_P, 1.8), f, 0.3)); fx.push(hpBar("bram", head(BRAM_P, 2.02), 0.35 + 0.05 * Math.sin(f * 0.2), true, true));
    // the customer reaches (1062), grips the loaf (1074), carries it to her chest; the sigil hops onto her (1076-1090)
    const custArm = armSeq(f, [[930, fixA([[22, 10], [30, 24]])], [1060, (g) => armTo(3, s, g, CUST, giveT, 1, -0.3), 12], [1074, (g) => armTo(3, s, g, CUST, lerp3(giveT, [CUST[0] + 0.12, 1.1, CUST[2] + 0.12], sm(g, 1074, 1088)), 1, -0.3), 2]]);
    const cust = C("town2", CUST, flow(f, [[930, { expr: "neutral", facing: -0.3 }], [1040, { expr: "smile", facing: -0.4 }, 10], [1088, { expr: "yikes", facing: -0.2, tilt: -5 }, 3], [1100, { expr: "green", facing: -0.2 }, 10]]), { idx: 32 });
    cust.o = { ...cust.o, armR: custArm, armRFront: true, propR: f >= 1074 ? "bread" : undefined } as FigOpts;
    cast.push(cust);
    fx.push(...hop("bc", head(BRAM_P, 1.8), head(CUST, 1.75), f, 1074, 1088));
    if (f >= 1088) fx.push(sigil("cust", head(CUST, 1.75), f, 0.28));
  }
  // ---------------- 1086-1190: the healer keeps the sick alive, who infects two more ----------------
  if (f >= 1060 && f < 1200) {
    const hw = walkPath(3, s, [HEALER0, HEALER1], f, 1094, 1112);
    const healer = C("healer", hw.p, f < 1112 && hw.moving ? pose(null, { expr: "determined", mode: "run", phase: hw.phase, facing: hw.facing, propR: "staff", armR: [[22, 6], [30, -14]] as A2, armRFront: true }) : flow(f, [
      [1112, { expr: "determined", facing: -0.6, propR: "staff", armR: [[22, 6], [30, -14]] as A2, armRFront: true }],
      [1120, { expr: "glow", facing: -0.6, tilt: -4, propR: "staff", armR: [[24, -20], [32, -50]] as A2, armRFront: true }, 10],
      [1162, { expr: "proud", facing: -0.5, tilt: 0, propR: "staff", armR: [[22, 4], [30, -16]] as A2, armRFront: true }, 12],
      [1172, { expr: "shock", facing: -0.4, tilt: -6, propR: "staff", armR: [[22, 4], [30, -16]] as A2, armRFront: true }, 3],
    ]), { idx: 33 });
    healer.o = { ...healer.o, propK: f >= 1122 && f < 1160 ? 1 : 0 } as FigOpts;
    cast.push(healer);
    const up = sm(f, 1146, 1160);
    cast.push(C("ptown3", SICK, flow(f, [[1060, { expr: "green", mode: "sit", facing: 0.5, tilt: 10 }], [1130, { expr: "relief", mode: "sit", facing: 0.5, tilt: 4 }, 12], [1146, { expr: "smile", facing: 0.5, tilt: 0 }, 12], [1162, { expr: "sly", facing: 0.6, armR: [[24, -6], [46, -12]] as A2, armRFront: true, armL: [[-24, -6], [-46, -12]] as A2, armLFront: true }, 8]]), { idx: 34 }));
    if (f >= 1060) { fx.push(hpBar("sick", head(SICK, up > 0.5 ? 2.0 : 1.4), f < 1124 ? 0.12 : Math.min(1, 0.12 + 0.88 * lin(f, 1124, 1150)), true)); fx.push(sigil("sick", head(SICK, up > 0.5 ? 1.8 : 1.2), f, 0.28)); }
    if (f >= 1124 && f < 1158) { const top: V3 = [hw.p[0] + 0.25, 2.25, hw.p[2] + 0.05]; fx.push(beam("heal", top, head(SICK, 1.1), f, 0.85)); }
    // the two nearby townsfolk catch it as he stands (1161-1176)
    for (const [i, p] of ([NEAR1, NEAR2] as V3[]).entries()) { if (f < 1086) continue; cast.push(C(i ? "town4" : "town1", p, flow(f, [[1060, { expr: "worry", facing: i ? -0.5 : 0.5 }], [1170 + i * 4, { expr: "yikes", facing: i ? -0.5 : 0.5, tilt: i ? 6 : -6 }, 3], [1182 + i * 4, { expr: "green", facing: i ? -0.5 : 0.5 }, 8]]), { idx: 35 + i }));
      fx.push(...hop("n" + i, head(SICK, 1.8), head(p, 1.75), f, 1161 + i * 4, 1173 + i * 4)); if (f >= 1173 + i * 4) fx.push(sigil("nn" + i, head(p, 1.75), f, 0.26)); }
  }
  // ---------------- 1186-1372: the gate: runners to the woods, the new players' sign, the prankster ----------------
  if (f >= 1150) {
    for (const [i, who] of (["town3", "ptown4"] as string[]).entries()) { const r = walkPath(3, s, [[-9.5 - i * 0.9, 0, -0.1 + i * 0.25], [-29 - i, 0, -0.05 + i * 0.2], [-37 - i, 0, -1.8 - i * 0.6]], f, 1184 + i * 4, 1250 + i * 4);
      if (f < 1262) cast.push(C(who, r.p, pose(null, { expr: "aghast", mode: r.moving ? "run" : "walk", phase: r.phase, facing: r.facing, armR: [[22, -4], [36, -18]] as A2, armL: [[-22, -4], [-36, -18]] as A2, armRFront: true }), { idx: 40 + i })); }
    cast.push(C("newbie1", NEWB1, flow(f, [[1150, { expr: "worry", facing: 0.6, propR: "signBack", armR: [[22, -6], [26, -30]] as A2, armRFront: true }], [1240, { expr: "angry", facing: -0.5, tilt: -4 * Math.sin(f * 0.4), propR: "signBack", armR: [[22, -14], [26, -42]] as A2, armRFront: true }, 8]]), { idx: 42 }));
    cast.push(C("newbie2", NEWB2, flow(f, [[1150, { expr: "worry", facing: -0.6 }], [1250, { expr: "yikes", facing: -0.7, armR: [[24, -18], [30 + 10 * Math.sin(f * 0.5), -44]] as A2, armRFront: true, armL: [[-24, -18], [-30 - 10 * Math.sin(f * 0.5), -44]] as A2, armLFront: true }, 6]]), { idx: 43 }));
    if (f >= 1222) { fx.push(tag("nb1", "LV 1", head(NEWB1, 1.48), "#3a4a3a", "#f2e6c8", 0.36)); fx.push(tag("nb2", "LV 2", head(NEWB2, 1.48), "#3a4a3a", "#f2e6c8", 0.36)); }
    // a traveller walks toward the gate, reads the sign, turns back (1262-1294)
    const tw = f < 1276 ? walkPath(3, s, [[-34, 0, 1.9], [-28.6, 0, 0.1]], f, 1250, 1276) : walkPath(3, s, [[-28.6, 0, 0.1], [-36, 0, 0.6]], f, 1284, 1330);
    cast.push(C("knight1", tw.p, tw.moving ? pose(null, { expr: f < 1276 ? "smile" : "yikes", mode: "walk", phase: tw.phase, facing: tw.facing }) : flow(f, [[1276, { expr: "stare", facing: 0.8 }], [1279, { expr: "shock", facing: 0.8, tilt: -6 }, 3]]), { idx: 44 }));
    // the prankster: sigil on purpose (1300), grins, sprints arms out into the queue by the gate houses (1334-1354)
    const pr = walkPath(3, s, [PRANK0, [-23.5, 0, 1.2]], f, 1326, 1352);
    cast.push(C("prank", pr.p, pr.moving ? pose(null, { expr: "scheme", mode: "run", phase: pr.phase, facing: pr.facing, armR: [[26, -10], [52, -18]] as A2, armL: [[-26, -10], [-52, -18]] as A2, armRFront: true, armLFront: true }) : flow(f, [[1150, { expr: "sly", facing: -0.6 }], [1302, { expr: "scheme", facing: -0.6, headTilt: 6, armR: [[20, -8], [12, -34]] as A2, armRFront: true }, 6], [1350, { expr: "laugh", facing: -0.6, armR: [[26, -10], [52, -18]] as A2, armL: [[-26, -10], [-52, -18]] as A2, armRFront: true, armLFront: true }, 6]]), { idx: 45 }));
    if (f >= 1298) fx.push(sigil("prank", head(pr.p, 1.85), f, 0.3, lin(f, 1298, 1306)));
    for (const [i, p] of ([[-24.3, 0, 1.45], [-24.8, 0, 1.0], [-24.0, 0, 1.9]] as V3[]).entries()) { const sc = sm(f, 1346 + i * 2, 1358 + i * 2), dv = [[-1.2, 0.8], [-0.7, -1.2], [0.5, 1.1]][i], q: V3 = [p[0] + dv[0] * sc, 0, p[2] + dv[1] * sc];
      cast.push(C(["fruitwife", "town2", "dev2"][i] === "dev2" ? "ptown2" : ["fruitwife", "town2", "ptown2"][i], q, flow(f, [[1150, { expr: "neutral", facing: -0.5 }], [1346 + i * 2, { expr: "aghast", facing: 0.6, tilt: -8, armR: [[22, -14], [16, -42]] as A2, armRFront: true }, 3]]), { idx: 46 + i }));
      if (f >= 1356 + i * 2) fx.push(sigil("q" + i, head(q, 1.75), f, 0.24, lin(f, 1356 + i * 2, 1362 + i * 2))); }
  }
  for (const [i, w] of (['town4', 'ptown2', 'fruitwife'] as string[]).entries()) { if (f > 800 && f < 940) continue; const zz = [-6.0, -5.8, 5.6][i]; cast.push(stroll(3, s, w, [[-12 + i * 3, 0, zz], [12 - i * 2, 0, zz + 0.2]], 0.022 + 0.004 * i, 500 + i * 40, f, { expr: 'smile' }, {}, { idx: 60 + i })); }
  const focus = follow(f, [[500, head(GARY_M, 1.1)], [552, STONE_M(), 8], [580, head(ROLF, 1.2), 12], [716, head(CHAMP1, 1.2), 24], [800, [2.0, 0.6, -5.0], 20], [862, PT.BOARD, 30], [944, head(BRAM_P, 1.2), 30], [1086, head(SICK, 1.0), 26], [1186, [-25.4, 1.2, 0], 30], [1300, [-23.4, 1.2, 1.1], 20]]);
  const subj = f < 580 ? "garyH" : f < 716 ? "rolf" : f < 800 ? "champ" : f < 862 ? null : f < 944 ? "potioner" : f < 1086 ? "bram" : f < 1186 ? "healer" : f < 1296 ? "newbie1" : "prank";
  return { ctl, cast, fx: fx.filter(Boolean) as FxSpec[], focus, subj };
};
lens3([[500, B_WS], [534, B_MS, 12], [800, B_WS, 12], [898, B_MS, 12], [1186, B_WS, 14], [1222, B_MS, 14]]);

// ================================================= STORY SHOT 4 (1372-1642) THE OFFICE: quarantine, restart, rewind
const DEV2M: V3 = [PT.OFFICE[0] - 2.25, 0, -3.3], DEV1R: V3 = [PT.RACK[0] - 0.75, 0, -3.55], DEV1W: V3 = [PT.OFFICE[0] - 0.5, 0, -4.05];
const MONSH = { pos: [PT.OFFICE[0] - 1.5, 1.5, -0.8] as V3, look: [PT.OFFICE[0] - 1.75, 1.32, -4.9] as V3, fov: 58 };
const c4a = FS(() => MONSH, 1372, 0.0009, 0.0015, [[1394, 0.005, 10]]);
const RACKSH = { pos: [PT.RACK[0] - 0.6, 1.5, -0.9] as V3, look: [PT.RACK[0] + 0.55, 1.35, -4.4] as V3, fov: 58 };
const c4b = F(() => RACKSH, 1478, 0.0012, [[1465, 0.006, 8]]);
const MON2 = { pos: [PT.OFFICE[0] - 0.45, 1.5, -0.2] as V3, look: [PT.OFFICE[0] - 0.7, 1.6, -4.9] as V3, fov: 60 };
const c4c = FS(() => MON2, 1518, 0.0009, -0.0012, [[1553, 0.005, 10], [1600, 0.005, 10]]);
SHOT_CAMS[4] = () => [K(1372, c4a, 1, true), K(1450, glideTo(c4a, 1450, c4b, 1478, 0.05), 1), K(1490, glideTo(c4b, 1490, c4c, 1518, 0.05), 1)];
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const back = sm(f, 1498, 1512), rew = sm(f, 1553, 1590);
  const ctl: Ctl = { mapRed: f < 1460 ? 0.4 : f < 1478 ? 0.8 : f < 1498 ? 0.8 * (1 - sm(f, 1478, 1486)) : 0.8 * back * (1 - rew), qMap: f < 1460 ? sm(f, 1390, 1410) : 0, lever: sm(f, 1465, 1473) * (1 - sm(f, 1488, 1500)), blink: f >= 1474 && f < 1496 ? 1 : 0, rewind: -2.5 * rew };
  // dev2 points at the ring on the map (1394), groans as the dots walk around it (1430-1450); later spins the dial (1550-1590)
  const d2 = f < 1520 ? DEV2M : lerp3(DEV2M, [PT.DIAL[0] - 0.75, 0, -3.95], sm(f, 1520, 1540));
  const d2w = f >= 1520 && f < 1540;
  const dev2Arm = armSeq(f, [[1372, fixA([[22, 8], [30, 22]])], [1392, fixA([[26, -12], [52, -24]]), 10], [1440, fixA([[20, -10], [10, -36]]), 8], [1470, fixA([[22, 8], [30, 22]]), 12],
    [1542, (g) => { const a = Math.PI / 2 + 2.5 * Math.PI * 2 * sm(g, 1553, 1590); return armTo(4, s, g, d2, [PT.DIAL[0] + 0.32 * Math.cos(a), PT.DIAL[1] + 0.32 * Math.sin(a), PT.DIAL[2] + 0.12], 1, 0.4); }, 12], [1596, fixA([[22, 8], [30, 22]]), 12]]);
  const dev2 = C("dev2", d2, d2w ? pose(null, { expr: "determined", mode: "walk", phase: (f - 1520) / 14, facing: 1 }) : flow(f, [
    [1372, { expr: "worry", facing: 0.4 }], [1392, { expr: "determined", facing: 0.6, tilt: -3 }, 8], [1432, { expr: "dismay", facing: -0.3, headTilt: 6 }, 10],
    [1542, { expr: "determined", facing: 0.6, tilt: -4 }, 10], [1592, { expr: "proud", facing: 0.2 }, 12]]), { idx: 1 });
  dev2.o = { ...dev2.o, armR: dev2Arm, armRFront: true } as FigOpts;
  cast.push(dev2);
  // dev1 yanks RESTART (1462-1474), cheers (1478), then gasps as the red comes back (1504); writes the missing line (1600-1630)
  const d1 = f < 1530 ? DEV1R : lerp3(DEV1R, DEV1W, sm(f, 1530, 1560));
  const leverT: V3 = [PT.RACK[0] + 0.62, 1.3 + 0.7 * Math.cos(1.1 * sm(f, 1465, 1473) * (1 - sm(f, 1488, 1500))), PT.RACK[2] + 0.2 + 0.7 * Math.sin(1.1 * sm(f, 1465, 1473) * (1 - sm(f, 1488, 1500)))];
  const dev1Arm = armSeq(f, [[1372, fixA([[22, 8], [30, 22]])], [1450, (g) => armTo(4, s, g, d1, leverT, 1, 0.6), 12], [1476, fixA([[24, -20], [30, -52]]), 6], [1500, fixA([[22, -4], [14, -30]]), 4], [1532, fixA([[22, 8], [30, 22]]), 12],
    [1598, fixA([[22, -2], [26, -26]]), 10]]);
  const dev1L = armSeq(f, [[1372, fixA([[-22, 8], [-30, 22]])], [1600, (g) => fixA([[-22, 0], [-30 + 8 * Math.sin(g * 0.9), -16 + 4 * Math.cos(g * 1.3)]])(g), 10], [1632, fixA([[-24, -14], [-34, -40]]), 8]]);
  const dev1 = C("dev1", d1, f >= 1530 && f < 1560 ? pose(null, { expr: "neutral", mode: "walk", phase: (f - 1530) / 14, facing: -1 }) : flow(f, [
    [1372, { expr: "neutral", facing: -0.4 }], [1462, { expr: "determined", facing: 0.7, tilt: 6 }, 8], [1476, { expr: "joy", facing: -0.4, tilt: -4 }, 6], [1504, { expr: "shock", facing: -0.6, tilt: -8, headBack: 0.4 }, 3],
    [1514, { expr: "aghast", facing: -0.6 }, 10], [1598, { expr: "eureka", facing: 0.3 }, 10], [1626, { expr: "beam", facing: 0.2, tilt: -3 }, 10]]), { idx: 2 });
  dev1.o = { ...dev1.o, armR: dev1Arm, armRFront: true, armL: dev1L, armLFront: true, propR: f >= 1598 ? "scrollCode" : undefined, propK: f >= 1610 ? 1 : 0, propL: f >= 1598 ? "pen" : undefined } as FigOpts;
  cast.push(dev1);
  if (f >= 1610) fx.push(tag("immO", "PETS: IMMUNE", [d1[0] + 0.2, 1.9, d1[2] + 0.3], "#2a5a2a", "#c8f8b0", 0.5));
  const focus = follow(f, [[1372, [PT.OFFICE[0] - 1.4, 1.42, -4.9]], [1450, [PT.RACK[0], 1.4, -4.2], 20], [1490, [PT.OFFICE[0] - 0.9, 1.6, -4.9], 20], [1598, head(DEV1W, 1.2), 12]]);
  return { ctl, cast, fx, focus, subj: f < 1450 ? "dev2" : f < 1540 ? "dev1" : f < 1596 ? "dev2" : "dev1" };
};
lens3([[1372, B_MS]]);

// ================================================= STORY SHOT 5 (1642-1833) THE STUDY: two years later
const SCI1: V3 = [PT.STUDY[0] - 0.6, 0, -3.25], SCI2: V3 = [PT.STUDY[0] + 0.6, 0, -2.7];
const c5 = FS(() => ({ pos: [PT.STUDY[0] + 0.0, 1.85, -0.3] as V3, look: [PT.STUDY[0] + 0.0, 1.45, -3.9] as V3, fov: 64 }), 1642, 0.0003, 0.0010, [[1709, 0.004, 12], [1786, 0.004, 10]]);
SHOT_CAMS[5] = () => [K(1642, c5, 1, true)];
SHOT_ACTS[5] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const cu = sm(f, 1672, 1770);
  const ctl: Ctl = { curve: cu, mapRed: 1 };
  // the chalk tip follows the curve as it is drawn (board plane z -3.9; the curve spans x -0.95..0.95, y 1.0..2.2)
  const tx = PT.STUDY[0] - 1.05 + 2.2 * cu, ty = 1.02 + 1.0 * Math.exp(-Math.pow((cu - 0.45) / 0.16, 2));
  const chalkArm = armSeq(f, [[1642, fixA([[-22, 8], [-30, 22]])], [1668, (g) => { const u = sm(g, 1672, 1770); return armTo(5, s, g, SCI1, [PT.STUDY[0] - 1.05 + 2.2 * u, 1.02 + 1.0 * Math.exp(-Math.pow((u - 0.45) / 0.16, 2)), -3.82], -1, 0.6); }, 10],
    [1776, fixA([[-24, -8], [-48, -18]]), 10]]);
  const sci1 = C("sci1", f < 1776 ? SCI1 : lerp3(SCI1, [SCI1[0] + 0.25, 0, SCI1[2] + 0.2], sm(f, 1776, 1790)), f >= 1776 && f < 1790 ? pose(null, { expr: "eureka", mode: "walk", phase: (f - 1776) / 12, facing: 0.6 }) : flow(f, [
    [1642, { expr: "stare", facing: -0.6 }], [1668, { expr: "determined", facing: -0.9, tilt: 2 }, 10], [1748, { expr: "eureka", facing: -0.7 }, 8], [1786, { expr: "proud", facing: 0.4 }, 12],
    [1806, { expr: "joy", facing: 0.5, headBack: 0.3 }, 8]]), { idx: 1 });
  sci1.o = { ...sci1.o, armL: chalkArm, armLFront: true, propL: f < 1776 ? "chalk" : undefined } as FigOpts;
  cast.push(sci1);
  void tx; void ty;
  // sci2 opens the journal (1690-1705), holds it up to the camera (1709-1740), taps the wolf on the cover (1748)
  const sci2 = C("sci2", SCI2, flow(f, [
    [1642, { expr: "neutral", facing: -0.4, propR: "journal", armR: [[22, 10], [26, 26]] as A2, armRFront: true }],
    [1700, { expr: "smile", facing: 0.3, propR: "journal", armR: [[24, -6], [30, -28]] as A2, armRFront: true }, 12],
    [1744, { expr: "eureka", facing: 0.3, propR: "journal", armR: [[24, -6], [30, -28]] as A2, armRFront: true, armL: [[-22, -2], [6, -18]] as A2, armLFront: true }, 8],
    [1786, { expr: "beam", facing: -0.3, propR: "journal", armR: [[22, 6], [28, -8]] as A2, armRFront: true }, 12],
  ]), { idx: 2 });
  cast.push(sci2);
  if (f >= 1642 && f < 1676) fx.push(...titleCard("2y", "2 YEARS LATER", [PT.STUDY[0] + 0.0, 2.05, -3.6], f - 1642, 40, "#f4f0e2", 1.2));
  const focus = follow(f, [[1642, head(SCI1, 1.0)], [1700, head(SCI2, 1.0), 14], [1760, [PT.STUDY[0], 1.6, -3.9], 14]]);
  return { ctl, cast, fx, focus, subj: f < 1700 ? "sci1" : f < 1760 ? "sci2" : "sci1" };
};
lens3([[1642, B_MS]]);

// ================================================= STORY SHOT 6 (1833-1920) THE SQUARE: all because of one sick pet
const GARY_E: V3 = [-2.5, 0, -3.4], WOLF_E: V3 = [-1.65, 0, -3.15];
const c6 = F(() => ({ pos: [-2.0, 1.25, -0.4] as V3, look: [-2.1, 0.95, -3.4] as V3, fov: 56 }), 1833, 0.0008, [[1886, 0.006, 10]]);
SHOT_CAMS[6] = () => [K(1833, c6, 1, true)];
SHOT_ACTS[6] = (f, s) => {
  const cast: CastPlace[] = [], fx: FxSpec[] = [];
  const ctl: Ctl = { mapRed: 0, qRing: 0 };
  cast.push(C("garyH", GARY_E, flow(f, [
    [1833, { expr: "smile_closed", facing: 0.7, tilt: 10, headTilt: 8, propR: "bow", armL: [[-6, 18], [30, 34]] as A2, armLFront: true }],
    [1860, { expr: "beam", facing: 0.7, tilt: 8, headTilt: 4, propR: "bow", armL: [[-4, 18], [34, 36]] as A2, armLFront: true }, 12],
    [1897, { expr: "yikes", facing: 0.7, tilt: -4, headBack: 0.4, propR: "bow", armL: [[-4, 14], [28, 22]] as A2, armLFront: true }, 3],
  ]), { idx: 1 }));
  cast.push(C("wolf", WOLF_E, flow(f, [[1833, { expr: "joy", facing: -0.7, tilt: 2 * Math.sin(f * 0.5) }], [1888, { expr: "pained", facing: -0.7, tilt: -8 }, 3], [1895, { expr: "yikes", facing: -0.7, tilt: 10 }, 3], [1904, { expr: "grin", facing: -0.7 }, 8]]), { idx: 2, scale: 1.25 }));
  fx.push(tag("imm", "IMMUNE", [WOLF_E[0] + 0.05, 1.32, WOLF_E[2] + 0.05], "#c8a03a", "#2a1a10", 0.46));
  // the sneeze on "pet": one tiny red sigil pops out and floats up (loops into the hook's orb)
  if (f >= 1894) { const u = lin(f, 1894, 1920); fx.push(sigil("sneeze", [WOLF_E[0] - 0.25 - 0.2 * u, 0.85 + 0.6 * u, WOLF_E[2] + 0.2], f, 0.12 + 0.06 * u)); }
  if (f >= 1893 && f < 1910) fx.push(...titleCard("ah", "ACHOO", [WOLF_E[0] + 0.55, 1.15, WOLF_E[2] + 0.25], f - 1893, 17, "#f2e6c8", 0.55));
  // townsfolk stroll in the background (healthy, the market is back)
  cast.push(stroll(6, s, "ptown1", [[-6, 0, -5.6], [2, 0, -5.8]], 0.03, 1833, f, { expr: "smile" }));
  cast.push(stroll(6, s, "fruitwife", [[1.0, 0, -7.6], [-4, 0, -7.0]], 0.025, 1833, f, { expr: "smile" }));
  return { ctl, cast, fx, focus: [-2.05, 0.95, -3.3], subj: "garyH" };
};
lens3([[1833, B_MS]]);

// v21 kit round 2: a push on every sentence start and a sideways nudge on a key word in most sentences
KEY_PUNCH.push(107, 223, 296, 580, 672, 719, 803, 947, 1021, 1091, 1227, 1297, 1460, 1529, 1594, 1728);
KEY_NUDGE.push(182, 261, 361, 548, 694, 757, 929, 1074, 1161, 1257, 1343, 1406, 1472, 1553, 1616, 1717, 1796, 1894);
