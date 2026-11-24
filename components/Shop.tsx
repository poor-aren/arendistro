"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { habisSemua, kategoriNama, pesanLink, rupiah, type Category, type Product, type Site } from "@/lib";

const ease = [0.16, 1, 0.3, 1] as const;

function Sizes({ p }: { p: Product }) {
  return (
    <p className="sizes" aria-label="Ukuran">
      {p.ukuran.map((u) => p.habis?.includes(u)
        ? <s key={u} className="out" title={`${u} habis`}>{u}<span className="sr-only"> habis</span></s>
        : <span key={u}>{u}</span>)}
    </p>
  );
}

function Wa({ site, p }: { site: Site; p: Product }) {
  return (
    <a className="tee-wa caps" href={pesanLink(site, p.nama)} target="_blank" rel="noopener" aria-label={`Chat WhatsApp untuk ${p.nama}`}>
      <WhatsappLogo size={15} /> {habisSemua(p) ? "Tanya restock" : "Chat WhatsApp"}
    </a>
  );
}

function Photo({ p, lead }: { p: Product; lead?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="tee-img"
      // sorotan dibuka seperti tirai, sekali
      initial={lead && !reduce ? { clipPath: "inset(0 0 100% 0)" } : false}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 1.3, ease }}
    >
      <img src={p.foto_depan} alt={p.nama} width={500} height={618} loading={lead ? "eager" : "lazy"} />
    </motion.div>
  );
}

/** Galeri: kaos pertama tampil besar (sorotan), sisanya grid. Foto di panel gading ala foto studio. */
export default function Shop({ site, categories, products }: { site: Site; categories: Category[]; products: Product[] }) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState("semua");
  const list = filter === "semua" ? products : products.filter((p) => p.kategori === filter);
  const [lead, ...rest] = list;
  const count = (id: string) => (id === "semua" ? products.length : products.filter((p) => p.kategori === id).length);
  // muncul sekali saat masuk layar; jeda per kolom supaya satu baris masuk berurutan
  const reveal = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 36 }, whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 }, transition: { duration: 1, delay: (i % 4) * 0.08, ease },
  });
  const info = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: 0.35 + i * 0.07, ease },
  });

  return (
    <div className="wrap">
      <div className="tabs" role="group" aria-label="Filter kategori">
        {[{ id: "semua", nama: "Semua" }, ...categories].map((c) => (
          <button key={c.id} className="tab caps" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.nama}<sup>{count(c.id)}</sup>
          </button>
        ))}
      </div>

      {!lead && <p className="muted">Belum ada kaos di kategori ini.</p>}

      {lead && (
        <article key={`lead-${filter}-${lead.id}`} className={`tee lead${habisSemua(lead) ? " sold" : ""}`}>
          <Photo p={lead} lead />
          <div className="lead-info">
            <motion.p className="caps muted" {...info(0)}>{kategoriNama(categories, lead.kategori)}</motion.p>
            <motion.h2 className="display italic" {...info(1)}>{lead.nama}</motion.h2>
            {lead.deskripsi && <motion.p className="muted lead-desc" {...info(2)}>{lead.deskripsi}</motion.p>}
            <motion.p className="lead-price" {...info(3)}>{rupiah(lead.harga)}<span className="muted"> · {lead.bahan}</span></motion.p>
            <motion.div className="lead-buy" {...info(4)}>
              <Sizes p={lead} />
              <Wa site={site} p={lead} />
            </motion.div>
          </div>
        </article>
      )}

      <div className="shop">
        {rest.map((p, i) => (
          <motion.article key={`${filter}-${p.id}`} className={`tee${habisSemua(p) ? " sold" : ""}`} {...reveal(i)}>
            <Photo p={p} />
            <div className="tee-meta">
              <h3>{p.nama}</h3>
              <span className="tee-price">{rupiah(p.harga)}</span>
            </div>
            <Sizes p={p} />
            <Wa site={site} p={p} />
          </motion.article>
        ))}
      </div>
    </div>
  );
}
