import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Phone, MapPin, Globe, Mail } from "lucide-react";

/**
 * Pagina Contatti — info reali del team (indirizzo, telefono, sito, email),
 * al posto del redirect a /coming-soon che c'era prima nel footer.
 * I dati di contatto (numero, indirizzo, sito, email) restano identici in
 * tutte le lingue — sono dati reali, non testo da tradurre.
 */
export default function ContactPage() {
  const { t } = useTranslation();
  const contacts = [
    { icon: Phone, label: "Tel. 011 55 000 36", href: "tel:+390155000036" },
    { icon: MapPin, label: "Via Jacopo Durandi 10", href: null },
    { icon: Globe, label: "www.archetype.it", href: "https://www.archetype.it" },
    { icon: Mail, label: "virtualz@archetype.it", href: "mailto:virtualz@archetype.it" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-12">
        {t("contact.title")}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-10">
        {contacts.map(({ icon: Icon, label, href }) => {
          const content = (
            <div className="flex items-center justify-center gap-3 rounded-full border border-slate-700 bg-vz-charcoal px-6 py-4 text-slate-200 hover:border-vz-lime hover:text-vz-lime transition-colors">
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{label}</span>
            </div>
          );
          return href ? (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            <div key={label}>{content}</div>
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
