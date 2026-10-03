-- Admin-managed campaigns, product offers and bundles.
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  slug text not null unique,
  kind text not null check (kind in (
    'daily_deals','bundle_save','weekly_offers','payday_sale','flash_sale',
    'clearance_sale','gaming_deals','smartphone_deals','creator_deals',
    'ramadan_sale','eid_sale'
  )),
  description text,
  label text,
  banner_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  countdown_enabled boolean not null default false,
  is_active boolean not null default true,
  show_on_homepage boolean not null default true,
  sort_order integer not null default 0,
  bundle_price integer check (bundle_price is null or bundle_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.ecom_products(id) on delete cascade,
  offer_price integer check (offer_price is null or offer_price >= 0),
  stock_label text,
  sort_order integer not null default 0,
  primary key (promotion_id, product_id)
);

create index if not exists promotions_public_idx
  on public.promotions(is_active, show_on_homepage, sort_order, starts_at, ends_at);
create index if not exists promotion_products_product_idx
  on public.promotion_products(product_id, promotion_id);

drop trigger if exists set_promotions_updated_at on public.promotions;
create trigger set_promotions_updated_at before update on public.promotions
for each row execute function public.set_product_filter_updated_at();

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;

drop policy if exists "Public reads live promotions" on public.promotions;
create policy "Public reads live promotions" on public.promotions for select using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);
drop policy if exists "Admins manage promotions" on public.promotions;
create policy "Admins manage promotions" on public.promotions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads live promotion products" on public.promotion_products;
create policy "Public reads live promotion products" on public.promotion_products for select using (
  exists (
    select 1 from public.promotions p
    where p.id = promotion_id
      and p.is_active
      and (p.starts_at is null or p.starts_at <= now())
      and (p.ends_at is null or p.ends_at > now())
  )
);
drop policy if exists "Admins manage promotion products" on public.promotion_products;
create policy "Admins manage promotion products" on public.promotion_products for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Promotional prices are calculated server-side. A stale client can never force a discount.
create or replace function public.place_order(p_customer jsonb, p_items jsonb, p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_public_token uuid := gen_random_uuid();
  v_order_number text := 'GT-' || to_char(clock_timestamp(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_item jsonb;
  v_product public.ecom_products%rowtype;
  v_variant public.ecom_product_variants%rowtype;
  v_quantity integer;
  v_price integer;
  v_offer_price integer;
  v_variant_id uuid;
  v_promotion_id uuid;
  v_subtotal integer := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Your cart is empty or too large.';
  end if;
  if length(trim(coalesce(p_customer->>'name',''))) not between 1 and 120
     or length(trim(coalesce(p_customer->>'mobile',''))) not between 5 and 40
     or length(trim(coalesce(p_customer->>'address',''))) not between 3 and 500 then
    raise exception 'Valid name, mobile number and address are required.';
  end if;

  insert into public.ecom_customers(email, name, phone)
  values (nullif(trim(p_customer->>'email'),''), trim(p_customer->>'name'), trim(p_customer->>'mobile'))
  returning id into v_customer_id;

  insert into public.ecom_orders(id, public_token, order_number, customer_id, status, shipping_address, notes)
  values (v_order_id, v_public_token, v_order_number, v_customer_id, 'pending', p_customer, left(coalesce(p_notes,''), 1000));

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 1)));
    select * into v_product from public.ecom_products where id = (v_item->>'product_id')::uuid and status = 'active';
    if not found then raise exception 'A product in your cart is no longer available.'; end if;

    v_variant_id := nullif(v_item->>'variant_id','')::uuid;
    if v_variant_id is not null then
      select * into v_variant from public.ecom_product_variants where id = v_variant_id and product_id = v_product.id;
      if not found then raise exception 'A selected product option is no longer available.'; end if;
      if v_variant.inventory_qty is not null and v_variant.inventory_qty < v_quantity then raise exception 'Not enough stock for %.', v_product.name; end if;
      v_price := v_variant.price;
    else
      if v_product.has_variants then raise exception 'Please select an option for %.', v_product.name; end if;
      if v_product.inventory_qty is not null and v_product.inventory_qty < v_quantity then raise exception 'Not enough stock for %.', v_product.name; end if;
      v_price := v_product.price;
    end if;

    v_promotion_id := nullif(v_item->>'promotion_id','')::uuid;
    v_offer_price := null;
    if v_promotion_id is not null then
      select pp.offer_price into v_offer_price
      from public.promotion_products pp
      join public.promotions pr on pr.id = pp.promotion_id
      where pp.promotion_id = v_promotion_id
        and pp.product_id = v_product.id
        and pr.is_active
        and (pr.starts_at is null or pr.starts_at <= now())
        and (pr.ends_at is null or pr.ends_at > now())
        and (
          pr.kind <> 'bundle_save'
          or not exists (
            select 1 from public.promotion_products required
            where required.promotion_id = pr.id
              and not exists (
                select 1 from jsonb_array_elements(p_items) cart_item
                where nullif(cart_item->>'promotion_id','')::uuid = pr.id
                  and nullif(cart_item->>'product_id','')::uuid = required.product_id
              )
          )
        );
      if v_offer_price is not null then v_price := least(v_price, v_offer_price); end if;
    end if;

    insert into public.ecom_order_items(order_id, product_id, variant_id, product_name, variant_title, sku, quantity, unit_price, total)
    values (v_order_id, v_product.id, v_variant_id, v_product.name,
      case when v_variant_id is null then null else coalesce(v_variant.option1, v_variant.title) end,
      case when v_variant_id is null then v_product.sku else v_variant.sku end,
      v_quantity, v_price, v_price * v_quantity);
    v_subtotal := v_subtotal + (v_price * v_quantity);
  end loop;

  update public.ecom_orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;
  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'public_token', v_public_token, 'total', v_subtotal);
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text) from public;
grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;
