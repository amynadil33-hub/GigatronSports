import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Settings, DEFAULT_SETTINGS, fetchSettings, PRODUCT_SELECT } from '@/lib/gigatron';
import Layout from '@/components/Layout';
import { Hero, CategoryTabs, SectionHeading, ProductGrid, LatestDrops, SportsPromo, LocationSection } from '@/components/HomeSections';
import { mergeTemporaryShoeCatalogue } from '@/data/shoeCatalogue';
import { fetchPromotions, isPromotionLive, Promotion, PromotionKind } from '@/lib/promotions';
import { PromotionSection, TaggedProductSection } from '@/components/Promotions';

export default function AppLayout() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ handle: string; title: string }[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [catMap, setCatMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetchSettings().then(setSettings);
    fetchPromotions().then((rows) => setPromotions(rows.filter((promotion) => isPromotionLive(promotion) && promotion.show_on_homepage)));
    (async () => {
      const [{ data: prods }, { data: cols }, { data: links }] = await Promise.all([
        supabase.from('ecom_products').select(PRODUCT_SELECT).eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('ecom_collections').select('id,title,handle').eq('is_visible', true).order('title', { ascending: true }),
        supabase.from('ecom_product_collections').select('product_id,collection_id'),
      ]);
      const catalogueProducts = mergeTemporaryShoeCatalogue((prods as Product[]) || []);
      setProducts(catalogueProducts);
      const productIds = new Set(catalogueProducts.map((product) => product.id));
      const map: Record<string, string[]> = {};
      (cols || []).forEach((c: any) => { map[c.handle] = (links || []).filter((l: any) => l.collection_id === c.id && productIds.has(l.product_id)).map((l: any) => l.product_id); });
      map.footwear = Array.from(new Set([...(map.footwear || []), ...catalogueProducts.filter((product) => product.product_type?.toLowerCase() === 'footwear').map((product) => product.id)]));
      setCatMap(map);
      const visibleCategories = (cols || []).filter((c: any) => (map[c.handle] || []).length).map((c: any) => ({ handle: c.handle, title: c.title }));
      setCategories(visibleCategories.some((category) => category.handle === 'footwear') ? visibleCategories : [{ handle: 'footwear', title: 'Footwear' }, ...visibleCategories]);
      setLoading(false);
    })();
  }, []);

  const catFiltered = useMemo(() => activeCat === 'all' ? products : products.filter((p) => (catMap[activeCat] || []).includes(p.id)), [products, activeCat, catMap]);
  const featured = catFiltered.filter((p) => (p.tags || []).includes('featured'));
  const showcase = (featured.length ? featured : catFiltered).slice(0, 12);
  const latest = useMemo(() => {
    const drops = products.filter((p) => (p.tags || []).includes('new_arrival'));
    const footwearIds = new Set(Object.entries(catMap).filter(([h]) => /footwear|shoe|sneaker/i.test(h)).flatMap(([, ids]) => ids));
    return [...drops].sort((a, b) => Number(footwearIds.has(b.id)) - Number(footwearIds.has(a.id)));
  }, [products, catMap]);
  const bestSellers = useMemo(() => products.filter((product) => (product.tags || []).includes('best_seller')), [products]);
  const promotionSections = (kind: PromotionKind) => promotions.filter((promotion) => promotion.kind === kind).map((promotion) => <PromotionSection key={promotion.id} promotion={promotion} />);

  return <Layout>
    {settings.hero_enabled !== 'false' && <Hero s={settings} products={products} />}
    {promotionSections('daily_deals')}
    {promotionSections('bundle_save')}
    {promotionSections('weekly_offers')}
    {promotionSections('payday_sale')}
    {promotionSections('flash_sale')}
    {settings.section_latest_drops !== 'false' && <LatestDrops products={latest} />}
    <TaggedProductSection eyebrow="Customer favourites" title="BEST SELLERS" products={bestSellers} />
    {promotionSections('clearance_sale')}
    {promotionSections('gaming_deals')}
    {promotionSections('smartphone_deals')}
    {promotionSections('creator_deals')}
    {promotionSections('ramadan_sale')}
    {promotionSections('eid_sale')}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20"><SectionHeading eyebrow="Shop by category" title="FIND YOUR FIT" action={{ label: 'View all products', to: '/products' }} /><CategoryTabs categories={categories} active={activeCat} onSelect={setActiveCat} /><div className="mt-8">{loading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{Array.from({length:4}).map((_,i)=><div key={i} className="aspect-[3/4] rounded-2xl bg-white animate-pulse" />)}</div> : <ProductGrid products={showcase} />}</div></section>
    {settings.section_promotion !== 'false' && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20"><SportsPromo /></div>}
    <section className="bg-white border-y border-neutral-200"><div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 overflow-hidden"><div className="absolute right-0 top-0 w-1/2 h-full hex-grid opacity-15" /><div className="relative max-w-2xl"><span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B78600]">About Gigatron Sports</span><h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-[-0.045em] leading-[0.95]">BUILT FOR EVERY MOVE.</h2><p className="mt-6 text-neutral-600 leading-relaxed">Your destination for sports footwear, apparel, accessories and performance essentials—curated for movement, comfort and style.</p><Link to="/about" className="mt-7 inline-flex items-center gap-2 font-bold hover:text-[#B78600]">Our Story <ArrowRight className="w-4 h-4" /></Link></div></div></section>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20"><LocationSection s={settings} /></div>
  </Layout>;
}
