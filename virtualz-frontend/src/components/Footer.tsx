import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Logo from "./Logo";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-vz-charcoal/80 backdrop-blur-md border-t border-zinc-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.community.title")}</h3>
            <ul className="space-y-2">
              <li><Link to="/friends" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.community.friends")}</Link></li>
              <li><Link to="/leaderboard" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.community.leaderboard")}</Link></li>
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.community.discord")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.platform.title")}</h3>
            <ul className="space-y-2">
              <li><Link to="/catalog" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.platform.catalog")}</Link></li>
              <li><Link to="/library" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.platform.library")}</Link></li>
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.platform.analytics")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.shop.title")}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.shop.offers")}</a></li>
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.shop.giftCards")}</a></li>
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.shop.redeem")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-white mb-4">{t("footer.support.title")}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.support.help")}</a></li>
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.support.contact")}</a></li>
              <li><a href="#" className="text-sm text-zinc-400 hover:text-vz-lime transition-colors">{t("footer.support.privacy")}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo className="text-2xl" />
          <p className="text-xs text-zinc-500 text-center md:text-right">
            © Archetype Analytics 2025-{currentYear} - Beni G., Digiglio A., Galarza J.G., Tedeschi G., Vurchio L., El Mbimbey M.
          </p>
        </div>
      </div>
    </footer>
  );
}