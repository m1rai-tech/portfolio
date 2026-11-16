import { useEffect, useRef, useState } from "react";

const POINT_VERTEX = `precision highp float;
attribute float aIndex;
attribute vec4 aSeedA;
attribute vec4 aSeedB;
uniform mat4 uViewProj;
uniform float uTime;
uniform float uSection;
uniform vec2 uGrid;
uniform vec2 uLattice;
uniform float uVel;
uniform float uVelDir;
uniform vec2 uMouse;
uniform float uHover;
uniform float uAspect;
uniform vec2 uShift;
uniform float uSize;
uniform float uCalm;
uniform float uGain;
uniform float uPortrait;
varying vec3 vColor;

const float PI = 3.14159265;
const float TAU = 6.2831853;
const vec3 PAPER = vec3(0.937, 0.914, 0.875);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec4 hero(vec4 r, vec4 q, float t) {
  float col = mod(aIndex, uGrid.x);
  float row = floor(aIndex / uGrid.x);
  float x = (col / (uGrid.x - 1.0) - 0.5) * 20.0 + (r.x - 0.5) * 0.06;
  float z = 3.5 - row / (uGrid.y - 1.0) * 15.0 + (r.y - 0.5) * 0.06;
  float y = 0.24 * sin(x * 0.45 + t * 0.42 + z * 0.3)
    + 0.17 * sin(z * 0.85 - t * 0.6 + x * 0.22)
    + 0.06 * sin((x - z) * 1.5 + t * 0.95);
  float rise = smoothstep(-2.0, 10.0, x);
  y += rise * rise * 3.4 + rise * 0.6 * sin(z * 0.5 - t * 0.5 + x * 0.35);
  float crest = smoothstep(0.1, 0.6, 0.5 + 0.5 * sin(x * 0.45 + t * 0.42 + z * 0.3));
  float alpha = (0.32 + 0.7 * rise + 0.25 * crest) * smoothstep(-10.0, -6.0, x);
  return vec4(x, y - 1.4, z, alpha);
}

vec4 about(vec4 r, vec4 q, float t) {
  float R = 1.2;
  vec3 p;
  float alpha = 1.0;
  if (r.y < 0.16) {
    float u0 = (floor(r.x * 44.0) + 0.5) / 44.0;
    float u = fract(u0 + t * 0.01);
    float x = (u - 0.5) * 18.0;
    float a = x * 0.75 + t * 0.2;
    float k = r.z * 2.0 - 1.0;
    p = vec3(x, cos(a) * R * k, sin(a) * R * k);
    alpha = 0.45;
  } else {
    float u = fract(r.x + t * 0.01);
    float x = (u - 0.5) * 18.0;
    float strand = step(0.58, r.y);
    float a = x * 0.75 + t * 0.2 + strand * PI + (r.z - 0.5) * 0.55;
    float rr = R + (r.w - 0.5) * 0.1;
    p = vec3(x, cos(a) * rr, sin(a) * rr);
    alpha = 0.6 + 0.5 * smoothstep(0.3, 0.5, abs(r.z - 0.5) * -1.0 + 0.5);
  }
  float ends = smoothstep(9.0, 5.0, abs(p.x)) * smoothstep(-7.0, -1.5, p.x);
  p.xy = rot(mix(-0.42, -1.05, uPortrait)) * p.xy;
  p.xz = rot(mix(0.18, 0.05, uPortrait)) * p.xz;
  return vec4(p, alpha * ends);
}

vec4 stack(vec4 r, vec4 q, float t) {
  float n = uLattice.x;
  float lines = n * n;
  float axis = mod(aIndex, 3.0);
  float rest = floor(aIndex / 3.0);
  float line = mod(rest, lines);
  float k = floor(rest / lines);
  float a = mod(line, n) / (n - 1.0) - 0.5;
  float b = floor(line / n) / (n - 1.0) - 0.5;
  float c = k / (uLattice.y - 1.0) - 0.5;
  vec3 p;
  float alpha = 0.75;
  if (k >= uLattice.y) {
    p = (q.xyz - 0.5) * 0.85;
    alpha = 0.18;
  } else if (axis < 0.5) {
    p = vec3(c, a, b);
  } else if (axis < 1.5) {
    p = vec3(a, c, b);
  } else {
    p = vec3(a, b, c);
  }
  float pulse = exp(-pow((fract(c * 0.6 + a * 0.25 + b * 0.15 - t * 0.12) - 0.5) * 9.0, 2.0));
  float shell = max(max(abs(p.x), abs(p.y)), abs(p.z));
  alpha *= (0.55 + 0.45 * smoothstep(0.3, 0.5, shell)) * (0.7 + 1.1 * pulse);
  p *= 3.3;
  p.xz = rot(t * 0.11 + 0.6) * p.xz;
  p.yz = rot(0.42) * p.yz;
  return vec4(p, alpha);
}

vec4 works(vec4 r, vec4 q, float t) {
  vec3 u = vec3(fract(r.x + t * 0.0035), fract(r.z + t * 0.0018), r.w);
  vec3 p = (u - 0.5) * vec3(22.0, 13.0, 16.0);
  p.y += sin(t * 0.2 + r.y * TAU) * 0.15;
  float edge = sin(PI * u.x) * sin(PI * u.y);
  float alpha = step(q.z, 0.4) * edge * (0.4 + 0.6 * pow(r.y, 3.0));
  return vec4(p, alpha);
}

vec4 contact(vec4 r, vec4 q, float t) {
  float u = fract(r.x + t * 0.006) * TAU;
  float rr = 2.0 + cos(3.0 * u);
  vec3 c = vec3(rr * cos(2.0 * u), rr * sin(2.0 * u), -sin(3.0 * u) * 1.1);
  vec3 dir = q.xyz - 0.5;
  dir /= max(length(dir), 0.001);
  float spread = r.z * r.z * 0.42 + (r.w < 0.06 ? r.y * 1.6 : 0.0);
  vec3 p = (c + dir * spread) * 0.62;
  p.xy = rot(t * 0.07) * p.xy;
  p.yz = rot(0.55 + 0.1 * sin(t * 0.13)) * p.yz;
  float alpha = r.w < 0.06 ? 0.35 : 1.0 - 0.45 * smoothstep(0.0, 0.4, spread);
  return vec4(p, alpha);
}

vec4 formation(float k, vec4 r, vec4 q, float t) {
  if (k < 0.5) return hero(r, q, t);
  if (k < 1.5) return about(r, q, t);
  if (k < 2.5) return stack(r, q, t);
  if (k < 3.5) return works(r, q, t);
  return contact(r, q, t);
}

vec4 style(float k) {
  if (k < 0.5) return vec4(0.95, 0.14, 0.22, 1.35);
  if (k < 1.5) return vec4(0.68, 0.16, 0.34, 1.15);
  if (k < 2.5) return vec4(0.75, 0.12, 0.14, 1.05);
  if (k < 3.5) return vec4(0.45, 0.05, 0.3, 1.0);
  return vec4(0.5, 0.62, 0.12, 1.1);
}

vec3 tint(vec4 s, float pick) {
  if (pick < s.y) return EMBER;
  if (pick > 1.0 - s.z) return DUSK;
  return PAPER;
}

void main() {
  vec4 r = aSeedA;
  vec4 q = aSeedB;
  float t = uTime;
  float k0 = floor(clamp(uSection, 0.0, 4.0));
  float k1 = min(k0 + 1.0, 4.0);
  float f = clamp(uSection - k0, 0.0, 1.0);
  float e = clamp((f - q.w * 0.42) / 0.58, 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e);

  vec4 a = formation(k0, r, q, t);
  vec4 b = k1 > k0 ? formation(k1, r, q, t) : a;
  vec4 sa = style(k0);
  vec4 sb = style(k1);

  float mid = sin(PI * e);
  vec3 swarm = vec3(
    sin(q.x * 37.0 + t * 0.9 + r.y * 6.0),
    sin(q.y * 41.0 + t * 0.7 + r.z * 6.0),
    sin(q.z * 43.0 + t * 0.8 + r.x * 6.0)
  );
  vec3 pos = mix(a.xyz, b.xyz, e) + swarm * mid * 1.1;
  pos += swarm * uVel * (0.25 + 0.6 * r.z);

  float alpha = mix(a.w * sa.x, b.w * sb.x, e) * (1.0 - 0.25 * mid);
  vec3 color = mix(tint(sa, q.y), tint(sb, q.y), e);
  float sizeMul = mix(sa.w, sb.w, e);

  vec4 clip = uViewProj * vec4(pos, 1.0);
  float w = clip.w;
  if (w < 0.3) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    return;
  }
  vec2 ndc = clip.xy / w + uShift;

  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float dist = length(d);
  float push = exp(-dist * dist * 16.0) * uHover;
  vec2 dirm = d / max(dist, 0.001);
  vec2 offset = dirm * push * 0.09 + vec2(-dirm.y, dirm.x) * push * 0.07;
  ndc += offset / vec2(uAspect, 1.0);
  alpha *= 1.0 + push * 0.8;

  ndc.y += uVelDir * uVel * (0.02 + 0.2 * r.z * r.z) * (0.4 + 0.6 * smoothstep(3.0, 12.0, w));

  float depthFade = smoothstep(26.0, 7.0, w) * smoothstep(0.4, 1.6, w);
  float calm = mix(1.0, 0.2 + 0.8 * smoothstep(-0.85, 0.45, ndc.x), uCalm);
  color = mix(color, DUSK, smoothstep(9.0, 20.0, w) * 0.45);
  color = mix(color, mix(PAPER, EMBER, 0.35), smoothstep(4.0, 1.5, w) * 0.25);

  float size = uSize * (0.55 + 0.9 * r.z * r.z) * sizeMul / w;
  size *= 1.0 + push * 0.6;
  float fade = 1.0;
  if (size < 1.6) {
    fade = size / 1.6;
    size = 1.6;
  }
  size = min(size, 26.0);

  vColor = color * clamp(alpha * depthFade * calm * fade * uGain, 0.0, 1.5);
  gl_PointSize = size;
  gl_Position = vec4(ndc * w, clip.z, w);
}
`;

