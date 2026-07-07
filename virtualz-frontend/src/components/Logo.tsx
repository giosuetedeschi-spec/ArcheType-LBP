/**
 * Logo VirtualZ — "Virtual" con gradiente rosa→bianco, "Z" lime.
 * Usato in navbar, homepage, login, register per coerenza di brand.
 * La prop `className` permette di scalare la dimensione (es. text-xl, text-7xl).
 *
 * NOTA: esisteva anche un Logo.tsx con icona SVG + effetto glow neon,
 * mai renderizzato a schermo (Vite risolve .jsx prima di .tsx quando
 * coesistono con lo stesso nome) — vedi issue #108. Questo file sostituisce
 * entrambi con il design attualmente live (solo testo), in attesa di una
 * decisione di design definitiva allineata al mockup cliente.
 */
interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`font-display font-bold ${className}`}>
      <span className="bg-gradient-to-r from-vz-pink to-white bg-clip-text text-transparent">
        Virtual
      </span>
      <span className="text-vz-lime">Z</span>
    </span>
  );
}
