import type { Metadata } from "next";
import Shop from "@/components/Shop";
import { SplitTitle } from "@/components/Motion";

export const metadata: Metadata = { title: "Galeri" };

export default function Galeri() {
  return (
    <div className="page">
      <header className="wrap head">
        <SplitTitle text="Semua kaos" className="display italic" />
        <p className="muted">Ukuran S sampai XL. Pesan lewat WhatsApp.</p>
      </header>
      <Shop />
    </div>
  );
}
