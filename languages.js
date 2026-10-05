// Keep "fr" to preserve existing language preferences and practice history.
const languageCatalog = {
  fr: { name: "French (France)", native: "Français", speech: "fr-FR", direction: "ltr", family: "fr" },
  frCA: { name: "French (Canada)", native: "Français canadien", speech: "fr-CA", direction: "ltr", family: "fr" },
  pl: { name: "Polish", native: "Polski", speech: "pl-PL", direction: "ltr", family: "pl" },
  es: { name: "Spanish", native: "Español", speech: "es-ES", direction: "ltr", family: "es" },
  it: { name: "Italian", native: "Italiano", speech: "it-IT", direction: "ltr", family: "it" },
  ar: { name: "Modern Standard Arabic", native: "العربية الفصحى", speech: "ar-SA", direction: "rtl", family: "ar" },
  en: { name: "English", native: "English", speech: "en-US", direction: "ltr", family: "en" }
};

function sameLanguageFamily(first, second) {
  return languageCatalog[first].family === languageCatalog[second].family;
}