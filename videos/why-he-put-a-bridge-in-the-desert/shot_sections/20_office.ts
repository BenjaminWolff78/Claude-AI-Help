
// =====================================================================================================================
// HOME BASE B, the sales office (scenes 3, 7, 8). Office-local marks -> desert set space with D_OFF (front faces -z).
const O_BOSS: V3 = D_OFF([-1.4, 0, -2.5]), O_SEAT: V3 = D_OFF([-1.4, 0.72, -2.5]);
void O_BOSS;
// ---- SCENE 3 (500-642) "His salesmen laughed. The whole town laughed. Then they gave him a nickname: Mister Nowhere."
// Dissolve from London: the boss is back behind his desk, feet up, hands behind his head, calm. Both salesmen fold up
// laughing beside the desk; the camera backs out through the open door to the street where four townsfolk crowd the
// doorway laughing (he stays calm in the background); it pushes back in to the desk where salesman B slaps a
// "MR. NOWHERE" plate over the PRESIDENT nameplate. The boss glances at it, smiles, says nothing.
const O3_SA: V3 = [42.65, 0, 113.55], O3_SB: V3 = [40.15, 0, 113.65], O3_SB_DESK: V3 = [40.15, 0, 112.15];
const O3_PLATE: V3 = D_OFF([-1.25, 0.9, -1.12]);
const O3_TOWN: V3[] = [[41.95, 0.02, 105.75], [41.15, 0.02, 105.45], [39.35, 0.02, 105.5], [38.55, 0.02, 105.8]];
const O3_OUT_CAM = { pos: [39.2, 1.75, 98.2] as V3, look: [40.6, 1.3, 109.0] as V3, fov: 46 };
/** the "MR. NOWHERE" plate (scene 3 desk, scene 9 parapet): brass frame, cream card, ink letters; k = pop 0..1 */
const plateCard = (key: string, pos: V3, k: number, w = 0.46, rot = 0): FxSpec | null => k <= 0.01 ? null : ({
  kind: "card", key: "plate" + key + "_" + Math.round(k * 12), pos, w: w * k, h: w * 0.34 * k, rot, cw: 300, ch: 102,
  draw: (p) => { const g = p.g; g.fillStyle = "#3a2418"; g.beginPath(); g.roundRect(0, 0, 300, 102, 12); g.fill();
    g.fillStyle = "#d9a743"; g.beginPath(); g.roundRect(7, 7, 286, 88, 9); g.fill();
    g.fillStyle = "#fff4dc"; g.beginPath(); g.roundRect(17, 16, 266, 70, 6); g.fill();
    g.font = "900 46px Georgia"; g.textAlign = "center"; g.fillStyle = "#241726"; g.fillText("MR. NOWHERE", 150, 68, 250); },
});
SHOT_CAMS[3] = () => [
  K(500, F(() => fit([body(O_SEAT, -0.7, 1.25, 0.55), body(O3_SA, 0, 2.05, 0.4), body(O3_SB, 0, 2.05, 0.4)], 210, 6, 46, 0.94), 500, 0.0022, [[504, 0.006, 10]])),
  K(538, F(() => O3_OUT_CAM, 538, 0.0026, [[554, 0.005, 8]]), 30),                                                   // backs out through the door
  K(574, F(() => fit([body(O_SEAT, -0.7, 1.25, 0.5), [O3_PLATE, -0.06, 0.12, 0.3], [[O3_PLATE[0], 0, O3_PLATE[2] - 0.3], 0, 0.1, 0.3]], 196, 4, 40, 0.86), 574, 0.0026, [[613, 0.008, 10]]), 24), // back in to the desk
];
SHOT_ACTS[3] = (f, s) => {
  const plate = sm(f, 610, 616) * (1 + 0.18 * Math.sin(lin(f, 616, 630) * Math.PI));
  const sbWalk = walkPath(3, s, [O3_SB, [39.95, 0, 112.6], O3_SB_DESK], f, 582, 604);
  const laughSA: P = { ...ACT.laugh, facing: faceTo(3, s, f, O3_SA, O_SEAT), phase: ph(f, 12) };
  const laughSB: P = { ...ACT.laugh, facing: faceTo(3, s, f, O3_SB, O_SEAT), phase: ph(f + 5, 12) };
  return {
    ctl: { dig: 0.1, site: 1, door: 1, fan: 0.8, sweat: 1, bossCar: 1, night: 0 },
    cast: [
      C("boss", O_SEAT, flow(f, [
        [500, { ...ACT.feetUp, expr: "calm", facing: -1 }],
        [544, { ...ACT.feetUp, expr: "smug", facing: -1, headTilt: 3 }, 10],
        [616, { ...ACT.feetUp, expr: "sly", facing: -1, headTilt: -6, look: 0.6 }, 6],                     // glances at the plate
        [630, { ...ACT.feetUp, expr: "calm", facing: -1, headTilt: 2 }, 8],                                  // and lets it be
      ]), { idx: 1 }),
      C("salesA", O3_SA, flow(f, [
        [500, { expr: "smug", facing: faceTo(3, s, f, O3_SA, O_SEAT), sweat: 0.6, armR: [[26, 30], [30, 52]] as A2 }],
        [502, laughSA, 6],                                                                                    // "His salesmen laughed."
        [596, { expr: "grin", facing: faceTo(3, s, f, O3_SA, O_SEAT), sweat: 0.6, armR: [[26, 20], [40, 30]] as A2 }, 10],
      ]), { idx: 2 }),
      sbWalk.moving ? C("salesB", sbWalk.p, pose(null, { mode: "stride", phase: sbWalk.phase, facing: sbWalk.facing, expr: "smug", armR: [[28, 20], [46, 18]] as A2, armRFront: true }), { idx: 3 }) :
      C("salesB", f < 590 ? O3_SB : O3_SB_DESK, flow(f, [
        [500, { expr: "grin", facing: faceTo(3, s, f, O3_SB, O_SEAT), armR: [[26, 30], [30, 52]] as A2 }],
        [504, laughSB, 6],
        [604, { expr: "smug", facing: faceTo(3, s, f, O3_SB_DESK, O_SEAT), armR: [[28, 0], [48, -24]] as A2, armRFront: true }, 6],   // winds up
        [610, { expr: "grin", facing: faceTo(3, s, f, O3_SB_DESK, O_SEAT), armR: [[28, 30], [52, 46]] as A2, armRFront: true, squash: 0.05 }, 4], // SLAP
        [622, { expr: "smug", facing: faceTo(3, s, f, O3_SB_DESK, O_SEAT), ...ACT.laugh, phase: ph(f, 12) }, 8],
      ]), { idx: 3 }),
      ...O3_TOWN.map((p, i) => C(["worker1", "painter", "worker2", "dozer"][i], p, flow(f, [
        [500, { expr: "neutral", facing: i < 2 ? 1 : -1 }],
        [536 + i * 3, { ...ACT.laugh, facing: i < 2 ? 1 : -1, phase: ph(f + i * 4, 12) }, 6],               // "The whole town laughed."
        [600, { expr: "grin", facing: i < 2 ? 1 : -1, ...PZ.pointR }, 10],
      ]), { idx: 30 + i })),
    ],
    fx: fxs(f >= 504 && f < 540 ? squiggles("laughA", [O3_SA[0], 2.3, O3_SA[2]], f, "#ffffff", 0.3) : null,
      f >= 506 && f < 540 ? squiggles("laughB", [O3_SB[0], 2.3, O3_SB[2]], f + 1, "#ffffff", 0.3) : null,
      f >= 540 && f < 586 ? squiggles("laughT", [O3_TOWN[1][0], 2.35, O3_TOWN[1][2]], f, "#ffffff", 0.36) : null,
      f >= 543 && f < 586 ? squiggles("laughT2", [O3_TOWN[2][0], 2.35, O3_TOWN[2][2]], f + 2, "#ffffff", 0.36) : null,
      plateCard("desk", O3_PLATE, Math.min(1.18, plate)),
      f >= 612 && f < 626 ? sparkle("plate", [O3_PLATE[0] - 0.2, O3_PLATE[1] + 0.12, O3_PLATE[2] - 0.05], f - 612, 0.3) : null),
    focus: f < 538 ? [O_SEAT[0], 1.5, O_SEAT[2]] : f < 574 ? [O3_TOWN[1][0], 1.5, O3_TOWN[1][2]] : [O3_PLATE[0], 1.1, O3_PLATE[2]],
    subj: f < 538 ? "salesA" : f < 574 ? "worker1" : "boss",
  };
};
lens(500, 6, 1); lens(538, 4, 24); lens(574, 8, 20);
