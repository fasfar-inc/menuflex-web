import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "dark";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-coral text-white shadow-[0_14px_30px_-12px_rgba(224,100,75,0.65)] hover:bg-coral-deep",
  outline:
    "border border-ink/25 bg-white/35 text-ink backdrop-blur-sm hover:border-ink/60 hover:bg-white/60",
  dark: "bg-ink text-ivory-50 hover:bg-black",
};

const sizes: Record<Size, string> = {
  md: "h-[46px] px-6 text-[15px]",
  lg: "h-[58px] px-8 text-[17px]",
};

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function Button({ href, children, variant = "primary", size = "lg", className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-3 rounded-full font-medium tracking-[-0.01em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}
