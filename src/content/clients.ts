/**
 * Restaurants listed in "Our Work".
 *
 * Only add genuine restaurants that have approved being listed, and set
 * `published: true` once their menu is live. The section stays hidden until
 * at least one restaurant is published. Demonstration menus never go here.
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
