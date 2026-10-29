"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/menuflex/admin";
import { CATEGORY_ICONS, CURRENCIES, RESERVED_SLUGS, type CategoryIconName, type Currency } from "@/lib/menuflex/types";
import { IMAGE_BUCKET, supabaseConfigured } from "@/lib/supabase/env";
import { PUBLIC_DATA_TAG, createSupabaseServer } from "@/lib/supabase/server";

// Every action re-checks the admin role on the server before touching data,
// and every query runs under the admin's own row level security as well.

type Db = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE = 5 * 1024 * 1024;

const text = (f: FormData, key: string, max: number) => String(f.get(key) ?? "").trim().slice(0, max);
const back = (path: string, params: Record<string, string>) => redirect(`${path}?${new URLSearchParams(params)}`);

/** Lowercase, hyphenated, ASCII: "Kardeşler Lokantası" → "kardesler-lokantasi". */
function slugify(s: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return s
    .trim()
    .replace(/[çğıİöşüâîû]/gi, (c) => map[c] ?? map[c.toLowerCase()] ?? c)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** Refresh the public pages a change shows up on: the menu, Our Work and the QR redirect. */
async function refreshPublic(db: Db, restaurantId: string, alsoSlug?: string) {
  const { data } = await db.from("restaurants").select("slug").eq("id", restaurantId).maybeSingle<{ slug: string }>();
  revalidateTag(PUBLIC_DATA_TAG);
  for (const slug of [data?.slug, alsoSlug]) if (slug) revalidatePath(`/m/${slug}/`);
  revalidatePath("/");
  revalidatePath("/tr/");
}

/** Upload a submitted image, if any, into the restaurant's folder. Returns its path and size, or an error. */
async function uploadImage(db: Db, restaurantId: string, f: FormData, field: string) {
  const file = f.get(field);
  if (!(file instanceof File) || file.size === 0) return { none: true as const };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "image-type" };
  if (file.size > MAX_IMAGE) return { error: "image-size" };
  const width = Number(f.get(`${field}_width`));
  const height = Number(f.get(`${field}_height`));
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20000 || height > 20000)
    return { error: "image-read" };
  const path = `restaurants/${restaurantId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return { error: "image-upload" };
  return { path, width, height };
}

async function removeImage(db: Db, path: string | null | undefined) {
  if (path) await db.storage.from(IMAGE_BUCKET).remove([path]);
}

// ---------------------------------------------------------------------------
// Signing in and out
// ---------------------------------------------------------------------------

export async function signIn(f: FormData) {
  if (!supabaseConfigured) back("/admin/login/", { error: "setup" });
  const email = text(f, "email", 200);
  const password = String(f.get("password") ?? "");
  if (!email || !password) back("/admin/login/", { error: "missing" });
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) back("/admin/login/", { error: "invalid" });
  // signed in, but only MenuFlex admins may stay
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user!.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    back("/admin/login/", { error: "forbidden" });
  }
  redirect("/admin/");
}

export async function signOut() {
  if (supabaseConfigured) await (await createSupabaseServer()).auth.signOut();
  redirect("/admin/login/");
}

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------

export async function createRestaurant(f: FormData) {
  const { supabase } = await requireAdmin();
  const name = text(f, "name", 80);
  const slug = slugify(text(f, "slug", 60) || name);
  if (!name) back("/admin/", { error: "name" });
  if (!SLUG.test(slug) || RESERVED_SLUGS.includes(slug)) back("/admin/", { error: "slug" });
  const { data, error } = await supabase.from("restaurants").insert({ name, slug }).select("id").single<{ id: string }>();
  if (error) back("/admin/", { error: error.code === "23505" ? "slug-taken" : "save" });
  redirect(`/admin/restaurants/${data!.id}/?ok=created`);
}

export async function updateRestaurant(id: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${id}/`;
  const { data: before } = await supabase.from("restaurants").select("slug, logo_path").eq("id", id).maybeSingle<{ slug: string; logo_path: string | null }>();
  if (!before) back("/admin/", { error: "missing" });

  const slug = slugify(text(f, "slug", 60));
  const currency = text(f, "currency", 3) as Currency;
  const accent = text(f, "accent_color", 7);
  const background = text(f, "background_color", 7);
  const whatsapp = text(f, "whatsapp", 20).replace(/\D/g, "");
  const locale = text(f, "default_locale", 2);
  const fields = {
    name: text(f, "name", 80),
    slug,
    subtitle_en: text(f, "subtitle_en", 80),
    subtitle_tr: text(f, "subtitle_tr", 80),
    accent_color: HEX.test(accent) ? accent : "#f6d9a5",
    background_color: HEX.test(background) ? background : "#0d0b09",
    phone: text(f, "phone", 40),
    whatsapp,
    email: text(f, "email", 120),
    address: text(f, "address", 200),
    instagram: text(f, "instagram", 60).replace(/^@/, ""),
    currency: CURRENCIES.includes(currency) ? currency : "TRY",
    default_locale: locale === "en" ? "en" : "tr",
  };
  if (!fields.name) back(here, { error: "name" });
  if (!SLUG.test(slug) || RESERVED_SLUGS.includes(slug)) back(here, { error: "slug" });

  const logo = await uploadImage(supabase, id, f, "logo");
  if ("error" in logo) back(here, { error: logo.error! });
  const removeLogo = f.get("logo_remove") === "on";
  const logoFields = "path" in logo ? { logo_path: logo.path, logo_width: logo.width, logo_height: logo.height } : removeLogo ? { logo_path: null, logo_width: null, logo_height: null } : {};

  const { error } = await supabase.from("restaurants").update({ ...fields, ...logoFields }).eq("id", id);
  if (error) {
    if ("path" in logo) await removeImage(supabase, logo.path);
    back(here, { error: error.code === "23505" ? "slug-taken" : "save" });
  }
  if ("path" in logo || removeLogo) await removeImage(supabase, before!.logo_path);
  await refreshPublic(supabase, id, before!.slug);
  back(here, { ok: "saved" });
}

