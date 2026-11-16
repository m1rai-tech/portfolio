import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type HTMLAttributes,
  type ReactNode,
  type RefCallback,
} from "react";

type LensFilter = {
  id: string;
  width: number;
  height: number;
  scale: number;
  href: string;
  chroma: boolean;
};

type Entry = { lens: boolean; id: string; timer: number };

const entries = new Map<HTMLElement, Entry>();
const usage = new Map<string, number>();
const maps = new Map<string, string>();
const listeners = new Set<() => void>();
let filters: LensFilter[] = [];
let lensState: boolean | null = null;
let resizeObserver: ResizeObserver | null = null;
let frame = 0;

const light = { x: 0, y: 0, tx: 0, ty: 0, active: false };

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => filters;
const emit = () => listeners.forEach((listener) => listener());

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function lensSupported() {
  if (lensState !== null) return lensState;
  if (typeof window === "undefined" || !window.CSS?.supports) {
    lensState = false;
    return lensState;
  }
  const nav = navigator as Navigator & {
    userAgentData?: { brands?: { brand: string }[] };
  };
  const ua = nav.userAgent;
  const brands = nav.userAgentData?.brands;
  const chromium = brands?.length
    ? brands.some((item) => item.brand === "Chromium")
    : /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS/.test(ua);
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  lensState =
    chromium &&
    !ios &&
    CSS.supports("backdrop-filter", "url(#liquid-glass) blur(2px)");
  return lensState;
}

function buildMap(width: number, height: number, radius: number, band: number) {
  const key = `${width}-${height}-${radius}-${band}`;
  const cached = maps.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const image = context.createImageData(width, height);
  const data = image.data;
  const halfW = width / 2;
  const halfH = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const qx = Math.abs(px) - (halfW - radius);
      const qy = Math.abs(py) - (halfH - radius);
      let distance: number;
      let nx: number;
      let ny: number;
      if (qx > 0 && qy > 0) {
        const length = Math.hypot(qx, qy);
        distance = radius - length;
        nx = qx / length;
        ny = qy / length;
      } else if (qx > qy) {
        distance = radius - qx;
        nx = 1;
        ny = 0;
      } else {
        distance = radius - qy;
        nx = 0;
        ny = 1;
      }
      nx *= px < 0 ? -1 : 1;
      ny *= py < 0 ? -1 : 1;
      const t = clamp(1 - distance / band, 0, 1);
      const strength = t * t;
      const index = (y * width + x) * 4;
      data[index] = 128 - nx * strength * 127;
      data[index + 1] = 128 - ny * strength * 127;
      data[index + 2] = 128;
      data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const href = canvas.toDataURL("image/png");
  if (maps.size > 32) maps.delete(maps.keys().next().value as string);
  maps.set(key, href);
  return href;
}

function acquire(spec: Omit<LensFilter, "href"> & { radius: number; band: number }) {
  usage.set(spec.id, (usage.get(spec.id) ?? 0) + 1);
  if (filters.some((filter) => filter.id === spec.id)) return;
  const href = buildMap(spec.width, spec.height, spec.radius, spec.band);
  if (!href) return;
  filters = [
    ...filters,
    {
      id: spec.id,
      width: spec.width,
      height: spec.height,
      scale: spec.scale,
      href,
      chroma: spec.chroma,
    },
  ];
  emit();
}

function release(id: string) {
  const count = (usage.get(id) ?? 1) - 1;
  if (count > 0) {
    usage.set(id, count);
    return;
  }
  usage.delete(id);
  filters = filters.filter((filter) => filter.id !== id);
  emit();
}

function measure(element: HTMLElement) {
  const entry = entries.get(element);
  if (!entry) return;
  const width = Math.round(element.offsetWidth);
  const height = Math.round(element.offsetHeight);
  if (width < 12 || height < 12 || width * height > 1_200_000) {
    if (entry.id) release(entry.id);
    entry.id = "";
    element.style.removeProperty("--glass-lens");
    return;
  }
  const radius = Math.round(
    Math.min(
      parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
      width / 2,
      height / 2,
    ),
  );
  const small = window.matchMedia("(max-width: 767px)").matches;
  const band = Math.round(
    Math.min(small ? 18 : 26, Math.max(6, Math.min(width, height) * 0.36)),
  );
  const chroma = !small;
  const id = `liquid-glass-${width}-${height}-${radius}-${chroma ? "c" : "m"}`;
  if (id === entry.id) return;
  acquire({
    id,
    width,
    height,
    radius,
    band,
    chroma,
    scale: Math.round(band * 2),
  });
  element.style.setProperty("--glass-lens", `url(#${id})`);
  if (entry.id) release(entry.id);
  entry.id = id;
}

function schedule(element: HTMLElement) {
  const entry = entries.get(element);
  if (!entry) return;
  window.clearTimeout(entry.timer);
  entry.timer = window.setTimeout(() => measure(element), entry.id ? 160 : 0);
}

function observer() {
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver((records) => {
      for (const record of records) schedule(record.target as HTMLElement);
    });
  }
  return resizeObserver;
}

