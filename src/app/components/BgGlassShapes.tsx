import { useEffect, useRef, useState } from "react";

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];

type SoftboxSpec = [string, Vec3, [number, number], number];

const SOFTBOXES: SoftboxSpec[] = [
  ["PAPER * 1.25", [-0.27, 0.53, -0.8], [0.6, 0.08], 0.14],
  ["EMBER * (1.6 + 1.4 * uWarm)", [0.6, -0.05, -0.8], [0.05, 0.95], 0.1],
  ["DUSK * 2.1", [-0.71, -0.15, -0.69], [0.07, 0.85], 0.12],
  ["PAPER * 1.7", [-0.56, 0.55, 0.62], [0.32, 0.22], 0.16],
  ["EMBER * (0.7 + 0.8 * uWarm)", [0.77, -0.34, 0.54], [0.07, 0.5], 0.12],
  ["mix(DUSK, PAPER, 0.35) * 0.55", [0.16, 0.95, 0.27], [0.8, 0.05], 0.1],
];

const glslFloat = (value: number) => value.toFixed(5);

const glslVec3 = (value: Vec3) => `vec3(${value.map(glslFloat).join(", ")})`;

function softboxTerm([color, axis, size, soft]: SoftboxSpec) {
  const tangentLength = Math.hypot(axis[2], axis[0]) || 1;
  const tangent: Vec3 = [-axis[2] / tangentLength, 0, axis[0] / tangentLength];
  const bitangent: Vec3 = [
    tangent[1] * axis[2] - tangent[2] * axis[1],
    tangent[2] * axis[0] - tangent[0] * axis[2],
    tangent[0] * axis[1] - tangent[1] * axis[0],
  ];
  return `  c += ${color} * softbox(d, ${glslVec3(axis)}, ${glslVec3(tangent)}, ${glslVec3(bitangent)}, vec2(${glslFloat(size[0])}, ${glslFloat(size[1])}), ${glslFloat(soft)}, blur);`;
}

