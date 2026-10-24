import wordsRaw from '../words.json';
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DUR_S = 36.3;
export const DURATION = Math.round(DUR_S * FPS);
export const WORDS: {w: string; s: number; e: number}[] = (wordsRaw as [string, number, number][]).map(([w, s, e]) => ({w, s, e}));

// palette — accent (turquoise) means ONE thing: the missing day / the date line
export const C = {
  navy: '#1D2340',
  ink: '#232A4D',
  night0: '#0F1840', night1: '#22347C', night2: '#4C5FB0',
  dawn0: '#4E67CF', dawn1: '#FF9EAE', dawn2: '#FFD39B',
  day0: '#47B2F0', day1: '#94DDFF', day2: '#E2F8FF',
  sea: '#1EA6D8', seaD: '#0D6CAD', seaL: '#62D6F2', seaDeep: '#0A3F7A',
  sand: '#F6D9A0', sandD: '#DDB374', sandL: '#FFF1CC',
  grass: '#6CCB6A', grassD: '#3E9C57', grassL: '#A3E584',
  trunk: '#BE8452', trunkD: '#8E5B35',
  leaf: '#3FBC6C', leafD: '#22884C', leafL: '#7BDB86',
  roof: '#DDA75E', roofD: '#A9732F', roofL: '#F2C987',
  coral: '#FF6B6B', coralD: '#DE4C58',
  accent: '#19D3C5', accentL: '#86F7EC', accentD: '#0B9C92',
  white: '#FFFFFF', paper: '#FFFDF7',
  gold: '#FFC93C', goldD: '#E2981A', goldL: '#FFE7A1',
  sepPaper: '#F1E0BF', sepPaperD: '#DCC49A', sepInk: '#6E4B2A', sepTeal: '#86A79C', sepRed: '#B85C45',
  NIGHT: '#1A2560',
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eo2 = (x: number) => 1 - (1 - x) * (1 - x);
export const eo3 = (x: number) => 1 - Math.pow(1 - x, 3);
export const eo5 = (x: number) => 1 - Math.pow(1 - x, 5);
export const ei2 = (x: number) => x * x;
export const ei3 = (x: number) => x * x * x;
export const eio2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
export const eio3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eoBack = (x: number, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
// damped settle: 0 -> 1 with a soft overshoot, x in seconds since start
export const settle = (sec: number, freq = 2.0, damp = 6.5) => (sec <= 0 ? 0 : 1 - Math.exp(-damp * sec) * Math.cos(2 * Math.PI * freq * sec));
// a pop that lands: 0 before start, oversize arrival, settles to 1
export const pop = (t: number, start: number, freq = 2.2, damp = 7) => (t < start ? 0 : settle(t - start, freq, damp));
export const kf = (t: number, keys: [number, number][], ease: (x: number) => number = eio3) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// smooth 1-D value noise in [-1,1]
export const nz = (t: number, seed = 0) => {
  const i = Math.floor(t), f = t - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 57.3), hash(i + 1 + seed * 57.3), u) * 2 - 1;
};
const hex = (c: string) => {
  const h = c.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b), k = clamp(t);
  const r = A.map((v, i) => Math.round(lerp(v, B[i], k)));
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
};
export const F = "'Nunito', sans-serif";
