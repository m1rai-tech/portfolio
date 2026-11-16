import { useEffect, useRef, useState } from "react";

const COMMON = `const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);

uniform float uSection;
uniform float uTime;
uniform vec2 uRes;

float sw(float i) {
  return clamp(1.0 - abs(uSection - i), 0.0, 1.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 skyColor(vec3 dir) {
  float w0 = sw(0.0);
  float w1 = sw(1.0);
  float w2 = sw(2.0);
  float w3 = sw(3.0);
  float w4 = sw(4.0);
  float e = dir.y;
  vec3 c = INK * (0.78 + 0.22 * exp(-max(e, 0.0) * 3.0));
  float side = smoothstep(-0.6, 0.9, dir.x);
  float haze = exp(-abs(e + 0.01) * 9.0);
  float wide = exp(-abs(e + 0.01) * 3.2);
  float hazeAmt = w0 * (0.05 + 0.13 * side) + w1 * 0.07 + w2 * 0.04 + w3 * 0.035 + w4 * 0.1;
  c += DUSK * haze * hazeAmt;
  c += DUSK * wide * hazeAmt * 0.25;
  float lobe = exp(-dir.x * dir.x * 1.6);
  float band = exp(-abs(e + 0.005) * 26.0);
  float emberAmt = w0 * 0.05 * side + w1 * 0.015 + w4 * 0.3 * lobe;
  c += EMBER * band * emberAmt;
  c += EMBER * wide * w4 * 0.045 * lobe;
  return c;
}
`;

const TERRAIN_VERTEX = `uniform mat4 uViewProj;
uniform float uSnap;
uniform float uFrac;
uniform float uCamZ;
uniform float uHalfW;
uniform float uDepth;
uniform float uMountX;
uniform float uPhase;

attribute vec2 aGrid;

varying vec3 vRel;
varying vec2 vLine;
varying float vRaw;
varying float vEmber;
varying float vShade;
varying float vEdge;

vec2 grad(vec2 p) {
  float h = hash12(p) * 6.2831853;
  return vec2(cos(h), sin(h));
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(grad(i), f);
  float b = dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.4;
}

const mat2 ROT = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    sum += amp * gnoise(p);
    p = ROT * p * 2.03 + vec2(13.7, 7.1);
    amp *= 0.5;
  }
  return sum;
}

float ridged(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.56;
  float prev = 1.0;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    float n = 1.0 - abs(gnoise(p));
    n = n * n;
    sum += n * amp * prev;
    prev = clamp(n * 1.2, 0.0, 1.0);
    p = ROT * p * 2.07 + vec2(3.1, 17.9);
    amp *= 0.45;
  }
  return sum;
}

float canyonX(float z) {
  return 4.0 * sin(z * 0.035) + 1.6 * sin(z * 0.09 + 1.3);
}

vec4 terrain(vec2 local) {
  float w0 = sw(0.0);
  float w1 = sw(1.0);
  float w2 = sw(2.0);
  float w3 = sw(3.0);
  float w4 = sw(4.0);
  float x = local.x;
  float zAbs = local.y + uSnap;
  float relZ = local.y + uFrac;
  vec2 p = vec2(x, zAbs);
  float base = fbm(p * 0.045, 3);
  float r = ridged(p * 0.021 + vec2(41.0, 7.0), 4);
  float rs = smoothstep(0.15, 0.95, r);
  float peak = pow(rs, 1.7);
  float crest = smoothstep(0.62, 0.9, r);
  float near = smoothstep(3.0, 16.0, length(vec2(x, relZ)));

  float mR = smoothstep(uMountX, uMountX + 24.0, x + 9.0 * base) * smoothstep(10.0, 34.0, -relZ);
  float hHero = 1.3 * base * (0.3 + 0.7 * near) + mR * (peak * 32.0 + 3.0 * base);
  float eHero = mR * (0.3 + 0.7 * crest) * smoothstep(11.0, 26.0, hHero);

  float center = canyonX(zAbs) - canyonX(uCamZ);
  float d = abs(x - center);
  float wall = smoothstep(3.4, 11.0, d + 1.6 * base);
  float terrace = wall * (14.0 + 9.0 * rs);
  terrace = mix(terrace, floor(terrace * 0.4 + 0.5) * 2.5, 0.3 * wall);
  float hAbout = -10.0 + terrace + 0.4 * base;
  float eAbout = smoothstep(17.0, 22.0, terrace) * crest * 0.6;

  float hStack = 0.05 * base;

  float hWorks = 1.6 * base * near + smoothstep(6.0, 26.0, abs(x)) * peak * 8.0;

  float mC = smoothstep(30.0, 105.0, -relZ);
  float hContact = 1.6 * base + mC * (peak * 30.0 + 5.0 * base);
  float eContact = mC * (0.3 + 0.7 * crest) * smoothstep(12.0, 26.0, hContact);

  float h = w0 * hHero + w1 * hAbout + w2 * hStack + w3 * hWorks + w4 * hContact;
  float raw = 0.0;
  if (w2 > 0.0) raw = pow(smoothstep(0.15, 0.95, ridged(p * 0.03 + vec2(9.0, 3.0), 2)), 1.4) * 20.0 + 3.0 * fbm(p * 0.04, 2);
  float ember = w0 * eHero + w1 * eAbout + w4 * eContact;
  return vec4(h, raw, ember, r);
}

void main() {
  vec2 local = aGrid;
  vec4 t = terrain(local);
  vec4 tx = terrain(local + vec2(0.6, 0.0));
  vec4 tz = terrain(local + vec2(0.0, 0.6));
  vec3 n = normalize(vec3(t.x - tx.x, 0.6, t.x - tz.x));
  vec3 l = normalize(vec3(0.55, 0.45, -0.7));
  vShade = clamp(dot(n, l), 0.0, 1.0);
  float relZ = local.y + uFrac;
  vRel = vec3(local.x, t.x, relZ);
  vLine = vec2(local.x, local.y + uPhase);
  vRaw = t.y;
  vEmber = t.z;
  vEdge = max(smoothstep(uHalfW * 0.72, uHalfW, abs(local.x)), smoothstep(uDepth * 0.7, uDepth, -relZ));
  gl_Position = uViewProj * vec4(vRel, 1.0);
}
`;

