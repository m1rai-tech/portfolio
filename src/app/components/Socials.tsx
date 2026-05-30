import { Send, Instagram } from "lucide-react";

export const socials = [
  { name: "Telegram", handle: "@akirasata", href: "https://t.me/akirasata", Icon: Send },
  { name: "Instagram", handle: "nxidetx", href: "https://instagram.com/nxidetx", Icon: Instagram },
];

export function Socials({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "lg" ? 20 : size === "sm" ? 15 : 18;

  return (
    <div className="flex items-center gap-3">
      {socials.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={name}
          className={`group relative ${dims} flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-200 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]`}
        >
          <Icon size={icon} />
        </a>
      ))}
    </div>
  );
}