const POINT_FRAGMENT = `precision mediump float;
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0) discard;
  float glow = exp(-d * 3.2);
  float core = exp(-d * 14.0);
  gl_FragColor = vec4(vColor * (glow * 0.55 + core * 0.75), 1.0);
}
`;

const BG_VERTEX = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const BG_FRAGMENT = `precision mediump float;
uniform vec2 uRes;
uniform float uSection;
uniform float uTime;
const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
float weight(float i) {
  return clamp(1.0 - abs(uSection - i), 0.0, 1.0);
}
float glow(vec2 s, vec2 c, vec2 k) {
  vec2 d = (s - c) * k;
  return exp(-dot(d, d));
}
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 s = vec2(uv.x * aspect, uv.y);
  float w0 = weight(0.0);
  float w1 = weight(1.0);
  float w2 = weight(2.0);
  float w4 = weight(4.0);
  vec3 color = INK;
  color += EMBER * glow(s, vec2(aspect * 0.95, 0.05), vec2(1.3, 1.8)) * 0.07 * w0;
  color += DUSK * glow(s, vec2(aspect * 1.0, 0.55), vec2(1.2, 1.4)) * 0.05 * w0;
  color += DUSK * glow(s, vec2(aspect * 0.78, 0.5), vec2(1.1, 1.5)) * 0.06 * w1;
  color += DUSK * glow(s, vec2(aspect * 0.7, 0.5), vec2(1.3, 1.6)) * 0.035 * w2;
  color += EMBER * glow(s, vec2(aspect * 0.6, 0.25), vec2(1.0, 1.4)) * 0.1 * w4;
  color += DUSK * glow(s, vec2(aspect * 0.2, 0.0), vec2(1.2, 1.6)) * 0.04 * w4;
  color += (hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5) * 0.018;
  gl_FragColor = vec4(max(color, 0.0), 1.0);
}
`;

