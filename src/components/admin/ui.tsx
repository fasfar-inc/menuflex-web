import type { ReactNode } from "react";

/** Plain building blocks for the admin: dark, quiet, one accent. */

export const inputClass =
  "w-full rounded-lg border border-cream/15 bg-night-950 px-3 py-2 text-[15px] text-cream placeholder:text-cream-muted/70 focus:border-gold focus:outline-none";
export const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-[14px] font-semibold text-night-950 transition-colors hover:bg-gold-bright disabled:opacity-60";
export const quietButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cream/20 px-4 text-[14px] font-medium text-cream transition-colors hover:border-cream/40 disabled:opacity-60";
export const dangerButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-400/40 px-4 text-[14px] font-medium text-red-300 transition-colors hover:bg-red-500/10";
export const smallButtonClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-cream/15 px-2 text-[13px] text-cream-soft transition-colors hover:border-cream/40 hover:text-cream disabled:opacity-40";

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-cream/10 bg-night-900 p-5 sm:p-6">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-[17px] font-semibold text-cream">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-cream-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-cream-muted">{hint}</span>}
    </label>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[12px] font-medium text-emerald-300">Published</span>
  ) : (
    <span className="rounded-full bg-cream/10 px-2.5 py-0.5 text-[12px] font-medium text-cream-soft">Draft</span>
  );
}

const MESSAGES: Record<string, string> = {
  created: "Restaurant created. Fill in its details, then build the menu.",
  saved: "Saved.",
  deleted: "Deleted.",
  published: "Published. The menu is live and the restaurant is listed in Our Work.",
  draft: "Back to draft. The menu is offline and hidden from Our Work.",
  name: "Please enter a name.",
  slug: "The web address may use lowercase letters, numbers and hyphens (2–60 characters), and can't be a reserved one.",
  "slug-taken": "Another restaurant already uses that web address.",
  "category-name": "A category needs both an English and a Turkish name.",
  "dish-name": "A dish needs both an English and a Turkish name.",
  price: "Please enter a valid price, e.g. 450 or 12.50.",
  "image-type": "Images must be JPEG, PNG or WebP.",
  "image-size": "Images must be 5 MB or smaller.",
  "image-read": "That image couldn't be read. Please try another file.",
  "image-upload": "The image couldn't be uploaded. Please try again.",
  missing: "That item no longer exists.",
  save: "Something went wrong while saving. Please try again.",
};

/** The result of the last action, passed back in the address (?ok=… or ?error=…). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  const key = error ?? ok;
  if (!key || !MESSAGES[key]) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-[14px] ${error ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}
    >
      {MESSAGES[key]}
    </p>
  );
}
