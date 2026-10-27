/**
 * Restaurants shown in "Our Work".
 *
 * Only add genuine restaurants that have approved being listed. Each entry
 * links to that restaurant's live digital menu. Entries marked `demo` are
 * examples made by MenuFlex and are always labelled as such on the site.
 */
export type ClientMenu = {
  name: string;
  /** Short line under the name, per language (city, cuisine…). */
  note: { en: string; tr: string };
  /** The restaurant's live digital menu. */
  menuUrl: string;
  /** Cover image in /public (about 4:3). */
  image: { src: string; width: number; height: number; alt: string };
  demo?: boolean;
};

export const clients: ClientMenu[] = [
  {
    name: "LIMAN Kitchen & Bar",
    note: {
      en: "Example menu made by MenuFlex to show how a finished menu works.",
      tr: "Bitmiş bir menünün nasıl çalıştığını göstermek için MenuFlex'in hazırladığı örnek menü.",
    },
    menuUrl: "/demo/liman/",
    image: {
      src: "/work/liman.webp",
      width: 1191,
      height: 1072,
      alt: "The LIMAN Kitchen & Bar menu",
    },
    demo: true,
  },
];
