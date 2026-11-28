// Character card shading (lighting.md 9.2 / 9.5). Replaces the flat emissive "pasted-on" look: the card takes the
// scene light colour as a tint, keeps a bright floor where a cast shadow falls on it (charShade ~.86), and gets a soft
// side gradient toward the real sun (head ~charGrad, torso ~bodyGrad) with a lavender far side.
// Contract with WORLD: LFB (sun shadow visibility inside three's light loop) and CHAR (uniforms world.ts updates from
// LIGHTS every frame) come from shade.ts; the sun direction is three's own directional light 0.
// The drawing already carries a painted crescent (toon.ts shadedFill / gradFill), so the shader adds GRAD_K of the
// preset gradient, and the preset tint (measured on WHITE heads) is applied at TINT_K so peach skin stays clean
// (lighting.md 9.1 note: golden ~[1, .88, .76], day ~[1, .97, .96] for peach skin).
import * as THREE from "three";
import { LFB, CHAR } from "./shade";

export const GRAD_K = 5.5;   // head: preset charGrad x5.5, capped at .4 linear: ~14 % on screen after the grade /
                             // tone-map highlight roll-off (faces sit at ~.96 there; review round 2)
export const GRAD_KB = 2.1;   // r53: 3.6 took the far edge of a torso (and any loaf held there) to near-black at golden hour (bodyGrad .25 x 3.6 = .9); the painted gradient in fig.ts carries the form   // r51 (AX2 rows 4 and 9): torso shading much stronger than head shading  // torso: preset bodyGrad x1.6 -> ~10-15 % form shade on screen (review round 3)
export const TINT_K = 0.55;

