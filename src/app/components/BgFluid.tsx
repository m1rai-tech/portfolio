import { useEffect, useRef, useState } from "react";

const VERTEX = `attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 uTexel;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const COMMON = `varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
#ifdef PACKED
vec4 dec(vec4 v) { return (v - 0.5) * 2048.0; }
vec4 enc(vec4 v) { return clamp(v / 2048.0 + 0.5, 0.0, 1.0); }
#define VMAX 1000.0
#define DYE_MAX 1.0
#else
vec4 dec(vec4 v) { return v; }
vec4 enc(vec4 v) { return v; }
#define VMAX 2400.0
#define DYE_MAX 1.6
#endif
#ifdef MANUAL
vec4 smp(sampler2D s, vec2 uv, vec2 texel) {
  vec2 st = uv / texel - 0.5;
  vec2 i = floor(st);
  vec2 f = fract(st);
  vec4 a = TEX(s, (i + vec2(0.5, 0.5)) * texel);
  vec4 b = TEX(s, (i + vec2(1.5, 0.5)) * texel);
  vec4 c = TEX(s, (i + vec2(0.5, 1.5)) * texel);
  vec4 d = TEX(s, (i + vec2(1.5, 1.5)) * texel);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
#else
vec4 smp(sampler2D s, vec2 uv, vec2 texel) { return TEX(s, uv); }
#endif
float segment(vec2 p, vec4 a, float aspect) {
  vec2 s = a.xy * vec2(aspect, 1.0);
  vec2 e = a.zw * vec2(aspect, 1.0);
  vec2 pa = p - s;
  vec2 ba = e - s;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  vec2 d = pa - ba * h;
  return dot(d, d);
}
`;

const COPY = `uniform sampler2D uSource;
uniform vec2 uSrcTexel;
void main() {
  FRAG = smp(uSource, vUv, uSrcTexel);
}
`;

const SCALE = `uniform sampler2D uSource;
uniform float uScale;
void main() {
  FRAG = enc(dec(TEX(uSource, vUv)) * uScale);
}
`;

const CURL = `uniform sampler2D uVelocity;
void main() {
  float L = dec(TEX(uVelocity, vL)).y;
  float R = dec(TEX(uVelocity, vR)).y;
  float T = dec(TEX(uVelocity, vT)).x;
  float B = dec(TEX(uVelocity, vB)).x;
  FRAG = enc(vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0));
}
`;

const FORCE = `uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
uniform float uAspect;
uniform float uTime;
uniform vec4 uField;
uniform vec4 uSwirl;
uniform vec4 uSrcA[10];
uniform vec4 uSrcB[10];
uniform int uCount;
void main() {
  float L = dec(TEX(uCurl, vL)).x;
  float R = dec(TEX(uCurl, vR)).x;
  float T = dec(TEX(uCurl, vT)).x;
  float B = dec(TEX(uCurl, vB)).x;
  float C = dec(TEX(uCurl, vUv)).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 vel = dec(TEX(uVelocity, vUv)).xy + force * uDt;
  vec2 p = vUv * vec2(uAspect, 1.0);
  vec2 d = p - uSwirl.xy * vec2(uAspect, 1.0);
  float fall = exp(-dot(d, d) / (uSwirl.w * uSwirl.w));
  vel += vec2(-d.y, d.x) * fall * uSwirl.z * uDt;
  float band = sin(vUv.y * 15.0 + 1.3 * sin(vUv.y * 5.0 + uTime * 0.17));
  vel.x += uField.x * band * uDt;
  vel.y -= vel.y * min(uField.y * uDt, 1.0);
  float edge = exp(-vUv.x * vUv.x * 60.0) * 0.45 + exp(-(1.0 - vUv.x) * (1.0 - vUv.x) * 40.0);
  vel.y += uField.z * edge;
  for (int i = 0; i < 10; i++) {
    if (i >= uCount) break;
    vec4 b = uSrcB[i];
    vel += b.yz * exp(-segment(p, uSrcA[i], uAspect) / b.x);
  }
  vel *= min(1.0, VMAX / max(length(vel), 1.0));
  FRAG = enc(vec4(vel, 0.0, 1.0));
}
`;

const DIVERGENCE = `uniform sampler2D uVelocity;
void main() {
  float L = dec(TEX(uVelocity, vL)).x;
  float R = dec(TEX(uVelocity, vR)).x;
  float T = dec(TEX(uVelocity, vT)).y;
  float B = dec(TEX(uVelocity, vB)).y;
  vec2 C = dec(TEX(uVelocity, vUv)).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  FRAG = enc(vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0));
}
`;

const PRESSURE = `uniform sampler2D uPressure;
uniform sampler2D uDivergence;
float pr(vec2 uv) {
  return dec(TEX(uPressure, uv)).x;
}
void main() {
  float div = dec(TEX(uDivergence, vUv)).x;
  FRAG = enc(vec4((pr(vL) + pr(vR) + pr(vT) + pr(vB) - div) * 0.25, 0.0, 0.0, 1.0));
}
`;

const GRADIENT = `uniform sampler2D uPressure;
uniform sampler2D uVelocity;
float pr(vec2 uv) {
  return dec(TEX(uPressure, uv)).x;
}
void main() {
  vec2 vel = dec(TEX(uVelocity, vUv)).xy;
  vel -= vec2(pr(vR) - pr(vL), pr(vT) - pr(vB));
  FRAG = enc(vec4(vel, 0.0, 1.0));
}
`;

const ADVECT_VELOCITY = `uniform sampler2D uVelocity;
uniform vec2 uVelTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * dec(smp(uVelocity, vUv, uVelTexel)).xy * uVelTexel;
  vec4 result = dec(smp(uVelocity, coord, uVelTexel)) / (1.0 + uDissipation * uDt);
  FRAG = enc(result);
}
`;

const ADVECT_DYE = `uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelTexel;
uniform vec2 uSrcTexel;
uniform float uDt;
uniform float uDissipation;
uniform float uAspect;
uniform vec4 uSrcA[10];
uniform vec4 uSrcB[10];
uniform vec4 uSrcC[10];
uniform int uCount;
void main() {
  vec2 coord = vUv - uDt * dec(smp(uVelocity, vUv, uVelTexel)).xy * uVelTexel;
  vec3 dye = smp(uSource, coord, uSrcTexel).rgb / (1.0 + uDissipation * uDt);
#ifdef PACKED
  dye = max(dye - 0.0025, 0.0);
#endif
  vec2 p = vUv * vec2(uAspect, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uCount) break;
    vec4 c = uSrcC[i];
    dye += c.rgb * c.a * exp(-segment(p, uSrcA[i], uAspect) / uSrcB[i].x);
  }
  float peak = max(max(dye.r, dye.g), dye.b);
  dye *= min(1.0, DYE_MAX / max(peak, 0.0001));
  FRAG = vec4(dye, 1.0);
}
`;

const DISPLAY = `uniform sampler2D uDye;
uniform vec2 uDyeTexel;
uniform float uAspect;
uniform float uSection;
uniform float uTime;
uniform float uGloss;
const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float weight(float index) {
  return clamp(1.0 - abs(uSection - index), 0.0, 1.0);
}
float height(vec3 c) {
  return dot(c, vec3(0.4, 0.4, 0.2));
}
void main() {
  vec2 uv = vUv;
  vec2 o = uDyeTexel * 2.5;
  vec3 c = smp(uDye, uv, uDyeTexel).rgb;
  float hl = height(smp(uDye, uv - vec2(o.x, 0.0), uDyeTexel).rgb);
  float hr = height(smp(uDye, uv + vec2(o.x, 0.0), uDyeTexel).rgb);
  float ht = height(smp(uDye, uv + vec2(0.0, o.y), uDyeTexel).rgb);
  float hb = height(smp(uDye, uv - vec2(0.0, o.y), uDyeTexel).rgb);
  float h = height(c);
  float w1 = weight(1.0);
  float w3 = weight(3.0);
  float lum = dot(c, vec3(0.3, 0.55, 0.15));
  c = mix(c, DUSK * lum * 1.55 + EMBER * lum * 0.12, w1 * 0.55);
  vec3 n = normalize(vec3((hl - hr) * 4.0, (hb - ht) * 4.0, 1.0));
  vec3 light = normalize(vec3(-0.5, 0.65, 0.6));
  float diffuse = clamp(dot(n, light), 0.0, 1.0);
  float spec = pow(max(dot(n, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 36.0);
  float body = smoothstep(0.02, 0.3, h);
  vec3 col = c * (0.45 + 0.75 * diffuse);
  col = vec3(1.0) - exp(-col * 1.5);
  col *= 0.86;
  col += spec * body * mix(PAPER, EMBER, 0.25) * uGloss * (1.0 - w3 * 0.7);
  col -= (1.0 - diffuse) * body * 0.05;
  vec2 s = vec2(uv.x * uAspect, uv.y);
  vec2 textArea = vec2(uAspect * 0.3, 0.6);
  float calm = smoothstep(0.1, 0.95, length((s - textArea) * vec2(0.85, 1.0)));
  col *= 0.42 + 0.58 * calm;
  float vignette = smoothstep(1.3, 0.3, length((uv - 0.5) * vec2(uAspect * 0.7, 1.0)));
  col *= 0.6 + 0.4 * vignette;
  col = INK + max(col, 0.0) * (1.0 - INK);
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5) * 0.022;
  FRAG = vec4(max(col, 0.0), 1.0);
}
`;

const HEADER_VERTEX_WEBGL2 = `#version 300 es
#define attribute in
#define varying out
`;

const HEADER_FRAGMENT_WEBGL2 = `#version 300 es
precision highp float;
precision highp sampler2D;
#define varying in
#define TEX texture
out vec4 fragColor;
#define FRAG fragColor
`;

const HEADER_FRAGMENT_WEBGL1 = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define TEX texture2D
#define FRAG gl_FragColor
`;

const SECTION_IDS = ["hero", "about", "stack", "works", "contact"];
const MAX_PIXEL_RATIO = 1.25;
const MAX_SOURCES = 10;
const STACK_LANES = [0.14, 0.3, 0.7, 0.86];
const STACK_LANES_COMPACT = [0.16, 0.74, 0.88];
const FALLBACK_BACKGROUND =
  "radial-gradient(60% 55% at 90% 105%, rgba(255, 91, 36, 0.22), transparent 70%), radial-gradient(45% 50% at 100% 60%, rgba(122, 92, 255, 0.16), transparent 72%), #0b0a0c";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

type Format = { internal: number; format: number; type: number };

type Formats = { rgba: Format; rg: Format; r: Format; linear: boolean; packed: boolean };

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Target = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  texelX: number;
  texelY: number;
};

