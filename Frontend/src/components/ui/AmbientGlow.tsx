interface AmbientGlowProps {
  className?: string;
  variant?: 'top' | 'center' | 'subtle';
}

export function AmbientGlow({ className = '', variant = 'top' }: Readonly<AmbientGlowProps>) {
  if (variant === 'center') {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden contain-strict ${className}`} aria-hidden="true">
        {/* Core Radiance */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-137.5 h-137.5 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,79,255,0.22)_0%,rgba(124,58,237,0.12)_35%,rgba(59,130,246,0.04)_65%,transparent_90%)] blur-2xl transform-gpu will-change-transform will-change-opacity animate-pulse-slow" />

        {/* Secondary Wide Wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.10)_0%,rgba(79,70,229,0.05)_45%,transparent_80%)] blur-3xl transform-gpu" />
      </div>
    );
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden contain-strict ${className}`} aria-hidden="true">
      {/* Top Horizon Accent Beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-linear-to-r from-transparent via-[#968fff]/50 to-transparent blur-[0.5px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-1 bg-linear-to-r from-transparent via-[#5b4fff]/40 to-transparent blur-[4px]" />

      {/* Primary Luminous Aurora */}
      <div className="absolute -top-28 sm:-top-40 left-1/2 -translate-x-1/2 w-187.5 sm:w-262.5 h-100 sm:h-125 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(91,79,255,0.24)_0%,rgba(124,58,237,0.14)_30%,rgba(59,130,246,0.05)_60%,transparent_85%)] blur-2xl sm:blur-3xl transform-gpu will-change-transform will-change-opacity animate-pulse-slow" />

      {/* Secondary Wide Dispersion Glow */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-250 sm:w-325 h-120 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.10)_0%,rgba(79,70,229,0.05)_45%,transparent_80%)] blur-3xl transform-gpu" />
    </div>
  );
}
