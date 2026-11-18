// =====================================================================================================================
// "He Made Dental Visits Longer and Got Cake" (2026-11-17), master prompt v21. Plan: /home/claude/p6/checkpoints/CP2_plan.md
// Four story shots, three hard cuts (1027 spring, 1424 lab, 1594 back). Everything else is one moving camera inside the
// connected street set: glides through the windows and the partition doorway, two crane-ups over the street.
// v20/v21 acting: beats every <= 1.5 s, deliberate moves 10-20 f with overshoot + settle (flow), reactions 2-4 f with a
// smear, hand-offs = reach / grip / carry / release with armTo() (the prop changes owner where both hands are), walkers
// step (stroll / walkPath), the life layer breathes on every frame.
// Faces: Hal = calm, smile, beam, smug at the end (never shock). Vance = mock / guffaw / smug, then dismay, sheepish.
// Mae = sly, mock, then shock, joy. Pratt = strain, yikes (scream), then relief, grin.
const SW = DT.SW;
const HAL_T: V3 = [1.95, SW, -9.35];                       // Hal at the head end of the chair
const MAE: V3 = DT.MAE;
const DESK_FRONT: V3 = [-2.3, SW, -9.1];                  // a visitor at the reception desk
const VWIN: V3 = [-4.0, SW, 6.3];                          // Vance in his window
const HG: V3 = [DT.TRAY[0] - 0.16, DT.TRAY[1] + 0.13, DT.TRAY[2] - 0.08];   // the hourglass on the tray (centre)
/** the patient in the chair: k 0 sitting up .. 1 reclined; the card's origin (feet) from the hips and the roll */
const HIP_UP = 0.4, HEAD_UP = 0.45;
const recl = (k: number): { pos: V3; roll: number; head: V3 } => {
  const r = lerp(0.12, 1.0, k), hip: V3 = [lerp(3.55, 3.5, k), 0.82, -8.35];
  return { pos: [hip[0] + HIP_UP * Math.sin(r), hip[1] - HIP_UP * Math.cos(r), hip[2]], roll: r, head: [hip[0] - HEAD_UP * Math.sin(r), hip[1] + HEAD_UP * Math.cos(r), hip[2]] };
};
const patient = (who: string, k: number, o: P, idx = 5): CastPlace => { const R = recl(k); return C(who, R.pos, { mode: "sit", facing: -0.4, ...o } as FigOpts, { idx, roll: R.roll }); };
/** brushing / drilling strokes of Hal's working arm toward the patient's mouth (12 f cycle), amplitude a */
const strokeArm = (id: number, s: SetDef, f: number, a = 1): A2 => {
  const M = recl(1).head, T: V3 = [M[0] - 0.12 + 0.05 * a * Math.sin((f * 2 * Math.PI) / 12), M[1] - 0.06 + 0.03 * a * Math.cos((f * 2 * Math.PI) / 12), M[2] + 0.1];
  return armTo(id, s, f, HAL_T, T, 1, 1);
};
const CHAIR_HEAD = () => recl(1).head;

// ================================================= STORY SHOT 1 (0-1027) MORNING
// ---- cameras ----
const P1 = (): V3 => head(HAL_T), PH = (): V3 => CHAIR_HEAD();
const c1a = F((f) => { const k = 1 - Math.pow(1 - Math.min(1, f / 50), 3); return { pos: [lerp(3.05, 2.9, k), lerp(1.68, 1.5, k), lerp(-4.95, -5.75, k)] as V3, look: [2.9, 1.08, -8.9] as V3, fov: 66 }; }, 0, 0.0005);
const c1b = F(() => ({ pos: [2.75, 1.5, -6.0] as V3, look: [2.75, 1.08, -8.9] as V3, fov: 62 }), 64, 0.0011);
const STREET1 = { pos: [0.55, 1.45, -1.55] as V3, look: [-0.5, 1.2, -4.6] as V3, fov: 50 };
const c1c = F(() => STREET1, 152, 0.0011);
const BENCH1 = { pos: [3.15, 1.3, -1.55] as V3, look: [3.95, 0.95, -3.9] as V3, fov: 50 };
const c1c2 = F(() => BENCH1, 226, 0.0011);
const c1d = F(() => ({ pos: [2.35, 1.5, -6.85] as V3, look: [2.15, 1.18, -8.9] as V3, fov: 54 }), 268, 0.0011);
// crane up over the street and turn to Vance's window (330-372), then the window framing
const CRANE_TOP = { pos: [-1.2, 6.2, -1.6] as V3, look: [-3.6, 2.2, 5.2] as V3, fov: 54 };
const VANCE_W = { pos: [-3.75, 1.7, 2.6] as V3, look: [-4.0, 1.38, 6.3] as V3, fov: 46 };
const c1e = F(() => VANCE_W, 382, 0.0011, [[457, 0.008, 14]]);
const c1f = F(() => ({ pos: [-3.9, 1.75, 3.95] as V3, look: [-4.0, 1.5, 6.3] as V3, fov: 50 }), 462, 0.0011);
// crane back over the street (512-552) and down to Sal at Hal's A-board
const CRANE2 = { pos: [-0.6, 5.2, 2.2] as V3, look: [-1.6, 2.6, -5.4] as V3, fov: 56 };
const SAL_SH = { pos: [1.15, 1.35, -1.6] as V3, look: [0.5, 0.95, -4.5] as V3, fov: 50 };
const c1g = F(() => SAL_SH, 578, 0.0011);
// into the waiting room through its window (620-648) to Mae and her egg timer
const MAE_SH = { pos: [-2.35, 1.45, -7.5] as V3, look: [-2.4, 1.02, -10.2] as V3, fov: 54 };
const c1h = F(() => MAE_SH, 648, 0.0011);
// through the partition doorway into the treatment room (686-714): Pratt and Hal
const c1i = F(() => ({ pos: [2.95, 1.5, -6.2] as V3, look: [2.85, 1.13, -9.0] as V3, fov: 60 }), 720, 0.0011, [[756, 0.008, 8]]);
// pull back through the doorway (790-814) to the waiting-room wide: the runners
const RUN_SH = { pos: [-4.4, 1.6, -9.9] as V3, look: [-1.5, 1.1, -6.1] as V3, fov: 60 };
const c1j = F(() => RUN_SH, 822, 0.0011);
// back to the chair (865-892): the minty minutes
const c1k = F(() => ({ pos: [2.65, 1.42, -6.35] as V3, look: [2.55, 1.1, -8.9] as V3, fov: 62 }), 894, 0.0011);
// follow Pratt to the desk (950-1000), then the book two-shot
const BOOK_SH = { pos: [-0.4, 1.7, -9.35] as V3, look: [-2.2, 0.95, -9.75] as V3, fov: 56 };
const c1l = F(() => BOOK_SH, 1014, 0.0011);
SHOT_CAMS[1] = () => [K(0, c1a, 1, true),
  K(112, glideTo(c1a, 112, c1c, 152, 0.25, [0.6, 0, 0], 0.15), 1),                 // out through the treatment window
  K(198, glideTo(c1c, 198, c1c2, 226, 0.05), 1),                                    // slide to the woman with the ice pack
  K(240, glideTo(c1c2, 240, c1d, 268, 0.2, [0.3, 0, 0]), 1),                        // back in
  K(328, glideTo(c1d, 328, () => CRANE_TOP, 356, 0, [0.4, 0, 0]), 1),               // crane up over the street, turning south
  K(356, glideTo(() => CRANE_TOP, 356, c1e, 382, 0), 1),                             // down to Vance's window
  K(512, F(() => CRANE2, 512, 0.0011), 1, true),                                      // hard cut on the new sentence: the whole street from above
  K(544, glideTo(F(() => CRANE2, 512, 0.0011), 544, c1g, 578, 0), 1),                                  // down to Sal and the A-board
  K(620, glideTo(c1g, 620, c1h, 648, 0.1, [-1.3, 0, 0]), 1),                           // through the waiting-room window
  K(684, glideTo(c1h, 684, c1i, 720, 0.05, [0, 0, -2.2], 0, 0.3), 1),                          // through the partition doorway
  K(784, glideTo(c1i, 784, c1j, 822, 0.05, [0, 0, -1.3], 0, 0.3), 1),                          // back out through the doorway
  K(862, glideTo(c1j, 862, c1k, 894, 0.05, [0, 0, -1.3], 0, 0.6), 1),                  // back to the chair
  K(986, glideTo(c1k, 986, c1l, 1014, 0.05, [0, 0, 0], 0, 0.3), 1)];                                     // through the doorway to the desk
