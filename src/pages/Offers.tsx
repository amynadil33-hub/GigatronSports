import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { BundleCard, Countdown, OfferPeriod, OfferProductCard, PromotionEmptyState } from '@/components/Promotions';
import { fetchPromotions, isPromotionLive, Promotion, promotionKind } from '@/lib/promotions';

export default function Offers() {
  const { slug } = useParams<{ slug?: string }>();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchPromotions().then((rows) => { setPromotions(rows.filter((row) => isPromotionLive(row))); setLoading(false); }); }, []);
  const promotion = useMemo(() => slug ? promotions.find((row) => row.slug === slug) : null, [promotions, slug]);

  if (loading) return <Layout><div className="mx-auto max-w-7xl px-4 py-20"><div className="h-72 animate-pulse rounded-3xl bg-neutral-200" /></div></Layout>;
  if (slug && !promotion) return <Layout><div className="mx-auto max-w-4xl px-4 py-20"><PromotionEmptyState /></div></Layout>;

  if (promotion) {
    const kind = promotionKind(promotion.kind);
    return <Layout><section className="relative overflow-hidden bg-[#111] text-white"><div className="absolute inset-0 hex-grid opacity-20" />{promotion.banner_url && <img src={promotion.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}<div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" /><div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><span className="text-sm font-black uppercase tracking-widest text-[#FFC21C]">{kind.emoji} {promotion.label || kind.label}</span><h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-7xl">{promotion.title}</h1><p className="mt-5 max-w-2xl text-lg text-white/65">{promotion.description}</p><div className="mt-7"><OfferPeriod promotion={promotion} /></div>{promotion.countdown_enabled && promotion.ends_at && <div className="mt-7"><Countdown endsAt={promotion.ends_at} /></div>}</div></section><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">{promotion.kind === 'bundle_save' ? <BundleCard promotion={promotion} /> : <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{promotion.items.map((item) => <OfferProductCard key={item.product_id} item={item} promotion={promotion} />)}</div>}</main></Layout>;
  }

  return <Layout><section className="bg-[#111] text-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><span className="text-sm font-black uppercase tracking-widest text-[#FFC21C]">Gigatron promotions</span><h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl">OFFERS WORTH MOVING FOR.</h1><p className="mt-5 max-w-2xl text-lg text-white/60">Daily deals, bundles, flash prices and seasonal campaigns—active offers are collected here.</p></div></section><main className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">{promotions.length ? promotions.map((row) => <Link key={row.id} to={`/offers/${row.slug}`} className="group flex flex-col justify-between gap-6 rounded-3xl border bg-white p-6 transition hover:border-[#FFC21C] hover:shadow-lg sm:flex-row sm:items-center"><div><span className="text-sm font-black uppercase tracking-widest text-[#B78600]">{promotionKind(row.kind).emoji} {promotionKind(row.kind).label}</span><h2 className="mt-2 text-2xl font-black">{row.title}</h2><p className="mt-2 max-w-2xl text-neutral-500">{row.description}</p><div className="mt-3"><OfferPeriod promotion={row} /></div></div>{row.countdown_enabled && row.ends_at && <Countdown endsAt={row.ends_at} compact />}</Link>) : <PromotionEmptyState />}</main></Layout>;
}
