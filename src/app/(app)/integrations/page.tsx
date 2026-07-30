"use client";

import { Plug } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ProviderHealthCard } from "@/components/integrations/ProviderHealthCard";
import { ConnectedAccountsCard as ConnectedAccountsList } from "@/components/profile/ConnectedAccountsCard";
import { useProviderHealth } from "@/hooks/useProviderHealth";

export default function IntegrationsPage() {
  const { providers, loading } = useProviderHealth();

  return (
    <div>
      <TopBar
        title="Integrations"
        subtitle="Manage connected accounts and monitor provider health."
        icon={<Plug className="h-4.5 w-4.5" />}
      />

      <div className="grid grid-cols-2 gap-4 p-6">
        <div className="space-y-4">
          <h3 className="px-1 text-sm font-semibold text-slate-400">Provider Health</h3>
          <div className="grid grid-cols-2 gap-3">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />
                ))
              : providers.map((p) => <ProviderHealthCard key={p.name} {...p} />)}
          </div>
        </div>

        <ConnectedAccountsList />
      </div>
    </div>
  );
}