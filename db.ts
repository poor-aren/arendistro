// hanya diimpor dari server component (layout/halaman), jangan dari komponen "use client"
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, type Category, type Product, type Site } from "./lib";


// klien publik (server): hasil query di-cache 60 detik, jadi perubahan dari admin muncul maks. 1 menit kemudian
const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
});

/** Semua data web publik dalam sekali ambil (dibagi antara layout & halaman lewat cache React). */
export const getData = cache(async () => {
  const [s, c, p] = await Promise.all([
    db.from("site_settings").select("*").single(),
    db.from("categories").select("*").order("urutan"),
    db.from("products").select("*").order("urutan").order("created_at"),
  ]);
  const err = s.error ?? c.error ?? p.error;
  if (err) throw new Error(`Gagal ambil data Supabase: ${err.message}`);
  return { site: s.data as Site, categories: c.data as Category[], products: p.data as Product[] };
});

