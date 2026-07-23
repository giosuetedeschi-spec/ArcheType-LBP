import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <Rocket className="w-20 h-20 text-vz-pink mb-6 animate-bounce" />
      <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
        Coming Soon
      </h1>
      <p className="text-lg text-zinc-400 max-w-md mb-8">
        Questa funzionalità è in fase di sviluppo. Torna presto per scoprire le novità!
      </p>
      <Link
        to="/"
        className="px-8 py-3 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
      >
        Torna alla Home
      </Link>
    </div>
  );
}
