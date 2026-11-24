import type { Metadata } from "next";
import Shop from "@/components/Shop";
import { SplitTitle } from "@/components/Motion";
import { getData } from "@/db";

export const metadata: Metadata = { title: "Galeri" };

export default async function Galeri() {
  const { site, categories, products } = await getData();
  return (
    <div className="page">
      <header className="wrap head">
        <SplitTitle text="Semua kaos" className="display italic" />
        <p className="muted">Ukuran S sampai XL. Pesan lewat WhatsApp.</p>
      </header>
      <Shop site={site} categories={categories} products={products} />
    </div>
  );
}
