/**
 * Logo - Archetype Analytics / VirtualZ official logo
 * 
 * Features:
 * - Stylized "V" icon with neon glow effect
 * - "VirtualZ" text in official pink color (#ff66c4)
 * - Scalable via className prop
 * 
 * Design:
 * - V icon: Gradient from blue (#2c346b) to lime (#e1f16b)
 * - Glow effect using SVG filters
 * - Clean, modern aesthetic matching brand identity
 */

interface LogoProps {
  className?: string;
  showText?: boolean; // Toggle between icon-only and full logo
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* V Icon with neon effect */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          {/* Gradient for the V */}
          <linearGradient id="vGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c346b" />
            <stop offset="50%" stopColor="#4a5499" />
            <stop offset="100%" stopColor="#e1f16b" />
          </linearGradient>
          
          {/* Glow filter for neon effect */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Stylized V shape */}
        <path
          d="M8 12 L24 38 L40 12"
          stroke="url(#vGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#neonGlow)"
        />
        
        {/* Inner V for depth */}
        <path
          d="M14 16 L24 32 L34 16"
          stroke="#ff66c4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
        />
      </svg>
      
      {/* VirtualZ text */}
      {showText && (
        <span 
          className="font-display font-bold text-3xl tracking-tight"
          style={{ color: '#ff66c4' }}
        >
          VirtualZ
        </span>
      )}
    </div>
  );
}