const TERRAIN_FRAGMENT = `uniform vec3 uCam;
uniform float uLineWidth;

varying vec3 vRel;
varying vec2 vLine;
varying float vRaw;
varying float vEmber;
varying float vShade;
varying float vEdge;

float gridLine(float coord, float fw, float width) {
  float g = abs(fract(coord - 0.5) - 0.5) / fw;
  return (1.0 - smoothstep(0.0, width, g)) * (1.0 - smoothstep(0.07, 0.17, fw));
}

float lodLine(float coord, float fw, float width) {
  float a = gridLine(coord, fw, width);
  float b = gridLine(coord * 0.5, fw * 0.5, width) * 0.85;
  float c = gridLine(coord * 0.25, fw * 0.25, width) * 0.7;
  float d = gridLine(coord * 0.125, fw * 0.125, width) * 0.55;
  return max(max(a, b), max(c, d));
}

void main() {
  float w0 = sw(0.0);
  float w1 = sw(1.0);
  float w2 = sw(2.0);
  float w3 = sw(3.0);
  float w4 = sw(4.0);
  vec3 rel = vRel - uCam;
  float dist = length(rel);
  vec3 dir = rel / max(dist, 1e-4);
  vec3 sky = skyColor(dir);

  float dens = w0 * 0.013 + w1 * 0.022 + w2 * 0.011 + w3 * 0.05 + w4 * 0.0075;
  float fog = 1.0 - exp(-pow(dist * dens, 1.6));
  fog = max(fog, vEdge);

  vec2 fw = max(fwidth(vLine), vec2(1e-4));
  float lw = uLineWidth;
  float minor = max(lodLine(vLine.x, fw.x, lw), lodLine(vLine.y, fw.y, lw));
  vec2 v5 = vLine / 5.0;
  vec2 fw5 = fw / 5.0;
  float major = max(gridLine(v5.x, fw5.x, lw * 1.3), gridLine(v5.y, fw5.y, lw * 1.3));

  float c = vRaw * 0.55;
  float fwc = max(fwidth(c), 1e-4);
  float contour = gridLine(c, fwc, lw * 1.1);
  float c5 = c / 4.0;
  float index = gridLine(c5, fwc / 4.0, lw * 1.6);

  vec2 screen = gl_FragCoord.xy / uRes;
  float calmLeft = mix(1.0, 0.35 + 0.65 * smoothstep(0.05, 0.7, screen.x), w0 * 0.85 + w4 * 0.35 + w1 * 0.4);
  calmLeft *= mix(1.0, 0.55 + 0.45 * smoothstep(0.95, 0.45, screen.y), w0 * 0.6);

  vec3 fill = INK * 0.86 + DUSK * 0.022 * vShade * (1.0 - w2) + EMBER * 0.05 * vEmber * vShade;

  float rise = smoothstep(2.0, 22.0, vRel.y);
  float lineAlpha = w0 * mix(0.16, 0.34, rise) + w1 * 0.25 + w2 * 0.075 + w3 * 0.12 + w4 * mix(0.1, 0.32, rise);
  lineAlpha *= mix(0.4, 1.0, smoothstep(2.0, 16.0, dist));
  float emberT = smoothstep(0.05, 0.7, vEmber);
  vec3 lineCol = mix(PAPER, EMBER, emberT);
  float emberBoost = 1.0 + 1.6 * emberT;
  float gridMix = max(minor, major * (0.4 + 0.6 * w2));
  vec3 col = fill + lineCol * gridMix * lineAlpha * emberBoost * calmLeft;

  float plan = w2 * (1.0 - 0.6 * smoothstep(0.0, 0.5, w1 + w3));
  float planCalm = 0.55 + 0.45 * smoothstep(0.0, 0.9, abs(screen.x - 0.42) * 1.6 + abs(screen.y - 0.5));
  col += PAPER * contour * 0.15 * plan * planCalm;
  col += mix(PAPER, EMBER, 0.7) * index * 0.26 * plan * planCalm;
  col += EMBER * major * 0.035 * plan;

  col = mix(col, sky, fog);
  float grain = hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  col += grain * 0.022;
  FRAG = vec4(max(col, 0.0), 1.0);
}
`;

