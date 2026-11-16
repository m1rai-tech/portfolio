import { useEffect, useRef, useState } from "react";

const FRAGMENT_BODY = `uniform float uTime;
uniform vec2 uRes;
uniform float uVel;
uniform vec3 uMouse;
uniform vec4 uK[4];
uniform vec4 uTap[3];
uniform float uIter;
uniform float uChroma;
uniform float uDrift;
uniform float uGrain;

const vec3 INK = vec3(0.043, 0.039, 0.047);
const vec3 EMBER = vec3(1.0, 0.357, 0.141);
const vec3 DUSK = vec3(0.478, 0.361, 1.0);
const vec3 PAPER = vec3(0.937, 0.914, 0.875);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float caustic(vec2 p, float t, float sharp) {
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 5; n++) {
    if (float(n) >= uIter) break;
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) * 200.0), p.y / (cos(i.y + tt) * 200.0)));
  }
  c /= uIter;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), sharp);
}

float rib(float x) {
  float f = abs(fract(x) - 0.5) * 2.0;
  float g = 1.0 - f;
  return pow(g, 16.0) + 0.22 * g * g * g;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 a = vec2(aspect, 1.0);
  vec4 k0 = uK[0];
  vec4 k1 = uK[1];
  vec4 k2 = uK[2];
  vec4 k3 = uK[3];
  vec2 q = uv * a;
  vec2 w = q;

  vec2 dm = (uv - uMouse.xy) * a;
  float dl = length(dm);
  vec2 dir = dm / max(dl, 0.001);
  float lensR = 0.12 + 0.2 * k2.z;
  float lens = uMouse.z * k2.z * exp(-dl * dl / (lensR * lensR));
  w -= dm * lens * 0.32;
  float spread = exp(-dl * (5.5 - 2.5 * k2.z)) * uMouse.z * k2.z;
  w += dir * sin(dl * 52.0 - uTime * 3.2) * 0.011 * spread;

  float ring = 0.0;
  for (int j = 0; j < 3; j++) {
    vec4 tp = uTap[j];
    if (tp.w > 0.001) {
      vec2 td = (uv - tp.xy) * a;
      float tl = length(td);
      float x = tl - tp.z * 0.5;
      float env = exp(-x * x * 90.0) * tp.w;
      w += td / max(tl, 0.001) * sin(x * 64.0) * 0.022 * env;
      ring += env * (0.5 + 0.5 * sin(x * 64.0));
    }
  }

  float vel = uVel;
  w.y = (w.y - 0.5) / (1.0 + vel * 2.6) + 0.5;
  w.x += sin(w.y * 7.0 + uTime * 1.9) * 0.02 * vel;

  float ribAmt = k1.z;
  vec2 cp = w;
  cp.y *= mix(1.0, 0.06, ribAmt);
  cp.x += uDrift * ribAmt * 0.07;
  vec2 p = cp * k1.x * 6.2831 - 250.0;
  float t = uTime * 0.5 + 23.0;
  vec2 o = vec2(0.045, 0.03) * k3.w * (1.0 + vel * 3.0);
  float g = caustic(p, t, k1.y);
  vec3 light = vec3(g);
  if (uChroma > 0.5) {
    light.r = caustic(p + o, t, k1.y);
    light.b = caustic(p - o, t, k1.y);
  } else {
    light *= vec3(1.06, 1.0, 0.9);
  }

  if (ribAmt > 0.001) {
    float fx = w.x * 13.0 + uDrift;
    float ro = 0.035 * k3.w * (1.0 + vel * 2.0);
    vec3 ribs = vec3(rib(fx + ro), rib(fx), rib(fx - ro));
    float sweep = 0.55 + 0.45 * sin(w.y * 2.2 - uTime * 0.35 + fx * 0.12);
    vec3 ribLight = ribs * (0.25 + 1.1 * g) * sweep + light * 0.35;
    light = mix(light, ribLight, ribAmt);
  }

  vec2 pd = (q - k0.xy * a) / k0.zw;
  float pool = exp(-dot(pd, pd));
  float left = mix(k2.w, 1.0, smoothstep(0.06, 0.8, uv.x));
  float m = pool * left;

  vec2 bd = q - vec2(aspect + 0.12, 1.18);
  float bl = length(bd);
  float ang = atan(bd.y, bd.x);
  float da = (ang + 2.2) * 2.3;
  float cone = exp(-da * da);
  float shafts = 0.5 + 0.5 * sin(ang * 29.0 + uTime * 0.21) * sin(ang * 13.0 - uTime * 0.13 + 1.3);
  float beam = cone * shafts * shafts * exp(-bl * 0.85) * k2.x * left;

  vec2 ed = (q - vec2(0.5 * aspect, -0.16)) / vec2(0.55 + 0.25 * aspect, 0.42);
  float eglow = exp(-dot(ed, ed)) * k3.x;

  vec3 lightCol = mix(PAPER, EMBER, k2.y);
  vec3 add = vec3(0.0);
  add += DUSK * 0.05 * k3.y * m * (1.0 - g);
  add += lightCol * 0.018 * m;
  add += light * lightCol * m * k1.w * (1.35 + beam * 3.0);
  add += mix(PAPER, EMBER, 0.35) * beam * 0.2;
  add += EMBER * eglow * (0.55 + 0.6 * g);
  add += lightCol * ring * 0.12 * left;
  vec3 col = INK + (1.0 - exp(-add * 1.15));
  float vig = smoothstep(1.35, 0.35, length((uv - vec2(0.55, 0.5)) * vec2(1.1, 1.0)));
  col = mix(INK, col, 0.55 + 0.45 * vig);
  col += (hash(gl_FragCoord.xy + uGrain) - 0.5) / 160.0;
  FRAG = vec4(col, 1.0);
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
const COMPACT_PIXEL_RATIO = 1.2;
const STILL_TIME = 6;
const FALLBACK_BACKGROUND =
  "radial-gradient(45% 55% at 86% 32%, rgba(239, 233, 223, 0.08), transparent 70%), radial-gradient(35% 45% at 80% 60%, rgba(122, 92, 255, 0.08), transparent 70%), radial-gradient(60% 30% at 50% 105%, rgba(255, 91, 36, 0.1), transparent 70%), #0b0a0c";

const UNIFORM_NAMES = [
  "uTime",
  "uRes",
  "uVel",
  "uMouse",
  "uK",
  "uTap",
  "uIter",
  "uChroma",
  "uDrift",
  "uGrain",
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

const SCENE: number[][] = [
  [0.9, 0.68, 0.8, 0.8, 1.9, 13, 0, 1, 1, 0.22, 0.45, 0.08, 0, 1, 1, 1],
  [0.76, 0.46, 1.0, 0.95, 0.95, 17, 0, 1.05, 0.35, 0.2, 1, 0.16, 0, 1.15, 0.75, 1.25],
  [0.74, 0.5, 0.95, 1.4, 1.3, 12, 1, 1.1, 0.25, 0.3, 0.35, 0.24, 0, 0.8, 0.9, 1],
  [0.86, 0.55, 0.7, 0.7, 1.7, 12, 0, 0.14, 0.04, 0.22, 0.12, 0.3, 0, 0.3, 0.55, 0.6],
  [0.5, -0.12, 0.85, 0.5, 1.45, 11, 0, 1.15, 0.1, 0.72, 0.5, 1, 0.42, 0.5, 0.8, 1],
];

const SPEED_INDEX = 14;

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
    UNIFORM_NAMES.map((name) => [
      name,
      gl.getUniformLocation(program, name === "uK" || name === "uTap" ? `${name}[0]` : name),
    ]),
  ) as Record<UniformName, WebGLUniformLocation | null>;
  return { gl, program, buffer, uniforms };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  renderer.gl.deleteBuffer(renderer.buffer);
  renderer.gl.deleteProgram(renderer.program);
}

export function BgCaustics() {
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
    let flow = 0;
    let drift = 0;
    let contextLost = false;
    let bounds = measureSections();

    let lastScrollY = window.scrollY;
    let targetSection = sectionFromScroll(bounds, lastScrollY, window.innerHeight);
    let section = targetSection;
    let velocity = 0;
    let targetMouseX = 0.75;
    let targetMouseY = 0.5;
    let mouseX = 0.75;
    let mouseY = 0.5;
    let targetHover = 0;
    let hover = 0;

    let compact = false;
    let renderScale = 0.55;
    let slowFrames = 0;
    let sampledFrames = 0;

    const params = new Float32Array(16);
    const taps = new Float32Array(12);
    const tapStarts = [-100, -100, -100];
    let tapCursor = 0;
    let pressX = 0;
    let pressY = 0;
    let pressTime = 0;

    const resizeCanvas = () => {
      const host = canvas.parentElement ?? canvas;
      compact = host.clientWidth < 768 || !finePointer;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, compact ? COMPACT_PIXEL_RATIO : MAX_PIXEL_RATIO);
      const scale = Math.min(renderScale, compact ? 0.42 : 0.55);
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const blendParams = (value: number) => {
      const clamped = Math.min(SCENE.length - 1, Math.max(0, value));
      const index = Math.min(SCENE.length - 2, Math.floor(clamped));
      const raw = clamped - index;
      const amount = raw * raw * (3 - 2 * raw);
      const from = SCENE[index];
      const to = SCENE[index + 1];
      for (let i = 0; i < 16; i++) params[i] = lerp(from[i], to[i], amount);
      if (compact) {
        params[4] *= 1.3;
        params[5] *= 0.85;
        params[7] *= 0.8;
        params[11] = Math.max(params[11], 0.3);
      }
    };

    const updateTaps = () => {
      for (let i = 0; i < 3; i++) {
        const age = elapsed - tapStarts[i];
        const strength = age >= 0 && age < 3 ? Math.pow(1 - age / 3, 1.6) : 0;
        taps[i * 4 + 2] = Math.max(0, age);
        taps[i * 4 + 3] = reducedMotion ? 0 : strength;
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, uniforms } = renderer;
      blendParams(section);
      updateTaps();
      const fast = !reducedMotion && velocity > 0.35;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, reducedMotion ? STILL_TIME : flow);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uVel, reducedMotion ? 0 : velocity);
      gl.uniform3f(uniforms.uMouse, mouseX, mouseY, finePointer ? hover : 0);
      gl.uniform4fv(uniforms.uK, params);
      gl.uniform4fv(uniforms.uTap, taps);
      gl.uniform1f(uniforms.uIter, compact ? (fast ? 3 : 4) : fast ? 4 : 5);
      gl.uniform1f(uniforms.uChroma, compact || fast ? 0 : 1);
      gl.uniform1f(uniforms.uDrift, reducedMotion ? 0 : drift);
      gl.uniform1f(uniforms.uGrain, reducedMotion ? 0 : (elapsed * 61.7) % 97);
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
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.08, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.08, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.04, deltaSeconds));

      blendParams(section);
      flow += deltaSeconds * params[SPEED_INDEX] * (1 + velocity * 2.4);
      drift += deltaSeconds * (0.22 + velocity * 3.2);

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

    const addTap = (clientX: number, clientY: number) => {
      if (reducedMotion) return;
      const slot = tapCursor % 3;
      tapCursor += 1;
      taps[slot * 4] = clientX / window.innerWidth;
      taps[slot * 4 + 1] = 1 - clientY / window.innerHeight;
      tapStarts[slot] = elapsed;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      targetMouseX = event.clientX / window.innerWidth;
      targetMouseY = 1 - event.clientY / window.innerHeight;
      targetHover = 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        addTap(event.clientX, event.clientY);
        return;
      }
      pressX = event.clientX;
      pressY = event.clientY;
      pressTime = performance.now();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const moved = Math.abs(event.clientX - pressX) + Math.abs(event.clientY - pressY);
      if (moved < 14 && performance.now() - pressTime < 450) addTap(event.clientX, event.clientY);
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
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
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
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
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
