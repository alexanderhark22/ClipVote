export default function Logo({ size = 26 }: { size?: number }) {
  // Bespoke editorial mark: a fine-ruled circle (a "vote" coin / lens) with a
  // hairline play triangle — type-led, no tile, no brand art.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="44" stroke="var(--accent)" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="35" stroke="var(--accent)" strokeWidth="0.9" opacity="0.5" />
      <path
        d="M42 35 L67 50 L42 65 Z"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
