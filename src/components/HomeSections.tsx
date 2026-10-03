import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Phone, Facebook, Instagram, Music2, Truck, ShieldCheck, Zap } from 'lucide-react';
import { Product, Settings, formatMVR, waLink, viberLink, SALE_CAMPAIGNS } from '@/lib/gigatron';
import ProductCard from '@/components/ProductCard';
import ProductArtwork from '@/components/ProductArtwork';

const HERO_PRODUCT_FALLBACKS = [
  { name: 'Velocity Run Pro', image: '/images/products/velocity-run-pro.png' },
  { name: 'Courtline Street', image: '/images/products/courtline-street.png' },
  { name: 'Club Match Football', image: '/images/products/club-match-football.png' },
  { name: 'Aeroflex Training Jacket', image: '/images/products/aeroflex-training-jacket.png' },
];

export function Hero({ s, products = [] }: { s: Settings; products?: Product[] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const slides = useMemo(() => {
    const catalogSlides = products
      .filter((product) => product.images?.[0])
      .slice(0, 4)
      .map((product) => ({ name: product.name, image: product.images![0], handle: product.handle }));

    return catalogSlides.length >= 2 ? catalogSlides : HERO_PRODUCT_FALLBACKS;
  }, [products]);

  useEffect(() => setActiveSlide(0), [slides]);

  useEffect(() => {
    if (carouselPaused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 4000);
    return () => window.clearInterval(timer);
  }, [carouselPaused, slides.length]);

  return (
    <section className="relative min-h-[620px] lg:min-h-[680px] bg-[#111] overflow-hidden flex items-center">
      <img src={s.hero_image} alt="Performance footwear from Gigatron Sports" className="absolute inset-0 h-full w-full object-cover object-[64%_center]" />
      <div className="absolute inset-0 bg-black/65 lg:bg-gradient-to-r lg:from-black lg:via-black/90 lg:to-black/45" />
      <div className="absolute inset-0 hex-grid opacity-10" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.75fr)]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#FFC21C]">
              Gigatron Sports <span className="h-px w-10 bg-[#FFC21C]" />
            </span>
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[-0.055em] text-white leading-[0.9]">
              {s.hero_title}
            </h1>
            <p className="mt-7 text-white/70 text-base sm:text-lg max-w-xl leading-relaxed">{s.hero_subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={s.hero_cta_url || '/products'} className="inline-flex items-center gap-2 bg-[#FFC21C] text-[#111] font-extrabold px-7 py-4 rounded-full hover:bg-white transition">
                {s.hero_cta_text} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to={s.hero_secondary_cta_url || '/products?new=true'} className="inline-flex items-center gap-2 border border-white/35 text-white font-bold px-7 py-4 rounded-full hover:border-white transition">
                {s.hero_secondary_cta_text || 'Latest Drops'}
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-6 text-white/55 text-[10px] font-bold uppercase tracking-[0.16em]">
              <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#FFC21C]" /> Delivery available</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#FFC21C]" /> Genuine products</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#FFC21C]" /> Ready to move</span>
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-[460px]"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
          >
            <div className="absolute -inset-8 rounded-full bg-[#FFC21C]/15 blur-3xl" aria-hidden="true" />
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 shadow-2xl backdrop-blur-sm">
              {slides.map((slide, index) => {
                const image = <img src={slide.image} alt={slide.name} className="h-full w-full object-cover" />;
                return (
                  <div
                    key={`${slide.name}-${slide.image}`}
                    className={`absolute inset-0 transition-all duration-700 ease-out ${index === activeSlide ? 'scale-100 opacity-100' : 'pointer-events-none scale-105 opacity-0'}`}
                    aria-hidden={index !== activeSlide}
                  >
                    {'handle' in slide && slide.handle ? <Link to={`/products/${slide.handle}`} tabIndex={index === activeSlide ? 0 : -1}>{image}</Link> : image}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-6 pt-16">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFC21C]">Featured product</p>
                      <p className="mt-1 text-xl font-black text-white">{slide.name}</p>
                    </div>
                  </div>
                );
              })}
              <div className="absolute right-5 top-5 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
                {String(activeSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </div>
            </div>
            <div className="relative mt-5 flex items-center justify-center gap-2" aria-label="Choose featured product">
              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show ${slide.name}`}
                  aria-current={index === activeSlide}
                  className={`h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-9 bg-[#FFC21C]' : 'w-3 bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryTabs({ categories, active, onSelect }: { categories: { handle: string; title: string }[]; active: string; onSelect: (h: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {[{ handle: 'all', title: 'All' }, ...categories].map((c) => (
        <button key={c.handle} onClick={() => onSelect(c.handle)} className={`shrink-0 px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-extrabold transition-colors ${active === c.handle ? 'bg-[#FFC21C] text-[#171717]' : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-900'}`}>
          {c.title}
        </button>
      ))}
    </div>
  );
}

