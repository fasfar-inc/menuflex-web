import type { Dish, MenuCategory, RestaurantMenu } from "./types";

const photo = (file: string, width: number, height: number, position?: string) => ({
  src: `/m/sabor/${file}.webp`,
  width,
  height,
  position,
});

// shorthand for the many dishes printed with one name in both languages
const dish = (
  id: string,
  name: string,
  price: string,
  en: string,
  tr: string,
  extra: Partial<Dish> = {},
): Dish => ({ id, name: { en: name, tr: name }, description: { en, tr }, price, ...extra });

const V = { en: " Vegetarian.", tr: " Vejetaryen." };
const VEGAN = { en: " Vegan.", tr: " Vegan." };
const veg = (d: Dish, tag = V): Dish => ({ ...d, description: { en: d.description.en + tag.en, tr: d.description.tr + tag.tr } });

const tapas: MenuCategory = {
  id: "tapas",
  icon: "starters",
  label: { en: "Tapas", tr: "Başlangıçlar" },
  dishes: [
    dish("gambas-al-ajillo", "Gambas al Ajillo", "₺380", "Prawns sautéed in olive oil and garlic. 4 pieces.", "Sarımsakla sote edilmiş karidesler. 4 adet.", {
      photo: photo("gambas-al-ajillo-v2", 506, 250, "40% 55%"),
    }),
    veg(dish("patatas-bravas", "Patatas Bravas", "₺335", "Deep-fried potatoes in a spicy sauce.", "Baharatlı ve acı soslu kızartılmış patates.")),
    veg(dish("champinones-al-ajillo", "Champiñones al Ajillo", "₺250", "Mushrooms in garlic sauce.", "Sarımsak soslu mantar.")),
    dish("tortilla-espanola", "Tortilla Española", "₺335", "A traditional Spanish potato and onion omelette.", "Patates ve soğanlı geleneksel İspanyol omleti."),
    dish("alitas-picantes", "Alitas Picantes", "₺320", "Spicy chicken wings. 6 pieces.", "Baharatlı ve acı soslu tavuk kanatları. 6 adet."),
    dish("calamar-a-la-plancha", "Calamar a la Plancha", "₺370", "Grilled calamari with olive oil and garlic. 4 pieces.", "Zeytinyağlı ve sarımsaklı ızgara kalamar. 4 adet."),
    dish("gambas-sabor", "Gambas 'Sabor'", "₺390", "Prawns sautéed in a spicy tomato sauce. 4 pieces.", "Baharatlı ve acı domates soslu sote edilmiş karides. 4 adet."),
    dish("pan-con-ajo", "Pan con Ajo", "₺130", "Garlic bread.", "Sarımsaklı ekmek."),
    dish("pasteis-de-bacalhau", "Pasteis de Bacalhau", "₺315", "Traditional Portuguese fish and potato fritters.", "Geleneksel Portekiz balık ve patates kroket."),
    dish("deep-fried-calamari", "Deep Fried Calamari", "₺390", "Crisp fried calamari.", "Kızartılmış kalamar."),
    dish("mejillones-al-chef", "Mejillones al Chef", "₺530", "Mussels, chef's style.", "Şef usulü midye."),
    dish("gambas-gabardina", "Gambas Gabardina", "₺460", "Prawns fried in batter with sweet chilli sauce. 4 pieces.", "Kızartılmış karides, tatlı biber soslu. 4 adet."),
    dish("chicken-tenders", "Chicken Tenders", "₺310", "Deep-fried chicken pieces.", "Kızartılmış tavuk bonfile."),
    dish("sabor-soup", "Sabor Soup", "₺440", "Spicy soup with prawns, noodles, mushrooms and spinach.", "Karides, şehriye, mantar ve ıspanaklı acılı çorba."),
    dish("bruschetta", "Bruschetta", "₺270", "Grilled bread topped with garlic, chopped fresh tomatoes, pesto and parmesan.", "Izgara ekmek, sarımsaklı, doğranmış taze domates, pesto ve peynirli."),
    dish("tapas-platter", "Tapas Platter", "₺1.080", "Prawns, patatas bravas, chicken wings and mushrooms. For 4.", "Karışık tapas tabağı: karides, patatas bravas, tavuk kanat ve mantar. 4 kişilik."),
  ],
};

