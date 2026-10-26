import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 24" aria-hidden="true" className={className}>
      <path d="M0 2a2 2 0 0 1 2-2h11l7 7v15a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Z" fill="currentColor" />
      <path d="M13 0v5a2 2 0 0 0 2 2h5" fill="#5a554c" />
      <rect x="4" y="13" width="7" height="1.4" rx=".7" fill="#f3ece1" />
      <rect x="4" y="16.4" width="5" height="1.4" rx=".7" fill="#f3ece1" />
    </svg>
  );
}

export function BrandLogo() {
  return (
    <Link href="/" aria-label="MenuFlex home" className="flex items-center gap-3 text-ink">
      <BrandMark className="h-[26px] w-[21px]" />
      <span className="font-serif text-[26px] leading-none font-medium tracking-[-0.02em]">
        Menu<span className="text-coral">Flex</span>
      </span>
    </Link>
  );
}
