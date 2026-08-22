import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { formatMVR, fetchSettings, DEFAULT_SETTINGS, Settings, waLink, ORDER_STATUS_LABEL } from '@/lib/gigatron';

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order') || '';
  const orderId = params.get('id') || '';
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetchSettings().then(setSettings);
    if (!orderId) return;
    (async () => {
      const { data: o } = await supabase.from('ecom_orders').select('*').eq('id', orderId).maybeSingle();
      setOrder(o);
      const { data: it } = await supabase.from('ecom_order_items').select('*').eq('order_id', orderId);
      setItems(it || []);
    })();
  }, [orderId]);

  const addr = order?.shipping_address || {};

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-12 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-[#FFC21C]" />
          <h1 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight">THANK YOU FOR YOUR ORDER</h1>
          <p className="mt-3 text-neutral-600">
            We have received your order. Our team will contact you shortly to confirm delivery.
          </p>

          <div className="mt-8 inline-flex flex-col items-center bg-[#FFC21C] rounded-2xl px-8 py-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#171717]/60">Order Number</span>
            <span className="text-2xl font-black text-[#171717]">{orderNumber || addr.order_number || '—'}</span>
          </div>

          {order && (
            <div className="mt-8 text-left border-t border-neutral-200 pt-6">
              <h2 className="font-black text-lg mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-4">
                    <span className="text-neutral-600">
                      {i.product_name}{i.variant_title ? ` (${i.variant_title})` : ''} × {i.quantity}
                    </span>
                    <span className="font-semibold">{formatMVR(i.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-black">{formatMVR(order.total)}</span>
              </div>
              <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                <div><dt className="text-neutral-500">Name</dt><dd className="font-semibold">{addr.name}</dd></div>
                <div><dt className="text-neutral-500">Mobile</dt><dd className="font-semibold">{addr.mobile}</dd></div>
                <div className="sm:col-span-2"><dt className="text-neutral-500">Delivery Address</dt><dd className="font-semibold">{addr.address}, {addr.city_island}</dd></div>
                <div><dt className="text-neutral-500">Status</dt><dd className="font-semibold">{ORDER_STATUS_LABEL[order.status] || order.status}</dd></div>
              </dl>
            </div>
          )}

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/products" className="bg-[#171717] text-white font-bold px-7 py-4 rounded-xl hover:bg-[#FFC21C] hover:text-[#171717] transition">
              Continue Shopping
            </Link>
            <a
              href={waLink(settings.whatsapp, `Hello Gigatron, I would like to enquire about order ${orderNumber || addr.order_number || ''}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-neutral-300 font-bold px-7 py-4 rounded-xl hover:border-neutral-900"
            >
              <MessageCircle className="w-4 h-4" /> Contact Gigatron on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