const SKY_VERTEX = `attribute vec2 aPosition;
varying vec2 vNdc;
void main() {
  vNdc = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const SKY_FRAGMENT = `uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uForward;
uniform vec2 uTan;
varying vec2 vNdc;

void main() {
  vec3 dir = normalize(uForward + vNdc.x * uTan.x * uRight + vNdc.y * uTan.y * uUp);
  vec3 col = skyColor(dir);
  vec2 screen = gl_FragCoord.xy / uRes;
  float vignette = smoothstep(1.3, 0.3, length((screen - 0.5) * vec2(1.2, 1.0)));
  col *= 0.75 + 0.25 * vignette;
  float grain = hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  col += grain * 0.022;
  FRAG = vec4(max(col, 0.0), 1.0);
}
`;

const VERTEX_HEADER_WEBGL2 = `#version 300 es
precision highp float;
#define attribute in
#define varying out
`;

const VERTEX_HEADER_WEBGL1 = `precision highp float;
`;

const FRAGMENT_HEADER_WEBGL2 = `#version 300 es
precision highp float;
out vec4 fragColor;
#define FRAG fragColor
#define varying in
`;

const FRAGMENT_HEADER_WEBGL1 = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define FRAG gl_FragColor
`;

const SECTION_IDS = ["hero", "about", "stack", "works", "contact"];
const FALLBACK_BACKGROUND =
  "radial-gradient(90% 40% at 70% 78%, rgba(122, 92, 255, 0.12), transparent 70%), linear-gradient(180deg, #0b0a0c 0%, #0b0a0c 62%, #141018 74%, #0b0a0c 100%)";
const STILL_TRAVEL = 37.4;
const STILL_TIME = 8;

type CameraPose = { y: number; pitch: number; fov: number; speed: number };

