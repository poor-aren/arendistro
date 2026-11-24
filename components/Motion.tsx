"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Muncul pelan saat masuk layar. */
export function Reveal({ children, delay = 0, className, as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "article" | "figure" | "li" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </M>
  );
}

/** Judul per kata, naik dari bawah garis. */
export function SplitTitle({ text, className, as = "h1" }: { text: string; className?: string; as?: "h1" | "h2" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M className={className} aria-label={text} initial="hide" animate="show" transition={{ staggerChildren: 0.07, delayChildren: 0.1 }}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true" style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em" }}>
          <motion.span
            style={{ display: "inline-block" }}
            variants={reduce ? {} : { hide: { y: "105%" }, show: { y: 0 } }}
            transition={{ duration: 0.9, ease }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </M>
  );
}

/** Foto dengan tirai terbuka saat masuk layar + parallax kecil di dalam bingkai. */
export function Photo({ src, srcSet, sizes, alt }: { src: string; srcSet: string; sizes: string; alt: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);
  return (
    <motion.div ref={ref} initial="hide" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      <motion.div
        className="frame"
        variants={reduce ? {} : { hide: { clipPath: "inset(100% 0 0 0)" }, show: { clipPath: "inset(0% 0 0 0)" } }}
        transition={{ duration: 1.2, ease }}
      >
        <motion.img src={src} srcSet={srcSet} sizes={sizes} alt={alt} style={{ y, scale: 1.14 }} />
      </motion.div>
    </motion.div>
  );
}

/** Efek tekan: sedikit mengecil saat ditekan. */
export const press = { whileTap: { scale: 0.96 }, whileHover: { y: -2 }, transition: { type: "spring" as const, stiffness: 400, damping: 25 } };