export async function setStatus(id: string, status: "draft" | "published") {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("restaurants").update({ status }).eq("id", id);
  if (error) back(`/admin/restaurants/${id}/`, { error: "save" });
  await refreshPublic(supabase, id);
  back(`/admin/restaurants/${id}/`, { ok: status });
}

export async function deleteRestaurant(id: string) {
  const { supabase } = await requireAdmin();
  const { data: r } = await supabase.from("restaurants").select("slug").eq("id", id).maybeSingle<{ slug: string }>();
  const { data: files } = await supabase.storage.from(IMAGE_BUCKET).list(`restaurants/${id}`, { limit: 1000 });
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) back(`/admin/restaurants/${id}/`, { error: "save" });
  if (files?.length) await supabase.storage.from(IMAGE_BUCKET).remove(files.map((x) => `restaurants/${id}/${x.name}`));
  revalidateTag(PUBLIC_DATA_TAG);
  if (r) revalidatePath(`/m/${r.slug}/`);
  revalidatePath("/");
  revalidatePath("/tr/");
  back("/admin/", { ok: "deleted" });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function categoryFields(f: FormData) {
  const icon = text(f, "icon", 20) as CategoryIconName;
  return {
    name_en: text(f, "name_en", 40),
    name_tr: text(f, "name_tr", 40),
    icon: CATEGORY_ICONS.includes(icon) ? icon : "starters",
  };
}

export async function createCategory(restaurantId: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${restaurantId}/menu/`;
  const fields = categoryFields(f);
  if (!fields.name_en || !fields.name_tr) back(here, { error: "category-name" });
  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId);
  const { error } = await supabase.from("categories").insert({ ...fields, restaurant_id: restaurantId, position: count ?? 0 });
  if (error) back(here, { error: "save" });
  await refreshPublic(supabase, restaurantId);
  back(here, { ok: "saved" });
}

export async function updateCategory(restaurantId: string, id: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${restaurantId}/menu/`;
  const fields = categoryFields(f);
  if (!fields.name_en || !fields.name_tr) back(here, { error: "category-name" });
  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) back(here, { error: "save" });
  await refreshPublic(supabase, restaurantId);
  back(here, { ok: "saved" });
}

