import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { formatMVR } from '@/lib/gigatron';

export default function CartPage() {
  const { cart, updateQty, removeFromCart, subtotal } = useCart();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-8">YOUR CART</h1>

        {cart.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-3xl py-20 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-neutral-300" />
            <p className="mt-4 text-neutral-500">Your cart is currently empty.</p>
            <Link to="/products" className="mt-6 inline-block bg-[#FFC21C] text-[#171717] font-extrabold px-7 py-3.5 rounded-xl">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.product_id + (item.variant_id || '')} className="flex gap-4 bg-white border border-neutral-200 rounded-2xl p-4">
                  <Link to={`/products/${item.handle}`} className="w-24 h-24 rounded-xl bg-[#F7F7F5] p-2 shrink-0">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.handle}`} className="font-semibold hover:text-[#FFC21C] line-clamp-2">
                      {item.name}
                    </Link>
                    {item.variant_title && <p className="text-xs text-neutral-500 mt-0.5">{item.variant_title}</p>}
                    <p className="text-sm font-bold mt-1">{formatMVR(item.price)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-neutral-200 rounded-lg">
                        <button onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)} aria-label="Decrease" className="h-9 w-9 grid place-items-center">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)} aria-label="Increase" className="h-9 w-9 grid place-items-center">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id, item.variant_id)} aria-label="Remove" className="text-neutral-400 hover:text-[#FF1717]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-black">{formatMVR(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <aside className="bg-white border border-neutral-200 rounded-2xl p-6 h-fit">
              <h2 className="font-black text-lg">Order Summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-bold">{formatMVR(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span className="font-bold text-green-600">Free</span></div>
                <div className="pt-3 border-t border-neutral-200 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black">{formatMVR(subtotal)}</span></div>
              </div>
              <Link to="/checkout" className="mt-6 block text-center bg-[#171717] text-white font-extrabold py-4 rounded-xl hover:bg-[#FFC21C] hover:text-[#171717] transition">
                Proceed to Checkout
              </Link>
              <Link to="/products" className="mt-3 block text-center text-sm font-semibold text-neutral-500 hover:text-neutral-900">
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
