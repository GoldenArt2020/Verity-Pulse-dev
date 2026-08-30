import Link from "next/link";

/** Shared privacy/terms links. Google's OAuth reviewers check these are
 *  reachable from the app itself, not just from the consent screen. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-5 text-xs text-[#71717A] ${className}`}>
      <Link href="/privacy" className="transition-colors hover:text-[#A1A1AA]">
        Privacy Policy
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms" className="transition-colors hover:text-[#A1A1AA]">
        Terms of Service
      </Link>
    </div>
  );
}