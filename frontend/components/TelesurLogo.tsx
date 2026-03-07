/**
 * Telesur fingerprint / swirl logo as an inline SVG.
 * Matches the branded yellow-circle icon from telesur.sr
 */
export function TelesurLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Telesur logo"
    >
      {/* Yellow circle background */}
      <circle cx="50" cy="50" r="50" fill="#FFD200" />
      {/* Fingerprint / swirl arcs — deep blue */}
      <g fill="none" stroke="#1B0A91" strokeWidth="4.5" strokeLinecap="round">
        {/* Core dot */}
        <circle cx="50" cy="52" r="2" fill="#1B0A91" stroke="none" />
        {/* Inner arcs */}
        <path d="M50 46 A6 6 0 0 1 56 52" />
        <path d="M50 46 A6 6 0 0 0 44 52" />
        {/* Second ring */}
        <path d="M50 39 A13 13 0 0 1 63 52" />
        <path d="M50 39 A13 13 0 0 0 37 52" />
        <path d="M37 52 A13 13 0 0 0 44 63" />
        <path d="M63 52 A13 13 0 0 1 56 63" />
        {/* Third ring */}
        <path d="M50 32 A20 20 0 0 1 70 52" />
        <path d="M50 32 A20 20 0 0 0 30 52" />
        <path d="M30 52 A20 20 0 0 0 40 69" />
        <path d="M70 52 A20 20 0 0 1 60 69" />
        {/* Outer ring */}
        <path d="M50 25 A27 27 0 0 1 77 52" />
        <path d="M50 25 A27 27 0 0 0 23 52" />
        <path d="M23 52 A27 27 0 0 0 36 74" />
        <path d="M77 52 A27 27 0 0 1 64 74" />
      </g>
    </svg>
  );
}
