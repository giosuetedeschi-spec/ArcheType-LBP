import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * Informativa sulla privacy — testo placeholder standard, coerente con un
 * progetto studentesco (cliente fittizio Zero Lag S.r.l.). Non è consulenza
 * legale né un testo redatto da un legale: va sostituito con un testo reale
 * se il progetto viene mai messo in produzione con utenti veri.
 */
export default function PrivacyPage() {
  const { t, i18n } = useTranslation();
  const sections = [1, 2, 3, 4, 5].map((n) => ({
    title: t(`privacy.section${n}Title`),
    body: t(`privacy.section${n}Body`),
  }));

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 text-center">
          {t("privacy.title")}
        </h1>

        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <p>
            {t("privacy.lastUpdated")}{" "}
            {new Date().toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" })}
          </p>

          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-lg font-display font-semibold text-white mb-2">{s.title}</h2>
              <p>
                {s.body}
                {i === sections.length - 1 && (
                  <>
                    {" "}
                    <a href="mailto:virtualz@archetype.it" className="text-vz-lime hover:underline">
                      virtualz@archetype.it
                    </a>.
                  </>
                )}
              </p>
            </section>
          ))}
        </div>
      </div>

      <Link
        to="/"
        className="mt-12 px-8 py-3 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
      >
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
