interface LogoProps {
  className?: string;
  monochrome?: boolean;
}

/**
 * BorderLess logomark — a "B" whose bowls are two flight arcs.
 * Flat two-tone (violet + blue), hard edges, no gradient fills.
 */
export function Logo({ className, monochrome = false }: LogoProps) {
  const top = monochrome ? "currentColor" : "#8B5CF6";
  const bot = monochrome ? "currentColor" : "#3B82F6";
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-label="BorderLess"
      role="img"
      fill="none"
    >
      {/* Vertical stem */}
      <rect x="6" y="4" width="2.4" height="24" fill={monochrome ? "currentColor" : "#FFFFFF"} />
      {/* Top arc — flight trajectory forming upper bowl */}
      <path
        d="M8.4 5 C 20 5, 26 9, 26 12.5 C 26 15.4, 20.5 16.4, 8.4 16.4"
        stroke={top}
        strokeWidth="2.6"
        strokeLinecap="square"
      />
      {/* Bottom arc — flight trajectory forming lower bowl */}
      <path
        d="M8.4 15.6 C 22 15.6, 28 19.6, 28 23.4 C 28 26.6, 22 27.6, 8.4 27.6"
        stroke={bot}
        strokeWidth="2.6"
        strokeLinecap="square"
      />
      {/* Destination pin at tip of top arc */}
      <circle cx="26" cy="12.5" r="1.6" fill={top} />
      <circle cx="26" cy="12.5" r="3" stroke={top} strokeOpacity="0.35" strokeWidth="0.7" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Logo className="h-6 w-6" />
      <span className="font-display text-base tracking-tight">
        <span className="font-bold text-foreground">Border</span>
        <span className="font-light italic text-[#3B82F6]">less</span>
      </span>
    </div>
  );
}
