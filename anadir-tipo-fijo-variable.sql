-- ============================================================
-- Tipo fijo / variable en los gastos (v5.1.0)
-- Ejecutar en el SQL Editor de Supabase. No borra nada.
-- ============================================================
alter table gastos add column if not exists tipo text not null default 'variable'
  check (tipo in ('fijo', 'variable'));

alter table gastos_fijos add column if not exists cuenta_como_variable boolean not null default false;

-- Lo que ya sale de la lista de gastos fijos pasa a ser "fijo"
update gastos set tipo = 'fijo' where origen = 'fijo';
