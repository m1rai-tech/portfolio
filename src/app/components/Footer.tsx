import { Github } from "lucide-react";
import { Socials } from "./Socials";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div className="flex items-center gap-5">
          <p className="font-mono text-xs text-slate-600">© 2026 akirasata</p>
          <a
            href="https://github.com/m1rai-tech"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono text-xs text-slate-600 transition-colors hover:text-slate-400"
          >
            <Github size={13} />
            m1rai-tech
          </a>
        </div>
        <p className="font-mono text-xs text-slate-700">
          designed & built by akirasata · React + Vite
        </p>
        <Socials size="sm" />
      </div>
    </footer>
  );
}
