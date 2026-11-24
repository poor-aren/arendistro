"use client";
import { useEffect, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import { ArrowLeft, ArrowSquareOut, Plus, SignOut, Trash } from "@phosphor-icons/react";
import { habisSemua, rupiah, SUPABASE_KEY, SUPABASE_URL, type Category, type Product, type Site } from "@/lib";

// Keamanan ada di database (RLS + tabel admins). Validasi di sini hanya supaya pesan errornya jelas.
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = "produk";
const UKURAN = ["S", "M", "L", "XL", "XXL"];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const pesanError = (e: { message: string; code?: string } | null) =>
  !e ? "" : e.code === "23505" ? "ID sudah dipakai, ganti nama." : e.code === "23503" ? "Masih dipakai produk, pindahkan produknya dulu." : e.message;

/** Foto -> WebP (tinggi maks 1236px, transparansi tetap). */
async function toWebp(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("File harus gambar.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Foto maksimal 15 MB.");
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1236 / bmp.height);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("Gagal memproses foto."))), "image/webp", 0.85));
}
// path file di bucket dari URL publiknya (null = bukan file Supabase, mis. /rak/*.webp bawaan)
const storagePath = (url: string) => url.split(`/storage/v1/object/public/${BUCKET}/`)[1] ?? null;

export default function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return setIsAdmin(null);
    sb.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle().then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined || (session && isAdmin === null)) return <div className="admin-state muted">Memuat…</div>;
  if (!session) return <Login />;
  if (!isAdmin)
    return (
      <div className="admin-state">
        <p>Akun {session.user.email} bukan admin.</p>
        <button className="btn" onClick={() => sb.auth.signOut()}>Keluar</button>
      </div>
    );
  return <Dashboard email={session.user.email ?? ""} />;
}

function Login() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    const { error } = await sb.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
  };
  return (
    <form className="admin-login" onSubmit={submit}>
      <h1 className="display italic">Admin</h1>
      <label className="field"><span className="caps">Email</span><input name="email" type="email" required autoComplete="username" /></label>
      <label className="field"><span className="caps">Password</span><input name="password" type="password" required autoComplete="current-password" /></label>
      {err && <p className="admin-err" role="alert">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? "Masuk…" : "Masuk"}</button>
    </form>
  );
}

