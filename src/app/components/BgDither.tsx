import { useEffect, useRef, useState } from "react";

const COMMON = `
const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`;

const FIELD_BODY = `uniform float uTime;
uniform float uStream;
uniform float uSection;
uniform float uVel;
uniform float uDir;
uniform float uHover;
uniform float uMobile;
uniform vec2 uGrid;
uniform vec2 uCellUv;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec4 uDrops[4];
${COMMON}

float weight(float index) {
  return clamp(1.0 - abs(uSection - index), 0.0, 1.0);
}

mat3 rotX(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotY(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

mat3 rotZ(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

float sdTorus(vec3 p) {
  vec2 q = vec2(length(p.xz) - 1.0, p.y);
  return length(q) - 0.42;
}

vec4 hero(vec2 p, float aspect, float t) {
  vec2 center = mix(vec2(aspect * 0.5 - 0.5, 0.07), vec2(0.17, -0.27), uMobile);
  float scale = mix(0.44, 0.27, uMobile);
  vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);
  vec2 q = (p - center) / scale;
  vec3 ro = vec3(0.0, 0.0, -4.2);
  vec3 rd = normalize(vec3(q, 1.9));
  mat3 rot = rotZ(t * 0.11) * rotX(t * 0.31 + 0.9 + mouse.y * 0.35 * uHover) * rotY(t * 0.23 + mouse.x * 0.35 * uHover);
  float b = dot(ro, rd);
  float disc = b * b - dot(ro, ro) + 2.1;
  float lum = 0.0;
  float ember = 0.0;
  float dusk = 0.0;
  if (disc > 0.0) {
    float travel = max(0.0, -b - sqrt(disc));
    float far = -b + sqrt(disc);
    bool hit = false;
    vec3 pos = ro;
    for (int i = 0; i < 56; i++) {
      pos = ro + rd * travel;
      float d = sdTorus(rot * pos);
      if (d < 0.003) {
        hit = true;
        break;
      }
      travel += d;
      if (travel > far) break;
    }
    if (hit) {
      vec2 e = vec2(0.004, -0.004);
      vec3 n = normalize(
        e.xyy * sdTorus(rot * (pos + e.xyy)) +
        e.yyx * sdTorus(rot * (pos + e.yyx)) +
        e.yxy * sdTorus(rot * (pos + e.yxy)) +
        e.xxx * sdTorus(rot * (pos + e.xxx))
      );
      vec3 light = normalize(vec3(-0.65, 0.75, -0.55));
      float diff = max(dot(n, light), 0.0);
      float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 18.0);
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
      float bounce = max(dot(n, normalize(vec3(0.4, -1.0, -0.2))), 0.0);
      lum = 0.06 + 0.62 * diff + 0.4 * spec + bounce * 0.2;
      ember = clamp(smoothstep(0.35, 0.95, spec) + bounce * bounce * 0.75, 0.0, 1.0);
      dusk = rim * (1.0 - diff) * 0.9;
    }
  }
  float halo = exp(-dot(q, q) * 0.9);
  return vec4(clamp(lum, 0.0, 1.0), ember, dusk, 0.04 + halo * 0.05);
}

vec4 about(vec2 p, float aspect, float t) {
  vec2 s1 = mix(vec2(aspect * 0.5 - 0.18, 0.12), vec2(0.2, 0.3), uMobile);
  vec2 s2 = mix(vec2(aspect * 0.5 + 0.05, -0.62), vec2(-0.05, -0.62), uMobile);
  float d1 = length(p - s1);
  float d2 = length(p - s2);
  float k = mix(40.0, 50.0, uMobile);
  float a1 = 1.0;
  float a2 = 0.3;
  float w = (sin(d1 * k - t * 1.6) * a1 + sin(d2 * k * 0.9 - t * 1.25) * a2) / (a1 + a2);
  float env = exp(-d1 * 1.1) + 0.5 * exp(-d2 * 1.7);
  env = clamp(env, 0.0, 1.0);
  float crest = smoothstep(0.15, 0.95, w);
  float lum = crest * env * 0.95;
  float ember = smoothstep(0.82, 1.0, w) * smoothstep(0.35, 0.8, env);
  float dusk = smoothstep(-0.3, -0.9, w) * env;
  lum += dusk * 0.1 * smoothstep(0.4, 0.9, env);
  return vec4(lum, ember * 0.8, dusk * 0.9, 0.015);
}

vec4 stack(vec2 cell, vec2 uv) {
  float column = cell.x;
  float depth = uGrid.y - cell.y;
  float density = mix(mix(0.05, 0.62, smoothstep(0.18, 0.98, uv.x)), 0.3, uMobile);
  float lum = 0.0;
  float ember = 0.0;
  float rnd = 0.0;
  for (int k = 0; k < 2; k++) {
    float layer = float(k) * 7.31;
    float alive = step(hash(vec2(column, 1.7 + layer)), density);
    float speed = mix(4.0, 13.0, hash(vec2(column, 3.1 + layer)));
    float period = uGrid.y * mix(0.7, 1.8, hash(vec2(column, 5.3 + layer)));
    float tail = mix(5.0, 24.0, hash(vec2(column, 8.9 + layer)));
    float offset = hash(vec2(column, 11.2 + layer)) * period;
    float behind = mod(uStream * speed + offset - depth, period);
    float trail = behind < tail ? pow(1.0 - behind / tail, 1.5) : 0.0;
    float head = 1.0 - smoothstep(0.0, 1.5, behind);
    lum = max(lum, alive * (trail * 0.92 + head * 0.25));
    ember = max(ember, alive * head);
    rnd = max(rnd, alive * step(0.001, trail) * (0.25 + 0.6 * head));
  }
  float ghost = step(hash(cell * 0.73 + 4.1), density * 0.12) * 0.09;
  return vec4(max(lum, ghost), ember, 0.0, rnd);
}

vec4 works(vec2 p, vec2 cell, float t) {
  float n = noise(p * 5.0 + vec2(t * 0.05, -t * 0.03)) * noise(p * 11.0 - vec2(t * 0.04, t * 0.02) + 7.0);
  float sparse = step(0.8, hash(cell + floor(t * 0.2 + hash(cell * 0.37) * 5.0)));
  float lum = smoothstep(0.32, 0.6, n) * 0.32 * (0.35 + 0.65 * sparse);
  float accent = step(0.996, hash(cell * 1.31 + 9.0));
  return vec4(max(lum, accent * 0.28), 0.0, accent, 0.03);
}

vec4 contact(vec2 p, float aspect, float t) {
  vec2 origin = vec2(0.0, -0.56);
  vec2 d2 = (p - origin) * vec2(mix(0.8, 1.3, uMobile), 1.0);
  float d = length(d2);
  float ang = atan(d2.x, d2.y);
  float rays = smoothstep(0.42, 0.78, noise(vec2(ang * 12.0 + 20.0, t * 0.16))) * 0.8 + smoothstep(0.5, 0.9, noise(vec2(ang * 31.0 - 5.0, -t * 0.23))) * 0.4;
  float glow = exp(-d * 2.1);
  float waves = smoothstep(0.55, 1.0, sin(d * 34.0 - t * 2.1));
  float lum = glow * (0.04 + 1.05 * rays) + glow * waves * 0.16;
  float core = smoothstep(0.2, 0.07, d) * (0.85 + 0.15 * waves) + exp(-d * 4.5) * 0.45;
  lum = max(lum, min(core, 1.0));
  float ember = clamp(smoothstep(1.0, 0.15, d) * (0.45 + 0.55 * rays) + core, 0.0, 1.0);
  float dusk = smoothstep(0.75, 1.05, d) * smoothstep(1.5, 1.05, d) * rays * 0.6;
  return vec4(clamp(lum, 0.0, 1.0), ember, dusk, 0.03 + glow * 0.04);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 uv = gl_FragCoord.xy * uCellUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  p.y += uDir * uVel * 0.03;
  float t = uTime;

  float w0 = weight(0.0);
  float w1 = weight(1.0);
  float w2 = weight(2.0);
  float w3 = weight(3.0);
  float w4 = weight(4.0);

  vec4 acc = vec4(0.0);
  if (w0 > 0.001) acc += hero(p, aspect, t) * w0;
  if (w1 > 0.001) acc += about(p, aspect, t) * w1;
  if (w2 > 0.001) acc += stack(cell, uv) * w2;
  if (w3 > 0.001) acc += works(p, cell, t) * w3;
  if (w4 > 0.001) acc += contact(p, aspect, t) * w4;

  vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);
  float ripple = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 drop = uDrops[i];
    float age = t - drop.z;
    if (drop.w > 0.0 && age > 0.0 && age < 4.0) {
      float r = length(p - (drop.xy - 0.5) * vec2(aspect, 1.0));
      float front = age * 0.24;
      float ring = exp(-pow((r - front) * 34.0, 2.0)) + 0.45 * exp(-pow((r - front * 0.7) * 40.0, 2.0));
      ripple += ring * exp(-age * 0.9) * drop.w * smoothstep(0.0, 0.25, age);
    }
  }
  ripple *= 0.35 + 0.65 * w1;
  acc.x += ripple * 0.75;
  acc.z = max(acc.z, ripple * 0.5);

  vec2 dm = (p - mouse) * vec2(1.0, 1.0);
  float lens = exp(-dot(dm, dm) * 26.0) * uHover;
  float sparkle = noise(cell * 0.45 + t * 0.6);
  float speck = step(0.72, hash(cell * 1.13 + floor(t * 2.0)));
  acc.x = max(acc.x * (1.0 + lens * 0.8), lens * 0.16 * sparkle * speck);

  float ambient = step(0.985, hash(cell * 0.91 + 3.7)) * 0.07 * (1.0 - w3 * 0.6);
  acc.x = max(acc.x, ambient);

  float edge = smoothstep(0.0, 0.5, uv.x) * 0.5 + 0.5;
  float textSafe = mix(edge, 1.0, w4 * 0.6 + w2 * 0.3);
  textSafe = mix(textSafe, 0.72 + w0 * 0.2 - w4 * 0.12, uMobile);
  acc.x *= textSafe;

  float trans = 1.0 - abs(fract(uSection) * 2.0 - 1.0);
  trans = smoothstep(0.0, 1.0, trans) * (1.0 - step(3.999, uSection));
  float flicker = hash(cell + floor(t * 12.0));
  acc.x *= 1.0 - trans * 0.45 * step(0.6, flicker);
  acc.w = clamp(acc.w + trans * 0.55 + uVel * 0.95, 0.0, 1.0);

  FRAG = vec4(clamp(acc.x, 0.0, 1.0), clamp(acc.y, 0.0, 1.0), clamp(acc.z, 0.0, 1.0), acc.w);
}
`;