KEY_PUNCH.push(758, 1000);

SHOT_ACTS[1] = (f, s) => {
  const cast: CastPlace[] = [], fx: (FxSpec | null)[] = [];
  const ctl: Ctl = { bagCake: f < 76 ? 1 : 0, bagOn: f < 240 ? 1 : 0, hg: 0, hgK: 0.15, lampOn: 1, chalk: 0, egg: 0, book: 0, mag: 0, wallN: 18, hDoor: 0, bell: 0, ph1: 0, ph2: 0, deskCake: 0, tv: 0 };
  // ---------------- 0-240: Dot and the cake; then the treatment room stays alive while the camera is outside ----------------
  if (f < 240) {
    // Dot: reclined, eyes closed in bliss, then sits up (58-74), reaches down into her tote (66-76), grips the cake (76),
    // lifts it (76-90), holds it out to Hal (90-100); Hal grips at 102; Dot lets go and claps (104-120)
    const up = sm(f, 56, 76), R = recl(1 - up), dotP = R.pos;
    const bagT: V3 = [DT.BAG[0] - 0.05, 0.5, DT.BAG[2] + 0.05], GIVE: V3 = [2.7, 1.08, -8.5], LIFT: V3 = [3.35, 1.0, -8.3];
    const dP = (g: number) => recl(1 - sm(g, 56, 76)).pos;
    const dotArmR = armSeq(f, [[0, fixA([[20, 22], [32, 44]])], [62, (g) => armTo(1, s, g, dP(g), bagT, 1, -0.6, 1, "sit"), 12], [76, (g) => armTo(1, s, g, dP(g), lerp3(bagT, LIFT, sm(g, 76, 90)), 1, -0.6, 1, "sit"), 2],
      [90, (g) => armTo(1, s, g, dP(g), lerp3(LIFT, GIVE, sm(g, 90, 100)), 1, -0.6, 1, "sit"), 2], [104, fixA([[20, 10], [26, -10]]), 12]]);
    const dot = C("dot", dotP, flow(f, [
      [0, { expr: "relief", mode: "sit", facing: -0.4, headTilt: -4, armR: [[20, 22], [32, 44]] as A2, armL: [[-20, 22], [-32, 44]] as A2 }],
      [32, { expr: "smile_closed", mode: "sit", facing: -0.4, headTilt: 3, armL: [[-22, 18], [-30, 36]] as A2 }, 12],
      [62, { expr: "joy", mode: "sit", facing: -0.4, headTilt: 0 }, 10],
      [104, { expr: "beam", mode: "sit", facing: -0.6, armL: [[-18, 6], [-6, -14]] as A2 }, 10],
      [150, { expr: "smile", mode: "sit", facing: -0.6, headTilt: 4, armL: [[-20, 16], [-24, 30]] as A2 }, 14],
    ]), { idx: 5, roll: R.roll });
    dot.o = { ...dot.o, armR: dotArmR, armRFront: true, propR: f >= 76 && f < 102 ? "cake" : undefined } as FigOpts;
    cast.push(dot);
    // Hal: polishing strokes (0-50), glances at the clock (44), turns to Dot (60), reaches for the cake (92-102), grips (102),
    // lifts it to his chest beaming (102-122), sets it on the counter behind him later (off camera)
    const halArm: A2 = armSeq(f, [[0, (g) => strokeArm(1, s, g, 1 - sm(g, 46, 56))], [56, fixA([[24, 8], [36, -6]]), 10], [90, (g) => armTo(1, s, g, HAL_T, lerp3([2.4, 1.2, -8.9], GIVE, sm(g, 90, 102)), 1, 1), 10], [104, fixA([[22, 14], [30, 2]]), 12]]);
    const hal = C("hal", HAL_T, flow(f, [
      [0, { expr: "calm", facing: 1, tilt: 6, headTilt: -3 }],
      [20, { expr: "smile", facing: 1, tilt: 7, headTilt: 3 }, 10],
      [44, { expr: "smile", facing: 0.4, tilt: 2, headTilt: -2, look: -0.5 }, 10],    // glances up at the clock
      [62, { expr: "smile", facing: 1, tilt: 3, look: 0 }, 10],
      [104, { expr: "beam", facing: 0.6, tilt: -2, headBack: 0.3 }, 12],
      [150, { expr: "smile", facing: 0.8, tilt: 0 }, 14],
    ]), { idx: 1 });
    hal.o = { ...hal.o, armR: halArm, armRFront: true, propR: f < 56 ? "mintBrush" : f >= 102 ? "cake" : undefined } as FigOpts;
    cast.push(hal);
  }
  // ---------------- 112-240: the street with toothaches ----------------
  if (f >= 100 && f < 260) {
    // the scarf man walks to Hal's door (150-172), reaches for the handle (172-182), BZZ from Vance's window (184),
    // yanks his hand back (186-189, smear), backs off and hurries west (194-240)
    const DOOR: V3 = [-0.6, SW, -4.75];
    const wIn = walkPath(1, s, [[2.5, SW, -4.3], [-0.2, SW, -4.05], DOOR], f, 130, 172);
    const wOut = walkPath(1, s, [DOOR, [-2.6, SW, -4.1], [-6.0, SW, -4.2]], f, 196, 250);
    const manP = f < 194 ? wIn.p : wOut.p;
    const handle: V3 = [-0.45, 1.05, -5.45];
    const manArm: A2 = armSeq(f, [[0, fixA([[24, 18], [30, 36]])], [172, (g) => armTo(1, s, g, DOOR, lerp3([-0.4, 1.0, -5.0], handle, sm(g, 172, 182)), 1, -1), 10], [186, fixA([[22, 4], [16, -18]]), 3]]);
    const man = C("ache1", manP, f < 172 ? pose(null, { expr: "pained", mode: "walk", phase: wIn.phase, facing: wIn.facing, armL: [[-14, 8], [6, -16]] as A2, armLFront: true })
      : f < 194 ? flow(f, [
        [172, { expr: "nervous", facing: -1, armL: [[-14, 8], [6, -16]] as A2, armLFront: true }],
        [186, { expr: "yikes", facing: -1, tilt: 8, headBack: 0.6, armL: [[-14, 8], [6, -16]] as A2, armLFront: true }, 3],    // the BZZ
        [190, { expr: "aghast", facing: -1, tilt: 4, headBack: 0.2, armL: [[-14, 8], [6, -16]] as A2, armLFront: true }, 6],
      ]) : pose(null, { expr: "aghast", mode: "walk", phase: wOut.phase, facing: wOut.facing, armL: [[-14, 8], [6, -16]] as A2, armLFront: true }), { idx: 20 });
    man.o = { ...man.o, armR: manArm, armRFront: true } as FigOpts;   // left hand holds the sore jaw throughout
    cast.push(man);
    if (f >= 186 && f < 190) fx.push(smear("man", handAt(1, s, f, manP, (manArm as A2)[1], 1, -1), handle));
    if (f >= 184 && f < 200) fx.push(...fxs(bzz([-3.2, 2.4, 5.4], f - 184)));
    // the woman on the bench with the ice pack: rocks, winces (215), switches cheek pressure
    const wb = Math.sin(f * 0.2);
    cast.push(C("ache2", [4.0, SW, -3.85], flow(f, [
      [100, { expr: "pained", mode: "sit", facing: -0.6, tilt: 3 * wb, propR: "icePack", armR: [[18, -10], [12, -40]] as A2, armRFront: true }],
      [212, { expr: "yikes", mode: "sit", facing: -0.6, tilt: -4, headBack: 0.4, propR: "icePack", armR: [[18, -12], [10, -44]] as A2, armRFront: true }, 3],
      [218, { expr: "pained", mode: "sit", facing: -0.6, tilt: 2 * wb, propR: "icePack", armR: [[18, -10], [12, -40]] as A2, armRFront: true }, 8],
    ]), { idx: 21 }));
    // a kid with a bandaged jaw walks by with his mother's hand... (a kid alone, holding his cheek), crossing behind
    const kid = walkPath(1, s, [[-4.8, SW, -3.4], [3.0, SW, -3.3]], f, 120, 236);
    cast.push(C("ache3", kid.p, pose(null, { expr: "pained", mode: kid.moving ? "walk" : "stand", phase: kid.phase, facing: kid.facing, armR: [[16, 6], [6, -18]] as A2, armRFront: true }), { idx: 22 }));
  }
  // ---------------- 240-330: Hal adds the three minutes: flips the hourglass, squeezes the paste, over Gus ----------------
  if (f >= 200 && f < 400) {
    cast.push(patient("gus", 1, flow(f, [[200, { expr: "nervous", mode: "sit", facing: -0.4 }], [306, { expr: "relief", mode: "sit", facing: -0.4, headTilt: -4 }, 12]]), 6));
    // reach for the hourglass (262-272), grip (272), flip on the tray (272-288; the world glass turns with the hand),
    // release (290), reach for the paste (292-300), squeeze it onto the brush (300-316), smile at Gus (318)
    const hgTop: V3 = [HG[0], HG[1] + 0.1, HG[2] + 0.05], flip = sm(f, 272, 288);
    const handT = (f: number): V3 => f < 262 ? [2.2, 1.25, -9.0] : f < 272 ? lerp3([2.2, 1.25, -9.0], hgTop, sm(f, 262, 272)) : f < 290 ? [HG[0] + 0.08 * Math.sin(Math.PI * flip), HG[1] + 0.1 + 0.1 * Math.sin(Math.PI * flip), HG[2] + 0.05]
      : f < 300 ? lerp3(hgTop, [2.5, 1.12, -8.2], sm(f, 290, 300)) : f < 318 ? [2.5, 1.18 + 0.02 * Math.sin(f * 0.9), -8.2] : lerp3([2.5, 1.18, -8.2], [2.4, 1.3, -8.9], sm(f, 318, 332));
    const hal = C("hal", HAL_T, flow(f, [
      [200, { expr: "calm", facing: 1, tilt: 2 }],
      [258, { expr: "smile", facing: 0.6, tilt: 8, headTilt: 4 }, 12],
      [290, { expr: "calm", facing: 0.8, tilt: 6 }, 10],
      [318, { expr: "smile", facing: 1, tilt: 4, headTilt: -3 }, 12],
      [360, { expr: "smile", facing: 1, tilt: 7 }, 14],
    ]), { idx: 1 });
    hal.o = { ...hal.o, armR: armSeq(f, [[200, (g) => armTo(1, s, g, HAL_T, handT(g), 1, 0.6)], [340, (g) => strokeArm(1, s, g, 0.6), 10]]), armRFront: true, propR: f >= 300 ? "mintBrush" : undefined, propL: f >= 296 && f < 322 ? "pasteTube" : undefined,
      armL: armSeq(f, [[200, fixA(HANG(-1))], [286, (g) => armTo(1, s, g, HAL_T, [2.45, 1.26 - 0.03 * sm(g, 300, 316), -8.2], -1, 0.6), 10], [324, fixA(HANG(-1)), 12]]), armLFront: true } as FigOpts;
    cast.push(hal);
    ctl.hg = 0.5 * flip; ctl.hgK = f < 272 ? 0.12 : f < 290 ? 0.12 : lerp(0.95, 0.75, lin(f, 290, 400));
  }
  // ---------------- 330-512: Vance in his window laughs, the mask drops, the two drills ----------------
  if (f >= 330 && f < 560) {
    const sc = sm(f, 360, 372);
    // laugh beats: points (366), head back (380), slaps the window frame (396), the mask slips (412-420), he grabs at it
    // (430), reaches for the second drill on the stand (440-452), drills up for the line (462), waggles (488), smug (500)
    const v0: P = { expr: "smug", facing: -0.6, maskDrop: 0, armR: [[20, 20], [30, 36]] as A2, armL: [[-20, 20], [-30, 36]] as A2 };
    const beats: [number, P, number?][] = [
      [330, v0],
      [374, { expr: "mock", facing: -0.8, maskDrop: 0, armR: AR.pointR, armRFront: true }, 12],
      [388, { ...laughP(f, 388, 1), facing: -0.6, maskDrop: 0, headBack: 1.0, armR: [[24, 8], [40, 18]] as A2, armL: [[-24, 8], [-40, 18]] as A2 }, 10],
      [402, { ...laughP(f, 402, 0), facing: -0.6, maskDrop: 0, tilt: 14, armR: [[28, -4], [52, 4]] as A2, armRFront: true }, 6],          // slaps the frame
      [416, { ...laughP(f, 416, 1), facing: -0.6, maskDrop: 1, tilt: 6, headBack: 0.8 }, 10],                                             // the mask slips off one ear
      [432, { expr: "dismay", facing: -0.6, maskDrop: 1, tilt: 0, headBack: 0, armR: [[22, -4], [14, -32]] as A2, armRFront: true }, 8],     // grabs at it
      [440, { expr: "smug", facing: -0.8, maskDrop: 1, armR: [[24, 8], [40, 14]] as A2, propR: "drill", propL: f >= 452 ? "drill" : undefined, armL: [[-26, 10], [-44, 22]] as A2, armLFront: true }, 12],
      [460, { expr: "mock", facing: -0.4, maskDrop: 1, armR: [[22, -10], [34, -40]] as A2, armL: [[-22, -10], [-34, -40]] as A2, propR: "drill", propL: "drill", armRFront: true, armLFront: true }, 10],
      [486, { expr: "guffaw", facing: -0.3, maskDrop: 1, tilt: 4, armR: [[24, -14], [38 + 4 * Math.sin(f * 1.3), -46]] as A2, armL: [[-24, -14], [-38 - 4 * Math.sin(f * 1.3), -46]] as A2, propR: "drill", propL: "drill", armRFront: true, armLFront: true }, 8],
      [500, { expr: "smug", facing: -0.4, maskDrop: 1, tilt: -3, armR: [[24, -6], [36, -30]] as A2, armL: [[-24, -6], [-36, -30]] as A2, propR: "drill", propL: "drill", armRFront: true, armLFront: true }, 10],
    ];
    cast.push(C("vance", VWIN, speak(f, 457, 510, flow(f, beats as Beat[])), { idx: 2 }));
    void sc;
    if (f >= 486 && f < 512) fx.push(...fxs(bzz([VWIN[0] + 0.3, 1.9, VWIN[2] - 0.5], (f - 486) % 12)));
  }
  // ---------------- 512-686: the street calls him Doctor Slowpoke; Mae's egg timer ----------------
  if (f >= 512 && f < 700) {
    // Sal crouches at the A-board and chalks (548-596; the letters appear with each stroke), stands back (596-610), admires it
    const ABD: V3 = DT.ABOARD, salP: V3 = [ABD[0] + 0.55, SW, ABD[2] + 0.25];
    const chalkPt = (g: number): V3 => [ABD[0] - 0.15 + 0.3 * lin(g, 548, 596) + 0.04 * Math.sin(g * 0.9), 0.62 + 0.12 * Math.sin(g * 0.45), ABD[2] + 0.18];
    const sal = C("sal", salP, flow(f, [
      [512, { expr: "sly", facing: -1, tilt: 10 }],
      [540, { expr: "sly", facing: -1, tilt: 22 }, 12],
      [596, { expr: "smug", facing: -0.6, tilt: -2, headBack: 0.3 }, 14],
      [630, { ...laughP(f, 630, 0), facing: -0.6 }, 10],
    ]), { idx: 30 });
    sal.o = { ...sal.o, armR: armSeq(f, [[512, fixA([[20, 10], [30, 0]])], [538, (g) => armTo(1, s, g, salP, chalkPt(g), 1, -1), 12], [600, fixA([[22, 10], [34, -6]]), 12]]), armRFront: true, propR: "chalk", armL: [[-26, 14], [-12, 28]] as A2 } as FigOpts;
    cast.push(sal);
    ctl.chalk = lin(f, 548, 596);
    // the baker in his doorway points (558) and laughs (574); a passer-by laughs too (582)
    cast.push(C("hbaker", [7.6, SW, -4.9], flow(f, [
      [512, { expr: "grin", facing: -1, armR: AR.hipR }],
      [556, { expr: "mock", facing: -1, armL: AB.pointL, armLFront: true }, 10],
      [574, { ...laughP(f, 574, 1), facing: -1, armR: [[24, 10], [36, 24]] as A2, armL: [[-24, 10], [-36, 24]] as A2 }, 10],
    ]), { idx: 31 }));
    const pb = walkPath(1, s, [[-9.0, SW, -4.15], [-3.5, SW, -4.2]], f, 520, 600);
    cast.push(C("wait2", pb.p, pb.moving ? pose(null, { expr: "smile", mode: "walk", phase: pb.phase, facing: pb.facing }) : flow(f, [[600, { expr: "smile", facing: 1 }], [604, { ...laughP(f, 604, 0), facing: 1 }, 10]]), { idx: 32 }));
  }
  if (f >= 600 && f < 1100) {
    // Mae at the desk: twists the egg timer (640-652; her hand turns the dial), sets it (656), taps it with her pen three
    // times (662, 668, 674), rolls her eyes toward the treatment room (676); later she ducks (790) and peeks (855), holds
    // the pen out to Pratt (978), lets go (992), her jaw drops at the book (1000)
    const egg: V3 = [DT.EGG[0], DT.EGG[1] + 0.15, DT.EGG[2] + 0.05];
    const twist = sm(f, 640, 652), tap = (g: number) => Math.max(0, ...[662, 668, 674].map((t) => bump((g - t) / 5)));
    const penOut: V3 = [-1.85, 0.98, -9.5];
    const maeArmR: A2 = armSeq(f, [[600, fixA([[18, 10], [26, -6]])], [630, (g) => armTo(1, s, g, MAE, lerp3([-2.35, 0.98, -10.15], [egg[0] + 0.03, egg[1], egg[2]], sm(g, 630, 640)), 1, 0.4, 1, "sit"), 8],
      [656, (g) => armTo(1, s, g, MAE, [egg[0] + 0.12, egg[1] + 0.12 - 0.08 * tap(g), egg[2]], 1, 0.4, 1, "sit"), 6], [680, fixA([[18, 10], [26, -6]]), 10],
      [980, (g) => armTo(1, s, g, MAE, lerp3([-2.0, 0.95, -10.2], penOut, sm(g, 980, 992)), 1, 0.6, 1, "sit"), 10], [996, fixA([[20, 14], [24, 2]]), 10]]);
    const mae = C("mae", MAE, flow(f, [
      [600, { expr: "sly", mode: "sit", facing: 0.3 }],
      [640, { expr: "sly", mode: "sit", facing: 0.2, tilt: 4, headTilt: -4 }, 10],
      [676, { expr: "mock", mode: "sit", facing: 0.8, look: 0.8, headTilt: 6 }, 8],
      [760, { expr: "yikes", mode: "sit", facing: 0.6, headBack: 0.6, tilt: -4 }, 3],
      [770, { expr: "dismay", mode: "sit", facing: 0.6, tilt: 0 }, 10],
      [800, { expr: "aghast", mode: "sit", facing: 0.8, tilt: 18 }, 6],
      [852, { expr: "nervous", mode: "sit", facing: 0.4, tilt: 4 }, 12],
      [960, { expr: "neutral", mode: "sit", facing: 0.6 }, 10],
      [1004, { expr: "shock", mode: "sit", facing: 0.6, headBack: 0.4 }, 4],
      [1016, { expr: "shock", mode: "sit", facing: 0.6, headBack: 0.2, tilt: 3 }, 10],
    ]), { idx: 3 });
    mae.o = { ...mae.o, armR: maeArmR, armRFront: true, propR: f < 996 || f >= 1100 ? "pen" : undefined } as FigOpts;
    cast.push(mae);
    ctl.egg = 0.5 * twist; ctl.eggOn = 1;
  }
  // ---------------- 686-952: Pratt screams; the waiting room empties; the minty minutes ----------------
  if (f >= 680 && f < 960) {
    // Pratt reclined: grips the armrests (720), eyes bulge (740), SCREAMS (758-792, head back, legs kick), then during the
    // minty minutes his face melts: fists open (905), a long sigh and a smile (925)
    const pr = patient("pratt", 1, flow(f, [
      [680, { expr: "nervous", mode: "sit", facing: -0.4, armR: [[22, 16], [34, 30]] as A2, armL: [[-22, 16], [-34, 30]] as A2 }],
      [718, { expr: "strain", mode: "sit", facing: -0.4, armR: [[24, 12], [38, 26]] as A2, armL: [[-24, 12], [-38, 26]] as A2, sweat: 1 }, 10],
      [738, { expr: "aghast", mode: "sit", facing: -0.3, sweat: 1 }, 6],
      [756, { expr: "yikes", mode: "sit", facing: -0.2, headBack: 1, tilt: -6, armR: [[30, -10], [44, -40]] as A2, armL: [[-30, -10], [-44, -40]] as A2, feetUp: 0.6, sweat: 1 }, 3],
      [770, { expr: "yikes", mode: "sit", facing: -0.2, headBack: 0.8, tilt: 4 + 4 * Math.sin(f * 1.4), armR: [[30, -12], [46, -42]] as A2, armL: [[-30, -12], [-46, -42]] as A2, feetUp: 0.4 + 0.3 * Math.sin(f * 1.1), sweat: 1 }, 4],
      [794, { expr: "dazed", mode: "sit", facing: -0.4, headBack: 0, tilt: 0, armR: [[22, 16], [34, 30]] as A2, armL: [[-22, 16], [-34, 30]] as A2, feetUp: 0 }, 12],
      [880, { expr: "strain", mode: "sit", facing: -0.4, armR: [[24, 12], [38, 26]] as A2, armL: [[-24, 12], [-38, 26]] as A2 }, 10],
      [903, { expr: "relief", mode: "sit", facing: -0.4, armR: [[20, 20], [30, 40]] as A2, armL: [[-20, 20], [-30, 40]] as A2 }, 16],
      [924, { expr: "smile_closed", mode: "sit", facing: -0.4, headTilt: -5, tilt: -2 }, 14],
    ]), 7);
    cast.push(pr);
    if (f >= 756 && f < 794) fx.push(...fxs(shout(add3(recl(1).head, -0.1, 0.25, 0.1), f - 756)));
    // Hal drills (720-790; drill strokes, a little water spray), then the minty brush (880-950), hourglass flip at 880
    const hg2 = sm(f, 878, 892);
    const hal = C("hal", HAL_T, flow(f, [
      [680, { expr: "calm", facing: 1, tilt: 6 }],
      [756, { expr: "nervous", facing: 1, tilt: 2, headBack: 0.3 }, 4],
      [770, { expr: "sheepish", facing: 0.8, tilt: 4 }, 10],
      [870, { expr: "calm", facing: 1, tilt: 8, headTilt: 3 }, 12],
      [905, { expr: "smile", facing: 1, tilt: 8, headTilt: -3 }, 12],
      [930, { expr: "smile", facing: 0.7, tilt: 5, headTilt: 4 }, 14],
    ]), { idx: 1 });
    const hgT = (g: number): V3 => g < 878 ? lerp3([2.6, 1.2, -8.8], [HG[0], HG[1] + 0.1, HG[2] + 0.05], sm(g, 868, 878)) : [HG[0] + 0.08 * Math.sin(Math.PI * sm(g, 878, 892)), HG[1] + 0.1 + 0.1 * Math.sin(Math.PI * sm(g, 878, 892)), HG[2] + 0.05];
    const hArm: A2 = armSeq(f, [[680, (g) => strokeArm(1, s, g, g < 756 ? 0.7 : 0.25)], [866, (g) => armTo(1, s, g, HAL_T, hgT(g), 1, 0.6), 10], [892, (g) => strokeArm(1, s, g, 0.5), 10]]);
    hal.o = { ...hal.o, armR: hArm, armRFront: true, propR: f < 868 ? "drill" : f >= 892 ? "mintBrush" : undefined } as FigOpts;
    if (f < 950) cast.push(hal);
    ctl.hg = 0.5 + 0.5 * hg2; ctl.hgK = f < 878 ? lerp(0.75, 0.05, lin(f, 400, 878)) : lerp(0.95, 0.6, lin(f, 892, 1027));
    // the waiting room: three patients jump up (798-802) and run out the door (804-850), magazine falls, door bell swings
    const chairs: V3[] = [[-5.7, SW, -6.45], [-4.65, SW, -6.45], [-3.6, SW, -6.45]];
    ["wait1", "wait2", "wait3"].forEach((w, i) => {
      const t0 = 800 + i * 4, A0 = chairs[i];
      if (f < t0) { cast.push(C(w, A0, flow(f, [[680, { expr: "nervous", mode: "sit", facing: 0.2 + 0.2 * i, propR: i === 1 ? "mag" : undefined, armR: i === 1 ? [[18, 10], [26, -4]] as A2 : undefined, armRFront: true }], [758, { expr: "aghast", mode: "sit", facing: 0.6, headBack: 0.5, tilt: -4 }, 3]]), { idx: 40 + i })); return; }
      const run = walkPath(1, s, [A0, [A0[0] + 0.5, SW, -6.95], [-0.85, SW, -6.6], [-0.85, SW, -5.2], [-0.4, SW, -3.6]], f, t0 + 2, t0 + 44);
      cast.push(C(w, run.p, f < t0 + 3 ? pose(null, { expr: "yikes", facing: run.facing, headBack: 0.6, armR: [[26, -16], [36, -44]] as A2, armL: [[-26, -16], [-36, -44]] as A2 }) : pose(null, { expr: "yikes", mode: run.moving ? "run" : "stand", phase: ph(f + i * 5, 10), facing: run.facing, armR: [[26, -10], [34, -34]] as A2, armL: [[-26, -10], [-34, -34]] as A2 }), { idx: 40 + i }));
    });
    ctl.mag = sm(f, 804, 826); ctl.hDoor = sm(f, 820, 830) * (1 - sm(f, 852, 866)); ctl.bell = f > 822 && f < 870 ? 1 - lin(f, 822, 870) : 0;
    if (f >= 800 && f < 804) fx.push(smear("w2", [-4.65, 1.2, -6.45], [-4.4, 1.6, -6.7]));
  }
  // ---------------- 940-1027: Pratt sits up, hops down, walks to the desk, takes Mae's pen, writes ----------------
  if (f >= 940) {
    const upK = 1 - sm(f, 940, 956);
    if (f < 962) { const R = recl(upK); cast.push(C("pratt", R.pos, flow(f, [[940, { expr: "smile_closed", mode: "sit", facing: -0.4 }], [950, { expr: "grin", mode: "sit", facing: -0.6, armR: [[22, 6], [16, -16]] as A2, armRFront: true }, 10]]), { idx: 7, roll: R.roll })); }
    else {
      const w = walkPath(1, s, [[3.0, SW, -8.2], [1.2, SW, -8.6], [0.0, SW, -9.0], [-1.0, SW, -9.3], DESK_FRONT], f, 962, 990);
      const penOut: V3 = [-1.7, 0.98, -9.55];
      const pArm: A2 = armSeq(f, [[962, fixA([[20, 6], [14, -14]])], [986, (g) => armTo(1, s, g, DESK_FRONT, lerp3([-2.0, 0.95, -9.35], penOut, sm(g, 986, 996)), 1, 0.6), 10], [998, (g) => armTo(1, s, g, DESK_FRONT, [-1.6 - 0.05 * Math.sin(g * 0.8), 0.88, -9.62 + 0.03 * Math.cos(g * 0.8)], 1, 0.6), 4]]);
      const p0 = w.moving ? pose(null, { expr: "grin", mode: "walk", phase: w.phase, facing: w.facing })
        : flow(f, [[990, { expr: "grin", facing: -0.6, tilt: 6 }], [1006, { expr: "smile", facing: -0.6, tilt: 10, headTilt: -4 }, 12]]);
      const pr = C("pratt", w.p, p0, { idx: 7 });
      pr.o = { ...pr.o, armR: pArm, armRFront: true, propR: f >= 996 ? "pen" : undefined } as FigOpts;
      cast.push(pr);
    }
    ctl.book = lin(f, 998, 1022);
  }
  // Hal waves Pratt off from the doorway (990-1027)
  if (f >= 950 && f < 1030) cast.push(C("hal", HAL_T, flow(f, [[950, { expr: "smile", facing: 0.6 }], [966, { expr: "beam", facing: -0.8, armR: AR.waveR, armRFront: true }, 12], [980, { expr: "beam", facing: -0.8, armR: [[26, -18], [44, -42]] as A2, armRFront: true }, 8], [994, { expr: "smile", facing: -0.6 }, 12]]), { idx: 1 }));
  const focus = follow(f, [[0, P1()], [62, lerp3(P1(), PH(), 0.5), 10], [150, [-0.55, 1.3, -4.6], 30], [222, [4.0, 0.95, -3.85], 18], [268, HG, 20], [372, head(VWIN), 14], [575, [DT.ABOARD[0], 0.7, DT.ABOARD[2]], 20],
    [648, [(DT.EGG[0] + DT.MAE[0]) / 2, 1.25, (DT.EGG[2] + DT.MAE[2]) / 2], 20], [714, PH(), 20], [814, [-3.6, 1.2, -6.4], 18], [892, PH(), 20], [958, [0.6, 1.2, -9.2], 16], [990, [-1.9, 1.2, -9.3], 14]]);
  return { ctl, cast, fx: fx.filter(Boolean) as FxSpec[], focus, subj: f < 112 ? "hal" : f < 205 ? "ache1" : f < 240 ? "ache2" : f < 330 ? "hal" : f < 512 ? "vance" : f < 620 ? "sal" : f < 686 ? "mae" : f < 790 ? "pratt" : f < 865 ? null : f < 952 ? "pratt" : "pratt" };
};
lens3([[0, B_MS], [152, B_FS, 20], [268, B_MS, 20], [340, B_WS, 12], [372, B_MS, 14], [468, B_CU, 10], [520, B_WS, 16], [575, B_MS, 16], [648, B_MS, 16], [714, B_MS, 16], [814, B_FS, 14], [892, B_CU, 16], [1000, B_MS, 20]]);

