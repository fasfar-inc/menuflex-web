/**
 * Supabase project settings. Both are public by design (the anon key only
 * grants what row level security allows); nothing secret is read here.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/** False until both are set; the admin then explains what to configure and the public site uses its built-in content. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Bucket holding dish photos and restaurant logos (see the migration). */
export const IMAGE_BUCKET = "menu-images";

/** Public address of a file in the image bucket. */
export function imageUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