const FRAGMENT_BODY = `uniform float uTime;
uniform vec2 uRes;
uniform float uVel;
uniform float uDim;
uniform float uK;
uniform float uFl;
uniform float uWarm;
uniform float uDisp;
uniform float uSoft;
uniform vec3 uCamPos;
uniform mat3 uCam;
uniform vec4 uCore;
uniform vec4 uP0;
uniform vec4 uP1;
uniform vec4 uP2;
uniform vec4 uS0;
uniform vec4 uS1;
uniform vec4 uS2;
uniform vec2 uM0;
uniform vec2 uM1;
uniform vec2 uM2;
uniform mat3 uR0;
uniform mat3 uR1;
uniform mat3 uR2;

const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);
const vec3 KEY = vec3(-0.56353, 0.55347, 0.61383);
const vec3 WARM_KEY = vec3(0.77682, -0.34302, 0.54479);
const vec3 CAUSTIC = vec3(-0.30151, 0.50252, -0.80403);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdCapsule(vec3 p, float h, float r) {
  p.y -= clamp(p.y, -h, h);
  return length(p) - r;
}

float shape(vec3 p, vec4 P, vec4 S, vec2 M, mat3 R) {
  vec3 q = p - P.xyz;
  float b = length(q) - P.w;
  if (b > 0.35 + uK) return b;
  q.y /= 1.0 + uVel * 0.35;
  q = R * q;
  float d;
  if (M.x < 0.001) d = sdTorus(q, S.xy);
  else if (M.x > 0.999) d = sdCapsule(q, S.z, S.w);
  else d = mix(sdTorus(q, S.xy), sdCapsule(q, S.z, S.w), M.x);
  if (M.y > 0.0005) d += M.y * sin(q.x * 3.1 + uTime * 0.9) * sin(q.y * 2.7 - uTime * 0.7) * sin(q.z * 2.9 + uTime * 0.6);
  return d;
}

float map(vec3 p) {
  float d = shape(p, uP0, uS0, uM0, uR0);
  d = smin(d, shape(p, uP1, uS1, uM1, uR1), uK);
  d = smin(d, shape(p, uP2, uS2, uM2, uR2), uK);
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * NORMAL_EPS;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

float softbox(vec3 d, vec3 a, vec3 t, vec3 b, vec2 size, float soft, float blur) {
  float w = dot(d, a);
  if (w <= 0.0) return 0.0;
  vec2 q = vec2(dot(d, t), dot(d, b)) / w;
  vec2 e = abs(q) - size;
  float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
  float inner = 1.0 - 0.35 * clamp(length(q / size) * 0.7, 0.0, 1.0);
  float s = soft * blur;
  return (1.0 - smoothstep(-s * 0.4, s, sd)) * inner * smoothstep(0.0, 0.25, w) * (1.5 / (0.5 + blur));
}

vec3 env(vec3 d, float blur) {
  vec3 c = INK * 0.6;
  c += mix(DUSK, PAPER, 0.25) * 0.11 * smoothstep(0.1, 1.0, -d.z) * (0.6 + 0.4 * d.y);
  c += DUSK * 0.05 * smoothstep(-0.3, 1.0, d.y);
  c += EMBER * 0.04 * uWarm * (1.0 - smoothstep(-1.0, 0.2, d.y));
${SOFTBOXES.map(softboxTerm).join("\n")}
  return c;
}

void bound(vec4 P, vec3 ro, vec3 rd, inout float tn, inout float tf, inout float haze) {
  vec3 oc = ro - P.xyz;
  float b = dot(oc, rd);
  float c = max(dot(oc, oc) - b * b, 0.0);
  float r = P.w + 0.45 + uK * 0.3;
  float h = r * r - c;
  if (h > 0.0) {
    h = sqrt(h);
    tn = min(tn, -b - h);
    tf = max(tf, -b + h);
  } else {
    haze = min(haze, sqrt(c) - P.w);
  }
}

vec3 glass(vec3 p, vec3 rd, out float glow) {
  vec3 n = calcNormal(p);
  float ndv = clamp(dot(-rd, n), 0.0, 1.0);
  float edge = 1.0 - ndv;
  float edge2 = edge * edge;
  float fr = 0.04 + 0.96 * edge2 * edge2 * edge;
  vec3 rf = reflect(rd, n);
  vec3 refl = env(rf, uSoft);
  float tb = uSoft * TRANSMIT_BLUR;
  vec3 ri = refract(rd, n, 0.68027);
  vec3 q = p - n * 0.012;
  float ti = 0.02;
  for (int i = 0; i < INNER; i++) {
    float d = -map(q + ri * ti);
    if (d < 0.002) break;
    ti += max(d, INNER_MIN);
  }
  ti = max(ti - map(q + ri * ti), 0.02);
  float s0 = clamp(dot(uCore.xyz - q, ri), 0.0, ti);
  vec3 closest = q + ri * s0 - uCore.xyz;
  float cd2 = dot(closest, closest);
  glow = exp(-cd2 * 7.0) * min(ti, 1.2) + exp(-cd2 * 40.0) * 0.9;
  vec3 pe = q + ri * ti;
  vec3 nx = -calcNormal(pe);
  vec3 bounce = reflect(ri, nx);
  float ci = dot(nx, ri);
  float k = 1.0 - 2.1609 * (1.0 - ci * ci);
  float sk = sqrt(max(k, 0.0));
  vec3 oG = 1.47 * ri - (1.47 * ci + sk) * nx;
  vec3 spread = (ri - (ci - 1.47 * (1.0 - ci * ci) / max(sk, 0.35)) * nx) * uDisp;
  float pass = smoothstep(0.0, 0.3, k);
  vec3 dR = normalize(mix(bounce, oG - spread, pass));
  vec3 dB = normalize(mix(bounce, oG + spread, pass));
#if LITE
  vec3 eR = env(dR, tb);
  vec3 eB = env(dB, tb);
  vec3 dG = normalize(dR + dB);
  vec3 tr = vec3(eR.r, (eR.g + eB.g) * 0.5, eB.b);
  tr += (eR + eB) * 0.04 * (1.0 - pass);
#else
  vec3 dG = normalize(mix(bounce, oG, pass));
  vec3 tr = vec3(env(dR, tb).r, env(dG, tb).g, env(dB, tb).b);
  tr += env(bounce, tb) * 0.12;
#endif
  tr *= exp(-ti * vec3(0.16, 0.2, 0.1)) * 0.92;
  tr += mix(DUSK, PAPER, 0.3) * 0.035 * min(ti, 2.0);
  float caustic = pow(max(dot(dG, CAUSTIC), 0.0), 10.0);
  tr += mix(PAPER, EMBER, 0.4) * caustic * 0.18;
  vec3 col = mix(tr, refl, fr);
  col += edge2 * edge2 * edge2 * edge * mix(PAPER, DUSK, 0.35) * 0.75;
  col += mix(PAPER, DUSK, 0.2) * 0.22 * smoothstep(0.55, 0.95, edge) * smoothstep(-0.2, 0.8, n.y);
  float sharp = 1.0 / uSoft;
  col += PAPER * 2.2 * pow(max(dot(rf, KEY), 0.0), 140.0 * sharp);
  col += EMBER * 1.2 * uWarm * pow(max(dot(rf, WARM_KEY), 0.0), 60.0 * sharp);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = uCamPos;
  vec3 rd = uCam * normalize(vec3(uv, -uFl));
  float pixel = 1.6 / (uRes.y * uFl);

  float tn = 1e5;
  float tf = -1.0;
  float haze = 100.0;
  bound(uP0, ro, rd, tn, tf, haze);
  bound(uP1, ro, rd, tn, tf, haze);
  bound(uP2, ro, rd, tn, tf, haze);

  float t = max(tn, 0.0);
  float edgeRatio = 100.0;
  float edgeT = t;
  bool hit = false;
  if (tf > t) {
    float eps = max(0.0008, pixel * 0.35);
    for (int i = 0; i < STEPS; i++) {
      float d = map(ro + rd * t);
      haze = min(haze, d);
      float ratio = d / max(t, 0.5);
      if (ratio < edgeRatio) {
        edgeRatio = ratio;
        edgeT = t;
      }
      if (d < eps * t + 0.0006) {
        hit = true;
        break;
      }
      t += d * RELAX;
      if (t > tf) break;
    }
  }
  float coverage = hit ? 1.0 : 1.0 - smoothstep(0.0, pixel * 1.5, edgeRatio);
  if (!hit) t = edgeT;

  vec3 oc = uCore.xyz - ro;
  float along = max(dot(oc, rd), 0.0);
  float dl = length(oc - rd * along);
  float coreHalo = uCore.w * (exp(-dl * dl * 2.5) * 0.12 + exp(-dl * 1.2) * 0.05);

  vec3 color = INK;
  color += DUSK * 0.045 * exp(-max(haze, 0.0) * 4.5) * uDim;
  color += EMBER * coreHalo;

  if (coverage > 0.001) {
    float glow;
    vec3 g = glass(ro + rd * t, rd, glow);
    g += mix(EMBER, PAPER, 0.12) * glow * uCore.w * 1.5;
    g *= exp(-max(t - 6.0, 0.0) * 0.07);
    color = mix(color, g * uDim + EMBER * coreHalo * 0.3, coverage);
  }

  color = color * (1.0 + color / 6.0) / (1.0 + color);

  vec2 sv = gl_FragCoord.xy / uRes - 0.5;
  float vignette = 1.0 - smoothstep(0.25, 1.0, length(sv * vec2(1.1, 1.25)));
  color = mix(INK * 0.6, color, 0.45 + 0.55 * vignette);

#if POST == 0
  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  color += grain * GRAIN;
#endif

  FRAG = vec4(max(color, 0.0), 1.0);
}
`;

