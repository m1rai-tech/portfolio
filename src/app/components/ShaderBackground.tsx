import { useEffect, useRef, useState } from "react";

const FRAGMENT_BODY = `uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uHover;
uniform float uSection;
uniform float uVel;

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
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, float detail) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    float gain = i < 2 ? 1.0 : detail;
    sum += amp * gain * noise(p);
    sum += amp * (1.0 - gain) * 0.5;
    p = rot * p * 2.03 + vec2(17.1, 3.7);
    amp *= 0.5;
  }
  return sum;
}

float weight(float index) {
  return clamp(1.0 - abs(uSection - index), 0.0, 1.0);
}

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float field(vec2 p, float t, float warp, float detail, out vec2 q, out vec2 r) {
  q = vec2(fbm(p + vec2(0.0, -t * 0.6), 1.0), fbm(p + vec2(5.2, 1.3) + t * 0.15, 1.0));
  r = vec2(fbm(p + warp * q + vec2(1.7, 9.2) + t * 0.2, detail), fbm(p + warp * q + vec2(8.3, 2.8) - t * 0.12, detail));
  return fbm(p + warp * r, detail);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 s = vec2(uv.x * aspect, uv.y);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float w0 = weight(0.0);
  float w1 = weight(1.0);
  float w2 = weight(2.0);
  float w3 = weight(3.0);
  float w4 = weight(4.0);

  vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);
  vec2 toMouse = p - mouse;
  float dist = length(toMouse);
  float lens = exp(-dist * dist * 9.0) * uHover;
  float ripple = sin(dist * 34.0 - uTime * 2.2) * exp(-dist * 5.0) * 0.012 * uHover;
  p -= toMouse * lens * 0.32;
  p += normalize(toMouse + 1e-4) * ripple;

  p.y *= 1.0 - uVel * 0.45;

  float zoom = w0 * 1.0 + w1 * 2.3 + w2 * 1.5 + w3 * 1.15 + w4 * 1.0;
  float angle = w1 * 0.35 + w2 * 0.55 + w3 * 0.7 + w4 * 0.9;
  float t = uTime * (0.05 + w3 * -0.025);
  p.x *= 1.0 + w0 * 0.35 + w4 * 0.2;
  p = rotate(angle) * p / zoom;
  p += vec2(0.0, uSection * 0.9);
  p *= 1.7;

  float warp = 3.6 + w2 * 0.6 - w3 * 1.2 + uVel * 2.5;
  float detail = 1.0 - 0.85 * smoothstep(0.0, 1.0, w2);
  vec2 q;
  vec2 r;
  float f = field(p, t, warp, detail, q, r);

  float v = smoothstep(0.32, 0.9, f);
  float lq = length(q);
  float rx = r.x;

  float heroMask = exp(-pow(length((s - vec2(aspect * 1.02, -0.18)) * vec2(0.55, 0.62)), 2.0) * 1.6);
  heroMask *= 1.0 - 0.9 * smoothstep(1.0, 0.0, length((s - vec2(0.0, 1.0)) * vec2(0.5, 1.0)));
  float heroCore = exp(-pow(length((s - vec2(aspect * 0.9, 0.05)) * vec2(0.8, 0.9)), 2.0) * 3.0);
  vec3 hero = mix(INK, DUSK * 0.48, smoothstep(0.3, 0.95, lq) * v);
  hero = mix(hero, EMBER * 0.9, pow(v, 1.6) * smoothstep(0.3, 0.7, rx) * (0.35 + 0.65 * heroCore));
  hero += mix(EMBER, PAPER, 0.3) * pow(v, 4.0) * heroCore * 0.4;
  hero = mix(INK, hero, heroMask);

  float aboutMask = 0.4 + 0.6 * exp(-pow(length((s - vec2(aspect * 0.72, 0.4)) * vec2(0.55, 0.75)), 2.0) * 1.2);
  vec3 about = mix(INK, DUSK * 0.6, pow(v, 1.1) * smoothstep(0.2, 0.8, lq));
  about = mix(about, mix(DUSK, EMBER, 0.55) * 0.7, pow(v, 2.6) * smoothstep(0.5, 0.85, rx));
  about += DUSK * 0.08 * smoothstep(0.4, 1.0, r.y) * v;
  about = mix(INK, about, aboutMask);

  float h = f * 13.0;
  float fw = max(fwidth(h), 1e-4);
  float lineWidth = mix(6.0, 1.25, smoothstep(0.35, 1.0, w2));
  float line = 1.0 - smoothstep(0.0, lineWidth, abs(fract(h) - 0.5) / fw);
  float major = 1.0 - smoothstep(0.0, lineWidth * 1.15, abs(fract(h / 5.0) - 0.5) * 5.0 / fw);
  float density = smoothstep(0.9, 0.35, fw);
  line *= density;
  major *= density;
  float stackMask = 0.2 + 0.8 * smoothstep(1.4, 0.2, length((s - vec2(aspect * 0.62, 0.45)) * vec2(0.6, 0.9)));
  vec3 lineTint = mix(EMBER, PAPER, smoothstep(0.4, 0.75, f));
  vec3 stack = mix(INK, DUSK * 0.16, v * 0.8 * stackMask);
  stack += lineTint * line * 0.2 * stackMask;
  stack += mix(EMBER, PAPER, 0.45) * major * 0.24 * stackMask;

  float edge = smoothstep(0.35, 0.95, length((uv - 0.5) * vec2(1.15, 1.35)));
  vec3 works = mix(INK, DUSK * 0.26, pow(v, 1.4) * edge);
  works += DUSK * 0.025 * edge;

  float bloom = exp(-pow(length((s - vec2(aspect * 0.5, -0.2)) * vec2(0.65, 1.0)), 2.0) * 2.2);
  vec3 contact = mix(INK, DUSK * 0.35, v * smoothstep(0.3, 0.9, lq) * (0.3 + 0.7 * bloom));
  contact = mix(contact, EMBER * 0.85, pow(v, 1.8) * bloom * 0.85);
  contact += EMBER * bloom * 0.08;
  contact += mix(EMBER, PAPER, 0.5) * pow(v, 7.0) * bloom * 0.35;

  vec3 color = hero * w0 + about * w1 + stack * w2 + works * w3 + contact * w4;

  if (uVel > 0.02) {
    float shift = uVel * 0.05;
    vec2 qa;
    vec2 ra;
    float vr = smoothstep(0.32, 0.9, field(p + vec2(0.0, shift), t, warp, detail, qa, ra));
    float vb = smoothstep(0.32, 0.9, field(p - vec2(0.0, shift), t, warp, detail, qa, ra));
    float presence = clamp(dot(color, vec3(0.3, 0.5, 0.2)) * 6.0, 0.0, 1.0);
    color.r += max(vr - v, 0.0) * 0.2 * uVel * presence;
    color.b += max(vb - v, 0.0) * 0.24 * uVel * presence;
    color.g -= abs(vr - vb) * 0.03 * uVel * presence;
  }

  color += EMBER * lens * 0.03 * v;

  float vignette = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(aspect * 0.75, 1.0)));
  color = mix(INK * 0.6, color, 0.35 + 0.65 * vignette);

  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 311.0) - 0.5;
  color += grain * 0.028;

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
const RENDER_SCALE = 0.55;
const MAX_PIXEL_RATIO = 1.25;
const STILL_TIME = 8;
const FALLBACK_BACKGROUND =
  "radial-gradient(70% 60% at 92% 105%, rgba(255, 91, 36, 0.2), transparent 70%), radial-gradient(55% 55% at 100% 55%, rgba(122, 92, 255, 0.16), transparent 72%), #0b0a0c";

type UniformName = "uTime" | "uRes" | "uMouse" | "uHover" | "uSection" | "uVel";

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
    powerPreference: "low-power",
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
  let fragmentHeader = FRAGMENT_HEADER_WEBGL2;
  if (!isWebgl2) {
    const derivatives = gl.getExtension("OES_standard_derivatives");
    fragmentHeader = derivatives
      ? `#extension GL_OES_standard_derivatives : enable\n${FRAGMENT_HEADER_WEBGL1}`
      : `${FRAGMENT_HEADER_WEBGL1}#define fwidth(x) 0.04\n`;
  }
  const vertex = compileShader(gl, gl.VERTEX_SHADER, isWebgl2 ? VERTEX_WEBGL2 : VERTEX_WEBGL1);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentHeader + FRAGMENT_BODY);
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
  const names: UniformName[] = ["uTime", "uRes", "uMouse", "uHover", "uSection", "uVel"];
  const uniforms = Object.fromEntries(
    names.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<UniformName, WebGLUniformLocation | null>;
  return { gl, program, buffer, uniforms };
}