const POSES: CameraPose[] = [
  { y: 2.6, pitch: 8, fov: 54, speed: 2.4 },
  { y: -8.2, pitch: -13, fov: 62, speed: 3.4 },
  { y: 34, pitch: -84, fov: 48, speed: 1.3 },
  { y: 3.6, pitch: -1.5, fov: 54, speed: 0.55 },
  { y: 22, pitch: -9.5, fov: 58, speed: 1.7 },
];

type Quality = {
  cellsX: number;
  cellsZ: number;
  front: number;
  back: number;
  renderScale: number;
  maxPixelRatio: number;
  lineWidth: number;
  mountX: number;
};

const DESKTOP: Quality = {
  cellsX: 200,
  cellsZ: 160,
  front: 150,
  back: 10,
  renderScale: 0.65,
  maxPixelRatio: 1.5,
  lineWidth: 0.95,
  mountX: 6,
};

const MOBILE: Quality = {
  cellsX: 84,
  cellsZ: 120,
  front: 110,
  back: 10,
  renderScale: 0.55,
  maxPixelRatio: 2,
  lineWidth: 1.0,
  mountX: 1,
};

type TerrainUniform =
  | "uSection"
  | "uTime"
  | "uRes"
  | "uViewProj"
  | "uSnap"
  | "uFrac"
  | "uCamZ"
  | "uHalfW"
  | "uDepth"
  | "uMountX"
  | "uPhase"
  | "uCam"
  | "uLineWidth";

type SkyUniform = "uSection" | "uTime" | "uRes" | "uRight" | "uUp" | "uForward" | "uTan";

type Renderer = {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  terrain: WebGLProgram;
  sky: WebGLProgram;
  gridBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  skyBuffer: WebGLBuffer;
  indexCount: number;
  terrainUniforms: Record<TerrainUniform, WebGLUniformLocation | null>;
  skyUniforms: Record<SkyUniform, WebGLUniformLocation | null>;
};

type SectionBound = {
  index: number;
  top: number;
  length: number;
};

type Vec3 = [number, number, number];

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const easeFactor = (rate: number, deltaSeconds: number) => 1 - Math.pow(1 - rate, deltaSeconds * 60);

const canyonX = (z: number) => 4 * Math.sin(z * 0.035) + 1.6 * Math.sin(z * 0.09 + 1.3);

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

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

function poseAt(section: number): CameraPose {
  const clamped = Math.min(POSES.length - 1, Math.max(0, section));
  const index = Math.min(POSES.length - 2, Math.floor(clamped));
  const amount = clamped - index;
  const a = POSES[index];
  const b = POSES[index + 1];
  return {
    y: lerp(a.y, b.y, amount),
    pitch: lerp(a.pitch, b.pitch, amount),
    fov: lerp(a.fov, b.fov, amount),
    speed: lerp(a.speed, b.speed, amount),
  };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function cameraBasis(yaw: number, pitch: number) {
  const forward: Vec3 = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { forward, right, up };
}

function viewProjection(eye: Vec3, basis: ReturnType<typeof cameraBasis>, fovY: number, aspect: number, near: number, far: number) {
  const { forward, right, up } = basis;
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  const view = new Float32Array([
    right[0], up[0], -forward[0], 0,
    right[1], up[1], -forward[1], 0,
    right[2], up[2], -forward[2], 0,
    -(right[0] * eye[0] + right[1] * eye[1] + right[2] * eye[2]),
    -(up[0] * eye[0] + up[1] * eye[1] + up[2] * eye[2]),
    forward[0] * eye[0] + forward[1] * eye[1] + forward[2] * eye[2],
    1,
  ]);
  const projection = new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += projection[k * 4 + row] * view[column * 4 + k];
      out[column * 4 + row] = sum;
    }
  }
  return out;
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

function linkProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string, attribute: string) {
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
  gl.bindAttribLocation(program, 0, attribute);
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
    depth: true,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  };
  const webgl2 = canvas.getContext("webgl2", options);
  if (webgl2) return { gl: webgl2 as WebGL2RenderingContext, isWebgl2: true };
  const webgl1 = canvas.getContext("webgl", options) as WebGLRenderingContext | null;
  return webgl1 ? { gl: webgl1, isWebgl2: false } : null;
}

