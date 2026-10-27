import Image from "next/image";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { CategoryIcon } from "./icons";

/** Height of the text panel under the photograph. */
export const CARD_TEXT = 124;

/**
 * One dish: a photograph with the name, price and description beneath it.
 * Behind the front card only the photograph shows (`text` fades it out).
 */
export function DishCard({
  dish,
  locale,
  icon,
  categoryLabel,
  text,
  priority = false,
}: {
  dish: Dish;
  locale: MenuLocale;
  icon: CategoryIconName;
  categoryLabel: string;
  /** Opacity of the name, price and description. */
  text: number;
  priority?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-[#0d0b09]">
      {/* the photograph, or a quiet emblem for dishes without one */}
      {/* behind the front card the photograph fills the whole card, so every peeking edge shows food */}
      <div className="absolute inset-x-0 top-0" style={{ bottom: (CARD_TEXT - 34) * text, transition: "bottom var(--deck-t)" }}>
        {dish.photo ? (
          <Image
            src={dish.photo.src}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 480px) 94vw, 440px"
            className="object-cover"
            style={{ objectPosition: dish.photo.position ?? "50% 50%" }}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(70%_65%_at_50%_45%,rgba(222,160,80,0.32)_0%,rgba(222,160,80,0)_72%),linear-gradient(165deg,#3a2c1e_0%,#1d1610_60%,#120e0a_100%)] pb-6 text-gold-bright/80">
            <CategoryIcon name={icon} className="h-14 w-14 stroke-[0.9]" />
            <span className="text-[11px] font-medium tracking-[0.34em] uppercase">{categoryLabel}</span>
          </div>
        )}
        {/* the photograph settles into the card's black */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(to_bottom,rgba(13,11,9,0)_0%,rgba(13,11,9,0.85)_70%,#0d0b09_100%)]"
          style={{ opacity: text, transition: "opacity var(--deck-t)" }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-[22px] pb-[22px]" style={{ height: CARD_TEXT, opacity: text, transition: "opacity var(--deck-t)" }}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="min-w-0 truncate font-serif text-[clamp(1.5rem,7vw,1.8rem)] leading-tight tracking-[-0.01em] text-cream">{dish.name[locale]}</h2>
          <Price value={dish.price} className="shrink-0 font-serif text-[clamp(1.4rem,6.4vw,1.7rem)] text-cream" />
        </div>
        <p className="mt-2 line-clamp-2 text-[15.5px] leading-[1.5] font-light text-cream-soft">{dish.description[locale]}</p>
      </div>
    </div>
  );
}

/** A price whose currency sign is set in Inter: the serif has no ₺ and would fall back to a mismatched glyph. */
export function Price({ value, className }: { value: string; className: string }) {
  const m = value.match(/^(\D*)(.*)$/);
  return (
    <span className={className}>
      {m?.[1] && <span className="mr-[0.04em] font-sans text-[0.84em] font-light">{m[1]}</span>}
      {m?.[2] ?? value}
    </span>
  );
}