const GLYPH_BODY = `uniform sampler2D uData;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform vec2 uGrid;
uniform vec2 uCell;
uniform float uGlyphs;
uniform float uTime;
uniform float uVel;
uniform float uHover;
uniform vec2 uMousePx;
uniform float uLensRadius;
${COMMON}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float row = floor(px.y / uCell.y);
  float tear = step(hash(vec2(row * 0.37, floor(uTime * 9.0))), uVel * 0.9);
  float slip = (hash(vec2(row, floor(uTime * 14.0))) - 0.5) * uCell.x * 10.0 * uVel;
  px.x += slip * (0.25 + 0.75 * tear);

  vec2 cell = floor(px / uCell);
  vec2 local = fract(px / uCell);
  vec4 data = TEX(uData, (cell + 0.5) / uGrid);
  float lum = data.x;

  vec2 center = (cell + 0.5) * uCell;
  vec2 dm = (center - uMousePx) / uLensRadius;
  float lens = exp(-dot(dm, dm) * 1.6) * uHover;

  float maxIndex = uGlyphs - 1.0;
  float dither = bayer4(cell) - 0.5;
  float index = clamp(floor(lum * maxIndex * 1.08 + dither * 0.9 + 0.5), 0.0, maxIndex);
  if (lum > 0.012 && index < 1.0) index = 1.0;

  float tick = floor(uTime * (3.0 + 10.0 * data.w) + hash(cell * 1.7) * 9.0);
  if (hash(cell + tick * 0.173) < data.w && lum > 0.012) {
    index = floor(mix(maxIndex * 0.3, uGlyphs - 0.01, hash(cell * 0.77 + tick)));
  }

  float scale = 1.0 + 0.6 * lens;
  vec2 lc = (local - 0.5) / scale + 0.5;
  float inside = step(0.0, lc.x) * step(lc.x, 1.0) * step(0.0, lc.y) * step(lc.y, 1.0);
  vec2 texel = 0.5 / uCell;
  lc = clamp(lc, texel, 1.0 - texel);
  vec2 atlasUv = vec2((index + lc.x) / uGlyphs, 1.0 - lc.y);
  float coverage = TEX(uAtlas, atlasUv).a * inside;

  vec3 tint = mix(PAPER, EMBER, data.y);
  tint = mix(tint, DUSK, data.z * (1.0 - data.y));
  float alpha = pow(lum, 0.85) * mix(0.46, 0.95, data.y) * (1.0 + lens * 0.7);
  alpha = min(alpha, 1.0);

  vec3 color = INK + (tint - INK) * coverage * alpha;
  color += tint * lum * (0.018 + 0.05 * data.y);
  float band = exp(-pow((gl_FragCoord.y / uRes.y - 1.0 + fract(uTime * 0.045)) * 9.0, 2.0));
  color += tint * coverage * alpha * band * 0.18;

  vec2 uv = gl_FragCoord.xy / uRes;
  float vignette = smoothstep(1.3, 0.4, length((uv - 0.5) * vec2(1.2, 1.0)));
  color = mix(INK * 0.7, color, 0.45 + 0.55 * vignette);

  FRAG = vec4(color, 1.0);
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

const SECTION_IDS = ["hero", "about", "stack", "works", "contact"];
const GLYPHS = [" ", ".", "·", ":", ";", "-", "~", "=", "+", "/", "<", ">", "{", "}", "*", "%", "#", "@", "0", "1"];
const FONT_STACK = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
const MAX_PIXEL_RATIO_DESKTOP = 1.5;
const MAX_PIXEL_RATIO_MOBILE = 2;
const STILL_TIME = 14;
const DROP_COUNT = 4;
const FALLBACK_BACKGROUND =
  "radial-gradient(60% 50% at 78% 45%, rgba(239, 233, 223, 0.06), transparent 70%), radial-gradient(70% 50% at 50% 110%, rgba(255, 91, 36, 0.14), transparent 70%), #0b0a0c";

type FieldUniform =
  | "uTime"
  | "uStream"
  | "uSection"
  | "uVel"
  | "uDir"
  | "uHover"
  | "uMobile"
  | "uGrid"
  | "uCellUv"
  | "uRes"
  | "uMouse"
  | "uDrops";

type GlyphUniform =
  | "uData"
  | "uAtlas"
  | "uRes"
  | "uGrid"
  | "uCell"
  | "uGlyphs"
  | "uTime"
  | "uVel"
  | "uHover"
  | "uMousePx"
  | "uLensRadius";

type Renderer = {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  fieldProgram: WebGLProgram;
  glyphProgram: WebGLProgram;
  buffer: WebGLBuffer;
  dataTexture: WebGLTexture;
  atlasTexture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  field: Record<FieldUniform, WebGLUniformLocation | null>;
  glyph: Record<GlyphUniform, WebGLUniformLocation | null>;
};

type SectionBound = {
  index: number;
  top: number;
  length: number;
};

type Layout = {
  cellW: number;
  cellH: number;
  cols: number;
  rows: number;
  pixelRatio: number;
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

function linkProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
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
  const webgl2 = canvas.getContext("webgl2", options);
  if (webgl2) return { gl: webgl2 as WebGL2RenderingContext, isWebgl2: true };
  const webgl1 = canvas.getContext("webgl", options) as WebGLRenderingContext | null;
  return webgl1 ? { gl: webgl1, isWebgl2: false } : null;
}

function createTexture(gl: WebGLRenderingContext, filter: number) {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  return texture;
}

function uniformMap<T extends string>(gl: WebGLRenderingContext, program: WebGLProgram, names: T[]) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)])) as Record<
    T,
    WebGLUniformLocation | null
  >;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const context = getContext(canvas);
  if (!context) return null;
  const { gl, isWebgl2 } = context;
  if (gl.isContextLost()) return null;
  const header = isWebgl2 ? FRAGMENT_HEADER_WEBGL2 : FRAGMENT_HEADER_WEBGL1;
  const vertexSource = isWebgl2 ? VERTEX_WEBGL2 : VERTEX_WEBGL1;
  const fieldProgram = linkProgram(gl, vertexSource, header + FIELD_BODY);
  const glyphProgram = linkProgram(gl, vertexSource, header + GLYPH_BODY);
  const buffer = gl.createBuffer();
  const dataTexture = createTexture(gl, gl.NEAREST);
  const atlasTexture = createTexture(gl, gl.LINEAR);
  const framebuffer = gl.createFramebuffer();
  if (!fieldProgram || !glyphProgram || !buffer || !dataTexture || !atlasTexture || !framebuffer) {
    if (fieldProgram) gl.deleteProgram(fieldProgram);
    if (glyphProgram) gl.deleteProgram(glyphProgram);
    if (buffer) gl.deleteBuffer(buffer);
    if (dataTexture) gl.deleteTexture(dataTexture);
    if (atlasTexture) gl.deleteTexture(atlasTexture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dataTexture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const field = uniformMap<FieldUniform>(gl, fieldProgram, [
    "uTime",
    "uStream",
    "uSection",
    "uVel",
    "uDir",
    "uHover",
    "uMobile",
    "uGrid",
    "uCellUv",
    "uRes",
    "uMouse",
    "uDrops",
  ]);
  const glyph = uniformMap<GlyphUniform>(gl, glyphProgram, [
    "uData",
    "uAtlas",
    "uRes",
    "uGrid",
    "uCell",
    "uGlyphs",
    "uTime",
    "uVel",
    "uHover",
    "uMousePx",
    "uLensRadius",
  ]);
  gl.useProgram(glyphProgram);
  gl.uniform1i(glyph.uData, 0);
  gl.uniform1i(glyph.uAtlas, 1);
  return { gl, fieldProgram, glyphProgram, buffer, dataTexture, atlasTexture, framebuffer, field, glyph };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  const { gl } = renderer;
  gl.deleteFramebuffer(renderer.framebuffer);
  gl.deleteTexture(renderer.dataTexture);
  gl.deleteTexture(renderer.atlasTexture);
  gl.deleteBuffer(renderer.buffer);
  gl.deleteProgram(renderer.fieldProgram);
  gl.deleteProgram(renderer.glyphProgram);
}

function buildAtlas(cellW: number, cellH: number) {
  const canvas = document.createElement("canvas");
  canvas.width = cellW * GLYPHS.length;
  canvas.height = cellH;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const fontPx = Math.max(6, Math.round(cellH * 0.8));
  const draw = (order: string[]) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `500 ${fontPx}px ${FONT_STACK}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    order.forEach((glyph, index) => {
      context.fillText(glyph, index * cellW + cellW / 2, cellH / 2 + fontPx * 0.04);
    });
  };
  draw(GLYPHS);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const coverage = GLYPHS.map((glyph, index) => {
    let sum = 0;
    for (let y = 0; y < cellH; y++) {
      for (let x = index * cellW; x < (index + 1) * cellW; x++) {
        sum += pixels[(y * canvas.width + x) * 4 + 3];
      }
    }
    return { glyph, sum: glyph === " " ? -1 : sum };
  });
  coverage.sort((a, b) => a.sum - b.sum);
  draw(coverage.map((entry) => entry.glyph));
  return canvas;
}

