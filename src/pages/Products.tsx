import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, PRODUCT_SELECT, ProductFilterDefinition, isSportsProduct } from '@/lib/gigatron';
import Layout from '@/components/Layout';
import { CategoryTabs, ProductGrid } from '@/components/HomeSections';
import { mergeTemporaryShoeCatalogue } from '@/data/shoeCatalogue';

const PRODUCT_TYPE_FILTER_ID = 'built-in-product-type';
const PROMOTION_FILTER_ID = 'built-in-promotion';
const PROMOTION_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new_arrival', label: 'New Arrival' },
  { value: 'hot_sale', label: 'Hot Sale' },
];

const normalizedValue = (value?: string | null) => String(value || '').trim().toLowerCase();

export default function Products() {
  const [params, setParams] = useSearchParams();
  const { handle: routeHandle } = useParams<{ handle?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ handle: string; title: string }[]>([]);
  const [catMap, setCatMap] = useState<Record<string, string[]>>({});
  const [filters, setFilters] = useState<ProductFilterDefinition[]>([]);
  const [valueMap, setValueMap] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [activeCat, setActiveCat] = useState(routeHandle || params.get('category') || 'all');
  const [q, setQ] = useState(params.get('q') || '');
  const [sort, setSort] = useState('newest');
  const [visible, setVisible] = useState(12);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => { (async () => {
    const [p, c, l, f, v] = await Promise.all([
      supabase.from('ecom_products').select(PRODUCT_SELECT).eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('ecom_collections').select('id,title,handle').eq('is_visible', true).order('title'),
      supabase.from('ecom_product_collections').select('product_id,collection_id'),
      supabase.from('product_filters').select('*, options:product_filter_options(*)').eq('is_active', true).order('sort_order'),
      supabase.from('product_filter_values').select('product_id,option_id'),
    ]);
    const sportsProducts = mergeTemporaryShoeCatalogue(((p.data as Product[]) || []).filter(isSportsProduct));
    setProducts(sportsProducts);
    const sportsProductIds = new Set(sportsProducts.map((product) => product.id));
    const cm: Record<string,string[]> = {};
    (c.data || []).forEach((cat:any) => { cm[cat.handle] = (l.data || []).filter((x:any)=>x.collection_id===cat.id && sportsProductIds.has(x.product_id)).map((x:any)=>x.product_id); });
    cm.footwear = Array.from(new Set([...(cm.footwear || []), ...sportsProducts.filter((product)=>product.product_type?.toLowerCase()==='footwear').map((product)=>product.id)]));
    const visibleCategories = (c.data || []).filter((cat:any)=>(cm[cat.handle] || []).length && /footwear|shoe|apparel|accessor|equipment/i.test(cat.handle)).map((cat:any)=>({handle:cat.handle,title:cat.title}));
    setCatMap(cm); setCategories(visibleCategories.some((category)=>category.handle==='footwear')?visibleCategories:[{handle:'footwear',title:'Footwear'},...visibleCategories]);
    setFilters(((f.data || []) as any[]).map((x)=>({...x,options:(x.options||[]).filter((o:any)=>o.is_active).sort((a:any,b:any)=>a.sort_order-b.sort_order)})));
    const vm: Record<string,string[]> = {}; (v.data || []).forEach((x:any)=>{ vm[x.product_id] = [...(vm[x.product_id] || []), x.option_id]; });
    setValueMap(vm); setLoading(false);
  })(); }, []);

  const displayFilters = useMemo<ProductFilterDefinition[]>(() => {
    const productTypes = Array.from(
      new Map(
        products
          .filter((product) => product.product_type?.trim())
          .map((product) => [normalizedValue(product.product_type), product.product_type!.trim()])
      ).entries()
    )
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label], index) => ({
        id: value,
        filter_id: PRODUCT_TYPE_FILTER_ID,
        label,
        value,
        sort_order: index,
        is_active: true,
      }));

    const builtInFilters: ProductFilterDefinition[] = [];
    if (productTypes.length) {
      builtInFilters.push({
        id: PRODUCT_TYPE_FILTER_ID,
        name: 'Product Type',
        slug: 'product-type',
        display_type: 'checkbox',
        sort_order: -20,
        is_active: true,
        options: productTypes,
      });
    }
    builtInFilters.push({
      id: PROMOTION_FILTER_ID,
      name: 'Promotion',
      slug: 'promotion',
      display_type: 'checkbox',
      sort_order: -10,
      is_active: true,
      options: PROMOTION_OPTIONS.map((option, index) => ({
        id: option.value,
        filter_id: PROMOTION_FILTER_ID,
        label: option.label,
        value: option.value,
        sort_order: index,
        is_active: true,
      })),
    });
    return [...builtInFilters, ...filters];
  }, [filters, products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCat !== 'all') list = list.filter((p)=>(catMap[activeCat] || []).includes(p.id));
    const term = q.trim().toLowerCase();
    if (term) list = list.filter((p)=>[p.name,p.vendor,p.sku,p.description,p.product_type].filter(Boolean).some((v)=>String(v).toLowerCase().includes(term)));
    const selectedTypes = selected[PRODUCT_TYPE_FILTER_ID] || [];
    if (selectedTypes.length) list = list.filter((p)=>selectedTypes.includes(normalizedValue(p.product_type)));
    const selectedPromotions = selected[PROMOTION_FILTER_ID] || [];
    if (selectedPromotions.length) list = list.filter((p)=>selectedPromotions.some((tag)=>(p.tags || []).includes(tag)));
    const groups = Object.entries(selected)
      .filter(([filterId, ids]) => filterId !== PRODUCT_TYPE_FILTER_ID && filterId !== PROMOTION_FILTER_ID && ids.length)
      .map(([, ids]) => ids);
    if (groups.length) list = list.filter((p)=>groups.every((ids)=>ids.some((id)=>(valueMap[p.id] || []).includes(id))));
    if (params.get('new') === 'true') list = list.filter((p)=>(p.tags || []).includes('new_arrival'));
    if (sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
    if (sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
    return list;
  }, [products,activeCat,catMap,q,sort,selected,valueMap,params]);

  const toggle = (filterId:string, optionId:string) => { setSelected((s)=>{const ids=s[filterId]||[]; return {...s,[filterId]:ids.includes(optionId)?ids.filter((x)=>x!==optionId):[...ids,optionId]};}); setVisible(12); };
  const clear = () => { setSelected({}); setVisible(12); };
  const selectedCount = Object.values(selected).reduce((n,ids)=>n+ids.length,0);
  const onCat=(h:string)=>{setActiveCat(h);setVisible(12);const next=new URLSearchParams(params);if(h==='all') next.delete('category'); else next.set('category',h);setParams(next,{replace:true});};
  const Options = ({filter}:{filter:ProductFilterDefinition}) => <div className="flex flex-wrap gap-2">{filter.options.map((o)=><button key={o.id} onClick={()=>toggle(filter.id,o.id)} className={`px-3 py-2 rounded-full border text-xs font-bold ${(selected[filter.id]||[]).includes(o.id)?'bg-[#171717] text-white border-[#171717]':'bg-white border-neutral-200'}`}>{o.label}</button>)}</div>;

  return <Layout>
    <section className="relative bg-[#111] overflow-hidden"><div className="absolute inset-0 hex-grid opacity-20"/><div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20"><span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFC21C]">The collection</span><h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-[-0.05em] text-white">EXPLORE GIGATRON SPORTS</h1><p className="mt-4 text-white/60 max-w-2xl">Performance, comfort and style — find the gear that moves with you.</p></div></section>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><CategoryTabs categories={categories} active={activeCat} onSelect={onCat}/>
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-3"><div className="flex-1 flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4"><Search className="w-4 h-4 text-neutral-400"/><input value={q} onChange={(e)=>{setQ(e.target.value);setVisible(12)}} placeholder="Search by product, brand or SKU" className="flex-1 py-3.5 outline-none text-sm bg-transparent"/></div><button onClick={()=>setFilterOpen(true)} className="lg:hidden flex items-center justify-center gap-2 border border-neutral-300 bg-white rounded-full px-5 py-3.5 text-sm font-bold"><SlidersHorizontal className="w-4 h-4"/> Filters {selectedCount>0&&<span className="bg-[#FFC21C] rounded-full px-2">{selectedCount}</span>}</button><select value={sort} onChange={(e)=>setSort(e.target.value)} className="bg-white border border-neutral-200 rounded-full px-5 py-3.5 text-sm font-semibold outline-none"><option value="newest">Newest</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option></select></div>
      {displayFilters.length>0&&<div className="hidden lg:flex flex-wrap gap-3 mt-5 items-start">{displayFilters.map((f)=><details key={f.id} className="relative"><summary className="list-none cursor-pointer flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider">{f.name}{(selected[f.id]||[]).length>0&&<span className="bg-[#FFC21C] rounded-full px-2">{selected[f.id].length}</span>}<ChevronDown className="w-3.5 h-3.5"/></summary><div className="absolute z-20 mt-2 w-64 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4"><Options filter={f}/></div></details>)}{selectedCount>0&&<button onClick={clear} className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500">Clear filters</button>}</div>}
      <p className="mt-7 mb-5 text-sm text-neutral-500">{loading?'Loading…':`${filtered.length} product${filtered.length===1?'':'s'}`}</p><ProductGrid products={filtered.slice(0,visible)}/>{filtered.length>visible&&<div className="text-center mt-10"><button onClick={()=>setVisible((v)=>v+12)} className="bg-[#171717] text-white font-bold px-8 py-4 rounded-full hover:bg-[#FFC21C] hover:text-black">Load More</button></div>}
    </div>
    {filterOpen&&<div className="fixed inset-0 z-[80] lg:hidden"><button aria-label="Close filters" className="absolute inset-0 bg-black/50" onClick={()=>setFilterOpen(false)}/><div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#F7F7F5] p-6"><div className="flex items-center justify-between mb-6"><h2 className="font-black text-xl">FILTER PRODUCTS</h2><button onClick={()=>setFilterOpen(false)} className="h-10 w-10 rounded-full bg-white grid place-items-center"><X className="w-5 h-5"/></button></div><div className="space-y-5">{displayFilters.map((f)=><div key={f.id}><p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3">{f.name}</p><Options filter={f}/></div>)}</div><div className="sticky bottom-0 bg-[#F7F7F5] pt-6 flex gap-3"><button onClick={clear} className="flex-1 border rounded-full py-3.5 font-bold">Clear</button><button onClick={()=>setFilterOpen(false)} className="flex-[2] bg-[#FFC21C] rounded-full py-3.5 font-extrabold">Show {filtered.length} Products</button></div></div></div>}
  </Layout>;
}
