import { Link } from 'react-router-dom';
import { ShoppingBag, Truck } from 'lucide-react';
import { Product, formatMVR, productBadges, inStockOf } from '@/lib/gigatron';
import { useCart } from '@/contexts/CartContext';
import ProductArtwork from '@/components/ProductArtwork';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { isNew, isHot, freeDelivery } = productBadges(product);
  const stock = inStockOf(product);
  const img = product.images?.[0];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!stock) return;
    const v = product.variants?.[0];
    addToCart({
      product_id: product.id,
      variant_id: product.has_variants ? v?.id : undefined,
      handle: product.handle,
      name: product.name,
      variant_title: product.has_variants ? v?.title : undefined,
      sku: v?.sku || product.sku || product.handle,
      price: (product.has_variants && v?.price) || product.price,
      image: img,
    });
  };

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group flex flex-col rounded-2xl bg-white border border-neutral-200/80 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-square bg-[#F7F7F5] p-5">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductArtwork product={product} className="rounded-xl" />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {isNew && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-[#171717] text-white rounded">
              New
            </span>
          )}
          {isHot && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-[#FF1717] text-white rounded">
              Hot Sale
            </span>
          )}
        </div>
        {!stock && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-900/80 text-white rounded">
            Sold Out
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {product.vendor && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {product.vendor}
          </span>
        )}
        <h3 className="mt-1 font-semibold text-[15px] leading-snug text-neutral-900 line-clamp-2 min-h-[2.6em]">
          {product.name}
        </h3>

        {freeDelivery && (
          <span className="mt-2 inline-flex items-center gap-1 self-start text-[10px] font-bold uppercase tracking-wider text-neutral-800 border border-[#FFC21C] bg-[#FFC21C]/15 rounded px-2 py-1">
            <Truck className="w-3 h-3" /> Free Delivery
          </span>
        )}

        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-neutral-900">
              {formatMVR(product.price)}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={!stock}
            aria-label={`Add ${product.name} to cart`}
            className="shrink-0 h-10 w-10 grid place-items-center rounded-full bg-[#171717] text-[#FFC21C] transition-colors hover:bg-[#FFC21C] hover:text-[#171717] disabled:opacity-30 disabled:hover:bg-[#171717] disabled:hover:text-[#FFC21C]"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </Link>
  );
}