const VERTEX_WEBGL2 = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const VERTEX_WEBGL1 = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_HEADER_WEBGL2 = `#version 300 es
precision highp float;
out vec4 fragColor;
#define FRAG fragColor
#define TEX texture
`;

const FRAGMENT_HEADER_WEBGL1 = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define FRAG gl_FragColor
#define TEX texture2D
`;

const POST_BODY = `uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uTime;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec3 cNW = TEX(uTex, uv + vec2(-1.0, -1.0) * uTexel).rgb;
  vec3 cNE = TEX(uTex, uv + vec2(1.0, -1.0) * uTexel).rgb;
  vec3 cSW = TEX(uTex, uv + vec2(-1.0, 1.0) * uTexel).rgb;
  vec3 cSE = TEX(uTex, uv + vec2(1.0, 1.0) * uTexel).rgb;
  vec3 cM = TEX(uTex, uv).rgb;
  vec3 w = vec3(0.299, 0.587, 0.114);
  float lNW = dot(cNW, w);
  float lNE = dot(cNE, w);
  float lSW = dot(cSW, w);
  float lSE = dot(cSE, w);
  float lM = dot(cM, w);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec3 color = cM;
  if (lMax - lMin > max(0.012, lMax * 0.06)) {
    vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
    float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
    float rcpMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
    dir = clamp(dir * rcpMin, vec2(-6.0), vec2(6.0)) * uTexel;
    vec3 a = 0.5 * (TEX(uTex, uv - dir * 0.16667).rgb + TEX(uTex, uv + dir * 0.16667).rgb);
    vec3 b = a * 0.5 + 0.25 * (TEX(uTex, uv - dir * 0.5).rgb + TEX(uTex, uv + dir * 0.5).rgb);
    float lB = dot(b, w);
    color = (lB < lMin || lB > lMax) ? a : b;
  }
  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  color += grain * GRAIN;
  FRAG = vec4(max(color, 0.0), 1.0);
}
`;

const QUALITY_DEFINES = {
  full: `#define LITE 0
#define STEPS 64
#define INNER 20
#define INNER_MIN 0.03
#define RELAX 0.85
#define NORMAL_EPS 0.002
#define GRAIN 0.022
#define TRANSMIT_BLUR 1.35
`,
  lite: `#define LITE 1
