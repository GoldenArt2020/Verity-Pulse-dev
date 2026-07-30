"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-blue-400" />
        <h1 className="font-display text-lg font-bold text-white">Notifications</h1>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Research complete, trending cases, and competitor alerts will appear here.
      </p>
    </div>
  );
}