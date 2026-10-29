import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signIn } from "@/app/admin/actions";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, inputClass } from "@/components/admin/ui";
import { Wordmark } from "@/components/brand/BrandLogo";
import { getAdmin } from "@/lib/menuflex/admin";
import { supabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  missing: "Please enter your email and password.",
  invalid: "That email and password don't match an account.",
  forbidden: "This account isn't a MenuFlex admin.",
  setup: "Supabase isn't configured yet.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdmin()) redirect("/admin/");
  const { error } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Wordmark className="text-[40px]" />
          <p className="mt-4 text-[13px] tracking-[0.2em] text-cream-muted uppercase">Admin</p>
        </div>
        {!supabaseConfigured ? (
          <SetupNotice />
        ) : (
          <form action={signIn} className="space-y-4 rounded-2xl border border-cream/10 bg-night-900 p-6">
            {error && ERRORS[error] && (
              <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[14px] text-red-200">
                {ERRORS[error]}
              </p>
            )}
            <Field label="Email">
              <input type="email" name="email" required autoComplete="username" className={inputClass} />
            </Field>
            <Field label="Password">
              <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
            </Field>
            <SubmitButton className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gold text-[15px] font-semibold text-night-950 hover:bg-gold-bright disabled:opacity-60" pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
