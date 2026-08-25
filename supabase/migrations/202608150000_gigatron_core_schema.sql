-- Core schema required by the Gigatron Sports storefront.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.ecom_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text not null unique,
  description text,
  price integer not null default 0 check (price >= 0),
  sku text,
  inventory_qty integer,
  images text[] not null default '{}',
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  has_variants boolean not null default false,
  vendor text,
  product_type text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecom_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.ecom_products(id) on delete cascade,
  title text not null,
  sku text,
  price integer not null default 0 check (price >= 0),
  inventory_qty integer,
  option1 text,
  option2 text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ecom_product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.ecom_products(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  values text[] not null default '{}'
);

create table if not exists public.ecom_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique,
  is_visible boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ecom_product_collections (
  product_id uuid not null references public.ecom_products(id) on delete cascade,
  collection_id uuid not null references public.ecom_collections(id) on delete cascade,
  position integer not null default 0,
  primary key (product_id, collection_id)
);

create table if not exists public.ecom_customers (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ecom_orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.ecom_customers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','paid','shipped','delivered','cancelled','refunded')),
  subtotal integer not null default 0,
  tax integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  notes text,
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecom_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ecom_orders(id) on delete cascade,
  product_id uuid references public.ecom_products(id) on delete set null,
  variant_id uuid references public.ecom_product_variants(id) on delete set null,
  product_name text not null,
  variant_title text,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total integer not null check (total >= 0)
);

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  reason text not null default 'General Enquiry',
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists products_status_created_idx on public.ecom_products(status, created_at desc);
create index if not exists variants_product_idx on public.ecom_product_variants(product_id, position);
create index if not exists orders_created_idx on public.ecom_orders(created_at desc);
create index if not exists order_items_order_idx on public.ecom_order_items(order_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into public.site_settings (key, value) values
  ('business_name','Gigatron Sports'),
  ('tagline','Built for every move.'),
  ('phone','+960 7964444'),
  ('whatsapp','9607964444'),
  ('viber','9607964444'),
  ('email','info@gigatron.mv'),
  ('address','Maafanu, Majeedhee Magu, Male, Maldives'),
  ('currency','MVR'),
  ('delivery_message','Free delivery across Male'),
  ('hero_title','ELEVATE YOUR GAME.'),
  ('hero_enabled','true'),
  ('section_latest_drops','true'),
  ('section_promotion','true')
on conflict (key) do nothing;
