"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // The recovery route already established a session; without one, this page was
  // opened directly and there's nothing to update.
  useEffect(() => {
    if (linkError) {
      setChecking(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setChecking(false);
    });
  }, [linkError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Password updated.");
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return <div className="h-40 w-full animate-pulse rounded-2xl bg-slate-800/40" />;
  }

  if (linkError || !hasSession) {
    return (
      <>
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <h1 className="mt-4 font-display text-3xl font-bold text-white">Link not valid</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {linkError ?? "This password reset link has expired or has already been used."}
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-blue-400 underline hover:text-blue-300"
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Set New Password</h1>
      <p className="mt-2 text-sm text-slate-400">
        Choose something you haven&apos;t used elsewhere.
      </p>

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 pl-11 pr-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 pl-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
        </div>

        <p className="text-xs text-slate-500">At least {MIN_PASSWORD_LENGTH} characters.</p>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-base font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-4">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-400/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card relative z-10 w-full max-w-md rounded-[20px] p-10 shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
      >
        {/* useSearchParams needs a Suspense boundary above it to avoid bailing
            out of static prerendering at build time. */}
        <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-slate-800/40" />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}