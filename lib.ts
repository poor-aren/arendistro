// Supabase. Publishable key aman ditaruh di kode: yang menjaga data adalah RLS di database.
// JANGAN pernah taruh secret key (sb_secret_...) di sini.
export const SUPABASE_URL = "https://ydnvhfioifyrzjlvsxqa.supabase.co";
export const SUPABASE_KEY = "sb_publishable_z5VyEqBj0pBvivISfr9PrA_bwDGQdIC";

export type Site = {
  nama: string; tagline: string; whatsapp: string; whatsapp_tampil: string;
  instagram: string; instagram_tampil: string; alamat: string; lat: number; lng: number;
};
export type Category = { id: string; nama: string; urutan: number };
export type Product = {
  id: string; nama: string; kategori: string; deskripsi: string; bahan: string; harga: number;
  ukuran: string[]; habis?: string[]; featured: boolean; urutan: number; foto_depan: string; foto_samping: string;
};

export const kategoriNama = (categories: Category[], id: string) => categories.find((c) => c.id === id)?.nama ?? id;
// habis = ukuran yang stoknya kosong (diatur di admin)
export const habisSemua = (p: Product) => p.ukuran.length > 0 && p.ukuran.every((u) => p.habis?.includes(u));
export const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
export const waLink = (site: Site, pesan = `Halo ${site.nama}, saya mau tanya.`) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(pesan)}`;
export const pesanLink = (site: Site, nama: string) => waLink(site, `Halo ${site.nama}, saya mau pesan kaos ${nama}. Ukuran: `);
export const mapsEmbed = (s: Site) => `https://www.google.com/maps?q=${s.lat},${s.lng}&z=16&output=embed`;
export const mapsLink = (s: Site) => `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
