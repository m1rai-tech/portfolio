import { Socials } from "./Socials";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <p className="font-mono text-xs text-slate-500">© 2026 akirasata</p>
        <Socials size="sm" />
      </div>
    </footer>
  );
}