const pasta: MenuCategory = {
  id: "pasta",
  icon: "pasta",
  label: { en: "Pasta", tr: "Makarnalar" },
  dishes: [
    dish("linguine-sabor", "Linguine 'Sabor'", "₺995", "Linguine with pan-fried prawns, calamari and tomato sauce.", "Sote edilmiş karides, kalamar ve domates soslu linguine makarna.", {
      photo: photo("linguine-sabor", 478, 308),
    }),
    dish("spaghetti-bolognese", "Spaghetti Bolognese", "₺990", "Traditional minced beef and tomato sauce.", "Klasik Bolonez soslu spagetti.", {
      photo: photo("spaghetti-bolognese", 516, 250, "55% 55%"),
    }),
    veg(dish("spaghetti-al-olio", "Spaghetti al Olio", "₺395", "With garlic, olive oil and chilli peppers.", "Sarımsak, zeytinyağı ve acı biberli spagetti.")),
    dish("spaghetti-marinara", "Spaghetti Marinara", "₺990", "Spaghetti with tomato sauce and seafood.", "Domates soslu ve deniz ürünleriyle spagetti."),
    veg(dish("penne-allarrabbiata", "Penne all'Arrabbiata", "₺495", "Penne with a spicy tomato sauce.", "Acılı domates sosu ile boru makarna.")),
    dish("penne-chicken-al-pomodoro", "Penne Chicken al Pomodoro", "₺650", "Sautéed chicken pieces with penne in tomato sauce.", "Domates soslu sote edilmiş tavuk parçaları ile boru makarna."),
    dish("penne-tuna-olives", "Penne Tuna Olives", "₺795", "Penne with tuna, olives and tomato sauce.", "Domates soslu ton balık ve zeytinli boru makarna."),
    dish("penne-chicken-broccoli", "Penne Chicken Broccoli", "₺640", "Sautéed broccoli and chicken with olive oil and chilli peppers.", "Sote edilmiş tavuk, brokoli, sarımsak ve zeytinyağlı boru makarna."),
    veg(dish("macaroni-pesto-vegetables", "Home-made Macaroni with Pesto and Vegetables", "₺590", "Home-made macaroni with pesto and vegetables.", "Pesto soslu ve sebzeli ev makarnası.")),
    dish("creamy-pesto-shrimp", "Creamy Pesto Shrimp", "₺895", "Linguine with shrimps, pesto and cream.", "Pesto ve krema soslu minik karidesli linguine makarna."),
    dish("fettuccine-con-pollo-e-crema", "Fettuccine con Pollo e Crema", "₺660", "Fettuccine in white wine and cream with sautéed chicken, mushrooms and mixed vegetables.", "Sote edilmiş tavuk, karışık sebze, mantar, beyaz şarap ve kremalı fettuccine."),
    dish("fettuccine-sabor", "Fettuccine 'Sabor'", "₺740", "Pan-fried prawns, calamari, chicken and mushrooms in a creamy tomato sauce.", "Domates soslu sote edilmiş karides, kalamar, tavuk, mantar ve kremalı fettuccine."),
    dish("lasagne-di-carne", "Lasagne di Carne", "₺995", "Minced meat lasagne, served with salad.", "Kıymalı lazanya, salata ile."),
    dish("penne-con-pomodori-secchi", "Penne con Pomodori Secchi", "₺600", "Penne with chicken, mushrooms and sun-dried tomatoes in a creamy sauce.", "Sote edilmiş tavuk, İtalyan kuru domates, mantar ve kremalı boru makarna."),
    dish("penne-beef-gorgonzola", "Penne Beef Gorgonzola", "₺1.100", "Penne with pan-fried sirloin, Gorgonzola and sun-dried tomatoes.", "Sote edilmiş biftek, peynir sosu ve İtalyan kuru domatesli boru makarna."),
    dish("creamy-chicken-spinach-tagliatelle", "Creamy Chicken Spinach Tagliatelle", "₺700", "Sautéed chicken in a creamy tagliatelle with spinach and mushrooms. New.", "Ispanak, mantar ve kremalı sote edilmiş tavuk ile tagliatelle. Yeni."),
    dish("spicy-chicken-tagliatelle", "Spicy Chicken Tagliatelle", "₺550", "Tagliatelle with peppers, onion, mushrooms and chicken in a spicy sauce.", "Acı soslu ızgara tavuk, yeşil biber, soğan, mantar ve tagliatelle."),
    veg(dish("pasta-con-limone-e-spinaci", "Pasta con Limone e Spinaci", "₺440", "Creamy fettuccine with spinach and lemon sauce. New.", "Ispanaklı, kremalı ve limon soslu fettuccine. Yeni.")),
    dish("steak-pasta-with-peppers", "Steak Pasta with Peppers", "₺1.140", "Penne with sautéed steak, bell peppers, tomato sauce and a little cream. New.", "Kapya biber, domates sos ve az kremalı sote biftekli boru makarna. Yeni."),
  ],
};

