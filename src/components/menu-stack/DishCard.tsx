import Image from "next/image";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { CategoryIcon, TagIcon } from "./icons";
import { menuStrings } from "./strings";

export type CardFaces = {
  /** Full card content (the dish in front). */
  full: number;
  /** Name strip along the top edge, seen when the card sits behind and above. */
  top: number;
  /** Name strip along the bottom edge, seen when the card sits behind and below. */
  bottom: number;
};

/**
 * One dish. Its full face is shown in front; behind the front card only one
 * edge peeks out, so that edge carries a compact name and price strip.
 */
export function DishCard({
  dish,
  locale,
  icon,
  categoryLabel,
  width,
  height,
  faces,
  priority = false,
}: {
  dish: Dish;
  locale: MenuLocale;
  icon: CategoryIconName;
  categoryLabel: string;
  width: number;
  height: number;
  faces: CardFaces;
  priority?: boolean;
}) {
  const s = menuStrings[locale];
  // photographs take most of the card and the text overlaps their fade; an emblem needs less room
  const photoH = Math.round(height * (dish.photo ? (height < 330 ? 0.52 : 0.64) : 0.36));
  const textTop = dish.photo ? photoH - 58 : photoH;
  // three highlights need a wide card; narrower ones show two
  const tags = dish.tags?.slice(0, width >= 400 ? 3 : 2) ?? [];
  const strip = (
    <div className="flex items-baseline justify-between gap-4 px-6">
      <span className="truncate font-serif text-[21px] leading-tight text-cream">{dish.name[locale]}</span>
      <Price value={dish.price} className="shrink-0 font-serif text-[19px] text-gold-bright" />
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-gold/25 bg-[linear-gradient(165deg,#221c16_0%,#120f0c_60%,#1a1510_100%)]">
      {/* media: the photograph, or a quiet emblem for dishes without one */}
      <div className="absolute inset-x-0 top-0" style={{ height: photoH }}>
        {dish.photo ? (
          <Image
            src={dish.photo.src}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 480px) 92vw, 440px"
            className="object-cover"
            style={{ objectPosition: dish.photo.position ?? "50% 50%" }}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[radial-gradient(60%_70%_at_50%_55%,rgba(214,150,70,0.16)_0%,rgba(214,150,70,0)_70%)] pt-3 text-gold/70">
            <CategoryIcon name={icon} className="h-12 w-12 stroke-[0.9]" />
            <span className="text-[11px] font-medium tracking-[0.34em] uppercase">{categoryLabel}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_bottom,rgba(18,15,12,0)_0%,#14110d_100%)]" />
      </div>

      {/* full face */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col px-6 pb-4" style={{ top: textTop, opacity: faces.full }}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-[clamp(1.6rem,7.6vw,2.15rem)] leading-[1.08] tracking-[-0.01em] text-cream">{dish.name[locale]}</h2>
          <Price value={dish.price} className="shrink-0 font-serif text-[clamp(1.4rem,6.4vw,1.85rem)] text-gold-bright" />
        </div>
        <p className="mt-2 line-clamp-3 font-serif text-[17px] leading-[1.38] text-cream-soft">{dish.description[locale]}</p>
        {tags.length > 0 && (
          <ul className="mt-auto flex items-center gap-x-3 overflow-hidden border-t border-gold/25 pt-3.5 text-[12.5px] text-cream-soft">
            {tags.map((t, i) => (
              <li key={t} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="mr-1.5 h-4 w-px shrink-0 bg-gold/35" />}
                <TagIcon tag={t} className="h-[18px] w-[18px] shrink-0 text-gold" />
                <span className="truncate">{s.tags[t]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* edge strips for the cards waiting behind */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 bg-[linear-gradient(to_bottom,rgba(14,11,9,0.92)_0%,rgba(14,11,9,0.7)_70%,rgba(14,11,9,0)_100%)] pt-[18px] pb-6" style={{ opacity: faces.top }}>
        {strip}
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(14,11,9,0.95)_0%,rgba(14,11,9,0.75)_70%,rgba(14,11,9,0)_100%)] pt-6 pb-[18px]" style={{ opacity: faces.bottom }}>
        {strip}
      </div>
    </div>
  );
}

/** A price whose currency sign is set in Inter: the serif has no ₺ and would fall back to a mismatched glyph. */
function Price({ value, className }: { value: string; className: string }) {
  const m = value.match(/^(\D*)(.*)$/);
  return (
    <span className={className}>
      {m?.[1] && <span className="mr-[0.06em] font-sans text-[0.86em] font-normal">{m[1]}</span>}
      {m?.[2] ?? value}
    </span>
  );
}
