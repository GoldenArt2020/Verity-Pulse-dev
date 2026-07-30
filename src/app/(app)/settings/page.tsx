"use client";

import { useState } from "react";
import { User, SlidersHorizontal, Bell, CreditCard } from "lucide-react";
import { ProfileSettingsCard } from "@/components/settings/ProfileSettingsCard";
import { SecuritySettingsCard } from "@/components/settings/SecuritySettingsCard";
import { PlatformPreferencesCard } from "@/components/settings/PlatformPreferencesCard";
import { NotificationPreferencesCard } from "@/components/settings/NotificationPreferencesCard";

const TABS = [
  { id: "profile", label: "Profile & Security", icon: User },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Subscription", icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div>
      <div className="border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <h1 className="font-display text-lg font-bold text-white">Settings</h1>
        <p className="text-xs text-slate-500">Manage your account and preferences.</p>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6 flex flex-nowrap gap-1.5 overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/40 p-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <ProfileSettingsCard />
              <SecuritySettingsCard only={["Password"]} />
            </div>
          )}
          {activeTab === "preferences" && <PlatformPreferencesCard />}
          {activeTab === "notifications" && <NotificationPreferencesCard />}
          {activeTab === "billing" && (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              Billing management coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}