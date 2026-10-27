/**
 * Site copy in English and Turkish. Components receive one dictionary and
 * never contain copy of their own.
 */
export const locales = ["en", "tr"] as const;
export type Locale = (typeof locales)[number];

/** Home page path for each language. */
export const homePath: Record<Locale, string> = { en: "/", tr: "/tr/" };

const en = {
  meta: {
    title: "MenuFlex — Your menu, beautifully digital",
    description:
      "MenuFlex helps restaurants create and manage digital menus through QR codes — simple, elegant and always up to date.",
  },
  nav: { home: "Home", work: "Our Work", how: "How It Works", contact: "Contact", menu: "Menu", close: "Close" },
  language: { label: "Language", en: "English", tr: "Türkçe" },
  hero: {
    eyebrow: ["Modern menus", "Happier guests"],
    title: ["Your menu,", "beautifully digital."],
    body: "MenuFlex helps restaurants create and manage digital menus through QR codes — simple, elegant and always up to date.",
    whatsapp: "WhatsApp",
    call: "Call",
    email: "Email",
    explore: "Explore Our Work",
  },
  menus: {
    breakfast: "Breakfast",
    mains: "Main Courses",
    appetizers: "Appetizers",
    pizza: "Pizza",
    desserts: "Desserts",
    drinks: "Drinks",
    alt: "An open printed restaurant menu:",
  },
  qr: {
    label: "Demo QR code: scan to open the example LIMAN digital menu",
    caption: "Demo · scan to try",
  },
  work: {
    eyebrow: "Our Work",
    title: "Restaurants serving their menus with MenuFlex",
    open: "open digital menu",
  },
  how: {
    eyebrow: "How It Works",
    title: "Three steps to your digital menu",
    steps: [
      { title: "Send us your menu.", body: "A PDF, a photo or your printed menu — whatever you have is enough." },
      { title: "We create your digital menu.", body: "Your dishes, prices and photos, designed to match your restaurant." },
      {
        title: "Receive your QR code.",
        body: "Place it on your tables. We manage future updates: when something changes, just send us a message.",
      },
    ],
  },
  pricing: {
    eyebrow: "Subscription",
    title: "One simple subscription",
    body: "Everything your restaurant needs for its digital menu.",
    features: [
      "Digital menu designed for your restaurant",
      "Your QR code, ready to print",
      "Updates managed by us",
      "Works on every phone, nothing to install",
    ],
    period: { month: "per month", year: "per year" },
    ask: "Ask us for the current price",
    cta: "Get started",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's make your menu digital",
    body: "Message us on WhatsApp, call or email — or leave a short note and we'll get back to you.",
    whatsapp: "WhatsApp",
    phone: "Phone",
    email: "Email",
    form: {
      title: "Send a short message",
      name: "Your name",
      restaurant: "Restaurant",
      message: "Message",
      placeholder: "Tell us a little about your restaurant and menu.",
      viaWhatsapp: "Send via WhatsApp",
      viaEmail: "Send via email",
      subject: "MenuFlex enquiry",
      intro: "Hello MenuFlex,",
    },
    unavailable: "Contact details will appear here soon.",
  },
  footer: { rights: "All rights reserved.", product: "A FASFAR product." },
  demo: {
    badge: "Demo menu by MenuFlex",
    back: "Back to MenuFlex",
  },
};

export type Dictionary = typeof en;

const tr: Dictionary = {
  meta: {
    title: "MenuFlex — Menünüz, zarifçe dijital",
    description:
      "MenuFlex, restoranların QR kodla açılan dijital menülerini oluşturmasına ve yönetmesine yardımcı olur — sade, şık ve her zaman güncel.",
  },
  nav: { home: "Ana Sayfa", work: "Çalışmalarımız", how: "Nasıl Çalışır", contact: "İletişim", menu: "Menü", close: "Kapat" },
  language: { label: "Dil", en: "English", tr: "Türkçe" },
  hero: {
    eyebrow: ["Modern menüler", "Mutlu misafirler"],
    title: ["Menünüz,", "zarifçe dijital."],
    body: "MenuFlex, restoranların QR kodla açılan dijital menülerini oluşturmasına ve yönetmesine yardımcı olur — sade, şık ve her zaman güncel.",
    whatsapp: "WhatsApp",
    call: "Ara",
    email: "E-posta",
    explore: "Çalışmalarımızı Keşfedin",
  },
  menus: {
    breakfast: "Kahvaltı",
    mains: "Ana Yemekler",
    appetizers: "Başlangıçlar",
    pizza: "Pizza",
    desserts: "Tatlılar",
    drinks: "İçecekler",
    alt: "Açık, basılı bir restoran menüsü:",
  },
  qr: {
    label: "Demo QR kod: örnek LIMAN dijital menüsünü açmak için okutun",
    caption: "Demo · okutup deneyin",
  },
  work: {
    eyebrow: "Çalışmalarımız",
    title: "Menülerini MenuFlex ile sunan restoranlar",
    open: "dijital menüyü aç",
  },
  how: {
    eyebrow: "Nasıl Çalışır",
    title: "Dijital menünüze üç adım",
    steps: [
      { title: "Menünüzü bize gönderin.", body: "PDF, fotoğraf ya da basılı menünüz — elinizde ne varsa yeterli." },
      { title: "Dijital menünüzü hazırlayalım.", body: "Yemekleriniz, fiyatlarınız ve fotoğraflarınız, restoranınıza uygun bir tasarımla." },
      {
        title: "QR kodunuzu teslim alın.",
        body: "Masalarınıza yerleştirin. Sonraki güncellemeleri biz yönetiriz: bir şey değiştiğinde bize mesaj atmanız yeterli.",
      },
    ],
  },
  pricing: {
    eyebrow: "Abonelik",
    title: "Tek ve sade bir abonelik",
    body: "Restoranınızın dijital menüsü için ihtiyaç duyduğu her şey.",
    features: [
      "Restoranınıza özel tasarlanmış dijital menü",
      "Baskıya hazır QR kodunuz",
      "Güncellemeler bizden",
      "Her telefonda çalışır, kurulum gerektirmez",
    ],
    period: { month: "aylık", year: "yıllık" },
    ask: "Güncel fiyat için bize ulaşın",
    cta: "Hemen başlayın",
  },
  contact: {
    eyebrow: "İletişim",
    title: "Menünüzü birlikte dijitale taşıyalım",
    body: "WhatsApp'tan yazın, arayın ya da e-posta gönderin — veya kısa bir not bırakın, size dönelim.",
    whatsapp: "WhatsApp",
    phone: "Telefon",
    email: "E-posta",
    form: {
      title: "Kısa bir mesaj gönderin",
      name: "Adınız",
      restaurant: "Restoran",
      message: "Mesaj",
      placeholder: "Restoranınızdan ve menünüzden biraz bahsedin.",
      viaWhatsapp: "WhatsApp ile gönder",
      viaEmail: "E-posta ile gönder",
      subject: "MenuFlex talebi",
      intro: "Merhaba MenuFlex,",
    },
    unavailable: "İletişim bilgileri yakında burada olacak.",
  },
  footer: { rights: "Tüm hakları saklıdır.", product: "Bir FASFAR ürünüdür." },
  demo: {
    badge: "MenuFlex demo menüsü",
    back: "MenuFlex'e dön",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, tr };
