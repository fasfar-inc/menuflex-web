import type { Dictionary } from "@/i18n/dictionaries";

export type MenuId = keyof Omit<Dictionary["menus"], "alt">;

/**
 * The six printed menus around the QR code. `rect` is where each sits in the
 * approved hero composition, in the reference design's pixels; the images
 * are cut from that design at twice its resolution.
 */
export const heroMenus: { id: MenuId; src: string; width: number; height: number; rect: { x: number; y: number; w: number; h: number } }[] = [
  { id: "breakfast", src: "/menus/breakfast.webp", width: 680, height: 404, rect: { x: 529, y: 113, w: 340, h: 202 } },
  { id: "mains", src: "/menus/mains.webp", width: 732, height: 512, rect: { x: 1055, y: 89, w: 366, h: 256 } },
  { id: "appetizers", src: "/menus/appetizers.webp", width: 602, height: 424, rect: { x: 514, y: 426, w: 301, h: 212 } },
  { id: "pizza", src: "/menus/pizza.webp", width: 604, height: 428, rect: { x: 1181, y: 421, w: 302, h: 214 } },
  { id: "desserts", src: "/menus/desserts.webp", width: 692, height: 482, rect: { x: 552, y: 689, w: 346, h: 241 } },
  { id: "drinks", src: "/menus/drinks.webp", width: 662, height: 474, rect: { x: 1107, y: 696, w: 331, h: 237 } },
];