function buildGrid(quality: Quality) {
  const columns = quality.cellsX + 1;
  const rows = quality.cellsZ + 1;
  const positions = new Float32Array(columns * rows * 2);
  const halfW = quality.cellsX / 2;
  let offset = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      positions[offset++] = column - halfW;
      positions[offset++] = quality.back - row;
    }
  }
  const indices = new Uint16Array(quality.cellsX * quality.cellsZ * 6);
  offset = 0;
  for (let row = 0; row < quality.cellsZ; row++) {
    for (let column = 0; column < quality.cellsX; column++) {
      const a = row * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      indices[offset++] = a;
      indices[offset++] = c;
      indices[offset++] = b;
      indices[offset++] = b;
      indices[offset++] = c;
      indices[offset++] = d;
    }
  }
  return { positions, indices };
}

function createRenderer(canvas: HTMLCanvasElement, quality: Quality): Renderer | null {
  const context = getContext(canvas);
  if (!context) return null;
  const { gl, isWebgl2 } = context;
  if (gl.isContextLost()) return null;
  let fragmentHeader = FRAGMENT_HEADER_WEBGL2;
  if (!isWebgl2) {
    const derivatives = gl.getExtension("OES_standard_derivatives");
    fragmentHeader = derivatives
      ? `#extension GL_OES_standard_derivatives : enable\n${FRAGMENT_HEADER_WEBGL1}`
      : `${FRAGMENT_HEADER_WEBGL1}#define fwidth(x) (abs(x) * 0.0 + 0.05)\n`;
  }
  const vertexHeader = isWebgl2 ? VERTEX_HEADER_WEBGL2 : VERTEX_HEADER_WEBGL1;
  const terrain = linkProgram(gl, vertexHeader + COMMON + TERRAIN_VERTEX, fragmentHeader + COMMON + TERRAIN_FRAGMENT, "aGrid");
  if (!terrain) return null;
  const sky = linkProgram(gl, vertexHeader + SKY_VERTEX, fragmentHeader + COMMON + SKY_FRAGMENT, "aPosition");
  if (!sky) {
    gl.deleteProgram(terrain);
    return null;
  }
  const { positions, indices } = buildGrid(quality);
  const gridBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const skyBuffer = gl.createBuffer();
  if (!gridBuffer || !indexBuffer || !skyBuffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  const terrainNames: TerrainUniform[] = [
    "uSection",
    "uTime",
    "uRes",
    "uViewProj",
    "uSnap",
    "uFrac",
    "uCamZ",
    "uHalfW",
    "uDepth",
    "uMountX",
    "uPhase",
    "uCam",
    "uLineWidth",
  ];
  const skyNames: SkyUniform[] = ["uSection", "uTime", "uRes", "uRight", "uUp", "uForward", "uTan"];
  const terrainUniforms = Object.fromEntries(
    terrainNames.map((name) => [name, gl.getUniformLocation(terrain, name)]),
  ) as Record<TerrainUniform, WebGLUniformLocation | null>;
  const skyUniforms = Object.fromEntries(
    skyNames.map((name) => [name, gl.getUniformLocation(sky, name)]),
  ) as Record<SkyUniform, WebGLUniformLocation | null>;
  gl.clearColor(0.043, 0.039, 0.047, 1);
  gl.clearDepth(1);
  gl.depthFunc(gl.LESS);
  return {
    gl,
    terrain,
    sky,
    gridBuffer,
    indexBuffer,
    skyBuffer,
    indexCount: indices.length,
    terrainUniforms,
    skyUniforms,
  };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  const { gl } = renderer;
  gl.deleteBuffer(renderer.gridBuffer);
  gl.deleteBuffer(renderer.indexBuffer);
  gl.deleteBuffer(renderer.skyBuffer);
  gl.deleteProgram(renderer.terrain);
  gl.deleteProgram(renderer.sky);
}

export function BgTerrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const compact = window.matchMedia("(max-width: 767px)").matches || !finePointerQuery.matches;
    const quality = compact ? MOBILE : DESKTOP;

    let renderer = createRenderer(canvas, quality);
    if (!renderer) {
      setUnsupported(true);
      return;
    }

    let reducedMotion = reducedMotionQuery.matches;
    let finePointer = finePointerQuery.matches;
    let frameId = 0;
    let lastFrame = performance.now();
    let elapsed = 0;
    let travel = STILL_TRAVEL;
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
    let canyonYaw = 0;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio);
      const host = canvas.parentElement ?? canvas;
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * quality.renderScale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * quality.renderScale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, terrainUniforms: tu, skyUniforms: su } = renderer;
      const pose = poseAt(section);
      const aspect = canvas.width / Math.max(1, canvas.height);
      const look = hover * (finePointer ? 1 : 0);
      const yaw = canyonYaw + (mouseX - 0.5) * 0.11 * look;
      const pitch = toRadians(pose.pitch) + (mouseY - 0.5) * 0.07 * look;
      const fov = toRadians(pose.fov + velocity * 9);
      const basis = cameraBasis(yaw, pitch);
      const eye: Vec3 = [0, pose.y, 0];
      const matrix = viewProjection(eye, basis, fov, aspect, 0.1, 400);
      const snap = Math.floor(travel);
      const time = reducedMotion ? STILL_TIME : elapsed;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(renderer.sky);
      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.skyBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(su.uSection, section);
      gl.uniform1f(su.uTime, time);
      gl.uniform2f(su.uRes, canvas.width, canvas.height);
      gl.uniform3f(su.uRight, basis.right[0], basis.right[1], basis.right[2]);
      gl.uniform3f(su.uUp, basis.up[0], basis.up[1], basis.up[2]);
      gl.uniform3f(su.uForward, basis.forward[0], basis.forward[1], basis.forward[2]);
      gl.uniform2f(su.uTan, Math.tan(fov / 2) * aspect, Math.tan(fov / 2));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(renderer.terrain);
      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.gridBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer.indexBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(tu.uSection, section);
      gl.uniform1f(tu.uTime, time);
      gl.uniform2f(tu.uRes, canvas.width, canvas.height);
      gl.uniformMatrix4fv(tu.uViewProj, false, matrix);
      gl.uniform1f(tu.uSnap, -snap);
      gl.uniform1f(tu.uFrac, travel - snap);
      gl.uniform1f(tu.uCamZ, -travel);
      gl.uniform1f(tu.uHalfW, quality.cellsX / 2);
      gl.uniform1f(tu.uDepth, quality.front);
      gl.uniform1f(tu.uMountX, quality.mountX);
      gl.uniform1f(tu.uPhase, ((-snap % 40) + 40) % 40);
      gl.uniform3f(tu.uCam, eye[0], eye[1], eye[2]);
      gl.uniform1f(tu.uLineWidth, quality.lineWidth);
      gl.drawElements(gl.TRIANGLES, renderer.indexCount, gl.UNSIGNED_SHORT, 0);
    };

    const updateCanyonYaw = (amount: number) => {
      const ahead = 10;
      const offset = canyonX(-travel - ahead) - canyonX(-travel);
      const weight = clamp01(1 - Math.abs(section - 1));
      const target = Math.atan(offset / ahead) * weight;
      canyonYaw = lerp(canyonYaw, target, amount);
    };

    const tick = (now: number) => {
      frameId = 0;
      if (document.hidden || contextLost || reducedMotion) return;
      const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      elapsed += deltaSeconds;

      const scrollY = window.scrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(scrollY - lastScrollY) / deltaSeconds : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, window.innerHeight);

      const targetVelocity = clamp01(scrollSpeed / 3000);
      const velocityRate = targetVelocity > velocity ? 0.16 : 0.04;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.06, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.05, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.05, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.04, deltaSeconds));

      const pose = poseAt(section);
      travel += deltaSeconds * (pose.speed + velocity * 16);
      updateCanyonYaw(easeFactor(0.05, deltaSeconds));

      draw();
      frameId = requestAnimationFrame(tick);
    };

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      velocity = 0;
      hover = 0;
      updateCanyonYaw(1);
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
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const handleContextRestored = () => {
      renderer = createRenderer(canvas, quality);
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
      (canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
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
