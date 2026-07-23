import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

/**
 * Centro assistenza — FAQ generiche, al posto del redirect a /coming-soon
 * che c'era prima nel footer. Domande scritte da noi (nessun contenuto
 * legale/contrattuale reale, coerente col resto del progetto studentesco).
 */
export default function FaqPage() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-20">
      <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 text-center">
        {t("faq.title")}
      </h1>
      <p className="text-slate-400 mb-12 text-center max-w-md">
        {t("faq.intro")}{" "}
        <Link to="/contact" className="text-vz-lime hover:underline">{t("faq.contactLink")}</Link>.
      </p>

      <div className="w-full max-w-2xl space-y-3 mb-10">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="rounded-lg border border-slate-700 bg-vz-charcoal overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-slate-100 font-medium hover:text-vz-lime transition-colors"
                aria-expanded={isOpen}
              >
                {item.q}
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-slate-400 text-sm">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>

      <Link
        to="/"
        className="px-8 py-3 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
      >
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