// Card zones in UV (v = 1 at the top of the 600 x 1000 design card): adult chin at y ~420 -> v .58, head centre
// y ~309 -> v .69, head half height ~111 -> .11. Head half width ~118 units -> .2 of the card, torso ~89 -> .15.
const CARD = /* glsl */ `
vec3 tintK = mix( vec3( 1.0 ), uCharTint, uTintK );
tintK /= pow( max( dot( tintK, vec3( 0.2126, 0.7152, 0.0722 ) ), 0.2 ), uNorm );             // same face value day and golden
// r52 (AX2 row 9): the costume is painted less saturated before the grade so it comes out at its own colour (the day
// grade's 1.9x mid saturation clipped coats neon: brown #a8552e measured 250,104,13 and teal #2f7f9a 1,214,253)
vec3 outgoingLight = max( mix( vec3( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), diffuseColor.rgb, uCardSat ), 0.0 ) * tintK;
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;                                          // view space, towards the sun
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float side = ( abs( sunV.x ) > 0.02 ? sign( sunV.x ) : 1.0 ) * max( smoothstep( 0.0, 0.35, abs( sunV.x ) ), 0.65 );   // r76i (reviewers): a frontal key still gives every body a shaded far side                     // saturates: even a near-frontal sun shades one side                                          // + = sun on screen right
  float head = smoothstep( 0.565, 0.6, vMapUv.y );                                        // head zone vs body
  head = max( head, smoothstep( 0.8, 0.9, min( diffuseColor.r, min( diffuseColor.g, diffuseColor.b ) ) ) * step( 0.42, vMapUv.y ) );   // r53: the white face is head even below the zone line (the strong torso gradient drew a grey blob on the lower face, f_1840)
  float hw = mix( 0.15, 0.2, head );
  float uu = clamp( ( vMapUv.x - 0.5 ) / hw, -1.0, 1.0 ) * sign( dFdx( vMapUv.x ) + 1e-7 ); // -1..1 screen left..right
  float t = uu * side;                                                                     // +1 = edge facing the sun
  float g = mix( max( uBodyGrad * uGradKB, 0.27 ), min( uGrad * uGradK, 0.4 ) * 0.55, head );   // r76i (both reviewers: bodies lit flat, "pasted on"): every costume keeps a real shade side   // r47: a soft grey form shade on the heads (flat discs)   // v10.16: heads are flat white stickers (Rick 243-252)
  float dark = mix( smoothstep( 0.0, 0.42, -t ), smoothstep( -0.15, 0.9, -t ), head );   // far side: a toon shade band on the far third of a body, the soft gradient on heads
  vec3 sideK = mix( vec3( 1.0 ), uSideTint, dark * clamp( g / max( min( uGrad * uGradK, 0.4 ), 1e-3 ), 0.0, 1.5 ) * 0.5 );
  sideK = mix( sideK, mix( vec3( 1.0 ), uSideTint, dark ), uHeadCool * head );   // r12: heads take the scene's cool side (night: lilac-blue far side)
  // r13: and a warm wash on the side toward the key light (lamp / low sun)
  sideK *= mix( vec3( 1.0 ), vec3( 1.0, 0.92, 0.8 ), smoothstep( 0.0, 0.9, t ) * uHeadWarm * head );
  float top = 1.0 + 0.05 * clamp( ( vMapUv.y - 0.69 ) / 0.11, -1.0, 1.0 ) * clamp( dot( sunV, upV ) * 2.0, 0.0, 1.0 ) * head;
  float lift = 1.0 + mix( 0.09, 0.04, head ) * smoothstep( 0.0, 0.9, t );   // the key side of a body a touch brighter
  // r13: the plum ink (#241726) is not tinted by the scene (it read navy at night)
  float inkK = smoothstep( 0.015, 0.05, dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) );
  vec3 inkC = diffuseColor.rgb * vec3( 1.05, 1.0, 0.82 );   // r44: near-black plum (it measured #43213F, lighter and pinker than #241726)   // r36: warmer (it measured indigo #2D2649 after the grade)
  outgoingLight *= mix( mix( uCharShade, 1.0, sunVis ), 1.0, smoothstep( 0.47, 0.56, vMapUv.y ) * 0.85 ) *   /* r53: no hard cast-shadow edge across a face (f_1840: a grey blob on Amos's cheek) */ ( 1.0 - g * dark ) * sideK * top * lift * uGain * mix( uBodyGain, 0.82, head ) * mix( vec3( 1.0 ), uHeadTint, 0.5 );   /* r51 (v15 AX1 row 1, 7.1): heads stay white with only a slight scene tint, over the whole card (masked it drew a seam); r50: one tint over the whole card (masked to the head zone it drew a seam across the lower face) */   /* r49: the head tint amplified (near white, the tone-map shoulder flattened it: faces sampled 245,239,227 at sunset and in the day alike) */   /* r43: the scene's light colour on the white heads (they sampled 246-252 everywhere and read pasted on) */   // r39: heads ~240 so the scene tint shows (they measured 250-253)   // r36: no head boost (heads clipped to 252 and took no scene tint)
  {   // r76i (AX row 8): scene light tints a costume's value, never its chroma - the lit colour keeps at most 1.1x the painted colour's
      // saturation (in the dim inn the maroon coat went crimson, in spring the brown plaid went orange-red)
    vec3 W3 = vec3( 0.2126, 0.7152, 0.0722 ); vec3 b0 = max( mix( vec3( dot( diffuseColor.rgb, W3 ) ), diffuseColor.rgb, uCardSat ), 0.0 );
    float lb = max( dot( b0, W3 ), 1e-3 ), lo = max( dot( outgoingLight, W3 ), 1e-3 );
    float rb = length( b0 - lb ) / lb, ro = length( outgoingLight - lo ) / lo;
    if ( ( head < 0.5 || lb < 0.72 ) && inkK > 0.5 && ro > rb * 1.1 + 0.02 ) outgoingLight = vec3( lo ) + ( outgoingLight - vec3( lo ) ) * ( ( rb * 1.1 + 0.02 ) / ro );
  }
  outgoingLight = mix( inkC, outgoingLight, inkK );
  #ifdef USE_MAP
  {
    // INNER warm rim, golden only: the outermost ~2 px (at 1080 wide) of the HEAD skin / TORSO silhouette on the
    // sun-facing edge. No offset copy: we only test whether the next pixels toward the sun are outside the card.
    // Hats, legs, rifles and other thin parts are skipped (inner sample must be skin, or torso at least ~40 units thick).
    float warm = smoothstep( 0.2, 0.4, 1.0 - uCharTint.b );
    float sl = length( sunV.xy );
    vec2 d2 = sl > 0.05 ? sunV.xy / sl : normalize( vec2( 1.0, 0.35 ) );   // r76i: a frontal sun still rims the screen-right edge
    vec2 duv = 24.0 * uPx * ( d2.x * dFdx( vMapUv ) + d2.y * dFdy( vMapUv ) );   // r76i: test past the ink line (at 2-3 px the sample landed in the ink, so the rim never lit)   // r76i: a 3 px rim
    float edge = step( texture2D( map, vMapUv + duv ).a, 0.5 );
    vec2 dirU = normalize( duv + vec2( 1e-9 ) );
    vec4 c1 = texture2D( map, vMapUv - dirU * vec2( 0.027, 0.016 ) );   // ~16 design units inward (past the ink line)
    vec4 c2 = texture2D( map, vMapUv - dirU * vec2( 0.067, 0.04 ) );    // ~40 units inward: thick parts only
    float skin = step( 0.5, c1.a ) * step( 0.6, min( c1.r, min( c1.g, c1.b ) ) );   // r76i: the WHITE head counts (the old warm-skin test never matched a Rick head, so heads never got a rim)
    float torso = step( 0.27, vMapUv.y ) * step( vMapUv.y, 0.57 ) * step( 0.5, c1.a ) * step( 0.5, c2.a ) * step( 0.04, max( c1.r, max( c1.g, c1.b ) ) );
    // r76i (both reviewers): every scene gets a rim from its main light, in that light's colour (only the golden scenes had one;
    // the characters read evenly lit at noon, in rain, at night and at sunset)
    vec3 lc = directionalLights[ 0 ].color, rimC = mix( lc / max( max( lc.r, max( lc.g, lc.b ) ), 1e-3 ), vec3( 0.95, 0.52, 0.16 ), warm ) * step( 1e-3, max( lc.r, max( lc.g, lc.b ) ) );
    float rim = max( warm, 0.5 ) * max( smoothstep( 0.1, 0.4, sl ), 0.6 ) * edge * max( skin * head, torso ) * mix( 0.6, 1.0, sunVis ) * inkK;   // r76i: never on the ink line
    outgoingLight = mix( outgoingLight + rimC * rim * 1.3 * ( 1.0 - head ), outgoingLight * rimC * vec3( 0.97, 0.8, 0.62 ), clamp( rim * 2.2, 0.0, 0.85 ) * head );   // r76i: on the white head the rim TINTS the edge toward the light colour (added, it clipped to white and never showed)   /* r56: 1.4 read as a yellow halo round the outline */   /* r51 (AX2 row 9): a clearer low-sun rim */
  }
  #endif
}
#endif
`;

