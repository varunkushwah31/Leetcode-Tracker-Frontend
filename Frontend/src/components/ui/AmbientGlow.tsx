interface AmbientGlowProps {
  className?: string;
  variant?: 'top' | 'center' | 'subtle';
}

export function AmbientGlow({ className = '', variant = 'top' }: AmbientGlowProps) {
  if (variant === 'center') {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
        {/* Core Radiance */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,79,255,0.25)_0%,rgba(124,58,237,0.14)_40%,rgba(59,130,246,0.05)_70%,transparent_100%)] blur-[90px] animate-pulse-slow" />
        {/* Secondary Wide Wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0%,rgba(79,70,229,0.06)_50%,transparent_80%)] blur-[120px]" />
      </div>
    );
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Top Horizon Accent Beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-linear-to-r from-transparent via-[#968fff]/50 to-transparent blur-[0.5px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-1 bg-linear-to-r from-transparent via-[#5b4fff]/40 to-transparent blur-[6px]" />

      {/* Primary Luminous Aurora */}
      <div className="absolute -top-28 sm:-top-40 left-1/2 -translate-x-1/2 w-[750px] sm:w-[1050px] h-[400px] sm:h-[500px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(91,79,255,0.28)_0%,rgba(124,58,237,0.16)_35%,rgba(59,130,246,0.06)_65%,transparent_80%)] blur-[80px] sm:blur-[100px] animate-pulse-slow" />

      {/* Secondary Wide Dispersion Glow */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1000px] sm:w-[1300px] h-[480px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.14)_0%,rgba(79,70,229,0.07)_50%,transparent_75%)] blur-[120px]" />
    </div>
  );
}
