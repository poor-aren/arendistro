"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { categories, kategoriNama, pesanLink, products, rupiah } from "@/lib";

const ease = [0.16, 1, 0.3, 1] as const;
const rak = (id: string, sisi: "depan" | "samping") => `/rak/${id}-${sisi}.webp`;

/** Grid toko: panel polos, hover = tampak samping, klik = pesan via WhatsApp. */
export default function Shop() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState("semua");
  const list = filter === "semua" ? products : products.filter((p) => p.kategori === filter);

  return (
    <div className="wrap">
      <div className="tabs" role="group" aria-label="Filter kategori">
        {[{ id: "semua", nama: "Semua" }, ...categories].map((c) => (
          <button key={c.id} className="tab caps" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.nama}
          </button>
        ))}
      </div>

      <div className="shop">
        {list.map((p, i) => (
          <motion.a
            key={`${filter}-${p.id}`} className="tee" href={pesanLink(p.nama)} target="_blank" rel="noopener"
            aria-label={`${p.nama}, ${rupiah(p.harga)}. Pesan via WhatsApp`}
            initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: Math.min(i, 8) * 0.05, ease }}
          >
            <div className="tee-img">
              <img src={rak(p.id, "depan")} alt="" width={500} height={618} loading="lazy" />
              <img src={rak(p.id, "samping")} alt="" width={500} height={618} loading="lazy" className="tee-alt" />
            </div>
            <div className="tee-meta">
              <h3>{p.nama}</h3>
              <span className="tee-price">{rupiah(p.harga)}</span>
            </div>
            <p className="tee-sub caps">{kategoriNama(p.kategori)}</p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