// ================================================= STORY SHOT 2 (1027-1424) SPRING
const LANE: V3[] = [[6.5, SW, -4.45], [2.0, SW, -4.15], [-0.6, SW, -4.0], [-0.87, SW, -5.6], [-0.87, SW, -6.6]];
const c2a = F(() => ({ pos: [2.2, 1.5, -1.2] as V3, look: [0.3, 1.2, -4.6] as V3, fov: 56 }), 1027, 0.0011);
const VSIT: V3 = [-4.6, SW, 7.5];
const c2b = F(() => frameOn(head(VSIT, 0.85), 180, 0.2, 46, 48, 0.25, 0.42), 1134, 0.0011);
const DRAWER_SH = { pos: [2.95, 1.4, -9.55] as V3, look: [2.45, 1.0, -11.4] as V3, fov: 52 };
const c2c = F(() => DRAWER_SH, 1182, 0.0011);
const boardX = (f: number) => lerp(1.6, 2.8, sm(f, 1214, 1330));
const c2d = (f: number): Shot => ({ pos: [boardX(f), 1.12, -8.75], look: [boardX(f), 1.38, -11.9], fov: 60, roll: 0 });
const TV_SH = { pos: [-1.75, 2.05, -7.0] as V3, look: [-0.08, 2.18, -6.9] as V3, fov: 46 };
const BENCH_SH = { pos: [-2.7, 1.55, -7.7] as V3, look: [-6.6, 0.95, -8.6] as V3, fov: 54 };
const c2e = F(() => TV_SH, 1362, 0.0011);
const c2f = F(() => BENCH_SH, 1410, 0.0011);
const CRANE3 = { pos: [-1.5, 6.0, -1.0] as V3, look: [-4.2, 2.0, 6.0] as V3, fov: 54 };
const CRANE4 = { pos: [1.2, 5.6, 0.5] as V3, look: [2.4, 1.6, -7.0] as V3, fov: 54 };
SHOT_CAMS[2] = () => [K(1027, c2a, 1, true),
  K(1098, glideTo(c2a, 1098, () => CRANE3, 1116, 0.2), 1), K(1116, glideTo(() => CRANE3, 1116, c2b, 1134, 0), 1),
  K(1142, glideTo(c2b, 1142, () => CRANE4, 1159, 0.2), 1), K(1159, glideTo(() => CRANE4, 1159, c2c, 1182, 0, [0.4, 0, 0], 0.65), 1),
  K(1198, glideTo(c2c, 1198, c2d, 1214, 0), 1),
  K(1330, glideTo(c2d, 1330, c2e, 1362, 0.05, [0, 0, -1.6], 0, 0.3), 1),          // through the doorway to the TV
  K(1372, glideTo(c2e, 1372, c2f, 1410, 0.1), 1)];                                  // one slow pull from the TV to the bench