type DoubleTarget = { read: Target; write: Target };

type Programs = {
  copy: Program;
  scale: Program;
  curl: Program;
  force: Program;
  divergence: Program;
  pressure: Program;
  gradient: Program;
  advectVelocity: Program;
  advectDye: Program;
  display: Program;
};

type StepParams = {
  dt: number;
  curl: number;
  velocityDissipation: number;
  dyeDissipation: number;
  iterations: number;
  fieldX: number;
  fieldY: number;
  fieldZ: number;
  swirlX: number;
  swirlY: number;
  swirlStrength: number;
  swirlRadius: number;
  time: number;
  count: number;
  srcA: Float32Array;
  srcB: Float32Array;
  srcC: Float32Array;
};

type Engine = {
  gl: GL;
  setSize: (simWidth: number, simHeight: number, dyeWidth: number, dyeHeight: number) => void;
  step: (params: StepParams) => void;
  display: (section: number, time: number, gloss: number) => void;
  destroy: () => void;
};

type SectionBound = { index: number; top: number; length: number };

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const easeFactor = (rate: number, deltaSeconds: number) => 1 - Math.pow(1 - rate, deltaSeconds * 60);

const weightOf = (section: number, index: number) => clamp01(1 - Math.abs(section - index));

const puff = (phase: number) => {
  const wave = 0.5 + 0.5 * Math.sin(phase);
  return 0.18 + 0.82 * wave * wave * wave;
};

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
  return webgl1 ? { gl: webgl1 as GL, isWebgl2: false } : null;
}

