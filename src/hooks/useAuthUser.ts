"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";

export function useAuthUser() {
  const { user, authStatus, signOut } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  return {
    user,
    isAuthenticated: authStatus === "authenticated",
    isLoading: authStatus === "configuring",
    signOut,
  };
}