KEY_PUNCH.push(1172, 1262, 1318);
SHOT_ACTS[2] = (f, s) => {
  const cast: CastPlace[] = [], fx: (FxSpec | null)[] = [];
  const ctl: Ctl = { spring: 1, petals: 1, chalk: 1, wallN: 24, deskCake: 0, hg: 1, hgK: 0.5, drawer: sm(f, 1186, 1198), keyIn: f >= 1166 ? 1 : 0, keyTurn: sm(f, 1172, 1184), ph1: f < 1194 ? 1 : f < 1262 ? 0 : 2, ph2: f < 1194 ? 1 : f < 1318 ? 0 : 2,
    grey: sm(f, 1272, 1300), tv: f >= 1356 ? 1 : 0, hDoor: sm(f, 1042, 1052) * (1 - sm(f, 1122, 1132)), bell: f > 1044 && f < 1100 ? 1 : 0, egg: 0.6 };
  // ---- the bowling team files in behind Pratt (1027-1100) ----
  if (f < 1140) {
    const pr = walkPath(2, s, LANE.slice(2), f, 1040, 1066);
    cast.push(C("pratt", f < 1040 ? LANE[2] : pr.p, f < 1040 ? flow(f, [[1027, { expr: "grin", facing: 1, armR: AR.waveR, armRFront: true }], [1033, { expr: "beam", facing: 1, armR: [[26, -20], [42, -48]] as A2, armRFront: true }, 6]]) : pose(null, { expr: "grin", mode: pr.moving ? "walk" : "stand", phase: pr.phase, facing: pr.facing }), { idx: 7 }));
    ["bowl1", "bowl2", "bowl3", "bowl4"].forEach((w, i) => {
      const t0 = 1027 + i * 9, wk = walkPath(2, s, [[LANE[0][0] + i * 0.75, SW, LANE[0][2]] as V3, ...LANE.slice(1)], f, t0, t0 + 64 + i * 4);
      if (f > t0 + 64 + i * 4) return;
      const sw = Math.sin(wk.phase * 2 * Math.PI);
      cast.push(C(w, wk.p, pose(null, { expr: i % 2 ? "grin" : "joy", mode: wk.moving ? "walk" : "stand", phase: wk.phase, facing: wk.facing, propR: "bowlBag", armR: [[22, 26 + 3 * sw], [12 + 4 * sw, 44]] as A2, armRFront: true }), { idx: 50 + i }));
    });
    // Sal sweeps the clippings outside his shop, a cyclist rolls by
    cast.push(sweeper("sal", [-8.6, SW, -4.6], f, 1, 1));
  }
  // ---- Vance alone in his waiting room (1100-1166): flips a page (1130), sighs (1142), checks his watch (1152) ----
  if (f >= 1090 && f < 1180) cast.push(C("vance", VSIT, flow(f, [
    [1090, { expr: "blank", mode: "sit", facing: 0.4, maskDrop: 0, propR: "mag", armR: [[16, 10], [24, -6]] as A2, armRFront: true, propL: undefined }],
    [1128, { expr: "blank", mode: "sit", facing: 0.4, maskDrop: 0, propR: "mag", armR: [[18, 8], [30, -10]] as A2, armRFront: true, armL: [[-10, 6], [10, -8]] as A2, armLFront: true }, 8],
    [1140, { expr: "dismay", mode: "sit", facing: 0.3, maskDrop: 0, tilt: -6, headBack: 0.3, propR: "mag", armR: [[16, 10], [24, -6]] as A2, armRFront: true }, 12],
    [1150, { expr: "sheepish", mode: "sit", facing: 0.5, maskDrop: 0, tilt: 2, propR: "mag", armR: [[16, 10], [24, -6]] as A2, armRFront: true, armL: [[-14, 4], [6, -14]] as A2, armLFront: true, look: 0.5 }, 10],
  ]), { idx: 2 }));
  // ---- the Loophole Key (1166-1200): Hal turns it (1172-1184), pulls the drawer (1186-1198), takes both photos (1194) ----
  if (f >= 1160) {
    const keyPt: V3 = [DT.DRAWER[0] + 0.12, 0.98, -11.25 + 0.35 * ctl.drawer], drawPh = (i: number): V3 => [DT.DRAWER[0] + (i ? 0.16 : -0.16), 0.98, -11.1 + 0.35];
    const pinA: V3 = [DT.BOARD[0] - 0.95, DT.BOARD[1] + 0.22, -11.82], pinB: V3 = [DT.BOARD[0] + 0.75, DT.BOARD[1] + 0.22, -11.82];
    const walkA = walkPath(2, s, [[2.0, SW, -10.8], [1.95, SW, -10.95]], f, 1214, 1236), walkB = walkPath(2, s, [[1.95, SW, -10.95], [3.4, SW, -10.95]], f, 1276, 1302);
    const hpAt = (g: number): V3 => (g < 1214 ? [2.0, SW, -10.8] : g < 1276 ? walkPath(2, s, [[2.0, SW, -10.8], [1.95, SW, -10.78]], g, 1214, 1236).p : walkPath(2, s, [[1.95, SW, -10.78], [3.05, SW, -10.75]], g, 1276, 1300).p);
    const hp: V3 = hpAt(f), walking = f >= 1276 && f < 1302;
    const carry = (side: number) => (g: number): V3 => { const q = hpAt(g); return [q[0] + 0.25 * side, 1.12 + 0.02 * Math.sin(g * 0.4), q[2] + 0.2]; };
    const rA = path3(f, [[1160, keyPt], [1184, keyPt], [1194, drawPh(1)], [1206, carry(1)], [1290, carry(1)], [1300, (g) => [hpAt(g)[0] + 0.25, 1.45, -11.45]], [1318, pinB], [1322, pinB], [1336, carry(1)]]);
    const lA = path3(f, [[1160, [2.4, 1.0, -11.0]], [1186, [2.4, 1.0, -11.0]], [1194, drawPh(0)], [1206, carry(-1)], [1236, carry(-1)], [1244, (g) => [hpAt(g)[0] - 0.25, 1.45, -11.45]], [1262, pinA], [1266, pinA], [1280, carry(-1)]]);
    const hal = C("hal", hp, walking ? pose(null, { expr: "smile", mode: "walk", phase: f < 1276 ? walkA.phase : walkB.phase, facing: f < 1276 ? walkA.facing : walkB.facing }) : flow(f, [
      [1160, { expr: "sly", facing: 0.4, tilt: 10 }],
      [1172, { expr: "smug", facing: 0.4, tilt: 12, headTilt: -4 }, 10],
      [1196, { expr: "smile", facing: 0.6, tilt: 2 }, 12],
      [1240, { expr: "smile", facing: -0.6, tilt: -6, headBack: 0.3 }, 12],
      [1264, { expr: "calm", facing: 0.2, headTilt: -5 }, 12],
      [1302, { expr: "smile", facing: 0.6, tilt: -6, headBack: 0.3 }, 12],
      [1322, { expr: "smug", facing: 0, headTilt: 4 }, 12],
    ]), { idx: 1 });
    hal.o = { ...hal.o, armR: armTo(2, s, f, hp, rA, 1, 0), armL: armTo(2, s, f, hp, lA, -1, 0), armRFront: true, armLFront: true,
      propR: f >= 1194 && f < 1318 ? "photoB" : f < 1186 ? "loopKey" : undefined, propL: f >= 1194 && f < 1262 ? "photoA" : undefined, propRAng: 0.12 * Math.sin(f * 0.5) } as FigOpts;
    if (f < 1340) cast.push(hal);
    if (f >= 1172 && f < 1190) fx.push(...fxs(unlockSting([DT.DRAWER[0] + 0.2, 1.2, -11.1], f - 1172)));
  }
  // ---- the TV ending and the bowlers (1340-1424) ----
  if (f >= 1340) {
    const cheer = sm(f, 1364, 1372);
    ["bowl1", "bowl2", "bowl3", "bowl4"].forEach((w, i) => {
      const p: V3 = [-6.55, SW, -7.45 - i * 0.78], asleep = i === 2;
      cast.push(C(w, p, asleep ? flow(f, [[1340, { expr: "dizzy", mode: "sit", facing: 0.6, tilt: 12, headTilt: 10 }], [1394, { expr: "shock", mode: "sit", facing: 0.6, tilt: -4, headBack: 0.6, armR: [[24, -10], [34, -30]] as A2, armRFront: true }, 3],
        [1402, { expr: "dazed", mode: "sit", facing: 0.6, tilt: 2, armR: [[16, 0], [6, -26]] as A2, armRFront: true }, 10]])
        : flow(f, [[1340, { expr: "blank", mode: "sit", facing: 0.6, headTilt: (i - 1) * 3 }], [1366 + i * 2, { expr: "joy", mode: "sit", facing: 0.6, headBack: 0.4, armR: [[26, -18], [36, -48]] as A2, armL: [[-26, -18], [-36, -48]] as A2, armRFront: true, armLFront: true }, 6],
          [1390 + i * 3, { expr: "beam", mode: "sit", facing: 0.6, armR: [[28, -10 + 6 * Math.sin(f * 0.9 + i)], [40, -38]] as A2, armL: [[-28, -10], [-40, -38 + 6 * Math.sin(f * 0.9 + i)]] as A2, armRFront: true, armLFront: true }, 10]]), { idx: 50 + i }));
      void cheer;
    });
    if (f >= 1390 && f < 1424) fx.push(...fxs(zzzPop([-6.2, 1.5, -9.0], f - 1390)));
  }
  const focus = follow(f, [[1027, [-0.5, 1.3, -4.6]], [1128, head(VSIT, 0.85), 12], [1186, [DT.DRAWER[0], 1.0, -11.1], 14], [1214, [2.6, 1.9, -11.85], 16], [1362, [DT.TV[0], DT.TV[1], DT.TV[2]], 20], [1396, [-6.55, 1.0, -8.6], 12]]);
  return { ctl, cast, fx: fx.filter(Boolean) as FxSpec[], focus, subj: f < 1100 ? "pratt" : f < 1166 ? "vance" : f < 1340 ? "hal" : f < 1384 ? null : "bowl1" };
};
lens3([[1027, B_FS], [1108, B_WS, 8], [1128, B_MS, 12], [1166, B_WS, 8], [1186, B_INS, 12], [1214, B_MS, 14], [1362, B_INS, 16], [1396, B_MS, 12]]);

