// 1968 bridge acting presets: FigOpts fragments to spread into a cast entry's `o` (shots: `{ ...ACT.cheque, expr: "smug" }`).
// Arms are [elbow, hand] offsets in u (1 % of head width ~ 2.36 design units ~ 5.1 mm) from the shoulder, +x = screen
// right, +y = down. "R" presets use the right arm; mirror the card (CastPlace mirror) or use the L twin for the other side.
// The older shared presets live in poses.json (hips, pointR, pointRUp, cheer, haulR, pushR, paper, shrug, handOut,
// holdUpR, carry, facepalm, laughBelly, reach, chinThink, wave).
import type { FigOpts } from "./fig";

export const ACT: Record<string, FigOpts> = {
  // ---- the boss ----
  /** big laugh: head back, hands on the belly, whole upper body shaking (advance phase ~2.5 / s) */
  laugh: { expr: "guffaw", shake: 1, armR: [[24, 42], [8, 64]], armL: [[-24, 42], [-8, 64]], armRFront: true, armLFront: true },
  /** feet up on the desk, hands laced behind the head (sit at a desk; facing 1 puts the feet to screen right) */
  feetUp: { mode: "sit", feetUp: 1, facing: 1, armR: [[30, -18], [8, -62]], armL: [[-30, -18], [-8, -62]] },
  /** same, laughing */
  feetUpLaugh: { mode: "sit", feetUp: 1, facing: 1, expr: "guffaw", shake: 1, armR: [[30, -18], [8, -62]], armL: [[-30, -18], [-8, -62]] },
  /** staring at the newspaper held in both hands at chest height */
  stareAtPaper: { expr: "stare", armL: [[-24, 40], [-6, 52]], armR: [[24, 40], [8, 52]], armRFront: true, armLFront: true, propR: "bridgePaper" },
  /** writing the giant cheque on the table: pen hand down in front */
  write: { armR: [[26, 34], [34, 52]], armRFront: true, propR: "pen", propRAng: -0.5 },
  /** presenting the giant cheque with both hands (cheque spreads left from the right hand across the body) */
  cheque: { armR: [[28, 40], [44, 62]], armRFront: true, propR: "giantCheque", armL: [[-26, 40], [-62, 58]], armLFront: true },
  /** checking a stone number on the unrolled blueprint */
  chart: { expr: "stare", look: 0.4, armR: [[26, 30], [42, 30]], armRFront: true, propR: "chart", armL: [[-26, 30], [-62, 30]], armLFront: true },
  /** jump back with wet shoes (mode hop; arms fly up automatically) */
  yikes: { mode: "hop", lift: 0.8, expr: "yikes", wet: 0.6 },
  /** pushing a toy ship along the floor map: lunge, lean, both arms out front */
  push: { mode: "push", facing: 1, expr: "determined" },
  /** holding the old London ruler upright against the arch (ending) */
  rulerHold: { facing: 1, armR: [[26, 18], [36, -4]], armRFront: true, propR: "ruler" },

  // ---- gestures ----
  pointL: { armL: [[-40, 18], [-88, 8]] },
  waveL: { armL: [[-34, -20], [-56, -60]] },
  /** open hand forward at waist height: two characters facing each other ~0.86 m apart (card centres) meet hands */
  shakeR: { facing: 1, armR: [[30, 30], [56, 28]], armRFront: true },
  /** a prop in each hand at the sides */
  holdBoth: { armR: [[30, 34], [42, 50]], armL: [[-30, 34], [-42, 50]] },
  /** waving the newspaper high overhead (the agent bursting in) */
  paperWave: { armR: [[30, -12], [44, -52]], propR: "bridgePaper", propRAng: 0.15, expr: "eureka" },
  /** pouring sand out of a shoe held up by the heel (propK = sand stream 0..1) */
  pour: { armR: [[32, -2], [40, -30]], propR: "shoe", propK: 1, armL: [[-26, 40], [-30, 70]] },
  /** offering a jar of sand to nobody */
  jar: { armR: [[34, 10], [58, -4]], propR: "sandJar", expr: "pitch" },

  // ---- crew ----
  /** kneeling to paint a number on a stone in front (facing 1): brush hand forward, paint pot in the other hand */
  kneelPaint: { mode: "kneel", facing: 1, armR: [[30, 20], [62, 30]], armRFront: true, propR: "paintBrush", propRAng: 1.35, armL: [[-20, 36], [-24, 66]], propL: "paintPot" },
  /** worker holding the jigsaw lid up to the camera */
  lidShow: { armR: [[26, 20], [30, 0]], armRFront: true, propR: "jigsawLid", armL: [[-26, 20], [-40, -4]], armLFront: true, expr: "grin" },
  /** inspector holding the tall ruler against the pier */
  inspect: { facing: 1, armR: [[24, 10], [34, -16]], armRFront: true, propR: "ruler", armL: [[-20, 40], [2, 50]], armLFront: true },

  // ---- vehicles / tourists ----
  /** car seat (family): seated, hands in the lap */
  seat: { mode: "sit", armR: [[22, 38], [14, 58]], armL: [[-22, 38], [-14, 58]], armRFront: true, armLFront: true },
  /** kids pointing out of the car window */
  seatPoint: { mode: "sit", armR: [[38, 0], [80, -18]], expr: "eureka" },
  /** bus / car driver: seated, both hands on the wheel in front */
  drive: { mode: "sit", armR: [[26, 26], [30, 24]], armL: [[-26, 26], [-2, 24]], armRFront: true, armLFront: true },
  /** tourist taking a photo: camera up at the face */
  photo: { armR: [[16, 14], [-12, -30]], armRTop: true, propR: "camera", armL: [[-20, 14], [16, -26]], armLTop: true },
  iceCream: { armR: [[24, 22], [16, -8]], propR: "iceCream", expr: "joy" },
  pennant: { armR: [[30, -14], [40, -48]], propR: "pennant", expr: "grin" },
  brochure: { armR: [[28, 24], [40, 10]], armRFront: true, propR: "brochure" },
  /** sign painter on a ladder: brush raised to the sign */
  paintUp: { facing: 1, armR: [[30, -10], [52, -40]], propR: "paintBrush", propRAng: 0.4, armL: [[-22, 40], [-28, 66]], propL: "paintPot" },
};

/** handshake pump: the right hand bobs up and down with phase (two characters use the same phase) */
export const handshake = (phase: number, amp = 6): FigOpts => ({ facing: 1, armR: [[30, 30], [56, 28 + amp * Math.sin(phase * Math.PI * 2)]], armRFront: true });
