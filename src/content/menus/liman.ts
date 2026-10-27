import type { RestaurantMenu } from "./types";

const photo = (file: string, width: number, height: number, position?: string) => ({
  src: `/m/liman/${file}.webp`,
  width,
  height,
  position,
});

/** LIMAN Kitchen & Bar: a fictional restaurant used to demonstrate MenuFlex. */
export const liman: RestaurantMenu = {
  slug: "liman",
  name: "LIMAN",
  subtitle: { en: "Kitchen & Bar", tr: "Kitchen & Bar" },
  demo: true,
  defaultLocale: "en",
  locales: ["tr", "en"],
  note: {
    en: "Please let us know about any allergies. Prices include VAT.",
    tr: "Lütfen alerjilerinizi bize bildirin. Fiyatlara KDV dahildir.",
  },
  categories: [
    {
      id: "starters",
      icon: "starters",
      label: { en: "Starters", tr: "Başlangıçlar" },
      dishes: [
        {
          id: "seared-scallops",
          name: { en: "Seared Scallops", tr: "Tavada Deniz Tarağı" },
          description: { en: "Pan-seared scallops with herb butter and citrus sauce.", tr: "Otlu tereyağı ve narenciye sosuyla tavada deniz tarağı." },
          price: "₺520",
          photo: photo("seared-scallops", 720, 706),
        },
        {
          id: "charred-octopus",
          name: { en: "Charred Octopus", tr: "Közlenmiş Ahtapot" },
          description: { en: "Fava purée, capers, lemon oil and wild herbs.", tr: "Fava püresi, kapari, limon yağı ve yabani otlar." },
          price: "₺480",
          photo: photo("charred-octopus", 964, 446),
        },
        {
          id: "burrata",
          name: { en: "Burrata & Heirloom Tomato", tr: "Burrata ve Yerli Domates" },
          description: { en: "Basil oil, aged balsamic, toasted sourdough.", tr: "Fesleğen yağı, yıllanmış balzamik, kızarmış ekşi maya ekmek." },
          price: "₺390",
        },
        {
          id: "smoked-aubergine",
          name: { en: "Smoked Aubergine", tr: "Közlenmiş Patlıcan" },
          description: { en: "Tahini, pomegranate, mint and warm flatbread.", tr: "Tahin, nar, nane ve sıcak pide." },
          price: "₺310",
        },
      ],
    },
    {
      id: "fish",
      icon: "fish",
      label: { en: "Fish", tr: "Balık" },
      dishes: [
        {
          id: "grilled-sea-bass",
          name: { en: "Grilled Sea Bass", tr: "Izgara Levrek" },
          description: { en: "Fresh sea bass with lemon and herbs.", tr: "Limon ve taze otlarla levrek." },
          price: "₺640",
          photo: photo("grilled-sea-bass", 730, 704),
        },
        {
          id: "grilled-salmon",
          name: { en: "Grilled Salmon", tr: "Izgara Somon" },
          description: {
            en: "Fresh Atlantic salmon, seasonal vegetables, lemon butter sauce, fresh herbs.",
            tr: "Taze Atlantik somonu, mevsim sebzeleri, limonlu tereyağı sos, taze otlar.",
          },
          price: "₺680",
          photo: photo("grilled-salmon", 812, 400),
        },
        {
          id: "tuna-steak",
          name: { en: "Tuna Steak", tr: "Ton Balığı Biftek" },
          description: { en: "Sesame crust, ginger and soy glaze, pickled cucumber.", tr: "Susam kabuğu, zencefil ve soya glazürü, turşu salatalık." },
          price: "₺720",
        },
        {
          id: "calamari",
          name: { en: "Crispy Calamari", tr: "Çıtır Kalamar" },
          description: { en: "Lightly fried calamari, lemon aioli, sea salt.", tr: "Hafif kızartılmış kalamar, limonlu aioli, deniz tuzu." },
          price: "₺450",
        },
        {
          id: "prawn-tagliatelle",
          name: { en: "Prawn Tagliatelle", tr: "Karidesli Tagliatelle" },
          description: { en: "Hand-cut pasta, slow-cooked tomato, basil and parmesan.", tr: "El yapımı makarna, ağır pişmiş domates, fesleğen ve parmesan." },
          price: "₺560",
          photo: photo("prawn-tagliatelle", 653, 474),
        },
      ],
    },
    {
      id: "meat",
      icon: "meat",
      label: { en: "Meat", tr: "Et" },
      dishes: [
        {
          id: "ribeye-steak",
          name: { en: "Ribeye Steak", tr: "Antrikot" },
          description: { en: "Grilled ribeye steak with roasted vegetables.", tr: "Fırın sebzelerle ızgara antrikot." },
          price: "₺720",
          photo: photo("ribeye-steak", 720, 708),
        },
        {
          id: "lamb-shoulder",
          name: { en: "Charcoal Lamb Shoulder", tr: "Kömür Ateşinde Kuzu Kol" },
          description: { en: "Slow-roasted for twelve hours, smoked aubergine, sumac onions.", tr: "On iki saat ağır pişirilmiş, közlenmiş patlıcan, sumaklı soğan." },
          price: "₺690",
        },
        {
          id: "kofte",
          name: { en: "Lamb Köfte", tr: "Kuzu Köfte" },
          description: { en: "Yoghurt, urfa chilli butter, grilled flatbread.", tr: "Yoğurt, isotlu tereyağı, ızgara pide." },
          price: "₺460",
        },
      ],
    },
    {
      id: "desserts",
      icon: "desserts",
      label: { en: "Desserts", tr: "Tatlılar" },
      dishes: [
        {
          id: "baklava",
          name: { en: "Pistachio Baklava", tr: "Fıstıklı Baklava" },
          description: { en: "Antep pistachios, clotted cream, orange blossom.", tr: "Antep fıstığı, kaymak, portakal çiçeği." },
          price: "₺260",
        },
        {
          id: "cheesecake",
          name: { en: "Burnt Basque Cheesecake", tr: "Yanık Bask Cheesecake" },
          description: { en: "Sour cherry compote, thyme honey.", tr: "Vişne kompostosu, kekik balı." },
          price: "₺240",
        },
        {
          id: "seasonal-fruit",
          name: { en: "Seasonal Fruit", tr: "Mevsim Meyveleri" },
          description: { en: "Chilled fruit, mint sugar and lime.", tr: "Soğuk meyveler, naneli şeker ve misket limonu." },
          price: "₺180",
        },
      ],
    },
    {
      id: "drinks",
      icon: "drinks",
      label: { en: "Drinks", tr: "İçecekler" },
      dishes: [
        {
          id: "signature-cocktail",
          name: { en: "Harbour Negroni", tr: "Liman Negroni" },
          description: { en: "Gin, bitter aperitivo, vermouth, smoked orange peel.", tr: "Cin, bitter aperitivo, vermut, tütsülenmiş portakal kabuğu." },
          price: "₺420",
        },
        {
          id: "rose",
          name: { en: "Anatolian Rosé", tr: "Anadolu Roze" },
          description: { en: "By the glass. Kalecik Karası, Ankara.", tr: "Kadeh. Kalecik Karası, Ankara." },
          price: "₺320",
        },
        {
          id: "lemonade",
          name: { en: "House Lemonade", tr: "Ev Yapımı Limonata" },
          description: { en: "Fresh lemon, mint, sumac and sparkling water.", tr: "Taze limon, nane, sumak ve maden suyu." },
          price: "₺120",
        },
        {
          id: "turkish-coffee",
          name: { en: "Turkish Coffee", tr: "Türk Kahvesi" },
          description: { en: "Served with lokum.", tr: "Lokum ile servis edilir." },
          price: "₺110",
        },
      ],
    },
  ],
};