function paint() {
  frame = 0;
  const dx = light.tx - light.x;
  const dy = light.ty - light.y;
  if (Math.abs(dx) + Math.abs(dy) < 0.6) {
    light.x = light.tx;
    light.y = light.ty;
  } else {
    light.x += dx * 0.24;
    light.y += dy * 0.24;
    request();
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const visible: [HTMLElement, DOMRect][] = [];
  entries.forEach((_, element) => {
    const rect = element.getBoundingClientRect();
    if (
      rect.width &&
      rect.bottom > 0 &&
      rect.top < height &&
      rect.right > 0 &&
      rect.left < width
    )
      visible.push([element, rect]);
  });
  for (const [element, rect] of visible) {
    const ox = Math.max(rect.left - light.x, 0, light.x - rect.right);
    const oy = Math.max(rect.top - light.y, 0, light.y - rect.bottom);
    const near = Math.max(0, 1 - Math.hypot(ox, oy) / 280);
    element.style.setProperty("--gx", `${(light.x - rect.left).toFixed(1)}px`);
    element.style.setProperty("--gy", `${(light.y - rect.top).toFixed(1)}px`);
    element.style.setProperty("--gp", near.toFixed(3));
  }
}

function request() {
  if (light.active && !frame) frame = requestAnimationFrame(paint);
}

function attach(element: HTMLElement, lens: boolean) {
  entries.set(element, { lens, id: "", timer: 0 });
  if (lens && lensSupported()) observer().observe(element);
  request();
}

function detach(element: HTMLElement) {
  const entry = entries.get(element);
  if (!entry) return;
  window.clearTimeout(entry.timer);
  resizeObserver?.unobserve(element);
  if (entry.id) release(entry.id);
  element.style.removeProperty("--glass-lens");
  entries.delete(element);
}

function start() {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const cleanups: (() => void)[] = [];
  if (lensSupported()) root.classList.add("glass-lens");

  const onScroll = () => request();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  cleanups.push(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });

  if (fine.matches) {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      light.tx = event.clientX;
      light.ty = event.clientY;
      if (!light.active || reduce.matches) {
        light.active = true;
        light.x = light.tx;
        light.y = light.ty;
      }
      request();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    cleanups.push(() => window.removeEventListener("pointermove", onMove));
  } else if (!reduce.matches) {
    const Orientation = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: unknown })
      | undefined;
    const drift = () => {
      if (!light.active) root.classList.add("glass-touch");
    };
    if (Orientation && typeof Orientation.requestPermission !== "function") {
      const onOrient = (event: DeviceOrientationEvent) => {
        if (event.gamma === null || event.beta === null) return;
        const gx = clamp(event.gamma, -35, 35) / 35;
        const by = clamp(event.beta - 50, -35, 35) / 35;
        light.tx = window.innerWidth * (0.5 + gx * 0.6);
        light.ty = window.innerHeight * (0.22 + by * 0.6);
        if (!light.active) {
          light.active = true;
          light.x = light.tx;
          light.y = light.ty;
          root.classList.remove("glass-touch");
        }
        request();
      };
      window.addEventListener("deviceorientation", onOrient);
      const timer = window.setTimeout(drift, 1200);
      cleanups.push(() => {
        window.removeEventListener("deviceorientation", onOrient);
        window.clearTimeout(timer);
      });
    } else {
      drift();
    }
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    cancelAnimationFrame(frame);
    frame = 0;
    light.active = false;
    root.classList.remove("glass-touch", "glass-lens");
  };
}

export const press = {
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 620, damping: 26, mass: 0.7 },
} as const;

export function useGlass<T extends HTMLElement>(lens = true): RefCallback<T> {
  const current = useRef<T | null>(null);
  return useCallback(
    (element: T | null) => {
      if (current.current) detach(current.current);
      current.current = element;
      if (element) attach(element, lens);
    },
    [lens],
  );
}

type GlassProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "span" | "article";
  lens?: boolean;
  children?: ReactNode;
};

export function Glass({
  as = "div",
  lens = true,
  className = "",
  children,
  ...rest
}: GlassProps) {
  const ref = useGlass<HTMLElement>(lens);
  return createElement(
    as,
    { ...rest, ref, className: `glass ${className}` },
    children,
  );
}

export function GlassDefs() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => start(), []);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <defs>
        {list.map((filter) => (
          <filter
            key={filter.id}
            id={filter.id}
            x="0"
            y="0"
            width={filter.width}
            height={filter.height}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={filter.href}
              x="0"
              y="0"
              width={filter.width}
              height={filter.height}
              preserveAspectRatio="none"
              result="map"
            />
            {filter.chroma ? (
              <>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={filter.scale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="shiftR"
                />
                <feColorMatrix
                  in="shiftR"
                  type="matrix"
                  values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="red"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={filter.scale * 0.92}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="shiftG"
                />
                <feColorMatrix
                  in="shiftG"
                  type="matrix"
                  values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="green"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={filter.scale * 0.84}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="shiftB"
                />
                <feColorMatrix
                  in="shiftB"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                  result="blue"
                />
                <feBlend in="red" in2="green" mode="screen" result="rg" />
                <feBlend in="rg" in2="blue" mode="screen" />
              </>
            ) : (
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={filter.scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            )}
          </filter>
        ))}
      </defs>
    </svg>
  );
}
