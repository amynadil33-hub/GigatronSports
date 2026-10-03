import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, PackageOpen, ShoppingBag } from 'lucide-react';
import { formatMVR, inStockOf, Product } from '@/lib/gigatron';
import { bundleOriginalPrice, Promotion, PromotionItem, promotionKind, savings } from '@/lib/promotions';
import { useCart } from '@/contexts/CartContext';
import ProductArtwork from '@/components/ProductArtwork';

export function Countdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  if (!remaining) return <span className="font-bold">Offer ended</span>;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining / 3600000) % 24);
  const minutes = Math.floor((remaining / 60000) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  const values = days ? [[days, 'Days'], [hours, 'Hrs'], [minutes, 'Min']] : [[hours, 'Hrs'], [minutes, 'Min'], [seconds, 'Sec']];
  return (
    <div className="flex items-center gap-1.5" aria-label={`Offer ends in ${days} days ${hours} hours ${minutes} minutes`}>
      {values.map(([value, label]) => (
        <span key={label} className={`${compact ? 'min-w-11 px-1.5 py-1' : 'min-w-14 px-2 py-2'} rounded-lg bg-black/85 text-center text-white`}>
          <strong className="block text-sm leading-none tabular-nums">{String(value).padStart(2, '0')}</strong>
          <small className="mt-1 block text-[9px] uppercase tracking-wider text-white/60">{label}</small>
        </span>
      ))}
    </div>
  );
}

function productBasePrice(product: Product) {
  return product.has_variants && product.variants?.[0]?.price ? product.variants[0].price : product.price;
}

