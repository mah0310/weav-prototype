-- Supabase SQL Editor で実行してください

-- memories テーブル
create table public.memories (
  id uuid default gen_random_uuid() primary key,
  photo_url text,
  caption text default '',
  lat double precision not null default 35.6895,
  lng double precision not null default 139.6917,
  area text default '',
  weather text default 'sunny' check (weather in ('sunny', 'cloudy', 'rainy')),
  temp integer default 15,
  color text default '#F9A8B8',
  grad text default 'linear-gradient(135deg,#F9A8B8,#F48CA0)',
  created_at timestamptz default now() not null
);

-- RLS: 誰でも読み書き可（後で認証を追加する場合はここを変更）
alter table public.memories enable row level security;

create policy "public_read" on public.memories for select using (true);
create policy "public_insert" on public.memories for insert with check (true);

-- Storage: 写真用バケット
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict do nothing;

create policy "public_photo_upload" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "public_photo_read" on storage.objects
  for select using (bucket_id = 'photos');