function renderable(gl: GL, format: Format, filter: number) {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) return false;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, format.internal, 4, 4, 0, format.format, format.type, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE && gl.getError() === gl.NO_ERROR;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(framebuffer);
  gl.deleteTexture(texture);
  return ok;
}

function detectFormats(gl: GL, isWebgl2: boolean): Formats {
  if (isWebgl2) {
    const g2 = gl as WebGL2RenderingContext;
    g2.getExtension("EXT_color_buffer_float");
    g2.getExtension("EXT_color_buffer_half_float");
    const rgba = { internal: g2.RGBA16F, format: g2.RGBA, type: g2.HALF_FLOAT };
    if (renderable(g2, rgba, g2.LINEAR)) {
      const rgCandidate = { internal: g2.RG16F, format: g2.RG, type: g2.HALF_FLOAT };
      const rg = renderable(g2, rgCandidate, g2.LINEAR) ? rgCandidate : rgba;
      const rCandidate = { internal: g2.R16F, format: g2.RED, type: g2.HALF_FLOAT };
      const r = renderable(g2, rCandidate, g2.LINEAR) ? rCandidate : rg;
      return { rgba, rg, r, linear: true, packed: false };
    }
  } else {
    const half = gl.getExtension("OES_texture_half_float");
    const halfLinear = gl.getExtension("OES_texture_half_float_linear");
    gl.getExtension("EXT_color_buffer_half_float");
    if (half) {
      const format = { internal: gl.RGBA, format: gl.RGBA, type: half.HALF_FLOAT_OES };
      const linear = halfLinear !== null;
      if (renderable(gl, format, linear ? gl.LINEAR : gl.NEAREST)) {
        return { rgba: format, rg: format, r: format, linear, packed: false };
      }
    }
  }
  const bytes = { internal: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
  return { rgba: bytes, rg: bytes, r: bytes, linear: true, packed: true };
}

function compileShader(gl: GL, type: number, source: string) {
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

function createProgram(gl: GL, vertexSource: string, fragmentSource: string): Program | null {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const total = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < total; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace("[0]", "");
    uniforms[name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

function createEngine(canvas: HTMLCanvasElement): Engine | null {
  const context = getContext(canvas);
  if (!context) return null;
  const { gl, isWebgl2 } = context;
  if (gl.isContextLost()) return null;
  const formats = detectFormats(gl, isWebgl2);
  const filter = formats.linear ? gl.LINEAR : gl.NEAREST;
  const defines = `${formats.packed ? "#define PACKED\n" : ""}${formats.linear ? "" : "#define MANUAL\n"}`;
  const vertexSource = (isWebgl2 ? HEADER_VERTEX_WEBGL2 : "") + VERTEX;
  const fragmentHeader = (isWebgl2 ? HEADER_FRAGMENT_WEBGL2 : HEADER_FRAGMENT_WEBGL1) + defines + COMMON;

  const build = (body: string) => createProgram(gl, vertexSource, fragmentHeader + body);
  const copy = build(COPY);
  const scale = build(SCALE);
  const curl = build(CURL);
  const force = build(FORCE);
  const divergence = build(DIVERGENCE);
  const pressure = build(PRESSURE);
  const gradient = build(GRADIENT);
  const advectVelocity = build(ADVECT_VELOCITY);
  const advectDye = build(ADVECT_DYE);
  const display = build(DISPLAY);
  const list = [copy, scale, curl, force, divergence, pressure, gradient, advectVelocity, advectDye, display];
  const buffer = gl.createBuffer();
  if (!copy || !scale || !curl || !force || !divergence || !pressure || !gradient || !advectVelocity || !advectDye || !display || !buffer) {
    for (const entry of list) if (entry) gl.deleteProgram(entry.program);
    if (buffer) gl.deleteBuffer(buffer);
    return null;
  }
  const programs: Programs = { copy, scale, curl, force, divergence, pressure, gradient, advectVelocity, advectDye, display };

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  const createTarget = (width: number, height: number, format: Format): Target | null => {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) return null;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, format.internal, width, height, 0, format.format, format.type, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    if (formats.packed) gl.clearColor(0.5, 0.5, 0.5, 1);
    else gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, framebuffer, width, height, texelX: 1 / width, texelY: 1 / height };
  };

  const deleteTarget = (target: Target | null) => {
    if (!target) return;
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  };

  const createDouble = (width: number, height: number, format: Format): DoubleTarget | null => {
    const read = createTarget(width, height, format);
    const write = createTarget(width, height, format);
    if (!read || !write) {
      deleteTarget(read);
      deleteTarget(write);
      return null;
    }
    return { read, write };
  };

  const deleteDouble = (target: DoubleTarget | null) => {
    if (!target) return;
    deleteTarget(target.read);
    deleteTarget(target.write);
  };

  const swap = (target: DoubleTarget) => {
    const read = target.read;
    target.read = target.write;
    target.write = read;
  };

  const use = (program: Program, texelX: number, texelY: number) => {
    gl.useProgram(program.program);
    gl.uniform2f(program.uniforms.uTexel, texelX, texelY);
    return program.uniforms;
  };

  const bind = (unit: number, target: Target) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    return unit;
  };

  const blit = (target: Target | null) => {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let velocity: DoubleTarget | null = null;
  let pressureTarget: DoubleTarget | null = null;
  let divergenceTarget: Target | null = null;
  let curlTarget: Target | null = null;
  let dye: DoubleTarget | null = null;
  const dyeFormat = formats.packed ? { internal: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE } : formats.rgba;

  const clearDye = (target: DoubleTarget) => {
    for (const side of [target.read, target.write]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, side.framebuffer);
      gl.viewport(0, 0, side.width, side.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  };

  const resample = (from: DoubleTarget, to: DoubleTarget) => {
    const uniforms = use(programs.copy, to.read.texelX, to.read.texelY);
    gl.uniform2f(uniforms.uSrcTexel, from.read.texelX, from.read.texelY);
    gl.uniform1i(uniforms.uSource, bind(0, from.read));
    blit(to.read);
  };

  const setSize = (simWidth: number, simHeight: number, dyeWidth: number, dyeHeight: number) => {
    if (!velocity || velocity.read.width !== simWidth || velocity.read.height !== simHeight) {
      const next = createDouble(simWidth, simHeight, formats.rg);
      if (next) {
        if (velocity) resample(velocity, next);
        deleteDouble(velocity);
        velocity = next;
      }
      deleteDouble(pressureTarget);
      deleteTarget(divergenceTarget);
      deleteTarget(curlTarget);
      pressureTarget = createDouble(simWidth, simHeight, formats.r);
      divergenceTarget = createTarget(simWidth, simHeight, formats.r);
      curlTarget = createTarget(simWidth, simHeight, formats.r);
    }
    if (!dye || dye.read.width !== dyeWidth || dye.read.height !== dyeHeight) {
      const next = createDouble(dyeWidth, dyeHeight, dyeFormat);
      if (next) {
        clearDye(next);
        if (dye) resample(dye, next);
        deleteDouble(dye);
        dye = next;
      }
    }
  };

  const step = (params: StepParams) => {
    if (!velocity || !pressureTarget || !divergenceTarget || !curlTarget || !dye) return;
    const tx = velocity.read.texelX;
    const ty = velocity.read.texelY;
    const aspect = velocity.read.width / velocity.read.height;

    let u = use(programs.curl, tx, ty);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    blit(curlTarget);

    u = use(programs.force, tx, ty);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uCurl, bind(1, curlTarget));
    gl.uniform1f(u.uCurlStrength, params.curl);
    gl.uniform1f(u.uDt, params.dt);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uTime, params.time);
    gl.uniform4f(u.uField, params.fieldX, params.fieldY, params.fieldZ, 0);
    gl.uniform4f(u.uSwirl, params.swirlX, params.swirlY, params.swirlStrength, params.swirlRadius);
    gl.uniform4fv(u.uSrcA, params.srcA);
    gl.uniform4fv(u.uSrcB, params.srcB);
    gl.uniform1i(u.uCount, params.count);
    blit(velocity.write);
    swap(velocity);

    u = use(programs.divergence, tx, ty);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    blit(divergenceTarget);

    u = use(programs.scale, tx, ty);
    gl.uniform1i(u.uSource, bind(0, pressureTarget.read));
    gl.uniform1f(u.uScale, 0.8);
    blit(pressureTarget.write);
    swap(pressureTarget);

    u = use(programs.pressure, tx, ty);
    gl.uniform1i(u.uDivergence, bind(1, divergenceTarget));
    for (let i = 0; i < params.iterations; i++) {
      gl.uniform1i(u.uPressure, bind(0, pressureTarget.read));
      blit(pressureTarget.write);
      swap(pressureTarget);
    }

    u = use(programs.gradient, tx, ty);
    gl.uniform1i(u.uPressure, bind(0, pressureTarget.read));
    gl.uniform1i(u.uVelocity, bind(1, velocity.read));
    blit(velocity.write);
    swap(velocity);

    u = use(programs.advectVelocity, tx, ty);
    gl.uniform2f(u.uVelTexel, tx, ty);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1f(u.uDt, params.dt);
    gl.uniform1f(u.uDissipation, params.velocityDissipation);
    blit(velocity.write);
    swap(velocity);

    u = use(programs.advectDye, dye.read.texelX, dye.read.texelY);
    gl.uniform2f(u.uVelTexel, tx, ty);
    gl.uniform2f(u.uSrcTexel, dye.read.texelX, dye.read.texelY);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uSource, bind(1, dye.read));
    gl.uniform1f(u.uDt, params.dt);
    gl.uniform1f(u.uDissipation, params.dyeDissipation);
    gl.uniform1f(u.uAspect, dye.read.width / dye.read.height);
    gl.uniform4fv(u.uSrcA, params.srcA);
    gl.uniform4fv(u.uSrcB, params.srcB);
    gl.uniform4fv(u.uSrcC, params.srcC);
    gl.uniform1i(u.uCount, params.count);
    blit(dye.write);
    swap(dye);
  };

  const show = (section: number, time: number, gloss: number) => {
    if (!dye) return;
    const u = use(programs.display, dye.read.texelX, dye.read.texelY);
    gl.uniform2f(u.uDyeTexel, dye.read.texelX, dye.read.texelY);
    gl.uniform1i(u.uDye, bind(0, dye.read));
    gl.uniform1f(u.uAspect, gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight));
    gl.uniform1f(u.uSection, section);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uGloss, gloss);
    blit(null);
  };

  const destroy = () => {
    if (gl.isContextLost()) return;
    deleteDouble(velocity);
    deleteDouble(pressureTarget);
    deleteDouble(dye);
    deleteTarget(divergenceTarget);
    deleteTarget(curlTarget);
    velocity = null;
    pressureTarget = null;
    dye = null;
    divergenceTarget = null;
    curlTarget = null;
    for (const entry of list) if (entry) gl.deleteProgram(entry.program);
    gl.deleteBuffer(buffer);
  };

  return { gl, setSize, step, display: show, destroy };
}

