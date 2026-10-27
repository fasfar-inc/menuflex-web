import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createCategory, createDish, deleteCategory, deleteDish, move, setDishVisible, updateCategory, updateDish } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { DishForm } from "@/components/admin/DishForm";
import { RestaurantTabs } from "@/components/admin/RestaurantTabs";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Card, Field, Flash, inputClass, smallButtonClass } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/menuflex/admin";
import { formatPrice } from "@/lib/menuflex/menu";
import { CATEGORY_ICONS, type CategoryRow, type DishRow, type RestaurantRow } from "@/lib/menuflex/types";
import { imageUrl } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Menu" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

const ICON_LABEL: Record<string, string> = { starters: "Leaf", fish: "Fish", meat: "Meat", desserts: "Dessert", drinks: "Glass" };

function CategoryFields({ c }: { c?: CategoryRow }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Name (English)">
        <input name="name_en" required maxLength={40} defaultValue={c?.name_en} className={inputClass} />
      </Field>
      <Field label="Name (Turkish)">
        <input name="name_tr" required maxLength={40} defaultValue={c?.name_tr} className={inputClass} />
      </Field>
      <Field label="Icon">
        <select name="icon" defaultValue={c?.icon ?? "starters"} className={inputClass}>
          {CATEGORY_ICONS.map((i) => (
            <option key={i} value={i}>
              {ICON_LABEL[i]}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

export default async function MenuPage({ params, searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const { data: r } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle<RestaurantRow>();
  if (!r) notFound();
  const [{ data: cats }, { data: allDishes }] = await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id", id).order("position").order("created_at").returns<CategoryRow[]>(),
    supabase.from("dishes").select("*").eq("restaurant_id", id).order("position").order("created_at").returns<DishRow[]>(),
  ]);
  const categories = cats ?? [];
  const dishes = allDishes ?? [];

  return (
    <>
      <RestaurantTabs restaurant={r} current="menu" />
      <Flash ok={ok} error={error} />

      {categories.length === 0 && <p className="text-[14px] text-cream-muted">Start with a category, such as Starters, then add its dishes.</p>}

      {categories.map((c, ci) => {
        const inCategory = dishes.filter((d) => d.category_id === c.id);
        return (
          <div key={c.id} id={`category-${c.id}`} className="scroll-mt-6">
            <Card
              title={`${c.name_en} / ${c.name_tr}`}
              actions={
                <div className="flex flex-wrap items-center gap-1.5">
                  <form action={move.bind(null, r.id, "category", c.id, -1)}>
                    <button type="submit" disabled={ci === 0} aria-label="Move category up" className={smallButtonClass}>
                      ↑
                    </button>
                  </form>
                  <form action={move.bind(null, r.id, "category", c.id, 1)}>
                    <button type="submit" disabled={ci === categories.length - 1} aria-label="Move category down" className={smallButtonClass}>
                      ↓
                    </button>
                  </form>
                  <form action={deleteCategory.bind(null, r.id, c.id)}>
                    <ConfirmButton message={`Delete ${c.name_en} and its ${inCategory.length} dishes?`} className={`${smallButtonClass} text-red-300`}>
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              }
            >
              <details className="mb-4">
                <summary className="cursor-pointer text-[13px] text-cream-muted hover:text-cream">Edit category</summary>
                <form action={updateCategory.bind(null, r.id, c.id)} className="mt-3 space-y-4">
                  <CategoryFields c={c} />
                  <div className="flex justify-end">
                    <SubmitButton>Save category</SubmitButton>
                  </div>
                </form>
              </details>

              {inCategory.length === 0 ? (
                <p className="text-[14px] text-cream-muted">No dishes yet.</p>
              ) : (
                <ul className="divide-y divide-cream/10 border-y border-cream/10">
                  {inCategory.map((d, di) => (
                    <li key={d.id} id={`dish-${d.id}`} className="scroll-mt-6 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {d.photo_path ? (
                          // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail straight from storage
                          <img src={imageUrl(d.photo_path)} alt="" className="h-12 w-12 shrink-0 rounded-full border border-cream/15 object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-cream/20 text-[10px] text-cream-muted">
                            No photo
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-[15px] font-medium ${d.visible ? "text-cream" : "text-cream-muted line-through"}`}>
                            {d.name_en} <span className="font-normal text-cream-muted">/ {d.name_tr}</span>
                          </p>
                          <p className="text-[13px] text-cream-muted">
                            {formatPrice(d.price, r.currency)}
                            {!d.visible && " · hidden"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <form action={move.bind(null, r.id, "dish", d.id, -1)}>
                            <button type="submit" disabled={di === 0} aria-label="Move dish up" className={smallButtonClass}>
                              ↑
                            </button>
                          </form>
                          <form action={move.bind(null, r.id, "dish", d.id, 1)}>
                            <button type="submit" disabled={di === inCategory.length - 1} aria-label="Move dish down" className={smallButtonClass}>
                              ↓
                            </button>
                          </form>
                          <form action={setDishVisible.bind(null, r.id, d.id, !d.visible)}>
                            <button type="submit" className={smallButtonClass}>
                              {d.visible ? "Hide" : "Show"}
                            </button>
                          </form>
                          <form action={deleteDish.bind(null, r.id, d.id)}>
                            <ConfirmButton message={`Delete ${d.name_en}?`} className={`${smallButtonClass} text-red-300`}>
                              Delete
                            </ConfirmButton>
                          </form>
                        </div>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[13px] text-cream-muted hover:text-cream">Edit dish</summary>
                        <div className="mt-3">
                          <DishForm action={updateDish.bind(null, r.id, d.id)} categories={categories} categoryId={c.id} dish={d} currency={r.currency} />
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}

              <details className="mt-4 rounded-xl border border-cream/10 p-4">
                <summary className="cursor-pointer text-[14px] font-medium text-gold-bright">+ Add dish to {c.name_en}</summary>
                <div className="mt-4">
                  <DishForm action={createDish.bind(null, r.id)} categories={categories} categoryId={c.id} currency={r.currency} />
                </div>
              </details>
            </Card>
          </div>
        );
      })}

      <Card title="Add category">
        <form action={createCategory.bind(null, r.id)} className="space-y-4">
          <CategoryFields />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Adding…">Add category</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
