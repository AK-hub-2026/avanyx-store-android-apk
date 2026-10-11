import React from 'react';
import { BadgeCheck, Shield, Crown } from 'lucide-react';

interface AvanyxIdentityAvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customSizeClass?: string;
  showBadge?: boolean;
  badgeType?: 'VERIFIED' | 'ADMIN' | 'DEV' | 'STUDENT' | 'NONE';
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AvanyxIdentityAvatar: React.FC<AvanyxIdentityAvatarProps> = ({
  src = '/avanyx-identity-avatar.svg',
  name = 'AVANYX User',
  size = 'md',
  customSizeClass,
  showBadge = false,
  badgeType = 'NONE',
  glow = false,
  className = '',
  onClick
}) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl',
    '2xl': 'w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem]'
  };

  const currentSizeClass = customSizeClass || sizeClasses[size] || sizeClasses.md;

  const getBadge = () => {
    if (!showBadge || badgeType === 'NONE') return null;

    switch (badgeType) {
      case 'ADMIN':
        return (
          <span
            className="absolute -bottom-1 -right-1 p-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-2 ring-white dark:ring-[#1E1F23]"
            title="AVANYX Administrator"
          >
            <Crown className="w-3.5 h-3.5" />
          </span>
        );
      case 'DEV':
        return (
          <span
            className="absolute -bottom-1 -right-1 p-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-2 ring-white dark:ring-[#1E1F23]"
            title="Verified Developer"
          >
            <BadgeCheck className="w-3.5 h-3.5" />
          </span>
        );
      case 'STUDENT':
        return (
          <span
            className="absolute -bottom-1 -right-1 p-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md ring-2 ring-white dark:ring-[#1E1F23]"
            title="Verified Student"
          >
            <Shield className="w-3.5 h-3.5" />
          </span>
        );
      case 'VERIFIED':
      default:
        return (
          <span
            className="absolute -bottom-1 -right-1 p-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md ring-2 ring-white dark:ring-[#1E1F23]"
            title="AVANYX Identity Verified"
          >
            <BadgeCheck className="w-3.5 h-3.5" />
          </span>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-block select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`relative overflow-hidden ${currentSizeClass} bg-[#0A0A0C] ring-2 ring-amber-400/40 dark:ring-amber-400/60 shadow-lg ${
          glow ? 'shadow-amber-500/20 shadow-xl ring-amber-400' : ''
        } transition-all duration-300`}
      >
        {!imgError ? (
          <picture className="w-full h-full">
            <source srcSet="/avanyx-identity-avatar.webp" type="image/webp" />
            <img
              src={src || '/avanyx-identity-avatar.webp'}
              alt={name ? `${name} - AVANYX Identity Profile Avatar` : 'AVANYX User Identity Profile Avatar'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </picture>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1F1C18] via-[#0D0D10] to-[#050506] text-amber-300 font-bold font-serif text-sm">
            <span>AK</span>
          </div>
        )}
      </div>
      {getBadge()}
    </div>
  );
};
