import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { navLinks } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-[94px] max-w-[1680px] items-center justify-between px-5 sm:px-8 lg:px-[10%]">
        <BrandLogo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-12 text-[15px] text-ink-soft">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-3 text-[13px] font-medium tracking-[0.14em] sm:flex">
            <button type="button" className="text-ink-muted transition-colors hover:text-ink">
              TR
            </button>
            <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
            <button type="button" aria-current="true" className="text-ink">
              EN
            </button>
          </div>
          <div className="hidden sm:block">
            <Button href="#get-started" variant="dark" size="md">
              Digitalize My Menu
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
