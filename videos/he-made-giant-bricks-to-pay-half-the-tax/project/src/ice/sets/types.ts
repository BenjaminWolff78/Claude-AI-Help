// Set contract: every set is built in its own local space (ground y = 0 near the origin); world.ts offsets it.
import * as THREE from "three";
import type { Kit } from "../build";
export type V3 = [number, number, number];
export type Ctl = Record<string, number>;
export type SetDef = {
  name: string;
  root: THREE.Group;                                   // everything of the set (static batches, animated parts, lamps)
  marks: Record<string, V3>;                           // named feet / prop spots for the cast and the shots
  cams: Record<string, { pos: V3; look: V3; fov?: number }>; // tested framings (preview + starting points for story.ts)
  pose: (t: number, c: Ctl) => void;                   // ambient loops (always) + story controls (c.hatch 0..1 etc.)
  sun?: { az?: number; el?: number };                  // camera-relative sun override for this set
  title?: THREE.Object3D[];                            // the title object (gate check 5: its share of the frame)
};
export type SetBuilder = (kit: Kit) => SetDef;
