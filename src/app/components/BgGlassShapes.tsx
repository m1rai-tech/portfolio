import { useEffect, useRef, useState } from "react";

const FRAGMENT_BODY = `uniform float uTime;
uniform vec2 uRes;
uniform float uVel;
uniform float uDim;
uniform float uK;
uniform float uFl;
uniform float uWarm;
uniform float uDisp;
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
uniform int uSteps;
uniform int uInner;

const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);

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
  vec2 e = vec2(1.0, -1.0) * 0.002;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

float softbox(vec3 d, vec3 axis, vec2 size, float soft) {
  float w = dot(d, axis);
  if (w <= 0.0) return 0.0;
  vec3 t = normalize(cross(axis, vec3(0.0, 1.0, 0.0)));
  vec3 b = cross(t, axis);
  vec2 q = vec2(dot(d, t), dot(d, b)) / w;
  vec2 e = abs(q) - size;
  float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
  float inner = 1.0 - 0.35 * clamp(length(q / size) * 0.7, 0.0, 1.0);
  return (1.0 - smoothstep(-soft * 0.4, soft, sd)) * inner * smoothstep(0.0, 0.25, w);
}

vec3 env(vec3 d) {
  vec3 c = INK * 0.6;
  c += mix(DUSK, PAPER, 0.25) * 0.11 * smoothstep(0.1, 1.0, -d.z) * (0.6 + 0.4 * d.y);
  c += DUSK * 0.05 * smoothstep(-0.3, 1.0, d.y);
  c += EMBER * 0.04 * uWarm * smoothstep(0.2, -1.0, d.y);
  c += PAPER * 1.25 * softbox(d, vec3(-0.27, 0.53, -0.8), vec2(0.6, 0.08), 0.14);
  c += EMBER * (1.6 + 1.4 * uWarm) * softbox(d, vec3(0.6, -0.05, -0.8), vec2(0.05, 0.95), 0.1);
  c += DUSK * 2.1 * softbox(d, vec3(-0.71, -0.15, -0.69), vec2(0.07, 0.85), 0.12);
  c += PAPER * 1.7 * softbox(d, vec3(-0.56, 0.55, 0.62), vec2(0.32, 0.22), 0.16);
  c += EMBER * (0.7 + 0.8 * uWarm) * softbox(d, vec3(0.77, -0.34, 0.54), vec2(0.07, 0.5), 0.12);
  c += mix(DUSK, PAPER, 0.35) * 0.55 * softbox(d, vec3(0.16, 0.95, 0.27), vec2(0.8, 0.05), 0.1);
  return c;
}

vec3 glass(vec3 p, vec3 rd, out float glow) {
  vec3 n = calcNormal(p);
  float ndv = clamp(dot(-rd, n), 0.0, 1.0);
  float fr = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  vec3 rf = reflect(rd, n);
  vec3 refl = env(rf);
  vec3 ri = refract(rd, n, 1.0 / 1.47);
  if (dot(ri, ri) < 0.001) ri = rd;
  vec3 q = p - n * 0.012;
  float ti = 0.02;
  for (int i = 0; i < 32; i++) {
    if (i >= uInner) break;
    float d = -map(q + ri * ti);
    if (d < 0.002) break;
    ti += max(d * 0.9, 0.03);
  }
  float s0 = clamp(dot(uCore.xyz - q, ri), 0.0, ti);
  vec3 closest = q + ri * s0 - uCore.xyz;
  float cd2 = dot(closest, closest);
  glow = exp(-cd2 * 7.0) * min(ti, 1.2) + exp(-cd2 * 40.0) * 0.9;
  vec3 pe = q + ri * ti;
  vec3 ne = calcNormal(pe);
  vec3 oR = refract(ri, -ne, 1.47 - uDisp);
  vec3 oG = refract(ri, -ne, 1.47);
  vec3 oB = refract(ri, -ne, 1.47 + uDisp);
  vec3 bounce = reflect(ri, -ne);
  if (dot(oR, oR) < 0.001) oR = bounce;
  if (dot(oG, oG) < 0.001) oG = bounce;
  if (dot(oB, oB) < 0.001) oB = bounce;
  vec3 tr = vec3(env(oR).r, env(oG).g, env(oB).b);
  tr += env(bounce) * 0.12;
  tr *= exp(-ti * vec3(0.16, 0.2, 0.1)) * 0.92;
  tr += mix(DUSK, PAPER, 0.3) * 0.035 * min(ti, 2.0);
  float caustic = pow(max(dot(oG, normalize(vec3(-0.3, 0.5, -0.8))), 0.0), 10.0);
  tr += mix(PAPER, EMBER, 0.4) * caustic * 0.18;
  vec3 col = mix(tr, refl, fr);
  col += pow(1.0 - ndv, 7.0) * mix(PAPER, DUSK, 0.35) * 0.7;
  col += PAPER * 2.2 * pow(max(dot(rf, normalize(vec3(-0.56, 0.55, 0.62))), 0.0), 140.0);
  col += EMBER * 1.2 * uWarm * pow(max(dot(rf, normalize(vec3(0.77, -0.34, 0.54))), 0.0), 60.0);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = uCamPos;
  vec3 rd = uCam * normalize(vec3(uv, -uFl));
  float pixel = 1.6 / (uRes.y * uFl);
  float t = 0.0;
  float minD = 100.0;
  float edgeRatio = 100.0;
  float edgeT = 0.0;
  bool hit = false;
  for (int i = 0; i < 72; i++) {
    if (i >= uSteps) break;
    float d = map(ro + rd * t);
    minD = min(minD, d);
    float ratio = d / max(t, 0.5);
    if (ratio < edgeRatio) {
      edgeRatio = ratio;
      edgeT = t;
    }
    if (d < 0.0008 * t + 0.0006) {
      hit = true;
      break;
    }
    t += d * 0.85;
    if (t > 18.0) break;
  }
  float coverage = hit ? 1.0 : 1.0 - smoothstep(0.0, pixel * 1.5, edgeRatio);
  if (!hit) t = edgeT;

  vec3 oc = uCore.xyz - ro;
  float along = max(dot(oc, rd), 0.0);
  float dl = length(oc - rd * along);
  float coreHalo = uCore.w * (exp(-dl * dl * 2.5) * 0.12 + exp(-dl * 1.2) * 0.05);

  vec3 color = INK;
  color += DUSK * 0.045 * exp(-max(minD, 0.0) * 4.5) * uDim;
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
  float vignette = smoothstep(1.0, 0.25, length(sv * vec2(1.1, 1.25)));
  color = mix(INK * 0.6, color, 0.45 + 0.55 * vignette);

  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  color += grain * 0.022;

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
`;