export function BgDither() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    let renderer = createRenderer(canvas);
    if (!renderer) {
      canvas.remove();
      setUnsupported(true);
      return;
    }

    let disposed = false;
    let reducedMotion = reducedMotionQuery.matches;
    let finePointer = finePointerQuery.matches;
    let frameId = 0;
    let lastFrame = performance.now();
    let elapsed = 0;
    let stream = 0;
    let contextLost = false;
    let bounds = measureSections();
    let layout: Layout = { cellW: 1, cellH: 1, cols: 1, rows: 1, pixelRatio: 1 };
    let mobile = false;
    let atlasKey = "";

    let lastScrollY = window.scrollY;
    let targetSection = sectionFromScroll(bounds, lastScrollY, window.innerHeight);
    let section = targetSection;
    let velocity = 0;
    let direction = 0;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetHover = 0;
    let hover = 0;
    const drops = new Float32Array(DROP_COUNT * 4);
    let dropCursor = 0;
    let lastDropTime = -10;
    let lastDropX = -1;
    let lastDropY = -1;

    const uploadAtlas = () => {
      if (!renderer || contextLost) return;
      const atlas = buildAtlas(layout.cellW, layout.cellH);
      if (!atlas) return;
      const { gl } = renderer;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, renderer.atlasTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.activeTexture(gl.TEXTURE0);
    };

    const resize = () => {
      if (!renderer || contextLost) return;
      const cssWidth = Math.max(1, host.clientWidth);
      const cssHeight = Math.max(1, host.clientHeight);
      mobile = cssWidth < 768 || !finePointer;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? MAX_PIXEL_RATIO_MOBILE : MAX_PIXEL_RATIO_DESKTOP);
      const width = Math.max(1, Math.round(cssWidth * pixelRatio));
      const height = Math.max(1, Math.round(cssHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const cssCellH = mobile ? 11 : 13;
      const cssCellW = mobile ? 8 : 9;
      const cellH = Math.max(6, Math.round(cssCellH * pixelRatio));
      const cellW = Math.max(4, Math.round(cssCellW * pixelRatio));
      const cols = Math.ceil(width / cellW);
      const rows = Math.ceil(height / cellH);
      const { gl } = renderer;
      if (cols !== layout.cols || rows !== layout.rows) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, renderer.dataTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      layout = { cellW, cellH, cols, rows, pixelRatio };
      const key = `${cellW}x${cellH}`;
      if (key !== atlasKey) {
        atlasKey = key;
        uploadAtlas();
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, field, glyph } = renderer;
      const time = reducedMotion ? STILL_TIME : elapsed;
      const streamTime = reducedMotion ? STILL_TIME : stream;
      const { cellW, cellH, cols, rows, pixelRatio } = layout;

      gl.bindFramebuffer(gl.FRAMEBUFFER, renderer.framebuffer);
      gl.viewport(0, 0, cols, rows);
      gl.useProgram(renderer.fieldProgram);
      gl.uniform1f(field.uTime, time);
      gl.uniform1f(field.uStream, streamTime);
      gl.uniform1f(field.uSection, section);
      gl.uniform1f(field.uVel, velocity);
      gl.uniform1f(field.uDir, direction);
      gl.uniform1f(field.uHover, hover);
      gl.uniform1f(field.uMobile, mobile ? 1 : 0);
      gl.uniform2f(field.uGrid, cols, rows);
      gl.uniform2f(field.uCellUv, cellW / canvas.width, cellH / canvas.height);
      gl.uniform2f(field.uRes, canvas.width, canvas.height);
      gl.uniform2f(field.uMouse, mouseX, mouseY);
      gl.uniform4fv(field.uDrops, drops);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(renderer.glyphProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, renderer.dataTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, renderer.atlasTexture);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform2f(glyph.uRes, canvas.width, canvas.height);
      gl.uniform2f(glyph.uGrid, cols, rows);
      gl.uniform2f(glyph.uCell, cellW, cellH);
      gl.uniform1f(glyph.uGlyphs, GLYPHS.length);
      gl.uniform1f(glyph.uTime, time);
      gl.uniform1f(glyph.uVel, velocity);
      gl.uniform1f(glyph.uHover, hover);
      gl.uniform2f(glyph.uMousePx, mouseX * canvas.width, mouseY * canvas.height);
      gl.uniform1f(glyph.uLensRadius, 120 * pixelRatio);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const addDrop = (x: number, y: number, strength: number) => {
      drops[dropCursor * 4] = x;
      drops[dropCursor * 4 + 1] = y;
      drops[dropCursor * 4 + 2] = elapsed;
      drops[dropCursor * 4 + 3] = strength;
      dropCursor = (dropCursor + 1) % DROP_COUNT;
      lastDropTime = elapsed;
      lastDropX = x;
      lastDropY = y;
    };

    const tick = (now: number) => {
      frameId = 0;
      if (document.hidden || contextLost || reducedMotion) return;
      const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      elapsed += deltaSeconds;

      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(delta) / deltaSeconds : 0;
      lastScrollY = scrollY;
      if (Math.abs(delta) > 0.5) direction = lerp(direction, Math.sign(delta), easeFactor(0.2, deltaSeconds));
      targetSection = sectionFromScroll(bounds, scrollY, window.innerHeight);

      const targetVelocity = clamp01(scrollSpeed / 3000);
      const velocityRate = targetVelocity > velocity ? 0.22 : 0.06;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.07, deltaSeconds));
      stream += deltaSeconds * (1 + velocity * 7);
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.12, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.12, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.05, deltaSeconds));

      if (finePointer && targetHover > 0.5) {
        const moved = Math.hypot((mouseX - lastDropX) * (canvas.width / canvas.height), mouseY - lastDropY);
        if (moved > 0.09 && elapsed - lastDropTime > 0.45) addDrop(mouseX, mouseY, 0.8);
      }

      draw();
      frameId = requestAnimationFrame(tick);
    };

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      velocity = 0;
      hover = 0;
      drops.fill(0);
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
      resize();
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

    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion) return;
      addDrop(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, 1);
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
      resize();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const handleContextRestored = () => {
      renderer = createRenderer(canvas);
      if (!renderer) {
        canvas.remove();
        setUnsupported(true);
        return;
      }
      contextLost = false;
      layout = { cellW: 1, cellH: 1, cols: 1, rows: 1, pixelRatio: 1 };
      atlasKey = "";
      resize();
      start();
    };

    const handleFonts = () => {
      if (disposed) return;
      atlasKey = "";
      resize();
      if (reducedMotion) renderStill();
    };

    const bodyObserver = new ResizeObserver(remeasure);
    bodyObserver.observe(document.body);

    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleMotionChange);
    finePointerQuery.addEventListener("change", handlePointerQueryChange);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    resize();
    start();

    if (document.fonts) {
      document.fonts.load(`500 13px ${FONT_STACK}`).then(handleFonts, handleFonts);
    }

    return () => {
      disposed = true;
      stop();
      bodyObserver.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      finePointerQuery.removeEventListener("change", handlePointerQueryChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      const gl = renderer?.gl;
      destroyRenderer(renderer);
      renderer = null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-unsupported={unsupported ? "" : undefined}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: FALLBACK_BACKGROUND }}
    />
  );
}
