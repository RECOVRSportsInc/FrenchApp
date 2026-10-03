const languageCatalog = {
  fr: { name: "French", native: "Français", speech: "fr-FR", direction: "ltr" },
  pl: { name: "Polish", native: "Polski", speech: "pl-PL", direction: "ltr" },
  es: { name: "Spanish", native: "Español", speech: "es-ES", direction: "ltr" },
  it: { name: "Italian", native: "Italiano", speech: "it-IT", direction: "ltr" },
  ar: { name: "Arabic", native: "العربية", speech: "ar-SA", direction: "rtl" },
  en: { name: "English", native: "English", speech: "en-US", direction: "ltr" }
};

// Each row represents the same concept across all six languages.
// Arabic vocabulary uses Modern Standard Arabic.
const vocabulary = [
  { id:"book", en:"Book", fr:"Livre", pl:"Książka", es:"Libro", it:"Libro", ar:"كتاب" },
  { id:"dog", en:"Dog", fr:"Chien", pl:"Pies", es:"Perro", it:"Cane", ar:"كلب" },
  { id:"cat", en:"Cat", fr:"Chat", pl:"Kot", es:"Gato", it:"Gatto", ar:"قطة" },
  { id:"water", en:"Water", fr:"Eau", pl:"Woda", es:"Agua", it:"Acqua", ar:"ماء" },
  { id:"bread", en:"Bread", fr:"Pain", pl:"Chleb", es:"Pan", it:"Pane", ar:"خبز" },
  { id:"milk", en:"Milk", fr:"Lait", pl:"Mleko", es:"Leche", it:"Latte", ar:"حليب" },
  { id:"apple", en:"Apple", fr:"Pomme", pl:"Jabłko", es:"Manzana", it:"Mela", ar:"تفاحة" },
  { id:"house", en:"House", fr:"Maison", pl:"Dom", es:"Casa", it:"Casa", ar:"بيت" },
  { id:"door", en:"Door", fr:"Porte", pl:"Drzwi", es:"Puerta", it:"Porta", ar:"باب" },
  { id:"window", en:"Window", fr:"Fenêtre", pl:"Okno", es:"Ventana", it:"Finestra", ar:"نافذة" },
  { id:"table", en:"Table", fr:"Table", pl:"Stół", es:"Mesa", it:"Tavolo", ar:"طاولة" },
  { id:"chair", en:"Chair", fr:"Chaise", pl:"Krzesło", es:"Silla", it:"Sedia", ar:"كرسي" },
  { id:"sun", en:"Sun", fr:"Soleil", pl:"Słońce", es:"Sol", it:"Sole", ar:"شمس" },
  { id:"moon", en:"Moon", fr:"Lune", pl:"Księżyc", es:"Luna", it:"Luna", ar:"قمر" },
  { id:"day", en:"Day", fr:"Jour", pl:"Dzień", es:"Día", it:"Giorno", ar:"يوم" },
  { id:"night", en:"Night", fr:"Nuit", pl:"Noc", es:"Noche", it:"Notte", ar:"ليل" },
  { id:"hand", en:"Hand", fr:"Main", pl:"Ręka", es:"Mano", it:"Mano", ar:"يد" },
  { id:"foot", en:"Foot", fr:"Pied", pl:"Stopa", es:"Pie", it:"Piede", ar:"قدم" },
  { id:"eye", en:"Eye", fr:"Œil", pl:"Oko", es:"Ojo", it:"Occhio", ar:"عين" },
  { id:"head", en:"Head", fr:"Tête", pl:"Głowa", es:"Cabeza", it:"Testa", ar:"رأس" },
  { id:"car", en:"Car", fr:"Voiture", pl:"Samochód", es:"Coche", it:"Auto", ar:"سيارة" },
  { id:"school", en:"School", fr:"École", pl:"Szkoła", es:"Escuela", it:"Scuola", ar:"مدرسة" },
  { id:"friend", en:"Friend", fr:"Ami", pl:"Przyjaciel", es:"Amigo", it:"Amico", ar:"صديق" },
  { id:"word", en:"Word", fr:"Mot", pl:"Słowo", es:"Palabra", it:"Parola", ar:"كلمة" }
];