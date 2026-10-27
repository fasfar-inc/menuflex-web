import type { ReactNode } from "react";

/** Shared section frame: eyebrow, serif title and optional intro. */
export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  split = false,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  /** Heading beside the content on wide screens instead of above it. */
  split?: boolean;
  className?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={titleId} className={`scroll-mt-6 border-t border-cream/[0.07] ${className}`}>
      <div className={`mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28 ${split ? "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16" : ""}`}>
        <div>
          <p className="text-[12px] font-medium tracking-[0.34em] text-gold uppercase">{eyebrow}</p>
          <h2 id={titleId} className="mt-4 max-w-[20em] font-serif text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.08] font-[450] tracking-[-0.02em] text-cream">
            {title}
          </h2>
          {intro && <p className="mt-5 max-w-[38em] text-[16px] leading-[1.65] font-light text-cream-soft sm:text-[17px]">{intro}</p>}
        </div>
        <div className={split ? "mt-12 lg:mt-0" : "mt-12 lg:mt-16"}>{children}</div>
      </div>
    </section>
  );
}
