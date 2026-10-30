-- ============================================================
-- Presupuestos por categoría (v4.8.0)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
create table if not exists presupuestos (
  categoria_id uuid primary key references categorias(id) on delete cascade,
  limite numeric(10,2) not null check (limite > 0),
  created_at timestamptz default now()
);

alter table presupuestos enable row level security;

drop policy if exists "presupuestos_solo_admin" on presupuestos;
create policy "presupuestos_solo_admin" on presupuestos
  for all using (auth.jwt() ->> 'email' = 'rbcheca@gmail.com')
  with check (auth.jwt() ->> 'email' = 'rbcheca@gmail.com');
