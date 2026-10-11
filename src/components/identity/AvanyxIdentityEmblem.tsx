import React from 'react';

interface AvanyxIdentityEmblemProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
  showText?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

export const AvanyxIdentityEmblem: React.FC<AvanyxIdentityEmblemProps> = ({
  size = 48,
  className = '',
  glow = false,
  showText = false,
  subtitle = 'One Identity. All AVANYX Platforms.',
  onClick
}) => {
  const pixelSize = typeof size === 'number' ? size : parseInt(size.toString(), 10) || 48;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Golden Crown AK Medallion */}
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-full transition-transform duration-300 ${
          onClick ? 'hover:scale-105' : ''
        }`}
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`
        }}
      >
        {/* Ambient Glow */}
        {glow && (
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/40 via-yellow-400/30 to-amber-600/40 blur-md pointer-events-none"
            style={{ transform: 'scale(1.2)' }}
          />
        )}

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Ring Gold Gradient */}
            <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Inner Emblem Fill Gradient */}
            <linearGradient id="goldEmblemFill" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FCD34D" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Background Radial Shade */}
            <radialGradient id="darkCoreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E1912" />
              <stop offset="75%" stopColor="#0F0C08" />
              <stop offset="100%" stopColor="#050505" />
            </radialGradient>
          </defs>

          {/* Dark Disc Canvas */}
          <circle cx="100" cy="100" r="94" fill="url(#darkCoreGrad)" />

          {/* Outer Border Double Ring */}
          <circle cx="100" cy="100" r="92" stroke="url(#goldRingGrad)" strokeWidth="3.5" />
          <circle cx="100" cy="100" r="85" stroke="url(#goldRingGrad)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

          {/* 3-Point Royal Crown at Top */}
          <g transform="translate(100, 48) scale(0.9) translate(-100, -48)">
            <path
              d="M 64 62 L 72 44 L 88 56 L 100 36 L 112 56 L 128 44 L 136 62 Z"
              fill="url(#goldEmblemFill)"
            />
            {/* Crown Jewels (circles) */}
            <circle cx="72" cy="42" r="2.5" fill="#FEF08A" />
            <circle cx="100" cy="33" r="3" fill="#FEF08A" />
            <circle cx="128" cy="42" r="2.5" fill="#FEF08A" />
            {/* Crown Base Band */}
            <rect x="66" y="64" width="68" height="4" rx="2" fill="url(#goldEmblemFill)" />
          </g>

          {/* Stylized Interlocking "A K" Monogram */}
          <g id="monogram-ak" fill="url(#goldEmblemFill)">
            {/* Left Leg of A */}
            <path d="M 68 152 L 94 82 L 106 82 L 80 152 Z" />
            
            {/* Right Leg of A (which merges into K spine) */}
            <path d="M 106 82 L 118 82 L 92 152 L 80 152 Z" />

            {/* A Crossbar */}
            <rect x="76" y="122" width="34" height="7" rx="1.5" />

            {/* K Top Diagonal Branch with Serifs */}
            <path d="M 102 118 L 134 84 L 148 84 L 114 122 Z" />

            {/* K Bottom Diagonal Leg */}
            <path d="M 112 116 L 148 152 L 134 152 L 102 120 Z" />

            {/* Left flourish wing */}
            <path
              d="M 50 102 C 54 88 62 80 70 76 C 66 84 64 94 62 104 Z"
              opacity="0.75"
            />
            {/* Right flourish wing */}
            <path
              d="M 150 102 C 146 88 138 80 130 76 C 134 84 136 94 138 104 Z"
              opacity="0.75"
            />
          </g>
        </svg>
      </div>

      {/* Optional Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase">
              AVANYX IDENTITY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-wider">
              v0.03
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-[#A1A1AA] font-medium tracking-tight truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
