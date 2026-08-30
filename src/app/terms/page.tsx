import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — VerityPulse",
  description: "The terms governing your use of VerityPulse.",
};

const LAST_UPDATED = "30 August 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-[#A1A1AA]">
      <h1 className="text-[32px] font-bold text-[#FAFAFA]">Terms of Service</h1>
      <p className="mt-2 text-sm text-[#71717A]">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Acceptance</h2>
          <p className="mt-2">
            By creating an account or using VerityPulse, you agree to these terms. If you do not
            agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">The service</h2>
          <p className="mt-2">
            VerityPulse provides research, analysis, and drafting tools for video creators. Output is
            generated automatically and may contain errors or omissions. You are responsible for
            verifying facts before publishing anything derived from the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Your account</h2>
          <p className="mt-2">
            You are responsible for keeping your credentials secure and for activity under your
            account. You must provide accurate registration information and be old enough to enter a
            binding agreement in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Acceptable use</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Do not use the service to produce unlawful, defamatory, or harassing content.</li>
            <li>Do not attempt to access other users&apos; data or circumvent access controls.</li>
            <li>Do not scrape, resell, or redistribute the service or its output as your own product.</li>
            <li>Do not use the service in a way that breaches the YouTube Terms of Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">YouTube API Services</h2>
          <p className="mt-2">
            VerityPulse uses YouTube API Services. Your use of those features is also governed by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              YouTube Terms of Service
            </a>{" "}
            and the{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Google Privacy Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Content ownership</h2>
          <p className="mt-2">
            You retain ownership of the content you create using the service. You grant us the
            limited rights needed to store and process it in order to operate the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Availability and changes</h2>
          <p className="mt-2">
            The service is provided on an &quot;as is&quot; basis, without warranty of
            uninterrupted or error-free operation. We may modify, suspend, or discontinue features,
            and we may update these terms. Continued use after an update constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Limitation of liability</h2>
          <p className="mt-2">
            To the extent permitted by law, VerityPulse is not liable for indirect or consequential
            losses, including lost revenue or reputational harm arising from your use of the service
            or reliance on its output.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Termination</h2>
          <p className="mt-2">
            You may stop using the service and delete your account at any time. We may suspend or
            terminate accounts that breach these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Contact</h2>
          <p className="mt-2">
            Questions about these terms:{" "}
            <span className="text-[#FAFAFA]">[goldenartandmakeovers12@gmail.com]</span>
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-6 border-t border-white/[0.06] pt-6 text-sm">
        <Link href="/privacy" className="text-blue-400 underline">
          Privacy Policy
        </Link>
        <Link href="/" className="text-blue-400 underline">
          Home
        </Link>
      </div>
    </main>
  );
}