export async function deleteCategory(restaurantId: string, id: string) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${restaurantId}/menu/`;
  const { data: photos } = await supabase.from("dishes").select("photo_path").eq("category_id", id).returns<{ photo_path: string | null }[]>();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) back(here, { error: "save" });
  const paths = (photos ?? []).map((p) => p.photo_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  await refreshPublic(supabase, restaurantId);
  back(here, { ok: "deleted" });
}

export async function move(restaurantId: string, kind: "category" | "dish", id: string, direction: -1 | 1) {
  const { supabase } = await requireAdmin();
  await supabase.rpc("menuflex_move", { kind, item: id, direction });
  await refreshPublic(supabase, restaurantId);
  redirect(`/admin/restaurants/${restaurantId}/menu/#${kind}-${id}`);
}

// ---------------------------------------------------------------------------
// Dishes
// ---------------------------------------------------------------------------

function dishFields(f: FormData) {
  const price = Number(text(f, "price", 12).replace(/\s/g, "").replace(",", "."));
  return {
    name_en: text(f, "name_en", 80),
    name_tr: text(f, "name_tr", 80),
    description_en: text(f, "description_en", 240),
    description_tr: text(f, "description_tr", 240),
    price: Number.isFinite(price) && price >= 0 && price < 1e8 ? Math.round(price * 100) / 100 : NaN,
    visible: f.get("visible") === "on",
    category_id: text(f, "category_id", 36),
  };
}

export async function createDish(restaurantId: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${restaurantId}/menu/`;
  const fields = dishFields(f);
  if (!fields.name_en || !fields.name_tr) back(here, { error: "dish-name" });
  if (Number.isNaN(fields.price)) back(here, { error: "price" });
  const photo = await uploadImage(supabase, restaurantId, f, "photo");
  if ("error" in photo) back(here, { error: photo.error! });
  const { count } = await supabase.from("dishes").select("id", { count: "exact", head: true }).eq("category_id", fields.category_id);
  const { error } = await supabase.from("dishes").insert({
    ...fields,
    position: count ?? 0,
    ...("path" in photo ? { photo_path: photo.path, photo_width: photo.width, photo_height: photo.height } : {}),
  });
  if (error) {
    if ("path" in photo) await removeImage(supabase, photo.path);
    back(here, { error: "save" });
  }
  await refreshPublic(supabase, restaurantId);
  back(here, { ok: "saved" });
}

export async function updateDish(restaurantId: string, id: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${restaurantId}/menu/`;
  const fields = dishFields(f);
  if (!fields.name_en || !fields.name_tr) back(here, { error: "dish-name" });
  if (Number.isNaN(fields.price)) back(here, { error: "price" });
  const { data: before } = await supabase.from("dishes").select("photo_path").eq("id", id).maybeSingle<{ photo_path: string | null }>();
  const photo = await uploadImage(supabase, restaurantId, f, "photo");
  if ("error" in photo) back(here, { error: photo.error! });
  const removePhoto = f.get("photo_remove") === "on";
  const photoFields =
    "path" in photo
      ? { photo_path: photo.path, photo_width: photo.width, photo_height: photo.height }
      : removePhoto
        ? { photo_path: null, photo_width: null, photo_height: null }
        : {};
  const { error } = await supabase.from("dishes").update({ ...fields, ...photoFields }).eq("id", id);
  if (error) {
    if ("path" in photo) await removeImage(supabase, photo.path);
    back(here, { error: "save" });
  }
  if ("path" in photo || removePhoto) await removeImage(supabase, before?.photo_path);
  await refreshPublic(supabase, restaurantId);
  redirect(`${here}?ok=saved#dish-${id}`);
}

export async function setDishVisible(restaurantId: string, id: string, visible: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("dishes").update({ visible }).eq("id", id);
  await refreshPublic(supabase, restaurantId);
  redirect(`/admin/restaurants/${restaurantId}/menu/#dish-${id}`);
}

export async function deleteDish(restaurantId: string, id: string) {
  const { supabase } = await requireAdmin();
  const here = `/admin/restaurants/${restaurantId}/menu/`;
  const { data: before } = await supabase.from("dishes").select("photo_path").eq("id", id).maybeSingle<{ photo_path: string | null }>();
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) back(here, { error: "save" });
  await removeImage(supabase, before?.photo_path);
  await refreshPublic(supabase, restaurantId);
  back(here, { ok: "deleted" });
}
