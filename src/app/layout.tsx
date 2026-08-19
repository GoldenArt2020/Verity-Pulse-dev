import { Suspense } from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { DesktopTopBar } from "@/components/layout/DesktopTopBar";
import { OnboardingGate } from "@/components/layout/OnboardingGate";

// Everything under this layout is a private, authenticated workspace —
// case research, angles, and scripts that should never be crawled or
// indexed, regardless of what robots.txt says (robots.txt only asks
// crawlers not to visit; this actively tells them not to index anything
// that does get reached via some other link).
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopBar />
        <DesktopTopBar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={null}>
            <OnboardingGate>{children}</OnboardingGate>
          </Suspense>
        </main>
      </div>
      <TwoFactorPrompt />
    </div>
  );
}