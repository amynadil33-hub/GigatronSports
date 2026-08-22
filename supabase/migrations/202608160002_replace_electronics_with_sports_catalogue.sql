-- Replace the public electronics catalogue with a focused Gigatron Sports starter range.
-- Existing products are archived instead of deleted so historical order references remain valid.

alter table if exists public.ecom_collections
  add column if not exists position integer not null default 0;

insert into public.ecom_collections (title, handle, is_visible, position)
values
  ('Footwear', 'footwear', true, 10),
  ('Apparel', 'apparel', true, 20),
  ('Accessories', 'accessories', true, 30),
  ('Equipment', 'equipment', true, 40)
on conflict (handle) do update
set title = excluded.title, is_visible = true, position = excluded.position;

-- Remove every previous item from the public catalogue without breaking order history.
update public.ecom_products
set status = 'archived', updated_at = now()
where handle not in (
  'velocity-run-pro',
  'courtline-street',
  'aeroflex-training-jacket',
  'club-match-football'
);

insert into public.ecom_products
  (name, handle, description, price, sku, inventory_qty, images, status, has_variants, vendor, product_type, tags, metadata)
values
  (
    'Velocity Run Pro',
    'velocity-run-pro',
    'A lightweight daily running shoe with breathable engineered mesh, responsive cushioning and a stable heel platform.',
    189900,
    'GS-VRP-BLK',
    null,
    array['/images/products/velocity-run-pro.png'],
    'active', true, 'Gigatron Sports', 'Footwear',
    array['featured','new_arrival','free_delivery'],
    '{"Upper":"Engineered mesh","Cushioning":"Responsive foam","Use":"Road running and training","Colour":"Black / Warm White"}'::jsonb
  ),
  (
    'Courtline Street',
    'courtline-street',
    'A refined everyday sneaker combining breathable mesh, soft suede overlays and all-day cushioning.',
    169900,
    'GS-CLS-BONE',
    null,
    array['/images/products/courtline-street.png'],
    'active', true, 'Gigatron Sports', 'Footwear',
    array['featured','new_arrival'],
    '{"Upper":"Mesh and suede","Cushioning":"Comfort foam","Use":"Lifestyle and everyday wear","Colour":"Bone / Stone"}'::jsonb
  ),
  (
    'AeroFlex Training Jacket',
    'aeroflex-training-jacket',
    'A streamlined warm-up layer made with lightweight stretch fabric, secure zip pockets and breathable paneling.',
    129900,
    'GS-AFJ-BLK',
    null,
    array['/images/products/aeroflex-training-jacket.png'],
    'active', true, 'Gigatron Sports', 'Apparel',
    array['featured','new_arrival','free_delivery'],
    '{"Material":"Lightweight stretch woven","Fit":"Athletic","Features":"Full zip and secure pockets","Colour":"Black"}'::jsonb
  ),
  (
    'Club Match Football',
    'club-match-football',
    'A durable size-five training ball with textured panels for confident touch and consistent flight.',
    69900,
    'GS-CMF-S5',
    null,
    array['/images/products/club-match-football.png'],
    'active', false, 'Gigatron Sports', 'Equipment',
    array['featured','new_arrival'],
    '{"Size":"5","Construction":"Textured stitched panels","Use":"Training and recreational match play","Colour":"White / Black / Yellow"}'::jsonb
  )
on conflict (handle) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  sku = excluded.sku,
  inventory_qty = excluded.inventory_qty,
  images = excluded.images,
  status = excluded.status,
  has_variants = excluded.has_variants,
  vendor = excluded.vendor,
  product_type = excluded.product_type,
  tags = excluded.tags,
  metadata = excluded.metadata,
  updated_at = now();

-- Rebuild only the seeded products' category links.
delete from public.ecom_product_collections
where product_id in (
  select id from public.ecom_products
  where handle in ('velocity-run-pro','courtline-street','aeroflex-training-jacket','club-match-football')
);

insert into public.ecom_product_collections (product_id, collection_id, position)
select p.id, c.id, 0
from public.ecom_products p
join public.ecom_collections c on c.handle = case
  when p.handle in ('velocity-run-pro','courtline-street') then 'footwear'
  when p.handle = 'aeroflex-training-jacket' then 'apparel'
  when p.handle = 'club-match-football' then 'equipment'
