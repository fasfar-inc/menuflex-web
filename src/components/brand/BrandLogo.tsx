import Link from "next/link";

/** Gold MenuFlex wordmark with its smile underline. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block font-display leading-none font-semibold tracking-[-0.01em] text-gold ${className}`}>
      MenuFlex
      <svg viewBox="0 0 100 12" aria-hidden="true" className="absolute top-[100%] left-[22%] h-[0.26em] w-[48%] overflow-visible" fill="none">
        <path d="M2 2.5C22 11 66 12 98 1.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function BrandLogo({ href = "/", label = "MenuFlex" }: { href?: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className="inline-flex pb-[0.35em] text-[30px] transition-opacity hover:opacity-85 sm:text-[38px] xl:text-[calc(var(--u)*47)]">
      <Wordmark />
    </Link>
  );
}
