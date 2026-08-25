-- Final security layer. This migration intentionally runs after catalogue migrations.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.ecom_products enable row level security;
alter table public.ecom_product_variants enable row level security;
alter table public.ecom_product_options enable row level security;
alter table public.ecom_collections enable row level security;
alter table public.ecom_product_collections enable row level security;
alter table public.ecom_customers enable row level security;
alter table public.ecom_orders enable row level security;
alter table public.ecom_order_items enable row level security;
alter table public.contact_enquiries enable row level security;

do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public' and tablename in (
             'admin_users','site_settings','ecom_products','ecom_product_variants','ecom_product_options',
             'ecom_collections','ecom_product_collections','ecom_customers','ecom_orders','ecom_order_items',
             'contact_enquiries','product_filters','product_filter_options','product_filter_values'
           )
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

create policy "Public reads settings" on public.site_settings for select using (true);
create policy "Admins manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads active products" on public.ecom_products for select using (status = 'active');
create policy "Admins manage products" on public.ecom_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads active variants" on public.ecom_product_variants for select using (
  exists (select 1 from public.ecom_products p where p.id = product_id and p.status = 'active')
);
create policy "Admins manage variants" on public.ecom_product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads active options" on public.ecom_product_options for select using (
  exists (select 1 from public.ecom_products p where p.id = product_id and p.status = 'active')
);
create policy "Admins manage options" on public.ecom_product_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads visible collections" on public.ecom_collections for select using (is_visible);
create policy "Admins manage collections" on public.ecom_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads catalogue links" on public.ecom_product_collections for select using (
  exists (select 1 from public.ecom_products p where p.id = product_id and p.status = 'active')
);
create policy "Admins manage catalogue links" on public.ecom_product_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads active filters" on public.product_filters for select using (is_active);
create policy "Admins manage filters" on public.product_filters for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads active filter options" on public.product_filter_options for select using (
  is_active and exists (select 1 from public.product_filters f where f.id = filter_id and f.is_active)
);
create policy "Admins manage filter options" on public.product_filter_options for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads product filter values" on public.product_filter_values for select using (
  exists (select 1 from public.ecom_products p where p.id = product_id and p.status = 'active')
);
create policy "Admins manage product filter values" on public.product_filter_values for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins read own admin record" on public.admin_users for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage customers" on public.ecom_customers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage orders" on public.ecom_orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage order items" on public.ecom_order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Anyone can send an enquiry" on public.contact_enquiries for insert to anon, authenticated with check (
  length(trim(name)) between 1 and 120 and length(trim(message)) between 1 and 4000
);
create policy "Admins manage enquiries" on public.contact_enquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins upload product images" on storage.objects;
drop policy if exists "Admins update product images" on storage.objects;
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

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
  v_variant_id uuid;
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

    insert into public.ecom_order_items(order_id, product_id, variant_id, product_name, variant_title, sku, quantity, unit_price, total)
    values (v_order_id, v_product.id, v_variant_id, v_product.name,
      case when v_variant_id is null then null else coalesce(v_variant.option1, v_variant.title) end,
      case when v_variant_id is null then v_product.sku else v_variant.sku end,
      v_quantity, v_price, v_price * v_quantity);
    v_subtotal := v_subtotal + (v_price * v_quantity);
  end loop;

  update public.ecom_orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;
  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'public_token', v_public_token, 'total', v_subtotal);
exception when others then
  raise;
end;
$$;

create or replace function public.get_order(p_order_id uuid, p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'public_token' - 'customer_id',
    'items', coalesce((select jsonb_agg(to_jsonb(i) - 'order_id') from public.ecom_order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.ecom_orders o where o.id = p_order_id and o.public_token = p_token;
$$;

revoke all on function public.place_order(jsonb, jsonb, text) from public;
revoke all on function public.get_order(uuid, uuid) from public;
grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;
grant execute on function public.get_order(uuid, uuid) to anon, authenticated;

-- Run this from the SQL editor after creating the first Auth user:
-- insert into public.admin_users(user_id, display_name)
-- select id, 'Gigatron Administrator' from auth.users where lower(email) = lower('admin@example.com');