// ================================================= STORY SHOT 3 (1424-1594) THE LAB
const VOL: V3 = [DT.TUB_B[0] + 0.45, 0.12, -0.1], SCI: V3 = [DT.TUB_B[0] - 1.0, 0.12, -0.3];
const c3 = F(() => ({ pos: [80.8, 1.45, 2.4] as V3, look: [80.85, 1.05, -0.6] as V3, fov: 60 }), 1424, 0.00035, [[1540, 0.003, 10]]);
SHOT_CAMS[3] = () => [K(1424, c3, 1, true)];
SHOT_ACTS[3] = (f, s) => {
  // she looks between the tubs (1430), reaches for tub B (1450-1462), hand in the water (1462), shivers (1470-1530), the
  // scientist clicks the stopwatch (1474), the card flips 14 to 15 (1540), her face relaxes (1550), a small smile (1570)
  const water: V3 = [DT.TUB_B[0], DT.TUB_B[1] + 0.22, DT.TUB_B[2] + 0.05];
  const shiv = f >= 1466 && f < 1540 ? 1 - lin(f, 1520, 1540) : 0;
  const shivAt = (g: number) => (g >= 1466 && g < 1540 ? 1 - lin(g, 1520, 1540) : 0);
  const vArm: A2 = armSeq(f, [[1424, fixA([[-20, 16], [-30, 30]])], [1446, (g) => armTo(3, s, g, VOL, lerp3([DT.TUB_B[0] + 0.25, 1.25, -0.35], [water[0], water[1] + 0.22, water[2]], sm(g, 1446, 1462)), -1, -0.4, 1, "stand"), 10], [1462, (g) => armTo(3, s, g, VOL, [water[0] + 0.012 * shivAt(g) * Math.sin(g * 2.1), water[1] + 0.22, water[2]], -1, -0.4, 1, "stand"), 2]]);
  const vol = C("vol", VOL, flow(f, [
    [1424, { expr: "nervous", mode: "stand", facing: -0.3, look: -0.6 }],
    [1434, { expr: "nervous", mode: "stand", facing: -0.5, look: 0.7 }, 8],
    [1446, { expr: "determined", mode: "stand", facing: -0.6, tilt: 10 }, 10],
    [1464, { expr: "strain", mode: "stand", facing: -0.4, tilt: 8, shake: 1, phase: f / 6, sweat: 0 }, 4],
    [1500, { expr: "cold", mode: "stand", facing: -0.4, tilt: 6, shake: 1, phase: f / 6 }, 10],
    [1546, { expr: "relief", mode: "stand", facing: -0.4, tilt: 4, shake: 0 }, 12],
    [1568, { expr: "smile", mode: "stand", facing: -0.2, tilt: 2, headTilt: -4 }, 14],
  ]), { idx: 60 });
  vol.o = { ...vol.o, armL: vArm, armLFront: false } as FigOpts;
  const sci = C("sci", SCI, flow(f, [
    [1424, { expr: "neutral", facing: 0.6, propR: "clipboard", armR: [[20, 12], [30, -4]] as A2, armRFront: true, propL: "stopwatch", armL: [[-18, 10], [-26, -6]] as A2, armLFront: true }],
    [1470, { expr: "neutral", facing: 0.6, propR: "clipboard", armR: [[20, 12], [30, -4]] as A2, armRFront: true, propL: "stopwatch", armL: [[-20, 2], [-24, -22]] as A2, armLFront: true, headTilt: -4 }, 8],   // clicks
    [1510, { expr: "neutral", facing: 0.8, propR: "pen", armR: [[22, 8], [30, -8]] as A2, armRFront: true, propL: "clipboard", armL: [[-20, 10], [-30, -4]] as A2, armLFront: true, tilt: 6 }, 12],   // writes
    [1550, { expr: "eureka", facing: 0.8, propR: "pen", armR: [[24, -6], [36, -28]] as A2, armRFront: true, propL: "clipboard", armL: [[-20, 10], [-30, -4]] as A2, armLFront: true, headBack: 0.3 }, 10],
    [1572, { expr: "smile", facing: 0.6, propR: "pen", armR: [[22, 8], [30, -8]] as A2, armRFront: true, propL: "clipboard", armL: [[-20, 10], [-30, -4]] as A2, armLFront: true }, 12],
  ]), { idx: 61 });
  const ctl: Ctl = { therm: f < 1540 ? 14 : 15, tubB: f >= 1462 ? 0.6 * (1 - lin(f, 1462, 1594)) + 0.15 : 0, cardOn: 0 };
  const fx: (FxSpec | null)[] = [];
  if (f >= 1462 && f < 1478) fx.push(...splash("tub", water, f - 1462, 0.6));
  return { ctl, cast: [vol, sci], fx: fx.filter(Boolean) as FxSpec[], focus: follow(f, [[1424, head(VOL, 0.85)], [1462, water, 10], [1540, [DT.TUB_B[0] - 0.5, DT.TUB_B[1] + 0.62, DT.TUB_B[2] - 0.15], 10], [1556, head(VOL, 0.85), 10]]), subj: "vol" };
};
lens3([[1424, B_MS]]);

