import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitch } from "./LanguageSwitch";
import { Copy } from "./Copy";
import { press, useGlass } from "./Glass";

const sections = ["about", "stack", "works", "contact"] as const;
const ease = [0.22, 1, 0.36, 1] as const;

export function Nav() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const focusWithin = useRef(false);
  const { scrollY } = useScroll();
  const pill = useGlass<HTMLDivElement>();
  const menuGlass = useGlass<HTMLButtonElement>();
  const closeGlass = useGlass<HTMLButtonElement>();
  const sheet = useGlass<HTMLDivElement>(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(current > 40);
    if (reduceMotion || open || focusWithin.current) {
      setHidden(false);
      return;
    }
    if (current > previous && current > 160) setHidden(true);
    else if (current < previous - 4) setHidden(false);
  });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = "";
      for (const id of sections) {
        const element = document.getElementById(id);
        if (
          element &&
          element.getBoundingClientRect().top <= window.innerHeight * 0.45
        )
          current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[400] rounded-full bg-ember px-4 py-3 text-sm font-semibold text-ink focus:not-sr-only"
      >
        {t.navigation.skipToContent}
      </a>
      <motion.header
        initial={false}
        animate={{ y: hidden ? "-115%" : "0%" }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease }}
        onFocusCapture={() => {
          focusWithin.current = true;
          setHidden(false);
        }}
        onBlurCapture={() => {
          focusWithin.current = false;
        }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`relative mx-auto flex items-center justify-between gap-3 transition-[max-width,margin,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? "mt-3 max-w-[calc(100%-1.5rem)] py-1.5 pl-5 pr-1.5 md:mt-4 md:max-w-[50rem] md:py-1.5 md:pl-7 md:pr-1.5"
              : "mt-0 max-w-[90rem] px-6 py-4 md:px-10 md:py-5"
          }`}
        >
          <div
            ref={pill}
            aria-hidden="true"
            className={`glass glass-bar pointer-events-none absolute inset-0 rounded-full transition-[opacity,transform,visibility] duration-500 ${
              scrolled
                ? "visible scale-100 opacity-100"
                : "invisible scale-[0.985] opacity-0"
            }`}
          />
          <a
            href="#hero"
            aria-label={t.navigation.home}
            className="relative font-display text-base leading-[1.2] tracking-tight text-paper transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember md:text-[1.05rem]"
          >
            akirasata
          </a>
          <div className="relative flex items-center gap-3">
            <nav
              aria-label={t.navigation.label}
              className="mr-6 hidden items-center gap-7 md:flex"
            >
              {sections.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={active === id ? "location" : undefined}
                  className={`relative py-1.5 text-sm transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember ${
                    active === id
                      ? "text-paper"
                      : "text-paper/60 hover:text-paper"
                  }`}
                >
                  <Copy select={(value) => value.navigation[id]} />
                  {active === id && (
                    <motion.span
                      layoutId="nav-underline"
                      aria-hidden="true"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 36 }
                      }
                      className="absolute inset-x-0 -bottom-0.5 h-px bg-ember"
                    />
                  )}
                </a>
              ))}
            </nav>
            <div className="hidden md:block">
              <LanguageSwitch />
            </div>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <motion.button
                  ref={menuGlass}
                  type="button"
                  aria-label={t.navigation.openMenu}
                  {...press}
                  className="glass glass-press relative flex h-11 w-11 items-center justify-center rounded-full text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember md:hidden"
                >
                  <Menu size={20} aria-hidden="true" />
                </motion.button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay fixed inset-0 z-[100] bg-ink/45 backdrop-blur-[18px] backdrop-saturate-150" />
                <Dialog.Content
                  ref={sheet}
                  aria-describedby={undefined}
                  className="dialog-panel glass glass-sheet fixed inset-3 z-[110] flex flex-col rounded-[2rem] px-5 pb-7 pt-1.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Dialog.Title className="sr-only">
                      {t.navigation.label}
                    </Dialog.Title>
                    <span
                      aria-hidden="true"
                      className="pl-0.5 font-display text-base leading-[1.2] tracking-tight text-paper"
                    >
                      akirasata
                    </span>
                    <Dialog.Close asChild>
                      <motion.button
                        ref={closeGlass}
                        type="button"
                        aria-label={t.navigation.closeMenu}
                        {...press}
                        className="glass glass-press relative -mr-3.5 flex h-11 w-11 items-center justify-center rounded-full text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
                      >
                        <X size={20} aria-hidden="true" />
                      </motion.button>
                    </Dialog.Close>
                  </div>
                  <nav
                    aria-label={t.navigation.label}
                    className="flex flex-1 flex-col justify-center gap-1"
                  >
                    {sections.map((id, index) => (
                      <div key={id} className="overflow-hidden px-1 py-1">
                        <motion.a
                          href={`#${id}`}
                          onClick={() => setOpen(false)}
                          aria-current={active === id ? "location" : undefined}
                          initial={reduceMotion ? false : { y: "110%" }}
                          animate={{ y: "0%" }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.7,
                            delay: reduceMotion ? 0 : 0.08 + index * 0.07,
                            ease,
                          }}
                          className={`block font-display text-[clamp(2.1rem,11vw,3.6rem)] leading-[1.15] tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember ${
                            active === id
                              ? "text-ember"
                              : "text-paper hover:text-ember"
                          }`}
                        >
                          <Copy select={(value) => value.navigation[id]} />
                        </motion.a>
                      </div>
                    ))}
                  </nav>
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.5,
                      delay: reduceMotion ? 0 : 0.4,
                      ease,
                    }}
                    className="flex items-center justify-between gap-4 border-t border-paper/10 pt-5"
                  >
                    <LanguageSwitch />
                  </motion.div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </motion.header>
    </>
  );
}
