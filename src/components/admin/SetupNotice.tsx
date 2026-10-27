/** Shown in the admin until Supabase is configured. Names what's needed, never any value. */
export function SetupNotice() {
  return (
    <div className="space-y-3 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-[14px] leading-relaxed text-cream-soft">
      <p className="font-semibold text-cream">Supabase isn&rsquo;t configured yet.</p>
      <p>
        Set <code className="text-gold-bright">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-gold-bright">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in the hosting environment (or{" "}
        <code>.env.local</code>), run the migration in <code>supabase/migrations</code>, and add the first admin. The README&rsquo;s
        &ldquo;Admin dashboard&rdquo; section lists every step.
      </p>
    </div>
  );
}
