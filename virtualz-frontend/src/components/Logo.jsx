/**
 * Logo VirtualZ — "Virtual" con gradiente rosa→bianco, "Z" lime.
 * Usato in navbar, homepage, login, register per coerenza di brand.
 * La prop `className` permette di scalare la dimensione (es. text-xl, text-7xl).
 */
export default function Logo({ className = "" }) {
  return (
    <span className={`font-display font-bold ${className}`}>
      <span
        className="bg-gradient-to-r from-vz-pink to-white bg-clip-text text-transparent"
      >
        Virtual
      </span>
      <span className="text-vz-lime">Z</span>
    </span>
  );
}
