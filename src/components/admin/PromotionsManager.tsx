import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMVR, Product } from '@/lib/gigatron';
import { fetchPromotions, PROMOTION_KINDS, Promotion, PromotionKind, promotionStatus } from '@/lib/promotions';
import ImageUploader from '@/components/admin/ImageUploader';
import { slugify } from '@/components/admin/ProductForm';

const input = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/25';
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500';

type ProductDraft = { selected: boolean; offerPrice: string; stockLabel: string };

const emptyDraft = {
  title: '', slug: '', kind: 'daily_deals' as PromotionKind, description: '', label: 'Limited Time', bannerUrl: '',
  startsAt: '', endsAt: '', countdownEnabled: true, isActive: true, showOnHomepage: true, sortOrder: '0', bundlePrice: '',
};

function localDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function isoDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function PromotionsManager({ products }: { products: Product[] }) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [editing, setEditing] = useState<Promotion | null | undefined>(undefined);
  const [draft, setDraft] = useState(emptyDraft);
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductDraft>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => setPromotions(await fetchPromotions(true));
  useEffect(() => { void load(); }, []);

  const open = (promotion: Promotion | null) => {
    setEditing(promotion);
    setMessage('');
    setDraft(promotion ? {
      title: promotion.title,
      slug: promotion.slug,
      kind: promotion.kind,
      description: promotion.description || '',
      label: promotion.label || '',
      bannerUrl: promotion.banner_url || '',
      startsAt: localDateTime(promotion.starts_at),
      endsAt: localDateTime(promotion.ends_at),
      countdownEnabled: promotion.countdown_enabled,
      isActive: promotion.is_active,
      showOnHomepage: promotion.show_on_homepage,
      sortOrder: String(promotion.sort_order),
      bundlePrice: promotion.bundle_price == null ? '' : String(promotion.bundle_price / 100),
    } : { ...emptyDraft, sortOrder: String(promotions.length) });
    const next: Record<string, ProductDraft> = {};
    promotion?.items.forEach((item) => {
      next[item.product_id] = {
        selected: true,
        offerPrice: item.offer_price == null ? '' : String(item.offer_price / 100),
        stockLabel: item.stock_label || '',
      };
    });
    setProductDrafts(next);
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => [product.name, product.sku, product.vendor, product.product_type].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [products, search]);

  const setProduct = (id: string, patch: Partial<ProductDraft>) => setProductDrafts((current) => ({
    ...current,
    [id]: { selected: false, offerPrice: '', stockLabel: '', ...current[id], ...patch },
  }));

  const save = async () => {
    if (!draft.title.trim()) return setMessage('Campaign title is required.');
    if (draft.startsAt && draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) return setMessage('End date must be after the start date.');
    const selected = Object.entries(productDrafts).filter(([, value]) => value.selected);
    if (!selected.length) return setMessage('Select at least one product.');
    if (draft.kind === 'bundle_save' && !Number(draft.bundlePrice)) return setMessage('Enter a bundle price.');
    setSaving(true);
    setMessage('');
    const payload = {
      title: draft.title.trim(),
      slug: slugify(draft.slug || draft.title),
      kind: draft.kind,
      description: draft.description.trim() || null,
      label: draft.label.trim() || null,
      banner_url: draft.bannerUrl.trim() || null,
      starts_at: isoDateTime(draft.startsAt),
      ends_at: isoDateTime(draft.endsAt),
      countdown_enabled: draft.countdownEnabled,
      is_active: draft.isActive,
      show_on_homepage: draft.showOnHomepage,
      sort_order: Number(draft.sortOrder || 0),
      bundle_price: draft.kind === 'bundle_save' ? Math.round(Number(draft.bundlePrice) * 100) : null,
    };
    try {
      let id = editing?.id;
      if (id) {
        const { error } = await supabase.from('promotions').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('promotions').insert(payload).select('id').single();
        if (error) throw error;
        id = data.id;
      }
      const { error: deleteError } = await supabase.from('promotion_products').delete().eq('promotion_id', id);
      if (deleteError) throw deleteError;
      const bundleCents = Math.round(Number(draft.bundlePrice || 0) * 100);
      const bundleOriginal = selected.reduce((sum, [productId]) => sum + (products.find((product) => product.id === productId)?.price || 0), 0);
      let allocated = 0;
      const rows = selected.map(([productId, value], index) => {
        const productPrice = products.find((product) => product.id === productId)?.price || 0;
        const bundleAllocation = index === selected.length - 1
          ? Math.max(0, bundleCents - allocated)
          : Math.round(bundleOriginal ? bundleCents * productPrice / bundleOriginal : bundleCents / selected.length);
        if (draft.kind === 'bundle_save') allocated += bundleAllocation;
        return ({
        promotion_id: id,
        product_id: productId,
        offer_price: draft.kind === 'bundle_save' ? bundleAllocation : !value.offerPrice ? null : Math.round(Number(value.offerPrice) * 100),
        stock_label: value.stockLabel.trim() || null,
        sort_order: index,
      });
      });
      const { error: itemError } = await supabase.from('promotion_products').insert(rows);
      if (itemError) throw itemError;
      await load();
      setEditing(undefined);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Could not save this promotion.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (promotion: Promotion) => {
    if (!confirm(`Delete “${promotion.title}”?`)) return;
    const { error } = await supabase.from('promotions').delete().eq('id', promotion.id);
    if (error) return setMessage(error.message);
    await load();
  };

  if (editing !== undefined) {
    const isBundle = draft.kind === 'bundle_save';
    const selectedCount = Object.values(productDrafts).filter((value) => value.selected).length;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4"><div><button onClick={() => setEditing(undefined)} className="text-sm font-bold text-neutral-500">← Promotions</button><h1 className="mt-2 text-2xl font-black">{editing ? 'Edit Promotion' : 'New Promotion'}</h1></div><button onClick={() => setEditing(undefined)} className="grid h-10 w-10 place-items-center rounded-full border bg-white" aria-label="Close"><X className="h-4 w-4" /></button></div>
        {message && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
        <section className="grid gap-5 rounded-2xl border bg-white p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2"><label className={label}>Campaign type</label><select className={input} value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as PromotionKind }))}>{PROMOTION_KINDS.map((kind) => <option key={kind.id} value={kind.id}>{kind.emoji} {kind.label}</option>)}</select></div>
          <div><label className={label}>Campaign title *</label><input className={input} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} placeholder="September Flash Sale" /></div>
          <div><label className={label}>URL slug</label><input className={input} value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} placeholder="september-flash-sale" /></div>
          <div className="sm:col-span-2"><label className={label}>Description</label><textarea className={`${input} min-h-24`} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></div>
          <div><label className={label}>Badge / label</label><input className={input} value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Today Only" /></div>
          <div><label className={label}>Homepage order</label><input type="number" className={input} value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))} /></div>
          {isBundle && <div><label className={label}>Bundle price (MVR) *</label><input type="number" min="0" step="0.01" className={input} value={draft.bundlePrice} onChange={(event) => setDraft((current) => ({ ...current, bundlePrice: event.target.value }))} /></div>}
          <div><label className={label}>Start date & time</label><input type="datetime-local" className={input} value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} /></div>
          <div><label className={label}>End date & time</label><input type="datetime-local" className={input} value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} /></div>
          <div className="sm:col-span-2"><label className={label}>Promotional banner</label><ImageUploader images={draft.bannerUrl ? [draft.bannerUrl] : []} onChange={(images) => setDraft((current) => ({ ...current, bannerUrl: images[0] || '' }))} /></div>
          <div className="sm:col-span-2 flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} /> Active</label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.showOnHomepage} onChange={(event) => setDraft((current) => ({ ...current, showOnHomepage: event.target.checked }))} /> Show on homepage</label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.countdownEnabled} onChange={(event) => setDraft((current) => ({ ...current, countdownEnabled: event.target.checked }))} /> Countdown timer</label></div>
        </section>
        <section className="rounded-2xl border bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-black">{isBundle ? 'Bundle products' : 'Offer products'} <span className="text-neutral-400">({selectedCount})</span></h2><p className="mt-1 text-sm text-neutral-500">{isBundle ? 'Select everything included in this bundle.' : 'Select products and enter their promotional prices.'}</p></div><div className="flex items-center gap-2 rounded-xl border px-3"><Search className="h-4 w-4 text-neutral-400" /><input className="w-52 py-2.5 text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" /></div></div>
          <div className="mt-5 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const value = productDrafts[product.id] || { selected: false, offerPrice: '', stockLabel: '' };
              return <div key={product.id} className={`grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-[44px_1fr_135px_150px] ${value.selected ? 'border-[#FFC21C] bg-[#FFC21C]/5' : 'border-neutral-200'}`}><input type="checkbox" checked={value.selected} onChange={(event) => setProduct(product.id, { selected: event.target.checked })} className="h-5 w-5" /><div className="min-w-0"><p className="truncate text-sm font-bold">{product.name}</p><p className="text-xs text-neutral-500">{formatMVR(product.price)} · {product.product_type || 'Uncategorised'}</p></div>{!isBundle ? <input type="number" min="0" step="0.01" disabled={!value.selected} className={input} value={value.offerPrice} onChange={(event) => setProduct(product.id, { offerPrice: event.target.value })} placeholder="Offer MVR" /> : <span className="text-xs text-neutral-400">Included</span>}<input disabled={!value.selected} className={input} value={value.stockLabel} onChange={(event) => setProduct(product.id, { stockLabel: event.target.value })} placeholder="Only 3 left" /></div>;
            })}
          </div>
        </section>
        <div className="flex justify-end"><button onClick={save} disabled={saving} className="rounded-xl bg-[#FFC21C] px-8 py-3.5 font-extrabold disabled:opacity-50">{saving ? 'Saving…' : 'Save Promotion'}</button></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-black">Offers & Promotions</h1><p className="mt-1 text-sm text-neutral-500">Create scheduled offers, bundles, banners and homepage sections.</p></div><button onClick={() => open(null)} className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21C] px-5 py-3 font-extrabold"><Plus className="h-4 w-4" /> New Promotion</button></div>
      {message && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {promotions.map((promotion) => {
          const kind = PROMOTION_KINDS.find((entry) => entry.id === promotion.kind);
          const status = promotionStatus(promotion);
          return <article key={promotion.id} className="overflow-hidden rounded-2xl border bg-white"><div className="flex gap-4 p-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neutral-100 text-2xl">{kind?.emoji}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{promotion.title}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${status === 'Live' ? 'bg-emerald-100 text-emerald-700' : status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'}`}>{status}</span>{promotion.show_on_homepage && <span className="rounded-full bg-[#FFC21C]/20 px-2 py-1 text-[10px] font-black uppercase">Homepage</span>}</div><p className="mt-1 text-sm text-neutral-500">{kind?.label} · {promotion.items.length} product{promotion.items.length === 1 ? '' : 's'}</p>{promotion.ends_at && <p className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-400"><CalendarClock className="h-3.5 w-3.5" /> Ends {new Date(promotion.ends_at).toLocaleString()}</p>}</div><div className="flex gap-1"><button onClick={() => open(promotion)} className="grid h-9 w-9 place-items-center rounded-lg border" aria-label="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(promotion)} className="grid h-9 w-9 place-items-center rounded-lg border text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></div></article>;
        })}
      </div>
      {!promotions.length && <div className="mt-8 rounded-2xl border border-dashed bg-white px-6 py-16 text-center"><CalendarClock className="mx-auto h-10 w-10 text-neutral-300" /><h2 className="mt-4 font-black">No promotions yet</h2><p className="mt-1 text-sm text-neutral-500">Create the first campaign to publish it on the storefront.</p></div>}
    </div>
  );
}
