import Image from "next/image";
import { forwardRef } from "react";
import { limanMenu, rectStyle } from "./limanMenu";

/**
 * The physical menu as a standalone, transparent object. It knows nothing
 * about the scene it sits in, so later scenes can move, open or replace it
 * (GSAP timelines, ScrollTrigger, or an R3F model) without touching the
 * backdrop. Target it with `[data-menu-object]` or the forwarded ref.
 */
export const MenuObject = forwardRef<HTMLDivElement, { className?: string }>(function MenuObject(
  { className = "" },
  ref,
) {
  const { menu } = limanMenu;
  return (
    <div
      ref={ref}
      data-menu-object
      className={`absolute origin-[45%_90%] will-change-transform ${className}`}
      style={rectStyle(menu.rect)}
    >
      <Image
        src={menu.src}
        alt={menu.alt}
        width={menu.width}
        height={menu.height}
        priority
        sizes="(min-width: 1024px) 48vw, 96vw"
        draggable={false}
        className="menu-depth h-full w-full select-none"
      />
    </div>
  );
});
