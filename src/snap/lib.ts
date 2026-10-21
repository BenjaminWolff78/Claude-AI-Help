import {getInputProps} from 'remotion';
import words from './words.json';
export {clamp01, lerp, prog, easeIn, easeOut, easeInOut} from '../lib';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
/** voice ends 74.08 s; the last 1.3 s returns to the first frame (loop) */
export const DUR = 75.4;
export const NFRAMES = Math.round(DUR * FPS);
/** shutter sub-frame offset (motionmaxxing pass); smooth motion samples frame + SUB */
export const SUB = Number((getInputProps() as {sub?: number}).sub ?? 0);

export type Word = {w: string; s: number; e: number};
export const WORDS = words as Word[];
const nr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** time of the nth spoken occurrence of a word (start or end), plus an offset */
export const WT = (w: string, nth = 1, at: 's' | 'e' = 's', off = 0): number => {
  let k = 0;
  for (const x of WORDS) {
    if (nr(x.w) === nr(w)) {
      k++;
      if (k === nth) return (at === 's' ? x.s : x.e) + off;
    }
  }
  throw new Error(`no word ${w} #${nth}`);
};

/** Blueprint: diazo blue paper, white linework, one warm accent (dry pasta), one red pencil for cracks. */
export const BP = {
  paper: '#123A63',
  paperDeep: '#0D2C4D',
  line: '#E6F0F7',
  faint: 'rgba(230,240,247,0.16)',
  pasta: '#F4C54E',
  pastaDark: '#C9932A',
  red: '#FF6B57',
};
export const FONT = '"Adventor BP", "Century Gothic", sans-serif';
export const MONO = '"LM Mono BP", "Courier New", monospace';

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const twos = (frame: number) => Math.floor(frame / 2);
export const clampT = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
