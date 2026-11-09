// =====================================================================================================================
// "Owners Sank Their Own Ships, So He Painted a Line" - 9 scene ids in three places: the Liverpool dock (home base,
// "dock": morning, midday, golden hour, night, bright day), the North Atlantic in a gale ("storm", night) and the House
// of Commons ("commons", day interior). Master prompt v10.14:
//  - a real time of day per scene, neighbours contrast (morning -> storm night -> morning -> midday -> Commons ->
//    golden -> night lamps -> bright payoff);
//  - people in every story beat (the mechanism shot keeps Plimsoll and a soaked sailor in frame);
//  - the comparison is acted in the story world: Plimsoll's toy boat in the dock's rain barrel, his fingers drop the
//    pennies; the 1876 notice and the 1890 circle are put up by hands;
//  - one ending, on the callback ("she'll float" ... she has to), story characters in the last shot;
//  - thin black limbs (fig.ts), staggered groups turned toward the action, hats stay on, camera roll 0.
// Accent signal lime #8BD435 (Plimsoll's paint, his hat band and scarf, the lines).
type CK = { f: number; pos: V3; look: V3; fov: number };
const spline = (ks: CK[]) => (f: number): { pos: V3; look: V3; fov: number } => {
  const n = ks.length; if (f <= ks[0].f) return { pos: ks[0].pos, look: ks[0].look, fov: ks[0].fov };
  if (f >= ks[n - 1].f) return { pos: ks[n - 1].pos, look: ks[n - 1].look, fov: ks[n - 1].fov };
  let i = 0; while (f > ks[i + 1].f) i++;
  const a = ks[i], b = ks[i + 1], h = b.f - a.f, t = (f - a.f) / h, t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const m = (j: number, g: (k: CK) => number) => (j <= 0 || j >= n - 1 ? 0 : (g(ks[j + 1]) - g(ks[j - 1])) / (ks[j + 1].f - ks[j - 1].f));
  const H = (g: (k: CK) => number) => h00 * g(a) + h10 * h * m(i, g) + h01 * g(b) + h11 * h * m(i + 1, g);
  return { pos: [0, 1, 2].map((c) => H((k) => k.pos[c])) as V3, look: [0, 1, 2].map((c) => H((k) => k.look[c])) as V3, fov: H((k) => k.fov) };
};
const LIMEC = "#8bd435";
/** dock geometry (dock.ts): deck top for a sink depth, a point on the quay-side hull (ship-local x, y) */
const DECK = (sy: number) => 0.30 - sy;
const HULLX = 8.47;
const hullPt = (lx: number, ly: number, sy: number): V3 => [HULLX, -1.0 - sy + ly, -6 - lx];
/** a coin / money flash: a gold sparkle */
const goldGlint = (key: string, pos: V3, f: number) => sparkle(key, pos, f % 14, 0.22, "#ffe27a");
const ARF = {
  shieldR: [[22, -20], [8, -44]] as A2, shieldL: [[-22, -20], [-8, -44]] as A2, earR: [[26, -14], [10, -36]] as A2, earL: [[-26, -14], [-10, -36]] as A2,
  crossR: [[20, 18], [-10, 18]] as A2, crossL: [[-20, 18], [10, 18]] as A2, chinR: [[22, 10], [6, -14]] as A2, cheer: [[24, -30], [30, -66]] as A2,
};
/** soft white sea spray (no outline: it is light and water, part 14 E2), a = opacity, seed picks the shape */
const sprayCard = (key: string, pos: V3, w: number, a: number, seed = 1): FxSpec => ({
  kind: "card", key: "spray" + (seed % 4) + "_" + Math.round(a * 10), pos, w, h: w * 0.7, soft: true, cw: 192, ch: 136,
  draw: (p) => {
    const g = p.g;
    for (let i = 0; i < 9; i++) {
      const x = 30 + 132 * rnd1(i + seed * 5), y = 40 + 60 * rnd1(i + seed * 3, 78.233), r = 18 + 26 * rnd1(i + seed, 39.4);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(236,244,250,${0.75 * a})`); gr.addColorStop(1, "rgba(236,244,250,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  },
});
const sprayCards = (key: string, A: V3, f: number, a: number, b: number, n = 4, size = 1.2): FxSpec[] => {
  if (f < a || f > b) return [];
  const k = Math.sin(Math.PI * lin(f, a, b));
  return Array.from({ length: n }, (_, i) => sprayCard(key + i, [A[0] + 0.3 * Math.sin(i * 2), A[1] + 0.25 * i * k, A[2] + 0.4 * i - 0.6], size * (0.6 + 0.5 * k), 0.85 * k, i + 2));
};
/** a copper penny falling into the toy boat */
const penny = (key: string, pos: V3): FxSpec => ({ kind: "card", key: "penny", pos, w: 0.06, h: 0.06, cw: 32, ch: 32,
  draw: (p) => { const g = p.g; const gr = g.createRadialGradient(12, 11, 2, 16, 16, 15); gr.addColorStop(0, "#f3b07a"); gr.addColorStop(1, "#a75a26"); g.fillStyle = gr; g.beginPath(); g.ellipse(16, 16, 14, 14, 0, 0, 6.3); g.fill(); } });
/** a fellow ship owner (top hats) laughing on the quay */
const OWN = (who: string, pos: V3, f: number, a: number, i: number, facing: number, extra: P = {}): CastPlace =>
  C(who, pos, pose(null, f >= a ? { ...laughP(f, a, i), facing, armR: [[24, 16], [12, 30]] as A2, armL: [[-26, 14], [-10, 26]] as A2, ...extra } : { expr: "tache", facing, ...extra }), { idx: 30 + i });

/** framing boxes: a standing body from y0 (0.55 = from the knees) to the hat; a seated body; a prop box */
const bod = (p: V3, y0 = 0, y1 = 2.05, w = 0.34): Box => [p, Math.min(y0, 0.1), y1, w];   // gate check 1: frame the whole figure (feet to hat), size by pad
const sitB = (p: V3): Box => [p, -0.05, 1.6, 0.34];
const boxAt = (p: V3, h: number, w: number, y0 = 0): Box => [p, y0, y0 + h, w];
/** a camera key by fit (every box inside the 9:16 frame by construction) */
const FK = (f: number, boxes: Box[], az: number, el: number, fov = 40, pad = 0.82, side = 0, lift = 0): CK => ({ f, ...fit(boxes, az, el, fov, pad, side, lift) });
const HOLD = (k: CK, f: number): CK => ({ ...k, f });
/** a point on PROSPERITY's gangplank (quay foot x 6.0 -> rail x 8.79 at z -7.4) for a sink depth */
const gangAt = (x: number, sy: number): V3 => [x, 0.1 + ((x - 6.0) / 2.79) * (0.26 - sy), -7.4];
/** the face-toward helper for the scene's own camera */
const toward = (id: number, s: SetDef, f: number, a: V3, b: V3) => faceTo(id, s, f, a, b);
/** the lime stripe (scene 4/7) and the 1890 mark (scene 9) on the quay-side hull */
const stripeBox = (sy: number): Box => [[HULLX, -0.48 - sy, -8.75], 0, 0.3, 0.08];
const markBox = (sy: number): Box => [[HULLX, -0.7 - sy, -5.1], 0, 0.5, 0.26];

// ================================================= SCENE 1 (0-389) MORNING: the hook, "You see," and "She'll float."
// Frame 1: the owner (big, left) grins as the derrick drops one more net of crates onto PROSPERITY behind him; she sits
// low, water slopping at the rail; the insurer at his side waves the fat policy. One continuous camera: the two-shot,
// closer on the policy ("worth more sunk"), up and back over the worried sailors as the cargo piles on, then round to
// the gangplank where the owner pats the rail: "She'll float."
const s1Y = (f: number) => (f < 105 ? lerp(0.32, 0.8, sm(f, 40, 75)) : 0.62 + lerp(0, 0.26, sm(f, 250, 320)));
const S1DECK = (f: number): V3 => [8.95, DECK(s1Y(f)) + 0.02, -8.1];   // the hook: the owner aboard, beside his load line
const S1OWN: V3 = [6.5, 0, -4.2], S1INS: V3 = [5.7, 0, -3.4], S1DOCK: V3 = [4.0, 0, -11.2], S1SA: V3 = [4.7, 0, -8.9], S1SB: V3 = [3.9, 0, -9.8];
const s1OwnPos = (f: number): V3 => {
  const sy = s1Y(f), A: V3 = S1OWN, B: V3 = [6.05, 0.1, -7.4], Cg = gangAt(7.85, sy);
  return f < 105 ? S1DECK(f) : f < 292 ? A : f < 330 ? polyAt([A, [5.75, 0, -5.6], B], sm(f, 292, 330)).p : lerp3(B, Cg, sm(f, 330, 344));   // round the bollard, not through it
};
SHOT_CAMS[1] = () => {
  // HOOK (0-104, cold open): high over the quay edge, PROSPERITY broadside - her lime load line big across the frame,
  // the owner aboard grinning; the derrick drops a net of cargo (56) and the water climbs to the line and over it
  const A0: CK = { f: 0, pos: [4.3, 2.95, -8.8], look: [8.6, 0.15, -8.5], fov: 50 };   // the owner's hat stays inside the top edge
  const A1: CK = { f: 92, pos: [5.2, 2.5, -8.6], look: [8.8, 0.0, -8.3], fov: 46 };
  const hook = spline([A0, HOLD(A0, 46), A1, HOLD(A1, 104)]);
  // "You see," (105): the story starts on the quay - owner + insurer, the policy, the cargo piling on, the pat
  const Bk = FK(105, [bod(S1OWN), bod(S1INS)], 228, 2, 40, 0.68);
  const Cw = FK(300, [bod(S1SA), bod(S1SB), bod(s1OwnPos(310)), bod(s1OwnPos(330)), boxAt([9.6, DECK(0.88), -8.2], 1.9, 0.6)], 285, 12, 46, 0.88);
  // the push-in stays on the quay side (az 300): the old orbit to az 205 swept the camera through the two sailors
  // (a huge sailor cut by the left edge at 346-354); now they slide out of frame left and PROSPERITY's hull sits behind his pat
  const D = FK(362, [bod(s1OwnPos(370), 0, 2.15), boxAt([8.8, DECK(0.88) + 0.1, -7.4], 1.1, 0.25)], 290, 5, 38, 0.64);
  const path = spline([Bk, HOLD(Bk, 215), Cw, HOLD(Cw, 335), D, HOLD(D, 389)]);
  return [K(0, F((f) => hook(f), 0, 0.0008), 24, true), K(105, F((f) => path(f), 105, 0.0008), 0, true)];
};
KICKS.push([56 / 30, 0.2]);
SHOT_ACTS[1] = (f, s) => {
  const sy = s1Y(f), ownPos = s1OwnPos(f);
  const cyc = (g: number) => (g < 40 ? { a: sm(g, 0, 40), h: 3.4, load: 1 } : g < 56 ? { a: 1, h: lerp(3.4, 1.6, sm(g, 40, 56)), load: 1 } : { a: 1 - sm(g, 70, 140), h: lerp(1.6, 3.4, sm(g, 60, 110)), load: 0 });
  const cr = f < 230 ? cyc(f) : cyc(f - 250);
  const cargo = 18 + (f >= 56 ? 4 : 0) + (f >= 306 ? 4 : 0) + Math.floor(lin(f, 260, 320) * 4);
  const fShip = toward(1, s, f, S1OWN, [9.6, 0, -8.2]), fIns = toward(1, s, f, S1OWN, S1INS);
  const fNet = toward(1, s, f, S1DECK(f), [10.4, 0, -8.9]);
  const own: P = f < 105 ? flow(f, [
    [0, { expr: "scheme", facing: fNet, armR: AR.waveR, armRFront: true, armL: AR.hipL, tilt: -3 }],
    [44, { expr: "scheme", facing: fNet, armR: [[26, -20], [44, -50]] as A2, armRFront: true, armL: AR.hipL }, 4],     // wind-up: "bring it down!"
    [52, { expr: "scheme", facing: fNet, armR: AR.pointR, armRFront: true, armL: AR.hipL, tilt: 3 }, 3],               // the drop
    [76, { expr: "tacheUp", facing: -fNet, armR: ARF.cheer, armRFront: true, armL: AR.hipL }, 4],                      // "got rich"
  ]) as P : f < 292 ? flow(f, [
    [0, { expr: "scheme", facing: fShip, tilt: -3, armR: AR.waveR, armRFront: true, armL: AR.hipL }],
    [48, { expr: "scheme", facing: fShip, armR: AR.pointR, armRFront: true, armL: AR.hipL, headTilt: 3 }, 6],
    [76, { expr: "scheme", facing: fIns, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: AR.hipL }, 4],   // "rich"
    [150, { expr: "sly", facing: fIns, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: AR.hipL, look: -0.5 }, 6],
    [205, { expr: "scheme", facing: fIns, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: [[-22, -6], [-34, -22]] as A2, headTilt: -4 }, 6],
    [245, { expr: "scheme", facing: fShip, armR: AR.waveR, armRFront: true, armL: AR.hipL, propR: "moneybag" }, 6],
  ]) as P : f < 344 ? { expr: "scheme", mode: "walk", phase: walkPh(Math.hypot(ownPos[0] - S1OWN[0], ownPos[2] - S1OWN[2]) + Math.max(0, ownPos[0] - 6.05)), facing: toward(1, s, f, ownPos, f < 330 ? [6.05, 0, -7.4] : [8.8, 0, -7.4]), armR: AR.hipR, armL: AR.hipL }
    : flow(f, [
      [344, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: [[24, 10], [40, 8]] as A2, armRFront: true, armL: AR.hipL }],
      [346, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: ARMS.reachR, armRFront: true, armL: AR.hipL, tilt: 4 }, 3],          // pat
      [352, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: [[30, 6], [52, 6]] as A2, armRFront: true, armL: AR.hipL, tilt: 3 }, 3],
      [358, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: ARMS.reachR, armRFront: true, armL: AR.hipL, tilt: 4 }, 3],          // pat
      [366, { expr: "tacheUp", facing: toward(1, s, f, ownPos, [8.9, 0, -7.4]), armR: ARMS.reachR, armRFront: true, armL: AR.hipL, headTilt: 4 }, 3],
    ]) as P;
  const fO = toward(1, s, f, S1INS, S1OWN);
  const ins: P = flow(f, [
    [0, { expr: "fakegrin", facing: fO, armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" }],
    [70, { expr: "fakegrin", facing: fO, armR: ARMS.reachR, armRFront: true, propR: "moneybag" }, 3],               // hands over the bag on "rich"
    [82, { expr: "fakegrin", facing: fO, armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" }, 6],
    [158, { expr: "scheme", facing: fO, armR: AR.liftHiR, armRFront: true, propR: "deed", headTilt: 3 }, 4],       // the policy up: "insured for more than it was worth"
    [228, { expr: "fakegrin", facing: fO, armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" }, 6],
  ]) as P;
  const fSh = toward(1, s, f, S1SA, [9.6, 0, -8.2]);
  const sA: P = flow(f, [[0, { expr: "worry", facing: fSh, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true }], [304, { expr: "worry", facing: fSh, sweat: 1, armR: ARF.chinR, armRFront: true }, 4]]) as P;
  const sB: P = flow(f, [[0, { expr: "worry", facing: fSh, look: 0.4 }], [304, { expr: "worry", facing: fSh, armR: ARF.earR, armRFront: true }, 3], [340, { expr: "worry", facing: fSh, armR: ARF.earR, armRFront: true }, 6]]) as P;
  const crank = Math.sin(st(f) * 0.5);
  const dk: P = { expr: "strain", facing: toward(1, s, f, S1DOCK, [4.4, 0, -12.6]), armR: [[24, 4 + 8 * crank], [44, -6 - 14 * crank]] as A2, armRFront: true, armL: [[18, 10], [34, 0]] as A2, tilt: -4 };
  return {
    ctl: { shipY: sy, cargo, craneA: cr.a, craneH: cr.h, craneLoad: cr.load, awash: f < 105 ? sm(f, 58, 80) * 0.5 : sm(f, 270, 330) * 0.6, steam: 0.5, gang: 1, punt: 0, line: f < 105 ? 1 : 0, ghost: f < 105 ? 1 : 0 },
    cast: [
      C("owner", ownPos, speak(f, 371, 384, own), { idx: 1, air: f < 105 || f >= 330 }),
      C("insurer", S1INS, pose(null, ins), { idx: 2 }),
      C("docker", S1DOCK, pose(null, dk), { idx: 3 }),
      C("sailorA", f < 105 ? [3.0, 0, -6.4] : S1SA, pose(null, sA), { idx: 4 }),
      C("sailorB", f < 105 ? [2.4, 0, -7.2] : S1SB, pose(null, sB), { idx: 5 }),
    ],
    fx: fxs(...splash("s1a", [9.6, DECK(sy) + 0.2, -8.4], (f - 56) % 250, 1.6), ...splash("s1b", [9.3, DECK(sy) + 0.2, -9.4], (f - 306) % 250, 1.6),
      f >= 72 && f < 100 ? goldGlint("bag", [ownPos[0], 1.75, ownPos[2] + 0.25], f) : null),
    focus: f < 105 ? [HULLX, -0.9, -8.6] : [ownPos[0], ownPos[1] + 1.5, ownPos[2]], subj: "owner",
  };
};

// ================================================= SCENE 2 (389-452) THE GALE, NIGHT: "She doesn't. Insurance pays out."
// Cut on "doesn't": the twin coffin ship ploughs into a sea; lightning; she goes down by the bow while the three
// sailors pull hard in the lifeboat in the foreground; the camera rides the swell beside the boat.
const s2u = (f: number) => 0.1 + 0.9 * lin(f, 389, 452);
SHOT_CAMS[2] = () => [K(389, (f) => {
  const bp = boatAt(f / 30, s2u(f)), away: V3 = [-0.81, 0, 0.58];
  const pos: V3 = [bp[0] + 4.9 * away[0], 2.4 + 0.18 * Math.sin(f * 0.07), bp[2] + 4.9 * away[2]];   // a little higher, looking down into the boat: the rowers sit mid-frame, above the captions
  const look = lerp3([bp[0], bp[1] + 0.15, bp[2]], [0.5, 1.0, -0.4], 0.1);
  return { pos, look, fov: 50, roll: 0 };
}, 24, true)];
KICKS.push([396 / 30, 0.45]);
SHOT_ACTS[2] = (f) => {
  const t = f / 30, bp = boatAt(t, s2u(f));
  const rower = (who: string, dx: number, i: number): CastPlace => {
    const u = Math.sin(t * 4.2 + i * 0.2);
    return C(who, [bp[0] + dx * Math.cos(0.5), bp[1] - 0.15, bp[2] + dx * Math.sin(0.5)], pose(null, { mode: "sit", expr: i === 1 ? "yikes" : "breakdown", facing: 1, tilt: -10 * u, wet: 1, armR: [[26, 10 - 10 * u], [48, 14 - 18 * u]] as A2, armL: [[18, 12 - 10 * u], [40, 18 - 18 * u]] as A2, armRFront: true }), { idx: 10 + i, scale: 0.9, blob: false });
  };
  return {
    ctl: { sink: lerp(0.95, 2.45, sm(f, 396, 450)), flash: Math.max(0, 1 - Math.abs(f - 396) / 5) + 0.6 * Math.max(0, 1 - Math.abs(f - 430) / 4), boatX: s2u(f), spray: 0.7 },
    cast: [rower("sailorA", -0.8, 0), rower("sailorB", 0.15, 1), rower("sailorC", 1.0, 2)],
    focus: [bp[0], bp[1] + 0.7, bp[2]], subj: "sailorB",
  };
};

// ================================================= SCENE 3 (452-562) NEXT MORNING: two more ships; 2,000 sailors to court
// The owner beams over the money bag and points down the quay at GOOD FORTUNE ("he buys two more"); the insurer
// smiles. The camera slides along the quay to her gangplank where the sailors refuse, arms crossed; the constable takes
// one by the collar and marches him off toward the MAGISTRATES' COURT.
const S3OWN: V3 = [5.4, 0, -15.0], S3INS: V3 = [4.6, 0, -15.4];
// v10.14 rule 7 / part 16 A4 (f505 had four in a row facing the camera): staggered for the 305 deg camera - sailorC in
// front on the right (biggest), sailorB in the middle (the one who gets grabbed), sailorA at the back right, the constable
// coming in from the back left and taking sailorB's collar from the open side
const S3SA: V3 = [6.3, 0, -19.7], S3SB: V3 = [4.49, 0, -20.56], S3SC: V3 = [4.01, 0, -19.5], S3COP: V3 = [4.38, 0, -21.77];
const S3GRAB: V3 = [-0.46, 0, -0.66];   // the constable's place beside the sailor (across the camera, never behind him)
const S3MARCH: V3[] = [[4.49, 0, -20.56], [1.2, 0, -18.4]];
SHOT_CAMS[3] = () => {
  const A = FK(452, [bod(S3OWN), bod(S3INS)], 272, 4, 40, 0.64);   // from the quay side: the derrick's rope falls behind them, not across the owner
  const Bk = FK(500, [bod(S3SA, 0.4), bod(S3SB, 0.4), bod(S3SC, 0.4), bod(S3COP, 0.4)], 305, 18, 54, 0.86);   // closer, wider and from above: the front sailor clearly biggest and lowest, the stagger reads   // closer and wider: the front sailor clearly biggest
  const Cc = FK(562, [bod(S3MARCH[1]), bod(add3(S3MARCH[1], S3GRAB[0], 0, S3GRAB[2]))], 70, 4, 42, 0.56);
  const path = spline([A, HOLD(A, 474), Bk, HOLD(Bk, 512), Cc]);
  return [K(452, F((f) => path(f), 452, 0.0008), 24, true)];
};
SHOT_ACTS[3] = (f, s) => {
  const fShip = toward(3, s, f, S3OWN, [11.0, 0, -24]);
  const own: P = flow(f, [
    [452, { expr: "scheme", facing: fShip, armR: [[22, 4], [30, -18]] as A2, armRFront: true, propR: "moneybag", armL: AR.hipL }],
    [458, { expr: "scheme", facing: fShip, armL: [[-28, -6], [-56, -12]] as A2, armLFront: true, armR: [[22, 4], [30, -18]] as A2, propR: "moneybag", tilt: 3 }, 3],   // "two more"
    [496, { expr: "sly", facing: fShip, armR: [[22, 4], [30, -18]] as A2, propR: "moneybag", armL: AR.hipL, look: 0.6 }, 6],
  ]) as P;
  const ins: P = { expr: "fakegrin", facing: toward(3, s, f, S3INS, S3OWN), armR: [[22, 6], [34, -14]] as A2, armRFront: true, propR: "deed" };
  const w = walkPath(3, s, S3MARCH, f, 506, 562);
  const fCop = toward(3, s, f, S3COP, S3SB);
  const cop: P = f < 506 ? flow(f, [[452, { expr: "tache", facing: fCop, armR: AR.hipR, armL: AR.hipL }], [488, { expr: "tache", facing: fCop, armR: AR.pointR, armRFront: true, armL: AR.hipL }, 4]]) as P
    : { expr: "tache", mode: "walk", phase: w.phase, facing: w.facing, armR: [[26, -4], [40, -18]] as A2, armRFront: true };
  const fSh = toward(3, s, f, S3SB, S3COP);
  const sB: P = f < 506 ? flow(f, [[452, { expr: "angry", facing: -fSh, armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true }], [490, { expr: "worry", facing: fSh }, 3]]) as P
    : { expr: "worry", mode: "walk", phase: (w.phase + 0.5) % 1, facing: w.facing, tilt: 6 };
  const copPos: V3 = f < 506 ? lerp3(S3COP, add3(S3SB, S3GRAB[0], 0, S3GRAB[2]), sm(f, 490, 506)) : add3(w.p, S3GRAB[0], 0, S3GRAB[2]);
  const sBpos: V3 = f < 506 ? S3SB : w.p;
  const cross: P = { armR: ARF.crossR, armL: ARF.crossL, armRFront: true, armLFront: true };
  return {
    ctl: { shipY: 0.25, cargo: 12, craneA: 1, craneH: 3.0, steam: 0.4, gang: 1 },
    cast: [
      C("owner", S3OWN, pose(null, own), { idx: 1 }), C("insurer", S3INS, pose(null, ins), { idx: 2 }),
      C("sailorA", S3SA, pose(null, flow(f, [[452, { expr: "angry", facing: toward(3, s, f, S3SA, S3COP), ...cross }], [508, { expr: "worry", facing: toward(3, s, f, S3SA, sBpos), ...cross }, 4]]) as P), { idx: 4 }),
      C("sailorB", sBpos, pose(null, sB), { idx: 5 }),
      C("sailorC", S3SC, pose(null, flow(f, [[452, { expr: "angry", facing: toward(3, s, f, S3SC, S3COP), armR: [[26, -8], [46, -22]] as A2, armRFront: true, armL: AR.hipL, tilt: -5 }],   // shakes his head and points back at the ship: not going
        [470, { expr: "cold", facing: toward(3, s, f, S3SC, S3COP), armR: [[26, -12], [48, -30]] as A2, armRFront: true, armL: AR.hipL, tilt: -3 }, 4],
        [512, { expr: "worry", facing: toward(3, s, f, S3SC, sBpos), armR: AR.hipR, armL: AR.hipL, tilt: 4 }, 4]]) as P), { idx: 6 }),
      C("constable", copPos, pose(null, cop), { idx: 7 }),
    ],
    fx: fxs(f >= 452 && f < 470 ? goldGlint("bag3", [S3OWN[0], 1.75, S3OWN[2] + 0.25], f) : null),
    focus: f < 495 ? [S3OWN[0], 1.5, S3OWN[2]] : [sBpos[0], 1.5, sBpos[2]], subj: f < 495 ? "owner" : "sailorB",
  };
};

// ================================================= SCENE 4 (562-784) MIDDAY: Plimsoll and his one line of paint
// He strolls up the quay past the owners with a paint pot, hops down into the painter's punt beside PROSPERITY and,
// kneeling, paints one lime stripe along her hull ("One line of paint.") - the brush moves, the stripe grows under it.
// Up on the quay the owners laugh (one, then all) and the owner points: "Paintbrush Plimsoll!"
const S4WALK: V3[] = [[5.7, 0, -10.0], [6.35, 0, -8.0]];
const S4PUNT0: V3 = [7.55, -0.73, -7.95];
const S4PLEND: V3 = [7.55, -0.73, -9.25];
const S4HOWL_AZ = 330;
const S4O1: V3 = [4.6, 0, -10.2], S4O2: V3 = [3.6, 0, -9.8], S4O3: V3 = [5.6, 0, -11.35];   // dealer4 starts inside the bollard line so his walk passes clear of the bollard at (6.2, -9.9)   // staggered front-left to back-right
// while he hops into the punt the owners stroll over to the quay edge to watch him (626-660), then howl down at him
const S4H1: V3 = [5.25, 0, -9.2], S4H2: V3 = [4.46, 0, -8.73], S4H3: V3 = [5.95, 0, -9.45];   // staggered for the 330 deg camera: front (dealer2) biggest, middle (owner), back (dealer4), each 0.45 m apart across the frame   // a row across the camera: no head behind another
const s4Own = (a: V3, b: V3, f: number) => lerp3(a, b, sm(f, 646, 684));
const s4OwnWalk = (a: V3, b: V3, f: number): P => (f > 646 && f < 684 ? { mode: "walk", phase: walkPh(Math.hypot(b[0] - a[0], b[2] - a[2]) * sm(f, 646, 684)) } : {});
const s4Pl = (f: number): V3 => (f < 566 ? S4WALK[0] : f < 624 ? lerp3(S4WALK[0], S4WALK[1], sm(f, 566, 624)) : f < 648 ? lerp3(S4WALK[1], S4PUNT0, sm(f, 630, 648)) : [S4PUNT0[0], S4PUNT0[1], lerp(S4PUNT0[2], -9.25, sm(f, 690, 714))]);
SHOT_CAMS[4] = () => {
  const A = FK(562, [bod(S4WALK[0]), bod(S4O1), bod(S4O2), bod(S4O3), boxAt([8.3, -0.6, -9.6], 2.6, 1.5)], 342, 11, 46, 0.6);   // v10.16 wide place shot: he strolls in along the busy quay beside PROSPERITY (a journey)
  const A2k = FK(620, [bod(S4WALK[1])], 20, 3, 42, 0.46);   // from over the water: the quay bollards stay behind the camera's left
  const Bk = FK(660, [bod([S4PUNT0[0], S4PUNT0[1], -8.0], 0, 1.55, 0.5), bod([S4PUNT0[0], S4PUNT0[1], -9.25], 0, 1.55, 0.5), stripeBox(0.1)], 350, 3, 40, 0.54);
  // the howl (v10.15 rule 4): the owners laughing up on the quay and Plimsoll calm in his punt in ONE frame
  const Cc = FK(730, [body(S4H1, 0.75, 2.1, 0.3), body(S4H2, 0.75, 2.1, 0.3), body(S4H3, 0.75, 2.1, 0.3), body(S4PLEND, 0.7, 1.45, 0.35)], S4HOWL_AZ, 14, 44, 0.9);   // knees up: owners above, his head and shoulders below-right
  const Dk = FK(760, [bod(S4H1), bod(S4H2), bod(S4H3)], 338, 3, 42, 0.54);   // low angle, pushed in on the laughing trio as the owner points down: "Paintbrush Plimsoll!" (the group's mockery)   // low-angle close-up on the owner's quote, the others laughing behind
  const path = spline([A, HOLD(A, 580), A2k, Bk, HOLD(Bk, 708), Cc, HOLD(Cc, 748), Dk, HOLD(Dk, 784)]);
  return [K(562, F((f) => path(f), 562, 0.0008), 24, true)];
};
SHOT_ACTS[4] = (f, s) => {
  const sy = 0.1, lineK = sm(f, 690, 714), plPos = s4Pl(f);
  const wk = walkPh(Math.hypot(plPos[0] - S4WALK[0][0], plPos[2] - S4WALK[0][2]));
  const fHull = toward(4, s, f, plPos, [8.6, -0.5, plPos[2]]);
  const pl: P = f < 624 ? { expr: "determined", mode: f > 566 ? "walk" : "stand", phase: wk, facing: toward(4, s, f, S4WALK[0], S4WALK[1]), propL: "paintPot", armL: [[-20, 26], [-12, 40]] as A2, propR: "paintBrush", armR: [[24, 20], [16, 36]] as A2, armRFront: true }
    : f < 650 ? { expr: "determined", mode: "hop", lift: 0.45 * bump(lin(f, 630, 648)), facing: fHull, propL: "paintPot", armL: [[-20, 26], [-12, 40]] as A2, propR: "paintBrush", armR: [[24, 20], [16, 36]] as A2 }
    : flow(f, [
      [650, { ...PZ_KNEEL, expr: "calm", facing: fHull, kneelK: 0.4 }],
      [660, { ...PZ_KNEEL, expr: "calm", facing: fHull, kneelK: 1, headTilt: -3 }, 8],
      [686, { ...PZ_KNEEL, expr: "determined", facing: fHull, kneelK: 1, armR: [[30, 14], [60, 18]] as A2 }, 4],       // wind-up
      [692, { ...PZ_KNEEL, expr: "determined", facing: fHull, kneelK: 1, armR: [[30, 22], [62, 34]] as A2, tilt: 6 }, 3],   // the stroke
      [716, { ...PZ_KNEEL, expr: "bored", facing: fHull, kneelK: 1, armR: [[26, 4], [40, -8]] as A2 }, 6],   // deadpan vs the laughing owners (rule 4)
      [744, { ...PZ_KNEEL, expr: "bored", facing: toward(4, s, f, plPos, S4H1), kneelK: 1, armR: [[26, 4], [40, -8]] as A2, look: 0.6 }, 6],
    ]) as P;
  const fO = (p: V3) => toward(4, s, f, p, plPos);
  const o1 = s4Own(S4O1, S4H1, f), o2 = s4Own(S4O2, S4H2, f), o3 = s4Own(S4O3, S4H3, f);
  const ownA: P = f < 720 ? { expr: "tache", facing: fO(o1), armR: AR.hipR, armL: AR.hipL, ...s4OwnWalk(S4O1, S4H1, f) }
    : f < 729 ? { expr: "mock", facing: fO(o1), armR: AR.hipR, armL: AR.hipL, headBack: 0.15 }
    : f < 746 ? { ...laughP(f, 729, 0), facing: fO(o1) }
    : speak(f, 749, 780, { expr: "mock", facing: fO(o1), armR: AR.pointR, armRFront: true, armL: AR.hipL, tilt: 4 });
  return {
    ctl: { shipY: sy, cargo: 10, line: lineK, punt: 1, puntZ: -8.5, gang: 0, steam: 0.4, craneA: 0.1 },
    cast: [
      C("plimsoll", plPos, pose(null, pl), { idx: 1, air: f >= 630 }),
      C("owner", o1, pose(null, ownA), { idx: 2 }),
      OWN("dealer2", o2, f, 729, 1, fO(o2), f >= 720 && f < 729 ? { expr: "mock", headBack: 0.15 } : s4OwnWalk(S4O2, S4H2, f)),
      OWN("dealer4", o3, f, 729, 2, fO(o3), f >= 720 && f < 729 ? { expr: "mock", headBack: 0.15 } : s4OwnWalk(S4O3, S4H3, f)),
    ],
    fx: fxs(f >= 690 && f <= 716 ? sparkle("lime", [HULLX - 0.06, -0.48 - sy, -7.9 - 1.7 * lineK], (f - 690) % 10, 0.14, "#d8ff9a") : null),
    focus: f < 640 ? [plPos[0], plPos[1] + 1.5, plPos[2]] : f < 712 ? [HULLX, -0.3, -8.6] : f < 748 ? [6.3, 0.9, -9.2] : [S4H1[0], 1.5, S4H1[2]], subj: f < 712 ? "plimsoll" : "owner",
  };
};
const PZ_KNEEL: P = { mode: "kneel", armR: [[30, 20], [62, 30]] as A2, armRFront: true, propR: "paintBrush", propRAng: 1.35, armL: [[-20, 36], [-24, 66]] as A2, propL: "paintPot" };

// ================================================= SCENE 5 (784-1108) THE COMMONS, 1875 (day)
// The Speaker holds up PLIMSOLL'S BILL and drops it in the basket ("drops his law"); the front benches laugh. Plimsoll
// marches up beside the table, shakes his fist in the Speaker's face (the Speaker leans back), turns on the benches:
// "villains!" (they gasp together). He bows stiffly (apologises); the newsboy runs in waving the paper; they cheer.
const SEAT = (side: number, tier: number, z: number): V3 => [side * (2.5 + tier * 1.05 + 0.35), tier * 0.42 + 0.46, z];
const S5SPK: V3 = [0, 0.5, -13.9], S5FIST: V3 = [0.4, 0, -12.25], S5PL1: V3 = [0.35, 0, -12.0], S5WALK: V3[] = [[1.0, 0, -7.9], [1.7, 0, -9.9], S5PL1];   // he waits in the aisle, inside the wide shot
const S5MP: [string, V3, number][] = [["mp1", SEAT(1, 0, -10.2), 1], ["mp2", SEAT(1, 1, -8.6), 1], ["mp3", SEAT(-1, 1, -9.2), -1], ["mp4", SEAT(-1, 0, -9.7), -1]];
const S5BOY: V3[] = [[1.6, 0, -4.4], [1.55, 0, -10.4]];
const s5Pl = (f: number) => polyAt(S5WALK, sm(f, 848, 920)).p;
const BASKET: Box = [[1.15, 0.5, -12.9], 0, 0.45, 0.25];
SHOT_CAMS[5] = () => {
  const Aw: CK = { f: 784, pos: [0.6, 3.2, -3.0], look: [0, 1.0, -13.0], fov: 58 };   // v10.16 wide place shot: down the Commons between the benches to the Speaker, 1875
  const A = FK(822, [sitB(S5SPK), BASKET], 15, 3, 38, 0.6);
  const A2k = FK(838, [sitB(S5MP[0][1])], 290, 6, 40, 0.6);   // one clear subject: the front-bench MP laughing, the rest behind
  const Bk: CK = { f: 872, pos: [1.7, 1.15, -12.4], look: [1.7, 1.35, -7.6], fov: 60 };   // low and wide down the aisle: he marches at us, the benches either side, no MP cut by the edge   // ahead of him: he marches at us, face lit
  const Cc: CK = { f: 926, pos: [2.0, 1.2, -10.9], look: [-0.25, 1.5, -13.2], fov: 56 };   // low two-shot from the aisle: his fist up close on the left, the Speaker recoiling behind on the right (overlapping depths)
  const D: CK = { f: 970, pos: [-2.2, 0.95, -13.0], look: [1.3, 1.4, -11.06], fov: 50 };   // low-angle close-up: Plimsoll shouting at us on the left, the gasping MPs behind him on the right (mp1 centre, mp2 right), not stacked
  const E = FK(1080, [bod(S5PL1), bod(S5BOY[1])], 0, 14, 42, 0.8);
  const path = spline([Aw, HOLD(Aw, 804), A, HOLD(A, 836), { ...A2k, f: 846 }, HOLD(A2k, 866), { ...Bk, f: 876 }, HOLD(Bk, 900), Cc, HOLD(Cc, 958), D, HOLD(D, 1040), E, HOLD(E, 1108)]);
  return [K(784, F((f) => path(f), 784, 0.0008), 24, true)];
};
SHOT_ACTS[5] = (f, s) => {
  const plPos = f < 848 ? S5WALK[0] : f < 920 ? s5Pl(f) : f < 958 ? lerp3(S5PL1, S5FIST, sm(f, 914, 926)) : lerp3(S5FIST, S5PL1, sm(f, 958, 968));   // leans in for the fist, steps back to face the benches
  const w = walkPath(5, s, S5WALK, f, 848, 920);
  const fSpk = toward(5, s, f, plPos, S5SPK), fBench = toward(5, s, f, S5PL1, S5MP[1][1]);
  const pl: P = f < 848 ? { expr: "determined", facing: fSpk, armR: AR.hipR, armL: AR.hipL }
    : f < 920 ? { expr: "determined", mode: "walk", phase: w.phase, facing: w.facing, armR: [[24, 10], [28, 2]] as A2, armL: [[-24, 20], [-14, 34]] as A2 }
    : flow(f, [
      // v10.15 E: the anger builds word by word, never before the phrase: (wind-up held) "shakes" brows drop,
      // "his" teeth grit, "fist" the full fury face; held through "in his face" and the shout of "villains"
      [920, { expr: "determined", facing: fSpk, armR: [[26, -6], [44, -20]] as A2, armRFront: true }],
      [924, { expr: "angry", facing: fSpk, armR: [[26, -12], [48, -30]] as A2, armRFront: true, tilt: -4 }, 2],        // "shakes": brows drop, fist shakes
      [930, { expr: "angry", mouthX: "grit", facing: fSpk, armR: [[26, -6], [44, -20]] as A2, armRFront: true, tilt: -2 }, 2],   // "his": teeth grit
      [936, { expr: "fury", facing: fSpk, armR: [[26, -12], [48, -30]] as A2, armRFront: true, tilt: -4 }, 2],   // "fist" (937): full fury
      [942, { expr: "fury", facing: fSpk, armR: [[26, -6], [44, -20]] as A2, armRFront: true, tilt: -2 }, 2],
      [948, { expr: "fury", facing: fSpk, armR: [[26, -12], [48, -30]] as A2, armRFront: true, tilt: -4 }, 2],
      ...Array.from({ length: 10 }, (_, i): [number, P, number] => [964 + i * 4, { expr: "fury", facing: 0, mouth: i < 9 ? "tOBig" : "tWide", armR: i % 2 ? [[26, -6], [44, -22]] as A2 : [[26, -14], [48, -34]] as A2, armRFront: true, armL: AR.hipL, tilt: i % 2 ? -2 : 2 }, 2]),   // "villains!": at us, fist shaking, mouth wide
      [1005, { expr: "sheepish", facing: fBench, tilt: 0, armR: [[20, 20], [8, 34]] as A2, armL: [[-20, 20], [-8, 34]] as A2 }, 2],   // "He has to": the fury drops off his face
      [1010, { expr: "sheepish", facing: fBench, tilt: 22, armR: [[20, 20], [8, 34]] as A2, armL: [[-20, 20], [-8, 34]] as A2, headTilt: 6 }, 6],   // "apologize" (1016): a stiff bow
      [1034, { expr: "smug", facing: fBench, tilt: 0, armR: AR.hipR, armL: AR.hipL, look: 0.6 }, 6],
      [1080, { expr: "proud", facing: fBench, armR: AR.tipHatR, armRFront: true, armL: AR.hipL }, 4],
    ]) as P;
  const fP = toward(5, s, f, S5SPK, plPos);
  const spk: P = flow(f, [
    [784, { mode: "sit", expr: "tache", facing: fP, armR: AR.liftR, armRFront: true }],
    [824, { mode: "sit", expr: "tacheUp", facing: fP, armR: [[24, 6], [40, 0]] as A2, armRFront: true }, 3],                    // lets it drop
    [866, { mode: "sit", expr: "tache", facing: fP, armR: AR.hipR, look: 0.5 }, 6],
    [922, { mode: "sit", expr: "aghast", facing: fP, tilt: -12, armR: ARF.shieldR, armRFront: true }, 2],                   // the fist
    [1004, { mode: "sit", expr: "tacheUp", facing: fP, tilt: -4, armR: AR.hipR }, 6],
    [1052, { mode: "sit", expr: "tache", facing: fP, armR: AR.hipR, look: 0.6 }, 6],
  ]) as P;
  const mp = (who: string, pos: V3, i: number): CastPlace => {
    const fc = toward(5, s, f, pos, f < 870 ? S5SPK : plPos);
    const o: P = f < 870 ? (f >= 834 ? { ...laughP(f, 834, i), mode: "sit", facing: fc } : { mode: "sit", expr: "tache", facing: fc })
      : f < 982 ? { mode: "sit", expr: "tache", facing: fc }
      : f < 1030 ? { mode: "sit", expr: "aghast", facing: fc, tilt: -8, armR: ARF.shieldR, armRFront: true }               // gasp together on "villains", held ~1.5 s
      : f < 1080 ? { mode: "sit", expr: "tacheUp", facing: fc }                                                               // smug again while he has to apologise
      : { mode: "sit", expr: "worry", facing: fc };                                                                            // "Britain takes his side": the doubters sweat
    return C(who, pos, pose(null, o), { idx: 20 + i });
  };
  const bw = walkPath(5, s, S5BOY, f, 1036, 1074);
  const boy: P = f < 1074 ? { expr: "beam", mode: "run", phase: (f / 8) % 1, facing: bw.facing, propR: "newspaper", armR: [[24, -10], [30, -40]] as A2, armRFront: true }
    : speak(f, 1078, 1100, { expr: "beam", facing: toward(5, s, f, S5BOY[1], S5MP[1][1]), propR: "newspaper", armR: [[24, -10], [30, -40]] as A2, armRFront: true });
  return {
    ctl: { bill: f < 824 ? 1 : 1 - sm(f, 824, 850), billX: 0.42, billY: 1.95, billZ: -13.45 },
    cast: [
      C("speaker", S5SPK, pose(null, spk), { idx: 1 }),
      C("plimsoll", plPos, pose(null, pl), { idx: 2 }),
      ...S5MP.map(([who, pos], i) => mp(who, pos, i)),
      ...(f >= 1036 ? [C("newsboy", f < 1074 ? bw.p : S5BOY[1], pose(null, boy), { idx: 9 })] : []),
    ],
    fx: fxs(f >= 924 && f < 958 ? squiggles("fist", [S5PL1[0] - 0.1, 2.15, S5PL1[2] - 0.5], f, "#ffffff", 0.3) : null),
    focus: f < 834 ? [S5SPK[0], 1.9, S5SPK[2]] : f < 866 ? [S5MP[0][1][0], 1.6, S5MP[0][1][2]] : [plPos[0], 1.5, plPos[2]], subj: f < 834 ? "speaker" : f < 866 ? "mp1" : "plimsoll",
  };
};

// ================================================= SCENE 6 (1108-1296) GOLDEN HOUR, 1876: the law, and the smokestack
// The inspector nails the notice to the post (EVERY SHIP MUST CARRY A LOAD LINE); Plimsoll beams beside it. The owner
// smirks, and up on PROSPERITY's funnel ladder he paints his line round the smokestack; Plimsoll's hand meets his face.
const S6CLERK: V3 = [4.25, 0, -7.25], S6PL: V3 = [2.75, 0, -6.45], S6PL2: V3 = [5.7, 0, -5.15], S6OWN: V3 = [9.15, 1.2, -6.4];
const S6OWNQ: V3 = [4.95, 0, -5.75];   // staggered round the board: the owner in front right (biggest, the reaction), Plimsoll middle left, the inspector at the board behind
const S6RUN: V3[] = [S6OWNQ, [6.05, 0.1, -7.4], gangAt(8.6, 0.12), [9.1, DECK(0.12) + 0.02, -6.9]];
const s6Own = (f: number): V3 => (f < 1180 ? S6OWNQ : f < 1222 ? polyAt(S6RUN, sm(f, 1180, 1222)).p : lerp3(S6RUN[3], S6OWN, sm(f, 1222, 1240)));
const s6Pl = (f: number): V3 => lerp3(S6PL, S6PL2, sm(f, 1186, 1232));
SHOT_CAMS[6] = () => {
  const A = FK(1108, [bod(S6CLERK), bod(S6PL), bod(S6OWNQ), boxAt([3.6, 1.3, -7.5], 0.9, 0.35)], 8, 3, 42, 0.86);
  const Bk = FK(1240, [bod(S6OWN, 0, 2.05, 0.45)], 250, -10, 58, 0.38);
  const Cc: CK = { f: 1268, pos: [3.6, 1.0, -2.2], look: [6.33, 1.8, -5.13], fov: 54 };   // low angle: Plimsoll's calm facepalm in front left, the owner gloating up on the funnel behind right (opposite faces, not stacked)
  const A2 = FK(1138, [body(S6OWNQ, 0.5, 2.15, 0.34)], 15, 2, 42, 0.62);   // "the law passes": in on the owner's shock (reaction close-up)
  const path = spline([A, HOLD(A, 1128), A2, HOLD(A2, 1194), Bk, HOLD(Bk, 1258), Cc, HOLD(Cc, 1296)]);
  return [K(1108, F((f) => path(f), 1108, 0.0008), 24, true)];
};
SHOT_ACTS[6] = (f, s) => {
  const hamm = f >= 1124 && f < 1150 ? Math.abs(Math.sin((f - 1124) * 0.52)) : 0;
  const fN = toward(6, s, f, S6CLERK, [3.6, 0, -7.5]);
  const clerk: P = f >= 1124 && f < 1150
    ? { expr: "tache", facing: fN, armL: [[-20, -10], [-24, -34]] as A2, armLFront: true, armR: [[24, -18 + 14 * hamm], [36, -40 + 30 * hamm]] as A2, armRFront: true, propR: "gavel" }
    : flow(f, [[1108, { expr: "tache", facing: fN, armL: [[-20, -10], [-24, -34]] as A2, armLFront: true, propR: "gavel", armR: AR.liftR }], [1150, { expr: "tache", facing: toward(6, s, f, S6CLERK, S6OWNQ), armR: AR.hipR }, 6]]) as P;
  const plPos = s6Pl(f), w = walkPath(6, s, [S6PL, S6PL2], f, 1186, 1232);
  const fUp = toward(6, s, f, plPos, S6OWN);
  const pl: P = f < 1186 ? flow(f, [
    [1108, { expr: "smile", facing: toward(6, s, f, S6PL, [3.6, 0, -7.5]), armR: AR.hipR, armL: AR.hipL, look: 0.5 }],
    [1150, { expr: "proud", facing: toward(6, s, f, S6PL, [3.6, 0, -7.5]), armR: AR.tipHatR, armRFront: true }, 4],
  ]) as P : f < 1232 ? { expr: "calm", mode: "walk", phase: w.phase, facing: w.facing }
    : flow(f, [
      [1232, { expr: "calm", facing: fUp, look: 0.9 }],
      [1262, { expr: "bored", facing: fUp, look: 0.9 }, 3],
      [1276, { expr: "calm", facing: fUp, armR: [[22, -6], [6, -30]] as A2, armRFront: true, tilt: 6 }, 3],             // facepalm, eyes calmly shut
    ]) as P;
  const fFun = toward(6, s, f, S6OWN, [10.4, 1.5, -6.4]), ownPos = s6Own(f), fNo = toward(6, s, f, S6OWNQ, [3.6, 0, -7.5]);
  const ow = walkPath(6, s, S6RUN, f, 1180, 1222);
  const brushUp: P = { propR: "paintBrush", propL: "paintPot", armL: [[-20, 26], [-12, 40]] as A2, armRFront: true };
  const own: P = f < 1180 ? flow(f, [
    [1108, { expr: "tacheUp", facing: fNo, armR: AR.hipR, armL: AR.hipL }],                                          // smug: no law will touch him
    [1137, { expr: "shock", facing: fNo, armR: [[24, -4], [30, -26]] as A2, armRFront: true, armL: AR.hipL, hatLift: 0.2 }, 3],   // "passes" (1139): the law passes
    [1160, { expr: "worry", facing: fNo, armR: AR.hipR, armL: AR.hipL, hatLift: 0 }, 8],                             // "every ship needs a line"
    [1172, { expr: "scheme", facing: -fNo, armR: ARF.chinR, armRFront: true, armL: AR.hipL }, 6],                    // he has an idea
  ]) as P : f < 1222 ? { expr: "scheme", mode: "run", phase: ow.phase, facing: ow.facing, ...brushUp, armR: [[24, 14], [36, 24]] as A2 }
    : f < 1240 ? { expr: "scheme", facing: fFun, ...brushUp, armR: [[28, -14 + 8 * Math.sin(f * 0.6)], [40, -40]] as A2, armL: [[-24, -16 - 8 * Math.sin(f * 0.6)], [-30, -42]] as A2 }   // climbing
    : flow(f, [
      [1240, { expr: "scheme", facing: -fFun, ...brushUp, armR: [[24, -10], [34, -30]] as A2 }],
      [1252, { expr: "tacheUp", facing: fFun, ...brushUp, armR: [[30, -10], [52, -40]] as A2 }, 6],
      [1262, { expr: "tacheUp", facing: fFun, ...brushUp, armR: [[30, -14], [54, -30]] as A2 }, 4],
      [1272, { expr: "tacheUp", facing: fFun, ...brushUp, armR: [[30, -6], [52, -46]] as A2 }, 4],
      [1282, { expr: "tacheUp", facing: -fFun, ...brushUp, armR: AR.waveR }, 4],
    ]) as P;
  return {
    ctl: { shipY: 0.12, cargo: 8, notice: f >= 1132 ? 1 : 0, noticeBoard: 1, ladder: 1, funnelLine: sm(f, 1262, 1290), steam: 0.25, gang: 1, punt: 0 },
    cast: [
      C("inspector", S6CLERK, pose(null, clerk), { idx: 1 }),
      C("plimsoll", plPos, pose(null, pl), { idx: 2 }),
      C("owner", ownPos, pose(null, own), { idx: 4, air: f >= 1186 }),
    ],
    fx: fxs(f >= 1126 && f < 1152 ? dustCard("nail" + Math.floor((f - 1126) / 6), [3.62, 2.02, -7.45], 0.22, 0.6 * (1 - ((f - 1126) % 6) / 6), Math.floor((f - 1126) / 6)) : null),
    focus: f < 1128 ? [S6PL[0], 1.5, S6PL[2]] : f < 1260 ? [ownPos[0], ownPos[1] + 1.4, ownPos[2]] : [plPos[0], 1.5, plPos[2]], subj: f < 1128 || f >= 1260 ? "plimsoll" : "owner",
  };
};

// ================================================= SCENE 7 (1296-1430) NIGHT, THE TRICK: heavier = deeper = waves aboard
// Stinger on "Here's the trick." Lamps on. Low over the water along the hull: Plimsoll on the quay edge points as the
// derrick drops load after load and the lime stripe sinks to the black water ("sinks deeper"); then a wave walks over
// the deck and soaks the sailor standing on it.
const s7Y = (f: number) => lerp(0.15, 0.95, sm(f, 1322, 1372));
const S7PL: V3 = [6.45, 0, -8.4];
const s7Sc = (f: number): V3 => [9.25, DECK(s7Y(f)) + 0.02, -7.0];
SHOT_CAMS[7] = () => {
  const A = FK(1296, [bod(S7PL, 0.3), stripeBox(0.55), boxAt([9.3, 0.4, -8.2], 3.2, 1.5)], 20, 12, 46, 0.64);   // v10.16 wide place shot: the overloaded ship at night, the danger; Plimsoll small on the quay pointing at his line (from over the water: no bollard in front)
  const Bk = FK(1392, [bod(s7Sc(1400))], 300, 24, 42, 0.62);   // high: down onto the deck as the wave walks over it, not the black hull side
  return [K(1296, F((f) => spline([A, HOLD(A, 1366), Bk, HOLD(Bk, 1430)])(f), 1296, 0.0008), 24, true)];
};
KICKS.push([1404 / 30, 0.25]);
SHOT_ACTS[7] = (f, s) => {
  const sy = s7Y(f), d = DECK(sy), wv = lin(f, 1394, 1424);
  const fL = toward(7, s, f, S7PL, [HULLX, 0, -8.7]);
  const pl: P = flow(f, [[1296, { expr: "determined", facing: fL, armR: AR.pointR, armRFront: true, armL: AR.hipL }], [1356, { expr: "stern", facing: fL, armR: [[28, 6], [50, 18]] as A2, armRFront: true }, 4], [1402, { expr: "determined", facing: toward(7, s, f, S7PL, s7Sc(f)), armR: AR.pointR, armRFront: true }, 3]]) as P;
  const fW = toward(7, s, f, s7Sc(f), [11, 0, -5.2]);
  const sc: P = flow(f, [[1296, { expr: "worry", facing: fW, sweat: 1 }], [1396, { expr: "shock", facing: fW, armR: ARF.shieldR, armL: ARF.shieldL, armRFront: true, armLFront: true }, 2], [1410, { expr: "breakdown", facing: -fW, wet: 1, armR: AR.shrugR, armL: AR.shrugL }, 4]]) as P;
  return {
    ctl: { shipY: sy, ghost: f < 1390 ? 1 : 0, cargo: Math.round(lerp(10, 30, lin(f, 1316, 1372))), lamps: 1, wave: wv, awash: sm(f, 1404, 1424) * 0.7, craneA: 1, craneH: lerp(3.4, 1.8, sm(f, 1316, 1340)), craneLoad: f < 1342 ? 1 : 0, line: 1, steam: 0.2, gang: 0, rough: 0.6 },
    cast: [
      C("plimsoll", S7PL, pose(null, pl), { idx: 1 }),
      C("sailorC", s7Sc(f), pose(null, sc), { idx: 2, air: true }),
    ],
    fx: fxs(...splash("w7", [9.3, d + 0.3, -6.9], f - 1408, 2.2), ...sprayCards("w7s", [10.6, d + 0.4, -7.2], f, 1396, 1424, 4, 1.4)),
    focus: f < 1380 ? [S7PL[0], 1.5, S7PL[2]] : [s7Sc(f)[0], d + 1.4, -7.0], subj: f < 1380 ? "plimsoll" : "sailorC",
  };
};

// ================================================= SCENE 8 (1430-1528) THE DEMO, same night: the toy boat in the barrel
// Under the lamp, Plimsoll's fingers drop pennies into a toy boat with a lime line; the owner watches, unimpressed,
// then gulps as the water climbs over the line and the toy swamps. The barrel sits mid-frame, above the captions.
const S8PL: V3 = [3.62, 0, -0.32], S8OWN: V3 = [2.3, 0, -0.95];
SHOT_CAMS[8] = () => {
  const A = FK(1430, [bod(S8PL, 1.0), bod(S8OWN, 1.0), boxAt([3.0, 0.85, -0.6], 0.35, 0.5)], 4, 30, 36, 0.86);
  const Ins: CK = { f: 1478, pos: [3.0, 2.75, 0.9], look: [3.0, 1.0, -0.6], fov: 38 };   // v10.16 mechanism insert: the barrel top fills the width, the pennies drop, the water climbs over the toy's line
  const path = spline([A, HOLD(A, 1466), Ins, HOLD(Ins, 1528)]);
  return [K(1430, F((f) => path(f), 1430, 0.0005), 24, true)];
};
SHOT_ACTS[8] = (f, s) => {
  const drops = [1440, 1456, 1472, 1484, 1500, 1512];
  const pen = drops.filter((d) => f >= d).length;
  const dip = drops.reduce((m, d) => Math.max(m, bump((f - d + 4) / 10)), 0);
  const fB = toward(8, s, f, S8PL, [3.0, 0, -0.6]);
  const pl: P = { expr: "smug", facing: fB, armR: [[26, 2 + 6 * dip], [46, 8 + 14 * dip]] as A2, armRFront: true, armL: [[-20, 20], [-10, 34]] as A2, propL: "handful", look: 0.6, tilt: 4 + 3 * dip };
  const fO = toward(8, s, f, S8OWN, [3.0, 0, -0.6]);
  const own: P = flow(f, [[1430, { expr: "tache", facing: fO, armR: AR.hipR, armL: AR.hipL }], [1494, { expr: "worry", facing: fO, armR: AR.hipR, armL: AR.hipL }, 3], [1508, { expr: "gulp", facing: fO, sweat: 1, armR: ARF.chinR, armRFront: true }, 3]]) as P;
  return {
    ctl: { lamps: 1, toyLamp: 1, toy: lerp(0, 1.25, lin(f, 1438, 1522)), pen, line: 1, shipY: 0.9, cargo: 30, gang: 0, rough: 0.4 },
    cast: [C("plimsoll", S8PL, pose(null, pl), { idx: 1 }), C("owner", S8OWN, pose(null, own), { idx: 2 })],
    fx: fxs(...splash("toy", [3.0, 1.12, -0.6], f - 1512, 0.6), ...drops.map((d) => (f >= d - 6 && f < d ? penny("pen" + d, [3.0, lerp(1.5, 1.15, (f - d + 6) / 6), -0.55]) : null))),
    focus: [3.0, 1.1, -0.6], subj: f < 1470 ? "plimsoll" : null,
  };
};

// ================================================= SCENE 9 (1528-1926) BRIGHT DAY, 1890 -> today: the circle, the payoff
// Shape match on the toy's line: the inspector in the punt paints the circle on PROSPERITY's side (hand + brush). The
// owner, loaded as ever, pats his rail from the gangplank - the camera drops to the water: the circle is under ("over
// the line"); the inspector slams NOT SAILING down at the gangplank foot, the owner's hat pops. Dockers swing the cargo
// off, she rises, the circle comes up into the sun, the sailors cheer, Plimsoll smiles. Last: the owner pats the rail
// again, "she'll float" - and she does. One ending, on the callback.
const s9Y = (f: number) => lerp(0.1, 0.56, sm(f, 1680, 1710)) - lerp(0, 0.56, sm(f, 1752, 1830));   // the water reaches the line on "line" (1704), just over it by 1710
const S9PUNT: V3 = [7.55, -0.73, -5.35], S9INSQ: V3 = [5.35, 0, -6.15], S9PL: V3 = [4.4, 0, -4.6], S9PLQ: V3 = [6.6, 0, -5.05], S9PL2: V3 = [6.55, 0, -6.7];
const S9SA: V3 = [3.6, 0, -12.4], S9SB: V3 = [3.0, 0, -13.0], S9SC: V3 = [4.2, 0, -13.4];
const S9OWNQ: V3 = [5.2, 0, -8.9];
const s9Own = (f: number): V3 => (f < 1618 ? S9OWNQ : f < 1632 ? lerp3(S9OWNQ, [6.05, 0.1, -7.4], sm(f, 1618, 1632)) : f < 1648 ? lerp3([6.05, 0.1, -7.4], gangAt(7.75, s9Y(f)), sm(f, 1632, 1648)) : gangAt(7.75, s9Y(f)));
const s9Insp = (f: number): V3 => (f < 1640 ? S9PUNT : f < 1700 ? lerp3(S9PUNT, S9INSQ, sm(f, 1640, 1700)) : S9INSQ);
const s9Pl = (f: number): V3 => (f < 1732 ? S9PL : f < 1764 ? lerp3(S9PL, S9PLQ, sm(f, 1732, 1764)) : lerp3(S9PLQ, S9PL2, sm(f, 1846, 1872)));
SHOT_CAMS[9] = () => {
  const W = FK(1528, [bod(S9PUNT, 0.0, 1.55), markBox(0.1), boxAt([9.0, 0.3, -7.0], 3.4, 1.7)], 332, 14, 48, 0.58);   // v10.16 wide place shot: 1890, the bright dock, the inspector's punt under PROSPERITY's flank
  const A = FK(1560, [bod(S9PUNT, 0.0, 1.55), markBox(0.1)], 350, 3, 40, 0.64);
  const Bk = FK(1650, [bod(gangAt(7.75, 0.1)), boxAt([8.8, DECK(0.1) + 0.1, -7.4], 1.0, 0.25)], 300, 2, 38, 0.44);
  const Cc: CK = { f: 1680, pos: [7.08, -0.45, -2.9], look: [8.47, -0.86, -5.2], fov: 58 };   // the reveal: a bright 3/4 close-up of the whole mark (~45% of the width, margins round it), the water climbs to its line
  const D = FK(1716, [bod(S9INSQ, 0.4), boxAt([5.95, 0.7, -6.7], 0.55, 0.53), bod(gangAt(7.75, 0.5), 0.4)], 340, 6, 44, 0.86);   // two-shot at depth: the inspector in front, the NOT SAILING board between, the owner's breakdown on the plank
  const E: CK = { f: 1772, pos: [6.95, 0.55, -2.6], look: [8.47, -0.35, -5.3], fov: 50 };   // v10.16 payoff spectacle: the circle rises out of the water into the sun as she is unloaded (mark ~40% of the width, no character)
  const Fe: CK = { f: 1876, pos: [3.7, 1.7, -10.6], look: [7.5, 0.45, -6.4], fov: 54 };   // from the quay: the owner on his plank, Plimsoll, the circle between them above the water
  const D2: CK = { f: 1727, pos: [5.6, 1.6, -5.5], look: [7.6, 1.1, -7.2], fov: 52 };   // "stays home": snap in to the owner's breakdown (reaction close-up, ~38%)
  const path = spline([W, HOLD(W, 1540), A, HOLD(A, 1612), Bk, HOLD(Bk, 1672), Cc, HOLD(Cc, 1708), D, HOLD(D, 1720), D2, HOLD(D2, 1750), E, HOLD(E, 1846), { f: 1861, pos: [5.7, 2.7, -6.2], look: [7.4, 0.9, -6.2], fov: 52 }, Fe, HOLD(Fe, 1926)]);
  return [K(1528, F((f) => path(f), 1528, 0.0006), 24, true)];
};
SHOT_ACTS[9] = (f, s) => {
  const sy = s9Y(f), markK = sm(f, 1566, 1612), ownPos = s9Own(f), inspPos = s9Insp(f), plPos = s9Pl(f);
  const fHull = toward(9, s, f, S9PUNT, [9, -0.5, -5.35]);
  const iw = walkPath(9, s, [S9PUNT, S9INSQ], f, 1640, 1700);
  const fSign = toward(9, s, f, S9INSQ, [5.95, 0, -6.7]);
  const insp: P = f < 1614 ? { ...PZ_KNEEL, expr: "tache", facing: fHull, kneelK: 1, armR: [[30, 18 + 8 * Math.sin(markK * 12)], [60, 26 + 10 * Math.cos(markK * 12)]] as A2, tilt: 6 }
    : f < 1640 ? { expr: "tache", facing: toward(9, s, f, S9PUNT, ownPos), propR: "paintBrush", armR: AR.hipR }
    : f < 1700 ? { expr: "tache", mode: f < 1660 ? "hop" : "walk", lift: 0.5 * bump(lin(f, 1640, 1660)), phase: iw.phase, facing: iw.facing }
    : flow(f, [[1700, { expr: "tache", facing: fSign, armR: AR.stampUp, armL: [[-22, -16], [-26, -46]] as A2, armRFront: true, armLFront: true }], [1716, { expr: "tache", facing: fSign, armR: AR.stampUp, armL: [[-22, -16], [-26, -46]] as A2, armRFront: true, armLFront: true }, 3], [1724, { expr: "tache", facing: fSign, armR: AR.stampDown, armL: [[-24, 6], [-30, 20]] as A2, armRFront: true, armLFront: true }, 2], [1760, { expr: "tache", facing: toward(9, s, f, S9INSQ, ownPos), armR: AR.hipR }, 6]]) as P;
  const fRail = toward(9, s, f, ownPos, [9.2, 0, -7.4]);
  const ow = walkPath(9, s, [S9OWNQ, [6.05, 0.1, -7.4], gangAt(7.75, 0.1)], f, 1618, 1648);
  const own: P = f >= 1618 && f < 1648 ? { expr: "tacheUp", mode: "walk", phase: ow.phase, facing: ow.facing, armR: AR.hipR, armL: AR.hipL } : f < 1856 ? flow(f, [
    [1600, { expr: "tacheUp", facing: fRail, armR: AR.hipR, armL: AR.hipL }],
    [1654, { expr: "tacheUp", facing: fRail, armR: ARMS.reachR, armRFront: true, tilt: 4 }, 3],          // pats (1658)
    [1662, { expr: "tacheUp", facing: fRail, armR: [[30, 6], [52, 6]] as A2, armRFront: true, tilt: 3 }, 3],
    [1668, { expr: "tacheUp", facing: fRail, armR: ARMS.reachR, armRFront: true, tilt: 4 }, 3],
    [1690, { expr: "worry", facing: -fRail, look: 0.4 }, 4],
    [1722, { expr: "breakdown", facing: -fRail, tilt: -6, hatLift: 0.25 }, 2],         // NOT SAILING: his hat pops
    [1736, { expr: "worry", facing: -fRail, tilt: 0, hatLift: 0 }, 6],                             // ...and lands back
    [1790, { expr: "sheepish", facing: -fRail, armR: AR.shrugR, armL: AR.shrugL }, 6],
  ]) as P : speak(f, 1883, 1898, flow(f, [
    [1856, { expr: "sheepish", facing: fRail, armR: ARMS.reachR, armRFront: true }],
    [1864, { expr: "smile_closed", facing: fRail, armR: [[30, 6], [52, 6]] as A2, armRFront: true }, 3],
    [1872, { expr: "smile", facing: fRail, armR: ARMS.reachR, armRFront: true }, 3],
    [1900, { expr: "sheepish", facing: -fRail, armR: AR.shrugR, armL: AR.shrugL, sweat: 1 }, 4],    // "she has to"
  ]) as P);
  const pw = f < 1800 ? walkPath(9, s, [S9PL, S9PLQ], f, 1732, 1764) : walkPath(9, s, [S9PLQ, S9PL2], f, 1846, 1872);
  const fPO = toward(9, s, f, plPos, ownPos);
  const pl: P = (f >= 1732 && f < 1764) || (f >= 1846 && f < 1872) ? { expr: "smile", mode: "walk", phase: pw.phase, facing: pw.facing } : flow(f, [
    [1528, { expr: "calm", facing: toward(9, s, f, S9PL, [8.5, 0, -5.1]), look: 0.6, armR: AR.hipR }],
    [1612, { expr: "proud", facing: toward(9, s, f, S9PL, [8.5, 0, -5.1]), armR: AR.tipHatR, armRFront: true }, 4],
    [1640, { expr: "calm", facing: toward(9, s, f, S9PL, ownPos), look: 0.5, armR: AR.hipR }, 6],
    [1724, { expr: "smile_closed", facing: toward(9, s, f, S9PL, ownPos), armR: AR.tipHatR, armRFront: true }, 3],
    [1764, { expr: "proud", facing: toward(9, s, f, S9PLQ, [8.5, 0, -5.1]), armR: AR.tipHatR, armRFront: true }, 4],
    [1800, { expr: "proud", facing: toward(9, s, f, S9PLQ, [8.5, 0, -5.1]), armR: AR.hipR, armL: AR.hipL }, 6],
    [1872, { expr: "smile_closed", facing: fPO, armR: AR.hipR, armL: AR.hipL }],
    [1902, { expr: "smug", facing: fPO, armR: AR.hipR, headTilt: 4 }, 4],
  ]) as P;
  const cheer = (who: string, pos: V3, i: number): CastPlace => {
    const fc = toward(9, s, f, pos, [8.5, 0, -6]);
    return C(who, pos, pose(null, f < 1764 ? { expr: "worry", facing: fc, look: 0.5 }
      : f < 1846 ? { expr: i % 2 ? "joy" : "grin", facing: fc, armR: ARF.cheer, armRFront: true, armL: i === 1 ? [[-24, -30], [-30, -66]] as A2 : AR.hipL }
      : { expr: "smile", facing: fc, armR: AR.hipR, look: 0.4 }), { idx: 40 + i });
  };
  const mk = hullPt(-0.9, 0.55, sy);
  return {
    ctl: { shipY: sy, cargo: Math.round(f < 1680 ? 18 : f < 1752 ? lerp(18, 30, lin(f, 1680, 1706)) : lerp(30, 8, lin(f, 1752, 1830))), line: 1, mark: markK, ghostMark: f >= 1680 && f < 1712 ? 1 : 0, markSun: f >= 1672 && f < 1716 ? sm(f, 1672, 1682) : f >= 1756 && f < 1850 ? sm(f, 1756, 1772) * (1 - sm(f, 1840, 1850)) : 0, punt: 1, puntZ: lerp(-5.0, 1.8, sm(f, 1652, 1676)), gang: 1, stopSign: sm(f, 1716, 1726), steam: 0.3, craneA: f < 1676 ? 0.4 : f < 1752 ? 1 : 1 - lin(f, 1752, 1830), craneH: f < 1706 ? lerp(3.2, 1.8, sm(f, 1676, 1690)) : 2.6, craneLoad: (f >= 1676 && f < 1692) || (f >= 1752 && f < 1830) ? 1 : 0 },
    cast: [
      C("inspector", inspPos, pose(null, insp), { idx: 1, air: f < 1700 }),
      C("owner", ownPos, pose(null, own), { idx: 2, air: f >= 1630 }),
      C("plimsoll", plPos, pose(null, pl), { idx: 3 }),
      cheer("sailorA", S9SA, 0), cheer("sailorB", S9SB, 1), cheer("sailorC", S9SC, 2),
    ],
    fx: fxs(f >= 1566 && f < 1612 ? sparkle("mark", [HULLX - 0.08, mk[1] + 0.2 * Math.cos(markK * 6.28), mk[2] + 0.2 * Math.sin(markK * 6.28)], (f - 1566) % 10, 0.14, "#ffffff") : null),
    focus: f < 1640 ? [inspPos[0], inspPos[1] + 1.2, inspPos[2]] : f < 1676 ? [ownPos[0], ownPos[1] + 1.5, ownPos[2]] : f < 1710 ? mk : f < 1750 ? [ownPos[0], ownPos[1] + 1.5, ownPos[2]] : f < 1764 ? [plPos[0], 1.5, plPos[2]] : f < 1850 ? mk : [ownPos[0], ownPos[1] + 1.5, ownPos[2]],
    subj: f < 1640 ? "inspector" : f < 1676 ? "owner" : f < 1710 ? null : f < 1750 ? "owner" : f < 1764 ? "plimsoll" : f < 1850 ? null : "owner",
  };
};

// lens (depth of field) per scene: the focus class at each frame
lens3([[0, DOF_MS], [150, DOF_CU, 20], [300, DOF_WS, 20], [360, DOF_CU, 16]]);
lens3([[389, DOF_WS]]);
lens3([[452, DOF_MS], [500, DOF_FS, 20]]);
lens3([[562, DOF_WS], [610, DOF_MS, 16], [740, DOF_FS, 16], [760, DOF_MS, 12]]);
lens3([[784, DOF_WS], [834, DOF_CU, 10], [872, DOF_FS, 16], [924, DOF_MS, 16], [972, DOF_CU, 16]]);
lens3([[1108, DOF_MS], [1130, DOF_CU, 10], [1200, DOF_FS, 20]]);
lens3([[1296, DOF_WS], [1392, DOF_FS, 16]]);
lens3([[1430, DOF_CU], [1470, DOF_MS, 8]]);
lens3([[1528, DOF_WS], [1556, DOF_MS, 16], [1648, DOF_MS, 16], [1716, DOF_FS, 6], [1724, DOF_CU, 6], [1756, DOF_FS, 12], [1872, DOF_MS, 20]]);
