import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/gigatron';

export const PROMOTION_KINDS = [
  { id: 'daily_deals', label: 'Daily Deals', emoji: '🔥', eyebrow: 'Today only' },
  { id: 'bundle_save', label: 'Bundle & Save', emoji: '🎁', eyebrow: 'More for less' },
  { id: 'weekly_offers', label: "This Week's Offers", emoji: '⭐', eyebrow: 'Weekly picks' },
  { id: 'payday_sale', label: 'Payday Sale', emoji: '💰', eyebrow: 'Payday prices' },
  { id: 'flash_sale', label: 'Flash Sale', emoji: '⚡', eyebrow: 'Ending soon' },
  { id: 'clearance_sale', label: 'Clearance Sale', emoji: '🏷️', eyebrow: 'Final units' },
  { id: 'gaming_deals', label: 'Gaming Deals', emoji: '🎮', eyebrow: 'Level up' },
  { id: 'smartphone_deals', label: 'Smartphone Deals', emoji: '📱', eyebrow: 'Phone offers' },
  { id: 'creator_deals', label: 'Creator Deals', emoji: '🚁', eyebrow: 'Create more' },
  { id: 'ramadan_sale', label: 'Ramadan Sale', emoji: '🌙', eyebrow: 'Seasonal savings' },
  { id: 'eid_sale', label: 'Eid Sale', emoji: '🎉', eyebrow: 'Eid gifting' },
] as const;

export type PromotionKind = (typeof PROMOTION_KINDS)[number]['id'];

export interface PromotionItem {
  promotion_id: string;
  product_id: string;
  offer_price: number | null;
  stock_label: string | null;
  sort_order: number;
  product: Product;
}

export interface Promotion {
  id: string;
  title: string;
  slug: string;
  kind: PromotionKind;
  description: string | null;
  label: string | null;
  banner_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  countdown_enabled: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  sort_order: number;
  bundle_price: number | null;
  items: PromotionItem[];
}

export function promotionKind(kind: string) {
  return PROMOTION_KINDS.find((entry) => entry.id === kind) || PROMOTION_KINDS[0];
}

export function isPromotionLive(promotion: Promotion, now = Date.now()) {
  if (!promotion.is_active) return false;
  if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) return false;
  if (promotion.ends_at && new Date(promotion.ends_at).getTime() <= now) return false;
  return true;
}

export function promotionStatus(promotion: Promotion, now = Date.now()) {
  if (!promotion.is_active) return 'Inactive';
  if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) return 'Scheduled';
  if (promotion.ends_at && new Date(promotion.ends_at).getTime() <= now) return 'Ended';
  return 'Live';
}

export function savings(original: number, offer: number) {
  const amount = Math.max(0, original - offer);
  return { amount, percent: original > 0 ? Math.round((amount / original) * 100) : 0 };
}

export function bundleOriginalPrice(promotion: Promotion) {
  return promotion.items.reduce((sum, item) => sum + (item.product?.price || 0), 0);
}

export async function fetchPromotions(includeInactive = false): Promise<Promotion[]> {
  let query = supabase
    .from('promotions')
    .select('*, items:promotion_products(*, product:ecom_products(*, variants:ecom_product_variants(*)))')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) {
    console.warn('Promotions are unavailable:', error.message);
    return [];
  }
  return ((data || []) as unknown as Promotion[]).map((promotion) => ({
    ...promotion,
    items: (promotion.items || [])
      .filter((item) => item.product)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}
