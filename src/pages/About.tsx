import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { fetchSettings, DEFAULT_SETTINGS, Settings } from '@/lib/gigatron';
import { LocationSection } from '@/components/HomeSections';

export default function About() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => { fetchSettings().then(setSettings); }, []);
  return <Layout>
    <section className="relative bg-[#111] overflow-hidden"><div className="absolute inset-0 hex-grid opacity-25" /><div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-[#FFC21C]/15 blur-3xl" /><div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"><span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFC21C]">About Gigatron Sports</span><h1 className="mt-4 max-w-3xl text-5xl sm:text-7xl font-black tracking-[-0.055em] text-white leading-[0.9]">BUILT FOR EVERY MOVE.</h1><p className="mt-7 text-white/70 leading-relaxed max-w-2xl text-lg">Gigatron Sports is your destination for sports footwear, apparel, accessories and performance essentials.</p><p className="mt-4 text-white/60 leading-relaxed max-w-2xl">From everyday activewear to the latest footwear and sporting gear, we bring together products designed for movement, comfort, performance and style. Whether you're training, competing or simply staying active, we help you find the right gear for your game.</p><div className="mt-9 flex flex-wrap gap-3"><Link to="/products" className="inline-flex items-center gap-2 bg-[#FFC21C] text-black font-extrabold px-7 py-4 rounded-full">Explore Products <ArrowRight className="w-4 h-4" /></Link><Link to="/contact" className="inline-flex items-center gap-2 border border-white/25 text-white font-bold px-7 py-4 rounded-full">Contact Us</Link></div></div></section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid sm:grid-cols-3 gap-6">{[{Icon:Activity,t:'Made to Move',d:'Footwear and gear selected for active, everyday performance.'},{Icon:ShieldCheck,t:'Genuine Products',d:'A focused collection of authentic sports and lifestyle essentials.'},{Icon:Sparkles,t:'Style in Motion',d:'Performance and comfort with a clean, modern point of view.'}].map(({Icon,t,d})=><div key={t} className="bg-white border border-neutral-200 rounded-2xl p-7"><span className="h-11 w-11 grid place-items-center rounded-full bg-[#FFC21C]/20"><Icon className="w-5 h-5" /></span><h3 className="mt-4 font-black text-lg">{t}</h3><p className="mt-2 text-sm text-neutral-600 leading-relaxed">{d}</p></div>)}</section>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"><LocationSection s={settings} /></div>
  </Layout>;
}
