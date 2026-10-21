import {getInputProps} from 'remotion';
export {clamp01, lerp, prog, easeIn, easeOut, easeInOut} from '../lib';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DUR = 53.4;
export const NFRAMES = Math.round(DUR * FPS);
export const SUB = Number((getInputProps() as {sub?: number}).sub ?? 0);

/** honey on a dark plum night: one warm family, one coral for waste, cream for wax */
export const C = {
  bg: '#1B1430',
  cell: '#271D45',
  cellHi: '#33275A',
  line: '#4A3B7A',
  honey: '#FFB627',
  gold: '#FFD36E',
  amber: '#E58A1F',
  cream: '#FFF1D6',
  coral: '#FF5E5B',
  ink: '#1B1430',
};
export const SANS = '"Heros Comb", "Helvetica Neue", Arial, sans-serif';

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const clampT = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

/** the film's beats, in seconds (music at 100 BPM: one bar = 2.4 s) */
export const T = {
  hook1: 0.15,
  hook2: 2.85,
  s2: 6.0,
  bc: 6.4,
  roll: 8.7,
  hales: 10.4,
  s3: 12.6,
  floor1: 12.9,
  floor2: 14.5,
  s4: 18.0,
  gaps: 19.5,
  waste: 20.6,
  s5: 22.2,
  three: 22.6,
  tiles: 23.7,
  s6: 28.2,
  area: 28.4,
  unroll: 30.0,
  s7: 36.0,
  wins: 36.2,
  s8: 40.2,
  curvy: 40.4,
  longer: 42.4,
  proof: 43.6,
  s9: 47.0,
  wax: 47.2,
  build: 49.8,
  loop: 51.6,
};
