import { Link } from 'react-router-dom';
import { Phone, MapPin, Facebook, Instagram, Music2 } from 'lucide-react';
import { GIGATRON_LOGO, Settings, DEFAULT_SETTINGS, waLink } from '@/lib/gigatron';

export default function Footer({ settings = DEFAULT_SETTINGS }: { settings?: Settings }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  return (
    <footer className="bg-[#171717] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <img
              src={GIGATRON_LOGO}
              alt={s.business_name}
              className="h-14 w-auto rounded-lg bg-white p-1.5 object-contain"
            />
            <p className="mt-4 text-[#FFC21C] font-semibold tracking-wide text-sm">{s.tagline}</p>
            <p className="mt-4 text-white/60 text-sm max-w-sm leading-relaxed">
              Premium footwear, apparel and performance essentials for training, competition and everyday movement.
            </p>
            <div className="flex gap-3 mt-6">
              <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="h-11 w-11 grid place-items-center rounded-full bg-white/10 hover:bg-[#FFC21C] hover:text-[#171717] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="h-11 w-11 grid place-items-center rounded-full bg-white/10 hover:bg-[#FFC21C] hover:text-[#171717] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={s.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="h-11 w-11 grid place-items-center rounded-full bg-white/10 hover:bg-[#FFC21C] hover:text-[#171717] transition-colors">
                <Music2 className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Quick Links</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { l: 'Home', t: '/' },
                { l: 'About Us', t: '/about' },
                { l: 'Products', t: '/products' },
                { l: 'Contact', t: '/contact' },
              ].map((i) => (
                <li key={i.t}>
                  <Link to={i.t} className="text-white/70 hover:text-[#FFC21C]">
                    {i.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Visit Us</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-[#FFC21C] shrink-0" />
                <span>{s.address}</span>
              </li>
              <li className="flex gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-[#FFC21C] shrink-0" />
                <a
                  href={waLink(s.whatsapp, 'Hello Gigatron Sports, I would like to make an enquiry.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FFC21C]"
                >
                  {s.phone}
                </a>
              </li>
              <li className="pt-1">
                <a
                  href={s.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-white/20 rounded-lg px-4 py-2 hover:border-[#FFC21C] hover:text-[#FFC21C]"
                >
                  Get Directions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-between text-xs text-white/40">
          <p>© {new Date().getFullYear()} {s.business_name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-white/80">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white/80">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
