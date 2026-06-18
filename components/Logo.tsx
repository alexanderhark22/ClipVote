export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="46" stroke="#ccf23f" strokeWidth="6" />
      <path d="M40 33 L70 50 L40 67 Z" fill="#ccf23f" />
    </svg>
  );
}
