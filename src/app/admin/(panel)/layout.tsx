import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { quietButtonClass } from "@/components/admin/ui";
import { Wordmark } from "@/components/brand/BrandLogo";
import { requireAdmin } from "@/lib/menuflex/admin";

/** The signed-in admin's frame. Each page and action checks the admin role again on its own. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-cream/10 bg-night-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin/" className="flex items-baseline gap-3">
            <Wordmark className="text-[26px]" />
            <span className="text-[12px] tracking-[0.2em] text-cream-muted uppercase">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-cream-muted sm:inline">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className={quietButtonClass}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
