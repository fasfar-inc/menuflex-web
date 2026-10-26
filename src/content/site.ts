/**
 * Site copy, kept separate from components so the TR translation can be
 * added later without touching layout code.
 */
export const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Restaurants", href: "#restaurants" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];

export const heroCopy = {
  eyebrow: "Restaurant menus, reimagined",
  headline: ["A menu", "is more", "than paper."],
  supporting: ["We make it digital.", "We keep it effortless."],
  primaryCta: { label: "Digitalize My Menu", href: "#get-started" },
  secondaryCta: { label: "Explore Restaurants", href: "#restaurants" },
  scrollHint: "Scroll to see the transformation",
} as const;

/** Chapters of the paper-to-digital story told across the homepage. */
export const sceneChapters = [
  { index: "01", label: "Paper" },
  { index: "02", label: "Layers" },
  { index: "03", label: "Digital" },
] as const;
