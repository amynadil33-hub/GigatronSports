import { useEffect, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ImageUploader from '@/components/admin/ImageUploader';
import SpecsEditor, { SpecRow } from '@/components/admin/SpecsEditor';
import VariantsEditor, { VariantRow } from '@/components/admin/VariantsEditor';
import { ProductFilterDefinition } from '@/lib/gigatron';

const input =
  'w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/30';
const label = 'block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5';

export const PROMO_TAGS = ['featured', 'hot_sale', 'new_arrival', 'free_delivery'];

export function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Props {
  product: any | null; // null = create mode
  collections: { id: string; title: string; handle: string }[];
  onClose: () => void;
  onSaved: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
      <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900 mb-5">{title}</h3>
      {children}
    </section>
  );
}

export default function ProductForm({ product, collections, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [handle, setHandle] = useState(product?.handle || '');
  const [handleTouched, setHandleTouched] = useState(!!product?.handle);
  const [vendor, setVendor] = useState(product?.vendor || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [productType, setProductType] = useState(product?.product_type || '');
  const [description, setDescription] = useState(product?.description || '');
  const [priceMVR, setPriceMVR] = useState(String((product?.price || 0) / 100));
  const [stock, setStock] = useState(String(product?.inventory_qty ?? 0));
  const [status, setStatus] = useState(product?.status || 'active');
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [warranty, setWarranty] = useState(product?.metadata?.Warranty || product?.metadata?.warranty || '');
  const [specs, setSpecs] = useState<SpecRow[]>(
    Object.entries(product?.metadata || {})
      .filter(([k]) => k.toLowerCase() !== 'warranty')
      .map(([key, value]) => ({ key, value: String(value) }))
  );
  const [hasVariants, setHasVariants] = useState(!!product?.has_variants);
  const [optionName, setOptionName] = useState('Size / Colour');
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [filterDefinitions, setFilterDefinitions] = useState<ProductFilterDefinition[]>([]);
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) return;
    (async () => {
      const { data: vd } = await supabase
        .from('ecom_product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('position');
      if (vd && vd.length) {
        setVariants(
          vd.map((v: any) => ({
            id: v.id,
            title: v.option1 || v.title || '',
            sku: v.sku || '',
            priceMVR: String((v.price || 0) / 100),
            stock: String(v.inventory_qty ?? 0),
          }))
        );
      }
      const { data: opt } = await supabase
        .from('ecom_product_options')
        .select('name')
        .eq('product_id', product.id)
        .limit(1);
      if (opt?.[0]?.name) setOptionName(opt[0].name);

      const { data: links } = await supabase
        .from('ecom_product_collections')
        .select('collection_id')
        .eq('product_id', product.id);
      setSelectedCollections((links || []).map((l: any) => l.collection_id));
    })();
  }, [product]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('product_filters').select('*, options:product_filter_options(*)').eq('is_active', true).order('sort_order');
      setFilterDefinitions(((data || []) as any[]).map((f) => ({ ...f, options: (f.options || []).filter((o: any) => o.is_active).sort((a: any, b: any) => a.sort_order - b.sort_order) })));
      if (product?.id) {
        const { data: assigned } = await supabase.from('product_filter_values').select('option_id').eq('product_id', product.id);
        setSelectedFilterOptions((assigned || []).map((x: any) => x.option_id));
      }
    })();
  }, [product]);

  useEffect(() => {
    if (!handleTouched) setHandle(slugify(name));
  }, [name, handleTouched]);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const toggleCollection = (id: string) =>
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const save = async () => {
    if (!name.trim()) return setError('Product name is required.');
    if (!handle.trim()) return setError('Handle / slug is required.');
    setSaving(true);
    setError('');
    try {
      const metadata: Record<string, string> = {};
      specs.forEach((s) => {
        if (s.key.trim()) metadata[s.key.trim()] = s.value;
      });
      if (warranty.trim()) metadata.Warranty = warranty.trim();

      const payload: any = {
        name: name.trim(),
        handle: slugify(handle),
        vendor: vendor || null,
        sku: sku || null,
        product_type: productType || null,
        description: description || null,
        price: Math.round(Number(priceMVR || 0) * 100),
        inventory_qty: Number(stock || 0),
        images,
        status,
        tags,
        metadata,
        has_variants: hasVariants,
      };

      let productId = product?.id;
      if (isEdit) {
        const { error: e } = await supabase.from('ecom_products').update(payload).eq('id', productId);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase
          .from('ecom_products')
          .insert(payload)
          .select('id')
          .single();
        if (e) throw e;
        productId = data.id;
      }

      // --- Variants ---
      if (hasVariants) {
        const live = variants.filter((v) => !v._delete && v.title.trim());
        for (const v of variants.filter((x) => x._delete && x.id)) {
          await supabase.from('ecom_product_variants').delete().eq('id', v.id);
        }
        for (let i = 0; i < live.length; i++) {
          const v = live[i];
          const row = {
            product_id: productId,
            title: v.title.trim(),
            option1: v.title.trim(),
            sku: v.sku || null,
            price: Math.round(Number(v.priceMVR || priceMVR || 0) * 100),
            inventory_qty: Number(v.stock || 0),
            position: i,
          };
          if (v.id) await supabase.from('ecom_product_variants').update(row).eq('id', v.id);
          else await supabase.from('ecom_product_variants').insert(row);
        }
        // Keep the admin-side option definition in sync
        await supabase.from('ecom_product_options').delete().eq('product_id', productId);
        if (live.length) {
          await supabase.from('ecom_product_options').insert({
            product_id: productId,
            name: optionName || 'Option',
            position: 0,
            values: live.map((v) => v.title.trim()),
          });
        }
      } else if (isEdit) {
        await supabase.from('ecom_product_variants').delete().eq('product_id', productId);
        await supabase.from('ecom_product_options').delete().eq('product_id', productId);
      }

      // --- Collections ---
      await supabase.from('ecom_product_collections').delete().eq('product_id', productId);
      if (selectedCollections.length) {
        await supabase.from('ecom_product_collections').insert(
          selectedCollections.map((collection_id, i) => ({
            product_id: productId,
            collection_id,
            position: i,
          }))
        );
      }

      // --- Dynamic product filters ---
      await supabase.from('product_filter_values').delete().eq('product_id', productId);
      if (selectedFilterOptions.length) {
        const { error: filterError } = await supabase.from('product_filter_values').insert(
          selectedFilterOptions.map((option_id) => ({ product_id: productId, option_id }))
        );
        if (filterError) throw filterError;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async () => {
    if (!isEdit || !confirm('Delete this product permanently?')) return;
    setSaving(true);
    await supabase.from('ecom_products').delete().eq('id', product.id);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[#F7F7F5] h-full overflow-y-auto">
        <header className="sticky top-0 z-10 bg-[#171717] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="font-black tracking-tight text-lg">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#FFC21C] text-[#171717] font-extrabold px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onClose} aria-label="Close" className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-5">
          {error && (
            <p className="bg-[#FF1717]/10 border border-[#FF1717]/30 text-[#FF1717] text-sm rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <Section title="Basic Information">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Product name *</label>
                <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Handle / slug</label>
                <input
                  className={input}
                  value={handle}
                  onChange={(e) => {
                    setHandleTouched(true);
                    setHandle(e.target.value);
                  }}
                />
                <p className="mt-1 text-xs text-neutral-400">/products/{slugify(handle) || 'handle'}</p>
              </div>
              <div>
                <label className={label}>Brand</label>
                <input className={input} value={vendor} onChange={(e) => setVendor(e.target.value)} />
              </div>
              <div>
                <label className={label}>SKU</label>
                <input className={input} value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <label className={label}>Product type</label>
                <input
                  className={input}
                  placeholder="Footwear, Apparel, Equipment…"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Status</label>
                <select className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Pricing & Inventory">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Price (MVR)</label>
                <input
                  className={input}
                  type="number"
                  value={priceMVR}
                  onChange={(e) => setPriceMVR(e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Stock quantity</label>
                <input
                  className={input}
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Warranty</label>
                <input
                  className={input}
                  placeholder="1 Year Gigatron Warranty"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Images">
            <ImageUploader images={images} onChange={setImages} />
          </Section>

          <Section title="Description & Specifications">
            <label className={label}>Description</label>
            <textarea
              rows={5}
              className={input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="mt-6">
              <label className={label}>Specifications</label>
              <SpecsEditor rows={specs} onChange={setSpecs} />
            </div>
          </Section>

          <Section title="Variants">
            <label className="flex items-center gap-2 text-sm font-semibold mb-4">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
              />
              This product has variants
            </label>
            {hasVariants && (
              <VariantsEditor
                optionName={optionName}
                onOptionNameChange={setOptionName}
                rows={variants}
                onChange={setVariants}
              />
            )}
          </Section>

          <Section title="Collections">
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCollection(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                    selectedCollections.includes(c.id)
                      ? 'bg-[#FFC21C] border-[#FFC21C] text-[#171717]'
                      : 'border-neutral-300 text-neutral-500 hover:border-neutral-900'
                  }`}
                >
                  {c.title}
                </button>
              ))}
              {collections.length === 0 && (
                <p className="text-sm text-neutral-400">No collections created yet.</p>
              )}
            </div>
          </Section>

          {filterDefinitions.length > 0 && (
            <Section title="Product Filters">
              <div className="space-y-5">
                {filterDefinitions.map((filter) => (
                  <div key={filter.id}>
                    <label className={label}>{filter.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {filter.options.map((option) => {
                        const active = selectedFilterOptions.includes(option.id);
                        return <button key={option.id} type="button" onClick={() => setSelectedFilterOptions((current) => active ? current.filter((id) => id !== option.id) : [...current, option.id])} className={`px-4 py-2 rounded-full text-sm font-bold border ${active ? 'bg-[#171717] border-[#171717] text-white' : 'border-neutral-300 text-neutral-600'}`}>{option.label}</button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Visibility & Promotion">
            <div className="flex flex-wrap gap-2">
              {PROMO_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border transition ${
                    tags.includes(t)
                      ? 'bg-[#171717] border-[#171717] text-white'
                      : 'border-neutral-300 text-neutral-500 hover:border-neutral-900'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </Section>

          <div className="flex flex-wrap gap-3 pb-10">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#FFC21C] text-[#171717] font-extrabold px-7 py-3.5 rounded-xl disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
            {isEdit && (
              <button
                onClick={removeProduct}
                className="inline-flex items-center gap-2 border border-neutral-300 text-[#FF1717] font-bold px-6 py-3.5 rounded-xl hover:border-[#FF1717]"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
