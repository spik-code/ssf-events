-- Owner app: quotations + bills (one table), expenses, push subscriptions. Admin-only.

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('quotation','invoice')),
  number        text not null unique,
  client_name   text not null,
  client_phone  text,
  event_date    date,
  venue         text,
  items         jsonb not null default '[]',  -- [{desc, qty, rate}]
  discount      numeric(12,2) not null default 0,
  paid          numeric(12,2) not null default 0, -- received so far (invoices)
  notes         text,
  inquiry_id    uuid references public.inquiries(id) on delete set null,
  booking_id    uuid references public.bookings(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists documents_kind_idx on public.documents (kind, created_at desc);

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete set null,
  label       text not null,
  vendor      text,
  amount      numeric(12,2) not null check (amount >= 0),
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  endpoint      text primary key,
  subscription  jsonb not null,
  created_at    timestamptz not null default now()
);

alter table public.documents          enable row level security;
alter table public.expenses           enable row level security;
alter table public.push_subscriptions enable row level security;

create policy documents_admin_all on public.documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy expenses_admin_all on public.expenses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy push_admin_all on public.push_subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
