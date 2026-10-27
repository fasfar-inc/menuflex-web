import type { CategoryIcon as CategoryIconName } from "@/content/menus/types";

type P = { className?: string };
const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Fine line icons for each category (emblem cards and the full-menu list). */
export function CategoryIcon({ name, className = "h-6 w-6" }: P & { name: CategoryIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line}>
      {name === "starters" && (
        <>
          <path d="M20 4C11 4 5 9 5 16c0 1.5.4 2.8 1 4 7 0 13-5 14-16Z" />
          <path d="M3 21c3-4 7-8 12-11M9 13.5l-.5-3.5M12.5 11l-.2-3M8.5 16.5 5 16M12 13.8l-3-.3" />
        </>
      )}
      {name === "fish" && (
        <>
          <path d="M3 12c2.8-3.6 6.4-5.4 10-5.4 3.2 0 5.8 1.9 7.6 5.4-1.8 3.5-4.4 5.4-7.6 5.4-3.6 0-7.2-1.8-10-5.4Z" />
          <path d="M3 12 1 9.2M3 12l-2 2.8" />
          <circle cx="16.6" cy="11" r=".8" fill="currentColor" stroke="none" />
          <path d="M10.5 9.6c.7 1.6.7 3.2 0 4.8" />
        </>
      )}
      {name === "meat" && (
        <>
          <path d="M4.6 9.4C5.8 5.8 10 4.4 14.4 5.2c4.4.8 6.6 3.8 5.4 7.2-1.2 3.6-5.6 5.6-9.8 4.6C5.6 16 3.4 13 4.6 9.4Z" />
          <path d="M4.4 12.6c.2 2.6 2.2 5 5.6 5.8 4.4 1 8.6-1 9.8-4.6" />
          <ellipse cx="14.6" cy="9.6" rx="2.2" ry="1.6" />
        </>
      )}
      {name === "desserts" && (
        <>
          <path d="M4 20h16M5 20v-7h14v7M5 16.5h14" />
          <path d="M6.5 13c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
          <path d="M12 7.8V5.5M12 5.5c.9 0 1.4-.6 1.4-1.3S12.6 3 12 3s-1.4.5-1.4 1.2.5 1.3 1.4 1.3Z" />
        </>
      )}
      {name === "drinks" && (
        <>
          <path d="M5 4h14l-7 8.2L5 4ZM12 12.2V20M8.5 20h7" />
          <path d="M7.4 6.8h9.2" />
        </>
      )}
    </svg>
  );
}

/** LIMAN's mark: three sea swells in gold. */
export function WaveMark({ className = "" }: P) {
  return (
    <svg viewBox="0 0 80 22" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M4 9C16 2 30 2 40 8s26 7 36-1" strokeWidth="3.2" />
      <path d="M12 14c10-5 20-5 28 0s20 5 28-1" strokeWidth="2.4" />
      <path d="M22 19c7-3 13-3 18 0s12 3 17 0" strokeWidth="1.8" />
    </svg>
  );
}

export function ExpandIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line} strokeWidth={1.7}>
      <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
    </svg>
  );
}

export function CloseIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line} strokeWidth={1.6}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
