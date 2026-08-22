import { Product } from '@/lib/gigatron';

type ShoeRow = [name: string, handle: string, vendor: string, colour: string, soleType: string, cut: string, priceMvr: number, sku: string];

const rows: ShoeRow[] = [
  ['Adidas F50 Elite', 'adidas-f50-elite-violet-turf', 'Adidas', 'Violet', 'Turf', 'High Cut', 1549, 'GS-ADI-F50E-VIO-TF'],
  ['Adidas F50 Hyperfast', 'adidas-f50-hyperfast-yellow-green-turf', 'Adidas', 'Yellow & Green', 'Turf', 'Low Cut', 1749, 'GS-ADI-F50H-YGR-TF'],
  ['Adidas F50 Hyperfast League', 'adidas-f50-hyperfast-league-pink-full-ground', 'Adidas', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-ADI-F50HL-PNK-FG'],
  ['Adidas Predator (Elite Tongue x Kaka)', 'adidas-predator-elite-tongue-kaka-purple-full-ground', 'Adidas', 'Purple', 'Full Ground', 'Low Cut', 2249, 'GS-ADI-PREK-PUR-FG'],
  ['Adidas Predator 26 Elite', 'adidas-predator-26-elite-red-white-turf', 'Adidas', 'Red & White', 'Turf', 'Low Cut', 1749, 'GS-ADI-P26E-RWH-TF'],
  ['Adidas Predator 26 Elite (Foldover Tongue)', 'adidas-predator-26-elite-foldover-peach-red-turf', 'Adidas', 'Peach & Red', 'Turf', 'Low Cut', 1749, 'GS-ADI-P26F-PRD-TF'],
  ['Adidas Predator 26 Elite (Foldover Tongue)', 'adidas-predator-26-elite-foldover-white-turf', 'Adidas', 'White', 'Turf', 'Low Cut', 1749, 'GS-ADI-P26F-WHT-TF'],
  ['Adidas F50 Elite Mid Lamine Yamal Heartbreaker (No Lace)', 'adidas-f50-elite-mid-lamine-yamal-heartbreaker-no-lace', 'Adidas', 'White & Red', 'Turf', 'High Cut', 1749, 'GS-ADI-F50Y-NL-WR'],
  ['Adidas F50 Elite Mid Lamine Yamal Heartbreaker (With Lace)', 'adidas-f50-elite-mid-lamine-yamal-heartbreaker-with-lace', 'Adidas', 'White & Red', 'Turf', 'Low Cut', 1749, 'GS-ADI-F50Y-WL-WR'],
  ['Nike Air Zoom Mercurial Superfly 11', 'nike-air-zoom-mercurial-superfly-11-pink-full-ground', 'Nike', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-NIK-SF11-PNK-FG'],
  ['Nike Air Zoom Mercurial 10 Elite (Air Max 95 Neon)', 'nike-air-zoom-mercurial-10-elite-air-max-95-neon', 'Nike', 'Black & White & Green', 'Turf', 'High Cut', 1649, 'GS-NIK-M10-AM95-TF'],
  ['Nike Air Zoom Mercurial Superfly 10 Elite', 'nike-air-zoom-mercurial-superfly-10-elite-black-white-silver', 'Nike', 'Black & White & Silver', 'Turf', 'High Cut', 1749, 'GS-NIK-SF10-BWS-TF'],
  ['Puma Future 8 Ultimate', 'puma-future-8-ultimate-blue-white-pink', 'Puma', 'Blue & White & Pink', 'Turf', 'High Cut', 1649, 'GS-PUM-F8U-BWP-TF'],
  ['Nike Air Zoom Mercurial Superfly 10 Elite (Dior)', 'nike-air-zoom-mercurial-superfly-10-elite-dior-white', 'Nike', 'White', 'Turf', 'High Cut', 1549, 'GS-NIK-SF10-DIO-TF'],
  ['Nike Air Zoom Mercurial Superfly 11 Elite', 'nike-air-zoom-mercurial-superfly-11-elite-black-blue-white', 'Nike', 'Black & Blue & White', 'Turf', 'Low Cut', 1749, 'GS-NIK-SF11-BBW-TF'],
  ['Nike Air Zoom Mercurial Superfly 11 Elite', 'nike-air-zoom-mercurial-superfly-11-elite-white-red-gold', 'Nike', 'White & Red & Gold', 'Turf', 'Low Cut', 1749, 'GS-NIK-SF11-WRG-TF'],
  ['Nike Air Zoom Mercurial Superfly 11 Elite (T90)', 'nike-air-zoom-mercurial-superfly-11-elite-t90-white-maroon', 'Nike', 'White & Maroon', 'Turf', 'High Cut', 1549, 'GS-NIK-SF11-T90-TF'],
  ['Nike Air Zoom Mercurial Vapor 16 Elite', 'nike-air-zoom-mercurial-vapor-16-elite-blue-white-silver', 'Nike', 'Blue & White & Silver', 'Turf', 'High Cut', 1649, 'GS-NIK-V16E-BWS-TF'],
  ['Nike Air Zoom Mercurial Vapor 17 Elite', 'nike-air-zoom-mercurial-vapor-17-elite-pink-full-ground', 'Nike', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-NIK-V17E-PNK-FG'],
  ['Nike Air Zoom Mercurial Vapor 17 Elite', 'nike-air-zoom-mercurial-vapor-17-elite-pink-white-turf', 'Nike', 'Pink & White', 'Turf', 'Low Cut', 1749, 'GS-NIK-V17E-PWH-TF'],
  ['Nike Air Zoom Mercurial Vapor 17 Elite', 'nike-air-zoom-mercurial-vapor-17-elite-green-white-turf', 'Nike', 'Green & White', 'Turf', 'Low Cut', 1749, 'GS-NIK-V17E-GWH-TF'],
  ['Nike Phantom 6 High Elite', 'nike-phantom-6-high-elite-pink-full-ground', 'Nike', 'Pink', 'Full Ground', 'Low Cut', 2249, 'GS-NIK-P6HE-PNK-FG'],
  ['Nike Phantom 6 High Elite', 'nike-phantom-6-high-elite-pink-turf', 'Nike', 'Pink', 'Turf', 'High Cut', 1749, 'GS-NIK-P6HE-PNK-TF'],
  ['Nike Phantom 6 High Elite', 'nike-phantom-6-high-elite-green-orange-turf', 'Nike', 'Green & Orange', 'Turf', 'High Cut', 1749, 'GS-NIK-P6HE-GOR-TF'],
];

export const TEMPORARY_SHOE_CATALOGUE: Product[] = rows.map(
  ([name, handle, vendor, colour, soleType, cut, priceMvr, sku], index) => ({
    id: `temporary-shoe-${String(index + 1).padStart(2, '0')}`,
    name,
    handle,
    vendor,
    description: `${name} football boots in ${colour.toLowerCase()}, with a ${cut.toLowerCase()} profile and ${soleType.toLowerCase()} sole configuration.`,
    price: priceMvr * 100,
    sku,
    inventory_qty: null,
    images: [],
    status: 'active',
    has_variants: false,
    product_type: 'Footwear',
    tags: ['sports', 'featured', 'new_arrival', 'free_delivery'],
    metadata: {
      Category: 'Football Boots',
      Colour: colour,
      'Sole Type': soleType,
      Cut: cut,
      Catalogue: 'Gigatron shoes - Sheet1',
      'Catalogue Order': index + 1,
    },
  }),
);

/** Database products take precedence while the supplied shoe list fills undeployed previews. */
export function mergeTemporaryShoeCatalogue(databaseProducts: Product[]): Product[] {
  const byHandle = new Map(databaseProducts.map((product) => [product.handle, product]));
  const catalogueHandles = new Set(TEMPORARY_SHOE_CATALOGUE.map((product) => product.handle));
  return [
    ...TEMPORARY_SHOE_CATALOGUE.map((product) => byHandle.get(product.handle) || product),
    ...databaseProducts.filter((product) => !catalogueHandles.has(product.handle)),
  ];
}
