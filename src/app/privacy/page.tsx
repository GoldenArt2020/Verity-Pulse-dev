import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — VerityPulse",
  description: "How VerityPulse collects, uses, and protects your data.",
};

const LAST_UPDATED = "30 August 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-[#A1A1AA]">
      <h1 className="text-[32px] font-bold text-[#FAFAFA]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[#71717A]">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Overview</h2>
          <p className="mt-2">
            VerityPulse helps creators research stories and understand how their channel performs.
            This policy explains what we collect, why, and what control you have over it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account details you provide when registering, such as your email address.</li>
            <li>
              Public YouTube channel data for channels you add, including titles, descriptions, and
              aggregate statistics.
            </li>
            <li>
              Private YouTube Analytics data — views, watch time, click-through rate, retention, and
              audience metrics — but only for channels you explicitly connect and authorise.
            </li>
            <li>Content you create in the app, such as saved cases, angles, and scripts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">YouTube API Services</h2>
          <p className="mt-2">
            VerityPulse uses YouTube API Services. By connecting your channel you agree to be bound
            by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              YouTube Terms of Service
            </a>
            . Google&apos;s handling of your data is described in the{" "}
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
          <p className="mt-2">
            You can revoke VerityPulse&apos;s access to your YouTube data at any time from the{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Google security settings page
            </a>
            . Revoking access stops all further data retrieval.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">How we use your data</h2>
          <p className="mt-2">
            We use your data to operate the service: analysing your channel to generate content
            recommendations, showing you performance metrics, and improving the accuracy of what we
            suggest. We do not sell your data, and we do not use your private analytics data to
            train models offered to other users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Storage and retention</h2>
          <p className="mt-2">
            Data is stored with our infrastructure providers under their security controls. Access
            tokens are stored server-side and never exposed to the browser. We retain your data for
            as long as your account is active. Removing a channel deletes its stored data, and
            deleting your account removes all associated records.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Third-party services</h2>
          <p className="mt-2">
            We rely on third parties for authentication, hosting, data storage, and AI processing.
            These providers process data only as needed to deliver the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Your rights</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your personal data. Contact us
            using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Contact</h2>
          <p className="mt-2">
            Questions about this policy: <span className="text-[#FAFAFA]">[goldenartandmkaovers12@gmail.com]</span>
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-6 border-t border-white/[0.06] pt-6 text-sm">
        <Link href="/terms" className="text-blue-400 underline">
          Terms of Service
        </Link>
        <Link href="/" className="text-blue-400 underline">
          Home
        </Link>
      </div>
    </main>
  );
}