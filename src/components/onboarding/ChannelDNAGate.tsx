"use client";

import { useEffect, useState } from "react";
import { useChannelId } from "@/hooks/useChannelId";
import { ChannelDNAWizard } from "./ChannelDNAWizard";
import { suggestEditorialDNA, type EditorialDNA } from "@/services/editorialDNA";

/**
 * Wraps the authenticated app. Checks the ACTIVE channel's
 * editorial_dna_completed flag on every load — not just right after a
 * fresh connect — so existing/old clients who connected before this
 * feature shipped get gated exactly the same way a brand-new connection
 * does, without ever being asked to reconnect or losing any existing
 * channel data.
 */
export function ChannelDNAGate({ children }: { children: React.ReactNode }) {
  const { activeChannelRowId, loaded } = useChannelId();
  const [status, setStatus] = useState<"checking" | "needed" | "clear">("checking");
  const [suggestion, setSuggestion] = useState<Partial<EditorialDNA>>({});
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    if (!loaded) return;
    if (!activeChannelRowId) {
      setStatus("clear"); // no channel connected yet — ChannelOnboarding handles that separately
      return;
    }

    fetch(`/api/channel/${activeChannelRowId}/editorial-dna`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to check Channel DNA");
        setChannelName(data.channelName ?? "Your Channel");
        if (data.completed) {
          setStatus("clear");
        } else {
          setSuggestion(suggestEditorialDNA(data.channelName ?? "", "", data.preferredSubjects ?? []));
          setStatus("needed");
        }
      })
      .catch(() => setStatus("clear")); // fail open — never block the app on this check erroring
  }, [loaded, activeChannelRowId]);

  if (status === "needed" && activeChannelRowId) {
    return (
      <ChannelDNAWizard
        channelId={activeChannelRowId}
        channelName={channelName}
        initialSuggestion={suggestion}
        onComplete={() => setStatus("clear")}
      />
    );
  }

  return <>{children}</>;
}