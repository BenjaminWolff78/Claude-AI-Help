
// =====================================================================================================================
// "Why He Painted Eyes on Cows' Butts": shared cast for the kraal (home base). One persistent herd that every kraal shot
// reads from (characters never vanish on a shot change), cows drawn in their REAR view whenever the camera is behind
// them (the painted eyes stare at the camera), otherwise in profile facing the way they stand on screen.
type Cow = { who: string; pos: V3; hd: number; painted: boolean };
const HERD: Cow[] = [
  { who: "cow0", pos: [-0.6, 0, 5.4], hd: Math.PI, painted: true },     // the hook cow: rump to the gate (camera side)
  { who: "cow1", pos: [3.0, 0, 3.4], hd: Math.PI / 2, painted: false },
  { who: "cow2", pos: [1.0, 0, 0.4], hd: -Math.PI / 2, painted: false },
  { who: "cow3", pos: [-3.6, 0, 3.0], hd: Math.PI, painted: true },
  { who: "cow4", pos: [-5.4, 0, -1.0], hd: Math.PI / 2, painted: false },
  { who: "cow5", pos: [2.6, 0, -3.4], hd: Math.PI, painted: false },
  { who: "cow6", pos: [5.4, 0, 0.4], hd: Math.PI, painted: true },
  { who: "cow7", pos: [-1.8, 0, -4.6], hd: Math.PI / 2, painted: false },
  { who: "cow8", pos: [5.2, 0, 4.8], hd: -Math.PI / 2, painted: false },
  { who: "cow9", pos: [-6.4, 0, 1.6], hd: Math.PI / 2, painted: true },  // the lion's cow: rump to the west fence / tall grass
  { who: "cow10", pos: [0.4, 0, -6.4], hd: -Math.PI / 2, painted: false },
  { who: "cow11", pos: [-3.2, 0, -2.8], hd: Math.PI, painted: false },
];
const herdOf = (who: string) => HERD.find((c) => c.who === who)!;
/** a cow card: rear view when the camera is behind her (within ~55 deg), else profile facing her heading on screen */
const cowC = (id: number, s: SetDef, f: number, cw: Cow, o: P = {}, extra: Partial<CastPlace> = {}, pos?: V3): CastPlace => {
  const p0 = pos ?? cw.pos, c = camAt(id, s, f), hx = Math.sin(cw.hd), hz = Math.cos(cw.hd);
  const vx = c.pos[0] - p0[0], vz = c.pos[2] - p0[2], L = Math.hypot(vx, vz) || 1, dt = (hx * vx + hz * vz) / L;
  const back = dt < -0.57;
  return C(cw.who, p0, pose(null, { expr: "neutral", ...o, back, facing: back ? (o.facing ?? 1) : screenSide(id, s, f, hx, hz) }), { idx: 200 + HERD.indexOf(cw), scale: 1.7, ...extra });
};
/** the whole herd (minus `skip`), each with a slow idle (grazing heads dip in and out on their own timers) */
const herdCast = (id: number, s: SetDef, f: number, skip: string[] = [], over: Record<string, P> = {}, paint: Record<string, number> = {}): CastPlace[] =>
  HERD.filter((c) => !skip.includes(c.who)).map((c, i) => {
    const g = (f + i * 53) % 180, graze = c.hd === Math.PI ? 0 : 25 * (sm(g, 20, 34) * (1 - sm(g, 110, 124)));
    return cowC(id, s, f, c, { tilt: graze, paintK: paint[c.who] ?? (c.painted ? 1 : 0), ...(over[c.who] ?? {}) });
  });
// the pole fence the farmers sit on: top rail y = 1.02 at z = 10.6. Sitting cards stand 0.1 m in front of the rail.
const RAIL_Y = 0.92, RAIL_Z = 10.75;
const FENCE: Record<string, V3> = { fmBig: [-6.4, RAIL_Y, RAIL_Z], fmThin: [-4.9, RAIL_Y, RAIL_Z], fmAunt: [-3.4, RAIL_Y, RAIL_Z], fmTall: [-1.9, RAIL_Y, RAIL_Z] };
const BOARD_P: V3 = [4.4, 1.55, 9.03];
/** chalk number on the tally board (a card on the slate face) */
const boardNum = (n: string, a = 1): FxSpec => ({ kind: "card", key: "bd" + n + "_" + Math.round(a * 10), pos: [BOARD_P[0], BOARD_P[1] - 0.27, BOARD_P[2] + 0.12], w: 0.8, h: 0.5, flat: false, cw: 320, ch: 200,
  draw: (p) => { const g = p.g; g.globalAlpha = a; g.font = "900 150px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(250,248,240,0.95)"; g.fillText(n, 160, 104);
    g.strokeStyle = "rgba(250,248,240,0.5)"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(40 + i * 8, 186 - i * 3); g.lineTo(80 + i * 8, 190 - i * 3); g.stroke(); } g.globalAlpha = 1; } });
/** a white smoke puff from a rifle shot (age in frames) */
const shotPuff = (pos: V3, age: number): FxSpec[] => age < 0 || age > 26 ? [] : [0, 1, 2].map((i) => ({ kind: "card", key: "smk" + i + "_" + Math.round(age / 2), pos: [pos[0] + i * 0.18 + age * 0.01, pos[1] + age * 0.012 + i * 0.05, pos[2]], w: 0.3 + age * 0.03 + i * 0.1, h: 0.3 + age * 0.03 + i * 0.1, soft: true, cw: 96, ch: 96,
  draw: (p) => { const g = p.g; g.globalAlpha = Math.max(0, 1 - age / 26); g.fillStyle = "#f4f2ee"; g.beginPath(); g.arc(48, 52, 36, 0, 7); g.fill(); g.fillStyle = "#d8d6e0"; g.beginPath(); g.arc(40, 62, 22, 0, 7); g.fill(); g.globalAlpha = 1; } }) as FxSpec);
void herdOf;
