"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { kategoriNama, pesanLink, rupiah, type Category, type Product, type Site } from "@/lib";

const ease = [0.16, 1, 0.3, 1] as const;

/** Grid toko: panel polos, hover = tampak samping, tombol chat WA di bawah tiap kaos. */
export default function Shop({ site, categories, products }: { site: Site; categories: Category[]; products: Product[] }) {
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
          <motion.article
            key={`${filter}-${p.id}`} className="tee"
            initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: Math.min(i, 8) * 0.05, ease }}
          >
            <div className="tee-img">
              <img src={p.foto_depan} alt="" width={500} height={618} loading="lazy" />
              <img src={p.foto_samping} alt="" width={500} height={618} loading="lazy" className="tee-alt" />
            </div>
            <div className="tee-meta">
              <h3>{p.nama}</h3>
              <span className="tee-price">{rupiah(p.harga)}</span>
            </div>
            <p className="tee-sub caps">{kategoriNama(categories, p.kategori)}</p>
            <a className="tee-wa caps" href={pesanLink(site, p.nama)} target="_blank" rel="noopener" aria-label={`Chat WhatsApp untuk ${p.nama}`}>
              <WhatsappLogo size={15} /> Chat WhatsApp
            </a>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
