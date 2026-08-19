import Image from "next/image";

export function Logo({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <Image
      src="/verity-pulse-icon.png"
      alt="VerityPulse"
      width={64}
      height={64}
      className={`${className} object-contain`}
    />
  );
}