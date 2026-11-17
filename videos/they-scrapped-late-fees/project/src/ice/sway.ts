// Wind sway for foliage (remake 2026-11-06, "everything moves"). A vertex offset driven by one shared time uniform.
// The SAME offset is applied in the ink normal pass (ink.ts reads material.userData.sway), so the outlines move with
// the leaves instead of sliding off them. Offsets use the object's local position, so neighbouring leaf clumps ripple
// in a travelling wave (gusts roll across the rows) rather than all moving in lockstep.
import * as THREE from "three";

export const SWAY_T = { value: 0 };
export const SWAY_GLSL = /* glsl */ `
uniform float uSwayT;
uniform float uSwayOn;
vec3 swayOff(vec3 p) {
  float gust = 0.65 + 0.35 * sin(uSwayT * 0.37 + p.z * 0.05);
  float w = sin(uSwayT * 1.7 + p.x * 0.45 + p.z * 0.35) + 0.45 * sin(uSwayT * 3.3 + p.z * 0.9 + p.x * 0.2);
  return vec3(0.045 * w, 0.01 * w, 0.03 * cos(uSwayT * 1.25 + p.x * 0.3 + p.z * 0.5)) * gust * uSwayOn;
}`;
/** make a (two-tone) material sway; call once per material, after twoTone() */
export const swayMaterial = <T extends THREE.Material>(m: T): T => {
  if (m.userData.sway) return m;
  const prev = m.onBeforeCompile, key = m.customProgramCacheKey?.() ?? "";
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    sh.uniforms.uSwayT = SWAY_T; sh.uniforms.uSwayOn = { value: 1 };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + SWAY_GLSL)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed += swayOff(position);");
  };
  m.customProgramCacheKey = () => key + "_sway";
  m.userData.sway = 1; m.needsUpdate = true;
  return m;
};