const FRAGMENT_HEADER_WEBGL1 = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define FRAG gl_FragColor
`;

const SECTION_IDS = ["hero", "about", "stack", "works", "contact"];
const MAX_PIXEL_RATIO = 1.25;
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
  "uSteps",
  "uInner",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

type Renderer = {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
};

type SectionBound = {
  index: number;
  top: number;
  length: number;
};

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];

type ObjectKey = {
  pos: Vec3;
  size: Vec4;
  morph: number;
  wobble: number;
  euler: Vec3;
  rate: Vec3;
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
      { pos: [3.45, 1.75, -1.2], size: [0.62, 0.22, 0.4, 0.3], morph: 0, wobble: 0, euler: [1.0, 0.3, 0.5], rate: [0.04, 0.1, 0.02] },
      { pos: [-3.5, -1.75, -1.2], size: [0.5, 0.2, 0.45, 0.26], morph: 1, wobble: 0, euler: [0.2, 0, -0.9], rate: [0.03, 0.08, 0.02] },
      { pos: [3.5, -1.8, -1.6], size: [0.4, 0.2, 0, 0.28], morph: 1, wobble: 0.03, euler: [0.3, 0.2, 0], rate: [0.06, 0.05, 0.04] },
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

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const easeFactor = (rate: number, deltaSeconds: number) => 1 - Math.pow(1 - rate, deltaSeconds * 60);

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const lerp4 = (a: Vec4, b: Vec4, t: number): Vec4 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
  lerp(a[3], b[3], t),
];

function quatFromEuler(x: number, y: number, z: number): Vec4 {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);
  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
}

function slerp(a: Vec4, b: Vec4, t: number): Vec4 {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let target = b;
  if (dot < 0) {
    dot = -dot;
    target = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (dot > 0.9995) {
    const mixed = lerp4(a, target, t);
    const length = Math.hypot(mixed[0], mixed[1], mixed[2], mixed[3]) || 1;
    return [mixed[0] / length, mixed[1] / length, mixed[2] / length, mixed[3] / length];
  }
  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  return [
    a[0] * wa + target[0] * wb,
    a[1] * wa + target[1] * wb,
    a[2] * wa + target[2] * wb,
    a[3] * wa + target[3] * wb,
  ];
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

function measureSections(): SectionBound[] {
  const documentHeight = document.documentElement.scrollHeight;
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

function sectionFromScroll(bounds: SectionBound[], scrollY: number, viewportHeight: number) {
  if (bounds.length === 0) return 0;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
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

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const context = getContext(canvas);
  if (!context) return null;
  const { gl, isWebgl2 } = context;
  if (gl.isContextLost()) return null;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, isWebgl2 ? VERTEX_WEBGL2 : VERTEX_WEBGL1);
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    (isWebgl2 ? FRAGMENT_HEADER_WEBGL2 : FRAGMENT_HEADER_WEBGL1) + FRAGMENT_BODY,
  );
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
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
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const uniforms = Object.fromEntries(
    UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<UniformName, WebGLUniformLocation | null>;
  return { gl, program, buffer, uniforms };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  renderer.gl.deleteBuffer(renderer.buffer);
  renderer.gl.deleteProgram(renderer.program);
}

export function BgGlassShapes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    let renderer = createRenderer(canvas);
    if (!renderer) {
      setUnsupported(true);
      return;
    }

    let reducedMotion = reducedMotionQuery.matches;
    let finePointer = finePointerQuery.matches;
    let frameId = 0;
    let lastFrame = performance.now();
    let elapsed = 0;
    let contextLost = false;
    let bounds = measureSections();

    let lastScrollY = window.scrollY;
    let targetSection = sectionFromScroll(bounds, lastScrollY, window.innerHeight);
    let section = targetSection;
    let velocity = 0;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetHover = 0;
    let hover = 0;

    let compact = false;
    let renderScale = 0.5;
    let slowFrames = 0;
    let sampledFrames = 0;

    const spins: Vec3[] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    let sharedSpin = 0;

    const matrices = [new Float32Array(9), new Float32Array(9), new Float32Array(9)];
    const cameraMatrix = new Float32Array(9);

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const host = canvas.parentElement ?? canvas;
      compact = host.clientWidth < 768 || !finePointer;
      const scale = Math.min(renderScale, compact ? 0.42 : 0.5);
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const sceneAt = (value: number) => {
      const clamped = Math.min(SCENE.length - 1, Math.max(0, value));
      const index = Math.min(SCENE.length - 2, Math.floor(clamped));
      const raw = clamped - index;
      const amount = raw * raw * (3 - 2 * raw);
      return { from: SCENE[index], to: SCENE[index + 1], amount };
    };

    const advance = (deltaSeconds: number) => {
      const { from, to, amount } = sceneAt(section);
      const spin = lerp(from.spin, to.spin, amount) * (1 + velocity * 6);
      for (let i = 0; i < 3; i++) {
        const rate = lerp3(from.objects[i].rate, to.objects[i].rate, amount);
        spins[i][0] += rate[0] * deltaSeconds * spin * 2.2;
        spins[i][1] += rate[1] * deltaSeconds * spin * 2.2;
        spins[i][2] += rate[2] * deltaSeconds * spin * 2.2;
      }
      sharedSpin += deltaSeconds * 0.45 * spin;
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, uniforms } = renderer;
      const { from, to, amount } = sceneAt(section);
      const time = reducedMotion ? STILL_TIME : elapsed;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const fit = Math.min(1, Math.max(0.3, aspect / 1.6));
      const sizeFit = 0.55 + 0.45 * fit;
      const portraitLift = (1 - fit) * 0.35;
      const sync = lerp(from.sync, to.sync, amount);
      const sharedQuat = quatFromEuler(1.25, sharedSpin, 0.18);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uVel, reducedMotion ? 0 : velocity);
      gl.uniform1f(uniforms.uDim, lerp(from.dim, to.dim, amount) * (0.78 + 0.22 * fit));
      gl.uniform1f(uniforms.uK, Math.max(0.02, lerp(from.k, to.k, amount) * sizeFit));
      gl.uniform1f(uniforms.uFl, 1.4);
      const warm = lerp(from.warm, to.warm, amount);
      gl.uniform1f(uniforms.uWarm, warm);
      gl.uniform1f(uniforms.uDisp, 0.026 + (reducedMotion ? 0 : velocity * 0.08));
      gl.uniform1i(uniforms.uSteps, compact ? 44 : 64);
      gl.uniform1i(uniforms.uInner, compact ? 14 : 22);

      const camDistance = lerp(from.cam, to.cam, amount);
      const yaw = (mouseX - 0.5) * 0.14 * hover;
      const pitch = (mouseY - 0.5) * 0.1 * hover;
      const camQuat = quatFromEuler(pitch, yaw, 0);
      matFromQuat(camQuat, cameraMatrix);
      const camX = cameraMatrix[6] * camDistance;
      const camY = cameraMatrix[7] * camDistance;
      const camZ = cameraMatrix[8] * camDistance;
      gl.uniform3f(uniforms.uCamPos, camX, camY, camZ);
      gl.uniformMatrix3fv(uniforms.uCam, false, cameraMatrix);

      const core = lerp(from.core, to.core, amount);
      const coreY = -1.72 * (1 + portraitLift) * (1 - (1 - fit) * 0.1);
      gl.uniform4f(uniforms.uCore, 0, coreY, 0, core);

      const positionUniforms = [uniforms.uP0, uniforms.uP1, uniforms.uP2];
      const sizeUniforms = [uniforms.uS0, uniforms.uS1, uniforms.uS2];
      const morphUniforms = [uniforms.uM0, uniforms.uM1, uniforms.uM2];
      const rotationUniforms = [uniforms.uR0, uniforms.uR1, uniforms.uR2];

      for (let i = 0; i < 3; i++) {
        const a = from.objects[i];
        const b = to.objects[i];
        const pos = lerp3(a.pos, b.pos, amount);
        const size = lerp4(a.size, b.size, amount);
        const morph = lerp(a.morph, b.morph, amount);
        const wobble = lerp(a.wobble, b.wobble, amount) * sizeFit;
        const euler = lerp3(a.euler, b.euler, amount);
        const bob = Math.sin(time * 0.45 + i * 2.1) * 0.09;
        const x = pos[0] * (fit + (1 - fit) * 0.2);
        const y = (pos[1] + bob) * (1 + portraitLift) * (1 - (1 - fit) * 0.1);
        const s0 = size[0] * sizeFit;
        const s1 = size[1] * sizeFit;
        const s2 = size[2] * sizeFit;
        const s3 = size[3] * sizeFit;
        const extent = Math.max(s0 + s1, s2 + s3) * (1 + velocity * 0.35) + wobble + 0.08;
        gl.uniform4f(positionUniforms[i], x, y, pos[2], extent);
        gl.uniform4f(sizeUniforms[i], s0, s1, s2, s3);
        gl.uniform2f(morphUniforms[i], morph, wobble);
        const phase = OBJECT_PHASE[i];
        const own = quatFromEuler(
          euler[0] + spins[i][0] + phase[0] * 0.2,
          euler[1] + spins[i][1] + phase[1],
          euler[2] + spins[i][2],
        );
        matFromQuat(slerp(own, sharedQuat, sync), matrices[i]);
        gl.uniformMatrix3fv(rotationUniforms[i], false, matrices[i]);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      frameId = 0;
      if (document.hidden || contextLost || reducedMotion) return;
      const rawDelta = Math.max(0, (now - lastFrame) / 1000);
      const deltaSeconds = Math.min(0.1, rawDelta);
      lastFrame = now;
      elapsed += deltaSeconds;

      sampledFrames += 1;
      if (rawDelta > 0.021 && rawDelta < 0.5) slowFrames += 1;
      if (sampledFrames >= 60) {
        if (slowFrames > 30 && renderScale > 0.26) {
          renderScale = Math.max(0.26, renderScale * 0.82);
          resizeCanvas();
        }
        sampledFrames = 0;
        slowFrames = 0;
      }

      const scrollY = window.scrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(scrollY - lastScrollY) / deltaSeconds : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, window.innerHeight);

      const targetVelocity = clamp01(scrollSpeed / 3500);
      const velocityRate = targetVelocity > velocity ? 0.18 : 0.05;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.06, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.06, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.06, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.04, deltaSeconds));

      advance(deltaSeconds);
      draw();
      frameId = requestAnimationFrame(tick);
    };

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      velocity = 0;
      hover = 0;
      draw();
    };

    const start = () => {
      if (frameId || document.hidden || contextLost) return;
      if (reducedMotion) {
        renderStill();
        return;
      }
      lastFrame = performance.now();
      lastScrollY = window.scrollY;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const remeasure = () => {
      bounds = measureSections();
      resizeCanvas();
      if (reducedMotion) renderStill();
    };

    const handleScroll = () => {
      if (!reducedMotion) return;
      const next = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      if (Math.abs(next - section) > 0.001) renderStill();
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
      resizeCanvas();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const handleContextRestored = () => {
      renderer = createRenderer(canvas);
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
    start();

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
      destroyRenderer(renderer);
      renderer = null;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: FALLBACK_BACKGROUND }}
    >
      {!unsupported && <canvas ref={canvasRef} className="block h-full w-full" style={{ width: "100%", height: "100%" }} />}
    </div>
  );
}
