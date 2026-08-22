import { useRef, useState } from 'react';
import { Upload, X, Star, GripVertical, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Multi-image manager: uploads to the `product-images` bucket,
 * supports drag-to-reorder and choosing the primary image (index 0).
 */
export default function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const dragIndex = useRef<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(
        /[^\w.-]/g,
        ''
      )}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      if (data?.publicUrl) uploaded.push(data.publicUrl);
    }
    if (uploaded.length) onChange([...images, ...uploaded]);
    setUploading(false);
  };

  const remove = (i: number) => onChange(images.filter((_, n) => n !== i));

  const makePrimary = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    const [item] = next.splice(i, 1);
    onChange([item, ...next]);
  };

  const onDrop = (target: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === target) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    onChange([...images, v]);
    setUrlInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img + i}
            draggable
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            className={`relative w-28 h-28 rounded-xl border-2 bg-[#F7F7F5] p-2 cursor-move group ${
              i === 0 ? 'border-[#FFC21C]' : 'border-neutral-200'
            }`}
          >
            <img src={img} alt={`Product image ${i + 1}`} className="w-full h-full object-contain" />
            <GripVertical className="absolute bottom-1 left-1 w-3.5 h-3.5 text-neutral-400" />
            {i === 0 && (
              <span className="absolute bottom-1 right-1 text-[9px] font-black uppercase tracking-wider text-[#171717] bg-[#FFC21C] rounded px-1.5 py-0.5">
                Primary
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove image"
              className="absolute -top-2 -right-2 h-6 w-6 grid place-items-center rounded-full bg-[#171717] text-white opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {i !== 0 && (
              <button
                type="button"
                onClick={() => makePrimary(i)}
                aria-label="Set as primary image"
                title="Set as primary"
                className="absolute -top-2 -left-2 h-6 w-6 grid place-items-center rounded-full bg-white border border-neutral-300 opacity-0 group-hover:opacity-100 transition"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        <label className="w-28 h-28 rounded-xl border-2 border-dashed border-neutral-300 grid place-items-center cursor-pointer hover:border-[#FFC21C] text-neutral-400 hover:text-[#171717]">
          <div className="text-center">
            <Upload className="w-5 h-5 mx-auto" />
            <span className="block text-[10px] font-bold uppercase tracking-wider mt-1">
              {uploading ? 'Uploading…' : 'Upload'}
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex-1 flex items-center gap-2 border border-neutral-300 rounded-lg px-3">
          <Link2 className="w-4 h-4 text-neutral-400" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="…or paste an image URL"
            className="flex-1 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="px-4 py-2.5 rounded-lg border border-neutral-300 text-sm font-bold hover:border-neutral-900"
        >
          Add
        </button>
      </div>

      <p className="mt-2 text-xs text-neutral-400">
        Drag images to reorder. The first image is used as the primary product image.
      </p>
      {error && <p className="mt-1 text-xs text-[#FF1717]">{error}</p>}
    </div>
  );
}
