import { useEffect, useRef, useState } from "react";

const FRAGMENT_BODY = `uniform float uTime;
uniform vec2 uRes;
uniform float uDim;
uniform float uK;
uniform float uFl;
uniform float uWarm;
uniform float uRipple;
uniform float uWob;
uniform float uStretch;
uniform float uFilm;
uniform vec3 uCamPos;
uniform mat3 uCam;
uniform vec4 uB[7];
uniform vec3 uMainS;
uniform vec4 uBound;
uniform int uSteps;
uniform int uRefl;

const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);
const vec3 RAX = vec3(0.25, 0.33, 0.91);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdEll(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float map(vec3 p) {
  vec3 q = p - uB[0].xyz;
  q.y /= uStretch;
  float d = sdEll(q, max(uB[0].w * uMainS, vec3(0.02)));
  if (uRipple > 0.0001) {
    float f = dot(q, RAX) / max(length(q), 0.001);
    d += uRipple * sin(f * 19.0 - uTime * 2.6) * smoothstep(-0.1, 0.8, f);
  }
  for (int i = 1; i < 7; i++) {
    vec3 r = p - uB[i].xyz;
    r.y /= uStretch;
    d = smin(d, length(r) - uB[i].w, uK);
  }
  if (uWob > 0.0001) d += uWob * sin(p.x * 2.3 + uTime * 1.1) * sin(p.y * 2.9 - uTime * 0.9) * sin(p.z * 2.1 + uTime * 0.7);
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.0025;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

vec2 bound(vec3 ro, vec3 rd) {
  vec3 oc = ro - uBound.xyz;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uBound.w * uBound.w;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(max(-b - h, 0.0), -b + h);
}

float softbox(vec3 d, vec3 axis, vec2 size, float soft) {
  float w = dot(d, axis);
  if (w <= 0.0) return 0.0;
  vec3 t = normalize(cross(axis, vec3(0.0, 1.0, 0.0)));
  vec3 b = cross(t, axis);
  vec2 q = vec2(dot(d, t), dot(d, b)) / w;
  vec2 e = abs(q) - size;
  float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
  return (1.0 - smoothstep(-soft * 0.4, soft, sd)) * smoothstep(0.0, 0.2, w);
}

vec3 env(vec3 d) {
  float y = d.y;
  vec3 c = mix(vec3(0.03, 0.028, 0.032), vec3(0.34, 0.33, 0.36), smoothstep(0.0, 0.08, y) * (1.0 - 0.75 * smoothstep(0.05, 0.9, y)));
  c += mix(mix(PAPER, DUSK, 0.15), EMBER * 1.3, uWarm * 0.75) * 0.9 * exp(-abs(y - 0.035) * 22.0);
  c += mix(PAPER, DUSK, 0.5) * 0.12 * exp(-abs(y + 0.25) * 6.0);
  c += EMBER * uWarm * 0.2 * smoothstep(0.05, -0.7, y);
  c += PAPER * 0.14 * smoothstep(0.2, 1.0, d.z) * smoothstep(-0.3, 0.6, y);
  float cool = 1.0 - 0.55 * uWarm;
  c += PAPER * 1.6 * cool * softbox(d, vec3(-0.55, 0.25, 0.8), vec2(0.07, 0.95), 0.14);
  c += PAPER * 1.1 * cool * softbox(d, vec3(0.1, 0.9, 0.42), vec2(1.2, 0.07), 0.12);
  c += PAPER * 2.0 * cool * softbox(d, vec3(0.52, 0.48, 0.71), vec2(0.2, 0.13), 0.14);
  c += EMBER * (1.4 + 1.3 * uWarm) * softbox(d, vec3(0.975, -0.054, -0.217), vec2(0.08, 1.0), 0.16);
  c += DUSK * 1.9 * cool * softbox(d, vec3(-0.943, 0.105, -0.314), vec2(0.09, 0.9), 0.16);
  c += EMBER * uWarm * 2.2 * softbox(d, vec3(0.0, 0.45, -0.89), vec2(1.9, 0.18), 0.3);
  c += mix(EMBER, PAPER, 0.35) * uWarm * 1.4 * softbox(d, vec3(0.3, 0.6, -0.74), vec2(0.35, 0.05), 0.1);
  c += mix(DUSK, PAPER, 0.45) * 0.45 * softbox(d, vec3(0.0, -0.507, 0.862), vec2(1.0, 0.06), 0.14);
  return c;
}

vec3 chrome(vec3 p, vec3 rd, vec3 n) {
  float ndv = clamp(dot(-rd, n), 0.0, 1.0);
  vec3 rf = reflect(rd, n);
  vec3 refl = env(rf);
  if (uRefl > 0) {
    vec3 q = p + n * 0.03;
    float far = bound(q, rf).y;
    float s = 0.02;
    bool hit = false;
    for (int i = 0; i < 16; i++) {
      if (i >= uRefl || s > far) break;
      float d = map(q + rf * s);
      if (d < 0.003) {
        hit = true;
        break;
      }
      s += max(d * 0.9, 0.02);
    }
    if (hit) {
      vec3 p2 = q + rf * s;
      vec3 n2 = calcNormal(p2);
      refl = env(reflect(rf, n2)) * 0.78 + mix(DUSK, PAPER, 0.3) * 0.015;
    }
  }
  float ao = clamp(0.35 + 0.65 * map(p + n * 0.28) / 0.28, 0.0, 1.0);
  float fr = 0.62 + 0.38 * pow(1.0 - ndv, 5.0);
  vec3 col = refl * vec3(0.95, 0.94, 0.97) * fr * ao;
  vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.3, 0.62) + (1.0 - ndv) * 1.3 + p.y * 0.12 + uTime * 0.03));
  film = mix(film, film * mix(DUSK, EMBER, 0.5 + 0.5 * sin(p.x * 1.7 + uTime * 0.2)) * 1.6, 0.35);
  float g = smoothstep(0.15, 0.85, 1.0 - ndv) * uFilm;
  col = mix(col, col * (0.3 + 1.4 * film), g);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = uCamPos;
  vec3 rd = uCam * normalize(vec3(uv, -uFl));

  vec3 color = INK;
  float halo = 0.0;
  for (int i = 0; i < 7; i++) {
    vec3 oc = uB[i].xyz - ro;
    float along = max(dot(oc, rd), 0.0);
    float rr = max(uB[i].w, 0.0) * (i == 0 ? max(uMainS.x, uMainS.y) : 1.0);
    float dl = max(length(oc - rd * along) - rr, 0.0);
    halo += exp(-dl * 2.6) * rr;
  }
  color += mix(DUSK, EMBER, 0.15 + 0.6 * uWarm) * 0.035 * min(halo, 2.0) * uDim;
  color += EMBER * uWarm * 0.07 * exp(-dot(uv - vec2(0.0, -0.62), (uv - vec2(0.0, -0.62)) * vec2(0.8, 4.0)) * 3.0);

  vec2 tb = bound(ro, rd);
  if (tb.y > 0.0) {
    float t = tb.x;
    float pixel = 1.6 / (uRes.y * uFl);
    float edgeRatio = 100.0;
    float edgeT = t;
    bool hit = false;
    for (int i = 0; i < 56; i++) {
      if (i >= uSteps) break;
      float d = map(ro + rd * t);
      float ratio = d / max(t, 0.5);
      if (ratio < edgeRatio) {
        edgeRatio = ratio;
        edgeT = t;
      }
      if (d < 0.0008 * t + 0.0005) {
        hit = true;
        break;
      }
      t += d * 0.82;
      if (t > tb.y) break;
    }
    float coverage = hit ? 1.0 : 1.0 - smoothstep(0.0, pixel * 1.5, edgeRatio);
    if (!hit) t = edgeT;
    if (coverage > 0.001) {
      vec3 p = ro + rd * t;
      vec3 n = calcNormal(p);
      vec3 c = chrome(p, rd, n);
      c *= exp(-max(t - 6.0, 0.0) * 0.12);
      color = mix(color, c * uDim, coverage);
    }
  }

  color = color * (1.0 + color / 7.0) / (1.0 + color);

  vec2 sv = gl_FragCoord.xy / uRes - 0.5;
  float vignette = smoothstep(1.0, 0.25, length(sv * vec2(1.1, 1.25)));
  color = mix(INK * 0.6, color, 0.45 + 0.55 * vignette);

  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  color += grain * 0.02;

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
const STILL_TIME = 6;
const BLOBS = 7;
const FALLBACK_BACKGROUND =
  "radial-gradient(34% 44% at 80% 48%, rgba(239, 233, 223, 0.08), transparent 70%), radial-gradient(30% 35% at 90% 64%, rgba(255, 91, 36, 0.1), transparent 70%), radial-gradient(30% 40% at 72% 30%, rgba(122, 92, 255, 0.1), transparent 70%), #0b0a0c";

const UNIFORM_NAMES = [
  "uTime",
  "uRes",
  "uDim",
  "uK",
  "uFl",
  "uWarm",
  "uRipple",
  "uWob",
  "uStretch",
  "uFilm",
  "uCamPos",
  "uCam",
  "uB",
  "uMainS",
  "uBound",
  "uSteps",
  "uRefl",
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

type SceneParams = {
  cam: number;
  targetX: number;
  tilt: number;
  k: number;
  dim: number;
  warm: number;
  ripple: number;
  wob: number;
  film: number;
  mouse: number;
};

const PARAMS: SceneParams[] = [
  { cam: 6, targetX: 0, tilt: 0, k: 0.5, dim: 1, warm: 0.2, ripple: 0, wob: 0.035, film: 0.45, mouse: 1 },
  { cam: 4.6, targetX: 0.35, tilt: 0.04, k: 0.32, dim: 0.95, warm: 0.25, ripple: 0.028, wob: 0.02, film: 0.5, mouse: 1 },
  { cam: 6, targetX: 0, tilt: 0, k: 0.1, dim: 0.9, warm: 0.2, ripple: 0, wob: 0.01, film: 0.25, mouse: 0 },
  { cam: 6.8, targetX: 0, tilt: 0, k: 0.3, dim: 0.42, warm: 0.12, ripple: 0, wob: 0.015, film: 0.25, mouse: 0 },
  { cam: 5.6, targetX: 0, tilt: -0.22, k: 0.78, dim: 0.9, warm: 1, ripple: 0.01, wob: 0.035, film: 0.4, mouse: 0.6 },
];

const ORBIT_RADIUS = [1.75, 1.95, 1.6, 2.15, 1.85];
const ORBIT_SIZE = [0.34, 0.24, 0.2, 0.28, 0.15];
const ORBIT_SPEED = [0.3, -0.22, 0.38, 0.19, -0.34];
const ORBIT_PHASE = [0, 1.6, 3.1, 4.4, 5.5];
const ORBIT_TILT = [0.35, -0.3, 0.55, 0.15, -0.5];

const ABOUT_DROPS = [
  0.15, 1.2, -0.5, 0.22,
  2.45, 1.15, 0.1, 0.28,
  2.4, -1.15, -0.2, 0.22,
  0.3, -1.1, 0.4, 0.18,
  2.95, 0.15, -1.2, 0.2,
  2.2, 0.05, 0.9, 0.15,
];

const WORKS_DROPS = [
  3.55, 1.6, -1.6, 0.36,
  -3.7, -1.75, -1.4, 0.22,
  3.75, -1.7, -1.1, 0.24,
  -3.8, 1.75, -2.2, 0.16,
  3.95, -1.05, -1.6, 0.13,
  3.2, 1.15, -1.2, 0.12,
  -3.4, -1.95, -1.0, 0.12,
];

const CONTACT_DROPS = [
  -0.75, -1.2, 0.25, 0.3,
  0.8, -1.18, -0.1, 0.34,
  0.05, -1.05, 0.35, 0.24,
  -1.7, -1.42, 0.05, 0.2,
  1.65, -1.42, 0.15, 0.22,
  0.3, -1.0, 0.6, 0.16,
];

const LAG = [0, 0.6, 1, 0.8, 1.2, 0.9, 0.7];

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const easeFactor = (rate: number, deltaSeconds: number) => 1 - Math.pow(1 - rate, deltaSeconds * 60);

function layout(index: number, t: number, out: Float32Array, scale: Float32Array) {
  scale[0] = 1;
  scale[1] = 1;
  scale[2] = 1;
  if (index === 0) {
    const cx = 2.05;
    out[0] = cx;
    out[1] = Math.sin(t * 0.31) * 0.08;
    out[2] = 0;
    out[3] = 0.92;
    scale[0] = 1 + 0.05 * Math.sin(t * 0.7);
    scale[1] = 1 + 0.06 * Math.sin(t * 0.55 + 1.3);
    scale[2] = 1 + 0.04 * Math.sin(t * 0.63 + 2.1);
    for (let i = 0; i < 5; i++) {
      const a = ORBIT_PHASE[i] + t * ORBIT_SPEED[i];
      const r = ORBIT_RADIUS[i] + 0.32 * Math.sin(t * 0.37 + i * 1.7);
      const lx = Math.cos(a) * r;
      const lz = Math.sin(a) * r;
      const o = (i + 1) * 4;
      out[o] = cx + lx * 0.82;
      out[o + 1] = out[1] + lx * ORBIT_TILT[i] + Math.sin(a * 2 + i) * 0.18;
      out[o + 2] = lz * 0.7;
      out[o + 3] = ORBIT_SIZE[i] * (1 + 0.08 * Math.sin(t * 1.3 + i));
    }
    const a = t * 0.27 + 2.4;
    out[24] = cx + Math.cos(a) * 1.4;
    out[25] = 1.05 + Math.sin(a * 1.3) * 0.25;
    out[26] = Math.sin(a) * 1.1;
    out[27] = 0.2;
    return;
  }
  if (index === 1) {
    out[0] = 1.5;
    out[1] = Math.sin(t * 0.4) * 0.06;
    out[2] = 0;
    out[3] = 0.78;
    scale[0] = 1 + 0.03 * Math.sin(t * 0.8);
    scale[1] = 1 - 0.03 * Math.sin(t * 0.8);
    for (let i = 0; i < 6; i++) {
      const o = (i + 1) * 4;
      const s = i * 4;
      out[o] = ABOUT_DROPS[s] + Math.sin(t * 0.43 + i * 1.9) * 0.12;
      out[o + 1] = ABOUT_DROPS[s + 1] + Math.sin(t * 0.51 + i * 2.7) * 0.12;
      out[o + 2] = ABOUT_DROPS[s + 2] + Math.sin(t * 0.37 + i) * 0.1;
      out[o + 3] = ABOUT_DROPS[s + 3];
    }
    return;
  }
  if (index === 2) {
    for (let i = 0; i < 6; i++) {
      const pulse = Math.pow(Math.max(0, Math.sin(t * 1.6 - i * 0.72)), 8);
      const o = i * 4;
      out[o] = 2.2 + pulse * 0.12;
      out[o + 1] = 1.55 - i * 0.62;
      out[o + 2] = 0;
      out[o + 3] = 0.21 * (1 + 0.4 * pulse);
    }
    out[24] = 2.2;
    out[25] = 1.55 - 2 * 0.62;
    out[26] = 0;
    out[27] = 0.1;
    return;
  }
  if (index === 3) {
    for (let i = 0; i < 7; i++) {
      const o = i * 4;
      out[o] = WORKS_DROPS[o] + Math.sin(t * 0.3 + i * 1.3) * 0.08;
      out[o + 1] = WORKS_DROPS[o + 1] + Math.sin(t * 0.37 + i * 2.1) * 0.08;
      out[o + 2] = WORKS_DROPS[o + 2];
      out[o + 3] = WORKS_DROPS[o + 3];
    }
    return;
  }
  out[0] = 0;
  out[1] = -1.5;
  out[2] = 0;
  out[3] = 1;
  scale[0] = 2.2 + 0.08 * Math.sin(t * 0.5);
  scale[1] = 0.36 + 0.025 * Math.sin(t * 0.9);
  scale[2] = 1.3;
  for (let i = 0; i < 6; i++) {
    const o = (i + 1) * 4;
    const s = i * 4;
    out[o] = CONTACT_DROPS[s] + Math.sin(t * 0.23 + i * 1.7) * 0.18;
    out[o + 1] = CONTACT_DROPS[s + 1] + Math.sin(t * 0.8 + i * 2.3) * 0.06;
    out[o + 2] = CONTACT_DROPS[s + 2];
    out[o + 3] = CONTACT_DROPS[s + 3] * (1 + 0.06 * Math.sin(t * 0.9 + i));
  }
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

export function BgChrome() {
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
    let signedVelocity = 0;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetHover = 0;
    let hover = 0;

    let compact = false;
    let renderScale = 1;
    let slowFrames = 0;
    let sampledFrames = 0;

    const fromBlobs = new Float32Array(BLOBS * 4);
    const toBlobs = new Float32Array(BLOBS * 4);
    const fromScale = new Float32Array(3);
    const toScale = new Float32Array(3);
    const blobs = new Float32Array(BLOBS * 4);
    const cameraMatrix = new Float32Array(9);

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const host = canvas.parentElement ?? canvas;
      compact = host.clientWidth < 768 || !finePointer;
      const scale = (compact ? 0.34 : 0.5) * renderScale;
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, uniforms } = renderer;
      const clamped = Math.min(PARAMS.length - 1, Math.max(0, section));
      const index = Math.min(PARAMS.length - 2, Math.floor(clamped));
      const raw = clamped - index;
      const amount = raw * raw * (3 - 2 * raw);
      const from = PARAMS[index];
      const to = PARAMS[index + 1];
      const time = reducedMotion ? STILL_TIME : elapsed;
      const vel = reducedMotion ? 0 : velocity;
      const svel = reducedMotion ? 0 : signedVelocity;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const fit = Math.min(1, Math.max(0.3, aspect / 1.6));
      const sizeFit = 0.55 + 0.45 * fit;
      const xFit = fit + (1 - fit) * 0.2;
      const yFit = 1 + (1 - fit) * 0.3;
      const focal = 1.6;

      layout(index, time, fromBlobs, fromScale);
      layout(index + 1, time, toBlobs, toScale);

      const k = lerp(from.k, to.k, amount) * sizeFit;
      const wob = (lerp(from.wob, to.wob, amount) + vel * 0.07) * sizeFit;
      const ripple = lerp(from.ripple, to.ripple, amount) * sizeFit;
      const stretch = 1 + vel * 0.55;
      const camDistance = lerp(from.cam, to.cam, amount);
      const targetX = lerp(from.targetX, to.targetX, amount) * xFit;

      const yScale = lerp(yFit, 1, index === 3 ? amount : 0);
      const portrait = clamp01((1 - fit) / 0.5);
      for (let i = 0; i < BLOBS; i++) {
        const o = i * 4;
        const z = lerp(fromBlobs[o + 2], toBlobs[o + 2], amount);
        const r = lerp(fromBlobs[o + 3], toBlobs[o + 3], amount) * sizeFit;
        let x = lerp(fromBlobs[o], toBlobs[o], amount) * xFit;
        const limit = ((camDistance - z) * 0.5 * aspect) / focal - Math.min(r, 0.3) * 1.3;
        if (r < 0.3 && Math.abs(x) > limit) x = Math.sign(x) * lerp(Math.abs(x), Math.max(0, limit), portrait);
        blobs[o] = x;
        blobs[o + 1] = lerp(fromBlobs[o + 1], toBlobs[o + 1], amount) * yScale + svel * 0.32 * LAG[i];
        blobs[o + 2] = z;
        blobs[o + 3] = r;
      }

      const mouseAmount = lerp(from.mouse, to.mouse, amount) * hover * 0.9;
      if (mouseAmount > 0.001) {
        const depth = camDistance - 0.6;
        const wx = targetX + (mouseX - 0.5) * aspect * depth / focal;
        const wy = (mouseY - 0.5) * depth / focal;
        blobs[24] = lerp(blobs[24], wx, mouseAmount);
        blobs[25] = lerp(blobs[25], wy, mouseAmount);
        blobs[26] = lerp(blobs[26], 0.6, mouseAmount);
      }

      const sx = lerp(fromScale[0], toScale[0], amount);
      const sy = lerp(fromScale[1], toScale[1], amount);
      const sz = lerp(fromScale[2], toScale[2], amount);
      const maxScale = Math.max(sx, sy, sz);
      const margin = k * 0.3 + wob + ripple + 0.12;
      let minX = Infinity;
      let minY = Infinity;
      let minZ = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (let i = 0; i < BLOBS; i++) {
        const o = i * 4;
        const r = Math.max(0, blobs[o + 3]) * (i === 0 ? maxScale : 1);
        const ry = r * stretch;
        minX = Math.min(minX, blobs[o] - r);
        maxX = Math.max(maxX, blobs[o] + r);
        minY = Math.min(minY, blobs[o + 1] - ry);
        maxY = Math.max(maxY, blobs[o + 1] + ry);
        minZ = Math.min(minZ, blobs[o + 2] - r);
        maxZ = Math.max(maxZ, blobs[o + 2] + r);
      }
      const bx = (minX + maxX) / 2;
      const by = (minY + maxY) / 2;
      const bz = (minZ + maxZ) / 2;
      const br = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + margin;

      const drift = reducedMotion ? 0 : Math.sin(time * 0.11) * 0.025;
      const yaw = (mouseX - 0.5) * 0.1 * hover + drift;
      const pitch = (mouseY - 0.5) * 0.07 * hover + lerp(from.tilt, to.tilt, amount);
      const cy = Math.cos(yaw);
      const sy2 = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      cameraMatrix[0] = cy;
      cameraMatrix[1] = 0;
      cameraMatrix[2] = -sy2;
      cameraMatrix[3] = sy2 * sp;
      cameraMatrix[4] = cp;
      cameraMatrix[5] = cy * sp;
      cameraMatrix[6] = sy2 * cp;
      cameraMatrix[7] = -sp;
      cameraMatrix[8] = cy * cp;

      const fast = vel > 0.35;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uDim, lerp(from.dim, to.dim, amount) * (0.8 + 0.2 * fit));
      gl.uniform1f(uniforms.uK, Math.max(0.02, k));
      gl.uniform1f(uniforms.uFl, focal);
      gl.uniform1f(uniforms.uWarm, lerp(from.warm, to.warm, amount));
      gl.uniform1f(uniforms.uRipple, ripple);
      gl.uniform1f(uniforms.uWob, wob);
      gl.uniform1f(uniforms.uStretch, stretch);
      gl.uniform1f(uniforms.uFilm, lerp(from.film, to.film, amount));
      gl.uniform3f(
        uniforms.uCamPos,
        targetX + cameraMatrix[6] * camDistance,
        cameraMatrix[7] * camDistance,
        cameraMatrix[8] * camDistance,
      );
      gl.uniformMatrix3fv(uniforms.uCam, false, cameraMatrix);
      gl.uniform4fv(uniforms.uB, blobs);
      gl.uniform3f(uniforms.uMainS, sx, sy, sz);
      gl.uniform4f(uniforms.uBound, bx, by, bz, br);
      gl.uniform1i(uniforms.uSteps, compact ? (fast ? 28 : 36) : fast ? 44 : 56);
      gl.uniform1i(uniforms.uRefl, compact || fast ? 0 : 14);
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
        if (slowFrames > 30 && renderScale > 0.5) {
          renderScale = Math.max(0.5, renderScale * 0.82);
          resizeCanvas();
        }
        sampledFrames = 0;
        slowFrames = 0;
      }

      const scrollY = window.scrollY;
      const scrollDelta = scrollY - lastScrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(scrollDelta) / deltaSeconds : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, window.innerHeight);

      const targetVelocity = clamp01(scrollSpeed / 3200);
      const velocityRate = targetVelocity > velocity ? 0.18 : 0.045;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      const targetSigned = scrollDelta === 0 ? 0 : Math.sign(scrollDelta) * targetVelocity;
      signedVelocity = lerp(signedVelocity, targetSigned, easeFactor(Math.abs(targetSigned) > Math.abs(signedVelocity) ? 0.12 : 0.04, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.06, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.05, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.05, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.03, deltaSeconds));

      draw();
      frameId = requestAnimationFrame(tick);
    };

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      velocity = 0;
      signedVelocity = 0;
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