const SECTION_IDS = ["hero", "about", "stack", "works", "contact"];
const RENDER_SCALE = 0.65;
const MAX_PIXEL_RATIO = 1.5;
const STILL_TIME = 12;
const DESKTOP_COUNT = 24000;
const MOBILE_COUNT = 9000;
const LATTICE_NODES = 7;
const FALLBACK_BACKGROUND =
  "radial-gradient(60% 55% at 95% 100%, rgba(255, 91, 36, 0.14), transparent 70%), radial-gradient(50% 50% at 100% 50%, rgba(122, 92, 255, 0.12), transparent 72%), #0b0a0c";

type Vec3 = [number, number, number];

type CameraPreset = {
  eye: Vec3;
  target: Vec3;
  fov: number;
  shift: [number, number];
  mobileShift: [number, number];
  calm: number;
  gain: number;
  orbit: number;
};

const CAMERAS: CameraPreset[] = [
  { eye: [-1.5, 0.7, 7.5], target: [1.5, 0.2, -2], fov: 50, shift: [0.05, -0.05], mobileShift: [0, -0.1], calm: 1, gain: 1, orbit: 0.12 },
  { eye: [-2.2, -0.4, 7.4], target: [1.4, 0.4, 0], fov: 50, shift: [0.42, 0.04], mobileShift: [-0.1, -0.05], calm: 0.9, gain: 1, orbit: 0.25 },
  { eye: [0, 1.4, 8.2], target: [0, 0, 0], fov: 46, shift: [0.42, -0.02], mobileShift: [0, -0.32], calm: 0.8, gain: 1, orbit: 0.3 },
  { eye: [0, 0, 9], target: [0, 0, 0], fov: 55, shift: [0, 0], mobileShift: [0, 0], calm: 0.5, gain: 0.8, orbit: 0.4 },
  { eye: [0, 0.5, 6.8], target: [0, 0, 0], fov: 48, shift: [0.4, -0.04], mobileShift: [0, -0.3], calm: 0.6, gain: 1, orbit: 0.3 },
];