// ================================================= STORY SHOT 4 (1594-1900) SPRING: THE WALL OF SMILES, THE BLINDS, THE CAKE
const wallX = (f: number) => lerp(-1.65, -4.3, sm(f, 1628, 1690));
const c4a = (f: number): Shot => ({ pos: [wallX(f), 1.45, -9.4], look: [wallX(f) - 0.1, 1.6, -11.95], fov: 54, roll: 0 });
const HALWIN = { pos: [-2.4, 1.6, -1.7] as V3, look: [-3.6, 1.45, -5.8] as V3, fov: 50 };
const c4b = F(() => HALWIN, 1708, 0.0011);
const BLINDS_SH = { pos: [3.7, 1.8, 2.1] as V3, look: [4.0, 1.75, 5.6] as V3, fov: 46 };
const c4c = F(() => BLINDS_SH, 1734, 0.0011);
const END_SH = { pos: [-4.55, 1.02, -7.4] as V3, look: [-6.5, 0.84, -8.55] as V3, fov: 58 };
const c4d = F(() => END_SH, 1751, 0.0011, [[1849, 0.004, 10]]);
SHOT_CAMS[4] = () => [K(1594, c4a, 1, true),
  K(1684, glideTo(c4a, 1684, c4b, 1708, 0.95, [0, 0, 0.8]), 1),                     // out through the waiting-room window: Hal waves (held to the cut)
  K(1751, c4d, 1, true)];                                                        // hard cut on "Now": Vance in Slowpoke's waiting room
