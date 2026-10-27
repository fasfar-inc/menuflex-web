/**
 * LIMAN Kitchen & Bar demo menu, shared by the printed menu and the digital
 * menu so both show the same dishes and prices.
 */
export type Dish = {
  name: string;
  description: string;
  price: string;
  /** Large photograph; dishes without one are listed as text rows. */
  photo?: { src: string; width: number; height: number };
};

export type MenuCategory = { id: string; label: string; title: string; dishes: Dish[] };

export const limanBrand = { name: "LIMAN", tagline: "Kitchen & Bar", note: "A seasonal kitchen by the harbour" };

export const limanMenu: MenuCategory[] = [
  {
    id: "starters",
    label: "Starters",
    title: "Starters",
    dishes: [
      {
        name: "Charred Octopus",
        description: "Fava purée, capers, lemon oil",
        price: "₺520",
        photo: { src: "/digital-menu/octopus.webp", width: 1044, height: 567 },
      },
      { name: "Burrata & Heirloom Tomato", description: "Basil oil, toasted sourdough", price: "₺390" },
      { name: "Sea Bream Crudo", description: "Citrus, green chilli, dill", price: "₺450" },
      { name: "Smoked Aubergine", description: "Tahini, pomegranate, mint", price: "₺310" },
      { name: "Lamb Köfte", description: "Yoghurt, urfa butter, flatbread", price: "₺420" },
    ],
  },
  {
    id: "mains",
    label: "Mains",
    title: "Mains",
    dishes: [
      {
        name: "Grilled Sea Bass",
        description: "Lemon, wild herbs, olive oil",
        price: "₺640",
        photo: { src: "/digital-menu/sea-bass.webp", width: 653, height: 501 },
      },
      {
        name: "Hand-cut Tagliatelle",
        description: "Slow tomato, basil, parmesan",
        price: "₺480",
        photo: { src: "/digital-menu/tagliatelle.webp", width: 653, height: 474 },
      },
    ],
  },
  {
    id: "grill",
    label: "Grill",
    title: "From the Grill",
    dishes: [
      { name: "Charcoal Lamb Shoulder", description: "Smoked aubergine, sumac onions", price: "₺720" },
      { name: "Dry-aged Ribeye 300g", description: "Bone-marrow butter, pepper jus", price: "₺980" },
      { name: "Corn-fed Chicken", description: "Lemon thyme, charred leeks", price: "₺520" },
    ],
  },
  {
    id: "sea",
    label: "Sea",
    title: "From the Sea",
    dishes: [
      { name: "Salt-baked Sea Bream", description: "Fennel, olives, preserved lemon", price: "₺690" },
      { name: "Prawn Güveç", description: "Tomato, garlic, aged kaşar", price: "₺560" },
    ],
  },
  {
    id: "desserts",
    label: "Desserts",
    title: "Desserts",
    dishes: [
      { name: "Pistachio Baklava", description: "Clotted cream, orange blossom", price: "₺260" },
      { name: "Burnt Basque Cheesecake", description: "Sour cherry, thyme honey", price: "₺240" },
      { name: "Seasonal Fruit", description: "Mint sugar, lime", price: "₺180" },
    ],
  },
  {
    id: "drinks",
    label: "Drinks",
    title: "Drinks",
    dishes: [
      { name: "Anatolian Rosé", description: "Glass · Kalecik Karası, Ankara", price: "₺320" },
      { name: "Rakı & Meze Board", description: "Yeni Rakı, white cheese, melon", price: "₺450" },
      { name: "House Lemonade", description: "Mint, sumac, sparkling water", price: "₺120" },
      { name: "Turkish Coffee", description: "Served with lokum", price: "₺110" },
    ],
  },
];
