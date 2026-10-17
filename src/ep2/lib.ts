import {getInputProps, spring, SpringConfig} from 'remotion';
import timeline from './timeline.json';
export {clamp01, lerp, band, prog, easeIn, easeOut, easeInOut} from '../lib';

export const TL = timeline;
export const FPS = TL.fps;

/** Shutter sub-frame offset (0..1 frame) from the render script: smooth motion is sampled at frame+SUB and averaged,
 *  stepped layers (characters on twos, line boil, grain, captions) keep integer frames and stay crisp. */
export const SUB = Number((getInputProps() as {sub?: number}).sub ?? 0);
/** Fractional frame for smooth springs; stepped consumers floor it themselves. */
export const frF = (t: number) => Math.round(t * FPS * 1000) / 1000;

/** Spring starting at `startSec` (this video's fps, not the example's). */
export const sp = (frame: number, startSec: number, config: Partial<SpringConfig> = {}) => {
  const f = frame - startSec * FPS;
  if (f <= 0) return 0;
  return spring({frame: f, fps: FPS, config: {damping: 14, mass: 0.8, stiffness: 140, ...config}});
};
export const W = 1920;
export const H = 1080;
export const END = TL.end;
type LineT = {id: string; start: number; end: number; words: [string, number, number][]};
const LINES: Record<string, LineT> = Object.fromEntries((TL.lines as unknown as LineT[]).map((l) => [l.id, l]));
const nrm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Time of a spoken word: WT('m2', '$284.10'), WT('c1') = line start, at 'end' for its end. Throws if missing. */
export const WT = (id: string, word?: string, nth = 1, at: 'start' | 'end' = 'start', off = 0): number => {
  const l = LINES[id];
  if (!l) throw new Error('no line ' + id);
  if (word === undefined) return (at === 'start' ? l.start : l.end) + off;
  let k = 0;
  for (const [w, s, e] of l.words) {
    if (nrm(w) === nrm(word) && ++k === nth) return (at === 'start' ? s : e) + off;
  }
  throw new Error(`no word ${id} ${word} #${nth}`);
};
export const SC = TL.scenes;

/** Palette for Bucket or Cliff (ep. 2 shares ep. 1's family; accent = berry). */
export const P = {
  paper: '#EFE8D8',
  paperWarm: '#F3E7C9',
  paperShade: '#E2D7BF',
  ink: '#2A2420',
  inkSoft: '#4A413A',
  teal: '#2F7F7A',
  tealLight: '#A8D2CC',
  tealPale: '#CFE5E0',
  coral: '#E5533D',
  coralPale: '#F2A898',
  salmon: '#EC9C88',
  mustard: '#E8B23A',
  mustardPale: '#F4D98F',
  water: '#86C06A',
  waterDark: '#5E9A4C',
  sky: '#BCDCE4',
  skyDeep: '#9CC8D4',
  cloud: '#FBF8F1',
  earth: '#C8A577',
  earthDark: '#A9875B',
  grass: '#6E9E4A',
  wood: '#B98A5A',
  woodDark: '#8E6640',
  gold: '#E7B43C',
  bill: '#9BC48A',
  white: '#FFFDF7',
  shadow: 'rgba(42,36,32,0.16)',
  // characters
  mayaSkin: '#F3C8A6',
  mayaHair: '#2E2420',
  mayaTop: '#2F7F7A',
  cwSkin: '#8A593B',
  cwHair: '#211B18',
  cwTop: '#E2593F',
  danSkin: '#EBC4A2',
  danHair: '#BDB8B0',
  danTop: '#E3A93A',
  blush: '#EE9A8C',
  bossSleeve: '#3C4A63',
  // episode 2 accent (marks only what changed / the answer) and cast
  berry: '#B23A6B',
  berryPale: '#EDB9CC',
  lavender: '#9C8BC2',
  lindaSkin: '#F1CFB2',
  lindaHair: '#DDD8D0',
  lindaHairShade: '#B9B2A8',
  waltSkin: '#7A4A2E',
  waltCap: '#33415C',
  waltVest: '#7C8B4A',
  juneSkin: '#C98E66',
  juneHair: '#F3EFE7',
  juneTop: '#8FB39A',
  leaf: '#D9822B',
  leafB: '#C2552E',
  rain: '#7FA8B8',
  night: '#2E3A55',
};

export const FONT = '"Shantell Sans", "Comic Sans MS", cursive';

/** Deterministic hash noise in [0,1). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const hash2 = (a: number, b: number) => hash(a * 57.31 + b * 13.17);

/** Boil index: outlines re-jitter on threes (10 fps at 30 fps), cycling 3 drawings. */
export const boilOf = (frame: number) => Math.floor(frame / 3) % 3;

/** Animate-on-twos time: snaps motion to 15 fps steps like hand animation. */
export const twos = (frame: number) => Math.floor(frame / 2) * 2;

/** Per-frame voice amplitude 0..1 for mouths. */
export const ampAt = (frame: number) => TL.amp[Math.max(0, Math.min(TL.amp.length - 1, frame))] ?? 0;

/** Window helper: local seconds inside a scene. */
export const inWin = (t: number, a: number, b: number) => t >= a && t < b;