type PointUniform =
  | "uViewProj"
  | "uTime"
  | "uSection"
  | "uGrid"
  | "uLattice"
  | "uVel"
  | "uVelDir"
  | "uMouse"
  | "uHover"
  | "uAspect"
  | "uShift"
  | "uSize"
  | "uCalm"
  | "uGain"
  | "uPortrait";

type BgUniform = "uRes" | "uSection" | "uTime";

type Renderer = {
  gl: WebGLRenderingContext;
  pointProgram: WebGLProgram;
  bgProgram: WebGLProgram;
  pointBuffer: WebGLBuffer;
  bgBuffer: WebGLBuffer;
  pointUniforms: Record<PointUniform, WebGLUniformLocation | null>;
  bgUniforms: Record<BgUniform, WebGLUniformLocation | null>;
  count: number;
  grid: [number, number];
  lattice: [number, number];
  maxPointSize: number;
};

type SectionBound = {
  index: number;
  top: number;
  length: number;
};

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const easeFactor = (rate: number, deltaSeconds: number) => 1 - Math.pow(1 - rate, deltaSeconds * 60);

function absoluteTop(element: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

let cachedDocumentHeight = 0;

function measureSections(): SectionBound[] {
  const documentHeight = document.documentElement.scrollHeight;
  cachedDocumentHeight = documentHeight;
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
  const maxScroll = Math.max(
    0,
    (cachedDocumentHeight || document.documentElement.scrollHeight) - viewportHeight,
  );
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

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}

function lookAt(eye: Vec3, target: Vec3) {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  const zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl;
  zy /= zl;
  zz /= zl;
  let xx = zz;
  let xy = 0;
  let xz = -zx;
  const xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl;
  xy /= xl;
  xz /= xl;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return [
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ];
}

function multiply(a: number[], b: number[]) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

function mixPreset(section: number) {
  const s = Math.min(4, Math.max(0, section));
  const k0 = Math.floor(s);
  const k1 = Math.min(4, k0 + 1);
  const raw = s - k0;
  const t = raw * raw * (3 - 2 * raw);
  const a = CAMERAS[k0];
  const b = CAMERAS[k1];
  const v3 = (x: Vec3, y: Vec3): Vec3 => [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
  return {
    eye: v3(a.eye, b.eye),
    target: v3(a.target, b.target),
    fov: lerp(a.fov, b.fov, t),
    shift: [lerp(a.shift[0], b.shift[0], t), lerp(a.shift[1], b.shift[1], t)] as [number, number],
    mobileShift: [lerp(a.mobileShift[0], b.mobileShift[0], t), lerp(a.mobileShift[1], b.mobileShift[1], t)] as [number, number],
    calm: lerp(a.calm, b.calm, t),
    gain: lerp(a.gain, b.gain, t),
    orbit: lerp(a.orbit, b.orbit, t),
  };
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParticles(count: number) {
  const random = mulberry32(20261112);
  const data = new Float32Array(count * 9);
  for (let i = 0; i < count; i++) {
    const offset = i * 9;
    data[offset] = i;
    for (let j = 1; j < 9; j++) data[offset + j] = random();
  }
  return data;
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

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string, attributes: string[]) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
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
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function getContext(canvas: HTMLCanvasElement) {
  const options: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  };
  const webgl2 = canvas.getContext("webgl2", options) as WebGLRenderingContext | null;
  if (webgl2) return webgl2;
  return canvas.getContext("webgl", options) as WebGLRenderingContext | null;
}

function createRenderer(canvas: HTMLCanvasElement, count: number): Renderer | null {
  const gl = getContext(canvas);
  if (!gl || gl.isContextLost()) return null;
  const pointProgram = createProgram(gl, POINT_VERTEX, POINT_FRAGMENT, ["aIndex", "aSeedA", "aSeedB"]);
  const bgProgram = createProgram(gl, BG_VERTEX, BG_FRAGMENT, ["aPosition"]);
  const pointBuffer = gl.createBuffer();
  const bgBuffer = gl.createBuffer();
  if (!pointProgram || !bgProgram || !pointBuffer || !bgBuffer) {
    if (pointProgram) gl.deleteProgram(pointProgram);
    if (bgProgram) gl.deleteProgram(bgProgram);
    if (pointBuffer) gl.deleteBuffer(pointBuffer);
    if (bgBuffer) gl.deleteBuffer(bgBuffer);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, buildParticles(count), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pointNames: PointUniform[] = [
    "uViewProj",
    "uTime",
    "uSection",
    "uGrid",
    "uLattice",
    "uVel",
    "uVelDir",
    "uMouse",
    "uHover",
    "uAspect",
    "uShift",
    "uSize",
    "uCalm",
    "uGain",
    "uPortrait",
  ];
  const bgNames: BgUniform[] = ["uRes", "uSection", "uTime"];
  const pointUniforms = Object.fromEntries(
    pointNames.map((name) => [name, gl.getUniformLocation(pointProgram, name)]),
  ) as Record<PointUniform, WebGLUniformLocation | null>;
  const bgUniforms = Object.fromEntries(
    bgNames.map((name) => [name, gl.getUniformLocation(bgProgram, name)]),
  ) as Record<BgUniform, WebGLUniformLocation | null>;
  const columns = Math.round(Math.sqrt(count * 1.9));
  const rows = Math.floor(count / columns);
  const perLine = Math.floor(count / (3 * LATTICE_NODES * LATTICE_NODES));
  const aligned = Math.floor((perLine - 1) / (LATTICE_NODES - 1)) * (LATTICE_NODES - 1) + 1;
  const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null;
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE);
  return {
    gl,
    pointProgram,
    bgProgram,
    pointBuffer,
    bgBuffer,
    pointUniforms,
    bgUniforms,
    count,
    grid: [columns, rows],
    lattice: [LATTICE_NODES, aligned],
    maxPointSize: range ? range[1] : 32,
  };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  const { gl } = renderer;
  gl.deleteBuffer(renderer.pointBuffer);
  gl.deleteBuffer(renderer.bgBuffer);
  gl.deleteProgram(renderer.pointProgram);
  gl.deleteProgram(renderer.bgProgram);
  const canvas = gl.canvas as HTMLCanvasElement;
  window.setTimeout(() => {
    if (canvas.isConnected || gl.isContextLost()) return;
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
  }, 0);
}

export function BgParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const lite = window.innerWidth < 768 || !finePointerQuery.matches;
    const count = lite ? MOBILE_COUNT : DESKTOP_COUNT;

    let renderer = createRenderer(canvas, count);
    if (!renderer) {
      setUnsupported(true);
      return;
    }

    let reducedMotion = reducedMotionQuery.matches;
    let finePointer = finePointerQuery.matches;
    let frameId = 0;
    let lastFrame = performance.now();
    let elapsed = 0;
    let orbitPhase = 0;
    let contextLost = false;
    let disposed = false;
    let bounds = measureSections();

    let lastScrollY = window.scrollY;
    let targetSection = sectionFromScroll(bounds, lastScrollY, window.innerHeight);
    let section = targetSection;
    let velocity = 0;
    let velocityDir = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetHover = 0;
    let hover = 0;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const host = canvas.parentElement ?? canvas;
      const scale = lite ? RENDER_SCALE * 0.9 : RENDER_SCALE;
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, pointUniforms: pu, bgUniforms: bu } = renderer;
      const width = canvas.width;
      const height = canvas.height;
      const aspect = width / height;
      const time = reducedMotion ? STILL_TIME : elapsed;
      const preset = mixPreset(section);
      const portrait = aspect < 1;
      const angle = Math.sin(orbitPhase) * preset.orbit + (reducedMotion ? 0 : orbitPhase * 0.02);
      const dx = preset.eye[0] - preset.target[0];
      const dz = preset.eye[2] - preset.target[2];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const distanceScale = portrait ? 1.25 : 1;
      const eye: Vec3 = [
        preset.target[0] + (dx * cos - dz * sin) * distanceScale,
        preset.target[1] + (preset.eye[1] - preset.target[1]) * distanceScale + Math.sin(orbitPhase * 0.7) * 0.15,
        preset.target[2] + (dx * sin + dz * cos) * distanceScale,
      ];
      const fovDegrees = portrait ? Math.min(78, preset.fov * 1.3) : preset.fov;
      const projection = perspective((fovDegrees * Math.PI) / 180, aspect, 0.1, 60);
      const viewProj = multiply(projection, lookAt(eye, preset.target));
      const shift = portrait ? preset.mobileShift : preset.shift;

      gl.viewport(0, 0, width, height);
      gl.disable(gl.BLEND);
      gl.useProgram(renderer.bgProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.bgBuffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(1);
      gl.disableVertexAttribArray(2);
      gl.uniform2f(bu.uRes, width, height);
      gl.uniform1f(bu.uSection, section);
      gl.uniform1f(bu.uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.enable(gl.BLEND);
      gl.useProgram(renderer.pointProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.pointBuffer);
      gl.enableVertexAttribArray(0);
      gl.enableVertexAttribArray(1);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 36, 0);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 36, 4);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
      gl.uniformMatrix4fv(pu.uViewProj, false, viewProj);
      gl.uniform1f(pu.uTime, time);
      gl.uniform1f(pu.uSection, section);
      gl.uniform2f(pu.uGrid, renderer.grid[0], renderer.grid[1]);
      gl.uniform2f(pu.uLattice, renderer.lattice[0], renderer.lattice[1]);
      gl.uniform1f(pu.uVel, reducedMotion ? 0 : velocity);
      gl.uniform1f(pu.uVelDir, velocityDir);
      gl.uniform2f(pu.uMouse, mouseX, mouseY);
      gl.uniform1f(pu.uHover, hover);
      gl.uniform1f(pu.uAspect, aspect);
      gl.uniform2f(pu.uShift, shift[0], shift[1]);
      gl.uniform1f(pu.uSize, Math.min(renderer.maxPointSize, height * (lite ? 0.03 : 0.028)));
      gl.uniform1f(pu.uCalm, portrait ? preset.calm * 0.4 : preset.calm);
      gl.uniform1f(pu.uGain, preset.gain * (portrait ? 0.78 : 1));
      gl.uniform1f(pu.uPortrait, portrait ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, renderer.count);
    };

    const tick = (now: number) => {
      frameId = 0;
      if (document.hidden || contextLost || reducedMotion || disposed) return;
      const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;

      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(delta) / deltaSeconds : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, window.innerHeight);

      const targetVelocity = clamp01(scrollSpeed / 3000);
      const velocityRate = targetVelocity > velocity ? 0.2 : 0.05;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      if (Math.abs(delta) > 0.5) velocityDir = lerp(velocityDir, delta > 0 ? 1 : -1, easeFactor(0.2, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.05, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.1, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.1, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.05, deltaSeconds));
      elapsed += deltaSeconds * (1 + velocity * 1.5);
      orbitPhase += deltaSeconds * (0.12 + velocity * 1.4);

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
      if (frameId || document.hidden || contextLost || disposed) return;
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
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = 1 - (event.clientY / window.innerHeight) * 2;
      if (targetHover === 0) {
        mouseX = targetMouseX;
        mouseY = targetMouseY;
      }
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
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const handleContextRestored = () => {
      if (disposed) return;
      renderer = createRenderer(canvas, count);
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
      disposed = true;
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
