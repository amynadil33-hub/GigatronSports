import { Plus, Trash2 } from 'lucide-react';

export interface VariantRow {
  id?: string;
  title: string;
  sku: string;
  priceMVR: string;
  stock: string;
  _delete?: boolean;
}

const input =
  'w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FFC21C] focus:ring-2 focus:ring-[#FFC21C]/30';

/** Editor for ecom_product_variants rows (option value, price, SKU, stock). */
export default function VariantsEditor({
  optionName,
  onOptionNameChange,
  rows,
  onChange,
}: {
  optionName: string;
  onOptionNameChange: (v: string) => void;
  rows: VariantRow[];
  onChange: (next: VariantRow[]) => void;
}) {
  const update = (i: number, patch: Partial<VariantRow>) =>
    onChange(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  const visible = rows.filter((r) => !r._delete);

  const remove = (row: VariantRow) => {
    if (row.id) {
      onChange(rows.map((r) => (r === row ? { ...r, _delete: true } : r)));
    } else {
      onChange(rows.filter((r) => r !== row));
    }
  };

  return (
    <div>
      <div className="max-w-xs mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
          Option name
        </label>
        <input
          className={input}
          placeholder="Colour, Storage, Size…"
          value={optionName}
          onChange={(e) => onOptionNameChange(e.target.value)}
        />
      </div>

      <div className="hidden sm:grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_44px] gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        <span>Option value</span>
        <span>SKU</span>
        <span>Price (MVR)</span>
        <span>Stock</span>
        <span />
      </div>

      <div className="space-y-2">
        {visible.map((row) => {
          const i = rows.indexOf(row);
          return (
            <div key={row.id || i} className="grid sm:grid-cols-[1.4fr_1.2fr_1fr_0.8fr_44px] gap-2">
              <input
                className={input}
                placeholder="e.g. Black"
                value={row.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
              <input
                className={input}
                placeholder="SKU"
                value={row.sku}
                onChange={(e) => update(i, { sku: e.target.value })}
              />
              <input
                className={input}
                type="number"
                placeholder="0"
                value={row.priceMVR}
                onChange={(e) => update(i, { priceMVR: e.target.value })}
              />
              <input
                className={input}
                type="number"
                placeholder="0"
                value={row.stock}
                onChange={(e) => update(i, { stock: e.target.value })}
              />
              <button
                type="button"
                onClick={() => remove(row)}
                aria-label="Remove variant"
                className="h-11 w-11 grid place-items-center rounded-lg border border-neutral-300 text-neutral-400 hover:text-[#FF1717] hover:border-[#FF1717]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-neutral-400 mt-2">
          No variants yet. Add one row per purchasable option.
        </p>
      )}

      <button
        type="button"
        onClick={() => onChange([...rows, { title: '', sku: '', priceMVR: '', stock: '0' }])}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#171717] hover:text-[#FFC21C]"
      >
        <Plus className="w-4 h-4" /> Add variant
      </button>
    </div>
  );
}
