// cartest.ts (v34.1, Nov 27): a small daytime street to TEST sitting and holding the way Rick does it (board CB1): a parked
// hatchback with a real cabin (cabincar.ts) for the driver seen through the side window, the windshield and from inside;
// a second car driving past with its driver; a painted park bench, a plastic chair and a picnic table on the sidewalk.
// Local metres: the road x -6..3.4 (asphalt, a dashed centre line at x -0.3), curb at x 3.4, sidewalk x 3.4..8.2 (top y
// 0.12), a brick shopfront wall at x 8.2. Controls: traffic (metres the passing car has driven; it starts at z 25 going -z),
// steer (the parked car's wheel), idle (engine shake 0..1).
// Seat tops MEASURED on the Poly Haven models (highest vertex in the seat's front half): painted_wooden_bench 0.545,
// plastic_monobloc_chair_01 0.454, wooden_picnic_table bench 0.354 / top 0.746 (all above the sidewalk).
import * as THREE from "three";
import { phModel, phMat, boxM, planeM } from "../ph";
import { cabinCar } from "./cabincar";
import type { SetDef, V3, Ctl } from "./types";

export const CT = {
  CAR: [1.3, 0, 0] as V3, CAR2_X: -2.0, CAR2_Z0: 25, CURB_X: 3.4, SW: 0.12,
  BENCH: [5.1, 0.12, 3.4] as V3, BENCH_TOP: 0.545, CHAIR: [5.0, 0.12, 7.2] as V3, CHAIR_TOP: 0.454,
  TABLE: [5.7, 0.12, 11.4] as V3, TABLE_TOP: 0.746, TABLE_BENCH: 0.354, TABLE_BENCH_X: 0.95,
};
export const ctTrafficZ = (c: Ctl) => CT.CAR2_Z0 - (c.traffic ?? 0);

export const cartest = (): SetDef => {
  const root = new THREE.Group();
  const add = <T extends THREE.Object3D>(o: T, p: V3, yaw = 0): T => { o.position.set(...p); o.rotation.y = yaw; root.add(o); return o; };
  const ph = (n: Parameters<typeof phModel>[0], p: V3, yaw = 0, o: Parameters<typeof phModel>[1] = {}) => add(phModel(n, { center: true, ...o }), p, yaw);
  // road, centre line, curb, sidewalk, wall
  const road = new THREE.Mesh(planeM(9.4, 80), phMat("asphalt_02", 1 / 3, 1 / 3, { tint: "#9a9aa2", key: "ctRoad" })); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; add(road, [-1.3, 0, 5]);
  const lineM = new THREE.MeshStandardMaterial({ color: "#f2efe4", roughness: 0.7 });
  for (let z = -30; z < 40; z += 3) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.6), lineM); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; add(m, [-0.3, 0.004, z]); }
  const curb = new THREE.Mesh(boxM(0.16, 0.14, 80), new THREE.MeshStandardMaterial({ color: "#a9a7a2", roughness: 0.85 })); curb.receiveShadow = true; curb.castShadow = true; add(curb, [CT.CURB_X + 0.08, 0.07, 5]);
  const walk = new THREE.Mesh(boxM(4.65, CT.SW, 80), phMat("concrete_pavement", 1 / 2, 1 / 2, { key: "ctWalk" })); walk.receiveShadow = true; add(walk, [CT.CURB_X + 0.16 + 2.33, CT.SW / 2 - 0.001, 5]);
  const wall = new THREE.Mesh(boxM(0.4, 4.2, 80), phMat("brick_wall_001", 1 / 2.4, 1 / 2.4, { key: "ctWall" })); wall.receiveShadow = true; add(wall, [8.4, 2.1, 5]);
  const winM = new THREE.MeshStandardMaterial({ color: "#26323e", roughness: 0.15, metalness: 0.3 }), frameM = new THREE.MeshStandardMaterial({ color: "#e8e2d4", roughness: 0.6 });
  for (const z of [-4, 1, 6, 11, 16]) { const f = new THREE.Mesh(boxM(0.08, 1.9, 2.2), frameM); add(f, [8.18, 1.75, z]); const w = new THREE.Mesh(boxM(0.06, 1.7, 2.0), winM); add(w, [8.15, 1.75, z]); }
  // street furniture
  ph("painted_wooden_bench", CT.BENCH, -Math.PI / 2); ph("plastic_monobloc_chair_01", CT.CHAIR, -Math.PI / 2); ph("wooden_picnic_table", CT.TABLE, 0);
  ph("street_lamp_01", [3.9, CT.SW, 9.2], Math.PI, { h: 4.6 }); ph("metal_trash_can", [3.95, CT.SW, 5.4], 0, { h: 0.9 }); ph("potted_plant_02", [7.6, CT.SW, 2.0], 0, { h: 1.1 }); ph("potted_plant_02", [7.6, CT.SW, 8.8], 0.6, { h: 1.0 });
  // the cars
  const hero = cabinCar(root, { paint: "#2f6fb4" }); hero.g.position.set(...CT.CAR);
  const pass = cabinCar(root, { paint: "#c8452c", seat: "#4a3b36" }); pass.g.rotation.y = Math.PI;
  const pose = (t: number, c: Ctl) => {
    hero.set({ t, bob: c.idle ?? 0.15, steer: c.steer ?? 0, cut: c.cut ?? 0 });
    pass.g.position.set(CT.CAR2_X, 0, ctTrafficZ(c)); pass.set({ dist: c.traffic ?? 0, t, bob: 0.4 });
  };
  const env = { road: { hdri: "small_harbour_morning", i: 0.55 } };
  return { name: "cartest", root, marks: {}, cams: {}, pose, env } as unknown as SetDef;
};
