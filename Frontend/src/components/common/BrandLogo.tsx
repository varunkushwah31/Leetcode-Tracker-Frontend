import React, { useId } from 'react';
import { Link } from 'react-router-dom';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BrandIconProps {
  size?: BrandLogoSize | number;
  className?: string;
  withGlow?: boolean;
}

const sizeToIconClass: Record<BrandLogoSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-7.5 h-7.5',
  md: 'w-9.5 h-9.5',
  lg: 'w-11.5 h-11.5',
  xl: 'w-14 h-14',
};

const sizeToTextClass: Record<BrandLogoSize, string> = {
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

/**
 * Modern geometric Brand Icon for MentorSync.
 * Symbolizes:
 * 1. The letter 'M' (Mentor & Mastery)
 * 2. Code brackets '<' and '>' meeting at the central nexus
 * 3. A kinetic upward sync chevron and real-time telemetry pulse node
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  className = '',
  withGlow = true,
}) => {
  const reactId = useId();
  const cleanId = reactId.replace(/[^a-zA-Z0-9]/g, '');
  const bgGradId = `ms-bg-${cleanId}`;
  const syncGradId = `ms-sync-${cleanId}`;
  const borderGradId = `ms-border-${cleanId}`;
  const glowFilterId = `ms-glow-${cleanId}`;

  const dimensionStyle =
    typeof size === 'number'
      ? { width: size, height: size }
      : undefined;

  const dimensionClass =
    typeof size === 'string' ? sizeToIconClass[size] : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${dimensionClass} ${className}`}
      style={dimensionStyle}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
        aria-hidden="true"
      >
        <defs>
          {/* Base squircle gradient: Vibrant Indigo -> Electric Violet */}
          <linearGradient id={bgGradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#5b4fff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          {/* Upward sync chevron gradient: Electric Cyan -> Aqua */}
          <linearGradient id={syncGradId} x1="25" y1="34" x2="39" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>

          {/* Crisp border shine */}
          <linearGradient id={borderGradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
          </linearGradient>

          {/* Ambient drop shadow */}
          {withGlow && (
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#4f46e5" floodOpacity="0.4" />
            </filter>
          )}
        </defs>

        {/* Squircle Body */}
        <rect
          width="64"
          height="64"
          rx="16"
          fill={`url(#${bgGradId})`}
          filter={withGlow ? `url(#${glowFilterId})` : undefined}
        />

        {/* Subtle Frosted Edge Highlight */}
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="15.25"
          stroke={`url(#${borderGradId})`}
          strokeWidth="1.5"
        />

        {/* Futuristic Monogram 'M' with code chevron geometry */}
        <path
          d="M 17 44 V 22.5 C 17 20.6 18.8 19.5 20.5 20.3 L 32 28 L 43.5 20.3 C 45.2 19.5 47 20.6 47 22.5 V 44"
          stroke="white"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upward Kinetic Sync Chevron */}
        <path
          d="M 25 39.5 L 32 34.5 L 39 39.5"
          stroke={`url(#${syncGradId})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Telemetry Pulse Spark Node */}
        <circle cx="32" cy="18" r="2.6" fill="#38bdf8" />
        <circle cx="32" cy="18" r="1.3" fill="white" />
      </svg>
    </div>
  );
};

export interface BrandLogoProps {
  size?: BrandLogoSize;
  showWordmark?: boolean;
  subtext?: string;
  theme?: 'auto' | 'dark' | 'light';
  asLink?: boolean;
  to?: string;
  className?: string;
  wordmarkClassName?: string;
  withGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  subtext,
  theme = 'auto',
  asLink = true,
  to = '/',
  className = '',
  wordmarkClassName = '',
  withGlow = true,
}) => {
  const textClass = sizeToTextClass[size];

  const primaryTextColor =
    theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-zinc-900'
      : 'text-zinc-900 dark:text-white';

  const content = (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <div className="transition-transform duration-200 group-hover:scale-105">
        <BrandIcon size={size} withGlow={withGlow} />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight leading-none ${textClass} ${primaryTextColor} ${wordmarkClassName}`}
          >
            Mentor
            <span className="bg-linear-to-r from-[#6366f1] via-[#818cf8] to-[#a855f7] bg-clip-text text-transparent">
              Sync
            </span>
          </span>
          {subtext && (
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400 mt-1">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to={to}
        aria-label="MentorSync Home"
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
