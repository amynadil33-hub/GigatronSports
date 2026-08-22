import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatMVR } from '@/lib/gigatron';

export default function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, updateQty, removeFromCart, subtotal, count } = useCart();

  return (
    <>
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!drawerOpen}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="font-extrabold tracking-tight text-lg">
            Your Cart <span className="text-neutral-400 font-semibold">({count})</span>
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 && (
            <div className="h-full grid place-items-center text-center py-16">
              <div>
                <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300" />
                <p className="mt-3 text-neutral-500">Your cart is empty.</p>
                <Link
                  to="/products"
                  onClick={() => setDrawerOpen(false)}
                  className="mt-4 inline-block bg-[#FFC21C] text-[#171717] font-bold px-5 py-2.5 rounded-lg"
                >
                  Explore Products
                </Link>
              </div>
            </div>
          )}

          {cart.map((item) => (
            <div key={item.product_id + (item.variant_id || '')} className="flex gap-3">
              <Link
                to={`/products/${item.handle}`}
                onClick={() => setDrawerOpen(false)}
                className="w-20 h-20 rounded-xl bg-[#F7F7F5] p-2 shrink-0"
              >
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{item.name}</p>
                {item.variant_title && (
                  <p className="text-xs text-neutral-500 mt-0.5">{item.variant_title}</p>
                )}
                <p className="text-sm font-bold mt-1">{formatMVR(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-neutral-200 rounded-lg">
                    <button
                      onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                      className="h-8 w-8 grid place-items-center hover:bg-neutral-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)}
                      className="h-8 w-8 grid place-items-center hover:bg-neutral-50"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id, item.variant_id)}
                    className="h-8 w-8 grid place-items-center text-neutral-400 hover:text-[#FF1717]"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <footer className="border-t border-neutral-200 p-5 space-y-3">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Subtotal</span>
              <span className="font-bold text-neutral-900">{formatMVR(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setDrawerOpen(false)}
              className="block w-full text-center bg-[#171717] text-white font-bold py-3.5 rounded-xl hover:bg-[#FFC21C] hover:text-[#171717] transition-colors"
            >
              Checkout
            </Link>
            <Link
              to="/cart"
              onClick={() => setDrawerOpen(false)}
              className="block w-full text-center border border-neutral-300 font-semibold py-3 rounded-xl hover:border-neutral-900"
            >
              View Cart
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
