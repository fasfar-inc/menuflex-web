import { getPublishedRestaurants } from "@/lib/menuflex/public";

/**
 * Restaurants listed in "Our Work".
 *
 * Restaurants published from the admin dashboard appear on their own. This
 * list is only for genuine restaurants whose menu lives elsewhere: add them
 * once they have approved being listed, with `published: true`. The section
 * stays hidden until at least one restaurant is published. Demonstration
 * menus never go here.
 *
 *   { name: "Restaurant Name", menuUrl: "https://…", published: true },
 */
export type ClientRestaurant = {
  name: string;
  /** The restaurant's live digital menu; without one the name is shown unlinked. */
  menuUrl?: string;
  published: boolean;
};

export const clients: ClientRestaurant[] = [];

export const publishedClients = clients.filter((c) => c.published);

/** Everything Our Work lists: the restaurants above, then those published from the admin. */
export async function ourWork(): Promise<ClientRestaurant[]> {
  const fromAdmin = (await getPublishedRestaurants()).map((r) => ({ name: r.name, menuUrl: `/m/${r.slug}/`, published: true }));
  const seen = new Set(publishedClients.map((c) => c.name.toLowerCase()));
  return [...publishedClients, ...fromAdmin.filter((c) => !seen.has(c.name.toLowerCase()))];
}
