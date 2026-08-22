-- Gigatron Sports: non-destructive catalogue filters and category ordering.
create extension if not exists pgcrypto;

alter table if exists public.ecom_collections
  add column if not exists position integer not null default 0;

create table if not exists public.product_filters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  display_type text not null default 'checkbox' check (display_type in ('checkbox', 'swatch')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_filter_options (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid not null references public.product_filters(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (filter_id, value)
);

create table if not exists public.product_filter_values (
  product_id uuid not null references public.ecom_products(id) on delete cascade,
  option_id uuid not null references public.product_filter_options(id) on delete cascade,
  primary key (product_id, option_id)
);

create index if not exists product_filter_options_filter_idx on public.product_filter_options(filter_id, sort_order);
create index if not exists product_filter_values_option_idx on public.product_filter_values(option_id, product_id);

create or replace function public.set_product_filter_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_product_filters_updated_at on public.product_filters;
create trigger set_product_filters_updated_at before update on public.product_filters
for each row execute function public.set_product_filter_updated_at();

alter table public.product_filters enable row level security;
alter table public.product_filter_options enable row level security;
alter table public.product_filter_values enable row level security;

drop policy if exists "Public reads active filters" on public.product_filters;
create policy "Public reads active filters" on public.product_filters for select using (is_active);
drop policy if exists "Public reads active filter options" on public.product_filter_options;
create policy "Public reads active filter options" on public.product_filter_options for select using (
  is_active and exists (select 1 from public.product_filters f where f.id = filter_id and f.is_active)
);
drop policy if exists "Public reads visible product filter values" on public.product_filter_values;
create policy "Public reads visible product filter values" on public.product_filter_values for select using (
  exists (select 1 from public.ecom_products p where p.id = product_id and p.status = 'active')
);

drop policy if exists "Authenticated manages filters" on public.product_filters;
create policy "Authenticated manages filters" on public.product_filters for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated manages filter options" on public.product_filter_options;
create policy "Authenticated manages filter options" on public.product_filter_options for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated manages product filter values" on public.product_filter_values;
create policy "Authenticated manages product filter values" on public.product_filter_values for all to authenticated using (true) with check (true);

-- Starter sports categories. Existing categories and catalogue links remain untouched.
insert into public.ecom_collections (title, handle, is_visible, position)
values
  ('Footwear', 'footwear', true, 10),
  ('Apparel', 'apparel', true, 20),
  ('Accessories', 'accessories', true, 30),
  ('Equipment', 'equipment', true, 40)
on conflict (handle) do nothing;
