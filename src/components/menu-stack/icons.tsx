import type { CategoryIcon as CategoryIconName, DishTag } from "@/content/menus/types";

type P = { className?: string };
const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Fine line icons for the category bar. */
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

/** Small icons beside a dish's highlights. */
export function TagIcon({ tag, className = "h-5 w-5" }: P & { tag: DishTag }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line}>
      {(tag === "fresh" || tag === "vegetarian") && (
        <>
          <path d="M19 5C11 5 6 9.5 6 15.5c0 1.3.3 2.5.9 3.5C13 19 18 14.6 19 5Z" />
          <path d="M4 21c2.8-3.6 6.2-7 10.6-9.6" />
        </>
      )}
      {tag === "chef" && (
        <>
          <path d="M7 14.5v4.5h10v-4.5" />
          <path d="M7 14.5c-2.2-.3-3.5-1.9-3.5-3.8 0-2.2 1.8-3.9 4-3.9.4 0 .7 0 1 .1C9.1 5.2 10.4 4 12 4s2.9 1.2 3.5 2.9c.3-.1.6-.1 1-.1 2.2 0 4 1.7 4 3.9 0 1.9-1.3 3.5-3.5 3.8" />
          <path d="M7 16.5h10" />
        </>
      )}
      {tag === "sustainable" && (
        <>
          <path d="M3 12c2.8-3.6 6.4-5.4 10-5.4 3.2 0 5.8 1.9 7.6 5.4-1.8 3.5-4.4 5.4-7.6 5.4-3.6 0-7.2-1.8-10-5.4Z" />
          <path d="M3 12 1 9.2M3 12l-2 2.8" />
          <circle cx="16.6" cy="11" r=".8" fill="currentColor" stroke="none" />
        </>
      )}
      {tag === "spicy" && (
        <>
          <path d="M14 7c3.5.5 5.5 3.4 4.6 7.2C17.4 19 12 21.5 6.5 20.5 10.5 18 9.2 13 11 9.5 11.7 8 12.8 7.2 14 7Z" />
          <path d="M14 7c0-1.8.9-3 2.5-3.5" />
        </>
      )}
      {tag === "signature" && <path d="m12 3.5 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7L12 3.5Z" />}
    </svg>
  );
}

export function OliveBranch({ className = "" }: P) {
  return (
    <svg viewBox="0 0 120 48" aria-hidden="true" className={className} fill="currentColor">
      <path d="M20 44C40 36 62 22 104 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44" cy="28" rx="9" ry="3.4" transform="rotate(-48 44 28)" />
      <ellipse cx="58" cy="30" rx="9" ry="3.4" transform="rotate(14 58 30)" />
      <ellipse cx="64" cy="16" rx="9" ry="3.4" transform="rotate(-52 64 16)" />
      <ellipse cx="78" cy="20" rx="9" ry="3.4" transform="rotate(10 78 20)" />
      <ellipse cx="84" cy="7" rx="8" ry="3.2" transform="rotate(-40 84 7)" />
      <ellipse cx="96" cy="13" rx="8" ry="3.2" transform="rotate(12 96 13)" />
      <circle cx="36" cy="38" r="3.6" />
      <circle cx="52" cy="40" r="3.2" />
    </svg>
  );
}

export function GlobeIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5Z" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} {...line} strokeWidth={1.6}>
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function ChevronsUpIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line} strokeWidth={1.6}>
      <path d="m6 12 6-5 6 5M6 18l6-5 6 5" />
    </svg>
  );
}

export function BurgerIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...line} strokeWidth={1.6}>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
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
