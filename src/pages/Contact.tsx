import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Phone, MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { fetchSettings, DEFAULT_SETTINGS, Settings, waLink, viberLink, crmSubscribe } from '@/lib/gigatron';
import { LocationSection } from '@/components/HomeSections';

const REASONS = ['Product Enquiry', 'Order Enquiry', 'General Enquiry'];

export default function Contact() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: REASONS[0], message: '' });
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls =
    'w-full border border-neutral-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/30 bg-white';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) {
      setError('Please enter your name and a message.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.from('contact_enquiries').insert({ ...form, status: 'new' });
      if (err) throw err;
      if (form.email) {
        crmSubscribe({
          email: form.email,
          name: form.name,
          phone: form.phone || undefined,
          sms_opt_in: smsOptIn === true,
          source: 'contact-form',
          tags: ['contact', form.reason.toLowerCase().replace(/\s+/g, '-')],
        });
      }
      setSent(true);
      setForm({ name: '', phone: '', email: '', reason: REASONS[0], message: '' });
    } catch (err: any) {
      setError(err.message || 'Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="bg-[#171717]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFC21C]">Contact</span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white">LET'S TALK SPORT</h1>
          <p className="mt-4 text-white/60 max-w-xl">
            Questions about a product, size or order? The Gigatron Sports team is here to help.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-10">
        <div className="bg-white border border-neutral-200 rounded-3xl p-7 sm:p-9">
          <h2 className="font-black text-xl">Send us a message</h2>
          {sent ? (
            <div className="mt-8 text-center py-10">
              <CheckCircle2 className="w-14 h-14 mx-auto text-[#FFC21C]" />
              <p className="mt-4 font-bold text-lg">Message sent</p>
              <p className="mt-1 text-neutral-600 text-sm">We'll get back to you as soon as possible.</p>
              <button onClick={() => setSent(false)} className="mt-6 border border-neutral-300 font-bold px-6 py-3 rounded-xl">
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Name *</label>
                <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Phone number (optional)</label>
                  <input type="tel" className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Email (optional)</label>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Reason</label>
                <select className={inputCls} value={form.reason} onChange={(e) => set('reason', e.target.value)}>
                  {REASONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Message *</label>
                <textarea rows={5} className={inputCls} value={form.message} onChange={(e) => set('message', e.target.value)} required />
              </div>
              <label className="flex items-start gap-2 text-xs text-neutral-500">
                <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5" />
                <span>Text me updates from Gigatron. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>
              {error && <p className="text-sm text-[#FF1717]">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-[#FFC21C] text-[#171717] font-extrabold py-4 rounded-xl hover:brightness-95 disabled:opacity-60">
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-3xl p-7 sm:p-9">
            <h2 className="font-black text-xl">{settings.business_name}</h2>
            <p className="mt-4 flex items-start gap-2 text-neutral-600">
              <MapPin className="w-5 h-5 text-[#FFC21C] shrink-0 mt-0.5" /> {settings.address}
            </p>
            <p className="mt-2 flex items-center gap-2 text-neutral-600">
              <Phone className="w-5 h-5 text-[#FFC21C] shrink-0" /> {settings.phone}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={waLink(settings.whatsapp, 'Hello Gigatron, I would like to make an enquiry.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#171717] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#FFC21C] hover:text-[#171717] transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a href={viberLink(settings.viber)} className="border border-neutral-300 font-bold px-6 py-3.5 rounded-xl hover:border-neutral-900">
                Viber
              </a>
              <a href={settings.google_maps_url} target="_blank" rel="noopener noreferrer" className="border border-neutral-300 font-bold px-6 py-3.5 rounded-xl hover:border-neutral-900">
                Get Directions
              </a>
            </div>
          </div>
          <LocationSection s={settings} />
        </div>
      </div>
    </Layout>
  );
}
