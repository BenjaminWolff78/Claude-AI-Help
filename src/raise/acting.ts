import {FPS, ampAt, clamp01, hash2} from './lib';

export type ReactKind = 'surprise' | 'smile' | 'worry' | 'shock' | 'relief' | 'nod' | 'think';
export type Reaction = {t: number; kind: ReactKind; hold?: number};

export type Act = {
  blink: number; // 0 open .. 1 closed
  eyeX: number; // -1..1
  eyeY: number;
  mouth: number; // 0 closed .. 1 open
  smile: number; // -1 frown .. 1 smile
  brow: number; // -1 worried .. 1 raised
  wide: number; // 0..1 eyes wide
  squint: number; // 0..1 happy squint
  lean: number; // degrees, + leans right
  tilt: number; // head tilt degrees
  breath: number; // 0..1
  bob: number; // px vertical (negative = up)
  nod: number; // px head drop
};

export type ActCfg = {
  seed: number;
  reacts?: Reaction[];
  talk?: [number, number][];
  look?: {t: number; x: number; y?: number; hold?: number}[];
  baseSmile?: number;
  idleLean?: number;
};

const SMOOTH = (x: number) => x * x * (3 - 2 * x);

/** Envelope of a reaction: small anticipation dip, quick attack, hold, slow release. */
const env = (dt: number, hold = 0.9) => {
  if (dt < -0.12 || dt > 0.25 + hold + 0.7) return {v: 0, ant: 0};
  if (dt < 0) return {v: 0, ant: SMOOTH((dt + 0.12) / 0.12)};
  const attack = 1 - Math.pow(1 - clamp01(dt / 0.22), 3);
  const over = dt < 0.4 ? Math.sin(clamp01(dt / 0.4) * Math.PI) * 0.12 : 0;
  const rel = dt > 0.25 + hold ? 1 - SMOOTH(clamp01((dt - 0.25 - hold) / 0.7)) : 1;
  return {v: (attack + over) * rel, ant: dt < 0.08 ? 1 - dt / 0.08 : 0};
};

/** Blink: one every 3-5 s at seeded random intervals, plus a blink on every reaction. */
const blinkAt = (t: number, seed: number, reacts: Reaction[]) => {
  let bt = 0.6 + hash2(seed, 0) * 2;
  let i = 1;
  let v = 0;
  while (bt < t + 1) {
    const d = Math.abs(t - bt);
    if (d < 0.1) v = Math.max(v, 1 - d / 0.1);
    bt += 3 + hash2(seed, i++) * 2;
  }
  for (const r of reacts) {
    const d = Math.abs(t - (r.t - 0.04));
    if (d < 0.08) v = Math.max(v, 1 - d / 0.08);
  }
  return v;
};

/** Eye darts: hold a gaze target, then snap to a new one within ~3 frames. */
const gaze = (t: number, seed: number, look: ActCfg['look']) => {
  for (const l of look ?? []) {
    if (t >= l.t && t < l.t + (l.hold ?? 1.6)) {
      const k = clamp01((t - l.t) / 0.1);
      return {x: l.x * k, y: (l.y ?? 0) * k};
    }
  }
  let st = 0;
  let i = 0;
  let px = 0;
  let py = 0;
  let nx = 0;
  let ny = 0;
  while (true) {
    const dur = 1.8 + hash2(seed + 9, i) * 1.8;
    if (t < st + dur) {
      nx = (hash2(seed + 3, i) - 0.5) * 1.4;
      ny = (hash2(seed + 4, i) - 0.5) * 0.7;
      const k = SMOOTH(clamp01((t - st) / 0.1));
      return {x: px + (nx - px) * k, y: py + (ny - py) * k};
    }
    px = (hash2(seed + 3, i) - 0.5) * 1.4;
    py = (hash2(seed + 4, i) - 0.5) * 0.7;
    st += dur;
    i++;
    if (i > 400) return {x: 0, y: 0};
  }
};

export const act = (frame: number, cfg: ActCfg): Act => {
  // Characters animate on twos, like hand-drawn animation.
  const f2 = Math.floor(frame / 2) * 2;
  const t = f2 / FPS;
  const {seed} = cfg;
  const reacts = cfg.reacts ?? [];
  const ph = hash2(seed, 42) * Math.PI * 2;
  const a: Act = {
    blink: blinkAt(t, seed, reacts),
    eyeX: 0,
    eyeY: 0,
    mouth: 0,
    smile: cfg.baseSmile ?? 0.15,
    brow: 0,
    wide: 0,
    squint: 0,
    lean: (cfg.idleLean ?? 1) * (1.4 * Math.sin((t * 2 * Math.PI) / 8.5 + ph) + 0.5 * Math.sin((t * 2 * Math.PI) / 3.3 + ph * 2)),
    tilt: 1.2 * Math.sin((t * 2 * Math.PI) / 6.1 + ph),
    breath: 0.5 + 0.5 * Math.sin((t * 2 * Math.PI) / 3.8 + ph),
    bob: 0,
    nod: 0,
  };
  const g = gaze(t, seed, cfg.look);
  a.eyeX = g.x;
  a.eyeY = g.y;

  for (const r of reacts) {
    const {v, ant} = env(t - r.t, r.hold);
    if (v <= 0 && ant <= 0) continue;
    switch (r.kind) {
      case 'surprise':
        a.wide = Math.max(a.wide, v);
        a.brow += v;
        a.mouth = Math.max(a.mouth, 0.45 * v);
        a.bob += 6 * ant - 16 * v;
        break;
      case 'shock':
        a.wide = Math.max(a.wide, v);
        a.brow += 1.1 * v;
        a.mouth = Math.max(a.mouth, 0.75 * v);
        a.smile -= 0.6 * v;
        a.lean -= 5 * v;
        a.bob += 8 * ant - 10 * v;
        break;
      case 'smile':
        a.smile += 0.9 * v;
        a.squint = Math.max(a.squint, 0.8 * v);
        a.brow += 0.35 * v;
        a.tilt += 4 * v;
        a.bob += 4 * ant - 6 * v;
        break;
      case 'worry':
        a.brow -= 1 * v;
        a.smile -= 0.8 * v;
        a.lean += 2 * v;
        a.bob += 5 * v;
        break;
      case 'relief':
        a.smile += 0.8 * v;
        a.brow += 0.2 * v;
        a.breath = Math.min(1.6, a.breath + 0.8 * v);
        a.tilt -= 5 * v;
        a.squint = Math.max(a.squint, 0.5 * v);
        break;
      case 'nod': {
        const dt = t - r.t;
        a.nod += dt > 0 && dt < 0.8 ? Math.sin((dt / 0.8) * Math.PI * 2) * 10 * (1 - dt / 0.8) : 0;
        a.smile += 0.3 * v;
        break;
      }
      case 'think':
        a.brow += 0.4 * v;
        a.eyeY = -0.6 * v + a.eyeY * (1 - v);
        a.eyeX = 0.7 * v + a.eyeX * (1 - v);
        a.smile -= 0.2 * v;
        a.tilt -= 6 * v;
        break;
    }
  }
  for (const [t0, t1] of cfg.talk ?? []) {
    if (frame / FPS >= t0 && frame / FPS <= t1) a.mouth = Math.max(a.mouth, Math.min(1, ampAt(frame) * 0.95));
  }
  a.smile = Math.max(-1, Math.min(1, a.smile));
  a.brow = Math.max(-1, Math.min(1.2, a.brow));
  return a;
};
