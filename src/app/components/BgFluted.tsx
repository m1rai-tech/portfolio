import { useEffect, useRef, useState } from "react";

const FRAGMENT_BODY = `uniform float uTime;
uniform vec2 uRes;
uniform float uPx;
uniform float uRibW;
uniform float uAngle;
uniform float uRefr;
uniform float uVis;
uniform float uDim;
uniform float uChroma;
uniform float uCalm;
uniform float uNarrow;
uniform float uVel;
uniform float uFast;
uniform vec4 uL0;
uniform vec4 uL1;
uniform vec4 uL2;
uniform vec4 uL3;
uniform vec4 uL4;
uniform vec4 uBar;
uniform vec2 uBarW;

const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);
const vec3 DEEP = vec3(0.62, 0.13, 0.11);
const vec3 WARM = vec3(1.0, 0.78, 0.6);
const vec3 BARC = vec3(0.98, 0.72, 0.55);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float blob(vec2 s, vec4 L, vec2 a) {
  vec2 d = (s - L.xy) * a;
  d.y /= 1.0 + uVel * 1.8;
  float q = dot(d, d) / (L.z * L.z);
  return L.w * (exp(-q * 2.0) * 0.78 + 0.22 / (1.0 + q * 7.0));
}

vec3 field(vec2 s) {
  vec2 a = vec2(uRes.x / uRes.y, 1.0);
  vec3 c = EMBER * blob(s, uL0, a);
  c += DUSK * blob(s, uL1, a);
  c += PAPER * blob(s, uL2, a);
  c += DEEP * blob(s, uL3, a);
  c += WARM * blob(s, uL4, a);
  vec2 pa = (s - uBar.xy) * a;
  vec2 ba = (uBar.zw - uBar.xy) * a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  vec2 d = pa - ba * t;
  d.y /= 1.0 + uVel * 1.8;
  c += BARC * uBarW.y * exp(-dot(d, d) / (uBarW.x * uBarW.x));
  return c;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 s = frag / uRes;
  vec2 css = (frag - 0.5 * uRes) / uPx;
  vec2 dir = vec2(cos(uAngle), sin(uAngle));
  float along = dot(css, vec2(-dir.y, dir.x));
  float u = dot(css, dir) / uRibW;
  u += sin(along * 0.0042 + uTime * 1.9) * uVel * 0.9 + sin(along * 0.0012 - uTime * 0.3) * 0.05;
  float f = fract(u) - 0.5;
  float x = f * 2.0;
  float h = sqrt(max(1.0 - x * x * 0.94, 0.0));
  float slope = x / h;
  vec2 vp = uRes / uPx;
  vec2 off = -dir * slope * uRefr * uRibW * uVis / vp;

  vec3 col;
  if (uFast > 0.5) {
    col = field(s + off);
  } else {
    col.r = field(s + off * (1.0 + uChroma)).r;
    col.g = field(s + off).g;
    col.b = field(s + off * (1.0 - uChroma)).b;
  }

  float lum = dot(col, vec3(0.3, 0.5, 0.2));
  float shade = 1.0 - 0.5 * uVis * pow(abs(x), 6.0);
  vec2 n = normalize(vec2(x, h));
  float spec = pow(max(dot(n, vec2(0.48, 0.877)), 0.0), 34.0);
  float aa = 2.2 / max(uRibW * uPx, 1.0);
  float line = smoothstep(0.8 - aa, 0.86, x) * (1.0 - smoothstep(0.92, 0.95 + aa, x));
  float groove = smoothstep(0.9, 1.0, abs(x));

  col *= shade * uDim;
  col += WARM * (spec * 0.55 + line * 0.45) * uVis * (lum * 1.25 + 0.01);
  col += PAPER * uVis * (h * 0.006 + line * 0.006);
  col *= 1.0 - groove * 0.35 * uVis;

  float cx = smoothstep(0.02, 0.78, s.x);
  float cy = 1.0 - smoothstep(0.12, 0.7, s.y);
  float calm = mix(1.0, 0.24 + 0.76 * mix(cx, cy * 0.8 + cx * 0.2, uNarrow), uCalm);
  col *= calm;

  col = 1.0 - exp(-col * 1.2);
  col = INK + (1.0 - INK) * col;
  float grain = hash(frag + fract(uTime * 7.13) * 311.0) - 0.5;
  col += grain * 0.016;
  FRAG = vec4(max(col, 0.0), 1.0);
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
const FALLBACK_BACKGROUND =
  "repeating-linear-gradient(90deg, rgba(239, 233, 223, 0.025) 0px, rgba(239, 233, 223, 0) 30px, rgba(0, 0, 0, 0.18) 58px, rgba(239, 233, 223, 0.04) 60px), radial-gradient(35% 40% at 84% 80%, rgba(255, 91, 36, 0.2), transparent 70%), radial-gradient(35% 40% at 64% 90%, rgba(122, 92, 255, 0.16), transparent 70%), #0b0a0c";

const UNIFORM_NAMES = [
  "uTime",
  "uRes",
  "uPx",
  "uRibW",
  "uAngle",
  "uRefr",
  "uVis",
  "uDim",
  "uChroma",
  "uCalm",
  "uNarrow",
  "uVel",
  "uFast",
  "uL0",
  "uL1",
  "uL2",
  "uL3",
  "uL4",
  "uBar",
  "uBarW",
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

type Vec4 = [number, number, number, number];

type SceneKey = {
  rib: number;
  angle: number;
  refr: number;
  vis: number;
  dim: number;
  chroma: number;
  calm: number;
  lights: [Vec4, Vec4, Vec4, Vec4];
  bar: Vec4;
  barW: [number, number];
};

const STACK_TRAVEL = 0.9;

const sceneKey = (index: number, stackProgress: number): SceneKey => {
  if (index === 0) {
    return {
      rib: 60,
      angle: 0,
      refr: 1.5,
      vis: 1,
      dim: 1,
      chroma: 0.07,
      calm: 1,
      lights: [
        [0.9, 0.07, 0.28, 1.0],
        [0.66, 0.16, 0.34, 0.85],
        [0.93, 0.5, 0.1, 0.35],
        [1.02, 0.78, 0.26, 0.45],
      ],
      bar: [0.74, -0.2, 0.98, 0.95],
      barW: [0.022, 0.38],
    };
  }
  if (index === 1) {
    return {
      rib: 28,
      angle: 0,
      refr: 1.9,
      vis: 1,
      dim: 0.92,
      chroma: 0.09,
      calm: 1,
      lights: [
        [0.8, 0.3, 0.46, 0.9],
        [0.6, 0.16, 0.5, 0.72],
        [0.9, 0.58, 0.17, 0.3],
        [1.0, 0.88, 0.4, 0.35],
      ],
      bar: [0.68, -0.25, 1.06, 1.1],
      barW: [0.045, 0.3],
    };
  }
  if (index === 2) {
    const shift = stackProgress * STACK_TRAVEL;
    return {
      rib: 40,
      angle: Math.PI / 2,
      refr: 1.6,
      vis: 1,
      dim: 0.9,
      chroma: 0.08,
      calm: 0.55,
      lights: [
        [1.12 - shift, 0.2, 0.32, 0.95],
        [0.74 - shift, 0.1, 0.34, 0.8],
        [1.42 - shift, 0.3, 0.12, 0.42],
        [1.85 - shift, 0.16, 0.3, 0.55],
      ],
      bar: [1.25 - shift, -0.2, 1.5 - shift, 0.9],
      barW: [0.03, 0.34],
    };
  }
  if (index === 3) {
    return {
      rib: 52,
      angle: Math.PI,
      refr: 1.2,
      vis: 0.32,
      dim: 0.42,
      chroma: 0.04,
      calm: 0.5,
      lights: [
        [0.96, 0.04, 0.24, 0.6],
        [0.76, -0.04, 0.28, 0.5],
        [1.02, 0.32, 0.1, 0.15],
        [1.06, 0.62, 0.2, 0.2],
      ],
      bar: [0.9, -0.3, 1.0, 0.2],
      barW: [0.03, 0],
    };
  }
  return {
    rib: 90,
    angle: Math.PI,
    refr: 1.4,
    vis: 1,
    dim: 1.05,
    chroma: 0.08,
    calm: 0.3,
    lights: [
      [0.52, 0.02, 0.36, 1.0],
      [0.2, -0.02, 0.3, 0.45],
      [0.52, -0.02, 0.11, 0.55],
      [0.84, 0.0, 0.32, 0.5],
    ],
    bar: [0.44, -0.15, 0.6, 0.42],
    barW: [0.03, 0.22],
  };
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

function measurePinned() {
  const sticky = document.querySelector<HTMLElement>("#stack .sticky");
  const host = sticky?.parentElement ?? document.getElementById("stack");
  if (!host) return { top: 0, length: 1 };
  return { top: absoluteTop(host), length: Math.max(1, host.offsetHeight) };
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

const DRIFT: Vec4[] = [
  [0.21, 0.0, 0.17, 1.3],
  [0.16, 2.1, 0.13, 0.4],
  [0.27, 4.2, 0.19, 2.6],
  [0.12, 1.1, 0.23, 3.7],
];

export function BgFluted() {
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
    let pinned = measurePinned();

    const stackProgressAt = (scrollY: number) =>
      clamp01((scrollY - pinned.top) / Math.max(1, pinned.length - window.innerHeight));

    let lastScrollY = window.scrollY;
    let targetSection = sectionFromScroll(bounds, lastScrollY, window.innerHeight);
    let section = targetSection;
    let stackProgress = stackProgressAt(lastScrollY);
    let velocity = 0;
    let targetMouseX = 0.7;
    let targetMouseY = 0.3;
    let mouseX = 0.7;
    let mouseY = 0.3;
    let targetHover = 0;
    let hover = 0;

    let compact = false;
    let renderScale = 0.6;
    let pixelsPerCss = 1;
    let slowFrames = 0;
    let sampledFrames = 0;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const host = canvas.parentElement ?? canvas;
      compact = host.clientWidth < 768 || !finePointer;
      const scale = Math.min(renderScale, compact ? 0.42 : 0.6);
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * scale));
      pixelsPerCss = width / Math.max(1, host.clientWidth);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, uniforms } = renderer;
      const time = reducedMotion ? STILL_TIME : elapsed;
      const clamped = Math.min(4, Math.max(0, section));
      const index = Math.min(3, Math.floor(clamped));
      const raw = clamped - index;
      const amount = raw * raw * (3 - 2 * raw);
      const from = sceneKey(index, stackProgress);
      const to = sceneKey(index + 1, stackProgress);
      const aspect = canvas.width / Math.max(1, canvas.height);
      const narrow = clamp01((1.1 - aspect) / 0.6);
      const ribScale = compact ? 0.72 : 1;
      const vel = reducedMotion ? 0 : velocity;
      const sway = compact && !reducedMotion ? Math.sin(time * 0.23) * 0.035 : 0;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uPx, pixelsPerCss);
      gl.uniform1f(uniforms.uRibW, lerp(from.rib, to.rib, amount) * ribScale * (1 + vel * 0.25));
      gl.uniform1f(uniforms.uAngle, lerp(from.angle, to.angle, amount) + sway);
      gl.uniform1f(uniforms.uRefr, lerp(from.refr, to.refr, amount) * (1 + vel * 0.6));
      gl.uniform1f(uniforms.uVis, lerp(from.vis, to.vis, amount));
      gl.uniform1f(uniforms.uDim, lerp(from.dim, to.dim, amount));
      gl.uniform1f(uniforms.uChroma, lerp(from.chroma, to.chroma, amount) * (1 + vel * 1.5));
      gl.uniform1f(uniforms.uCalm, lerp(from.calm, to.calm, amount));
      gl.uniform1f(uniforms.uNarrow, narrow);
      gl.uniform1f(uniforms.uVel, vel);
      gl.uniform1f(uniforms.uFast, compact && vel > 0.3 ? 1 : 0);

      const lightUniforms = [uniforms.uL0, uniforms.uL1, uniforms.uL2, uniforms.uL3];
      const radiusFit = 0.62 + 0.38 * (1 - narrow);
      for (let i = 0; i < 4; i++) {
        const a = from.lights[i];
        const b = to.lights[i];
        const drift = DRIFT[i];
        const x = lerp(a[0], b[0], amount) + Math.sin(time * drift[0] + drift[1]) * 0.035;
        const y = lerp(a[1], b[1], amount) * (1 - narrow * 0.35) + Math.cos(time * drift[2] + drift[3]) * 0.03;
        const r = lerp(a[2], b[2], amount) * radiusFit * (1 + Math.sin(time * 0.3 + drift[3]) * 0.06);
        const intensity = lerp(a[3], b[3], amount) * (1 - narrow * 0.2);
        gl.uniform4f(lightUniforms[i], x, y, r, intensity);
      }

      const dim = lerp(from.dim, to.dim, amount);
      if (finePointer) {
        gl.uniform4f(uniforms.uL4, mouseX, mouseY, 0.16 * radiusFit, 0.5 * hover * Math.min(1, dim * 1.4));
      } else {
        const driftX = 0.72 + Math.sin(time * 0.17) * 0.18;
        const driftY = 0.22 + Math.sin(time * 0.11 + 1.3) * 0.12;
        gl.uniform4f(uniforms.uL4, driftX, driftY, 0.15, reducedMotion ? 0 : 0.22 * Math.min(1, dim));
      }

      gl.uniform4f(
        uniforms.uBar,
        lerp(from.bar[0], to.bar[0], amount),
        lerp(from.bar[1], to.bar[1], amount),
        lerp(from.bar[2], to.bar[2], amount),
        lerp(from.bar[3], to.bar[3], amount),
      );
      gl.uniform2f(
        uniforms.uBarW,
        lerp(from.barW[0], to.barW[0], amount),
        lerp(from.barW[1], to.barW[1], amount),
      );

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
        if (slowFrames > 30 && renderScale > 0.25) {
          renderScale = Math.max(0.25, renderScale * 0.82);
          resizeCanvas();
        }
        sampledFrames = 0;
        slowFrames = 0;
      }

      const scrollY = window.scrollY;
      const scrollSpeed = deltaSeconds > 0 ? Math.abs(scrollY - lastScrollY) / deltaSeconds : 0;
      lastScrollY = scrollY;
      targetSection = sectionFromScroll(bounds, scrollY, window.innerHeight);

      const targetVelocity = clamp01(scrollSpeed / 3200);
      const velocityRate = targetVelocity > velocity ? 0.2 : 0.05;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.06, deltaSeconds));
      stackProgress = lerp(stackProgress, stackProgressAt(scrollY), easeFactor(0.12, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.07, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.07, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.04, deltaSeconds));

      draw();
      frameId = requestAnimationFrame(tick);
    };

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      stackProgress = stackProgressAt(window.scrollY);
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
      pinned = measurePinned();
      resizeCanvas();
      if (reducedMotion) renderStill();
    };

    const handleScroll = () => {
      if (!reducedMotion) return;
      const next = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      if (Math.abs(next - section) > 0.001 || Math.abs(stackProgressAt(window.scrollY) - stackProgress) > 0.001) {
        renderStill();
      }
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
