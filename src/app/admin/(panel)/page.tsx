import type { Metadata } from "next";
import Link from "next/link";
import { createRestaurant } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Card, Field, Flash, StatusBadge, inputClass } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/menuflex/admin";
import type { RestaurantRow } from "@/lib/menuflex/types";

export const metadata: Metadata = { title: "Restaurants" };

export default async function RestaurantsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { supabase } = await requireAdmin();
  const { ok, error } = await searchParams;
  const { data } = await supabase.from("restaurants").select("id, name, slug, status, updated_at").order("name").returns<Pick<RestaurantRow, "id" | "name" | "slug" | "status" | "updated_at">[]>();
  const restaurants = data ?? [];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] leading-tight text-cream">Restaurants</h1>
          <p className="mt-1 text-[14px] text-cream-muted">Published restaurants are live at their menu address and listed in Our Work.</p>
        </div>
        <a href="#add" className="inline-flex h-10 items-center rounded-lg bg-gold px-4 text-[14px] font-semibold text-night-950 hover:bg-gold-bright">
          Add restaurant
        </a>
      </div>
      <Flash ok={ok} error={error} />

      <Card>
        {restaurants.length === 0 ? (
          <p className="text-[14px] text-cream-muted">No restaurants yet. Add the first one below.</p>
        ) : (
          <ul className="divide-y divide-cream/10">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/restaurants/${r.id}/`} className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:text-gold-bright">
                  <span>
                    <span className="block text-[16px] font-medium text-cream">{r.name}</span>
                    <span className="block text-[13px] text-cream-muted">/m/{r.slug}/</span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div id="add" className="scroll-mt-6">
        <Card title="Add restaurant">
          <form action={createRestaurant} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Name">
              <input name="name" required maxLength={80} placeholder="Kardeşler Lokantası" className={inputClass} />
            </Field>
            <Field label="Web address (optional)" hint="Made from the name if left empty.">
              <input name="slug" maxLength={60} pattern="[a-z0-9\-]*" placeholder="kardesler-lokantasi" className={inputClass} />
            </Field>
            <div className="sm:pb-5">
              <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
