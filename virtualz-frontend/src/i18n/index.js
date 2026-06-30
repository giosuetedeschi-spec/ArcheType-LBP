import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import it from "./locales/it/translation.json";
import en from "./locales/en/translation.json";
import fr from "./locales/fr/translation.json";
import es from "./locales/es/translation.json";

// Le 4 lingue richieste dal cliente (vedi deck VirtualZ, header con bandiera IT/EN).
// Aggiunte anche FR e ES su richiesta esplicita del Product Owner.
export const SUPPORTED_LANGUAGES = ["it", "en", "fr", "es"];

i18n
  .use(LanguageDetector) // rileva la lingua del browser al primo accesso
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false, // React già fa l'escaping
    },
    detection: {
      // Ordine di rilevamento: prima la scelta salvata dall'utente,
      // poi la lingua del browser, infine il fallback (en).
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "virtualz_language",
    },
  });

export default i18n;