KEY_PUNCH.push(1620, 1745, 1790);
SHOT_ACTS[4] = (f, s) => {
  const cast: CastPlace[] = [], fx: (FxSpec | null)[] = [];
  const pin: V3 = [-3.6 + 1.85, SW + 1.25 + 0.31, -11.9];
  const ctl: Ctl = { spring: 1, petals: 1, chalk: 1, wallN: 36, prattPin: f >= 1620 ? 1 : 0, deskCake: 0, egg: 0.25 + 0.5 * sm(f, 1822, 1836), blinds: f < 1738 ? 0 : sm(f, 1742, 1746), blindPart: f >= 1730 && f < 1742 ? sm(f, 1730, 1736) : 0, hDoor: 0 };
  // ---- Pratt pins his minty photo on the wall (1594-1640), steps back, grins (1630) ----
  if (f < 1700) {
    const pp: V3 = [-1.45, SW, -11.0], arm = armTo(4, s, f, pp, f < 1604 ? [-1.6, 1.2, -10.8] : f < 1620 ? lerp3([-1.6, 1.3, -10.9], pin, sm(f, 1604, 1620)) : lerp3(pin, [-1.5, 1.15, -10.8], sm(f, 1622, 1636)), -1, -0.6);
    const pr = C("pratt", f < 1630 ? pp : lerp3(pp, [-1.2, SW, -10.5], sm(f, 1630, 1644)), flow(f, [[1594, { expr: "grin", facing: -0.6, tilt: -4 }], [1620, { expr: "proud", facing: -0.4, headBack: 0.3 }, 10], [1640, { expr: "beam", facing: 0.4 }, 12]]), { idx: 7 });
    pr.o = { ...pr.o, armL: arm, armLFront: true, propL: f < 1620 ? "photoB" : undefined } as FigOpts;
    cast.push(pr);
    cast.push(C("mae", MAE, flow(f, [[1594, { expr: "smile", mode: "sit", facing: -0.4 }], [1624, { expr: "joy", mode: "sit", facing: -0.6, armR: AR.waveR, armRFront: true }, 12], [1650, { expr: "smile", mode: "sit", facing: 0.2 }, 14]]), { idx: 3 }));
  }
  // ---- Hal at his window: polishes his glasses (1684-1700), waves across the street (1700-1712) ----
  if (f >= 1680 && f < 1760) cast.push(C("hal", [-3.6, SW, -5.95], flow(f, [
    [1680, { expr: "smile", facing: 0, armR: [[18, -2], [6, -30]] as A2, armRFront: true, armL: [[-18, -2], [-6, -30]] as A2, armLFront: true }],
    [1690, { expr: "smile_closed", facing: 0, armR: [[18, -4], [10, -32]] as A2, armRFront: true, armL: [[-18, -4], [-2, -30]] as A2, armLFront: true }, 6],
    [1700, { expr: "beam", facing: 0.2, armR: AR.waveR, armRFront: true }, 10],
    [1706, { expr: "beam", facing: 0.2, armR: [[26, -18], [44, -42]] as A2, armRFront: true }, 6],
  ]), { idx: 1 }));
  // ---- Vance behind his blinds: two fingers part the slats (1730), his eyes (1734), the slats snap shut (1742-1746) ----
  if (f >= 1712 && f < 1760) cast.push(C("vance", [4.0, SW, 6.0], flow(f, [[1712, { expr: "stern", facing: 0, maskDrop: 0 }], [1734, { expr: "dismay", facing: 0, maskDrop: 0, look: 0.2 }, 6], [1744, { expr: "angry", facing: 0, maskDrop: 0, tilt: 6 }, 3]]), { idx: 2 }));
  // ---- the ending: Vance in Hal's waiting room among the bowlers, a cake on his lap ----
  if (f >= 1751) {
    const VS: V3 = [-6.55, SW, -8.45];
    const cakeT: V3 = [VS[0] + 0.2, 0.95 + 0.03 * Math.sin(f * 0.3), VS[2] + 0.25];
    const v = C("vanceEnd", VS, flow(f, [
      [1751, { expr: "sheepish", mode: "sit", facing: 0.6, maskDrop: 0, tilt: 3 }],
      [1788, { expr: "sheepish", mode: "sit", facing: 0.4, maskDrop: 0, tilt: -3, look: -0.6 }, 12],   // shifts the cake, glances at the bowlers
      [1810, { expr: "smile", mode: "sit", facing: 0.6, maskDrop: 0, headTilt: 5 }, 12],                // a sheepish smile
      [1844, { expr: "sheepish", mode: "sit", facing: 0.8, maskDrop: 0, look: 0.6 }, 12],               // looks up at Hal
      [1858, { expr: "smile", mode: "sit", facing: 0.8, maskDrop: 0, headTilt: -4 }, 14],
    ]), { idx: 12 });
    v.o = { ...v.o, armR: armTo(4, s, f, VS, cakeT, 1, 0.6, 1, "sit"), armL: armTo(4, s, f, VS, [cakeT[0] - 0.16, cakeT[1], cakeT[2]], -1, 0.6, 1, "sit"), armRFront: true, armLFront: true, propR: "cake" } as FigOpts;
    cast.push(v);
    ["bowl1", "bowl2", "bowl4"].forEach((w, i) => { const p: V3 = [-6.55, SW, [-7.45, -9.35, -10.1][i]];
      cast.push(C(w, p, flow(f, [[1751, { expr: "smile", mode: "sit", facing: 0.6, propR: i === 1 ? "mag" : undefined, armR: i === 1 ? [[18, 10], [26, -4]] as A2 : undefined, armRFront: true }], [1796 + i * 6, { expr: "grin", mode: "sit", facing: i ? -0.6 : 0.6, look: i ? 0.6 : -0.6 }, 12]]), { idx: 50 + i })); });
    // Mae flips the egg timer at the desk (1822-1836) and smiles; Hal leans in the doorway (1840) and beams (1856)
    cast.push(C("hal", f < 1840 ? [-0.6, SW, -8.95] : lerp3([-0.6, SW, -8.95], [-0.85, SW, -8.95], sm(f, 1840, 1852)), flow(f, [[1751, { expr: "smile", facing: -1 }], [1840, { expr: "smile", facing: -1, tilt: -10 }, 12], [1856, { expr: "smug", facing: -1, tilt: -8, headTilt: 4 }, 14]]), { idx: 11 }));
  }
  const focus = follow(f, [[1594, pin], [1704, head([-3.6, SW, -5.95]), 12], [1751, [-6.4, 0.95, -8.35], 1]]);
  return { ctl, cast, fx: fx.filter(Boolean) as FxSpec[], focus, subj: f < 1690 ? "pratt" : f < 1751 ? "hal" : "vance" };
};
lens3([[1594, B_MS], [1704, B_MS, 12], [1751, B_MS, 1]]);
