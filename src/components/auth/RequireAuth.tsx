"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[rgb(2,6,23)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-blue-500/40" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}