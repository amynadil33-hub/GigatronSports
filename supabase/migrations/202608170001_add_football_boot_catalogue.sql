-- Populate Gigatron Sports with the football-boot catalogue supplied on 2026-08-17.
-- Prices are stored in laari/cents (MVR x 100). Product photography can be added in Admin later.

update public.ecom_products
set status = 'archived', updated_at = now()
where handle in (
  'velocity-run-pro',
  'courtline-street',
  'aeroflex-training-jacket',
  'club-match-football'
);

with shoe_data(name, handle, vendor, colour, sole_type, cut, price_mvr, sku, catalogue_order) as (
  values
    ('Adidas F50 Elite', 'adidas-f50-elite-violet-turf', 'Adidas', 'Violet', 'Turf', 'High Cut', 1549, 'GS-ADI-F50E-VIO-TF', 1),
    ('Adidas F50 Hyperfast', 'adidas-f50-hyperfast-yellow-green-turf', 'Adidas', 'Yellow & Green', 'Turf', 'Low Cut', 1749, 'GS-ADI-F50H-YGR-TF', 2),
    ('Adidas F50 Hyperfast League', 'adidas-f50-hyperfast-league-pink-full-ground', 'Adidas', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-ADI-F50HL-PNK-FG', 3),
    ('Adidas Predator (Elite Tongue x Kaka)', 'adidas-predator-elite-tongue-kaka-purple-full-ground', 'Adidas', 'Purple', 'Full Ground', 'Low Cut', 2249, 'GS-ADI-PREK-PUR-FG', 4),
    ('Adidas Predator 26 Elite', 'adidas-predator-26-elite-red-white-turf', 'Adidas', 'Red & White', 'Turf', 'Low Cut', 1749, 'GS-ADI-P26E-RWH-TF', 5),
    ('Adidas Predator 26 Elite (Foldover Tongue)', 'adidas-predator-26-elite-foldover-peach-red-turf', 'Adidas', 'Peach & Red', 'Turf', 'Low Cut', 1749, 'GS-ADI-P26F-PRD-TF', 6),
    ('Adidas Predator 26 Elite (Foldover Tongue)', 'adidas-predator-26-elite-foldover-white-turf', 'Adidas', 'White', 'Turf', 'Low Cut', 1749, 'GS-ADI-P26F-WHT-TF', 7),
    ('Adidas F50 Elite Mid Lamine Yamal Heartbreaker (No Lace)', 'adidas-f50-elite-mid-lamine-yamal-heartbreaker-no-lace', 'Adidas', 'White & Red', 'Turf', 'High Cut', 1749, 'GS-ADI-F50Y-NL-WR', 8),
    ('Adidas F50 Elite Mid Lamine Yamal Heartbreaker (With Lace)', 'adidas-f50-elite-mid-lamine-yamal-heartbreaker-with-lace', 'Adidas', 'White & Red', 'Turf', 'Low Cut', 1749, 'GS-ADI-F50Y-WL-WR', 9),
    ('Nike Air Zoom Mercurial Superfly 11', 'nike-air-zoom-mercurial-superfly-11-pink-full-ground', 'Nike', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-NIK-SF11-PNK-FG', 10),
    ('Nike Air Zoom Mercurial 10 Elite (Air Max 95 Neon)', 'nike-air-zoom-mercurial-10-elite-air-max-95-neon', 'Nike', 'Black & White & Green', 'Turf', 'High Cut', 1649, 'GS-NIK-M10-AM95-TF', 11),
    ('Nike Air Zoom Mercurial Superfly 10 Elite', 'nike-air-zoom-mercurial-superfly-10-elite-black-white-silver', 'Nike', 'Black & White & Silver', 'Turf', 'High Cut', 1749, 'GS-NIK-SF10-BWS-TF', 12),
    ('Puma Future 8 Ultimate', 'puma-future-8-ultimate-blue-white-pink', 'Puma', 'Blue & White & Pink', 'Turf', 'High Cut', 1649, 'GS-PUM-F8U-BWP-TF', 13),
    ('Nike Air Zoom Mercurial Superfly 10 Elite (Dior)', 'nike-air-zoom-mercurial-superfly-10-elite-dior-white', 'Nike', 'White', 'Turf', 'High Cut', 1549, 'GS-NIK-SF10-DIO-TF', 14),
    ('Nike Air Zoom Mercurial Superfly 11 Elite', 'nike-air-zoom-mercurial-superfly-11-elite-black-blue-white', 'Nike', 'Black & Blue & White', 'Turf', 'Low Cut', 1749, 'GS-NIK-SF11-BBW-TF', 15),
    ('Nike Air Zoom Mercurial Superfly 11 Elite', 'nike-air-zoom-mercurial-superfly-11-elite-white-red-gold', 'Nike', 'White & Red & Gold', 'Turf', 'Low Cut', 1749, 'GS-NIK-SF11-WRG-TF', 16),
    ('Nike Air Zoom Mercurial Superfly 11 Elite (T90)', 'nike-air-zoom-mercurial-superfly-11-elite-t90-white-maroon', 'Nike', 'White & Maroon', 'Turf', 'High Cut', 1549, 'GS-NIK-SF11-T90-TF', 17),
    ('Nike Air Zoom Mercurial Vapor 16 Elite', 'nike-air-zoom-mercurial-vapor-16-elite-blue-white-silver', 'Nike', 'Blue & White & Silver', 'Turf', 'High Cut', 1649, 'GS-NIK-V16E-BWS-TF', 18),
    ('Nike Air Zoom Mercurial Vapor 17 Elite', 'nike-air-zoom-mercurial-vapor-17-elite-pink-full-ground', 'Nike', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-NIK-V17E-PNK-FG', 19),
    ('Nike Air Zoom Mercurial Vapor 17 Elite', 'nike-air-zoom-mercurial-vapor-17-elite-pink-white-turf', 'Nike', 'Pink & White', 'Turf', 'Low Cut', 1749, 'GS-NIK-V17E-PWH-TF', 20),
    ('Nike Air Zoom Mercurial Vapor 17 Elite', 'nike-air-zoom-mercurial-vapor-17-elite-green-white-turf', 'Nike', 'Green & White', 'Turf', 'Low Cut', 1749, 'GS-NIK-V17E-GWH-TF', 21),
    ('Nike Phantom 6 High Elite', 'nike-phantom-6-high-elite-pink-full-ground', 'Nike', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-NIK-P6HE-PNK-FG', 22),
    ('Nike Phantom 6 High Elite', 'nike-phantom-6-high-elite-pink-turf', 'Nike', 'Pink', 'Turf', 'High Cut', 1749, 'GS-NIK-P6HE-PNK-TF', 23),
    ('Nike Phantom 6 High Elite', 'nike-phantom-6-high-elite-green-orange-turf', 'Nike', 'Green & Orange', 'Turf', 'High Cut', 1749, 'GS-NIK-P6HE-GOR-TF', 24)
)
insert into public.ecom_products
  (name, handle, description, price, sku, inventory_qty, images, status, has_variants, vendor, product_type, tags, metadata)
select
  name,
  handle,
  name || ' football boots in ' || lower(colour) || ', with a ' || lower(cut) || ' profile and ' || lower(sole_type) || ' sole configuration.',
  price_mvr * 100,
  sku,
  null,
  array[]::text[],
  'active',
  false,
  vendor,
  'Footwear',
  array['sports', 'featured', 'new_arrival', 'free_delivery'],
  jsonb_build_object(
    'Category', 'Football Boots',
    'Colour', colour,
    'Sole Type', sole_type,
    'Cut', cut,
    'Catalogue', 'Gigatron shoes - Sheet1',
    'Catalogue Order', catalogue_order
  )
from shoe_data
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

delete from public.ecom_product_collections
where product_id in (
  select id from public.ecom_products
  where metadata->>'Catalogue' = 'Gigatron shoes - Sheet1'
);

insert into public.ecom_product_collections (product_id, collection_id, position)
select p.id, c.id, (p.metadata->>'Catalogue Order')::integer
from public.ecom_products p
join public.ecom_collections c on c.handle = 'footwear'
where p.metadata->>'Catalogue' = 'Gigatron shoes - Sheet1'
on conflict do nothing;

delete from public.ecom_product_variants
where product_id in (
  select id from public.ecom_products
  where metadata->>'Catalogue' = 'Gigatron shoes - Sheet1'
);

insert into public.product_filters (name, slug, sort_order, is_active)
values
  ('Brand', 'brand', 10, true),
  ('Sport', 'sport', 20, true),
  ('Colour', 'colour', 30, true),
  ('Sole Type', 'sole-type', 40, true),
  ('Cut', 'cut', 50, true)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.product_filter_options (filter_id, label, value, sort_order, is_active)
select f.id, o.label, o.value, o.sort_order, true
from public.product_filters f
join (values
  ('brand', 'Adidas', 'adidas', 10),
  ('brand', 'Nike', 'nike', 20),
  ('brand', 'Puma', 'puma', 30),
  ('sport', 'Football', 'football', 10),
  ('colour', 'Black', 'black', 10),
  ('colour', 'Blue', 'blue', 20),
  ('colour', 'Gold', 'gold', 30),
  ('colour', 'Green', 'green', 40),
  ('colour', 'Maroon', 'maroon', 50),
  ('colour', 'Orange', 'orange', 60),
  ('colour', 'Peach', 'peach', 70),
  ('colour', 'Pink', 'pink', 80),
  ('colour', 'Purple', 'purple', 90),
  ('colour', 'Red', 'red', 100),
  ('colour', 'Silver', 'silver', 110),
  ('colour', 'Violet', 'violet', 120),
  ('colour', 'White', 'white', 130),
  ('colour', 'Yellow', 'yellow', 140),
  ('sole-type', 'Turf', 'turf', 10),
  ('sole-type', 'Full Ground', 'full-ground', 20),
  ('cut', 'High Cut', 'high-cut', 10),
  ('cut', 'Low Cut', 'low-cut', 20)
) as o(filter_slug, label, value, sort_order) on o.filter_slug = f.slug
on conflict (filter_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true;

delete from public.product_filter_values
where product_id in (
  select id from public.ecom_products
  where metadata->>'Catalogue' = 'Gigatron shoes - Sheet1'
);

insert into public.product_filter_values (product_id, option_id)
select distinct p.id, o.id
from public.ecom_products p
join public.product_filter_options o on (
  (o.value = lower(p.vendor) and o.filter_id = (select id from public.product_filters where slug = 'brand'))
  or (o.value = 'football' and o.filter_id = (select id from public.product_filters where slug = 'sport'))
  or (o.value = lower(replace(p.metadata->>'Sole Type', ' ', '-')) and o.filter_id = (select id from public.product_filters where slug = 'sole-type'))
  or (o.value = lower(replace(p.metadata->>'Cut', ' ', '-')) and o.filter_id = (select id from public.product_filters where slug = 'cut'))
  or (lower(p.metadata->>'Colour') like '%' || o.value || '%' and o.filter_id = (select id from public.product_filters where slug = 'colour'))
)
where p.metadata->>'Catalogue' = 'Gigatron shoes - Sheet1'
on conflict do nothing;