export function SaleHub({ s }: { s: Settings }) {
  const sales = SALE_CAMPAIGNS
    .filter((sale) => s[`sale_${sale.id}_enabled`] !== 'false')
    .sort((a, b) => Number(s[`sale_${a.id}_order`] || 99) - Number(s[`sale_${b.id}_order`] || 99));

  if (!sales.length) return null;

  return (
    <section className="bg-[#FFC21C] border-y border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black/55">{s.sales_eyebrow}</span>
            <h2 className="mt-1.5 text-3xl sm:text-5xl font-black tracking-[-0.045em] text-[#111]">{s.sales_title}</h2>
          </div>
          <p className="text-sm font-semibold text-black/60">Fresh ways to save, all in one place.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {sales.map((sale, index) => (
            <Link
              key={sale.id}
              to={s[`sale_${sale.id}_url`] || `/products?sale=${sale.id}`}
              className={`group relative min-h-36 sm:min-h-40 rounded-2xl p-5 sm:p-6 overflow-hidden border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${index === 0 ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#111] border-black/10'}`}
            >
              <span className="text-3xl sm:text-4xl" aria-hidden="true">{s[`sale_${sale.id}_emoji`] || sale.emoji}</span>
              <h3 className="mt-5 text-lg sm:text-xl font-black tracking-tight leading-tight">{s[`sale_${sale.id}_label`] || sale.label}</h3>
              <span className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${index === 0 ? 'text-[#FFC21C]' : 'text-black/50 group-hover:text-black'}`}>Shop now <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /></span>
              <span className={`absolute -right-6 -bottom-8 h-24 w-24 rounded-full ${index === 0 ? 'bg-[#FFC21C]/20' : 'bg-[#FFC21C]/35'}`} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { label: string; to: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-7">
      <div>{eyebrow && <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B78600]">{eyebrow}</span>}<h2 className="mt-1.5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.04em] text-neutral-950">{title}</h2></div>
      {action && <Link to={action.to} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:text-[#B78600] shrink-0">{action.label} <ArrowRight className="w-4 h-4" /></Link>}
    </div>
  );
}

export function LatestDrops({ products }: { products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * 340, behavior: 'smooth' });
  if (!products.length) return null;
  return (
    <section className="bg-[#111] text-white py-14 sm:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div><span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFC21C]">Just landed</span><h2 className="mt-1 text-3xl sm:text-5xl font-black tracking-[-0.04em]">LATEST DROPS</h2></div>
          <div className="hidden sm:flex gap-2"><button onClick={() => move(-1)} aria-label="Previous products" className="h-11 w-11 rounded-full border border-white/20 grid place-items-center hover:bg-[#FFC21C] hover:text-black"><ArrowLeft className="w-4 h-4" /></button><button onClick={() => move(1)} aria-label="Next products" className="h-11 w-11 rounded-full border border-white/20 grid place-items-center hover:bg-[#FFC21C] hover:text-black"><ArrowRight className="w-4 h-4" /></button></div>
        </div>
        <div ref={rail} className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mr-4 sm:-mr-6 lg:-mr-[max(1.5rem,calc((100vw-80rem)/2))] scrollbar-hide">
          {products.map((p) => <Link key={p.id} to={`/products/${p.handle}`} className="group snap-start shrink-0 w-[78vw] max-w-[330px]"><div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#222]">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-500" /> : <ProductArtwork product={p} className="transition duration-500 group-hover:scale-105" />}<span className="absolute left-4 top-4 bg-[#FFC21C] text-black text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full">New</span></div><p className="mt-4 text-[10px] text-white/45 uppercase tracking-[0.2em] font-bold">{p.vendor || 'Gigatron Sports'}</p><h3 className="mt-1 font-bold text-lg">{p.name}</h3><p className="mt-1 text-[#FFC21C] font-black">{formatMVR(p.price)}</p></Link>)}
        </div>
      </div>
    </section>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <div className="py-16 text-center text-neutral-500">No products found yet.</div>;
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>;
}

export function SportsPromo() {
  return <section className="relative rounded-[2rem] overflow-hidden bg-[#171717] text-white p-8 sm:p-12 lg:p-16"><div className="absolute inset-0 hex-grid opacity-20" /><div className="absolute -right-20 -bottom-32 h-80 w-80 rounded-full bg-[#FFC21C]/25 blur-3xl" /><div className="relative max-w-xl"><span className="text-[#FFC21C] text-[11px] font-bold uppercase tracking-[0.22em]">Performance meets style</span><h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-[-0.045em] leading-[0.95]">GEAR UP. SHOW UP.</h2><p className="mt-5 text-white/65 leading-relaxed">From first rep to final whistle, discover essentials built for movement, comfort and everyday confidence.</p><Link to="/products" className="mt-7 inline-flex items-center gap-2 bg-[#FFC21C] text-black rounded-full px-7 py-4 font-extrabold">Explore Products <ArrowRight className="w-4 h-4" /></Link></div></section>;
}

export function LocationSection({ s }: { s: Settings }) {
  return <section className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 grid md:grid-cols-2 gap-10"><div><span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B78600]">Visit the showroom</span><h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">FIND YOUR NEXT MOVE</h2><p className="mt-4 text-neutral-600 flex items-start gap-2"><MapPin className="w-5 h-5 text-[#B78600] shrink-0 mt-0.5" /> {s.address}</p><p className="mt-2 text-neutral-600 flex items-center gap-2"><Phone className="w-5 h-5 text-[#B78600] shrink-0" /> {s.phone}</p><div className="mt-7 flex flex-wrap gap-3"><a href={waLink(s.whatsapp, 'Hello Gigatron Sports, I would like to make an enquiry.')} target="_blank" rel="noopener noreferrer" className="bg-[#171717] text-white font-bold px-6 py-3.5 rounded-full hover:bg-[#FFC21C] hover:text-black">WhatsApp</a><a href={viberLink(s.viber)} className="border border-neutral-300 font-bold px-6 py-3.5 rounded-full">Viber</a><a href={s.google_maps_url} target="_blank" rel="noopener noreferrer" className="border border-neutral-300 font-bold px-6 py-3.5 rounded-full">Get Directions</a></div><div className="flex gap-3 mt-7">{[{ href: s.facebook_url, Icon: Facebook, label: 'Facebook' }, { href: s.instagram_url, Icon: Instagram, label: 'Instagram' }, { href: s.tiktok_url, Icon: Music2, label: 'TikTok' }].map(({href,Icon,label}) => <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="h-11 w-11 grid place-items-center rounded-full bg-neutral-100 hover:bg-[#FFC21C]"><Icon className="w-5 h-5" /></a>)}</div></div><div className="rounded-2xl bg-[#FFC21C] p-8 flex flex-col justify-center"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/55">Delivery</p><p className="mt-3 text-2xl sm:text-3xl font-black text-black leading-tight">{s.delivery_message}</p><p className="mt-4 text-black/65 text-sm leading-relaxed">Order online or message us on WhatsApp. Delivery and island shipping remain available as configured by the store.</p></div></section>;
}

export function PriceTag({ cents }: { cents: number }) { return <span className="font-black tracking-tight">{formatMVR(cents)}</span>; }
