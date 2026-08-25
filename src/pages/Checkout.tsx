import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { formatMVR, PAYMENT_METHODS, crmSubscribe } from '@/lib/gigatron';

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city_island: 'Malé',
    notes: '',
    payment_method: PAYMENT_METHODS[0].id,
  });
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const delivery = 0;
  const total = subtotal + delivery;
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls =
    'w-full border border-neutral-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/30 bg-white';

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!form.name || !form.mobile || !form.address) {
      setError('Please fill in your name, mobile number and delivery address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const items = cart.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        quantity: i.quantity,
      }));
      const { data: order, error: orderErr } = await supabase.rpc('place_order', {
        p_customer: {
          name: form.name,
          mobile: form.mobile,
          email: form.email,
          address: form.address,
          city_island: form.city_island,
          notes: form.notes,
          payment_method: form.payment_method,
        },
        p_items: items,
        p_notes: `Payment: ${PAYMENT_METHODS.find((p) => p.id === form.payment_method)?.label}${
          form.notes ? ` | ${form.notes}` : ''
        }`,
      });
      if (orderErr) throw orderErr;

      if (form.email) {
        crmSubscribe({
          email: form.email,
          name: form.name,
          phone: form.mobile || undefined,
          sms_opt_in: smsOptIn === true,
          source: 'checkout',
          tags: ['customer'],
        });
      }

      clearCart();
      navigate(`/order-confirmation?order=${encodeURIComponent(order.order_number)}&id=${order.id}&token=${order.public_token}`);
    } catch (err: any) {
      setError(err.message || 'Could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Your cart is empty</h1>
          <Link to="/products" className="mt-6 inline-block bg-[#FFC21C] text-[#171717] font-extrabold px-7 py-3.5 rounded-xl">
            Explore Products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-8">CHECKOUT</h1>
        <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="font-black text-lg mb-5">Delivery Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Full Name *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Mobile Number *</label>
                  <input type="tel" className={inputCls} value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Email (optional)</label>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Delivery Address *</label>
                  <input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Island / City</label>
                  <input className={inputCls} value={form.city_island} onChange={(e) => set('city_island', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Delivery Notes</label>
                  <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </div>
                <label className="sm:col-span-2 flex items-start gap-2 text-xs text-neutral-500">
                  <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5" />
                  <span>Text me order updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
                </label>
              </div>
            </section>

            <section className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="font-black text-lg mb-5">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 border-2 rounded-xl px-4 py-4 cursor-pointer transition ${
                      form.payment_method === m.id ? 'border-[#FFC21C] bg-[#FFC21C]/10' : 'border-neutral-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.id}
                      checked={form.payment_method === m.id}
                      onChange={(e) => set('payment_method', e.target.value)}
                    />
                    <span className="font-semibold text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-xs text-neutral-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Our team will confirm your order and payment on WhatsApp.
              </p>
            </section>
          </div>

          <aside className="bg-white border border-neutral-200 rounded-2xl p-6 h-fit">
            <h2 className="font-black text-lg">Order Summary</h2>
            <div className="mt-5 space-y-3">
              {cart.map((i) => (
                <div key={i.product_id + (i.variant_id || '')} className="flex justify-between gap-3 text-sm">
                  <span className="text-neutral-600">
                    {i.name} {i.variant_title ? `(${i.variant_title})` : ''} × {i.quantity}
                  </span>
                  <span className="font-semibold whitespace-nowrap">{formatMVR(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-neutral-200 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-bold">{formatMVR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span className="font-bold text-green-600">Free</span></div>
              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black">{formatMVR(total)}</span></div>
            </div>
            {error && <p className="mt-4 text-sm text-[#FF1717]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#FFC21C] text-[#171717] font-extrabold py-4 rounded-xl hover:brightness-95 disabled:opacity-60"
            >
              {loading ? 'Placing Order…' : 'Place Order'}
            </button>
          </aside>
        </form>
      </div>
    </Layout>
  );
}
