// Single source of truth for Gigatron brand data, formatting helpers and types.
import { supabase } from '@/lib/supabase';

export const GIGATRON_LOGO =
  'https://d64gsuwffb70l.cloudfront.net/697762a54522891b330bb592_1786211337023_1a605699.jpeg';

export const DEFAULT_SETTINGS: Record<string, string> = {
  business_name: 'Gigatron Sports',
  tagline: 'Built for every move.',
  phone: '+960 7964444',
  whatsapp: '9607964444',
  viber: '9607964444',
  email: 'info@gigatron.mv',
  address: 'Maafanu, Majeedhee Magu, Malé, Maldives',
  google_maps_url: 'https://share.google/pJ0IUKCUMIJsiH0Mp',
  facebook_url: 'https://www.facebook.com/p/GigaTron-Maldives-61570513895892/',
  instagram_url: 'https://www.instagram.com/gigatron_maldives/?hl=en',
  tiktok_url: 'https://www.tiktok.com/@gigatron_maldives',
  currency: 'MVR',
  delivery_message: 'Free delivery across Malé',
  hero_title: 'ELEVATE YOUR GAME.',
  hero_subtitle:
    'Premium sportswear, footwear and gear for every move. Discover the latest styles and performance essentials from Gigatron Sports.',
  hero_image: '/images/gigatron-sports-hero.png',
  hero_cta_text: 'Shop Now',
  hero_cta_url: '/products',
  hero_enabled: 'true',
  section_hot_sale: 'true',
  section_new_arrivals: 'true',
  hero_secondary_cta_text: 'Latest Drops',
  hero_secondary_cta_url: '/products?new=true',
  section_latest_drops: 'true',
  section_promotion: 'true',
};

export type Settings = Record<string, string>;

export async function fetchSettings(): Promise<Settings> {
  try {
    const { data } = await supabase.from('site_settings').select('key,value');
    const map: Settings = { ...DEFAULT_SETTINGS };
    const legacyBrandValues = new Set(['Gigatron Maldives', 'Empowering Your Digital Lifestyle', 'EMPOWER YOUR DIGITAL LIFESTYLE']);
    const sportsBrandKeys = new Set(['business_name', 'tagline', 'hero_title', 'hero_subtitle']);
    (data || []).forEach((row: any) => {
      const value = String(row.value ?? '').trim();
      const isLegacyTechnologyCopy = sportsBrandKeys.has(row.key) && /gigatron maldives|digital lifestyle|smartphones?|laptops?|electronics?|technology|cameras?|drones?/i.test(value);
      if (value && !legacyBrandValues.has(value) && !isLegacyTechnologyCopy) map[row.key] = value;
    });
    return map;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Prices are stored in cents. Display as MVR 3,999 */
export function formatMVR(cents: number | null | undefined): string {
  const value = (cents || 0) / 100;
  return `MVR ${value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function waLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function viberLink(phone: string) {
  return `viber://chat?number=%2B${phone.replace(/\D/g, '')}`;
}

export interface Variant {
  id: string;
  product_id: string;
  title: string;
  sku?: string | null;
  price: number;
  inventory_qty?: number | null;
  option1?: string | null;
  option2?: string | null;
  position?: number | null;
}

export interface Product {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  price: number;
  sku?: string | null;
  inventory_qty?: number | null;
  images?: string[] | null;
  status?: string;
  has_variants?: boolean;
  vendor?: string | null;
  product_type?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, any> | null;
  variants?: Variant[];
}

export interface ProductFilterOption {
  id: string;
  filter_id: string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductFilterDefinition {
  id: string;
  name: string;
  slug: string;
  display_type: string;
  sort_order: number;
  is_active: boolean;
  options: ProductFilterOption[];
}

export const PRODUCT_SELECT = '*, variants:ecom_product_variants(*)';

const SPORTS_PRODUCT_TYPES = new Set(['footwear', 'shoes', 'apparel', 'accessories', 'equipment', 'sportswear']);

/** Prevent legacy electronics rows from leaking into the sports storefront. */
export function isSportsProduct(product: Product): boolean {
  const type = String(product.product_type || '').trim().toLowerCase();
  const vendor = String(product.vendor || '').trim().toLowerCase();
  return SPORTS_PRODUCT_TYPES.has(type) || vendor === 'gigatron sports' || (product.tags || []).includes('sports');
}

export function productBadges(p: Product) {
  const tags = p.tags || [];
  return {
    isNew: tags.includes('new_arrival'),
    isHot: tags.includes('hot_sale'),
    freeDelivery: tags.includes('free_delivery'),
    isFeatured: tags.includes('featured'),
  };
}

export function inStockOf(p: Product): boolean {
  if (p.variants && p.variants.length > 0)
    return p.variants.some((v) => v.inventory_qty == null || v.inventory_qty > 0);
  if (p.has_variants) return true;
  if (p.inventory_qty == null) return true;
  return p.inventory_qty > 0;
}

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'New',
  paid: 'Confirmed',
  shipped: 'Out for Delivery',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash / Pay on Delivery' },
  { id: 'bank_transfer', label: 'Bank Transfer (BML)' },
  { id: 'bml_islamic', label: 'BML Islamic' },
  { id: 'card', label: 'Card Payment' },
];

export const CRM_SUBSCRIBE_URL =
  'https://famous.ai/api/crm/6a776d2299c46518de171ddd/subscribe';

export async function crmSubscribe(payload: {
  email: string;
  name?: string;
  phone?: string;
  sms_opt_in?: boolean;
  source: string;
  tags?: string[];
}) {
  try {
    await fetch(CRM_SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    /* non-blocking */
  }
}