const chicken: MenuCategory = {
  id: "chicken",
  icon: "chicken",
  label: { en: "Chicken", tr: "Tavuk" },
  dishes: [
    dish("chicken-a-la-crema", "Chicken a la Crema", "₺710", "Grilled chicken breast in cream and mushroom sauce, with potatoes and vegetables.", "Kremalı ve mantar soslu ızgara tavuk göğsü, patates ve sebze ile.", {
      photo: photo("chicken-a-la-crema-v2", 506, 250, "45% 55%"),
    }),
    dish("pollo-scaloppina", "Pollo Scaloppina", "₺790", "Chicken escalope with penne napolitana.", "Tavuk şnitsel ve domates soslu boru makarna."),
    dish("pollo-alla-griglia", "Pollo alla Griglia", "₺540", "Grilled chicken breast with potatoes and vegetables.", "Izgara tavuk göğsü, patates ve sebze ile."),
    dish("pollo-con-gorgonzola", "Pollo con Gorgonzola", "₺855", "Grilled chicken breast with Gorgonzola sauce, potatoes and vegetables.", "Peynir soslu ızgara tavuk göğsü, patates ve sebze ile."),
    dish("chilli-chicken", "Chilli Chicken", "₺605", "Grilled chicken breast with sweet chilli sauce, potatoes and vegetables.", "Tatlı biber soslu ızgara tavuk göğsü, patates ve sebze ile."),
    dish("chicken-sabor", "Chicken 'Sabor'", "₺825", "Chicken breast sautéed with onions, olives and green peppers, on tagliatelle.", "Soğan, zeytin ve biberle sote edilmiş tavuk göğsü, tagliatelle ile."),
    dish("creamy-lemon-chicken", "Creamy Lemon Chicken", "₺550", "Grilled chicken breast in a cream and lemon sauce, with potatoes and vegetables. New.", "Izgara tavuk göğsü, limon ve krema soslu, patates ve sebze ile. Yeni."),
    dish("chicken-mascarpone", "Chicken Mascarpone", "₺810", "Grilled chicken breast with mascarpone and sun-dried tomatoes, on fettuccine.", "Mascarpone soslu, İtalyan kuru domatesli tavuk göğsü, fettuccine ile."),
    dish("chicken-avocado", "Chicken Avocado", "₺715", "Grilled chicken breast with salad, avocado and sun-dried tomatoes. Healthy option, 391.8 kcal.", "Izgara tavuk göğsü, salata, avokado ve kuru domatesli. Sağlıklı seçenek, 391,8 kcal."),
    dish("chicken-florentine", "Chicken Florentine", "₺710", "Grilled chicken breast in a creamy parmesan sauce with spinach.", "Izgara tavuk göğsü, parmesan, krema ve ıspanaklı."),
  ],
};

const noodles: MenuCategory = {
  id: "noodles",
  icon: "pasta",
  label: { en: "Noodles", tr: "Noodle" },
  dishes: [
    dish("noodles-chicken-vegetables", "Noodles with Chicken and Vegetables", "₺545", "Stir-fried noodles with chicken and vegetables.", "Sote edilmiş tavuklu ve sebzeli erişte."),
    dish("noodles-beef-vegetables", "Noodles with Beef and Vegetables", "₺1.100", "Stir-fried noodles with beef and vegetables.", "Sote edilmiş biftekli ve sebzeli erişte."),
    dish("noodles-seafood-vegetables", "Noodles with Seafood and Vegetables", "₺995", "Stir-fried noodles with seafood and vegetables.", "Sote edilmiş deniz ürünlü ve sebzeli erişte."),
    veg(
      dish("vegan-soba-noodles", "Vegan Soba Noodles", "₺580", "High-protein buckwheat soba with vegetables, spicy sriracha, sesame and avocado. Healthy option, 387.1 kcal.", "Sebzeli, susamlı ve acı sriracha soslu karabuğday erişte, avokado ile. Sağlıklı seçenek, 387,1 kcal."),
      VEGAN,
    ),
    dish("chicken-soba-noodles", "Chicken Soba Noodles", "₺680", "High-protein buckwheat soba with chicken, vegetables, sriracha, sesame and avocado. Healthy option, 406.3 kcal.", "Sebzeli, tavuklu, susamlı ve sriracha soslu karabuğday erişte, avokado ile. Sağlıklı seçenek, 406,3 kcal.", {
      photo: photo("chicken-soba-noodles", 506, 259),
    }),
    dish("beef-soba-noodles", "Beef Soba Noodles", "₺1.100", "High-protein buckwheat soba with beef, vegetables, sriracha, sesame and avocado. Healthy option, 458.6 kcal.", "Sebzeli, biftekli, susamlı ve sriracha soslu karabuğday erişte, avokado ile. Sağlıklı seçenek, 458,6 kcal."),
  ],
};

