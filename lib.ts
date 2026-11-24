import products from "./data/products.json";
import categories from "./data/categories.json";
import site from "./data/site.json";

export type Product = (typeof products)[number];
export { products, categories, site };

export const kategoriNama = (id: string) => categories.find((c) => c.id === id)?.nama ?? id;
export const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
export const waLink = (pesan = `Halo ${site.nama}, saya mau tanya.`) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(pesan)}`;
export const pesanLink = (nama: string) => waLink(`Halo ${site.nama}, saya mau pesan kaos ${nama}. Ukuran: `);
