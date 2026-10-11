import React, { useState } from 'react';

interface AvanyxLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  compact?: boolean;
  src?: string;
}

export const AvanyxLogo: React.FC<AvanyxLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  compact = false,
  src = '/avanyx-store-logo.webp',
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Logo Squircle */}
      <div
        className="relative shrink-0 flex items-center justify-center overflow-hidden rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-105"
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
        }}
      >
        {!imgError ? (
          <picture className="w-full h-full">
            <source srcSet="/avanyx-store-logo.webp" type="image/webp" />
            <source srcSet="/avanyx-logo.svg" type="image/svg+xml" />
            <img
              src={src}
              alt="AVANYX Store Official Logo - Verified APK Marketplace"
              className="w-full h-full object-contain rounded-2xl"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
            />
          </picture>
        ) : (
          <svg
            viewBox="0 0 512 512"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="512" height="512" rx="114" fill="#4F46E5" />
            <path d="M 256 114 L 389 389 H 322 L 256 256 L 190 389 H 123 Z" fill="#FFFFFF" />
            <path d="M 180 303 H 332 L 256 161 Z" fill="#38BDF8" />
          </svg>
        )}
      </div>

      {/* Typography Badge (shown when not compact and showText is true) */}
      {showText && !compact && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-black tracking-tight text-[#1D1B20] dark:text-[#E6E1E5]">
              AVANYX
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#6750A4]/15 dark:bg-[#D0BCFF]/20 text-[#6750A4] dark:text-[#D0BCFF] font-bold tracking-wider uppercase">
              STORE
            </span>
          </div>
          <span className="text-[9px] text-[#49454F] dark:text-[#CAC4D0] font-semibold tracking-wider mt-1 uppercase truncate">
            Verified APK Marketplace
          </span>
        </div>
      )}
    </div>
  );
};
