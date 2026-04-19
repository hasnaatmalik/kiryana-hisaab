import { useState, useRef } from "react";
import { db, type Item } from "@/db";
import { useUI } from "@/store";
import { X, ImagePlus } from "lucide-react";

interface Props {
  initial?: Item | null;
  onClose: () => void;
}

const compressImage = (file: File, maxSize = 320): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const AddItemModal = ({ initial, onClose }: Props) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [emoji, setEmoji] = useState(initial?.emoji ?? "📦");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.image_url);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const showFlash = useUI((s) => s.showFlash);

  const handleFile = async (f: File) => {
    setBusy(true);
    try {
      const data = await compressImage(f);
      setImageUrl(data);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const p = parseFloat(price);
    if (!name.trim() || !p || p <= 0) return;
    const payload = {
      name: name.trim(),
      price: p,
      emoji: emoji || "📦",
      category: initial?.category ?? "grocery",
      description: description.trim(),
      image_url: imageUrl,
    };
    if (initial?.id) {
      await db.items.update(initial.id, payload);
      showFlash("Item update ho gaya!");
    } else {
      await db.items.add(payload);
      showFlash("Item add ho gaya!");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-md border-t-2 sm:border-2 border-ink p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{initial ? "Item edit karein" : "Naya Item"}</h2>
          <button onClick={onClose} className="h-10 w-10 grid place-items-center border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-24 w-24 shrink-0 border-2 border-ink bg-paper grid place-items-center overflow-hidden relative"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="text-[10px] mt-1">Photo</span>
              </div>
            )}
            {busy && <div className="absolute inset-0 grid place-items-center bg-background/60 text-xs">…</div>}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex-1 space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Emoji (fallback)</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
              className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none text-2xl text-center"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="text-xs text-udhaar font-semibold underline"
              >
                Photo hatao
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Naam</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Price (Rs.)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            inputMode="numeric"
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none num font-bold text-lg"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-paper border-2 border-ink px-3 py-2 outline-none text-sm"
            placeholder="Saaiz, brand, ya zaroori notes…"
          />
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full h-14 bg-ink text-background border-2 border-ink font-bold text-lg active:translate-y-px disabled:opacity-50"
        >
          {initial ? "Update Karo" : "Save Karo"}
        </button>
      </div>
    </div>
  );
};
