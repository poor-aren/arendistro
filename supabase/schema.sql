-- Aren Supply: jalankan SEKALI di Supabase > SQL Editor.
-- Publik hanya bisa BACA. Tulis/ubah/hapus hanya user yang ada di tabel admins.

-- ============ tabel ============
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.site_settings (
  id int primary key default 1 check (id = 1),           -- cuma 1 baris
  nama text not null check (length(nama) between 1 and 60),
  tagline text not null default '' check (length(tagline) <= 120),
  whatsapp text not null check (whatsapp ~ '^62[0-9]{8,13}$'),
  whatsapp_tampil text not null check (length(whatsapp_tampil) <= 30),
  instagram text not null default '' check (instagram = '' or instagram ~ '^https://'),
  instagram_tampil text not null default '' check (length(instagram_tampil) <= 40),
  alamat text not null default '' check (length(alamat) <= 200),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180)
);

create table public.categories (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  nama text not null check (length(nama) between 1 and 40),
  urutan int not null default 0
);

create table public.products (
  id text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  nama text not null check (length(nama) between 1 and 80),
  kategori text not null references public.categories (id) on update cascade,
  deskripsi text not null default '' check (length(deskripsi) <= 300),
  bahan text not null default '' check (length(bahan) <= 80),
  harga int not null check (harga between 0 and 100000000),
  ukuran text[] not null default array['S','M','L','XL'],
  featured boolean not null default true,                 -- tampil di rak Home
  urutan int not null default 0,
  foto_depan text not null default '',
  foto_samping text not null default '',
  created_at timestamptz not null default now()
);

-- ============ keamanan (RLS) ============
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy "admin lihat diri" on public.admins for select using (user_id = auth.uid());

create policy "publik baca" on public.site_settings for select using (true);
create policy "admin ubah" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

create policy "publik baca" on public.categories for select using (true);
create policy "admin tulis" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "publik baca" on public.products for select using (true);
create policy "admin tulis" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ============ izin akses (project Supabase baru tidak memberi otomatis) ============
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant update on public.site_settings to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
-- ============ storage foto ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produk', 'produk', true, 2097152, array['image/webp', 'image/png', 'image/jpeg']);

create policy "admin upload" on storage.objects for insert with check (bucket_id = 'produk' and public.is_admin());
create policy "admin ganti" on storage.objects for update using (bucket_id = 'produk' and public.is_admin());
create policy "admin hapus" on storage.objects for delete using (bucket_id = 'produk' and public.is_admin());

-- ============ data awal ============
insert into public.site_settings (nama, tagline, whatsapp, whatsapp_tampil, instagram, instagram_tampil, alamat, lat, lng)
values ('Aren Supply', 'Kaos lokal, Banda Aceh', '6282164722887', '0821 6472 2887',
        'https://www.instagram.com/ilham.aren', '@ilham.aren', 'Prada, Syiah Kuala, Banda Aceh', 5.5652, 95.3463);

insert into public.categories (id, nama, urutan) values
  ('basic', 'Basic', 0),
  ('graphic', 'Graphic', 1),
  ('oversize', 'Oversize', 2);

insert into public.products (id, nama, kategori, deskripsi, bahan, harga, ukuran, featured, urutan, foto_depan, foto_samping) values
  ('kaos-hitam', 'Basic Hitam', 'basic', 'Kaos polos hitam, potongan reguler.', 'Cotton combed 30s', 125000, array['S', 'M', 'L', 'XL'], true, 0, '/rak/kaos-hitam-depan.webp', '/rak/kaos-hitam-samping.webp'),
  ('kaos-forest', 'Forest', 'graphic', 'Hijau tua dengan sablon kecil di dada.', 'Cotton combed 24s', 145000, array['S', 'M', 'L', 'XL'], true, 1, '/rak/kaos-forest-depan.webp', '/rak/kaos-forest-samping.webp'),
  ('kaos-mustard', 'Mustard', 'oversize', 'Potongan oversize, bahu turun.', 'Cotton combed 20s', 155000, array['S', 'M', 'L', 'XL'], true, 2, '/rak/kaos-mustard-depan.webp', '/rak/kaos-mustard-samping.webp'),
  ('kaos-krim', 'Basic Krim', 'basic', 'Kaos polos krim, potongan reguler.', 'Cotton combed 30s', 125000, array['S', 'M', 'L', 'XL'], true, 3, '/rak/kaos-krim-depan.webp', '/rak/kaos-krim-samping.webp'),
  ('kaos-dusty-pink', 'Dusty Pink', 'oversize', 'Potongan oversize, warna pink pudar.', 'Cotton combed 20s', 155000, array['S', 'M', 'L', 'XL'], true, 4, '/rak/kaos-dusty-pink-depan.webp', '/rak/kaos-dusty-pink-samping.webp'),
  ('kaos-navy', 'Basic Navy', 'basic', 'Kaos polos biru dongker, potongan reguler.', 'Cotton combed 30s', 125000, array['S', 'M', 'L', 'XL'], true, 5, '/rak/kaos-navy-depan.webp', '/rak/kaos-navy-samping.webp'),
  ('kaos-kuning', 'Sunny', 'graphic', 'Kuning cerah dengan sablon punggung.', 'Cotton combed 24s', 145000, array['S', 'M', 'L', 'XL'], true, 6, '/rak/kaos-kuning-depan.webp', '/rak/kaos-kuning-samping.webp'),
  ('kaos-sand', 'Sand', 'oversize', 'Potongan oversize, warna pasir.', 'Cotton combed 20s', 155000, array['S', 'M', 'L', 'XL'], true, 7, '/rak/kaos-sand-depan.webp', '/rak/kaos-sand-samping.webp'),
  ('kaos-charcoal', 'Charcoal', 'graphic', 'Abu gelap dengan sablon kecil di dada.', 'Cotton combed 24s', 145000, array['S', 'M', 'L', 'XL'], true, 8, '/rak/kaos-charcoal-depan.webp', '/rak/kaos-charcoal-samping.webp'),
  ('kaos-maroon', 'Basic Maroon', 'basic', 'Kaos polos merah marun, potongan reguler.', 'Cotton combed 30s', 125000, array['S', 'M', 'L', 'XL'], true, 9, '/rak/kaos-maroon-depan.webp', '/rak/kaos-maroon-samping.webp'),
  ('kaos-grape', 'Grape', 'graphic', 'Ungu tua dengan sablon punggung.', 'Cotton combed 24s', 145000, array['S', 'M', 'L', 'XL'], true, 10, '/rak/kaos-grape-depan.webp', '/rak/kaos-grape-samping.webp'),
  ('kaos-rust', 'Rust', 'oversize', 'Potongan oversize, warna karat.', 'Cotton combed 20s', 155000, array['S', 'M', 'L', 'XL'], true, 11, '/rak/kaos-rust-depan.webp', '/rak/kaos-rust-samping.webp');

-- ============ jadikan akunmu admin ============
-- 1. Supabase > Authentication > Users > Add user (email + password, centang Auto Confirm).
-- 2. Ganti email di bawah lalu jalankan:
-- insert into public.admins (user_id) select id from auth.users where email = 'EMAIL_ADMIN@contoh.com';
