import { Product } from '@/lib/gigatron';

const COLOURS: Record<string, string> = {
  black: '#171717',
  blue: '#2563EB',
  gold: '#D6A52A',
  green: '#16A34A',
  maroon: '#7F1D1D',
  orange: '#F97316',
  peach: '#FB7185',
  pink: '#EC4899',
  purple: '#7C3AED',
  red: '#DC2626',
  silver: '#94A3B8',
  violet: '#8B5CF6',
  white: '#F8FAFC',
  yellow: '#FACC15',
};

function productColours(product: Product) {
  const value = String(product.metadata?.Colour || product.metadata?.Color || '').toLowerCase();
  const matches = Object.entries(COLOURS)
    .filter(([name]) => value.includes(name))
    .map(([, colour]) => colour);
  return matches.length ? matches.slice(0, 3) : ['#FFC21C', '#171717'];
}

export default function ProductArtwork({ product, className = '' }: { product: Product; className?: string }) {
  const colours = productColours(product);
  const primary = colours[0];
  const secondary = colours[1] || (primary === '#F8FAFC' ? '#CBD5E1' : '#F8FAFC');
  const accent = colours[2] || '#FFC21C';
  const background = `radial-gradient(circle at 72% 20%, ${accent}44 0, transparent 34%), linear-gradient(145deg, ${primary}22, ${secondary}55)`;

  return (
    <div
      role="img"
      aria-label={`${product.name} product artwork`}
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background }}
    >
      <div className="absolute inset-0 hex-grid opacity-20" aria-hidden="true" />
      <svg viewBox="0 0 640 500" className="relative h-full w-full drop-shadow-[0_24px_24px_rgba(0,0,0,0.22)]" aria-hidden="true">
        <path
          d="M124 304c30-24 63-63 79-111l25-76c4-13 18-19 30-13l63 31c17 8 33 18 46 31l79 76c20 19 46 31 74 33l50 4c24 2 42 22 42 46v24c0 27-22 49-49 49H135c-42 0-75-35-72-76 2-26 26-32 61-18Z"
          fill={primary}
          stroke="#111827"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path d="M97 342h481v36c0 18-15 33-33 33H133c-24 0-43-19-43-43v-12c0-8 3-12 7-14Z" fill="#F8FAFC" stroke="#111827" strokeWidth="9" />
        <path d="m232 139 101 49 102 97-83 10-72-66-78-36Z" fill={secondary} opacity=".9" />
        <path d="m245 181 101 49M225 217l101 49M208 253l96 43" stroke="#111827" strokeWidth="10" strokeLinecap="round" opacity=".7" />
        <path d="M381 270c38-1 71 10 100 34" fill="none" stroke={accent} strokeWidth="18" strokeLinecap="round" />
        <path d="M165 411v24M286 411v24M430 411v24M540 411v24" stroke="#111827" strokeWidth="13" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        Football boot
      </span>
    </div>
  );
}
