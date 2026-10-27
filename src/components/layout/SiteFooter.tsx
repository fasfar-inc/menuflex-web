import { BrandLogo } from "@/components/brand/BrandLogo";
import type { Dictionary } from "@/i18n/dictionaries";

export function SiteFooter({ t, home }: { t: Dictionary; home: string }) {
  return (
    <footer className="border-t border-cream/[0.07]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <BrandLogo href={home} />
        <p className="text-[13px] text-cream-muted">
          © {new Date().getFullYear()} MenuFlex. {t.footer.rights} {t.footer.product}
        </p>
      </div>
    </footer>
  );
}
