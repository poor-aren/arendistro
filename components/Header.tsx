"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { waLink, type Site } from "@/lib";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/galeri", label: "Galeri" },
  { href: "/kontak", label: "Kontak" },
];
const ease = [0.16, 1, 0.3, 1] as const;

export function Wordmark({ site }: { site: Site }) {
  return (
    <Link href="/" className="wordmark" aria-label={`${site.nama}, ke home`}>
      {site.nama.split(" ")[0].toUpperCase()}
      <svg className="mark" viewBox="5 4 22 20" aria-hidden="true"><path d="M13 8.2a3 3 0 1 1 3 3v1.6L5.6 20.6a1 1 0 0 0 .6 1.8h19.6a1 1 0 0 0 .6-1.8L16 12.8" /></svg>
      {site.nama.split(" ").slice(1).join(" ").toUpperCase()}
    </Link>
  );
}

export default function Header({ site }: { site: Site }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const active = LINKS.find((l) => (l.href === "/" ? path === "/" : path.startsWith(l.href)))?.href;
  const pill = hover ?? active;
  if (path.startsWith("/admin")) return null; // admin punya tampilan sendiri

  return (
    <header className="nav">
      <div className="nav-bg" />
      <div className="wrap nav-inner">
        <Wordmark site={site} />

        <nav className="nav-links" aria-label="Utama" onMouseLeave={() => setHover(null)}>
          {LINKS.map((l) => (
            <Link
              key={l.href} href={l.href} className="nav-link caps"
              aria-current={active === l.href ? "page" : undefined}
              onMouseEnter={() => setHover(l.href)} onFocus={() => setHover(l.href)}
            >
              {pill === l.href && (
                <motion.span layoutId="nav-line" className="nav-line" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>

        <a className="nav-cta caps" href={waLink(site)} target="_blank" rel="noopener">
          <WhatsappLogo size={15} /> WhatsApp
        </a>

        <motion.button
          className="burger" aria-expanded={open} aria-controls="menu" aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen(!open)} whileTap={{ scale: 0.9 }}
        >
          <motion.span animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} transition={{ duration: 0.4, ease }} />
          <motion.span animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} transition={{ duration: 0.4, ease }} />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu" className="menu" aria-label="Menu"
            initial={reduce ? false : { clipPath: "circle(0% at calc(100% - 46px) 36px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 46px) 36px)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 46px) 36px)" }}
            transition={{ duration: 0.8, ease }}
          >
            {LINKS.map((l, i) => (
              <div key={l.href} style={{ overflow: "hidden" }}>
                <motion.div
                  initial={reduce ? false : { y: "110%" }} animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease }}
                >
                  <Link href={l.href} className="big" aria-current={active === l.href ? "page" : undefined}>
                    {l.label}
                  </Link>
                </motion.div>
              </div>
            ))}
            <motion.div className="menu-foot" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}>
              <a href={waLink(site)} target="_blank" rel="noopener">WhatsApp</a>
              <a href={site.instagram} target="_blank" rel="noopener">Instagram</a>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