export function OfferProductCard({ item, promotion }: { item: PromotionItem; promotion: Promotion }) {
  const { addToCart } = useCart();
  const product = item.product;
  const original = productBasePrice(product);
  const offer = item.offer_price != null ? Math.min(item.offer_price, original) : original;
  const saved = savings(original, offer);
  const stock = inStockOf(product);
  const variant = product.variants?.[0];
  const image = product.images?.[0];
  const add = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!stock) return;
    addToCart({
      product_id: product.id,
      variant_id: product.has_variants ? variant?.id : undefined,
      promotion_id: promotion.id,
      handle: product.handle,
      name: product.name,
      variant_title: product.has_variants ? variant?.title : undefined,
      sku: variant?.sku || product.sku || product.handle,
      price: offer,
      original_price: saved.amount ? original : undefined,
      promotion_label: promotion.label || promotion.title,
      image,
    });
  };
  const automaticStockLabel = product.inventory_qty != null && product.inventory_qty > 0 && product.inventory_qty <= 5
    ? `Only ${product.inventory_qty} left`
    : null;

  return (
    <Link to={`/products/${product.handle}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square bg-[#f6f6f4] p-5">
        {image ? <img src={image} alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" /> : <ProductArtwork product={product} className="rounded-xl" />}
        <span className="absolute left-3 top-3 rounded-full bg-[#FF1717] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">{promotion.label || promotionKind(promotion.kind).label}</span>
        {(item.stock_label || automaticStockLabel) && <span className="absolute bottom-3 left-3 rounded-md bg-black/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{item.stock_label || automaticStockLabel}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{product.vendor || product.product_type || 'Gigatron'}</p>
        <h3 className="mt-1 min-h-[2.8rem] font-bold leading-snug text-neutral-900">{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {saved.amount > 0 && <p className="text-xs text-neutral-400 line-through">{formatMVR(original)}</p>}
            <p className="text-xl font-black text-[#D80F0F]">{formatMVR(offer)}</p>
            {saved.amount > 0 && <p className="mt-0.5 text-xs font-bold text-emerald-700">Save {formatMVR(saved.amount)} ({saved.percent}%)</p>}
          </div>
          <button onClick={add} disabled={!stock} aria-label={`Add ${product.name} offer to cart`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#171717] text-[#FFC21C] hover:bg-[#FFC21C] hover:text-black disabled:opacity-30"><ShoppingBag className="h-4 w-4" /></button>
        </div>
      </div>
    </Link>
  );
}

export function BundleCard({ promotion }: { promotion: Promotion }) {
  const { addToCart } = useCart();
  const original = bundleOriginalPrice(promotion);
  const offer = promotion.bundle_price ?? original;
  const saved = savings(original, offer);
  const canBuy = promotion.items.length > 0 && promotion.items.every((item) => inStockOf(item.product));
  const addBundle = () => {
    if (!canBuy) return;
    promotion.items.forEach((item) => {
      const product = item.product;
      const variant = product.variants?.find((value) => value.inventory_qty == null || value.inventory_qty > 0) || product.variants?.[0];
      addToCart({
        product_id: product.id,
        variant_id: product.has_variants ? variant?.id : undefined,
        promotion_id: promotion.id,
        handle: product.handle,
        name: product.name,
        variant_title: product.has_variants ? variant?.title : undefined,
        sku: variant?.sku || product.sku || product.handle,
        price: item.offer_price ?? productBasePrice(product),
        original_price: productBasePrice(product),
        promotion_label: promotion.title,
        image: product.images?.[0],
      });
    });
  };
  return (
    <div className="group grid overflow-hidden rounded-3xl bg-[#171717] text-white md:grid-cols-[1.2fr_1fr]">
      <div className="relative min-h-64 overflow-hidden bg-[#252525]">
        {promotion.banner_url ? <img src={promotion.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105" /> : <div className="absolute inset-0 hex-grid opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/65" />
        <div className="relative flex h-full items-end gap-2 p-6">
          {promotion.items.slice(0, 3).map((item) => item.product.images?.[0] && <div key={item.product_id} className="h-24 flex-1 rounded-xl bg-white/95 p-2"><img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-contain" /></div>)}
        </div>
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-9">
        <span className="text-sm font-black uppercase tracking-widest text-[#FFC21C]">{promotion.label || 'Bundle & Save'}</span>
        <h3 className="mt-3 text-3xl font-black tracking-tight">{promotion.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{promotion.description || `${promotion.items.length} products in one special-price bundle.`}</p>
        <div className="mt-5 flex items-end gap-3"><span className="text-sm text-white/40 line-through">{formatMVR(original)}</span><strong className="text-3xl text-[#FFC21C]">{formatMVR(offer)}</strong></div>
        {saved.amount > 0 && <p className="mt-1 text-sm font-bold text-emerald-400">You save {formatMVR(saved.amount)} ({saved.percent}%)</p>}
        <div className="mt-6 flex flex-wrap gap-3"><button onClick={addBundle} disabled={!canBuy} className="inline-flex items-center gap-2 rounded-full bg-[#FFC21C] px-5 py-3 font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag className="h-4 w-4" /> {canBuy ? 'Add bundle' : 'Bundle unavailable'}</button><Link to={`/offers/${promotion.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 font-bold">View details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></div>
      </div>
    </div>
  );
}

export function PromotionSection({ promotion, anchor }: { promotion: Promotion; anchor?: string }) {
  const kind = promotionKind(promotion.kind);
  if (!promotion.items.length) return null;
  if (promotion.kind === 'bundle_save') return <section id={anchor} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"><BundleCard promotion={promotion} /></section>;
  return (
    <section id={anchor} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {promotion.banner_url && <div className="relative mb-8 min-h-56 overflow-hidden rounded-3xl bg-black"><img src={promotion.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" /><div className="relative max-w-2xl p-7 text-white sm:p-10"><span className="text-sm font-black uppercase tracking-widest text-[#FFC21C]">{promotion.label || kind.eyebrow}</span><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{promotion.title}</h2><p className="mt-3 text-white/70">{promotion.description}</p>{promotion.countdown_enabled && promotion.ends_at && <div className="mt-6"><Countdown endsAt={promotion.ends_at} /></div>}</div></div>}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>{!promotion.banner_url && <><span className="text-sm font-black uppercase tracking-widest text-[#B78600]">{kind.emoji} {promotion.label || kind.eyebrow}</span><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{promotion.title}</h2><p className="mt-2 max-w-2xl text-neutral-500">{promotion.description}</p></>}</div>
        <div className="flex shrink-0 items-center gap-4">{promotion.countdown_enabled && promotion.ends_at && !promotion.banner_url && <Countdown endsAt={promotion.ends_at} compact />}<Link to={`/offers/${promotion.slug}`} className="inline-flex items-center gap-2 text-sm font-bold">View all <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{promotion.items.slice(0, 4).map((item) => <OfferProductCard key={item.product_id} item={item} promotion={promotion} />)}</div>
    </section>
  );
}

export function TaggedProductSection({ title, eyebrow, products }: { title: string; eyebrow: string; products: Product[] }) {
  const items = products.slice(0, 4);
  if (!items.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"><div className="mb-7"><span className="text-sm font-black uppercase tracking-widest text-[#B78600]">{eyebrow}</span><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2></div><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{items.map((product) => <Link key={product.id} to={`/products/${product.handle}`} className="rounded-2xl border bg-white p-4 font-bold"><div className="aspect-square rounded-xl bg-neutral-50 p-4">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" /> : <ProductArtwork product={product} />}</div><p className="mt-3 line-clamp-2">{product.name}</p><p className="mt-2 text-lg font-black">{formatMVR(product.price)}</p></Link>)}</div></section>;
}

export function PromotionEmptyState() {
  return <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center"><PackageOpen className="mx-auto h-10 w-10 text-neutral-300" /><h2 className="mt-4 text-xl font-black">No offers are live right now</h2><p className="mt-2 text-neutral-500">Check back soon for the next Gigatron deal.</p><Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FFC21C] px-6 py-3 font-bold">Browse products <ArrowRight className="h-4 w-4" /></Link></div>;
}

export function OfferPeriod({ promotion }: { promotion: Promotion }) {
  const value = useMemo(() => {
    if (!promotion.starts_at && !promotion.ends_at) return 'Available while stocks last';
    const fmt = (date: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
    if (promotion.starts_at && promotion.ends_at) return `${fmt(promotion.starts_at)} – ${fmt(promotion.ends_at)}`;
    if (promotion.ends_at) return `Ends ${fmt(promotion.ends_at)}`;
    return `Starts ${fmt(promotion.starts_at!)}`;
  }, [promotion]);
  return <p className="inline-flex items-center gap-2 text-sm text-neutral-500"><Clock3 className="h-4 w-4" /> {value}</p>;
}
