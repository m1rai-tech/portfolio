import { useEffect, useState } from "react";
import { Copy } from "./Copy";

export function ProjectImage({
  src,
  alt,
  className = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <span
      role="img"
      aria-label={alt}
      className={`flex items-center justify-center bg-ink-2 p-6 text-center font-mono text-xs text-paper/45 ${className}`}
    >
      <Copy select={(t) => t.works.modal.imageUnavailable} />
    </span>
  ) : (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
