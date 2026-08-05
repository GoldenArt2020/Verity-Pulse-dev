export function Logo({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <img
      src="/verity-pulse-icon.png"
      alt="VerityPulse"
      className={`${className} object-contain`}
    />
  );
}