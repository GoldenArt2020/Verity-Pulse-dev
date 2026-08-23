import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { DesktopTopBar } from "@/components/layout/DesktopTopBar";
import { OnboardingGate } from "@/components/layout/OnboardingGate";
import { ChannelDNAGate } from "@/components/onboarding/ChannelDNAGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChannelDNAGate>
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
    </ChannelDNAGate>
  );
}