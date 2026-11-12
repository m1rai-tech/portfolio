import { Github, Instagram, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { socialLinks } from "../data/socials";
import { press, useGlass } from "./Glass";

const icons = {
  github: Github,
  instagram: Instagram,
  telegram: Send,
};

function SocialButton({
  id,
  size,
}: {
  id: keyof typeof socialLinks;
  size: "sm" | "md" | "lg";
}) {
  const { t } = useLanguage();
  const glass = useGlass<HTMLAnchorElement>();
  const Icon = icons[id];
  return (
    <motion.a
      ref={glass}
      href={socialLinks[id].href}
      target="_blank"
      rel="noreferrer"
      aria-label={t.brands[id]}
      {...press}
      className={`glass glass-press relative flex ${size === "lg" ? "h-12 w-12" : "h-11 w-11"} items-center justify-center rounded-full text-paper/75 transition-colors duration-300 hover:text-ember`}
    >
      <Icon size={size === "lg" ? 20 : 17} aria-hidden="true" />
    </motion.a>
  );
}

export function Socials({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useLanguage();
  return (
    <div
      aria-label={t.footer.socialLinksLabel}
      role="group"
      className="flex gap-2.5"
    >
      {(Object.keys(socialLinks) as (keyof typeof socialLinks)[]).map((id) => (
        <SocialButton key={id} id={id} size={size} />
      ))}
    </div>
  );
}
