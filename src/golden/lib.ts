import {getInputProps} from 'remotion';
export {clamp01, lerp, prog, easeIn, easeOut, easeInOut} from '../lib';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
/** music-only piece; the last seconds fold back into the first frame (loop) */
export const DUR = 52.0;
export const NFRAMES = Math.round(DUR * FPS);
/** shutter sub-frame offset (motionmaxxing pass); smooth motion samples frame + SUB */
export const SUB = Number((getInputProps() as {sub?: number}).sub ?? 0);

/** Night garden: deep green, seed gold, coral and sage for the two spiral families, cream type. */
export const G = {
  bg0: '#123526',
  bg1: '#06120C',
  cream: '#F6EBD2',
  gold: '#F4B63F',
  brown: '#6B3E12',
  coral: '#FF7A59',
  sage: '#9CCB9A',
  petal: '#F7B733',
  petalDeep: '#E08A1E',
};
export const SERIF = '"Pagella G", Palatino, serif';
export const SERIF_R = '"Pagella G R", Palatino, serif';
/** the golden angle: 360 / phi^2 degrees */
export const PHI = (1 + Math.sqrt(5)) / 2;
export const GOLDEN = 360 / (PHI * PHI);

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const twos = (frame: number) => Math.floor(frame / 2);
export const clampT = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
