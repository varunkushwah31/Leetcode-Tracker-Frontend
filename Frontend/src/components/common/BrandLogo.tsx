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
 * Modern geometric Brand Icon for MentorSync matching the official favicon.
 * Features three parallel slanted pill bars symbolizing progress, synchronization, and telemetry.
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  className = '',
  withGlow = true,
}) => {
  const reactId = useId();
  const cleanId = reactId.replace(/[^a-zA-Z0-9]/g, '');
  const barGradId = `ms-bar-grad-${cleanId}`;
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
        className="w-full h-full select-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={barGradId} x1="14" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b4aeff" />
            <stop offset="100%" stopColor="#968fff" />
          </linearGradient>

          {withGlow && (
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#968fff" floodOpacity="0.45" />
            </filter>
          )}
        </defs>

        <g filter={withGlow ? `url(#${glowFilterId})` : undefined}>
          <path
            d="M 14.5 16.5 L 21.5 47.5"
            stroke={`url(#${barGradId})`}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d="M 28.5 16.5 L 35.5 47.5"
            stroke={`url(#${barGradId})`}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d="M 42.5 16.5 L 49.5 47.5"
            stroke={`url(#${barGradId})`}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
        </g>
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
            MentorSync
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
