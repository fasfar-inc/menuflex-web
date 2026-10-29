import type { CategoryRow, DishRow } from "@/lib/menuflex/types";
import { imageUrl } from "@/lib/supabase/env";
import { ImageField } from "./ImageField";
import { SubmitButton } from "./SubmitButton";
import { Field, inputClass } from "./ui";

/** Every field of a dish, for adding one or editing it. */
export function DishForm({
  action,
  categories,
  categoryId,
  dish,
  currency,
}: {
  action: (f: FormData) => Promise<void>;
  categories: CategoryRow[];
  categoryId: string;
  dish?: DishRow;
  currency: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (English)">
          <input name="name_en" required maxLength={80} defaultValue={dish?.name_en} className={inputClass} />
        </Field>
        <Field label="Name (Turkish)">
          <input name="name_tr" required maxLength={80} defaultValue={dish?.name_tr} className={inputClass} />
        </Field>
        <Field label="Short description (English)">
          <textarea name="description_en" maxLength={240} rows={2} defaultValue={dish?.description_en} className={inputClass} />
        </Field>
        <Field label="Short description (Turkish)">
          <textarea name="description_tr" maxLength={240} rows={2} defaultValue={dish?.description_tr} className={inputClass} />
        </Field>
        <Field label={`Price (${currency})`}>
          <input name="price" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" defaultValue={dish ? String(Number(dish.price)) : ""} placeholder="450" className={inputClass} />
        </Field>
        <Field label="Category">
          <select name="category_id" defaultValue={dish?.category_id ?? categoryId} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en} / {c.name_tr}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Photo" hint="Dishes with a photo appear on the menu's wheel; without one they're listed in the full menu.">
        <ImageField name="photo" current={dish?.photo_path ? imageUrl(dish.photo_path) : null} removable />
      </Field>
      <label className="flex items-center gap-2 text-[14px] text-cream-soft">
        <input type="checkbox" name="visible" defaultChecked={dish?.visible ?? true} className="h-4 w-4 accent-[#d4a35c]" /> Visible on the menu
      </label>
      <div className="flex justify-end">
        <SubmitButton>{dish ? "Save dish" : "Add dish"}</SubmitButton>
      </div>
    </form>
  );
}
