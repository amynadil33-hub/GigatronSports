import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { GIGATRON_LOGO } from '@/lib/gigatron';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Contact', to: '/contact' },
];

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-[#171717] transition-shadow ${
        scrolled ? 'shadow-[0_10px_30px_-16px_rgba(0,0,0,0.8)]' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Gigatron Sports home">
            <img
              src={GIGATRON_LOGO}
              alt="Gigatron Sports"
              className="h-10 sm:h-12 w-auto rounded-md bg-white p-1 object-contain"
            />
            <span className="hidden sm:block leading-none">
              <span className="block font-extrabold tracking-[0.16em] text-white text-sm">
                GIGATRON
              </span>
              <span className="block text-[9px] tracking-[0.14em] text-[#FFC21C] uppercase mt-1">
                Sports
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`relative text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  pathname === n.to ? 'text-[#FFC21C]' : 'text-white/80 hover:text-white'
                }`}
              >
                {n.label}
                {pathname === n.to && (
                  <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#FFC21C]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              className="h-11 w-11 grid place-items-center text-white hover:text-[#FFC21C]"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open cart"
              className="relative h-11 w-11 grid place-items-center text-white hover:text-[#FFC21C]"
            >
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-[#FFC21C] text-[#171717] text-[10px] font-extrabold">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              className="md:hidden h-11 w-11 grid place-items-center text-white"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="pb-4">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search shoes, apparel, brands…"
                aria-label="Search"
                className="flex-1 py-2 outline-none text-sm"
              />
              <button type="submit" className="text-sm font-bold text-[#171717]">
                Search
              </button>
            </div>
          </form>
        )}
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-white/10 bg-[#171717] px-4 pb-4">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="block py-4 text-white font-semibold uppercase tracking-[0.12em] text-sm border-b border-white/5"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
