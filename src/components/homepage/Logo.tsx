export function Logo({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vp-logo-gradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        d="M10 15 L45 80 L55 80 L55 65 L25 15 Z"
        fill="url(#vp-logo-gradient)"
      />
      <path
        d="M90 15 L55 80 L55 65 L75 15 Z"
        fill="url(#vp-logo-gradient)"
        opacity="0.55"
      />
    </svg>
  );
}