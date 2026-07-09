/**
 * HeroSection - Full-screen hero with YouTube video background
 *
 * Features:
 * - Autoplay muted YouTube video loop as background
 * - Graceful fallback to a branded gradient if the embed fails (error 101/150/152)
 * - Dark gradient overlay for text readability
 * - Animated logo, tagline, and CTA buttons
 * - Scroll-down indicator with bounce animation
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const HERO_VIDEO_ID = "_BcBikeJhTk";

export default function HeroSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [videoFailed, setVideoFailed] = useState(false);

  // Carica l'IFrame Player API di YouTube per intercettare gli errori di embed.
  // Se il video è stato rimosso o ha l'embed disabilitato, onError scatta e
  // mostriamo lo sfondo di fallback invece del riquadro d'errore di YouTube.
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    let player: { destroy?: () => void } | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onYouTubeIframeAPIReady = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player = new (window as any).YT.Player("hero-video", {
        events: { onError: () => setVideoFailed(true) },
      });
    };

    return () => {
      tag.remove();
      player?.destroy?.();
    };
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Sfondo di fallback brandizzato: sempre presente sotto al video */}
      <div
        className="absolute inset-0 bg-vz-navy-deep"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(240,85,155,0.18), transparent 45%)," +
            "radial-gradient(circle at 75% 65%, rgba(200,242,74,0.14), transparent 45%)",
        }}
      />

      {/* Video di sfondo YouTube (nascosto se l'embed fallisce) */}
      {!videoFailed && (
        <div className="absolute inset-0">
          <iframe
            id="hero-video"
            src={`https://www.youtube.com/embed/${HERO_VIDEO_ID}?enablejsapi=1&autoplay=1&mute=1&controls=0&loop=1&playlist=${HERO_VIDEO_ID}&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
            className="absolute top-1/2 left-1/2 min-w-full min-h-full"
            style={{
              width: "100vw",
              height: "56.25vw",
              minHeight: "100vh",
              minWidth: "177.77vh",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
            title="Hero Background Video"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
          />
        </div>
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-vz-navy/85 via-vz-navy-deep/75 to-vz-navy-deep/95" />

      {/* Hero content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in-up mb-6">
          <Logo className="text-5xl sm:text-6xl md:text-7xl" />
        </div>

        <p
          className="text-lg sm:text-xl md:text-2xl text-white/90 font-display font-light mb-10 tracking-wide animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          {t("nav.tagline")}
        </p>

        <div
          className="flex flex-wrap gap-5 justify-center animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <Link
            to="/catalog"
            className="px-10 py-4 rounded-full bg-vz-lime text-vz-navy font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-vz-lime/30 transition-all duration-200"
          >
            {t("home.exploreCatalog")}
          </Link>

          {!isAuthenticated && (
            <Link
              to="/register"
              className="px-10 py-4 rounded-full border-2 border-white/80 text-white font-semibold text-lg hover:bg-white hover:text-vz-navy transition-all duration-200"
            >
              {t("home.getStarted")}
            </Link>
          )}
        </div>
      </div>

      {/* Scroll-down indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