type Tab = "produk" | "kategori" | "pengaturan";

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("produk");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [site, setSite] = useState<Site | null>(null);
  const [loadErr, setLoadErr] = useState("");

  const load = async () => {
    const [p, c, s] = await Promise.all([
      sb.from("products").select("*").order("urutan").order("created_at"),
      sb.from("categories").select("*").order("urutan"),
      sb.from("site_settings").select("*").single(),
    ]);
    const e = p.error ?? c.error ?? s.error;
    if (e) return setLoadErr(e.message);
    setProducts(p.data ?? []); setCategories(c.data ?? []); setSite(s.data);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="admin wrap">
      <header className="admin-top">
        <p className="caps">Admin</p>
        <div className="admin-top-links caps muted">
          <a href="/" target="_blank" rel="noopener">Lihat web <ArrowSquareOut size={14} /></a>
          <button onClick={() => sb.auth.signOut()} title={email}>Keluar <SignOut size={14} /></button>
        </div>
      </header>
      <div className="tabs" role="tablist">
        {(["produk", "kategori", "pengaturan"] as Tab[]).map((t) => (
          <button key={t} role="tab" className="tab caps" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {loadErr && <p className="admin-err" role="alert">{loadErr}</p>}
      <p className="admin-note muted">Perubahan tampil di web maksimal 1 menit setelah disimpan.</p>
      {!site && !loadErr && <p className="muted">Memuat…</p>}
      {site && tab === "produk" && <Products products={products} categories={categories} reload={load} />}
      {site && tab === "kategori" && <Categories categories={categories} reload={load} />}
      {site && tab === "pengaturan" && <Settings site={site} reload={load} />}
    </div>
  );
}

/* ================= PRODUK ================= */
function Products({ products, categories, reload }: { products: Product[]; categories: Category[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Product | "baru" | null>(null);
  const [msg, setMsg] = useState("");

  if (editing)
    return <ProductForm initial={editing === "baru" ? null : editing} categories={categories} next={products.length}
      onDone={async (m) => { setEditing(null); setMsg(m); await reload(); }} onCancel={() => setEditing(null)} />;

  const remove = async (p: Product) => {
    if (!confirm(`Hapus ${p.nama}?`)) return;
    const { error } = await sb.from("products").delete().eq("id", p.id);
    if (error) return setMsg(pesanError(error));
    const files = [p.foto_depan, p.foto_samping].map(storagePath).filter((x): x is string => !!x);
    if (files.length) await sb.storage.from(BUCKET).remove(files);
    setMsg(`${p.nama} dihapus.`); reload();
  };
  const toggle = async (p: Product) => {
    const { error } = await sb.from("products").update({ featured: !p.featured }).eq("id", p.id);
    setMsg(error ? pesanError(error) : ""); reload();
  };

  return (
    <section>
      <div className="admin-bar">
        <p className="muted">{products.length} produk</p>
        <button className="btn" onClick={() => { setMsg(""); setEditing("baru"); }}><Plus size={16} /> Tambah</button>
      </div>
      {msg && <p className="admin-msg" role="status">{msg}</p>}
      {categories.length === 0 && <p className="admin-err">Buat kategori dulu di tab Kategori.</p>}
      <ul className="a-list">
        {products.map((p) => (
          <li key={p.id} className="a-row">
            <img src={p.foto_depan} alt="" width={56} height={70} />
            <button className="a-info" onClick={() => { setMsg(""); setEditing(p); }}>
              <span className="a-name">{p.nama}</span>
              <span className="muted">{rupiah(p.harga)} · {categories.find((c) => c.id === p.kategori)?.nama ?? p.kategori}{habisSemua(p) && <b className="a-out"> · Habis</b>}</span>
            </button>
            <label className="a-check" title="Tampil di rak Home">
              <input type="checkbox" checked={p.featured} onChange={() => toggle(p)} /> <span className="caps">Rak</span>
            </label>
            <button className="a-icon" aria-label={`Hapus ${p.nama}`} onClick={() => remove(p)}><Trash size={18} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductForm({ initial, categories, next, onDone, onCancel }: {
  initial: Product | null; categories: Category[]; next: number; onDone: (msg: string) => void; onCancel: () => void;
}) {
  const [p, setP] = useState<Product>(initial ? { ...initial, habis: initial.habis ?? [] } : {
    id: "", nama: "", kategori: categories[0]?.id ?? "", deskripsi: "", bahan: "", harga: 0,
    ukuran: ["S", "M", "L", "XL"], habis: [], featured: true, urutan: next, foto_depan: "", foto_samping: "",
  });
  const [files, setFiles] = useState<{ depan?: File; samping?: File }>({});
  const [preview, setPreview] = useState<{ depan?: string; samping?: string }>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const id = initial ? initial.id : slug(p.nama);

  const pick = (sisi: "depan" | "samping", f?: File) => {
    if (!f) return;
    setFiles((x) => ({ ...x, [sisi]: f }));
    setPreview((x) => ({ ...x, [sisi]: URL.createObjectURL(f) }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!id) return setErr("Nama harus berisi huruf atau angka.");
    if (!Number.isInteger(p.harga) || p.harga < 0) return setErr("Harga harus angka bulat.");
    if (!p.ukuran.length) return setErr("Pilih minimal satu ukuran.");
    if (!initial && (!files.depan || !files.samping)) return setErr("Foto depan dan samping wajib untuk produk baru.");

    setBusy(true);
    const uploaded: string[] = [];
    try {
      const row = { ...p, id };
      for (const sisi of ["depan", "samping"] as const) {
        const f = files[sisi];
        if (!f) continue;
        const path = `${id}/${sisi}-${Date.now()}.webp`; // nama unik = tidak kena cache foto lama
        const { error } = await sb.storage.from(BUCKET).upload(path, await toWebp(f), { contentType: "image/webp" });
        if (error) throw new Error(`Upload foto ${sisi} gagal: ${error.message}`);
        uploaded.push(path);
        row[sisi === "depan" ? "foto_depan" : "foto_samping"] = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const { error } = initial ? await sb.from("products").update(row).eq("id", id) : await sb.from("products").insert(row);
      if (error) throw new Error(pesanError(error));
      // foto lama yang diganti dihapus dari storage
      if (initial) {
        const old = [files.depan && initial.foto_depan, files.samping && initial.foto_samping].map((u) => (u ? storagePath(u) : null)).filter((x): x is string => !!x);
        if (old.length) await sb.storage.from(BUCKET).remove(old);
      }
      onDone(`${row.nama} disimpan.`);
    } catch (e) {
      if (uploaded.length) await sb.storage.from(BUCKET).remove(uploaded); // batalkan upload kalau simpan gagal
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <form className="a-form" onSubmit={save}>
      <button type="button" className="a-back caps muted" onClick={onCancel}><ArrowLeft size={14} /> Daftar produk</button>
      <h2 className="display italic">{initial ? initial.nama : "Produk baru"}</h2>

      <div className="a-photos">
        {(["depan", "samping"] as const).map((sisi) => {
          const src = preview[sisi] ?? (sisi === "depan" ? p.foto_depan : p.foto_samping);
          return (
            <label key={sisi} className="a-photo">
              {src ? <img src={src} alt={`Foto ${sisi}`} /> : <span className="muted">Pilih foto</span>}
              <span className="caps">Foto {sisi}</span>
              <input type="file" accept="image/png,image/webp,image/jpeg" onChange={(e) => pick(sisi, e.target.files?.[0])} />
            </label>
          );
        })}
      </div>
      <p className="admin-note muted">PNG/WebP latar transparan, kaos digantung di hanger, posisi hanger di tengah-atas. Ukuran foto depan & samping sama.</p>

      <label className="field"><span className="caps">Nama</span>
        <input value={p.nama} onChange={(e) => set("nama", e.target.value)} required maxLength={80} />
        {!initial && id && <small className="muted">ID: {id}</small>}
      </label>
      <div className="a-2">
        <label className="field"><span className="caps">Harga (Rp)</span>
          <input type="number" inputMode="numeric" min={0} step={1000} value={p.harga} onChange={(e) => set("harga", Math.round(+e.target.value))} required />
        </label>
        <label className="field"><span className="caps">Kategori</span>
          <select value={p.kategori} onChange={(e) => set("kategori", e.target.value)} required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </label>
      </div>
      <label className="field"><span className="caps">Bahan</span>
        <input value={p.bahan} onChange={(e) => set("bahan", e.target.value)} maxLength={80} placeholder="Cotton combed 30s" />
      </label>
      <label className="field"><span className="caps">Deskripsi</span>
        <textarea value={p.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} maxLength={300} rows={3} />
      </label>
      <fieldset className="field">
        <legend className="caps">Ukuran</legend>
        <div className="a-sizes">
          {UKURAN.map((u) => (
            <label key={u} className="a-size">
              <input type="checkbox" checked={p.ukuran.includes(u)}
                onChange={(e) => setP((x) => ({
                  ...x,
                  ukuran: e.target.checked ? UKURAN.filter((y) => y === u || x.ukuran.includes(y)) : x.ukuran.filter((y) => y !== u),
                  habis: (x.habis ?? []).filter((y) => y !== u || e.target.checked),
                }))} />
              <span>{u}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend className="caps">Stok habis</legend>
        <div className="a-sizes">
          {p.ukuran.map((u) => (
            <label key={u} className="a-size out">
              <input type="checkbox" checked={!!p.habis?.includes(u)}
                onChange={(e) => set("habis", e.target.checked ? p.ukuran.filter((y) => y === u || p.habis?.includes(y)) : (p.habis ?? []).filter((y) => y !== u))} />
              <span>{u}</span>
            </label>
          ))}
        </div>
        <small className="muted">Centang ukuran yang sedang kosong. Di web ukuran itu dicoret.</small>
      </fieldset>
      <div className="a-2">
        <label className="a-check big"><input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} /> Tampil di rak Home</label>
        <label className="field"><span className="caps">Urutan</span>
          <input type="number" value={p.urutan} onChange={(e) => set("urutan", Math.round(+e.target.value))} />
        </label>
      </div>

      {err && <p className="admin-err" role="alert">{err}</p>}
      <div className="a-actions">
        <button className="btn" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
        <button type="button" className="a-link caps muted" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

/* ================= KATEGORI ================= */
function Categories({ categories, reload }: { categories: Category[]; reload: () => Promise<void> }) {
  const [nama, setNama] = useState("");
  const [msg, setMsg] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = slug(nama).slice(0, 40);
    if (!id) return setMsg("Nama harus berisi huruf atau angka.");
    const { error } = await sb.from("categories").insert({ id, nama: nama.trim(), urutan: categories.length });
    setMsg(error ? pesanError(error) : `${nama.trim()} ditambahkan.`);
    if (!error) { setNama(""); reload(); }
  };
  const rename = async (c: Category, v: string) => {
    if (!v.trim() || v.trim() === c.nama) return;
    const { error } = await sb.from("categories").update({ nama: v.trim() }).eq("id", c.id);
    setMsg(error ? pesanError(error) : "Disimpan."); reload();
  };
  const move = async (i: number, d: -1 | 1) => {
    const a = categories[i], b = categories[i + d];
    if (!b) return;
    const r = await Promise.all([
      sb.from("categories").update({ urutan: i + d }).eq("id", a.id),
      sb.from("categories").update({ urutan: i }).eq("id", b.id),
    ]);
    setMsg(r.find((x) => x.error)?.error?.message ?? ""); reload();
  };
  const remove = async (c: Category) => {
    if (!confirm(`Hapus kategori ${c.nama}?`)) return;
    const { error } = await sb.from("categories").delete().eq("id", c.id);
    setMsg(error ? pesanError(error) : `${c.nama} dihapus.`); reload();
  };

  return (
    <section>
      <form className="admin-bar" onSubmit={add}>
        <label className="field grow"><span className="caps">Kategori baru</span><input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={40} required /></label>
        <button className="btn"><Plus size={16} /> Tambah</button>
      </form>
      {msg && <p className="admin-msg" role="status">{msg}</p>}
      <ul className="a-list">
        {categories.map((c, i) => (
          <li key={c.id} className="a-row cat">
            <input className="a-inline" defaultValue={c.nama} aria-label={`Nama kategori ${c.nama}`} maxLength={40}
              onBlur={(e) => rename(c, e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
            <span className="a-order">
              <button className="a-icon" aria-label="Naik" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button className="a-icon" aria-label="Turun" disabled={i === categories.length - 1} onClick={() => move(i, 1)}>↓</button>
            </span>
            <button className="a-icon" aria-label={`Hapus ${c.nama}`} onClick={() => remove(c)}><Trash size={18} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ================= PENGATURAN ================= */
function Settings({ site, reload }: { site: Site; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const igUser = site.instagram.replace(/^https:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const digits = f.wa.replace(/\D/g, "");
    const whatsapp = digits.startsWith("62") ? digits : digits.replace(/^0/, "62");
    if (!/^62[0-9]{8,13}$/.test(whatsapp)) return setMsg("Nomor WhatsApp tidak valid. Contoh: 0821 6472 2887");
    const [lat, lng] = f.koordinat.split(",").map((x) => parseFloat(x));
    if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return setMsg("Koordinat tidak valid. Contoh: 5.5652, 95.3463");
    const ig = f.ig.trim().replace(/^@/, "");
    if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) return setMsg("Username Instagram tidak valid.");

    setBusy(true);
    const { error } = await sb.from("site_settings").update({
      nama: f.nama.trim(), tagline: f.tagline.trim(), whatsapp, whatsapp_tampil: f.wa.trim(),
      instagram: ig ? `https://www.instagram.com/${ig}` : "", instagram_tampil: ig ? `@${ig}` : "",
      alamat: f.alamat.trim(), lat, lng,
    }).eq("id", 1);
    setBusy(false);
    setMsg(error ? pesanError(error) : "Pengaturan disimpan.");
    if (!error) reload();
  };

  return (
    <form className="a-form" onSubmit={save}>
      <label className="field"><span className="caps">Nama toko</span><input name="nama" defaultValue={site.nama} required maxLength={60} /></label>
      <label className="field"><span className="caps">Tagline</span><input name="tagline" defaultValue={site.tagline} maxLength={120} /></label>
      <div className="a-2">
        <label className="field"><span className="caps">Nomor WhatsApp</span><input name="wa" defaultValue={site.whatsapp_tampil} inputMode="tel" required /></label>
        <label className="field"><span className="caps">Username Instagram</span><input name="ig" defaultValue={igUser} placeholder="ilham.aren" /></label>
      </div>
      <label className="field"><span className="caps">Alamat</span><input name="alamat" defaultValue={site.alamat} maxLength={200} /></label>
      <label className="field"><span className="caps">Koordinat map</span>
        <input name="koordinat" defaultValue={`${site.lat}, ${site.lng}`} required />
        <small className="muted">Google Maps: klik kanan lokasi, salin angka koordinatnya.</small>
      </label>
      {msg && <p className="admin-msg" role="status">{msg}</p>}
      <div className="a-actions"><button className="btn" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button></div>
    </form>
  );
}
