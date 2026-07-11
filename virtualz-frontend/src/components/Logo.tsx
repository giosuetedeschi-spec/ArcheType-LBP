import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  variant?: 'image' | 'text';
}

/**
 * Logo VirtualZ in due varianti:
 * - 'text': wordmark con gradiente blu→rosa ("Virtual") e rosa→lime ("Z")
 * - 'image': gemma sfaccettata SVG inline, gradiente blu→viola allineato
 *   all'attacco del wordmark (stessi anchor di blue-500 → purple-500).
 *   SVG inline al posto del vecchio /logo.png: niente asset da servire,
 *   scala nitida a ogni size e colori sincronizzati col brand.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 64,
  className = '',
  glow = true,
  variant = 'image',
}) => {
  if (variant === 'text') {
    return (
      <div className={className}>
        <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
          Virtual
        </span>
        <span className="bg-gradient-to-r from-pink-500 to-vz-lime bg-clip-text text-transparent">
          Z
        </span>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="VirtualZ Logo"
      style={{
        width: size,
        height: size,
        filter: glow ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' : 'none',
      }}
      className={className}
    >
      <defs>
        <linearGradient id="vz-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <polygon points="32,6 53,15 53,31 32,58 11,31 11,15" fill="url(#vz-gem)" />
      <polygon points="11,15 32,6 32,24" fill="#fff" opacity="0.22" />
      <polygon points="53,15 32,6 32,24" fill="#0f1729" opacity="0.18" />
      <polygon points="11,15 11,31 32,58 32,24" fill="#fff" opacity="0.10" />
      <polygon points="53,15 53,31 32,58 32,24" fill="#0f1729" opacity="0.28" />
    </svg>
  );
};

export default Logo;
