// stub for fig.ts (the brick props are not used in the boat video): a plain fired-clay face
import * as THREE from "three";
export const brickFaceTex = (_name: string, _fired = true, _stamp = ""): THREE.CanvasTexture => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 32; const g = c.getContext("2d")!;
  g.fillStyle = "#a8442e"; g.fillRect(0, 0, 64, 32); return new THREE.CanvasTexture(c);
};