function destroyRenderer(renderer: Renderer | null) {
  if (!renderer || renderer.gl.isContextLost()) return;
  renderer.gl.deleteBuffer(renderer.buffer);
  renderer.gl.deleteProgram(renderer.program);
}

export function ShaderBackground() {
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

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const host = canvas.parentElement ?? canvas;
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio * RENDER_SCALE));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio * RENDER_SCALE));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = () => {
      if (!renderer || contextLost) return;
      const { gl, uniforms } = renderer;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, reducedMotion ? STILL_TIME : elapsed);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform2f(uniforms.uMouse, mouseX, mouseY);
      gl.uniform1f(uniforms.uHover, hover);
      gl.uniform1f(uniforms.uSection, section);
      gl.uniform1f(uniforms.uVel, velocity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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

      const targetVelocity = clamp01(scrollSpeed / 3500);
      const velocityRate = targetVelocity > velocity ? 0.18 : 0.05;
      velocity = lerp(velocity, targetVelocity, easeFactor(velocityRate, deltaSeconds));
      section = lerp(section, targetSection, easeFactor(0.08, deltaSeconds));
      mouseX = lerp(mouseX, targetMouseX, easeFactor(0.07, deltaSeconds));
      mouseY = lerp(mouseY, targetMouseY, easeFactor(0.07, deltaSeconds));
      hover = lerp(hover, finePointer ? targetHover : 0, easeFactor(0.05, deltaSeconds));

      draw();
      frameId = requestAnimationFrame(tick);
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

    const renderStill = () => {
      targetSection = sectionFromScroll(bounds, window.scrollY, window.innerHeight);
      section = targetSection;
      velocity = 0;
      hover = 0;
      draw();
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
