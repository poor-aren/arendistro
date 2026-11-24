-- Tambahan 24 Nov 2026: stok per ukuran. Jalankan sekali di SQL Editor.
alter table public.products add column if not exists habis text[] not null default '{}';