#define STEPS 36
#define INNER 10
#define INNER_MIN 0.04
#define RELAX 0.92
#define NORMAL_EPS 0.0035
#define GRAIN 0.018
#define TRANSMIT_BLUR 1.25
`,
};

const SECTION_IDS = ["hero", "about", "stack", "works", "contact"];
const MAX_PIXEL_RATIO = 1.25;
const LITE_PIXEL_RATIO = 1;
const FULL_SCALE = 0.5;
const LITE_SCALE = 0.38;
const MIN_SCALE = 0.24;
const FOCAL = 1.4;
const FRAME_INTERVAL = 1000 / 60;
const BUSY_INTERVAL = 1000 / 30;
const SLOW_FRAME_MS = 21;
const WARMUP_FRAMES = 45;
const STILL_TIME = 8;
const FALLBACK_BACKGROUND =
  "radial-gradient(40% 50% at 82% 48%, rgba(122, 92, 255, 0.14), transparent 70%), radial-gradient(30% 35% at 88% 70%, rgba(255, 91, 36, 0.12), transparent 70%), #0b0a0c";

const UNIFORM_NAMES = [
  "uTime",
  "uRes",
  "uVel",
  "uDim",
  "uK",
  "uFl",
  "uWarm",
  "uDisp",
  "uSoft",
  "uCamPos",
  "uCam",
  "uCore",
  "uP0",
  "uP1",
  "uP2",
  "uS0",
  "uS1",
  "uS2",
  "uM0",
  "uM1",
  "uM2",
  "uR0",
  "uR1",
  "uR2",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

type Renderer = {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  lite: boolean;
  post: PostPass | null;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
  objectUniforms: [WebGLUniformLocation | null, WebGLUniformLocation | null, WebGLUniformLocation | null, WebGLUniformLocation | null][];
};

type PostPass = {
  program: WebGLProgram | null;
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  tex: WebGLUniformLocation | null;
  texel: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  width: number;
  height: number;
};

type SectionBound = {
  index: number;
  top: number;
  length: number;
};

type ObjectKey = {
  pos: Vec3;
  size: Vec4;
  morph: number;
  wobble: number;
  euler: Vec3;
  rate: Vec3;
  edge?: [number, number];
};

type SceneKey = {
  cam: number;
  k: number;
  dim: number;
  core: number;
  warm: number;
  sync: number;
  spin: number;
  objects: [ObjectKey, ObjectKey, ObjectKey];
};

const ring = (pos: Vec3, euler: Vec3): ObjectKey => ({
  pos,
  size: [0.52, 0.17, 0.3, 0.3],
  morph: 0,
  wobble: 0,
  euler,
  rate: [0, 0, 0],
});

const SCENE: SceneKey[] = [
  {
    cam: 6,
    k: 0.2,
    dim: 1,
    core: 0,
    warm: 0.3,
    sync: 0,
    spin: 1,
    objects: [
      { pos: [2.35, -0.1, 0.3], size: [1.45, 0.52, 0.4, 0.5], morph: 0, wobble: 0, euler: [1.1, 0, 0.42], rate: [0.05, 0.13, 0.03] },
      { pos: [3.15, 1.45, -2.4], size: [0.8, 0.3, 0.95, 0.5], morph: 1, wobble: 0, euler: [0.25, 0, -0.62], rate: [0.04, 0.1, 0.02] },
      { pos: [3.2, -2.05, -1.4], size: [0.6, 0.25, 0, 0.5], morph: 1, wobble: 0.05, euler: [0.3, 0.2, 0], rate: [0.08, 0.06, 0.05] },
    ],
  },
  {
    cam: 4.3,
    k: 0.25,
    dim: 0.95,
    core: 0,
    warm: 0.35,
    sync: 0,
    spin: 1.2,
    objects: [
      { pos: [2.0, 0.15, -0.2], size: [1.45, 0.52, 0.4, 0.5], morph: 0, wobble: 0, euler: [0.6, 0.7, 1.0], rate: [0.06, 0.15, 0.04] },
      { pos: [2.6, 1.55, -1.3], size: [0.8, 0.3, 0.95, 0.5], morph: 1, wobble: 0, euler: [0.9, 0.4, -1.25], rate: [0.05, 0.12, 0.03] },
      { pos: [2.15, -1.45, 0.4], size: [0.6, 0.25, 0, 0.42], morph: 1, wobble: 0.05, euler: [0.5, 0.1, 0.3], rate: [0.08, 0.06, 0.05] },
    ],
  },
  {
    cam: 6,
    k: 0.12,
    dim: 0.9,
    core: 0,
    warm: 0.3,
    sync: 1,
    spin: 1,
    objects: [ring([2.5, 1.38, 0], [0, 0, 0]), ring([2.5, 0, 0], [0, 0, 0]), ring([2.5, -1.38, 0], [0, 0, 0])],
  },
  {
    cam: 6,
    k: 0.1,
    dim: 0.38,
    core: 0,
    warm: 0.2,
    sync: 0,
    spin: 0.45,
    objects: [
      { pos: [3.45, 1.75, -1.2], size: [0.62, 0.22, 0.4, 0.3], morph: 0, wobble: 0, euler: [1.0, 0.3, 0.5], rate: [0.04, 0.1, 0.02], edge: [0.98, 0.5] },
      { pos: [-3.5, -1.75, -1.2], size: [0.5, 0.2, 0.45, 0.26], morph: 1, wobble: 0, euler: [0.2, 0, -0.9], rate: [0.03, 0.08, 0.02], edge: [-1.9, -1.4] },
      { pos: [3.5, -1.8, -1.6], size: [0.4, 0.2, 0, 0.28], morph: 1, wobble: 0.03, euler: [0.3, 0.2, 0], rate: [0.06, 0.05, 0.04], edge: [1.9, -1.5] },
    ],
  },
  {
    cam: 5.6,
    k: 0.62,
    dim: 1,
    core: 1,
    warm: 1,
    sync: 0,
    spin: 0.6,
    objects: [
      { pos: [-0.72, -1.95, 0], size: [0.6, 0.3, 0.22, 0.48], morph: 1, wobble: 0.05, euler: [0.2, 0.3, 1.3], rate: [0.04, 0.1, 0.05] },
      { pos: [0.74, -1.9, -0.2], size: [0.5, 0.25, 0.18, 0.44], morph: 1, wobble: 0.05, euler: [0.4, 0.1, -1.1], rate: [0.05, 0.08, 0.04] },
      { pos: [0.02, -1.4, 0.15], size: [0.45, 0.2, 0, 0.4], morph: 1, wobble: 0.06, euler: [0.3, 0.2, 0], rate: [0.06, 0.07, 0.05] },
    ],
  },
];

const OBJECT_PHASE: Vec3[] = [
  [0, 0, 0],
  [1.3, 2.1, 0.4],
  [2.6, 0.7, 1.9],
];

const loseExtensions = new WeakMap<HTMLCanvasElement, WEBGL_lose_context>();

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const easeFactor = (rate: number, deltaSeconds: number) => 1 - Math.pow(1 - rate, deltaSeconds * 60);

function quatFromEuler(x: number, y: number, z: number, out: Vec4) {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);
  out[0] = sx * cy * cz - cx * sy * sz;
  out[1] = cx * sy * cz + sx * cy * sz;
  out[2] = cx * cy * sz - sx * sy * cz;
  out[3] = cx * cy * cz + sx * sy * sz;
  return out;
}

function slerp(a: Vec4, b: Vec4, t: number, out: Vec4) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sign = dot < 0 ? -1 : 1;
  dot *= sign;
  let wa = 1 - t;
  let wb = t * sign;
  if (dot <= 0.9995) {
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    wa = Math.sin((1 - t) * theta) / sinTheta;
    wb = (Math.sin(t * theta) / sinTheta) * sign;
  }
  out[0] = a[0] * wa + b[0] * wb;
  out[1] = a[1] * wa + b[1] * wb;
  out[2] = a[2] * wa + b[2] * wb;
  out[3] = a[3] * wa + b[3] * wb;
  const length = Math.hypot(out[0], out[1], out[2], out[3]) || 1;
  out[0] /= length;
  out[1] /= length;
  out[2] /= length;
  out[3] /= length;
  return out;
}

function matFromQuat(q: Vec4, out: Float32Array) {
  const [x, y, z, w] = q;
  out[0] = 1 - 2 * (y * y + z * z);
  out[1] = 2 * (x * y + z * w);
  out[2] = 2 * (x * z - y * w);
  out[3] = 2 * (x * y - z * w);
  out[4] = 1 - 2 * (x * x + z * z);
  out[5] = 2 * (y * z + x * w);
  out[6] = 2 * (x * z + y * w);
  out[7] = 2 * (y * z - x * w);
  out[8] = 1 - 2 * (x * x + y * y);
  return out;
}

function absoluteTop(element: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

function measureSections(documentHeight: number): SectionBound[] {
  const found = SECTION_IDS.map((id, index) => {
    const element = document.getElementById(id);
    return element ? { index, top: absoluteTop(element) } : null;
  }).filter((entry): entry is { index: number; top: number } => entry !== null);
  return found.map((entry, position) => {
    const next = found[position + 1];
    const end = next ? next.top : documentHeight;
    return { ...entry, length: Math.max(1, end - entry.top) };
  });
}

function sectionFromScroll(bounds: SectionBound[], scrollY: number, viewportHeight: number, documentHeight: number) {
  if (bounds.length === 0) return 0;
  const maxScroll = Math.max(0, documentHeight - viewportHeight);
  const tail = clamp01((scrollY - (maxScroll - viewportHeight)) / viewportHeight);
  const probe = scrollY + viewportHeight * (0.5 + 0.5 * tail);
  let section = bounds[0].index;
  for (let position = 1; position < bounds.length; position++) {
    const previous = bounds[position - 1];
    const current = bounds[position];
    const before = Math.min(previous.length * 0.4, viewportHeight * 0.6);
    const after = Math.min(current.length * 0.4, viewportHeight * 0.6);
    const progress = smoothstep(current.top - before, current.top + after, probe);
    section += (current.index - previous.index) * progress;
  }
  return section;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function getContext(canvas: HTMLCanvasElement) {
  const options: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "default",
  };
  const webgl2 = canvas.getContext("webgl2", options);
  if (webgl2) return { gl: webgl2 as WebGL2RenderingContext, isWebgl2: true };
  const webgl1 = canvas.getContext("webgl", options) as WebGLRenderingContext | null;
  return webgl1 ? { gl: webgl1, isWebgl2: false } : null;
}

function buildProgram(gl: WebGLRenderingContext, isWebgl2: boolean, fragmentSource: string) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, isWebgl2 ? VERTEX_WEBGL2 : VERTEX_WEBGL1);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function destroyPost(gl: WebGLRenderingContext, post: PostPass | null) {
  if (!post) return;
  gl.deleteFramebuffer(post.framebuffer);
  gl.deleteTexture(post.texture);
  if (post.program) gl.deleteProgram(post.program);
}

function createPost(gl: WebGLRenderingContext, isWebgl2: boolean, defines: string): PostPass | null {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    return null;
  }
  const post: PostPass = { program: null, texture, framebuffer, tex: null, texel: null, time: null, width: 1, height: 1 };
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  post.program = complete
    ? buildProgram(gl, isWebgl2, (isWebgl2 ? FRAGMENT_HEADER_WEBGL2 : FRAGMENT_HEADER_WEBGL1) + defines + POST_BODY)
    : null;
  if (!post.program) {
    destroyPost(gl, post);
    return null;
  }
  post.tex = gl.getUniformLocation(post.program, "uTex");
  post.texel = gl.getUniformLocation(post.program, "uTexel");
  post.time = gl.getUniformLocation(post.program, "uTime");
  return post;
}

function createRenderer(canvas: HTMLCanvasElement, lite: boolean): Renderer | null {
  const context = getContext(canvas);
  if (!context) return null;
  const { gl, isWebgl2 } = context;
  if (gl.isContextLost()) return null;
  const defines = lite ? QUALITY_DEFINES.lite : QUALITY_DEFINES.full;
  const post = createPost(gl, isWebgl2, defines);
  const program = buildProgram(
    gl,
    isWebgl2,
    (isWebgl2 ? FRAGMENT_HEADER_WEBGL2 : FRAGMENT_HEADER_WEBGL1) + `#define POST ${post ? 1 : 0}\n` + defines + FRAGMENT_BODY,
  );
  const buffer = program ? gl.createBuffer() : null;
  if (!program || !buffer) {
    if (program) gl.deleteProgram(program);
    destroyPost(gl, post);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const uniforms = Object.fromEntries(
    UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<UniformName, WebGLUniformLocation | null>;
  const objectUniforms: Renderer["objectUniforms"] = [
    [uniforms.uP0, uniforms.uS0, uniforms.uM0, uniforms.uR0],
    [uniforms.uP1, uniforms.uS1, uniforms.uM1, uniforms.uR1],
    [uniforms.uP2, uniforms.uS2, uniforms.uM2, uniforms.uR2],
  ];
  return { gl, program, buffer, lite, post, uniforms, objectUniforms };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  renderer.gl.deleteBuffer(renderer.buffer);
  renderer.gl.deleteProgram(renderer.program);
  destroyPost(renderer.gl, renderer.post);
}

export function BgGlassShapes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const host = canvas.parentElement ?? canvas;

    let reducedMotion = reducedMotionQuery.matches;
    let finePointer = finePointerQuery.matches;
    let lite = host.clientWidth < 768 || !finePointer;
    let contextLost = false;
    let renderer: Renderer | null = null;

    const pendingRestore = loseExtensions.get(canvas);
    if (pendingRestore) {
      loseExtensions.delete(canvas);
      contextLost = true;
    } else {
      renderer = createRenderer(canvas, lite);
      if (!renderer) {
        setUnsupported(true);
        return;
      }
    }

    let frameId = 0;
    let lastFrame = performance.now();
    let elapsed = 0;
    let viewportHeight = window.innerHeight;
    let documentHeight = document.documentElement.scrollHeight;
    let bounds = measureSections(documentHeight);

    let lastScrollY = window.scrollY;
    let targetSection = sectionFromScroll(bounds, lastScrollY, viewportHeight, documentHeight);
    let section = targetSection;
    let velocity = 0;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetHover = 0;
    let hover = 0;

    let quality = 1;
    let slowFrames = 0;
    let sampledFrames = 0;
    let warmup = WARMUP_FRAMES;
    let calmWindows = 0;
    let recoveries = 0;

    const spins: Vec3[] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    let sharedSpin = 0;

    let fromKey = SCENE[0];
    let toKey = SCENE[1];
    let mixAmount = 0;

    const matrices = [new Float32Array(9), new Float32Array(9), new Float32Array(9)];
    const cameraMatrix = new Float32Array(9);
    const sharedQuat: Vec4 = [0, 0, 0, 1];
    const ownQuat: Vec4 = [0, 0, 0, 1];
    const mixedQuat: Vec4 = [0, 0, 0, 1];
    const camQuat: Vec4 = [0, 0, 0, 1];

    const baseScale = () => (lite ? LITE_SCALE : FULL_SCALE);

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, lite ? LITE_PIXEL_RATIO : MAX_PIXEL_RATIO);
      const scale = Math.max(MIN_SCALE, baseScale() * quality);
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const applyQualityMode = () => {
      const nextLite = host.clientWidth < 768 || !finePointer;
      if (nextLite === lite) return;
      lite = nextLite;
      quality = 1;
      warmup = WARMUP_FRAMES;
      if (!renderer || contextLost) return;
      const next = createRenderer(canvas, lite);
      if (!next) return;
      destroyRenderer(renderer);
      renderer = next;
    };

    const sceneAt = (value: number) => {
      const clamped = Math.min(SCENE.length - 1, Math.max(0, value));
      const index = Math.min(SCENE.length - 2, Math.floor(clamped));
      const raw = clamped - index;
      fromKey = SCENE[index];
      toKey = SCENE[index + 1];
      mixAmount = raw * raw * (3 - 2 * raw);
    };

    const advance = (deltaSeconds: number) => {
      sceneAt(section);
      const spin = lerp(fromKey.spin, toKey.spin, mixAmount) * (1 + velocity * 6) * 2.2 * deltaSeconds;
      for (let i = 0; i < 3; i++) {
        const a = fromKey.objects[i].rate;
        const b = toKey.objects[i].rate;
        spins[i][0] += lerp(a[0], b[0], mixAmount) * spin;
        spins[i][1] += lerp(a[1], b[1], mixAmount) * spin;
        spins[i][2] += lerp(a[2], b[2], mixAmount) * spin;
      }
      sharedSpin += 0.45 * spin / 2.2;
    };

    const placeX = (key: ObjectKey, fit: number, portrait: number, halfWidth: number) => {
      const x = key.pos[0] * (fit + (1 - fit) * 0.2);
      return key.edge ? lerp(x, key.edge[0] * halfWidth, portrait) : x;
    };

    const placeY = (key: ObjectKey, fit: number, portrait: number, lift: number, halfHeight: number) => {
      const y = key.pos[1] * lift;
      return key.edge ? lerp(y, key.edge[1] * halfHeight, portrait) : y;
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, uniforms, objectUniforms, post } = renderer;
      if (post) {
        if (post.width !== canvas.width || post.height !== canvas.height) {
          post.width = canvas.width;
          post.height = canvas.height;
          gl.bindTexture(gl.TEXTURE_2D, post.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, post.width, post.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, post.framebuffer);
      }
      gl.useProgram(renderer.program);
      sceneAt(section);
      const from = fromKey;
      const to = toKey;
      const amount = mixAmount;
      const time = reducedMotion ? STILL_TIME : elapsed;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const fit = Math.min(1, Math.max(0.3, aspect / 1.6));
      const sizeFit = 0.55 + 0.45 * fit;
      const portraitLift = (1 - fit) * 0.35;
      const lift = (1 + portraitLift) * (1 - (1 - fit) * 0.1);
      const portrait = clamp01((0.75 - fit) / 0.4);
      const sync = lerp(from.sync, to.sync, amount);
      const motionVelocity = reducedMotion ? 0 : velocity;
      quatFromEuler(1.25, sharedSpin, 0.18, sharedQuat);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uVel, motionVelocity);
      gl.uniform1f(uniforms.uDim, lerp(from.dim, to.dim, amount) * (0.78 + 0.22 * fit));
      const k = Math.max(0.02, lerp(from.k, to.k, amount) * sizeFit);
      gl.uniform1f(uniforms.uK, k);
      gl.uniform1f(uniforms.uFl, FOCAL);
      gl.uniform1f(uniforms.uWarm, lerp(from.warm, to.warm, amount));
      gl.uniform1f(uniforms.uDisp, 0.022 + motionVelocity * 0.07);
      gl.uniform1f(uniforms.uSoft, Math.min(2.2, Math.max(1, 560 / Math.max(1, canvas.height))));

      const camDistance = lerp(from.cam, to.cam, amount);
      const yaw = (mouseX - 0.5) * 0.14 * hover;
      const pitch = (mouseY - 0.5) * 0.1 * hover;
      quatFromEuler(pitch, yaw, 0, camQuat);
      matFromQuat(camQuat, cameraMatrix);
      gl.uniform3f(
        uniforms.uCamPos,
        cameraMatrix[6] * camDistance,
        cameraMatrix[7] * camDistance,
        cameraMatrix[8] * camDistance,
      );
      gl.uniformMatrix3fv(uniforms.uCam, false, cameraMatrix);

      const core = lerp(from.core, to.core, amount);
      gl.uniform4f(uniforms.uCore, 0, -1.72 * lift, 0, core);

      for (let i = 0; i < 3; i++) {
        const a = from.objects[i];
        const b = to.objects[i];
        const z = lerp(a.pos[2], b.pos[2], amount);
        const halfHeight = ((camDistance - z) * 0.5) / FOCAL;
        const halfWidth = halfHeight * aspect;
        const x = lerp(placeX(a, fit, portrait, halfWidth), placeX(b, fit, portrait, halfWidth), amount);
        const bob = Math.sin(time * 0.45 + i * 2.1) * 0.09 * lift;
        const y = lerp(placeY(a, fit, portrait, lift, halfHeight), placeY(b, fit, portrait, lift, halfHeight), amount) + bob;
        const s0 = lerp(a.size[0], b.size[0], amount) * sizeFit;
        const s1 = lerp(a.size[1], b.size[1], amount) * sizeFit;
        const s2 = lerp(a.size[2], b.size[2], amount) * sizeFit;
        const s3 = lerp(a.size[3], b.size[3], amount) * sizeFit;
        const morph = lerp(a.morph, b.morph, amount);
        const wobble = lerp(a.wobble, b.wobble, amount) * sizeFit;
        const extent = Math.max(s0 + s1, s2 + s3) * (1 + motionVelocity * 0.35) + wobble + 0.08;
        const slots = objectUniforms[i];
        gl.uniform4f(slots[0], x, y, z, extent);
        gl.uniform4f(slots[1], s0, s1, s2, s3);
        gl.uniform2f(slots[2], morph, wobble);
        const phase = OBJECT_PHASE[i];
        quatFromEuler(
          lerp(a.euler[0], b.euler[0], amount) + spins[i][0] + phase[0] * 0.2,
          lerp(a.euler[1], b.euler[1], amount) + spins[i][1] + phase[1],
          lerp(a.euler[2], b.euler[2], amount) + spins[i][2],
          ownQuat,
        );
        matFromQuat(slerp(ownQuat, sharedQuat, sync, mixedQuat), matrices[i]);
        gl.uniformMatrix3fv(slots[3], false, matrices[i]);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (post && post.program) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(post.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, post.texture);
        gl.uniform1i(post.tex, 0);
        gl.uniform2f(post.texel, 1 / canvas.width, 1 / canvas.height);
        gl.uniform1f(post.time, time);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const adaptQuality = (frameMs: number, interval: number) => {
      if (warmup > 0) {
        warmup -= 1;
        return;
      }
      sampledFrames += 1;
      if (frameMs > Math.max(SLOW_FRAME_MS, interval + 4.5) && frameMs < 500) slowFrames += 1;
      if (sampledFrames < 60) return;
      const scale = baseScale() * quality;
      if (slowFrames > 30 && scale > MIN_SCALE + 0.005) {
        quality *= 0.82;
        calmWindows = 0;
        resizeCanvas();
      } else if (slowFrames < 4 && quality < 1 && recoveries < 2) {
        calmWindows += 1;
        if (calmWindows >= 5) {
          calmWindows = 0;
          recoveries += 1;
          quality = Math.min(1, quality / 0.82);
          resizeCanvas();
        }
      } else {
        calmWindows = 0;
      }
      sampledFrames = 0;
      slowFrames = 0;
    };

    const tick = (now: number) => {
      frameId = 0;
      if (document.hidden || contextLost || reducedMotion) return;
      frameId = requestAnimationFrame(tick);
      const since = now - lastFrame;
      const interval = lite && velocity > 0.3 ? BUSY_INTERVAL : FRAME_INTERVAL;
      if (since < interval - 1.5) return;
      const carry = since >= interval && since < interval * 2 ? since - interval : 0;
      lastFrame = now - carry;
      const deltaSeconds = Math.min(0.1, since / 1000);
      elapsed += deltaSeconds;
      adaptQuality(since, interval);

      const scrollY = window.scrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(scrollY - lastScrollY) / deltaSeconds : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, viewportHeight, documentHeight);

      const targetVelocity = clamp01(scrollSpeed / 3500);
      const velocityRate = targetVelocity > velocity ? 0.18 : 0.05;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.06, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.06, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.06, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.04, deltaSeconds));

      advance(deltaSeconds);
      draw();
    };

    let stillSection = -1;
    let stillWidth = 0;
    let stillHeight = 0;

    const renderStill = (force: boolean) => {
      targetSection = sectionFromScroll(bounds, window.scrollY, viewportHeight, documentHeight);
      const unchanged =
        Math.abs(targetSection - stillSection) < 0.002 && stillWidth === canvas.width && stillHeight === canvas.height;
      if (unchanged && !force) return;
      section = targetSection;
      stillSection = targetSection;
      stillWidth = canvas.width;
      stillHeight = canvas.height;
      velocity = 0;
      hover = 0;
      draw();
    };

    const start = () => {
      if (frameId || document.hidden || contextLost) return;
      if (reducedMotion) {
        renderStill(true);
        return;
      }
      lastFrame = performance.now() - FRAME_INTERVAL;
      lastScrollY = window.scrollY;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const remeasure = () => {
      viewportHeight = window.innerHeight;
      documentHeight = document.documentElement.scrollHeight;
      bounds = measureSections(documentHeight);
      applyQualityMode();
      resizeCanvas();
      if (reducedMotion && !document.hidden) renderStill(false);
    };

    const handleScroll = () => {
      if (reducedMotion && !document.hidden) renderStill(false);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      targetMouseX = event.clientX / window.innerWidth;
      targetMouseY = 1 - event.clientY / window.innerHeight;
      targetHover = 1;
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) targetHover = 0;
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const handleMotionChange = () => {
      reducedMotion = reducedMotionQuery.matches;
      stop();
      start();
    };

    const handlePointerQueryChange = () => {
      finePointer = finePointerQuery.matches;
      applyQualityMode();
      resizeCanvas();
      if (reducedMotion) renderStill(true);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const handleContextRestored = () => {
      renderer = createRenderer(canvas, lite);
      if (!renderer) {
        setUnsupported(true);
        return;
      }
      contextLost = false;
      resizeCanvas();
      start();
    };

    const bodyObserver = new ResizeObserver(remeasure);
    bodyObserver.observe(document.body);

    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleMotionChange);
    finePointerQuery.addEventListener("change", handlePointerQueryChange);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    resizeCanvas();
    if (pendingRestore) pendingRestore.restoreContext();
    else start();

    return () => {
      stop();
      bodyObserver.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      finePointerQuery.removeEventListener("change", handlePointerQueryChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      const gl = renderer && !renderer.gl.isContextLost() ? renderer.gl : null;
      destroyRenderer(renderer);
      renderer = null;
      const extension = gl ? gl.getExtension("WEBGL_lose_context") : null;
      if (extension) {
        canvas.addEventListener("webglcontextlost", (event) => event.preventDefault(), { once: true });
        loseExtensions.set(canvas, extension);
        extension.loseContext();
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: FALLBACK_BACKGROUND }}
    >
      {!unsupported && (
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ width: "100%", height: "100%", imageRendering: "auto" }}
        />
      )}
    </div>
  );
}
