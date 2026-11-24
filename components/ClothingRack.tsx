"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence, animate as animateValue, motion, useAnimate, useMotionValue, useMotionValueEvent,
  useReducedMotion, useScroll, useSpring, useTransform, type AnimationPlaybackControls,
} from "motion/react";
import { ArrowRight, WhatsappLogo, X } from "@phosphor-icons/react";
import { kategoriNama, pesanLink, rupiah, type Product } from "@/lib";
import { SplitTitle, press } from "./Motion";
import { useHScroll } from "./useHScroll";

// ponytail: kaos placeholder (AI, diwarnai ulang per produk). Ganti /rak/{id}-depan.webp & -samping.webp dengan foto asli.
const rak = (id: string, sisi: "depan" | "samping") => `/rak/${id}-${sisi}.webp`;
const ease = [0.16, 1, 0.3, 1] as const;
const COPIES = 3; // rak diulang 3x; scroll dijaga di salinan tengah supaya terasa tanpa ujung
const SNAP_IDLE = 140; // ms setelah scroll diam, baju terdekat ditarik ke tengah

type Picked = { p: Product; key: string; from: DOMRect };

export default function ClothingRack({ items }: { items: Product[] }) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const geo = useRef({ step: 0, set: 0, first: 0, last: 0 });
  const [picked, setPicked] = useState<Picked | null>(null);
  const [center, setCenter] = useState(-1); // indeks baju (di array loop) yang ada di tengah
  const centerRef = useRef(-1);
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIntroDone(true), 2600); return () => clearTimeout(t); }, []);
  const n = items.length;
  const loop = Array.from({ length: COPIES }, (_, c) => items.map((p) => ({ p, key: `${c}-${p.id}` }))).flat();
  const index = (((center < 0 ? 0 : center) % n) + n) % n;

  useHScroll(scroller);

  // ayunan: digerakkan selisih scroll (bukan useVelocity, karena lompatan loop bikin lonjakan palsu)
  const push = useMotionValue(0);
  const swing = useTransform(useSpring(push, { stiffness: 140, damping: 14 }), [-60, 0, 60], reduce ? [0, 0, 0] : [6, 0, -6]);
  const progress = useMotionValue(0);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  // magnet: setelah scroll diam, baju terdekat ditarik ke tengah dengan pegas
  const snap = useRef<AnimationPlaybackControls | null>(null);
  const snapping = useRef(false);
  const held = useRef(false);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const targetFor = (i: number) => {
    const el = scroller.current!;
    const s = el.querySelectorAll<HTMLElement>(".shirt")[i];
    return s.offsetLeft + s.offsetWidth / 2 - el.clientWidth / 2;
  };
  const stopSnap = () => { snap.current?.stop(); snapping.current = false; };
  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    stopSnap();
    const to = targetFor(i);
    if (reduce) { el.scrollLeft = to; return; }
    snapping.current = true;
    snap.current = animateValue(el.scrollLeft, to, {
      type: "spring", stiffness: 170, damping: 17, mass: 0.9,
      onUpdate: (v) => { el.scrollLeft = v; },
      onComplete: () => { snapping.current = false; },
    });
  };
  const snapNearest = () => {
    const el = scroller.current;
    if (!el || held.current || !geo.current.step) return;
    const g = geo.current;
    goTo(Math.round((el.scrollLeft + el.clientWidth / 2 - g.first) / g.step));
  };

  const measure = () => {
    const el = scroller.current!;
    const shirts = el.querySelectorAll<HTMLElement>(".shirt");
    const step = shirts[1].offsetLeft - shirts[0].offsetLeft;
    geo.current = { ...geo.current, step, set: step * n, first: shirts[0].offsetLeft + shirts[0].offsetWidth / 2 };
  };

  useLayoutEffect(() => {
    const el = scroller.current!;
    measure();
    el.scrollLeft = targetFor(n); // mulai di baju pertama salinan tengah
    geo.current.last = el.scrollLeft;
    setCenter(n);
    centerRef.current = n;
    const onResize = () => { measure(); snapNearest(); };
    // input pengguna menghentikan tarikan magnet; dilepas = magnet jalan lagi
    const grab = () => { held.current = true; stopSnap(); clearTimeout(idle.current); };
    const release = () => {
      if (!held.current) return;
      held.current = false;
      clearTimeout(idle.current);
      idle.current = setTimeout(snapNearest, SNAP_IDLE);
    };
    const onWheel = () => stopSnap();
    el.addEventListener("pointerdown", grab);
    el.addEventListener("touchstart", grab, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    addEventListener("pointerup", release);
    addEventListener("touchend", release);
    addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("pointerdown", grab);
      el.removeEventListener("touchstart", grab);
      el.removeEventListener("wheel", onWheel);
      removeEventListener("pointerup", release);
      removeEventListener("touchend", release);
      removeEventListener("resize", onResize);
      stopSnap();
    };
  }, [n]);

  const { scrollX } = useScroll({ container: scroller });
  useMotionValueEvent(scrollX, "change", () => {
    const el = scroller.current;
    if (!el || !geo.current.step) return;
    const g = geo.current;
    let x = el.scrollLeft;
    if (!snapping.current) {
      if (x < g.set * 0.5) { x += g.set; el.scrollLeft = x; g.last += g.set; }
      else if (x > g.set * 1.5) { x -= g.set; el.scrollLeft = x; g.last -= g.set; }
      clearTimeout(idle.current);
      idle.current = setTimeout(snapNearest, SNAP_IDLE);
    }
    push.set(Math.max(-60, Math.min(60, x - g.last)) * 3);
    g.last = x;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => push.set(0), 90);
    const pos = (x + el.clientWidth / 2 - g.first) / g.step;
    progress.set((((pos % n) + n) % n) / n);
    const c = Math.round(pos);
    if (c !== centerRef.current) { centerRef.current = c; setCenter(c); } // render ulang hanya saat baju tengah berganti
  });

  const open = () => {
    const img = scroller.current?.querySelectorAll<HTMLElement>(".shirt img")[center];
    if (img) setPicked({ p: loop[center].p, key: loop[center].key, from: img.getBoundingClientRect() });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picked) return;
      if (e.key === "ArrowRight") goTo(center + 1);
      if (e.key === "ArrowLeft") goTo(center - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [center, picked]);

  return (
    <div className="rack-page">
      <div className="rack-stage">
      <div className="rack-scroller" ref={scroller}>
        <div className="rack-track">
          <motion.div
            className="rack-rail" aria-hidden="true"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
          />
          {loop.map(({ p, key }, i) => {
            const order = Math.max(0, i - n); // salinan tengah masuk berurutan
            const hidden = picked?.key === key;
            return (
              <motion.div
                key={key} className={`shirt${i === center ? " center" : ""}`} aria-hidden="true"
                initial={reduce ? false : { opacity: 0, x: 90 }}
                animate={{ opacity: hidden ? 0 : 1, x: 0 }}
                transition={{
                  x: { duration: 1.6, delay: 0.2 + Math.min(order, 8) * 0.08, ease },
                  // setelah intro: tampil/sembunyi instan supaya baju di panggung & di rak bertukar tanpa kedip
                  opacity: introDone || reduce ? { duration: 0 } : { duration: 1.2, delay: 0.2 + Math.min(order, 8) * 0.08 },
                }}
                style={{ rotate: swing }}
              >
                {/* baju yang baru tiba di tengah berayun pelan sekali */}
                <motion.img
                  src={rak(p.id, "samping")} alt="" width={500} height={618} draggable={false}
                  animate={i === center && !reduce ? { rotate: [0, 2.6, -1.6, 0.8, 0] } : { rotate: 0 }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                />
                {/* label nama digantung di hanger baju tengah */}
                <AnimatePresence>
                  {i === center && !hidden && (
                    <motion.div
                      className="hangtag"
                      initial={reduce ? false : { opacity: 0, rotate: -16, y: -8 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: [-16, 9, -5, 2.5, 0] }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ opacity: { duration: 0.3, delay: introDone ? 0 : 1.4 }, y: { duration: 0.4, delay: introDone ? 0 : 1.4 }, rotate: { duration: 1.8, delay: introDone ? 0 : 1.4, ease: "easeOut" } }}
                    >
                      <span className="hangtag-string" />
                      <span className="hangtag-card">
                        <span className="hangtag-hole" />
                        <span className="hangtag-cat">{kategoriNama(p.kategori)}</span>
                        <span className="hangtag-name">{p.nama}</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* klik baju samping = tarik ke tengah. Detail hanya dibuka lewat tombol. */}
                <button tabIndex={-1} onClick={() => i !== center && goTo(i)} />
              </motion.div>
            );
          })}
        </div>
      </div>

        {/* tombol tepat di bawah baju tengah */}
        <div className="rack-open" style={{ opacity: picked ? 0 : 1, transition: "opacity 0.3s" }}>
          <motion.button className="btn btn-lg" onClick={open} aria-label={`Lihat detail ${items[index].nama}`} {...press}>
            Lihat detail <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>

      <div className="wrap rack-foot">
        <SplitTitle text="Kaos lokal, Banda Aceh" className="caps rack-title" />
        <div className="rack-count caps muted">
          {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          <div className="rack-progress"><motion.span style={{ scaleX: progress }} /></div>
        </div>
      </div>

      <AnimatePresence>{picked && <Stage key={picked.key} picked={picked} onClose={() => setPicked(null)} />}</AnimatePresence>
    </div>
  );
}

/** Detail baju: baju TIDAK pindah. Ia berputar di tempatnya di rak, info muncul di kiri-kanan (HP: di bawah). */
function Stage({ picked, onClose }: { picked: Picked; onClose: () => void }) {
  const { p, from } = picked;
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [face, setFace] = useState<"depan" | "samping">(reduce ? "depan" : "samping");
  const closing = useRef(false);

  // Putaran = satu animasi keyframe; tukar sisi pakai timer (bukan .then), supaya selalu terjadi
  // walau animasi dibatalkan/diulang (mis. efek jalan 2x di mode dev).
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spin = (dir: 1 | -1, delay: number, dur: number, to: "depan" | "samping") => {
    animate(".flip", { rotateY: [0, 90 * dir, -90 * dir, 0] }, { duration: dur, delay, times: [0, 0.4, 0.4, 1], ease: ["easeIn", "linear", "easeOut"] });
    timers.current.push(setTimeout(() => setFace(to), (delay + dur * 0.4) * 1000));
  };

  useLayoutEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    if (!reduce) spin(1, 0.1, 0.9, "depan");
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    timers.current.forEach(clearTimeout);
    if (!reduce) {
      animate(".stage-info", { opacity: 0 }, { duration: 0.2 });
      animate(".stage-close", { opacity: 0 }, { duration: 0.15 });
      animate(".stage-bg", { opacity: 0 }, { duration: 0.5, delay: 0.2 });
      spin(-1, 0, 0.6, "samping");
      await new Promise<void>((done) => timers.current.push(setTimeout(done, 650)));
      setFace("samping");
    }
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const pos = {
    "--l": `${from.left}px`, "--t": `${from.top}px`, "--w": `${from.width}px`, "--h": `${from.height}px`,
    "--r": `${from.right}px`, "--b": `${from.bottom}px`,
  } as React.CSSProperties;
  const info = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: reduce ? 0 : d, ease },
  });

  return (
    <motion.div ref={scope} className="stage" role="dialog" aria-modal="true" aria-labelledby="stage-title" exit={{ opacity: 0, transition: { duration: 0 } }}>
      <motion.div className="stage-bg" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      <button ref={closeBtn} className="stage-close" aria-label="Tutup" onClick={close}><X size={22} weight="light" /></button>
      <div className="stage-content" style={pos} onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="stage-shirt">
          <div className="flip">
            {/* dua sisi dimuat sekaligus; berputar = tukar opacity, bukan ganti src (ganti src bikin kedip 1 frame) */}
            <img src={rak(p.id, "samping")} alt="" width={500} height={618} style={{ opacity: face === "samping" ? 1 : 0 }} />
            <img src={rak(p.id, "depan")} alt={`${p.nama}, tampak depan`} width={500} height={618} style={{ opacity: face === "depan" ? 1 : 0 }} />
          </div>
        </div>
        {/* nama di atas baju, detail di bawah baju: rata tengah, tanpa tabel & kotak */}
        <motion.div className="stage-head" {...info(0.55)}>
          <p className="caps muted">{kategoriNama(p.kategori)}</p>
          <h2 id="stage-title" className="display italic">{p.nama}</h2>
        </motion.div>
        <motion.div className="stage-body" {...info(0.7)}>
          <p className="muted stage-desc">{p.deskripsi}</p>
          <p className="stage-facts">
            {rupiah(p.harga)}<span className="muted"> · {p.bahan} · {p.ukuran.join(" ")}</span>
          </p>
          <motion.a
            className="ask caps" href={pesanLink(p.nama)}
            target="_blank" rel="noopener" whileTap={{ scale: 0.98 }}
          >
            <span><WhatsappLogo size={16} /> Pesan via WhatsApp</span>
            <ArrowRight size={16} className="ask-arrow" />
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  );
}
