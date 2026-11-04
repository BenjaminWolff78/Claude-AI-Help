
// =====================================================================================================================
// SCENE 4 (642-811) the GIANT FLOOR MAP (scale gag), warm lamp light. "They numbered every stone, shipped the world's
// heaviest jigsaw puzzle across the ocean, and rebuilt it on dry sand."
// Dissolve from the inspector to the boss kneeling at toy London, painting numbers on the toy ship's granite blocks (a
// sparkle per number); he gets up and pushes the ship across the painted Atlantic (side track), a "10,000 PIECES"
// jigsaw piece pops over the cargo on "jigsaw puzzle"; the ship slips through the toy canal and up the coast; the blocks
// hop onto the toy truck, which rolls into the orange desert with the boss jogging behind to the toy bridge on toy sand.
const shipU4 = (f: number) => f < 722 ? lerp(0, SHIP_U.canalIn, sm(f, 684, 722)) : f < 740 ? lerp(SHIP_U.canalIn, SHIP_U.canalOut, lin(f, 722, 740)) : lerp(SHIP_U.canalOut, 1, sm(f, 740, 764));
const truckU4 = (f: number) => sm(f, 772, 800);
const M4_PAINT = (): V3 => { const b = worldmapBoss(0); return [b[0], b[1], b[2]]; };
const boss4 = (f: number, s: SetDef): CastPlace => {
  if (f < 676) return C("boss", M4_PAINT(), flow(f, [
    [642, { ...ACT.kneelPaint, expr: "determined", facing: screenSide(4, s, f, -1, 0), propRAng: 1.35 + 0.25 * Math.sin(f * 0.5) }],
  ]), { idx: 1 });
  if (f < 764) {
    const u = shipU4(f), p = worldmapBoss(u), sp = worldmapShip(u), fast = f >= 722;
    return C("boss", p, flow(f, [
      [676, { ...ACT.kneelPaint, expr: "determined", facing: screenSide(4, s, f, sp.dir[0], sp.dir[1]) }],
      [680, { ...ACT.push, facing: screenSide(4, s, f, sp.dir[0], sp.dir[1]), phase: ph(f, fast ? 8 : 12), expr: f >= 726 && f < 740 ? "strain" : "determined", sweat: fast ? 1 : 0.3 }, 6],
    ]), { idx: 1 });
  }
  const a = worldmapBoss(1), b = s.marks.bossTruckEnd, w = walkPath(4, s, [a, b], f, 770, 802);
  return C("boss", w.p, w.moving ? pose(null, { mode: "stride", phase: w.phase, facing: w.facing, expr: "proud", sweat: 0.5 }) : flow(f, [
    [764, { expr: "proud", facing: w.facing, sweat: 0.5 }],
    [802, { expr: "calm", facing: faceTo(4, s, f, b, s.marks.toyBridge), ...PZ.pointR }, 8],              // "...on dry sand"
  ]), { idx: 1 });
};
/** the jigsaw piece that pops over the cargo on "jigsaw puzzle" (k = 0..1 scale) */
const jigsawCard = (pos: V3, k: number): FxSpec | null => k <= 0.02 ? null : ({
  kind: "card", key: "jig_" + Math.round(k * 12), pos, w: 0.75 * k, h: 0.6 * k, rot: 0.12 * Math.sin(k * 6), cw: 250, ch: 200,
  draw: (p) => { const g = p.g; g.lineJoin = "round";
    const piece = () => { g.beginPath(); g.moveTo(30, 40); g.lineTo(95, 40); g.arc(125, 34, 24, Math.PI * 0.85, Math.PI * 0.15, false); g.lineTo(220, 40); g.lineTo(220, 85);
      g.arc(228, 112, 22, -Math.PI * 0.6, Math.PI * 0.6, false); g.lineTo(220, 180); g.lineTo(30, 180); g.lineTo(30, 135); g.arc(38, 108, 22, Math.PI * 0.6, -Math.PI * 0.6, true); g.closePath(); };
    piece(); g.fillStyle = "#241726"; g.lineWidth = 16; g.strokeStyle = "#241726"; g.stroke();
    piece(); g.fillStyle = "#ff9b3d"; g.fill();
    g.fillStyle = "#fff6e0"; g.font = "900 40px Georgia"; g.textAlign = "center"; g.fillText("10,000", 125, 112); g.font = "900 28px Georgia"; g.fillText("PIECES", 125, 150); },
});
SHOT_CAMS[4] = (s) => [
  K(642, F(() => fit([body(M4_PAINT(), 0, 1.3, 0.5), [worldmapShip(0).pos, 0, 0.35, 0.7]], 150, 18, 40, 0.82), 642, 0.0026, [[650, 0.004, 8], [662, 0.004, 8]])),
  K(678, (f) => worldmapTrack(shipU4(f), 4.1, 1.7), 22),
  K(764, F(() => fit([body(worldmapBoss(1), 0, 2.0, 0.42), body(s.marks.bossTruckEnd, 0, 2.0, 0.42), [s.marks.truckEnd, 0, 0.5, 0.6]], 0, 22, 42, 0.9), 764, 0.002), 20),
  K(796, F(() => fit([body(s.marks.bossTruckEnd, 0, 2.0, 0.4), [s.marks.toyBridge, 0, 0.18, 0.45]], 34, 26, 40, 0.86), 796, 0.0035), 14),
];
SHOT_ACTS[4] = (f, s) => {
  const sp = worldmapShip(shipU4(f));
  const jig = sm(f, 710, 718) * (1 + 0.15 * Math.sin(lin(f, 718, 730) * Math.PI)) * (1 - sm(f, 744, 752));
  return {
    ctl: { ship: shipU4(f), locks: sm(f, 724, 738), cargo: sm(f, 764, 776), truck: truckU4(f) },
    cast: [boss4(f, s)],
    fx: fxs(...[650, 662, 672].map((a, i) => sparkle("num" + i, [sp.pos[0] + 0.12 * (i - 1), sp.pos[1] + 0.32, sp.pos[2]], f - a, 0.22)),
      jigsawCard([sp.pos[0], sp.pos[1] + 0.95, sp.pos[2]], jig),
      f >= 722 && f < 764 ? speedLines([worldmapBoss(shipU4(f))[0], -0.2, worldmapBoss(shipU4(f))[2]], f, 4, 0.9, [-sp.dir[0], -sp.dir[1]]) : null,
      f >= 800 && f < 814 ? sparkle("toyBridge", [s.marks.toyBridge[0], 0.25, s.marks.toyBridge[2]], f - 800, 0.3) : null),
    focus: f < 764 ? sp.pos : f < 796 ? s.marks.truckEnd : s.marks.toyBridge,
    subj: "boss",
  };
};
lens(642, 7, 1); lens(678, 5, 20); lens(764, 5, 16); lens(796, 6, 12);