end
where p.handle in ('velocity-run-pro','courtline-street','aeroflex-training-jacket','club-match-football')
on conflict do nothing;

-- Replace variants only for this starter range.
delete from public.ecom_product_variants
where product_id in (
  select id from public.ecom_products
  where handle in ('velocity-run-pro','courtline-street','aeroflex-training-jacket')
);

insert into public.ecom_product_variants
  (product_id, title, option1, sku, price, inventory_qty, position)
select p.id, v.title, v.title, v.sku, p.price, null, v.position
from public.ecom_products p
join (values
  ('velocity-run-pro','40 / Black','GS-VRP-40-BLK',0),
  ('velocity-run-pro','41 / Black','GS-VRP-41-BLK',1),
  ('velocity-run-pro','42 / Black','GS-VRP-42-BLK',2),
  ('velocity-run-pro','43 / Black','GS-VRP-43-BLK',3),
  ('velocity-run-pro','44 / Black','GS-VRP-44-BLK',4),
  ('courtline-street','39 / Bone','GS-CLS-39-BONE',0),
  ('courtline-street','40 / Bone','GS-CLS-40-BONE',1),
  ('courtline-street','41 / Bone','GS-CLS-41-BONE',2),
  ('courtline-street','42 / Bone','GS-CLS-42-BONE',3),
  ('courtline-street','43 / Bone','GS-CLS-43-BONE',4),
  ('aeroflex-training-jacket','S / Black','GS-AFJ-S-BLK',0),
  ('aeroflex-training-jacket','M / Black','GS-AFJ-M-BLK',1),
  ('aeroflex-training-jacket','L / Black','GS-AFJ-L-BLK',2),
  ('aeroflex-training-jacket','XL / Black','GS-AFJ-XL-BLK',3)
) as v(handle, title, sku, position) on v.handle = p.handle;

-- Starter filter definitions and options. These stay fully editable in Admin > Products > Filters.
insert into public.product_filters (name, slug, sort_order, is_active)
values
  ('Brand','brand',10,true),
  ('Sport','sport',20,true),
  ('Colour','colour',30,true),
  ('Size','size',40,true)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_active = true;

insert into public.product_filter_options (filter_id, label, value, sort_order, is_active)
select f.id, o.label, o.value, o.sort_order, true
from public.product_filters f
join (values
  ('brand','Gigatron Sports','gigatron-sports',10),
  ('sport','Running','running',10),
  ('sport','Lifestyle','lifestyle',20),
  ('sport','Training','training',30),
  ('sport','Football','football',40),
  ('colour','Black','black',10),
  ('colour','Bone','bone',20),
  ('colour','White','white',30),
  ('size','39','39',10), ('size','40','40',20), ('size','41','41',30),
  ('size','42','42',40), ('size','43','43',50), ('size','44','44',60),
  ('size','S','s',70), ('size','M','m',80), ('size','L','l',90), ('size','XL','xl',100),
  ('size','5','5',110)
) as o(filter_slug, label, value, sort_order) on o.filter_slug = f.slug
on conflict (filter_id, value) do update set label = excluded.label, sort_order = excluded.sort_order, is_active = true;

delete from public.product_filter_values
where product_id in (
  select id from public.ecom_products
  where handle in ('velocity-run-pro','courtline-street','aeroflex-training-jacket','club-match-football')
);

insert into public.product_filter_values (product_id, option_id)
select distinct p.id, o.id
from public.ecom_products p
join public.product_filter_options o on o.value = any(case p.handle
  when 'velocity-run-pro' then array['gigatron-sports','running','black','40','41','42','43','44']
  when 'courtline-street' then array['gigatron-sports','lifestyle','bone','39','40','41','42','43']
  when 'aeroflex-training-jacket' then array['gigatron-sports','training','black','s','m','l','xl']
  when 'club-match-football' then array['gigatron-sports','football','white','5']
end)
where p.handle in ('velocity-run-pro','courtline-street','aeroflex-training-jacket','club-match-football')
on conflict do nothing;
