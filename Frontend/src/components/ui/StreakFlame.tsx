import { useId } from 'react';

interface StreakFlameProps {
    className?: string;
    size?: number | string;
    animated?: boolean;
}

export function StreakFlame({
    className = 'w-4 h-4',
    size,
    animated = true,
}: StreakFlameProps) {
    const id = useId();
    const outerGradId = `flame-outer-${id}`;
    const innerGradId = `flame-inner-${id}`;
    const coreGradId = `flame-core-${id}`;

    const style = size
        ? {
              width: typeof size === 'number' ? `${size}px` : size,
              height: typeof size === 'number' ? `${size}px` : size,
          }
        : undefined;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className={`${className} ${animated ? 'animate-flame' : ''} shrink-0 overflow-visible`}
            style={style}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={outerGradId} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="45%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id={innerGradId} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="55%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id={coreGradId} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                </linearGradient>
            </defs>

            {/* Outer Dancing Flame Silhouette */}
            <path
                d="M143.38,17.85a8,8,0,0,0-12.63,3.41l-22,60.41L84.59,58.26a8,8,0,0,0-11.93.89C51,87.53,40,116.08,40,144a88,88,0,0,0,176,0C216,84.55,165.21,36,143.38,17.85Z"
                fill={`url(#${outerGradId})`}
            />

            {/* Inner Glowing Ember */}
            <path
                d="M128,102c-15,22-26,42-26,62a26,26,0,0,0,52,0C154,144,143,124,128,102Z"
                fill={`url(#${innerGradId})`}
            />

            {/* Bright Core Tongue */}
            <path
                d="M128,136c-7,11-13,20-13,29a13,13,0,0,0,26,0C141,156,135,147,128,136Z"
                fill={`url(#${coreGradId})`}
            />
        </svg>
    );
}
