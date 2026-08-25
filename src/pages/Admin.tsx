import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Home as HomeIcon,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  Plus,
  Pencil,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProductForm, { PROMO_TAGS } from '@/components/admin/ProductForm';
import { CategoriesManager, FiltersManager } from '@/components/admin/CatalogManagers';
import {
  formatMVR,
  GIGATRON_LOGO,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  DEFAULT_SETTINGS,
  Settings,
  isSportsProduct,
} from '@/lib/gigatron';


const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'orders', label: 'Orders', Icon: ClipboardList },
  { id: 'homepage', label: 'Homepage', Icon: HomeIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

const input =
  'w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/30';

function Login() {
  const { signIn, user, isAdmin, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const { error } = await signIn(email, password);
    if (error) setMsg(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#171717] px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8">
        <img src={GIGATRON_LOGO} alt="Gigatron" className="h-16 w-auto mx-auto object-contain" />
        <h1 className="mt-5 text-center font-black text-xl tracking-tight">ADMIN PORTAL</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {msg && <p className="text-sm text-[#FF1717]">{msg}</p>}
          <button disabled={loading} className="w-full bg-[#FFC21C] text-[#171717] font-extrabold py-3.5 rounded-xl disabled:opacity-60">
            {loading ? 'Please wait…' : 'Sign In'}
          </button>
        </form>
        {user && !isAdmin && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            This account does not have administrator access.
            <button type="button" onClick={signOut} className="mt-2 block font-bold underline">Sign out</button>
          </div>
        )}
        <Link to="/" className="mt-4 block text-center text-xs text-neutral-400 hover:text-neutral-700">
          ← Back to store
        </Link>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [catalogView, setCatalogView] = useState<'products' | 'categories' | 'filters'>('products');

  const load = async () => {
    const [p, o, c, s, col] = await Promise.all([
      supabase.from('ecom_products').select('*').order('created_at', { ascending: false }),
      supabase.from('ecom_orders').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_enquiries').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('site_settings').select('key,value'),
      supabase.from('ecom_collections').select('id,title,handle').order('title'),
    ]);
    setProducts((p.data || []).filter(isSportsProduct));
    setOrders(o.data || []);
    setEnquiries(c.data || []);
    setCollections(col.data || []);
    const map: Settings = { ...DEFAULT_SETTINGS };
    (s.data || []).forEach((row: any) => { if (row.value) map[row.key] = row.value; });
    setSettings(map);
  };

  useEffect(() => {
    if (user && isAdmin) load();
  }, [user, isAdmin]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.vendor, p.sku, p.product_type, p.handle]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(term))
    );
  }, [products, productSearch]);



  if (loading) return <div className="min-h-screen grid place-items-center bg-[#171717] text-white">Loading…</div>;
  if (!user || !isAdmin) return <Login />;

  const saveSetting = async (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const persistSettings = async () => {
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    for (const row of rows) {
      await supabase.from('site_settings').upsert(row, { onConflict: 'key' });
    }
    setSaved('Saved');
    setTimeout(() => setSaved(''), 2000);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('ecom_orders').update({ status }).eq('id', id);
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const updateProduct = async (id: string, patch: any) => {
    await supabase.from('ecom_products').update(patch).eq('id', id);
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const toggleTag = (p: any, tag: string) => {
    const tags: string[] = p.tags || [];
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    updateProduct(p.id, { tags: next });
  };

  const today = new Date().toDateString();
  const stats = [
    { label: "Today's Orders", value: orders.filter((o) => new Date(o.created_at).toDateString() === today).length },
    { label: 'Pending Orders', value: orders.filter((o) => o.status === 'pending').length },
    { label: 'Total Products', value: products.length },
    { label: 'Low Stock', value: products.filter((p) => (p.inventory_qty ?? 0) <= 3 && !p.has_variants).length },
  ];

  return (
    <div className="min-h-screen flex bg-[#F7F7F5]">
      <aside className="hidden md:flex w-60 flex-col bg-[#171717] text-white p-5 shrink-0">
        <img src={GIGATRON_LOGO} alt="Gigatron" className="h-12 w-auto object-contain bg-white rounded-lg p-1 self-start" />
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/40">Admin Portal</p>
        <nav className="mt-6 space-y-1 flex-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition ${
                tab === id ? 'bg-[#FFC21C] text-[#171717]' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
        <Link to="/" className="flex items-center gap-2 text-xs text-white/50 hover:text-white py-2">
          <ExternalLink className="w-3.5 h-3.5" /> View store
        </Link>
        <button onClick={signOut} className="flex items-center gap-2 text-xs text-white/50 hover:text-white py-2">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden bg-[#171717] p-4 flex gap-2 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold ${tab === id ? 'bg-[#FFC21C] text-[#171717]' : 'bg-white/10 text-white'}`}>
              {label}
            </button>
          ))}
        </header>

        <main className="p-4 sm:p-8 max-w-6xl">
          {tab === 'dashboard' && (
            <>
              <h1 className="text-2xl font-black tracking-tight mb-6">Dashboard</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
                    <p className="mt-2 text-3xl font-black">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <h2 className="font-black mb-4">Recent Orders</h2>
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex justify-between py-2 text-sm border-b border-neutral-100 last:border-0">
                      <span>{o.shipping_address?.order_number || o.id.slice(0, 8)} — {o.shipping_address?.name}</span>
                      <span className="font-bold">{formatMVR(o.total)}</span>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-neutral-400">No orders yet.</p>}
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 mt-6">
                <h2 className="font-black mb-4">Recent Contact Enquiries</h2>
                {enquiries.slice(0, 6).map((c) => (
                  <div key={c.id} className="py-2 text-sm border-b border-neutral-100 last:border-0">
                    <span className="font-semibold">{c.name}</span> · {c.reason} · {c.phone || c.email}
                    <p className="text-neutral-500">{c.message}</p>
                  </div>
                ))}
                {enquiries.length === 0 && <p className="text-sm text-neutral-400">No enquiries yet.</p>}
              </div>
            </>
          )}

          {tab === 'products' && (
            <>
              <h1 className="text-2xl font-black tracking-tight">Catalogue</h1>
              <div className="flex gap-2 my-5">
                {(['products','categories','filters'] as const).map((view) => (
                  <button key={view} onClick={() => setCatalogView(view)} className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${catalogView === view ? 'bg-[#171717] text-white' : 'bg-white border border-neutral-200'}`}>{view}</button>
                ))}
              </div>
              {catalogView === 'products' && <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-lg font-black tracking-tight">Products</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3">
                    <Search className="w-4 h-4 text-neutral-400" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products"
                      className="py-2.5 text-sm outline-none bg-transparent w-44"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-[#FFC21C] text-[#171717] font-extrabold px-5 py-2.5 rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                    <div className="w-20 h-20 bg-[#F7F7F5] rounded-xl p-2 shrink-0">
                      {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <p className="text-xs text-neutral-500">
                            {p.vendor} · {p.sku} {p.has_variants && '· has variants'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 border border-neutral-300 rounded-lg px-4 py-2 text-sm font-bold hover:border-neutral-900"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3 items-center">
                        <label className="text-xs font-semibold text-neutral-500">
                          Price (MVR)
                          <input
                            type="number"
                            defaultValue={(p.price || 0) / 100}
                            onBlur={(e) => updateProduct(p.id, { price: Math.round(Number(e.target.value) * 100) })}
                            className="ml-2 w-24 border border-neutral-300 rounded px-2 py-1 text-sm"
                          />
                        </label>
                        <label className="text-xs font-semibold text-neutral-500">
                          Stock
                          <input
                            type="number"
                            defaultValue={p.inventory_qty ?? 0}
                            onBlur={(e) => updateProduct(p.id, { inventory_qty: Number(e.target.value) })}
                            className="ml-2 w-20 border border-neutral-300 rounded px-2 py-1 text-sm"
                          />
                        </label>
                        <select
                          value={p.status}
                          onChange={(e) => updateProduct(p.id, { status: e.target.value })}
                          className="border border-neutral-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {PROMO_TAGS.map((t) => (
                          <button
                            key={t}
                            onClick={() => toggleTag(p, t)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                              (p.tags || []).includes(t)
                                ? 'bg-[#FFC21C] border-[#FFC21C] text-[#171717]'
                                : 'border-neutral-300 text-neutral-500'
                            }`}
                          >
                            {t.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-neutral-400">No products found.</p>
                )}
              </div>
              </>}
              {catalogView === 'categories' && <CategoriesManager onChanged={load} />}
              {catalogView === 'filters' && <FiltersManager />}
            </>
          )}


          {tab === 'orders' && (
            <>
              <h1 className="text-2xl font-black tracking-tight mb-6">Orders</h1>
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Phone</th>
                      <th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-neutral-100">
                        <td className="p-3 font-bold">{o.shipping_address?.order_number || o.id.slice(0, 8)}</td>
                        <td className="p-3">{o.shipping_address?.name}</td>
                        <td className="p-3">{o.shipping_address?.mobile}</td>
                        <td className="p-3 font-semibold">{formatMVR(o.total)}</td>
                        <td className="p-3 text-neutral-500">{o.shipping_address?.payment_method}</td>
                        <td className="p-3">
                          <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="border border-neutral-300 rounded px-2 py-1 text-xs">
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td className="p-6 text-neutral-400" colSpan={7}>No orders yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(tab === 'homepage' || tab === 'settings') && (
            <>
              <h1 className="text-2xl font-black tracking-tight mb-6">{tab === 'homepage' ? 'Homepage' : 'Settings'}</h1>
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 max-w-2xl">
                {(tab === 'homepage'
                  ? ['hero_title', 'hero_subtitle', 'hero_image', 'hero_cta_text', 'hero_cta_url', 'hero_secondary_cta_text', 'hero_secondary_cta_url', 'hero_enabled', 'section_latest_drops', 'section_promotion']
                  : ['business_name', 'tagline', 'phone', 'whatsapp', 'viber', 'email', 'address', 'google_maps_url', 'facebook_url', 'instagram_url', 'tiktok_url', 'currency', 'delivery_message']
                ).map((k) => (
                  <div key={k}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      {k.replace(/_/g, ' ')}
                    </label>
                    {k.startsWith('section_') || k === 'hero_enabled' ? (
                      <select className={input} value={settings[k] || 'true'} onChange={(e) => saveSetting(k, e.target.value)}>
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : (
                      <input className={input} value={settings[k] || ''} onChange={(e) => saveSetting(k, e.target.value)} />
                    )}
                  </div>
                ))}
                <button onClick={persistSettings} className="bg-[#FFC21C] text-[#171717] font-extrabold px-7 py-3.5 rounded-xl">
                  {saved || 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {formOpen && (
        <ProductForm
          product={editing}
          collections={collections}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}