export function BgFluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    let engine = createEngine(canvas);
    if (!engine) {
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
    let scrollFlow = 0;
    let scrollSpeed = 0;

    let compact = false;
    let renderScale = 0.6;
    let iterations = 20;
    let qualityIterations = 20;
    let dyeShort = 512;
    let simShort = 128;
    let simCellsX = 128;
    let simCellsY = 128;
    let dyeReduced = false;
    let slowFrames = 0;
    let sampledFrames = 0;

    let pointerX = 0;
    let pointerY = 0;
    let pointerFromX = 0;
    let pointerFromY = 0;
    let pointerActive = false;
    let pointerMoved = false;

    const srcA = new Float32Array(MAX_SOURCES * 4);
    const srcB = new Float32Array(MAX_SOURCES * 4);
    const srcC = new Float32Array(MAX_SOURCES * 4);
    const params: StepParams = {
      dt: 1 / 60,
      curl: 20,
      velocityDissipation: 0.3,
      dyeDissipation: 0.5,
      iterations: 20,
      fieldX: 0,
      fieldY: 0,
      fieldZ: 0,
      swirlX: 0.64,
      swirlY: 0.5,
      swirlStrength: 0,
      swirlRadius: 0.45,
      time: 0,
      count: 0,
      srcA,
      srcB,
      srcC,
    };

    const push = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      radius: number,
      forceX: number,
      forceY: number,
      red: number,
      green: number,
      blue: number,
      amount: number,
    ) => {
      if (params.count >= MAX_SOURCES) return;
      const o = params.count * 4;
      srcA[o] = x0;
      srcA[o + 1] = y0;
      srcA[o + 2] = x1;
      srcA[o + 3] = y1;
      srcB[o] = radius;
      srcB[o + 1] = forceX;
      srcB[o + 2] = forceY;
      srcB[o + 3] = 0;
      srcC[o] = red;
      srcC[o + 1] = green;
      srcC[o + 2] = blue;
      srcC[o + 3] = amount;
      params.count += 1;
    };

    const configure = () => {
      const host = canvas.parentElement ?? canvas;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      compact = width < 768 || !finePointer;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const scale = Math.min(renderScale, compact ? 0.42 : 0.6);
      const canvasWidth = Math.max(1, Math.round(width * pixelRatio * scale));
      const canvasHeight = Math.max(1, Math.round(height * pixelRatio * scale));
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
      simShort = compact ? 80 : 128;
      const baseDye = compact ? 256 : 512;
      dyeShort = dyeReduced ? Math.round(baseDye * 0.7) : baseDye;
      iterations = Math.min(qualityIterations, compact ? 10 : 20);
      const aspect = width / height;
      const fit = (short: number) =>
        aspect >= 1
          ? [Math.round(short * aspect), short]
          : [short, Math.round(short / aspect)];
      const [simWidth, simHeight] = fit(simShort);
      const [dyeWidth, dyeHeight] = fit(dyeShort);
      simCellsX = simWidth;
      simCellsY = simHeight;
      engine?.setSize(simWidth, simHeight, dyeWidth, dyeHeight);
    };

    const buildSources = (dt: number) => {
      params.count = 0;
      const t = elapsed;
      const k = simShort / 128;
      const w0 = weightOf(section, 0);
      const w1 = weightOf(section, 1);
      const w2 = weightOf(section, 2);
      const w3 = weightOf(section, 3);
      const w4 = weightOf(section, 4);

      if (pointerMoved) {
        const dx = pointerX - pointerFromX;
        const dy = pointerY - pointerFromY;
        const distance = Math.hypot(dx, dy);
        if (distance > 0.0005) {
          const gain = 0.6 / Math.max(dt, 1 / 120);
          let fx = dx * simCellsX * gain;
          let fy = dy * simCellsY * gain;
          const magnitude = Math.hypot(fx, fy);
          const cap = 1200 * k;
          if (magnitude > cap) {
            fx *= cap / magnitude;
            fy *= cap / magnitude;
          }
          const amount = Math.min(0.12, distance * 1.5) * (1 - w3 * 0.75);
          const dusk = clamp01(w1 + w2 * 0.5 + 0.5 * Math.sin(t * 0.37));
          push(
            pointerFromX,
            pointerFromY,
            pointerX,
            pointerY,
            compact ? 0.0024 : 0.0016,
            fx,
            fy,
            lerp(1, 0.48, dusk),
            0.36,
            lerp(0.14, 1, dusk),
            amount,
          );
        }
        pointerFromX = pointerX;
        pointerFromY = pointerY;
        pointerMoved = false;
      }

      if (w0 > 0.01) {
        const p1 = puff(t * 1.1) * w0;
        const p2 = puff(t * 0.83 + 2.1) * w0;
        const p3 = puff(t * 0.67 + 4.0) * w0;
        const x1 = 0.84 + 0.05 * Math.sin(t * 0.31);
        const lean = Math.sin(t * 0.43) * 0.35;
        push(x1, 0.02, x1, 0.03, 0.0024, (lean - 0.2) * 260 * p1 * k * dt, 900 * p1 * k * dt, 1, 0.36, 0.14, 7.5 * p1 * dt);
        const y2 = 0.16 + 0.06 * Math.sin(t * 0.27);
        push(0.985, y2, 0.98, y2, 0.0018, -760 * p2 * k * dt, 380 * p2 * k * dt, 0.48, 0.36, 1, 6.0 * p2 * dt);
        push(0.66, 0.02, 0.66, 0.03, 0.001, 140 * p3 * k * dt, 700 * p3 * k * dt, 0.96, 0.66, 0.54, 3.2 * p3 * dt);
      }

      if (w1 > 0.01) {
        const p = puff(t * 0.7 + 1.0) * w1;
        push(0.86, 0.28, 0.86, 0.29, 0.0022, 250 * p * k * dt, 360 * p * k * dt, 0.48, 0.36, 1, 5.5 * p * dt);
        push(0.8, 0.02, 0.8, 0.03, 0.0012, -60 * p * k * dt, 520 * p * k * dt, 0.62, 0.42, 0.95, 2.8 * p * dt);
      }

      if (w2 > 0.01) {
        const lanes = compact ? 3 : 4;
        for (let lane = 0; lane < lanes; lane++) {
          const y = (compact ? STACK_LANES_COMPACT : STACK_LANES)[lane] + 0.01 * Math.sin(t * 0.35 + lane * 1.7);
          const pulse = (0.55 + 0.45 * Math.sin(t * 0.9 + lane * 2.3)) * w2;
          const tone = lane % 2 === 0;
          const x0 = 0.5 + 0.08 * Math.sin(t * 0.21 + lane);
          push(
            x0,
            y,
            1.0,
            y,
            0.00012,
            0,
            0,
            tone ? 1 : 0.48,
            tone ? 0.42 : 0.36,
            tone ? 0.22 : 1,
            (tone ? 1.8 : 2.2) * pulse * dt,
          );
        }
      }

      if (w4 > 0.01) {
        const p = (0.7 + 0.3 * Math.sin(t * 2.1)) * w4;
        const sway = Math.sin(t * 0.7) * 0.03;
        push(0.5 + sway, 0.015, 0.5 + sway, 0.03, 0.0018, Math.sin(t * 0.9) * 140 * k * dt * w4, 1300 * p * k * dt, 1, 0.36, 0.14, 7.0 * p * dt);
        push(0.5 + sway, 0.015, 0.5 + sway, 0.03, 0.0005, 0, 200 * p * k * dt, 1, 0.74, 0.54, 3.2 * p * dt);
      }

      const stirAmount = Math.min(1, Math.abs(scrollFlow) * 0.5) * (1 - w3 * 0.8);
      if (stirAmount > 0.02) {
        const warm = clamp01(w4 + w0 * 0.6);
        push(0.995, 0.1, 0.995, 0.9, 0.0008, 0, 0, lerp(0.48, 1, warm), 0.36, lerp(1, 0.14, warm), 1.2 * stirAmount * dt);
      }

      params.curl = (compact ? 24 : 30) * (1 - 0.92 * w2) * (1 - 0.5 * w3) + 6 * w1;
      params.velocityDissipation = 0.25 + 0.35 * w1 + 0.5 * w2 + 0.6 * w3;
      params.dyeDissipation = 0.4 * w0 + 0.35 * w1 + 0.45 * w2 + 3.2 * w3 + 0.6 * w4;
      params.fieldX = w2 * (90 + 420 * Math.abs(scrollFlow)) * k * (scrollFlow < -0.05 ? -1 : 1);
      params.fieldY = w2 * 6;
      params.fieldZ = scrollFlow * 160 * k * dt * (1 - w2 * 0.6);
      params.swirlStrength = w1 * 55 * k;
      params.swirlX = 0.7;
      params.swirlY = 0.48;
      params.swirlRadius = compact ? 0.45 : 0.6;
      params.time = t;
      params.dt = dt;
      params.iterations = scrollSpeed > 0.5 ? Math.max(6, Math.round(iterations * 0.6)) : iterations;
    };

    const draw = () => {
      if (!engine || contextLost) return;
      engine.display(section, elapsed, compact ? 0.22 : 0.3);
    };

    const prewarm = (steps: number) => {
      if (!engine) return;
      for (let i = 0; i < steps; i++) {
        const dt = 1 / 30;
        elapsed += dt;
        buildSources(dt);
        params.iterations = Math.min(iterations, 8);
        engine.step(params);
      }
    };

    const tick = (now: number) => {
      frameId = 0;
      if (document.hidden || contextLost || reducedMotion || !engine) return;
      const rawDelta = Math.max(0, (now - lastFrame) / 1000);
      const dt = Math.min(1 / 30, rawDelta);
      lastFrame = now;
      elapsed += dt;

      sampledFrames += 1;
      if (rawDelta > 0.021 && rawDelta < 0.5) slowFrames += 1;
      if (sampledFrames >= 60) {
        if (slowFrames > 30) {
          if (renderScale > 0.3) {
            renderScale = Math.max(0.25, renderScale * 0.82);
          }
          qualityIterations = Math.max(compact ? 6 : 8, Math.round(iterations * 0.8));
          if (renderScale <= 0.3 && !dyeReduced) dyeReduced = true;
          configure();
        }
        sampledFrames = 0;
        slowFrames = 0;
      }

      const scrollY = window.scrollY;
      const viewport = Math.max(1, window.innerHeight);
      const signed = dt > 0 ? (scrollY - lastScrollY) / viewport / dt : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, viewport);
      const flowTarget = Math.max(-3, Math.min(3, signed));
      scrollFlow = lerp(scrollFlow, flowTarget, easeFactor(Math.abs(flowTarget) > Math.abs(scrollFlow) ? 0.3 : 0.08, dt));
      scrollSpeed = Math.abs(scrollFlow);
      section = lerp(section, targetSection, easeFactor(0.05, dt));

      buildSources(dt);
      engine.step(params);
      draw();
      frameId = requestAnimationFrame(tick);
    };

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      scrollFlow = 0;
      scrollSpeed = 0;
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
      configure();
      if (reducedMotion) renderStill();
    };

    const handleScroll = () => {
      if (!reducedMotion) return;
      const next = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      if (Math.abs(next - section) > 0.001) renderStill();
    };

    const movePointer = (clientX: number, clientY: number) => {
      const x = clientX / Math.max(1, window.innerWidth);
      const y = 1 - clientY / Math.max(1, window.innerHeight);
      if (!pointerActive) {
        pointerFromX = x;
        pointerFromY = y;
        pointerActive = true;
      }
      pointerX = x;
      pointerY = y;
      pointerMoved = true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      movePointer(event.clientX, event.clientY);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      pointerActive = false;
      movePointer(touch.clientX, touch.clientY);
      pointerMoved = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) movePointer(touch.clientX, touch.clientY);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) pointerActive = false;
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
      configure();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const handleContextRestored = () => {
      engine = createEngine(canvas);
      if (!engine) {
        setUnsupported(true);
        return;
      }
      contextLost = false;
      configure();
      prewarm(compact ? 24 : 36);
      start();
    };

    const bodyObserver = new ResizeObserver(remeasure);
    bodyObserver.observe(document.body);

    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleMotionChange);
    finePointerQuery.addEventListener("change", handlePointerQueryChange);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    configure();
    const savedSection = section;
    section = 0;
    prewarm(reducedMotion ? 80 : compact ? 24 : 36);
    section = savedSection;
    start();

    return () => {
      stop();
      bodyObserver.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      finePointerQuery.removeEventListener("change", handlePointerQueryChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      const gl = engine?.gl;
      engine?.destroy();
      engine = null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