const meat: MenuCategory = {
  id: "meat",
  icon: "meat",
  label: { en: "Meat", tr: "Et" },
  dishes: [
    dish("grilled-t-bone-steak", "Grilled T-Bone Steak", "₺1.990", "T-bone steak served with potatoes and vegetables.", "T-bone steak, patates ve sebze ile.", {
      photo: photo("grilled-t-bone-steak-v2", 506, 259, "42% 60%"),
    }),
    dish("bistecca-con-pomodori-secchi", "Bistecca con Pomodori Secchi", "₺2.050", "Sirloin with sun-dried tomatoes and cream, with potatoes and vegetables.", "İtalyan kuru domates ve kremalı biftek, patates ve sebze ile."),
    dish("filetto-al-pepe", "Filetto al Pepe", "₺2.200", "Fillet steak with cream and peppercorns, with potatoes and vegetables.", "Karabiber ve krema soslu bonfile, patates ve sebze ile."),
    dish("filetto-con-funghi", "Filetto con Funghi", "₺2.200", "Fillet steak with mushroom and cream sauce, with potatoes and vegetables.", "Mantarlı ve krema soslu bonfile, patates ve sebze ile."),
    dish("bistecca-sabor", "Bistecca 'Sabor'", "₺2.200", "Grilled sirloin with sautéed bell peppers, onions and olives on tagliatelle.", "Izgara biftek, sote kapya biber, soğan ve zeytinli, tagliatelle ile."),
    dish("steak-gorgonzola", "Steak Gorgonzola", "₺2.200", "Sirloin with Gorgonzola sauce, potatoes and vegetables.", "Peynir soslu biftek, patates ve sebze ile."),
    dish("picado", "Picado", "₺1.950", "Portuguese-style sirloin pieces with mushrooms and red wine, on potatoes.", "Portekiz usulü, mantarlı, şaraplı biftek parçaları, patates ile."),
    dish("espetada", "Espetada", "₺2.150", "Traditional Portuguese skewered fillet steak with salad and potatoes.", "Geleneksel Portekiz bonfile şiş, salata ve patates ile."),
    dish("diet-steak-with-avocado", "Diet Steak with Avocado", "₺1.950", "Grilled sirloin served with salad and avocado. New.", "Izgara biftek, salata ve avokado ile. Yeni."),
    dish("steak-diane", "Steak Diane", "₺2.200", "Sirloin with Worcester sauce, mushrooms, cream and mustard.", "Worcester, mantar, krema ve hardal soslu biftek."),
    dish("bistecca-alla-griglia", "Bistecca alla Griglia", "₺1.990", "Grilled sirloin with red wine and mushrooms, potatoes and salad.", "Izgara biftek, taze mantar ve kırmızı şarap soslu, patates ve salata ile."),
  ],
};

const paellaFish: MenuCategory = {
  id: "paella-fish",
  icon: "fish",
  label: { en: "Paella & Fish", tr: "Paella & Balık" },
  dishes: [
    dish("paella", "Paella with Chicken and Seafood", "₺2.400", "Traditional Spanish rice with seafood and chicken, for two. Please allow 45 minutes.", "Geleneksel tavada pişen pirinçli, tavuklu ve deniz ürünlü İspanyol yemeği, 2 kişilik. Hazırlanması 45 dakika sürer.", {
      name: { en: "Paella with Chicken and Seafood", tr: "Tavuklu ve Deniz Ürünlü Paella" },
      photo: photo("paella-v2", 516, 259, "50% 58%"),
    }),
    dish("portuguese-prawns-and-calamari", "Portuguese Prawns and Calamari", "₺770", "Traditional Portuguese skewers of grilled prawns and calamari, with potatoes and salad.", "Geleneksel Portekiz ızgara karides ve kalamar şiş, salata ve patates ile."),
    dish("pangasius-fillet-fish", "Pangasius Fillet Fish", "₺570", "Freshwater fish fillet sautéed with onions and olives, with potatoes and vegetables.", "Soğan, zeytin ve şarapla sote edilmiş tatlısu balığı fileto, patates ve sebze ile.", {
      photo: photo("pangasius-fillet-fish", 516, 259, "45% 55%"),
    }),
  ],
};

