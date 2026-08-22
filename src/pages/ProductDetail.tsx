import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Truck, ShieldCheck, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Product,
  Variant,
  PRODUCT_SELECT,
  formatMVR,
  productBadges,
  DEFAULT_SETTINGS,
  fetchSettings,
  Settings,
  waLink,
  isSportsProduct,
} from '@/lib/gigatron';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import ProductCard from '@/components/ProductCard';
import ProductArtwork from '@/components/ProductArtwork';
import { mergeTemporaryShoeCatalogue, TEMPORARY_SHOE_CATALOGUE } from '@/data/shoeCatalogue';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSelectedVariant(null);
      setSelectedOption('');
      setImgIdx(0);
      setQty(1);

      const { data } = await supabase
        .from('ecom_products')
        .select(PRODUCT_SELECT)
        .eq('handle', handle)
        .maybeSingle();

      const suppliedProduct = TEMPORARY_SHOE_CATALOGUE.find((item) => item.handle === handle);
      const selectedProduct = data && isSportsProduct(data as Product) ? (data as Product) : suppliedProduct;

      if (selectedProduct) {
        const p = { ...selectedProduct };
        let variants = p.variants || [];
        if (p.has_variants && variants.length === 0) {
          const { data: vd } = await supabase
            .from('ecom_product_variants')
            .select('*')
            .eq('product_id', p.id)
            .order('position');
          variants = (vd as Variant[]) || [];
          p.variants = variants;
        }
        setProduct(p);
        if (variants.length > 0) {
          const sorted = [...variants].sort((a, b) => (a.position || 0) - (b.position || 0));
          const first = sorted.find((v) => v.inventory_qty == null || v.inventory_qty > 0) || sorted[0];
          setSelectedVariant(first);
          setSelectedOption(first?.option1 || first?.title || '');
        }

        const { data: rel } = await supabase
          .from('ecom_products')
          .select(PRODUCT_SELECT)
          .eq('status', 'active')
          .neq('id', p.id)
          .limit(4);
        setRelated(mergeTemporaryShoeCatalogue(((rel as Product[]) || []).filter(isSportsProduct)).filter((item) => item.handle !== p.handle).slice(0, 4));
      } else {
        setProduct(null);
      }
      setLoading(false);
    })();
  }, [handle]);

  if (loading)
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center text-neutral-500">Loading…</div>
      </Layout>
    );

  if (!product)
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Product not found</h1>
          <Link to="/products" className="mt-6 inline-block bg-[#FFC21C] text-[#171717] font-bold px-6 py-3 rounded-xl">
            Back to Products
          </Link>
        </div>
      </Layout>
    );

  const variants = product.variants || [];
  const hasVariants = !!product.has_variants && variants.length > 0;
  const optionValues = Array.from(
    new Set(variants.map((v) => v.option1 || v.title).filter(Boolean))
  ) as string[];

  const getInStock = (): boolean => {
    if (selectedVariant) {
      if (selectedVariant.inventory_qty == null) return true;
      return selectedVariant.inventory_qty > 0;
    }
    if (variants.length > 0) return variants.some((v) => v.inventory_qty == null || v.inventory_qty > 0);
    if (product.has_variants) return true;
    if (product.inventory_qty == null) return true;
    return product.inventory_qty > 0;
  };
  const inStock = getInStock();
  const price = selectedVariant?.price || product.price;
  const { isNew, isHot, freeDelivery } = productBadges(product);
  const images = product.images || [];
  const specs = product.metadata || {};

  const selectOption = (val: string) => {
    setSelectedOption(val);
    const v = variants.find(
      (x) => x.option1 === val || x.title?.toLowerCase() === val.toLowerCase()
    );
    if (v) setSelectedVariant(v);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (hasVariants && !selectedOption) return;
    if (!inStock) return;
    addToCart(
      {
        product_id: product.id,
        variant_id: selectedVariant?.id || undefined,
        handle: product.handle,
        name: product.name,
        variant_title: selectedVariant?.title || (hasVariants ? selectedOption : undefined),
        sku: selectedVariant?.sku || product.sku || product.handle,
        price,
        image: images[0],
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900 mb-6">
          <ChevronLeft className="w-4 h-4" /> All Products
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div>
            <div className="aspect-square rounded-3xl bg-white border border-neutral-200 p-6 sm:p-10">
              {images[imgIdx] ? (
                <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <ProductArtwork product={product} className="rounded-2xl" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((im, i) => (
                  <button
                    key={im + i}
                    onClick={() => setImgIdx(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`w-20 h-20 rounded-xl bg-white p-2 border-2 transition ${
                      imgIdx === i ? 'border-[#FFC21C]' : 'border-neutral-200'
                    }`}
                  >
                    <img src={im} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              {isNew && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#171717] text-white rounded">New</span>}
              {isHot && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#FF1717] text-white rounded">Hot Sale</span>}
            </div>
            {product.vendor && (
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">{product.vendor}</p>
            )}
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight leading-tight">{product.name}</h1>
            <p className="mt-4 text-3xl font-black text-neutral-900">{formatMVR(price)}</p>
            <p className={`mt-2 text-sm font-semibold ${inStock ? 'text-green-600' : 'text-[#FF1717]'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </p>

            {product.description && (
              <p className="mt-5 text-neutral-600 leading-relaxed">{product.description}</p>
            )}

            {hasVariants && optionValues.length > 0 && (
              <div className="mt-7">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
                  Select Size / Colour
                </label>
                <div className="flex flex-wrap gap-2">
                  {optionValues.map((val) => {
                    const v = variants.find((x) => x.option1 === val || x.title === val);
                    const ok = v ? v.inventory_qty == null || v.inventory_qty > 0 : true;
                    return (
                      <button
                        key={val}
                        onClick={() => ok && selectOption(val)}
                        disabled={!ok}
                        className={`px-5 py-3 border-2 rounded-xl font-semibold text-sm transition ${
                          selectedOption === val
                            ? 'bg-[#171717] text-white border-[#171717]'
                            : ok
                            ? 'border-neutral-300 hover:border-neutral-900'
                            : 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center border border-neutral-300 rounded-xl">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="h-12 w-12 text-lg font-bold hover:bg-neutral-50">−</button>
                <span className="w-12 text-center font-bold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="h-12 w-12 text-lg font-bold hover:bg-neutral-50">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={(hasVariants && !selectedOption) || !inStock}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#FFC21C] text-[#171717] font-extrabold py-4 rounded-xl hover:brightness-95 disabled:opacity-40"
              >
                <ShoppingBag className="w-5 h-5" />
                {!inStock ? 'Out of Stock' : added ? 'Added to Cart' : 'Add to Cart'}
              </button>
            </div>

            <a
              href={waLink(
                settings.whatsapp,
                `Hello Gigatron Sports, I'm interested in the ${product.name}. Could you please provide more information?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-neutral-300 font-bold py-4 rounded-xl hover:border-neutral-900"
            >
              <MessageCircle className="w-5 h-5" /> Ask About This Product
            </a>

            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {freeDelivery && (
                <div className="flex items-center gap-2 text-sm font-semibold bg-[#FFC21C]/15 border border-[#FFC21C] rounded-xl px-4 py-3">
                  <Truck className="w-4 h-4" /> Free Delivery in Malé
                </div>
              )}
              <div className="flex items-center gap-2 text-sm font-semibold bg-white border border-neutral-200 rounded-xl px-4 py-3">
                <ShieldCheck className="w-4 h-4" /> Genuine Product
              </div>
            </div>

            {Object.keys(specs).length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-black tracking-tight">Specifications</h2>
                <dl className="mt-4 divide-y divide-neutral-200 border-t border-neutral-200">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 py-3 text-sm">
                      <dt className="text-neutral-500">{k}</dt>
                      <dd className="font-semibold text-neutral-900 text-right">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-7">YOU MAY ALSO LIKE</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
