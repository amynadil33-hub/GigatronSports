import { Plus, Trash2 } from 'lucide-react';

export interface SpecRow {
  key: string;
  value: string;
}

const input =
  'w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/30';

/** Key/value editor that serialises into the ecom_products.metadata JSONB column. */
export default function SpecsEditor({
  rows,
  onChange,
}: {
  rows: SpecRow[];
  onChange: (next: SpecRow[]) => void;
}) {
  const update = (i: number, patch: Partial<SpecRow>) =>
    onChange(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={input}
            placeholder="Specification (e.g. Bluetooth)"
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
          />
          <input
            className={input}
            placeholder="Value (e.g. 5.3)"
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, n) => n !== i))}
            aria-label="Remove specification"
            className="shrink-0 h-11 w-11 grid place-items-center rounded-lg border border-neutral-300 text-neutral-400 hover:text-[#FF1717] hover:border-[#FF1717]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-sm text-neutral-400">
          No specifications yet. Add rows like “Battery Life / Up to 24 hours”.
        </p>
      )}
      <button
        type="button"
        onClick={() => onChange([...rows, { key: '', value: '' }])}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#171717] hover:text-[#FFC21C]"
      >
        <Plus className="w-4 h-4" /> Add specification
      </button>
    </div>
  );
}