const salads: MenuCategory = {
  id: "salads",
  icon: "salad",
  label: { en: "Salads", tr: "Salatalar" },
  dishes: [
    veg(dish("mixed-salad", "Mixed Salad", "₺250", "Mixed greens with tomato.", "Yeşil salata, domates.")),
    veg(dish("parmiggiano", "Parmiggiano", "₺555", "Mixed greens, rocket, shaved parmesan and sun-dried tomatoes.", "Yeşil salata, roka, parmesan peyniri ve İtalyan kuru domates.")),
    veg(dish("feta-cheese-salad", "Feta Cheese Salad", "₺520", "Tossed salad with feta cheese and apple.", "Beyaz peynir, yeşillik ve elma.")),
    veg(
      dish("beetroot-salad", "Beetroot Salad", "₺640", "Mixed greens topped with beetroot, white cheese and avocado.", "Yeşil salata, pancar, beyaz peynir ve avokado.", {
        photo: photo("beetroot-salad", 506, 259),
      }),
    ),
    dish("beef-avocado-beetroot-salad", "Beef, Avocado and Beetroot Salad", "₺1.100", "Salad with steak, avocado and beetroot.", "Biftekli, avokadolu ve pancarlı salata."),
    dish("chicken-salad", "Chicken Salad", "₺435", "Grilled chicken strips on mixed greens.", "Izgara tavuk salatası."),
    dish("sabor-salad", "'Sabor' Salad", "₺650", "Tossed salad topped with mixed seafood.", "Karışık deniz ürünleri salatası."),
    veg(dish("chickpea-kofte", "Chickpea Köfte", "₺620", "Chickpea, potato and vegetable köfte with salad and avocado.", "Nohut, patates ve sebze köftesi, salata ve avokado ile."), VEGAN),
  ],
};

const kids: MenuCategory = {
  id: "kids",
  icon: "kids",
  label: { en: "Kids", tr: "Çocuk Menü" },
  dishes: [
    dish("kids-grilled-chicken-chips", "Grilled Chicken and Chips", "₺370", "Grilled chicken with chips.", "Izgara tavuk ve kızartılmış patates.", {
      photo: photo("kids-grilled-chicken-chips", 506, 259, "55% 55%"),
    }),
    dish("kids-chicken-breadcrumbs-chips", "Chicken in Breadcrumbs and Chips", "₺390", "Breaded chicken with chips.", "Tavuk şnitzel ve kızartılmış patates."),
    dish("kids-spaghetti-napolitana", "Spaghetti Napolitana", "₺310", "Spaghetti with tomato sauce.", "Domates soslu spagetti."),
    dish("kids-spaghetti-bolognese", "Spaghetti Bolognese", "₺475", "Spaghetti with Bolognese sauce.", "Bolonez soslu spagetti."),
  ],
};

/**
 * Sabor: Portuguese, Spanish and Italian cuisine. A demonstration built from
 * the restaurant's printed menu, with photographs from that menu and from a
 * set supplied to MenuFlex; not a client, so it is kept out of search
 * engines and Our Work.
 */
export const sabor: RestaurantMenu = {
  slug: "sabor",
  name: "sabor",
  subtitle: { en: "Portuguese · Spanish · Italian", tr: "Portekiz · İspanyol · İtalyan" },
  demo: true,
  defaultLocale: "tr",
  locales: ["tr", "en"],
  theme: { accent: "#d24b58", background: "#0a0908" },
  layout: "columns",
  note: {
    en: "Gluten-free pasta on request, +₺160. Paella takes about 45 minutes to prepare.",
    tr: "Glutensiz makarna seçeneği +₺160. Paellanın hazırlanması yaklaşık 45 dakika sürer.",
  },
  // starters, fish and meat first: the three columns a guest sees on opening
  categories: [tapas, paellaFish, meat, pasta, chicken, noodles, salads, kids],
};
