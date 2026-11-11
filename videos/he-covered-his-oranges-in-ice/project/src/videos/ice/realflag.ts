// v10.14 switch + the ACES curve, in a module of their own (no imports from the world code, so shade.ts can use them)
import { getInputProps } from "remotion";
export const REAL = !(getInputProps() as { post?: { legacy?: boolean } }).post?.legacy;

// ---------------- ACES filmic (three.js r15x+ ACESFilmicToneMapping, exposure 1) and its inverse ----------------
const IN = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]];
const OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
const mul = (M: number[][], v: number[]) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const fit = (v: number) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
export const aces = (c: number[]) => mul(OUT, mul(IN, c.map((k) => k / 0.6)).map(fit)).map((k) => Math.min(1, Math.max(0, k)));