const DECL = "#include <common>\nuniform vec3 uCharTint; uniform float uCharShade; uniform float uGrad; uniform float uBodyGrad; uniform vec3 uSideTint;"
  + " uniform float uGradK; uniform float uGradKB; uniform float uTintK; uniform float uNorm; uniform float uGain; uniform float uPx; uniform float uHeadCool; uniform float uHeadWarm; uniform vec3 uHeadTint; uniform float uCardSat; uniform float uBodyGain;";
/** card-only constants (not per light): gradient share, tint share, overall gain (calibrated: faces ~.93 V) */
export const CARD_K = { uGradK: { value: GRAD_K }, uGradKB: { value: GRAD_KB }, uTintK: { value: TINT_K }, uNorm: { value: 0.7 }, uGain: { value: 1.03 }, uPx: { value: 0.5 }, uHeadCool: { value: 0.15 }, uHeadWarm: { value: 0.0 }, uHeadTint: { value: new THREE.Color(1, 1, 1) }, uCardSat: { value: 1.0 }, uBodyGain: { value: 1.0 }, uSunW: { value: new THREE.Vector3(0, 1, 0) }, uLift: { value: 0.0 } }; // uPx = render height / 1920 (set per draw in cast.ts)

/** MeshLambertMaterial -> lit card: no emissive, scene tint, bright floor, side gradient toward the sun. */
export function cardShade(m: THREE.MeshLambertMaterial) {
  m.emissive.set(0x000000); m.emissiveIntensity = 0; m.emissiveMap = null;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CHAR, CARD_K);
    /* r76i: the cards' shadow lookups start 0.6 m toward the sun, so each actor's own sun-facing shadow caster (cast.ts) never
     *  shadows its own card, while walls, roofs and trees still do (reviewers: "characters cast no shadow on the wall or bench") */
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform vec3 uSunW;\nuniform float uLift;")
      .replace("#include <shadowmap_vertex>", `#include <shadowmap_vertex>
#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * ( worldPosition + vec4( uSunW * uLift, 0.0 ) );
	}
	#pragma unroll_loop_end
#endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;", CARD);
  };
  m.customProgramCacheKey = () => "card20";
  return m;
}

/** ground contact blob: multiplies what is already drawn (the ground); drawn after the ground and before the cards */
export const blobMaterial = (map: THREE.Texture) => new THREE.MeshBasicMaterial({
  map, transparent: false, depthWrite: false, fog: false, toneMapped: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide,
});
