import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Logo from "./Logo";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-vz-charcoal/80 backdrop-blur-md border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.community.title")}</h3>
            <ul className="space-y-2">
              <li><Link to="/friends" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.community.friends")}</Link></li>
              <li><Link to="/leaderboard" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.community.leaderboard")}</Link></li>
              <li><a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.community.discord")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.platform.title")}</h3>
            <ul className="space-y-2">
              <li><Link to="/catalog" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.platform.catalog")}</Link></li>
              <li><Link to="/library" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.platform.library")}</Link></li>
              <li><Link to="/profile" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.platform.analytics")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.shop.title")}</h3>
            <ul className="space-y-2">
              <li><Link to="/coming-soon" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.shop.offers")}</Link></li>
              <li><Link to="/coming-soon" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.shop.giftCards")}</Link></li>
              <li><Link to="/coming-soon" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.shop.redeem")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.support.title")}</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.support.help")}</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.support.contact")}</Link></li>
              <li><Link to="/privacy" className="text-sm text-slate-400 hover:text-vz-lime transition-colors">{t("footer.support.privacy")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="group shrink-0">
            <Logo className="text-2xl group-hover:scale-105 transition-transform" variant="text" />
          </Link>
          <p className="text-xs text-slate-500 text-center md:text-right">
            © Archetype Analytics 2025-{currentYear} -{" "}
            <a href="https://github.com/girellebenibenj-byte" target="_blank" rel="noopener noreferrer" className="hover:text-vz-lime transition-colors">Beni G.</a>,{" "}
            <a href="https://github.com/annadigiglio-lgtm" target="_blank" rel="noopener noreferrer" className="hover:text-vz-lime transition-colors">Digiglio A.</a>,{" "}
            <a href="https://github.com/joshua-BID" target="_blank" rel="noopener noreferrer" className="hover:text-vz-lime transition-colors">Galarza J.G.</a>,{" "}
            <a href="https://github.com/giosuetedeschi-spec" target="_blank" rel="noopener noreferrer" className="hover:text-vz-lime transition-colors">Tedeschi G.</a>,{" "}
            <a href="https://github.com/LorVur" target="_blank" rel="noopener noreferrer" className="hover:text-vz-lime transition-colors">Vurchio L.</a>,{" "}
            <a href="https://github.com/MDL-CNAKE" target="_blank" rel="noopener noreferrer" className="hover:text-vz-lime transition-colors">El Mbimbey M.</a>
          </p>
        </div>
      </div>
    </footer>
  );
}