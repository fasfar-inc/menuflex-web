"use client";

import { useState } from "react";
import { inputClass } from "./ui";

/**
 * An image picker for a form. It previews the chosen file and records its
 * pixel size in hidden fields (`<name>_width`, `<name>_height`), which the
 * menu needs to show the photo at its own proportions.
 */
export function ImageField({ name, current, removable }: { name: string; current?: string | null; removable?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [size, setSize] = useState({ w: "", h: "" });
  const [error, setError] = useState("");
  const shown = preview ?? current ?? null;
  return (
    <div className="flex flex-wrap items-start gap-4">
      {shown && (
        // eslint-disable-next-line @next/next/no-img-element -- a local preview or a storage URL, shown as is
        <img src={shown} alt="" className="h-20 w-20 rounded-lg border border-cream/15 object-cover" />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-cream/10 file:px-3 file:py-1 file:text-cream`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setError("");
            if (!file) {
              setPreview(null);
              setSize({ w: "", h: "" });
              return;
            }
            if (file.size > 5 * 1024 * 1024) {
              setError("This file is larger than 5 MB.");
              e.target.value = "";
              return;
            }
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => setSize({ w: String(img.naturalWidth), h: String(img.naturalHeight) });
            img.onerror = () => setError("This image couldn't be read.");
            img.src = url;
            setPreview(url);
          }}
        />
        <input type="hidden" name={`${name}_width`} value={size.w} />
        <input type="hidden" name={`${name}_height`} value={size.h} />
        <p className="text-[12px] text-cream-muted">JPEG, PNG or WebP, up to 5 MB.</p>
        {error && <p className="text-[12px] text-red-300">{error}</p>}
        {removable && current && !preview && (
          <label className="flex items-center gap-2 text-[13px] text-cream-soft">
            <input type="checkbox" name={`${name}_remove`} className="h-4 w-4 accent-[#d4a35c]" /> Remove the current image
          </label>
        )}
      </div>
    </div>
  );
}
