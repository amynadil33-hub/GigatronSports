import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { fetchSettings, Settings, DEFAULT_SETTINGS } from '@/lib/gigatron';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-neutral-900">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <CartDrawer />
    </div>
  );
}
