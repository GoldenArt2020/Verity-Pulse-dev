import { Sidebar } from "@/components/layout/Sidebar";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";
import { MobileTopBar } from "@/components/layout/MobileTopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[rgb(4,9,22)]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <TwoFactorPrompt />
    </div>
  );
}