import { Sidebar } from "@/components/layout/Sidebar";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[rgb(4,9,22)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <TwoFactorPrompt />
    </div>
  );
}